"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOfflineScreens = checkOfflineScreens;
exports.logScreenStatus = logScreenStatus;
const index_1 = require("../index");
const OFFLINE_THRESHOLD = 60000; // 60 seconds
async function checkOfflineScreens(pool) {
    try {
        const result = await pool.query(`
      UPDATE screens
      SET is_online = false
      WHERE is_online = true
      AND last_seen < NOW() - INTERVAL '60 seconds'
      RETURNING id, name
    `);
        if (result.rows.length > 0) {
            console.log(`Marked ${result.rows.length} screens as offline`);
            result.rows.forEach(screen => {
                (0, index_1.broadcastUpdate)({
                    type: 'screen_offline',
                    screenId: screen.id,
                    screenName: screen.name,
                    timestamp: new Date().toISOString()
                });
            });
        }
    }
    catch (error) {
        console.error('Error checking offline screens:', error);
    }
}
async function logScreenStatus(pool, screenId, status, contentId, errorMessage) {
    try {
        await pool.query(`
      INSERT INTO screen_status_logs (screen_id, status, content_id, error_message)
      VALUES ($1, $2, $3, $4)
    `, [screenId, status, contentId, errorMessage]);
    }
    catch (error) {
        console.error('Error logging screen status:', error);
    }
}
