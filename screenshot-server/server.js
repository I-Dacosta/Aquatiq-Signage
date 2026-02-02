const express = require('express');
const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.SCREENSHOT_PORT || 3003;
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'prioai-postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'prioai',
  user: process.env.DB_USER || 'prioai',
  password: process.env.DB_PASSWORD || 'your_secure_password',
});

// Middleware
app.use(cors());
app.use(express.json());

// Ensure screenshots directory exists
async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    console.log('📁 Screenshots directory ready:', SCREENSHOTS_DIR);
  } catch (error) {
    console.error('Error creating screenshots directory:', error);
  }
}

// Browser instance (reuse for performance)
let browser = null;

// Interactive sessions map: token -> { browser, page, wsEndpoint }
const sessions = new Map();

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    console.log('🌐 Browser launched');
  }
  return browser;
}

// Clean up old screenshots (older than 5 minutes)
async function cleanupOldScreenshots() {
  try {
  const files = await fs.readdir(SCREENSHOTS_DIR);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    let deletedCount = 0;
    for (const file of files) {
      if (!file.endsWith('.png')) continue;
      
      const filePath = path.join(SCREENSHOTS_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${deletedCount} old screenshots`);
    }
  } catch (error) {
    console.error('Error cleaning up screenshots:', error);
  }
}

// Take screenshot of a URL
async function takeScreenshot(url, screenshotId, cookies = null, width = 1920, height = 1080) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set viewport to requested dimensions
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 1
    });

    // If cookies provided, set them
    if (cookies) {
      let parsedCookies = cookies;
      if (typeof parsedCookies === 'string') {
        try {
          parsedCookies = JSON.parse(parsedCookies);
        } catch (error) {
          console.warn('⚠️  Failed to parse cookies JSON, continuing without cookies');
          parsedCookies = null;
        }
      }

      if (parsedCookies && Array.isArray(parsedCookies) && parsedCookies.length > 0) {
        await page.setCookie(...parsedCookies);
      }
    }
    
    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    const filename = `${screenshotId}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: false // Only visible viewport
    });
    
    console.log(`📸 Screenshot taken: ${filename} (${width}x${height})`);
    return filename;
    
  } catch (error) {
    console.error(`Error taking screenshot for ${url}:`, error.message);
    throw error;
  } finally {
    await page.close();
  }
}

// Capture screenshots for all active screenshot pages
async function captureAllScreenshots() {
  try {
    const result = await pool.query(
      `SELECT id, url, cookies FROM screenshot_pages WHERE active = true`
    );
    
    console.log(`🔄 Capturing ${result.rows.length} screenshots...`);
    
    for (const page of result.rows) {
      try {
        await takeScreenshot(page.url, page.id, page.cookies);
        
        // Update last_captured timestamp
        await pool.query(
          `UPDATE screenshot_pages SET last_captured = NOW() WHERE id = $1`,
          [page.id]
        );
      } catch (error) {
        console.error(`Failed to capture screenshot for ${page.id}:`, error.message);
      }
    }
    
    // Cleanup old screenshots after capturing new ones
    await cleanupOldScreenshots();
    
  } catch (error) {
    console.error('Error in captureAllScreenshots:', error);
  }
}

// API Routes

