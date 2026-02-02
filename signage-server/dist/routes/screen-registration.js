"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupScreenRegistrationRoutes = setupScreenRegistrationRoutes;
function setupScreenRegistrationRoutes(app, pool) {
    /**
     * Auto-register screen endpoint
     * POST /api/screen-api/register
     *
     * Automatically registers a screen with minimal information.
     * If MAC address already exists, returns existing screen.
     * If new, creates screen and optionally applies template.
     */
    app.post('/api/screen-api/register', async (req, res) => {
        try {
            const { mac_address, name = 'Ny Skjerm', location = 'Ukjent', ip_address, template } = req.body;
            if (!mac_address) {
                return res.status(400).json({
                    error: 'MAC address er påkrevd',
                    message: 'mac_address field is required'
                });
            }
            // Check if screen already exists
            const existingScreen = await pool.query('SELECT * FROM screens WHERE mac_address = $1', [mac_address]);
            if (existingScreen.rows.length > 0) {
                // Update existing screen
                const screen = existingScreen.rows[0];
                await pool.query(`UPDATE screens 
           SET is_online = true,
               last_seen = CURRENT_TIMESTAMP,
               ip_address = COALESCE($1, ip_address)
           WHERE id = $2`, [ip_address, screen.id]);
                return res.status(200).json({
                    success: true,
                    screen: {
                        id: screen.id,
                        name: screen.name,
                        location: screen.location,
                        mac_address: screen.mac_address,
                        is_new: false
                    },
                    message: 'Skjerm allerede registrert'
                });
            }
            // Create new screen
            const newScreen = await pool.query(`INSERT INTO screens (
          name, 
          location, 
          mac_address, 
          ip_address,
          is_online,
          last_seen,
          group_name
        )
        VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, $5)
        RETURNING *`, [
                name,
                location,
                mac_address,
                ip_address,
                location // Use location as default group
            ]);
            const screen = newScreen.rows[0];
            // Create default playlist for screen if none exists
            const defaultPlaylist = await pool.query('SELECT id FROM playlists WHERE is_default = true LIMIT 1');
            if (defaultPlaylist.rows.length === 0) {
                // Create a basic default playlist
                await createDefaultPlaylist(pool);
            }
            console.log(`✅ New screen registered: ${screen.name} (${mac_address})`);
            res.status(201).json({
                success: true,
                screen: {
                    id: screen.id,
                    name: screen.name,
                    location: screen.location,
                    mac_address: screen.mac_address,
                    is_new: true
                },
                message: 'Skjerm registrert',
                next_steps: [
                    'Legg til innhold i Content-biblioteket',
                    'Opprett en spilleliste',
                    'Tildel spilleliste til skjermen',
                    'Eller bruk en ferdig mal'
                ]
            });
        }
        catch (error) {
            console.error('Screen registration error:', error);
            res.status(500).json({
                error: 'Kunne ikke registrere skjerm',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Get setup info endpoint
     * GET /api/screen-api/setup/:setupId
     *
     * Returns setup information for a setup ID
     */
    app.get('/api/screen-api/setup/:setupId', async (req, res) => {
        try {
            const { setupId } = req.params;
            res.json({
                setup_id: setupId,
                server_url: process.env.VIDEO_BASE_URL || 'https://signage.aquatiq.com',
                instructions: [
                    '1. Skjermen vil automatisk registrere seg ved første tilkobling',
                    '2. Sørg for at skjermen har internett-tilgang',
                    '3. Start URL Launcher med den genererte URL-en',
                    '4. Skjermen vil vises i administrasjonspanelet innen 1 minutt'
                ]
            });
        }
        catch (error) {
            console.error('Setup info error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
/**
 * Create a default playlist with basic content
 */
async function createDefaultPlaylist(pool) {
    try {
        // Create default playlist
        const playlist = await pool.query(`INSERT INTO playlists (name, description, is_default)
       VALUES ('Standard Spilleliste', 'Automatisk opprettet standard spilleliste', true)
       RETURNING id`);
        const playlistId = playlist.rows[0].id;
        // Create welcome content
        const welcomeContent = await pool.query(`INSERT INTO content (name, type, url, duration, is_active)
       VALUES ('Velkommen', 'url', $1, 10, true)
       RETURNING id`, [`${process.env.VIDEO_BASE_URL || 'https://signage.aquatiq.com'}/offline.html`]);
        // Add content to playlist
        await pool.query(`INSERT INTO playlist_items (playlist_id, content_id, order_index)
       VALUES ($1, $2, 1)`, [playlistId, welcomeContent.rows[0].id]);
        console.log('✅ Default playlist created');
    }
    catch (error) {
        console.error('Error creating default playlist:', error);
        throw error;
    }
}
