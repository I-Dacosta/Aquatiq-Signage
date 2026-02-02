import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { WebSocketServer } from 'ws';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';
import { setupScreenRoutes } from './routes/screens';
import { setupContentRoutes } from './routes/content';
import { setupPlaylistRoutes } from './routes/playlists';
import { setupScheduleRoutes } from './routes/schedules';
import { setupScreenAPIRoutes } from './routes/screen-api';
import { setupTemplateRoutes } from './routes/templates';
import { setupScreenRegistrationRoutes } from './routes/screen-registration';
import { setupShortUrlRoutes } from './routes/short-url';
import setupVideoRoutes, { VIDEOS_DIR } from './routes/videos';
import setupProxyRoutes from './routes/proxy';
import { checkOfflineScreens } from './services/monitor';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Database connection
export const pool = new Pool({
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
app.use(cors());
app.use(express.json());

// Serve static public files (player.js, offline.html)
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    });
  }
}));

// Serve static video files
app.use('/videos', express.static(VIDEOS_DIR, {
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
setupScreenRoutes(app);
setupContentRoutes(app);
setupPlaylistRoutes(app);
setupScheduleRoutes(app);
setupScreenAPIRoutes(app); // For URL Launcher integration
setupTemplateRoutes(app); // Deployment templates
setupScreenRegistrationRoutes(app, pool); // Auto-registration
setupShortUrlRoutes(app, pool); // Short URL system
app.use('/api/videos', setupVideoRoutes(pool)); // Video management
app.use('/proxy', setupProxyRoutes(pool)); // Dashboard embed

// WebSocket for real-time updates
const server = app.listen(port, () => {
  console.log(`🚀 Aquatiq Signage Server running on port ${port}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

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
export function broadcastUpdate(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Monitor screens every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  await checkOfflineScreens(pool);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});