// Get all screenshot pages
app.get('/api/screenshots', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, url, public_token, refresh_interval, active, 
              created_at, updated_at, last_captured
       FROM screenshot_pages 
       ORDER BY created_at DESC`
    );
    
    res.json({ screenshots: result.rows });
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({ error: 'Failed to fetch screenshots' });
  }
});

// Create new screenshot page
app.post('/api/screenshots', async (req, res) => {
  const { title, description, url, cookies, width, height } = req.body;
  
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }
  
  try {
    const id = uuidv4();
    const publicToken = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO screenshot_pages 
       (id, title, description, url, public_token, cookies, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING *`,
      [id, title, description || '', url, publicToken, cookies ? JSON.stringify(cookies) : null]
    );
    
    // Take initial screenshot immediately with requested dimensions
    try {
      await takeScreenshot(url, id, cookies, width || 1920, height || 1080);
      await pool.query(
        `UPDATE screenshot_pages SET last_captured = NOW() WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('Error taking initial screenshot:', error);
    }
    
    const displayUrl = `${process.env.SCREENSHOT_BASE_URL || 'https://signage.sensilist.com'}/screenshot/${publicToken}`;
    
    res.status(201).json({
      screenshot: result.rows[0],
      displayUrl
    });
  } catch (error) {
    console.error('Error creating screenshot page:', error);
    res.status(500).json({ error: 'Failed to create screenshot page' });
  }
});

// Simple capture endpoint for pages table (used by pages-server)
app.post('/api/capture/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { url, cookies, width, height } = req.body;
    
    if (!token || !url) {
      return res.status(400).json({ error: 'Token and URL are required' });
    }
    
    console.log(`📸 Capturing screenshot for token: ${token}`);
    
    // Take screenshot and save with token as filename
    await takeScreenshot(
      url, 
      token, // Use token as the screenshot ID
      cookies, 
      width || 1920, 
      height || 1080
    );
    
    console.log(`✅ Screenshot saved: ${token}.png`);
    
    res.json({ 
      success: true,
      message: 'Screenshot captured',
      screenshotUrl: `/api/screenshots/${token}`
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({ error: 'Failed to capture screenshot', details: error.message });
  }
});

// Serve screenshot by token (used by pages-server proxy)
app.get('/api/screenshots/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${token}.png`);
    
    // Check if screenshot exists
    try {
      await fs.access(screenshotPath);
      const stats = await fs.stat(screenshotPath);
      console.log(`📤 Serving screenshot for token=${token} file=${screenshotPath} size=${stats.size} mtime=${new Date(stats.mtimeMs).toISOString()}`);
      // Helpful caching headers for proxies/clients
      res.setHeader('Cache-Control', 'public, max-age=0');
      res.setHeader('Last-Modified', new Date(stats.mtimeMs).toUTCString());
      res.sendFile(screenshotPath);
    } catch (error) {
      console.warn(`⚠️ Screenshot not found for token=${token} (path=${screenshotPath})`);
      res.status(404).json({ error: 'Screenshot not found' });
    }
  } catch (error) {
    console.error('Error serving screenshot:', error);
    res.status(500).json({ error: 'Failed to serve screenshot' });
  }
});

// List recent screenshots (token, size, mtime) - helpful for admin UI
app.get('/api/screenshots/recent', async (req, res) => {
  try {
    const files = await fs.readdir(SCREENSHOTS_DIR);
    const items = [];
    for (const file of files) {
      if (!file.endsWith('.png')) continue;
      const token = file.replace(/\.png$/i, '');
      const filePath = path.join(SCREENSHOTS_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        items.push({
          token,
          filename: file,
          size: stats.size,
          mtime: stats.mtimeMs,
          url: `/api/screenshots/${token}`
        });
      } catch (e) {
        // skip unreadable files
      }
    }
    // sort by mtime desc
    items.sort((a, b) => b.mtime - a.mtime);
    res.json({ screenshots: items });
  } catch (error) {
    console.error('Error listing recent screenshots:', error);
    res.status(500).json({ error: 'Failed to list screenshots' });
  }
});

// Get single screenshot page
app.get('/api/screenshots/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM screenshot_pages WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot page not found' });
    }
    
    res.json({ screenshot: result.rows[0] });
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).json({ error: 'Failed to fetch screenshot' });
  }
});

// Update screenshot page
app.put('/api/screenshots/:id', async (req, res) => {
  const { title, description, url, cookies, active } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE screenshot_pages 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           url = COALESCE($3, url),
           cookies = COALESCE($4, cookies),
           active = COALESCE($5, active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, url, cookies ? JSON.stringify(cookies) : null, active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot page not found' });
    }
    
    res.json({ screenshot: result.rows[0] });
  } catch (error) {
    console.error('Error updating screenshot:', error);
    res.status(500).json({ error: 'Failed to update screenshot' });
  }
});

// Delete screenshot page
app.delete('/api/screenshots/:id', async (req, res) => {
  try {
    // Delete screenshot file
    try {
      const filepath = path.join(SCREENSHOTS_DIR, `${req.params.id}.png`);
      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist, that's ok
    }
    
    const result = await pool.query(
      `DELETE FROM screenshot_pages WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot page not found' });
    }
    
    res.json({ message: 'Screenshot page deleted', screenshot: result.rows[0] });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500).json({ error: 'Failed to delete screenshot' });
  }
});

// Force capture screenshot for specific page
app.post('/api/screenshots/:id/capture', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, url, cookies FROM screenshot_pages WHERE id = $1 AND active = true`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Screenshot page not found or inactive' });
    }
    
    const page = result.rows[0];
    await takeScreenshot(page.url, page.id, page.cookies);
    
    await pool.query(
      `UPDATE screenshot_pages SET last_captured = NOW() WHERE id = $1`,
      [page.id]
    );
    
    res.json({ message: 'Screenshot captured successfully' });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({ error: 'Failed to capture screenshot' });
  }
});

