"use strict";
/**
 * Schedule Conflict Resolution
 * Priority-based algorithm for resolving overlapping schedules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIORITY_LEVELS = void 0;
exports.resolveScheduleConflicts = resolveScheduleConflicts;
exports.getCurrentSchedule = getCurrentSchedule;
exports.getActivePlaylist = getActivePlaylist;
exports.getPriorityDescription = getPriorityDescription;
/**
 * Resolve schedule conflicts for a screen at a specific time
 * Returns the highest priority applicable schedule
 */
function resolveScheduleConflicts(schedules, currentTime = new Date()) {
    // Filter applicable schedules
    const applicable = schedules.filter(schedule => {
        if (!schedule.is_active) {
            return false;
        }
        // Check date range
        const now = currentTime.toISOString().split('T')[0];
        if (schedule.start_date && now < schedule.start_date) {
            return false;
        }
        if (schedule.end_date && now > schedule.end_date) {
            return false;
        }
        // Check day of week (0=Sunday, 6=Saturday)
        const dayOfWeek = currentTime.getDay();
        if (schedule.days_of_week && schedule.days_of_week.length > 0) {
            if (!schedule.days_of_week.includes(dayOfWeek)) {
                return false;
            }
        }
        // Check time range
        const currentTimeStr = currentTime.toTimeString().slice(0, 8);
        if (schedule.start_time && currentTimeStr < schedule.start_time) {
            return false;
        }
        if (schedule.end_time && currentTimeStr > schedule.end_time) {
            return false;
        }
        return true;
    });
    if (applicable.length === 0) {
        // No schedules apply - use default playlist
        return null;
    }
    // Sort by priority (descending) - highest priority first
    applicable.sort((a, b) => b.priority - a.priority);
    // Return highest priority schedule
    return applicable[0];
}
/**
 * Get the current active schedule for a screen
 */
async function getCurrentSchedule(pool, screenId) {
    const result = await pool.query(`SELECT * FROM schedules 
     WHERE screen_id = $1 AND is_active = true
     ORDER BY priority DESC`, [screenId]);
    if (result.rows.length === 0) {
        return null;
    }
    return resolveScheduleConflicts(result.rows);
}
/**
 * Get the playlist for a screen based on current schedule
 * Falls back to default playlist if no schedule applies
 */
async function getActivePlaylist(pool, screenId) {
    // Check for active schedule
    const schedule = await getCurrentSchedule(pool, screenId);
    if (schedule) {
        console.log(`[Schedule] Using scheduled playlist ${schedule.playlist_id} for screen ${screenId}`);
        return schedule.playlist_id;
    }
    // Fall back to default playlist
    const defaultResult = await pool.query('SELECT id FROM playlists WHERE is_default = true LIMIT 1');
    if (defaultResult.rows.length > 0) {
        console.log(`[Schedule] Using default playlist ${defaultResult.rows[0].id} for screen ${screenId}`);
        return defaultResult.rows[0].id;
    }
    console.log(`[Schedule] No playlist found for screen ${screenId}`);
    return null;
}
/**
 * Priority level descriptions
 */
exports.PRIORITY_LEVELS = {
    0: 'Default/Normal',
    1: 'Scheduled Events',
    2: 'Important Announcements',
    3: 'Emergency Content',
    4: 'Critical Override'
};
/**
 * Get human-readable description of priority level
 */
function getPriorityDescription(priority) {
    return exports.PRIORITY_LEVELS[priority] || 'Unknown';
}
