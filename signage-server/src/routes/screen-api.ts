import { Express, Request, Response } from 'express';
import { pool } from '../index';
import { getCurrentPlaylist, getPlaylistContent } from '../services/scheduler';
import { logScreenStatus } from '../services/monitor';
import { getCurrentSchedule, getActivePlaylist } from '../lib/schedule-resolver';

export function setupScreenAPIRoutes(app: Express) {
  // Enhanced endpoint for URL Launcher with schedule resolution
  // Screen requests: GET /api/signage/screen/{screen-id}
  app.get('/api/signage/screen/:screenId', async (req: Request, res: Response) => {
    const { screenId } = req.params;
    const { position = '0' } = req.query; // Current position in playlist

    try {
      // Update screen last_seen and set online
      await pool.query(`
        UPDATE screens
        SET last_seen = NOW(), is_online = true, ip_address = $2
        WHERE id = $1
      `, [screenId, req.ip]);

      // Get current playlist using enhanced schedule resolver
      const playlistId = await getActivePlaylist(pool, screenId);

      if (!playlistId) {
        return res.status(404).json({
          error: 'No playlist assigned',
          message: 'Please configure a schedule or default playlist for this screen'
        });
      }

      // Get current schedule (for schedule_id tracking)
      const currentSchedule = await getCurrentSchedule(pool, screenId);

      // Get playlist content
      const content = await getPlaylistContent(pool, playlistId);

      if (content.length === 0) {
        return res.status(404).json({
          error: 'Empty playlist',
          message: 'The assigned playlist has no content'
        });
      }

      // Get current content based on position
      const currentPosition = parseInt(position as string) || 0;
      const currentContent = content[currentPosition % content.length];
      const nextPosition = (currentPosition + 1) % content.length;

      // Update screen current content
      await pool.query(`
        UPDATE screens
        SET current_content_id = $2
        WHERE id = $1
      `, [screenId, currentContent.id]);

      // Log status
      await logScreenStatus(pool, screenId, 'playing', currentContent.id);

      // Return content info with schedule tracking
      res.json({
        content: {
          id: currentContent.id,
          name: currentContent.name,
          type: currentContent.type,
          url: currentContent.url,
          duration: currentContent.duration,
          thumbnail_url: currentContent.thumbnail_url,
          metadata: currentContent.metadata
        },
        playlist: {
          id: playlistId,
          totalItems: content.length,
          currentPosition,
          nextPosition
        },
        schedule: {
          id: currentSchedule?.id || null,
          priority: currentSchedule?.priority || 0
        },
        nextUrl: `/api/signage/screen/${screenId}?position=${nextPosition}`,
        refreshIn: currentContent.duration
      });

    } catch (error) {
      console.error('Error serving screen:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get content for screen'
      });
    }
  });

  // Heartbeat endpoint (screen pings to stay online)
  app.post('/api/signage/screen/:screenId/heartbeat', async (req: Request, res: Response) => {
    const { screenId } = req.params;
    const { contentId, status, errorMessage } = req.body;

    try {
      await pool.query(`
        UPDATE screens
        SET last_seen = NOW(), is_online = true, current_content_id = $2
        WHERE id = $1
      `, [screenId, contentId]);

      if (status) {
        await logScreenStatus(pool, screenId, status, contentId, errorMessage);
      }

      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error handling heartbeat:', error);
      res.status(500).json({ error: 'Failed to process heartbeat' });
    }
  });

  // Get screen info (for display on screen)
  app.get('/api/signage/screen/:screenId/info', async (req: Request, res: Response) => {
    const { screenId } = req.params;

    try {
      const result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.location,
          s.group_name,
          s.is_online,
          s.last_seen,
          c.name as current_content_name,
          c.type as current_content_type
        FROM screens s
        LEFT JOIN content c ON s.current_content_id = c.id
        WHERE s.id = $1
      `, [screenId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Screen not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting screen info:', error);
      res.status(500).json({ error: 'Failed to get screen info' });
    }
  });

  // MAC address-based API for player.js
  // Get current content by MAC address
  app.get('/api/screen-api/:mac/current', async (req: Request, res: Response) => {
    const { mac } = req.params;

    try {
      // Find screen by MAC address
      const screenResult = await pool.query(
        'SELECT id FROM screens WHERE mac_address = $1',
        [mac]
      );

      if (screenResult.rows.length === 0) {
        return res.status(404).json({ error: 'Screen not found' });
      }

      const screenId = screenResult.rows[0].id;

      // Get current playlist using enhanced schedule resolver
      const playlistId = await getActivePlaylist(pool, screenId);

      if (!playlistId) {
        return res.status(404).json({
          error: 'No playlist assigned',
          message: 'Please configure a schedule or default playlist for this screen'
        });
      }

      // Get current schedule
      const currentSchedule = await getCurrentSchedule(pool, screenId);

      // Get playlist content
      const content = await getPlaylistContent(pool, playlistId);

      if (content.length === 0) {
        return res.status(404).json({
          error: 'Empty playlist',
          message: 'The assigned playlist has no content'
        });
      }

      // Get first content item
      const currentContent = content[0];

      // Update screen last_seen
      await pool.query(
        'UPDATE screens SET last_seen = NOW(), is_online = true WHERE id = $1',
        [screenId]
      );

      res.json({
        content_id: currentContent.id,
        url: currentContent.url,
        duration: currentContent.duration,
        playlist_name: playlistId,
        schedule_id: currentSchedule?.id || null
      });

    } catch (error) {
      console.error('Error getting current content:', error);
      res.status(500).json({ error: 'Failed to get current content' });
    }
  });

  // Heartbeat by MAC address
  app.post('/api/screen-api/:mac/heartbeat', async (req: Request, res: Response) => {
    const { mac } = req.params;
    const { ip_address, content_id } = req.body;

    try {
      // Find and update screen
      const result = await pool.query(`
        UPDATE screens
        SET last_seen = NOW(), 
            is_online = true,
            ip_address = $2,
            current_content_id = $3
        WHERE mac_address = $1
        RETURNING id
      `, [mac, ip_address, content_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Screen not found' });
      }

      // Log heartbeat
      await logScreenStatus(pool, result.rows[0].id, 'online', content_id);

      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error handling heartbeat:', error);
      res.status(500).json({ error: 'Failed to process heartbeat' });
    }
  });
}
