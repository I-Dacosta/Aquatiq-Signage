"use strict";
/**
 * Template Management Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTemplateRoutes = setupTemplateRoutes;
const index_1 = require("../index");
const templates_1 = require("../lib/templates");
function setupTemplateRoutes(app) {
    // List all available templates
    app.get('/api/templates', (req, res) => {
        try {
            const templates = (0, templates_1.listTemplates)();
            res.json({ templates });
        }
        catch (error) {
            console.error('Error listing templates:', error);
            res.status(500).json({ error: 'Failed to list templates' });
        }
    });
    // Apply a template
    app.post('/api/templates/:name/apply', async (req, res) => {
        const { name } = req.params;
        const { tenantId } = req.body;
        try {
            const results = await (0, templates_1.applyTemplate)(index_1.pool, name, tenantId);
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
        }
        catch (error) {
            console.error('Error applying template:', error);
            res.status(500).json({
                error: 'Failed to apply template',
                message: error.message
            });
        }
    });
}
