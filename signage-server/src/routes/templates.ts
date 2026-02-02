/**
 * Template Management Routes
 */

import { Express, Request, Response } from 'express';
import { pool } from '../index';
import { listTemplates, applyTemplate } from '../lib/templates';

export function setupTemplateRoutes(app: Express) {
  // List all available templates
  app.get('/api/templates', (req: Request, res: Response) => {
    try {
      const templates = listTemplates();
      res.json({ templates });
    } catch (error) {
      console.error('Error listing templates:', error);
      res.status(500).json({ error: 'Failed to list templates' });
    }
  });

  // Apply a template
  app.post('/api/templates/:name/apply', async (req: Request, res: Response) => {
    const { name } = req.params;
    const { tenantId } = req.body;

    try {
      const results = await applyTemplate(pool, name, tenantId);

      res.json({
        success: true,
        message: `Template '${name}' applied successfully`,
        results: {
          screensCreated: results.screens.length,
          contentCreated: results.content.length,
          playlistsCreated: results.playlists.length,
          schedulesCreated: results.schedules.length
        },
        data: results
      });
    } catch (error: any) {
      console.error('Error applying template:', error);
      res.status(500).json({
        error: 'Failed to apply template',
        message: error.message
      });
    }
  });
}