// Display screenshot (public endpoint)
app.get('/screenshot/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, url, refresh_interval FROM screenshot_pages 
       WHERE public_token = $1 AND active = true`,
      [req.params.token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).send('Screenshot not found');
    }
    
    const screenshot = result.rows[0];
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${screenshot.id}.png`);
    
    // Check if screenshot file exists
    try {
      await fs.access(screenshotPath);
    } catch (error) {
      return res.status(404).send('Screenshot image not yet available. Please wait a moment.');
    }
    
    // Serve HTML that displays the screenshot and auto-refreshes
    const refreshInterval = screenshot.refresh_interval || 60;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${screenshot.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: #000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="loading">Loading screenshot...</div>
  <img id="screenshot" style="display: none;" alt="${screenshot.title}">
  
  <script>
    const img = document.getElementById('screenshot');
    const loading = document.querySelector('.loading');
    
    function loadScreenshot() {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      img.src = '/api/screenshot-image/${screenshot.id}?t=' + timestamp;
    }
    
    img.onload = function() {
      loading.style.display = 'none';
      img.style.display = 'block';
    };
    
    img.onerror = function() {
      loading.textContent = 'Failed to load screenshot. Retrying...';
      setTimeout(loadScreenshot, 5000);
    };
    
    // Initial load
    loadScreenshot();
    
    // Refresh every ${refreshInterval} seconds
    setInterval(loadScreenshot, ${refreshInterval * 1000});
  </script>
</body>
</html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error displaying screenshot:', error);
    res.status(500).send('Error displaying screenshot');
  }
});

// Serve screenshot image (public endpoint)
app.get('/api/screenshot-image/:id', async (req, res) => {
  try {
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${req.params.id}.png`);
    
    // Check if file exists
    await fs.access(screenshotPath);
    
    // Set cache headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.sendFile(screenshotPath);
  } catch (error) {
    res.status(404).send('Screenshot not found');
  }
});

// Simple capture endpoint for pages table (used by pages-server)
app.post('/api/capture/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { url, cookies, width, height } = req.body;
    
    if (!token || !url) {
      return res.status(400).json({ error: 'Token and URL are required' });
    }
    
    console.log(`📸 Capturing screenshot for token: ${token}`);
    
    // Take screenshot and save with token as filename
    await takeScreenshot(
      url, 
      token, // Use token as the screenshot ID
      cookies, 
      width || 1920, 
      height || 1080
    );
    
    console.log(`✅ Screenshot saved: ${token}.png`);
    
    res.json({ 
      success: true,
      message: 'Screenshot captured',
      screenshotUrl: `/api/screenshots/${token}`
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({ error: 'Failed to capture screenshot', details: error.message });
  }
});

// Serve screenshot by token (used by pages-server proxy)
app.get('/api/screenshots/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${token}.png`);
    
    // Check if screenshot exists
    try {
      await fs.access(screenshotPath);
      res.sendFile(screenshotPath);
    } catch (error) {
      res.status(404).json({ error: 'Screenshot not found' });
    }
  } catch (error) {
    console.error('Error serving screenshot:', error);
    res.status(500).json({ error: 'Failed to serve screenshot' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'screenshot-server',
    screenshotsDir: SCREENSHOTS_DIR
  });
});

// Start an interactive browser session for a token.
// Useful for manual sign-in: server launches a headful Chrome and returns the WebSocket endpoint.
app.post('/api/session/start/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { url, width, height } = req.body || {};

    if (sessions.has(token)) {
      return res.status(400).json({ error: 'Session already active for this token' });
    }

    // Launch a dedicated browser for this session.
    // Try headful first; if the container lacks an X server, fall back to headless with remote debugging.
    let sessionBrowser;
    try {
      sessionBrowser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=' + ((width || 1280) + ',' + (height || 800))
        ]
      });
    } catch (err) {
      console.warn('Headful launch failed, falling back to headless remote-debugging:', err.message);
      sessionBrowser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--remote-debugging-port=0',
          '--window-size=' + ((width || 1280) + ',' + (height || 800))
        ]
      });
    }

    const wsEndpoint = sessionBrowser.wsEndpoint();
    const page = await sessionBrowser.newPage();

    if (width || height) {
      await page.setViewport({ width: width || 1280, height: height || 800 });
    }

    if (url) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) {
        console.warn('Failed to navigate to url in interactive session:', e.message);
      }
    }

    sessions.set(token, { browser: sessionBrowser, page, wsEndpoint });

    // Extract port from wsEndpoint for SSH tunnelling instructions if possible
    let port = null;
    try {
      const m = wsEndpoint.match(/:\/\/(?:[^:]+):(\d+)\/devtools/);
      if (m) port = parseInt(m[1], 10);
    } catch (e) {}

    res.json({
      message: 'Interactive session started',
      token,
      wsEndpoint,
      sshTunnelHint: port ? `ssh -L 9222:localhost:${port} user@your-server` : undefined,
      note: 'Use the browser WebSocket endpoint above to connect a DevTools frontend. Once signed in and navigated, call /api/session/capture/:token to save the screenshot and cookies.'
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start interactive session', details: error.message });
  }
});

