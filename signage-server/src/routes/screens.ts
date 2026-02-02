import { Express, Request, Response } from 'express';
import { pool, broadcastUpdate } from '../index';
import { v4 as uuidv4 } from 'uuid';

export function setupScreenRoutes(app: Express) {
  // List all screens
  app.get('/api/screens', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
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
    } catch (error) {
      console.error('Error fetching screens:', error);
      res.status(500).json({ error: 'Failed to fetch screens' });
    }
  });

  // Get single screen
  app.get('/api/screens/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query(`
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
    } catch (error) {
      console.error('Error fetching screen:', error);
      res.status(500).json({ error: 'Failed to fetch screen' });
    }
  });

  // Create screen
  app.post('/api/screens', async (req: Request, res: Response) => {
    const { name, location, macAddress, groupName, metadata } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    try {
      const id = uuidv4();
      const result = await pool.query(`
        INSERT INTO screens (id, name, location, mac_address, group_name, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [id, name, location, macAddress, groupName, JSON.stringify(metadata || {})]);

      const screen = result.rows[0];
      broadcastUpdate({ type: 'screen_created', screen });
      
      res.status(201).json(screen);
    } catch (error) {
      console.error('Error creating screen:', error);
      res.status(500).json({ error: 'Failed to create screen' });
    }
  });

  // Update screen
  app.put('/api/screens/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, location, macAddress, groupName, metadata } = req.body;

    try {
      const result = await pool.query(`
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
      broadcastUpdate({ type: 'screen_updated', screen });

      res.json(screen);
    } catch (error) {
      console.error('Error updating screen:', error);
      res.status(500).json({ error: 'Failed to update screen' });
    }
  });

  // Delete screen
  app.delete('/api/screens/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM screens WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Screen not found' });
      }

      broadcastUpdate({ type: 'screen_deleted', screenId: id });

      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting screen:', error);
      res.status(500).json({ error: 'Failed to delete screen' });
    }
  });

  // Get screen status logs
  app.get('/api/screens/:id/logs', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = '100' } = req.query;

    try {
      const result = await pool.query(`
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
    } catch (error) {
      console.error('Error fetching screen logs:', error);
      res.status(500).json({ error: 'Failed to fetch screen logs' });
    }
  });
}
