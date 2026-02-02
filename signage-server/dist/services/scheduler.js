"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPlaylist = getCurrentPlaylist;
exports.getPlaylistContent = getPlaylistContent;
async function getCurrentPlaylist(pool, screenId) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 8);
    const currentDate = now.toISOString().split('T')[0];
    try {
        // Find active schedule for this screen at current time
        const result = await pool.query(`
      SELECT playlist_id, priority
      FROM schedules
      WHERE screen_id = $1
      AND is_active = true
      AND (start_date IS NULL OR start_date <= $2)
      AND (end_date IS NULL OR end_date >= $2)
      AND (days_of_week IS NULL OR $3 = ANY(days_of_week))
      AND (start_time IS NULL OR start_time <= $4)
      AND (end_time IS NULL OR end_time >= $4)
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `, [screenId, currentDate, dayOfWeek, currentTime]);
        if (result.rows.length > 0) {
            return result.rows[0].playlist_id;
        }
        // Fallback to default playlist if no schedule matches
        const defaultResult = await pool.query(`
      SELECT id FROM playlists WHERE is_default = true LIMIT 1
    `);
        return defaultResult.rows[0]?.id || null;
    }
    catch (error) {
        console.error('Error getting current playlist:', error);
        return null;
    }
}
async function getPlaylistContent(pool, playlistId) {
    try {
        const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.url,
        COALESCE(pi.duration_override, c.duration) as duration,
        c.thumbnail_url,
        c.metadata,
        pi.order_index
      FROM playlist_items pi
      JOIN content c ON pi.content_id = c.id
      WHERE pi.playlist_id = $1
      AND c.is_active = true
      ORDER BY pi.order_index ASC
    `, [playlistId]);
        return result.rows;
    }
    catch (error) {
        console.error('Error getting playlist content:', error);
        return [];
    }
}
