"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupContentRoutes = setupContentRoutes;
const index_1 = require("../index");
const uuid_1 = require("uuid");
function setupContentRoutes(app) {
    // List all content
    app.get('/api/content', async (req, res) => {
        const { type, active } = req.query;
        try {
            let query = 'SELECT * FROM content WHERE 1=1';
            const params = [];
            let paramCount = 1;
            if (type) {
                query += ` AND type = $${paramCount++}`;
                params.push(type);
            }
            if (active !== undefined) {
                query += ` AND is_active = $${paramCount++}`;
                params.push(active === 'true');
            }
            query += ' ORDER BY created_at DESC';
            const result = await index_1.pool.query(query, params);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching content:', error);
            res.status(500).json({ error: 'Failed to fetch content' });
        }
    });
    // Get single content
    app.get('/api/content/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await index_1.pool.query('SELECT * FROM content WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Error fetching content:', error);
            res.status(500).json({ error: 'Failed to fetch content' });
        }
    });
    // Create content
    app.post('/api/content', async (req, res) => {
        const { name, type, url, duration, thumbnailUrl, metadata, isActive } = req.body;
        if (!name || !type || !url) {
            return res.status(400).json({ error: 'Name, type, and URL are required' });
        }
        if (!['url', 'image', 'video', 'feed'].includes(type)) {
            return res.status(400).json({ error: 'Invalid content type' });
        }
        try {
            const id = (0, uuid_1.v4)();
            const result = await index_1.pool.query(`
        INSERT INTO content (id, name, type, url, duration, thumbnail_url, metadata, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [id, name, type, url, duration || 30, thumbnailUrl, JSON.stringify(metadata || {}), isActive !== false]);
            const content = result.rows[0];
            (0, index_1.broadcastUpdate)({ type: 'content_created', content });
            res.status(201).json(content);
        }
        catch (error) {
            console.error('Error creating content:', error);
            res.status(500).json({ error: 'Failed to create content' });
        }
    });
    // Update content
    app.put('/api/content/:id', async (req, res) => {
        const { id } = req.params;
        const { name, type, url, duration, thumbnailUrl, metadata, isActive } = req.body;
        try {
            const result = await index_1.pool.query(`
        UPDATE content
        SET name = COALESCE($2, name),
            type = COALESCE($3, type),
            url = COALESCE($4, url),
            duration = COALESCE($5, duration),
            thumbnail_url = COALESCE($6, thumbnail_url),
            metadata = COALESCE($7, metadata),
            is_active = COALESCE($8, is_active)
        WHERE id = $1
        RETURNING *
      `, [id, name, type, url, duration, thumbnailUrl, metadata ? JSON.stringify(metadata) : null, isActive]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }
            const content = result.rows[0];
            (0, index_1.broadcastUpdate)({ type: 'content_updated', content });
            res.json(content);
        }
        catch (error) {
            console.error('Error updating content:', error);
            res.status(500).json({ error: 'Failed to update content' });
        }
    });
    // Delete content
    app.delete('/api/content/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await index_1.pool.query('DELETE FROM content WHERE id = $1 RETURNING id', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }
            (0, index_1.broadcastUpdate)({ type: 'content_deleted', contentId: id });
            res.json({ success: true, id });
        }
        catch (error) {
            console.error('Error deleting content:', error);
            res.status(500).json({ error: 'Failed to delete content' });
        }
    });
}
