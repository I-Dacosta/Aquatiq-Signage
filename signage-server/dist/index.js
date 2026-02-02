"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.broadcastUpdate = broadcastUpdate;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
const ws_1 = require("ws");
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const screens_1 = require("./routes/screens");
const content_1 = require("./routes/content");
const playlists_1 = require("./routes/playlists");
const schedules_1 = require("./routes/schedules");
const screen_api_1 = require("./routes/screen-api");
const templates_1 = require("./routes/templates");
const screen_registration_1 = require("./routes/screen-registration");
const short_url_1 = require("./routes/short-url");
const videos_1 = __importStar(require("./routes/videos"));
const proxy_1 = __importDefault(require("./routes/proxy"));
const monitor_1 = require("./services/monitor");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
// Database connection
exports.pool = new pg_1.Pool({
    host: process.env.POSTGRES_HOST || 'postgres.aquatiq-backend',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'aquatiq_signage',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static public files (player.js, offline.html)
app.use(express_1.default.static(path_1.default.join(__dirname, '../public'), {
    setHeaders: (res) => {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300'
        });
    }
}));
// Serve static video files
app.use('/videos', express_1.default.static(videos_1.VIDEOS_DIR, {
    setHeaders: (res) => {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
        });
    }
}));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
(0, screens_1.setupScreenRoutes)(app);
(0, content_1.setupContentRoutes)(app);
(0, playlists_1.setupPlaylistRoutes)(app);
(0, schedules_1.setupScheduleRoutes)(app);
(0, screen_api_1.setupScreenAPIRoutes)(app); // For URL Launcher integration
(0, templates_1.setupTemplateRoutes)(app); // Deployment templates
(0, screen_registration_1.setupScreenRegistrationRoutes)(app, exports.pool); // Auto-registration
(0, short_url_1.setupShortUrlRoutes)(app, exports.pool); // Short URL system
app.use('/api/videos', (0, videos_1.default)(exports.pool)); // Video management
app.use('/proxy', (0, proxy_1.default)(exports.pool)); // Dashboard embed
// WebSocket for real-time updates
const server = app.listen(port, () => {
    console.log(`🚀 Aquatiq Signage Server running on port ${port}`);
});
const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
    });
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});
// Broadcast function for real-time updates
function broadcastUpdate(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify(data));
        }
    });
}
// Monitor screens every 30 seconds
node_cron_1.default.schedule('*/30 * * * * *', async () => {
    await (0, monitor_1.checkOfflineScreens)(exports.pool);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        exports.pool.end();
        process.exit(0);
    });
});
