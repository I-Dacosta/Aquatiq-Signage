"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupShortUrlRoutes = setupShortUrlRoutes;
function setupShortUrlRoutes(app, pool) {
    /**
     * Create short URL for TV setup
     * POST /api/short-url
     *
     * Creates a short, memorable URL for TV setup
     */
    app.post('/api/short-url', async (req, res) => {
        try {
            const { name, location, template = 'office-basic' } = req.body;
            if (!name || !location) {
                return res.status(400).json({
                    error: 'Navn og plassering er påkrevd',
                    message: 'name and location are required'
                });
            }
            // Generate short, memorable ID (6 characters)
            const shortId = generateShortId();
            // Store in database
            await pool.query(`INSERT INTO short_urls (short_id, name, location, template, created_at, expires_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year')`, [shortId, name, location, template]);
            const shortUrl = `${process.env.VIDEO_BASE_URL || 'https://signage.aquatiq.com'}/tv/${shortId}`;
            res.json({
                success: true,
                short_id: shortId,
                short_url: shortUrl,
                full_url: `${process.env.VIDEO_BASE_URL}/player.html?setup=${shortId}&name=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}&template=${template}`
            });
        }
        catch (error) {
            console.error('Short URL creation error:', error);
            res.status(500).json({
                error: 'Kunne ikke opprette kort URL',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Redirect from short URL to player
     * GET /tv/:shortId
     *
     * Redirects to the full player URL with all parameters
     */
    app.get('/tv/:shortId', async (req, res) => {
        try {
            const { shortId } = req.params;
            // Look up short URL in database
            const result = await pool.query(`SELECT name, location, template, expires_at 
         FROM short_urls 
         WHERE short_id = $1`, [shortId]);
            if (result.rows.length === 0) {
                return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="no">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>URL ikke funnet</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .container {
                max-width: 500px;
              }
              h1 {
                font-size: 3rem;
                margin-bottom: 20px;
              }
              p {
                font-size: 1.2rem;
                margin-bottom: 30px;
              }
              a {
                display: inline-block;
                padding: 15px 30px;
                background: white;
                color: #667eea;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: transform 0.2s;
              }
              a:hover {
                transform: translateY(-2px);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌</h1>
              <p>URL ikke funnet eller utløpt</p>
              <a href="/setup.html">Lag ny oppsett-URL</a>
            </div>
          </body>
          </html>
        `);
            }
            const setup = result.rows[0];
            // Check if expired
            if (new Date(setup.expires_at) < new Date()) {
                return res.status(410).send(`
          <!DOCTYPE html>
          <html lang="no">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>URL utløpt</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .container {
                max-width: 500px;
              }
              h1 {
                font-size: 3rem;
                margin-bottom: 20px;
              }
              p {
                font-size: 1.2rem;
                margin-bottom: 30px;
              }
              a {
                display: inline-block;
                padding: 15px 30px;
                background: white;
                color: #667eea;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: transform 0.2s;
              }
              a:hover {
                transform: translateY(-2px);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⏰</h1>
              <p>Denne URL-en har utløpt</p>
              <a href="/setup.html">Lag ny oppsett-URL</a>
            </div>
          </body>
          </html>
        `);
            }
            // Redirect to player with full parameters
            const playerUrl = `/player.html?setup=${shortId}&name=${encodeURIComponent(setup.name)}&location=${encodeURIComponent(setup.location)}&template=${setup.template}`;
            res.redirect(playerUrl);
        }
        catch (error) {
            console.error('Short URL redirect error:', error);
            res.status(500).send('Internal server error');
        }
    });
    /**
     * Get short URL info (for debugging)
     * GET /api/short-url/:shortId
     */
    app.get('/api/short-url/:shortId', async (req, res) => {
        try {
            const { shortId } = req.params;
            const result = await pool.query('SELECT * FROM short_urls WHERE short_id = $1', [shortId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Short URL not found' });
            }
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Short URL info error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
/**
 * Generate a short, memorable 6-character ID
 * Uses only lowercase letters and numbers (no confusing characters like 0/O, 1/l)
 */
function generateShortId() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // Removed confusing chars
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
