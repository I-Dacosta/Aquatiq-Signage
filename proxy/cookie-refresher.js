import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const COOKIES_PATH = process.env.YOUTUBE_COOKIES_FILE || '/app/youtube-cookies.txt';
const YOUTUBE_EMAIL = process.env.YOUTUBE_EMAIL;
const YOUTUBE_PASSWORD = process.env.YOUTUBE_PASSWORD;

/**
 * Convert Puppeteer cookies to Netscape format
 */
function convertToNetscape(cookies) {
  return cookies.map(cookie => {
    const domain = cookie.domain.startsWith('.') ? cookie.domain : '.' + cookie.domain;
    const flag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = cookie.path || '/';
    const secure = cookie.secure ? 'TRUE' : 'FALSE';
    const expiration = Math.floor(cookie.expires || 0);
    const name = cookie.name;
    const value = cookie.value;
    
    return `${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${name}\t${value}`;
  }).join('\n');
}

/**
 * Refresh YouTube cookies by logging in with Puppeteer
 */
export async function refreshCookies() {
  if (!YOUTUBE_EMAIL || !YOUTUBE_PASSWORD) {
    console.log('⚠️  YouTube credentials not configured. Skipping automatic refresh.');
    console.log('   Set YOUTUBE_EMAIL and YOUTUBE_PASSWORD environment variables to enable.');
    return { success: false, error: 'Credentials not configured' };
  }

  console.log('🔄 Starting automatic cookie refresh...');
  
  let browser;
  try {
    // Launch browser with stealth plugin (more stable than Chromium in Docker)
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Add extra headers to avoid detection
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
    
    console.log('📱 Navigating to Google Sign In...');
    // Navigate directly to Google accounts signin page (more reliable)
    await page.goto('https://accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop&hl=en&service=youtube', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Take screenshot for debugging
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: '/tmp/youtube-login-1.png' }).catch(() => {});
    
    // Enter email
    console.log('📧 Entering email...');
    await page.waitForSelector('#identifierId', { timeout: 30000 });
    await page.type('#identifierId', YOUTUBE_EMAIL, { delay: 100 });
    
    // Click Next and wait for password field
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      }),
      page.keyboard.press('Enter')
    ]);
    
    await page.screenshot({ path: '/tmp/youtube-login-2.png' }).catch(() => {});
    
    // Enter password
    console.log('🔑 Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.type('input[type="password"]', YOUTUBE_PASSWORD, { delay: 100 });
    
    // Click Next and wait for login to complete
    console.log('⏳ Waiting for login...');
    await Promise.all([
      page.waitForNavigation({ 
        waitUntil: 'domcontentloaded', 
        timeout: 90000 
      }),
      page.keyboard.press('Enter')
    ]);
    
    await page.screenshot({ path: '/tmp/youtube-login-3.png' }).catch(() => {});
    
    // Verify we're logged in by checking for user avatar
    await page.waitForSelector('button[aria-label*="Google Account"], yt-icon-button#avatar-btn', { timeout: 30000 });
    
    console.log('✅ Login successful!');
    
    // Get all cookies
    const cookies = await page.cookies();
    
    // Filter YouTube cookies
    const youtubeCookies = cookies.filter(c => 
      c.domain.includes('youtube.com') || c.domain.includes('google.com')
    );
    
    if (youtubeCookies.length === 0) {
      throw new Error('No YouTube cookies found after login');
    }
    
    // Convert to Netscape format
    const netscapeFormat = convertToNetscape(youtubeCookies);
    
    // Save to file
    const dir = path.dirname(COOKIES_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(COOKIES_PATH, netscapeFormat);
    
    console.log(`✅ Saved ${youtubeCookies.length} cookies to ${COOKIES_PATH}`);
    
    await browser.close();
    
    return { 
      success: true, 
      message: `Refreshed ${youtubeCookies.length} cookies`,
      count: youtubeCookies.length
    };
    
  } catch (error) {
    console.error('❌ Cookie refresh failed:', error.message);
    console.error('Error details:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError.message);
      }
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Check if cookies need refresh (older than 12 hours)
 */
export function needsRefresh() {
  if (!fs.existsSync(COOKIES_PATH)) {
    return true;
  }
  
  const stats = fs.statSync(COOKIES_PATH);
  const ageMinutes = (Date.now() - stats.mtime.getTime()) / 1000 / 60;
  const ageHours = ageMinutes / 60;
  
  return ageHours > 12; // Refresh every 12 hours
}

/**
 * Start automatic refresh cron job
 */
export function startAutoRefresh() {
  if (!YOUTUBE_EMAIL || !YOUTUBE_PASSWORD) {
    console.log('⚠️  Automatic cookie refresh disabled (credentials not configured)');
    return;
  }
  
  console.log('🤖 Starting automatic cookie refresh service...');
  console.log('📅 Cookies will be refreshed every 12 hours');
  
  // Run immediately if cookies are old or missing
  if (needsRefresh()) {
    console.log('🔄 Initial refresh needed...');
    refreshCookies();
  }
  
  // Schedule refresh every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('⏰ Scheduled cookie refresh triggered');
    await refreshCookies();
  });
  
  console.log('✅ Automatic refresh service started');
}
