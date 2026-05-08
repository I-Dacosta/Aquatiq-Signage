import { Express, Request, Response } from 'express';
import { pool, broadcastUpdate } from '../index';
import { v4 as uuidv4 } from 'uuid';

// Helper function to generate URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .trim();
}

// Helper function to ensure slug is unique
async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const query = excludeId 
      ? 'SELECT id FROM screens WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM screens WHERE slug = $1';
    const params = excludeId ? [uniqueSlug, excludeId] : [uniqueSlug];
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return uniqueSlug;
    }
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

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

  // Get single screen (by ID or slug)
  app.get('/api/screens/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Try to match by ID first, then by slug
      const result = await pool.query(`
        SELECT 
          s.*,
          c.name as current_content_name,
          c.type as current_content_type,
          c.url as current_content_url
        FROM screens s
        LEFT JOIN content c ON s.current_content_id = c.id
        WHERE s.id::text = $1 OR s.slug = $1
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
    const { name, location, macAddress, groupName, metadata, slug: customSlug } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    try {
      const id = uuidv4();
      
      // Generate slug from custom slug or name
      let slug = customSlug ? generateSlug(customSlug) : generateSlug(name);
      
      // Ensure slug is unique
      slug = await ensureUniqueSlug(slug);
      
      const result = await pool.query(`
        INSERT INTO screens (id, name, location, mac_address, group_name, metadata, slug)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [id, name, location, macAddress, groupName, JSON.stringify(metadata || {}), slug]);

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
    const { name, location, macAddress, groupName, metadata, slug: customSlug } = req.body;

    try {
      let slug = null;
      
      // If custom slug provided, generate and ensure uniqueness
      if (customSlug !== undefined) {
        slug = generateSlug(customSlug);
        slug = await ensureUniqueSlug(slug, id);
      }
      
      const result = await pool.query(`
        UPDATE screens
        SET name = COALESCE($2, name),
            location = COALESCE($3, location),
            mac_address = COALESCE($4, mac_address),
            group_name = COALESCE($5, group_name),
            metadata = COALESCE($6, metadata),
            slug = COALESCE($7, slug)
        WHERE id = $1
        RETURNING *
      `, [id, name, location, macAddress, groupName, metadata ? JSON.stringify(metadata) : null, slug]);

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