// Stop an interactive session and close the browser
app.post('/api/session/stop/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const session = sessions.get(token);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    try {
      await session.page.close().catch(() => {});
      await session.browser.close().catch(() => {});
    } catch (e) {
      console.warn('Error closing session browser:', e.message);
    }

    sessions.delete(token);
    res.json({ message: 'Session stopped' });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

// Capture a screenshot from an interactive session and persist cookies for future automated captures
app.post('/api/session/capture/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { url, width, height } = req.body || {};

    const session = sessions.get(token);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { page } = session;

    if (url) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) {
        console.warn('Navigation during session capture failed:', e.message);
      }
    }

    if (width || height) {
      await page.setViewport({ width: width || 1920, height: height || 1080 });
    }

    // Small wait to let user finish any dynamic work
    await new Promise(r => setTimeout(r, 1000));

    const filename = `${token}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    await page.screenshot({ path: filepath, fullPage: false });

    // Persist cookies into screenshot_pages.cookies if we can find the page by public_token or id
    try {
      const cookies = await page.cookies();
      // Try find by public_token
      let result = await pool.query(
        `SELECT id FROM screenshot_pages WHERE public_token = $1 LIMIT 1`,
        [token]
      );

      if (result.rows.length === 0) {
        // fallback: try id
        result = await pool.query(
          `SELECT id FROM screenshot_pages WHERE id = $1 LIMIT 1`,
          [token]
        );
      }

      if (result.rows.length > 0) {
        const pageId = result.rows[0].id;
        await pool.query(
          `UPDATE screenshot_pages SET cookies = $1, last_captured = NOW() WHERE id = $2`,
          [JSON.stringify(cookies), pageId]
        );
      }
    } catch (e) {
      console.warn('Failed to persist cookies from session capture:', e.message);
    }

    console.log(`📸 Session capture saved: ${filename}`);
    res.json({ success: true, filename, url: `/api/screenshots/${token}` });
  } catch (error) {
    console.error('Error in session capture:', error);
    res.status(500).json({ error: 'Failed to capture session screenshot', details: error.message });
  }
});

// Initialize and start server
async function start() {
  await ensureScreenshotsDir();
  
  // Scheduling behaviour is controlled by environment variables.
  // By default scheduled captures are DISABLED so screenshots are taken only when triggered
  // (via HTTP endpoints /api/screenshots/:id/capture, /api/capture/:token or session capture).
  const SCHEDULE_ENABLED = process.env.SCREENSHOT_SCHEDULE_ENABLED === 'true';
  const SCHEDULE_CRON = process.env.SCREENSHOT_CRON || '* * * * *';
  const CLEANUP_ENABLED = process.env.SCREENSHOT_CLEANUP_ENABLED !== 'false';
  const CLEANUP_CRON = process.env.SCREENSHOT_CLEANUP_CRON || '*/5 * * * *';

  if (SCHEDULE_ENABLED) {
    cron.schedule(SCHEDULE_CRON, () => {
      console.log('⏰ Running scheduled screenshot capture...');
      captureAllScreenshots();
    });

    // Take initial screenshots on startup (only when scheduling enabled)
    setTimeout(() => {
      console.log('🚀 Taking initial screenshots...');
      captureAllScreenshots();
    }, 5000);
  } else {
    console.log('⏱️ Scheduled screenshot capture DISABLED (set SCREENSHOT_SCHEDULE_ENABLED=true to enable)');
  }

  if (CLEANUP_ENABLED) {
    cron.schedule(CLEANUP_CRON, () => {
      console.log('🧹 Running scheduled cleanup...');
      cleanupOldScreenshots();
    });
  } else {
    console.log('🧹 Scheduled cleanup DISABLED (set SCREENSHOT_CLEANUP_ENABLED=true to enable)');
  }
  
  app.listen(PORT, () => {
    console.log(`📸 Screenshot server running on port ${PORT}`);
  });
}

// Cleanup on exit
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

start().catch(console.error);
