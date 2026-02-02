"use strict";
/**
 * Deployment Templates
 * Pre-configured setups for common scenarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.templates = void 0;
exports.applyTemplate = applyTemplate;
exports.listTemplates = listTemplates;
exports.templates = [
    {
        name: 'office-basic',
        description: 'Basic office setup with 3 screens',
        screens: [
            { name: 'Reception', location: 'Entrance', group_name: 'Office' },
            { name: 'Cafeteria', location: 'Break Room', group_name: 'Office' },
            { name: 'Meeting Room', location: 'Conference', group_name: 'Office' }
        ],
        content: [
            {
                name: 'Company Dashboard',
                type: 'url',
                url: 'https://dashboard.company.com',
                duration: 60,
                metadata: { category: 'analytics' }
            },
            {
                name: 'News Feed',
                type: 'feed',
                url: 'https://news.company.com/rss',
                duration: 30,
                metadata: { category: 'news' }
            },
            {
                name: 'Welcome Message',
                type: 'url',
                url: 'https://welcome.company.com',
                duration: 45
            }
        ],
        playlists: [
            {
                name: 'Default Rotation',
                description: 'Standard office content rotation',
                is_default: true
            }
        ],
        schedules: [
            {
                start_time: '08:00:00',
                end_time: '17:00:00',
                days_of_week: [1, 2, 3, 4, 5],
                priority: 1
            }
        ]
    },
    {
        name: 'warehouse',
        description: 'Warehouse displays with BX integration',
        screens: [
            { name: 'Picking Station', location: 'Warehouse A', group_name: 'Warehouse' },
            { name: 'Receiving Dock', location: 'Warehouse B', group_name: 'Warehouse' }
        ],
        content: [
            {
                name: 'BX Dashboard',
                type: 'url',
                url: '/proxy/logistic-dashboard-embed',
                duration: 30,
                metadata: { integration: 'bxsoftware' }
            },
            {
                name: 'Safety Guidelines',
                type: 'url',
                url: 'https://safety.company.com',
                duration: 60
            }
        ],
        playlists: [
            {
                name: 'Warehouse Feed',
                description: 'Live warehouse data',
                is_default: true
            }
        ],
        schedules: []
    },
    {
        name: 'retail',
        description: 'Retail store displays with promotions',
        screens: [
            { name: 'Store Entrance', location: 'Front Door', group_name: 'Retail' },
            { name: 'Checkout Area', location: 'POS', group_name: 'Retail' },
            { name: 'Product Showcase', location: 'Main Floor', group_name: 'Retail' }
        ],
        content: [
            {
                name: 'Current Promotions',
                type: 'url',
                url: 'https://promotions.store.com',
                duration: 20
            },
            {
                name: 'Product Catalog',
                type: 'url',
                url: 'https://catalog.store.com',
                duration: 30
            },
            {
                name: 'Brand Video',
                type: 'video',
                url: '/videos/brand-intro.mp4',
                duration: 45
            }
        ],
        playlists: [
            {
                name: 'Main Rotation',
                description: 'Primary content loop',
                is_default: true
            }
        ],
        schedules: [
            {
                start_time: '09:00:00',
                end_time: '21:00:00',
                days_of_week: [1, 2, 3, 4, 5, 6],
                priority: 1
            }
        ]
    },
    {
        name: 'restaurant',
        description: 'Restaurant menu boards',
        screens: [
            { name: 'Menu Board 1', location: 'Counter', group_name: 'Restaurant' },
            { name: 'Menu Board 2', location: 'Drive-thru', group_name: 'Restaurant' }
        ],
        content: [
            {
                name: 'Breakfast Menu',
                type: 'url',
                url: 'https://menu.restaurant.com/breakfast',
                duration: 300
            },
            {
                name: 'Lunch Menu',
                type: 'url',
                url: 'https://menu.restaurant.com/lunch',
                duration: 300
            },
            {
                name: 'Dinner Menu',
                type: 'url',
                url: 'https://menu.restaurant.com/dinner',
                duration: 300
            }
        ],
        playlists: [
            {
                name: 'Breakfast Rotation',
                description: 'Morning menu',
                is_default: false
            },
            {
                name: 'Lunch Rotation',
                description: 'Midday menu',
                is_default: false
            },
            {
                name: 'Dinner Rotation',
                description: 'Evening menu',
                is_default: true
            }
        ],
        schedules: [
            {
                start_time: '06:00:00',
                end_time: '11:00:00',
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
                priority: 2
            },
            {
                start_time: '11:00:00',
                end_time: '16:00:00',
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
                priority: 2
            },
            {
                start_time: '16:00:00',
                end_time: '22:00:00',
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
                priority: 2
            }
        ]
    }
];
/**
 * Apply a deployment template
 */
async function applyTemplate(pool, templateName, tenantId) {
    const template = exports.templates.find(t => t.name === templateName);
    if (!template) {
        throw new Error(`Template '${templateName}' not found`);
    }
    const results = {
        screens: [],
        content: [],
        playlists: [],
        schedules: []
    };
    // Create screens
    for (const screen of template.screens) {
        const result = await pool.query(`INSERT INTO screens (name, location, group_name, mac_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [screen.name, screen.location, screen.group_name, screen.mac_address || null]);
        results.screens.push(result.rows[0]);
    }
    // Create content
    for (const content of template.content) {
        const result = await pool.query(`INSERT INTO content (name, type, url, duration, metadata, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`, [content.name, content.type, content.url, content.duration, JSON.stringify(content.metadata || {})]);
        results.content.push(result.rows[0]);
    }
    // Create playlists
    for (const playlist of template.playlists) {
        const result = await pool.query(`INSERT INTO playlists (name, description, is_default)
       VALUES ($1, $2, $3)
       RETURNING *`, [playlist.name, playlist.description, playlist.is_default]);
        results.playlists.push(result.rows[0]);
    }
    // Add all content to all playlists
    for (const playlist of results.playlists) {
        for (let i = 0; i < results.content.length; i++) {
            await pool.query(`INSERT INTO playlist_items (playlist_id, content_id, order_index)
         VALUES ($1, $2, $3)`, [playlist.id, results.content[i].id, i]);
        }
    }
    // Create schedules (assign to all screens)
    for (const schedule of template.schedules) {
        for (const screen of results.screens) {
            const playlist = results.playlists[0]; // Use first playlist
            const result = await pool.query(`INSERT INTO schedules 
         (screen_id, playlist_id, start_time, end_time, days_of_week, priority, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`, [
                screen.id,
                playlist.id,
                schedule.start_time,
                schedule.end_time,
                schedule.days_of_week,
                schedule.priority
            ]);
            results.schedules.push(result.rows[0]);
        }
    }
    return results;
}
/**
 * List all available templates
 */
function listTemplates() {
    return exports.templates.map(t => ({
        name: t.name,
        description: t.description
    }));
}
