import { Express, Request, Response } from 'express';
import { pool, broadcastUpdate } from '../index';
import { v4 as uuidv4 } from 'uuid';

export function setupScheduleRoutes(app: Express) {
  // List all schedules
  app.get('/api/schedules', async (req: Request, res: Response) => {
    const { screenId } = req.query;

    try {
      let query = `
        SELECT 
          sc.*,
          s.name as screen_name,
          s.location as screen_location,
          p.name as playlist_name
        FROM schedules sc
        JOIN screens s ON sc.screen_id = s.id
        JOIN playlists p ON sc.playlist_id = p.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (screenId) {
        query += ' AND sc.screen_id = $1';
        params.push(screenId);
      }

      query += ' ORDER BY sc.priority DESC, sc.start_time ASC';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  });

  // Get single schedule
  app.get('/api/schedules/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query(`
        SELECT 
          sc.*,
          s.name as screen_name,
          p.name as playlist_name
        FROM schedules sc
        JOIN screens s ON sc.screen_id = s.id
        JOIN playlists p ON sc.playlist_id = p.id
        WHERE sc.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ error: 'Failed to fetch schedule' });
    }
  });

  // Create schedule
  app.post('/api/schedules', async (req: Request, res: Response) => {
    const {
      screenId,
      playlistId,
      startTime,
      endTime,
      daysOfWeek,
      startDate,
      endDate,
      priority,
      isActive
    } = req.body;

    if (!screenId || !playlistId) {
      return res.status(400).json({ error: 'Screen ID and Playlist ID are required' });
    }

    try {
      const id = uuidv4();
      const result = await pool.query(`
        INSERT INTO schedules (
          id, screen_id, playlist_id, start_time, end_time,
          days_of_week, start_date, end_date, priority, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        id, screenId, playlistId, startTime, endTime,
        daysOfWeek, startDate, endDate, priority || 0, isActive !== false
      ]);

      const schedule = result.rows[0];
      broadcastUpdate({ type: 'schedule_created', schedule });
      
      res.status(201).json(schedule);
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  });

  // Update schedule
  app.put('/api/schedules/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      screenId,
      playlistId,
      startTime,
      endTime,
      daysOfWeek,
      startDate,
      endDate,
      priority,
      isActive
    } = req.body;

    try {
      const result = await pool.query(`
        UPDATE schedules
        SET screen_id = COALESCE($2, screen_id),
            playlist_id = COALESCE($3, playlist_id),
            start_time = COALESCE($4, start_time),
            end_time = COALESCE($5, end_time),
            days_of_week = COALESCE($6, days_of_week),
            start_date = COALESCE($7, start_date),
            end_date = COALESCE($8, end_date),
            priority = COALESCE($9, priority),
            is_active = COALESCE($10, is_active)
        WHERE id = $1
        RETURNING *
      `, [id, screenId, playlistId, startTime, endTime, daysOfWeek, startDate, endDate, priority, isActive]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const schedule = result.rows[0];
      broadcastUpdate({ type: 'schedule_updated', schedule });

      res.json(schedule);
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  });

  // Delete schedule
  app.delete('/api/schedules/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM schedules WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      broadcastUpdate({ type: 'schedule_deleted', scheduleId: id });

      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  });
}
