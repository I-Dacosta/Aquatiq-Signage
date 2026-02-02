"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPlaylistRoutes = setupPlaylistRoutes;
const index_1 = require("../index");
const uuid_1 = require("uuid");
function setupPlaylistRoutes(app) {
    // List all playlists
    app.get('/api/playlists', async (req, res) => {
        try {
            const result = await index_1.pool.query(`
        SELECT 
          p.*,
          COUNT(pi.id) as item_count
        FROM playlists p
        LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching playlists:', error);
            res.status(500).json({ error: 'Failed to fetch playlists' });
        }
    });
    // Get single playlist with items
    app.get('/api/playlists/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const playlistResult = await index_1.pool.query('SELECT * FROM playlists WHERE id = $1', [id]);
            if (playlistResult.rows.length === 0) {
                return res.status(404).json({ error: 'Playlist not found' });
            }
            const itemsResult = await index_1.pool.query(`
        SELECT 
          pi.*,
          c.name as content_name,
          c.type as content_type,
          c.url as content_url,
          c.duration as content_duration,
          c.thumbnail_url
        FROM playlist_items pi
        JOIN content c ON pi.content_id = c.id
        WHERE pi.playlist_id = $1
        ORDER BY pi.order_index ASC
      `, [id]);
            res.json({
                ...playlistResult.rows[0],
                items: itemsResult.rows
            });
        }
        catch (error) {
            console.error('Error fetching playlist:', error);
            res.status(500).json({ error: 'Failed to fetch playlist' });
        }
    });
    // Create playlist
    app.post('/api/playlists', async (req, res) => {
        const { name, description, isDefault } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        try {
            const id = (0, uuid_1.v4)();
            // If setting as default, unset other defaults
            if (isDefault) {
                await index_1.pool.query('UPDATE playlists SET is_default = false');
            }
            const result = await index_1.pool.query(`
        INSERT INTO playlists (id, name, description, is_default)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [id, name, description, isDefault || false]);
            const playlist = result.rows[0];
            (0, index_1.broadcastUpdate)({ type: 'playlist_created', playlist });
            res.status(201).json(playlist);
        }
        catch (error) {
            console.error('Error creating playlist:', error);
            res.status(500).json({ error: 'Failed to create playlist' });
        }
    });
    // Update playlist
    app.put('/api/playlists/:id', async (req, res) => {
        const { id } = req.params;
        const { name, description, isDefault } = req.body;
        try {
            if (isDefault) {
                await index_1.pool.query('UPDATE playlists SET is_default = false WHERE id != $1', [id]);
            }
            const result = await index_1.pool.query(`
        UPDATE playlists
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            is_default = COALESCE($4, is_default)
        WHERE id = $1
        RETURNING *
      `, [id, name, description, isDefault]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Playlist not found' });
            }
            const playlist = result.rows[0];
            (0, index_1.broadcastUpdate)({ type: 'playlist_updated', playlist });
            res.json(playlist);
        }
        catch (error) {
            console.error('Error updating playlist:', error);
            res.status(500).json({ error: 'Failed to update playlist' });
        }
    });
    // Delete playlist
    app.delete('/api/playlists/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await index_1.pool.query('DELETE FROM playlists WHERE id = $1 RETURNING id', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Playlist not found' });
            }
            (0, index_1.broadcastUpdate)({ type: 'playlist_deleted', playlistId: id });
            res.json({ success: true, id });
        }
        catch (error) {
            console.error('Error deleting playlist:', error);
            res.status(500).json({ error: 'Failed to delete playlist' });
        }
    });
    // Add content to playlist
    app.post('/api/playlists/:id/items', async (req, res) => {
        const { id } = req.params;
        const { contentId, orderIndex, durationOverride } = req.body;
        if (!contentId) {
            return res.status(400).json({ error: 'Content ID is required' });
        }
        try {
            const itemId = (0, uuid_1.v4)();
            // Get max order index if not provided
            let order = orderIndex;
            if (order === undefined) {
                const maxResult = await index_1.pool.query('SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM playlist_items WHERE playlist_id = $1', [id]);
                order = maxResult.rows[0].next_order;
            }
            const result = await index_1.pool.query(`
        INSERT INTO playlist_items (id, playlist_id, content_id, order_index, duration_override)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [itemId, id, contentId, order, durationOverride]);
            (0, index_1.broadcastUpdate)({ type: 'playlist_item_added', playlistId: id, item: result.rows[0] });
            res.status(201).json(result.rows[0]);
        }
        catch (error) {
            console.error('Error adding playlist item:', error);
            res.status(500).json({ error: 'Failed to add playlist item' });
        }
    });
    // Remove content from playlist
    app.delete('/api/playlists/:id/items/:itemId', async (req, res) => {
        const { id, itemId } = req.params;
        try {
            const result = await index_1.pool.query('DELETE FROM playlist_items WHERE id = $1 AND playlist_id = $2 RETURNING id', [itemId, id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Playlist item not found' });
            }
            (0, index_1.broadcastUpdate)({ type: 'playlist_item_removed', playlistId: id, itemId });
            res.json({ success: true, id: itemId });
        }
        catch (error) {
            console.error('Error removing playlist item:', error);
            res.status(500).json({ error: 'Failed to remove playlist item' });
        }
    });
    // Reorder playlist items
    app.put('/api/playlists/:id/reorder', async (req, res) => {
        const { id } = req.params;
        const { items } = req.body; // Array of { id, orderIndex }
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Items array is required' });
        }
        const client = await index_1.pool.connect();
        try {
            await client.query('BEGIN');
            for (const item of items) {
                await client.query('UPDATE playlist_items SET order_index = $1 WHERE id = $2 AND playlist_id = $3', [item.orderIndex, item.id, id]);
            }
            await client.query('COMMIT');
            (0, index_1.broadcastUpdate)({ type: 'playlist_reordered', playlistId: id });
            res.json({ success: true });
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error reordering playlist:', error);
            res.status(500).json({ error: 'Failed to reorder playlist' });
        }
        finally {
            client.release();
        }
    });
}
