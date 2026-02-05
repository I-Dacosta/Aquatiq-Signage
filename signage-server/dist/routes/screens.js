"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupScreenRoutes = setupScreenRoutes;
const index_1 = require("../index");
const uuid_1 = require("uuid");
function setupScreenRoutes(app) {
    // List all screens
    app.get('/api/screens', async (req, res) => {
        try {
            const result = await index_1.pool.query(`
        SELECT 
          s.*,
          c.name as current_content_name,
          c.type as current_content_type,
          c.url as current_content_url
        FROM screens s
        LEFT JOIN content c ON s.current_content_id = c.id
        ORDER BY s.name ASC
      `);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching screens:', error);
            // Return mock data in development mode when database is unavailable
            if (process.env.NODE_ENV === 'development') {
                console.log('📋 Returning mock screens data (database unavailable)');
                return res.json([
                    {
                        id: '1',
                        name: 'Main Display',
                        location: 'Reception',
                        mac_address: '00:11:22:33:44:55',
                        ip_address: '192.168.1.100',
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        name: 'Conference Room',
                        location: 'Building A',
                        mac_address: '00:11:22:33:44:56',
                        ip_address: '192.168.1.101',
                        created_at: new Date().toISOString(),
                    },
                ]);
            }
            res.status(500).json({ error: 'Failed to fetch screens' });
        }
    });
    // Get single screen
    app.get('/api/screens/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await index_1.pool.query(`
        SELECT 
          s.*,
          c.name as current_content_name,
          c.type as current_content_type,
          c.url as current_content_url
        FROM screens s
        LEFT JOIN content c ON s.current_content_id = c.id
        WHERE s.id = $1
      `, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Screen not found' });
            }
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Error fetching screen:', error);
            res.status(500).json({ error: 'Failed to fetch screen' });
        }
    });
    // Create screen
    app.post('/api/screens', async (req, res) => {
        const { name, location, macAddress, groupName, metadata } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        try {
            const id = (0, uuid_1.v4)();
            const result = await index_1.pool.query(`
        INSERT INTO screens (id, name, location, mac_address, group_name, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [id, name, location, macAddress, groupName, JSON.stringify(metadata || {})]);
            const screen = result.rows[0];
            (0, index_1.broadcastUpdate)({ type: 'screen_created', screen });
            res.status(201).json(screen);
        }
        catch (error) {
            console.error('Error creating screen:', error);
            res.status(500).json({ error: 'Failed to create screen' });
        }
    });
    // Update screen
    app.put('/api/screens/:id', async (req, res) => {
        const { id } = req.params;
        const { name, location, macAddress, groupName, metadata } = req.body;
        try {
            const result = await index_1.pool.query(`
        UPDATE screens
        SET name = COALESCE($2, name),
            location = COALESCE($3, location),
            mac_address = COALESCE($4, mac_address),
            group_name = COALESCE($5, group_name),
            metadata = COALESCE($6, metadata)
        WHERE id = $1
        RETURNING *
      `, [id, name, location, macAddress, groupName, metadata ? JSON.stringify(metadata) : null]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Screen not found' });
            }
            const screen = result.rows[0];
            (0, index_1.broadcastUpdate)({ type: 'screen_updated', screen });
            res.json(screen);
        }
        catch (error) {
            console.error('Error updating screen:', error);
            res.status(500).json({ error: 'Failed to update screen' });
        }
    });
    // Delete screen
    app.delete('/api/screens/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await index_1.pool.query('DELETE FROM screens WHERE id = $1 RETURNING id', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Screen not found' });
            }
            (0, index_1.broadcastUpdate)({ type: 'screen_deleted', screenId: id });
            res.json({ success: true, id });
        }
        catch (error) {
            console.error('Error deleting screen:', error);
            res.status(500).json({ error: 'Failed to delete screen' });
        }
    });
    // Get screen status logs
    app.get('/api/screens/:id/logs', async (req, res) => {
        const { id } = req.params;
        const { limit = '100' } = req.query;
        try {
            const result = await index_1.pool.query(`
        SELECT 
          sl.*,
          c.name as content_name,
          c.url as content_url
        FROM screen_status_logs sl
        LEFT JOIN content c ON sl.content_id = c.id
        WHERE sl.screen_id = $1
        ORDER BY sl.created_at DESC
        LIMIT $2
      `, [id, limit]);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching screen logs:', error);
            res.status(500).json({ error: 'Failed to fetch screen logs' });
        }
    });
}
