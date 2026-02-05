import { Express, Request, Response } from 'express';
import { pool, broadcastUpdate } from '../index';
import { v4 as uuidv4 } from 'uuid';

export function setupContentRoutes(app: Express) {
  // List all content
  app.get('/api/content', async (req: Request, res: Response) => {
    const { type, active } = req.query;
    
    try {
      let query = 'SELECT * FROM content WHERE 1=1';
      const params: any[] = [];
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

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching content:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('📺 Returning mock content data (database unavailable)');
        return res.json([
          { id: '1', name: 'Welcome Video', type: 'video', url: 'https://example.com/welcome.mp4', duration: 30, thumbnail_url: '', is_active: true, created_at: new Date() },
          { id: '2', name: 'News Feed', type: 'feed', url: 'https://example.com/news', duration: 60, thumbnail_url: '', is_active: true, created_at: new Date() },
        ]);
      }
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // Get single content
  app.get('/api/content/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query('SELECT * FROM content WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // Create content
  app.post('/api/content', async (req: Request, res: Response) => {
    const { name, type, url, duration, thumbnailUrl, metadata, isActive } = req.body;

    if (!name || !type || !url) {
      return res.status(400).json({ error: 'Name, type, and URL are required' });
    }

    if (!['url', 'image', 'video', 'feed'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    try {
      const id = uuidv4();
      const result = await pool.query(`
        INSERT INTO content (id, name, type, url, duration, thumbnail_url, metadata, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [id, name, type, url, duration || 30, thumbnailUrl, JSON.stringify(metadata || {}), isActive !== false]);

      const content = result.rows[0];
      broadcastUpdate({ type: 'content_created', content });
      
      res.status(201).json(content);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ error: 'Failed to create content' });
    }
  });

  // Update content
  app.put('/api/content/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type, url, duration, thumbnailUrl, metadata, isActive } = req.body;

    try {
      const result = await pool.query(`
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
      broadcastUpdate({ type: 'content_updated', content });

      res.json(content);
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ error: 'Failed to update content' });
    }
  });

  // Delete content
  app.delete('/api/content/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM content WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      broadcastUpdate({ type: 'content_deleted', contentId: id });

      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ error: 'Failed to delete content' });
    }
  });
}
