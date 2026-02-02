# 🖥️ Aquatiq Digital Signage Server

**Unified digital signage management platform for Aquatiq's MagicInfo displays**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Node](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](Dockerfile)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Development](#development)

## 🎯 Overview

Aquatiq Digital Signage Server is a consolidated backend system that manages all aspects of digital signage displays across Aquatiq's offices. It replaced three separate microservices (video-server, pages-server, and screen-management) into a single, efficient, and maintainable solution.

### Key Capabilities

- **Screen Management**: Monitor and control Samsung MagicInfo displays
- **Content Library**: Manage URLs, videos, images, and data feeds
- **Playlist System**: Create content rotation playlists
- **Smart Scheduling**: Time-based content delivery with priority system
- **Video Management**: Upload videos or integrate SharePoint links
- **Live Dashboards**: Real-time warehouse monitoring (BxSoftware integration)
- **Real-time Updates**: WebSocket support for instant screen synchronization
- **URL Launcher API**: Direct integration with MagicInfo URL Launcher app

## ✨ Features

### 🖥️ Screen Management
- Real-time online/offline monitoring
- MAC address and IP tracking
- Location-based grouping
- Status logging and history
- Automatic offline detection (30s intervals)
- Current content tracking

### 📚 Content Library
- **URL Content**: Web pages, dashboards, applications
- **Video Content**: Uploaded files or SharePoint links
- **Image Content**: Static images and graphics
- **Feed Content**: RSS feeds and dynamic data
- Duration control per content item
- Thumbnail support
- Active/inactive toggle

### 📋 Playlist Management
- Create unlimited playlists
- Order content items with drag-and-drop support
- Override individual content durations
- Set default playlists
- Assign playlists to screens

### 📅 Smart Scheduling
- Time-based scheduling (start/end times)
- Day-of-week selection (Mon-Sun)
- Date range constraints (start/end dates)
- Priority levels for schedule conflicts
- Active/inactive scheduling toggle
- Multiple schedules per screen

### 🎥 Video Management
- **Upload**: Direct video file upload with progress tracking
- **SharePoint Integration**: Link SharePoint video URLs
- **Streaming**: Efficient video serving with range request support
- **MagicInfo Embed**: Generate embed URLs for MagicInfo displays
- **Metadata**: Title, description, view count tracking
- **Storage**: Persistent volume storage with Docker

### 📊 Live Dashboard Integration
- **BxSoftware Warehouse Dashboard**
  - Real-time picking/receiving statistics
  - Server-side authentication (credentials never exposed)
  - 12-hour session caching
  - Auto-refresh every 30 seconds
  - MagicInfo-compatible HTML output
  - Embed URL for displays

### 🔄 Real-time Features
- WebSocket server for instant updates
- Broadcast screen status changes
- Content update notifications
- Playlist modifications sync
- Schedule changes propagation

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                     │
│              https://tools.aquatiq.com                   │
│                                                          │
│  Digital Signage UI with 6 tabs:                        │
│  • Screens  • Content  • Playlists                      │
│  • Schedules  • Videos  • BX Dashboard                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Signage Server (Node.js + Express)          │
│                https://signage.aquatiq.com               │
│                      Port 3002                           │
├─────────────────────────────────────────────────────────┤
│  API Routes:                                            │
│  • /api/screens      - Screen CRUD                      │
│  • /api/content      - Content CRUD                     │
│  • /api/playlists    - Playlist CRUD                    │
│  • /api/schedules    - Schedule CRUD                    │
│  • /api/videos       - Video upload/management          │
│  • /api/screen-api   - URL Launcher integration         │
│  • /proxy/*          - BX dashboard proxy               │
│  • /ws               - WebSocket real-time updates      │
│  • /videos/:file     - Static video serving             │
└────────┬────────────────────────────────┬───────────────┘
         │                                │
         ▼                                ▼
┌──────────────────┐          ┌─────────────────────┐
│   PostgreSQL     │          │  BxSoftware API     │
│  aquatiq_signage │          │ api.bxsoftware.no   │
│                  │          │                     │
│  7 tables:       │          │ Warehouse data:     │
│  • screens       │          │ • Picking stats     │
│  • content       │          │ • Receiving stats   │
│  • playlists     │          │ • Real-time updates │
│  • playlist_items│          └─────────────────────┘
│  • schedules     │
│  • videos        │
│  • status_logs   │
└──────────────────┘

         │
         ▼
┌──────────────────┐
│  Docker Volume   │
│  signage-videos  │
│                  │
│  Uploaded video  │
│  files storage   │
└──────────────────┘
```

### Consolidated Services

This server **replaced 3 separate microservices**:

| Old Service | Port | Status | Merged Into |
|------------|------|--------|-------------|
| video-server | 3001 | ❌ Deprecated | signage-server |
| pages-server | 3002 | ❌ Deprecated | signage-server |
| screen-management | 3002 | ✅ Core | signage-server |

**Benefits of Consolidation:**
- Reduced container count (5 → 2)
- Simplified deployment
- Unified API surface
- Better resource utilization
- Easier maintenance

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5.2.2
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 16
- **Real-time**: WebSocket (ws 8.14)

### Key Dependencies
- **pg** (8.11) - PostgreSQL client
- **cors** (2.8) - Cross-origin resource sharing
- **multer** (1.4.5) - File upload handling
- **node-cron** (3.0) - Scheduled tasks
- **uuid** (9.0) - Unique identifiers
- **dotenv** (16.3) - Environment configuration

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Traefik** - Reverse proxy with SSL
- **Volume Storage** - Persistent video files

## 📦 Installation

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 16
- Docker & Docker Compose (for containerized deployment)
- pnpm (recommended) or npm

### Local Development Setup

1. **Clone the repository**
   ```bash
   cd aquatiq-digital-signage/signage-server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb aquatiq_signage
   
   # Import schema
   psql -U postgres -d aquatiq_signage -f schema.sql
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

Server will start on http://localhost:3002

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   cd aquatiq-digital-signage
   docker-compose up -d signage-server
   ```

2. **Standalone Docker**
   ```bash
   docker build -t aquatiq-signage-server .
   docker run -d \
     --name aquatiq-signage-server \
     -p 3002:3002 \
     --env-file .env \
     -v signage-videos:/app/videos \
     aquatiq-signage-server
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the signage-server directory:

```bash
# Server Configuration
PORT=3002
NODE_ENV=production

# PostgreSQL Database
POSTGRES_HOST=postgres.aquatiq-backend
POSTGRES_PORT=5432
POSTGRES_DB=aquatiq_signage
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Video Storage
VIDEOS_DIR=/app/videos
VIDEO_BASE_URL=https://signage.aquatiq.com

# External Services
TOOLS_BASE_URL=https://tools.aquatiq.com

# BxSoftware Authentication (for warehouse dashboard)
BX_USERNAME=your_bx_username
BX_PASSWORD=your_bx_password
BX_COMPANYCODE=your_company_code
```

### Database Configuration

The server automatically handles database connections with these settings:

- **Connection Pool**: Max 20 connections
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds
- **Auto-reconnect**: Enabled

### Video Storage

Videos are stored in a persistent Docker volume:

```yaml
volumes:
  signage-videos:
    driver: local
```

**Storage Path**: `/app/videos` (inside container)  
**Access URL**: `https://signage.aquatiq.com/videos/:filename`

## 🔌 API Endpoints

### Screen Management

#### `GET /api/screens`
List all screens

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Reception Display",
    "location": "Main Office",
    "mac_address": "00:11:22:33:44:55",
    "ip_address": "192.168.1.100",
    "group_name": "Office Screens",
    "is_online": true,
    "last_seen": "2026-02-02T12:00:00Z",
    "current_content_id": "uuid",
    "metadata": {},
    "created_at": "2026-01-01T10:00:00Z"
  }
]
```

#### `POST /api/screens`
Create a new screen

**Request Body:**
```json
{
  "name": "Lobby Display",
  "location": "Building A",
  "mac_address": "00:11:22:33:44:66",
  "group_name": "Lobby Screens"
}
```

#### `PUT /api/screens/:id`
Update screen

#### `DELETE /api/screens/:id`
Delete screen

### Content Management

#### `GET /api/content`
List all content

**Query Parameters:**
- `type` - Filter by type (url, video, image, feed)
- `active` - Filter by active status (true/false)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Company Website",
    "type": "url",
    "url": "https://aquatiq.com",
    "duration": 30,
    "thumbnail_url": "https://...",
    "is_active": true,
    "metadata": {},
    "created_at": "2026-01-01T10:00:00Z"
  }
]
```

#### `POST /api/content`
Create content

**Request Body:**
```json
{
  "name": "Sales Dashboard",
  "type": "url",
  "url": "https://dashboard.aquatiq.com",
  "duration": 60,
  "metadata": {
    "category": "analytics"
  }
}
```

#### `PUT /api/content/:id`
Update content

#### `DELETE /api/content/:id`
Delete content

### Playlist Management

#### `GET /api/playlists`
List all playlists with items

#### `POST /api/playlists`
Create playlist

**Request Body:**
```json
{
  "name": "Office Morning Show",
  "description": "Content for morning hours",
  "is_default": false
}
```

#### `POST /api/playlists/:id/items`
Add content to playlist

**Request Body:**
```json
{
  "content_id": "uuid",
  "order_index": 1,
  "duration_override": 45
}
```

#### `PUT /api/playlists/:id/items/:itemId`
Update playlist item

#### `DELETE /api/playlists/:id/items/:itemId`
Remove from playlist

### Schedule Management

#### `GET /api/schedules`
List all schedules

**Query Parameters:**
- `screen_id` - Filter by screen

#### `POST /api/schedules`
Create schedule

**Request Body:**
```json
{
  "screen_id": "uuid",
  "playlist_id": "uuid",
  "start_time": "08:00:00",
  "end_time": "17:00:00",
  "days_of_week": [1, 2, 3, 4, 5],
  "start_date": "2026-02-01",
  "end_date": "2026-12-31",
  "priority": 1,
  "is_active": true
}
```

#### `PUT /api/schedules/:id`
Update schedule

#### `DELETE /api/schedules/:id`
Delete schedule

### Video Management

#### `POST /api/videos/upload`
Upload video file

**Content-Type**: `multipart/form-data`

**Form Fields:**
- `video` - Video file (required)
- `title` - Video title (required)
- `description` - Video description (optional)

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "title": "Product Demo",
    "filename": "uuid-video.mp4",
    "file_size": 15728640,
    "mime_type": "video/mp4",
    "url": "https://signage.aquatiq.com/videos/uuid-video.mp4"
  }
}
```

#### `POST /api/videos/sharepoint`
Add SharePoint video link

**Request Body:**
```json
{
  "title": "Training Video",
  "description": "Employee training material",
  "sharepoint_url": "https://sharepoint.com/video.mp4"
}
```

#### `GET /api/videos`
List all videos

#### `GET /api/videos/:id`
Get video details

#### `GET /api/videos/embed/:id`
Get MagicInfo-compatible embed HTML

**Response:** HTML page with video player

#### `PUT /api/videos/:id`
Update video metadata

#### `DELETE /api/videos/:id`
Delete video

### URL Launcher API (MagicInfo Integration)

#### `GET /api/screen-api/:mac_address/current`
Get current content for screen

**Response:**
```json
{
  "content_id": "uuid",
  "url": "https://example.com",
  "duration": 30,
  "playlist_name": "Default Playlist"
}
```

#### `POST /api/screen-api/:mac_address/heartbeat`
Screen heartbeat (marks screen as online)

**Request Body:**
```json
{
  "ip_address": "192.168.1.100",
  "content_id": "uuid"
}
```

### BX Dashboard Proxy

#### `GET /proxy/logistic-dashboard-embed`
Get embedded warehouse dashboard

**Response:** HTML page with real-time warehouse statistics

**Features:**
- Server-side BxSoftware authentication
- 12-hour session caching
- Auto-refresh every 30 seconds
- Picking/receiving statistics
- MagicInfo-compatible styling

#### `GET /proxy/bx-data`
Get raw BX warehouse data (JSON)

**Response:**
```json
{
  "summary": {
    "TotalPickingItems": 450,
    "TotalReceivingItems": 120
  },
  "picking": [...],
  "receiving": [...]
}
```

### Health & Monitoring

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T12:00:00Z"
}
```

### WebSocket

#### `WS /ws`
Real-time updates

**Connect:**
```javascript
const ws = new WebSocket('wss://signage.aquatiq.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

**Message Types:**
- `screen_status` - Screen online/offline
- `content_update` - Content modified
- `playlist_change` - Playlist updated
- `schedule_change` - Schedule modified

## 🗄️ Database Schema

### Tables

#### `screens`
Physical display management
```sql
- id (UUID, PK)
- name (VARCHAR)
- location (VARCHAR)
- mac_address (VARCHAR, UNIQUE)
- ip_address (VARCHAR)
- group_name (VARCHAR)
- is_online (BOOLEAN)
- last_seen (TIMESTAMP)
- current_content_id (UUID, FK)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `content`
Content library (URLs, videos, images, feeds)
```sql
- id (UUID, PK)
- name (VARCHAR)
- type (VARCHAR) -- 'url', 'video', 'image', 'feed'
- url (TEXT)
- duration (INTEGER) -- seconds
- thumbnail_url (TEXT)
- metadata (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `playlists`
Content rotation playlists
```sql
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- is_default (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `playlist_items`
Content items in playlists
```sql
- id (UUID, PK)
- playlist_id (UUID, FK)
- content_id (UUID, FK)
- order_index (INTEGER)
- duration_override (INTEGER)
- created_at (TIMESTAMP)
```

#### `schedules`
Time-based scheduling
```sql
- id (UUID, PK)
- screen_id (UUID, FK)
- playlist_id (UUID, FK)
- start_time (TIME)
- end_time (TIME)
- days_of_week (INTEGER[]) -- 0=Sun, 6=Sat
- start_date (DATE)
- end_date (DATE)
- priority (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `videos`
Uploaded and SharePoint videos
```sql
- id (UUID, PK)
- title (VARCHAR)
- description (TEXT)
- filename (VARCHAR)
- original_name (VARCHAR)
- sharepoint_url (TEXT)
- file_size (BIGINT)
- mime_type (VARCHAR)
- upload_date (TIMESTAMP)
- view_count (INTEGER)
- thumbnail_url (TEXT)
- metadata (JSONB)
```

#### `screen_status_logs`
Screen status history
```sql
- id (UUID, PK)
- screen_id (UUID, FK)
- status (VARCHAR) -- 'online', 'offline', 'error'
- content_id (UUID, FK)
- error_message (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### Indexes

Optimized for common queries:
```sql
idx_screens_online (is_online)
idx_screens_group (group_name)
idx_content_type (type)
idx_content_active (is_active)
idx_playlist_items_playlist (playlist_id)
idx_schedules_screen (screen_id)
idx_schedules_active (is_active)
idx_screen_logs_screen (screen_id)
idx_screen_logs_created (created_at)
```

## 🚀 Deployment

### Production Deployment (Docker)

1. **Configure environment**
   ```bash
   # Edit signage-server/.env with production values
   nano signage-server/.env
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d signage-server
   ```

3. **Initialize database**
   ```bash
   docker exec -i postgres.aquatiq-backend \
     psql -U postgres -d aquatiq_signage < signage-server/schema.sql
   ```

4. **Verify deployment**
   ```bash
   curl https://signage.aquatiq.com/health
   ```

### SSL/TLS Configuration

The server uses Traefik for automatic SSL:

```yaml
labels:
  - "traefik.http.routers.signage-server.rule=Host(`signage.aquatiq.com`)"
  - "traefik.http.routers.signage-server.entrypoints=websecure"
  - "traefik.http.routers.signage-server.tls=true"
  - "traefik.http.services.signage-server.loadbalancer.server.port=3002"
```

### Monitoring

**Health Check:**
```bash
curl https://signage.aquatiq.com/health
```

**Container Logs:**
```bash
docker logs aquatiq-signage-server -f
```

**Database Connection:**
```bash
docker exec -it postgres.aquatiq-backend \
  psql -U postgres -d aquatiq_signage
```

## 💻 Development

### Project Structure

```
signage-server/
├── src/
│   ├── index.ts              # Main server entry
│   ├── lib/
│   │   └── bx-session.ts     # BxSoftware session manager
│   ├── routes/
│   │   ├── screens.ts        # Screen CRUD
│   │   ├── content.ts        # Content CRUD
│   │   ├── playlists.ts      # Playlist CRUD
│   │   ├── schedules.ts      # Schedule CRUD
│   │   ├── screen-api.ts     # URL Launcher API
│   │   ├── videos.ts         # Video management
│   │   └── proxy.ts          # BX dashboard proxy
│   └── services/
│       ├── monitor.ts        # Screen monitoring
│       └── scheduler.ts      # Schedule execution
├── schema.sql                # Database schema
├── Dockerfile               # Container definition
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── .env                     # Environment variables
```

### Running Tests

```bash
# Start test environment
docker-compose up -d postgres signage-server

# Test endpoints
curl http://localhost:3002/health
curl http://localhost:3002/api/screens
curl http://localhost:3002/api/content
```

### Hot Reload Development

The development setup includes volume mounts for hot reload:

```yaml
volumes:
  - ./signage-server/src:/app/src  # Live TypeScript updates
```

### Adding New Features

1. **Create route file** in `src/routes/`
2. **Import and setup** in `src/index.ts`
3. **Update schema** if database changes needed
4. **Add types** for TypeScript safety
5. **Test locally** before deploying

### Code Style

- **Language**: TypeScript with strict mode
- **Formatting**: ESLint + Prettier (recommended)
- **Naming**: camelCase for variables, PascalCase for types
- **Async**: Use async/await over promises
- **Error Handling**: Try-catch blocks with proper logging

## 🎮 Player-Side Architecture

### Tizen/Samsung MagicInfo Compatibility

The signage system is designed to work with Samsung Tizen displays using the **MagicInfo URL Launcher** app. Key considerations:

#### JavaScript Architecture (Tizen-Safe)

**Browser Engine**: Tizen uses a Chromium-based browser with some limitations:
- No ES6 modules support in some firmware versions
- Limited localStorage capacity (5-10MB)
- Older JavaScript APIs (avoid modern ES2020+ features)
- No service workers in URL Launcher app

**Safe JavaScript Patterns:**

```javascript
// ✅ SAFE - Use IIFE pattern instead of modules
(function() {
  'use strict';
  
  // Polyfill for older Tizen browsers
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(search) {
      return this.indexOf(search) !== -1;
    };
  }
  
  // Main player logic
  var SignagePlayer = {
    config: {
      serverUrl: 'https://signage.aquatiq.com',
      macAddress: null,
      heartbeatInterval: 30000, // 30 seconds
      contentCheckInterval: 60000, // 1 minute
      fallbackContent: '/offline.html'
    },
    
    init: function() {
      this.detectMacAddress();
      this.startHeartbeat();
      this.loadCurrentContent();
    },
    
    detectMacAddress: function() {
      // Try multiple methods (Tizen API, URL param, stored)
      try {
        // Method 1: Tizen Network API
        if (typeof tizen !== 'undefined') {
          this.config.macAddress = tizen.systeminfo.getPropertyValue('NETWORK').mac;
        }
      } catch (e) {
        // Method 2: URL parameter
        var params = new URLSearchParams(window.location.search);
        this.config.macAddress = params.get('mac') || localStorage.getItem('mac');
      }
    },
    
    startHeartbeat: function() {
      var self = this;
      setInterval(function() {
        self.sendHeartbeat();
      }, this.config.heartbeatInterval);
    },
    
    sendHeartbeat: function() {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.config.serverUrl + '/api/screen-api/' + 
        this.config.macAddress + '/heartbeat', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        ip_address: this.getLocalIP(),
        content_id: this.currentContentId,
        timestamp: new Date().toISOString()
      }));
    },
    
    loadCurrentContent: function() {
      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', this.config.serverUrl + '/api/screen-api/' + 
        this.config.macAddress + '/current', true);
      xhr.onload = function() {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          self.displayContent(data);
        } else {
          self.displayFallback();
        }
      };
      xhr.onerror = function() {
        self.displayFallback();
      };
      xhr.send();
    },
    
    displayContent: function(data) {
      if (data.url) {
        window.location.href = data.url;
        this.scheduleNextContent(data.duration || 30);
      }
    },
    
    displayFallback: function() {
      window.location.href = this.config.fallbackContent;
    },
    
    scheduleNextContent: function(seconds) {
      var self = this;
      setTimeout(function() {
        self.loadCurrentContent();
      }, seconds * 1000);
    }
  };
  
  // Auto-start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      SignagePlayer.init();
    });
  } else {
    SignagePlayer.init();
  }
})();
```

**Key Requirements:**
- Use XMLHttpRequest (not fetch - limited support)
- Use `var` instead of `let`/`const` for older firmware
- Avoid arrow functions for maximum compatibility
- Use setTimeout/setInterval (no requestAnimationFrame in some versions)
- Test on actual Tizen devices (emulator differs)

#### Offline Fallback Strategy

The player implements multiple fallback levels:

```javascript
// Fallback hierarchy
var FallbackManager = {
  strategies: [
    // Level 1: Last known content from localStorage
    function() {
      var lastContent = localStorage.getItem('lastContent');
      if (lastContent) {
        return JSON.parse(lastContent);
      }
      return null;
    },
    
    // Level 2: Cached playlist from indexedDB
    function() {
      // Simplified for compatibility
      var cached = sessionStorage.getItem('cachedPlaylist');
      return cached ? JSON.parse(cached) : null;
    },
    
    // Level 3: Static fallback HTML
    function() {
      return {
        url: '/offline.html',
        duration: 300 // 5 minutes
      };
    },
    
    // Level 4: Company logo/image
    function() {
      return {
        url: '/fallback/aquatiq-logo.jpg',
        duration: 600 // 10 minutes
      };
    }
  ],
  
  getContent: function() {
    for (var i = 0; i < this.strategies.length; i++) {
      var content = this.strategies[i]();
      if (content) return content;
    }
    // Ultimate fallback: blank screen with message
    return {
      html: '<h1 style="color: white;">Kontakter server...</h1>',
      duration: 30
    };
  }
};
```

**Caching Strategy:**
1. **Content Preloading**: Download next 3 items in playlist during idle time
2. **Progressive Enhancement**: Cache essential assets first
3. **Storage Limits**: Monitor localStorage usage (max 5MB)
4. **Cache Invalidation**: Check server every 5 minutes for updates

#### Video Preloading & Smooth Transitions

```javascript
var VideoPreloader = {
  queue: [],
  preloaded: {},
  maxCacheSize: 50 * 1024 * 1024, // 50MB limit
  
  preloadNext: function(playlist, currentIndex) {
    var next = playlist[(currentIndex + 1) % playlist.length];
    if (next && next.type === 'video' && !this.preloaded[next.id]) {
      this.preloadVideo(next);
    }
  },
  
  preloadVideo: function(videoItem) {
    var video = document.createElement('video');
    video.preload = 'auto';
    video.src = videoItem.url;
    
    // Store reference
    this.preloaded[videoItem.id] = {
      element: video,
      timestamp: Date.now()
    };
    
    // Clean old cache
    this.cleanCache();
  },
  
  cleanCache: function() {
    var now = Date.now();
    var maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (var id in this.preloaded) {
      if (now - this.preloaded[id].timestamp > maxAge) {
        delete this.preloaded[id];
      }
    }
  },
  
  getPreloaded: function(videoId) {
    return this.preloaded[videoId] ? this.preloaded[videoId].element : null;
  }
};

// Smooth transition manager
var TransitionManager = {
  transition: function(from, to, callback) {
    // Crossfade effect
    from.style.transition = 'opacity 500ms';
    to.style.transition = 'opacity 500ms';
    
    from.style.opacity = '1';
    to.style.opacity = '0';
    to.style.display = 'block';
    
    setTimeout(function() {
      from.style.opacity = '0';
      to.style.opacity = '1';
    }, 10);
    
    setTimeout(function() {
      from.style.display = 'none';
      if (callback) callback();
    }, 510);
  }
};
```

## ⚖️ Scheduling Conflict Resolution

### Priority System

When multiple schedules overlap for the same screen, the system resolves conflicts using a **priority-based algorithm**:

#### Resolution Logic

```typescript
// Server-side scheduling resolver
interface Schedule {
  id: string;
  screen_id: string;
  playlist_id: string;
  start_time: string;    // "08:00:00"
  end_time: string;      // "17:00:00"
  days_of_week: number[]; // [1,2,3,4,5]
  start_date: string;    // "2026-02-01"
  end_date: string;      // "2026-12-31"
  priority: number;      // Higher = more important
  is_active: boolean;
}

function resolveScheduleConflicts(
  schedules: Schedule[], 
  currentTime: Date
): Schedule | null {
  // Filter applicable schedules
  const applicable = schedules.filter(schedule => {
    if (!schedule.is_active) return false;
    
    // Check date range
    const now = currentTime.toISOString().split('T')[0];
    if (schedule.start_date && now < schedule.start_date) return false;
    if (schedule.end_date && now > schedule.end_date) return false;
    
    // Check day of week (0=Sunday, 6=Saturday)
    const dayOfWeek = currentTime.getDay();
    if (schedule.days_of_week && 
        !schedule.days_of_week.includes(dayOfWeek)) return false;
    
    // Check time range
    const currentTimeStr = currentTime.toTimeString().slice(0, 8);
    if (schedule.start_time && currentTimeStr < schedule.start_time) return false;
    if (schedule.end_time && currentTimeStr > schedule.end_time) return false;
    
    return true;
  });
  
  if (applicable.length === 0) {
    // No schedules apply - use default playlist
    return null;
  }
  
  // Sort by priority (descending)
  applicable.sort((a, b) => b.priority - a.priority);
  
  // Return highest priority
  return applicable[0];
}
```

#### Priority Levels

| Priority | Use Case | Example |
|----------|----------|---------|
| 0 | Default/Normal | Regular rotation |
| 1 | Scheduled events | Weekly meetings |
| 2 | Important announcements | Company news |
| 3 | Emergency content | Safety alerts |
| 4 | Critical override | Fire evacuation |

#### Conflict Examples

**Example 1: Time Overlap**
```
Screen: Reception Display
Time: Monday 14:00

Schedule A: Mon-Fri 08:00-17:00, Priority 0 (Default playlist)
Schedule B: Monday 14:00-15:00, Priority 2 (All-hands meeting)

Result: Schedule B wins (higher priority)
```

**Example 2: Date Range Conflict**
```
Screen: Lobby Display
Time: 2026-02-15 10:00

Schedule A: 2026-01-01 to 2026-12-31, Priority 1 (Year-round content)
Schedule B: 2026-02-10 to 2026-02-20, Priority 3 (Product launch)

Result: Schedule B wins (higher priority + active date range)
```

**Example 3: No Active Schedule**
```
Screen: Cafeteria Display
Time: Saturday 20:00

Schedule A: Mon-Fri 08:00-18:00, Priority 1 (Office hours)
Schedule B: Inactive

Result: Default playlist (no applicable schedules)
```

#### Schedule Transition Behavior

```javascript
// Player-side: Check for schedule changes every minute
var ScheduleChecker = {
  lastScheduleId: null,
  
  checkInterval: function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', serverUrl + '/api/screen-api/' + macAddress + '/current', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        
        // Schedule changed?
        if (data.schedule_id !== ScheduleChecker.lastScheduleId) {
          console.log('Schedule changed, reloading content...');
          ScheduleChecker.lastScheduleId = data.schedule_id;
          window.location.reload(); // Smooth transition to new content
        }
      }
    };
    xhr.send();
  }
};

// Check every minute
setInterval(function() {
  ScheduleChecker.checkInterval();
}, 60000);
```

## 🔮 Future-Proofing & Scalability

### Supporting More Screens

The architecture is designed to scale from **1 screen to 1000+ screens**:

#### Database Optimization

```sql
-- Partitioning for high-volume status logs
CREATE TABLE screen_status_logs_2026_02 PARTITION OF screen_status_logs
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  partition_date date := date_trunc('month', CURRENT_DATE);
  partition_name text := 'screen_status_logs_' || to_char(partition_date, 'YYYY_MM');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF screen_status_logs
     FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    partition_date,
    partition_date + interval '1 month'
  );
END;
$$ LANGUAGE plpgsql;
```

#### Horizontal Scaling Strategy

```yaml
# Load-balanced signage servers
version: '3.8'
services:
  signage-server-1:
    image: aquatiq-signage-server
    environment:
      - INSTANCE_ID=1
    deploy:
      replicas: 3
      
  signage-server-2:
    image: aquatiq-signage-server
    environment:
      - INSTANCE_ID=2
    deploy:
      replicas: 3
      
  load-balancer:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    ports:
      - "3002:80"
```

**Load Balancer Configuration:**
```nginx
upstream signage_backend {
  least_conn; # Load balance based on connections
  
  server signage-server-1:3002 max_fails=3 fail_timeout=30s;
  server signage-server-2:3002 max_fails=3 fail_timeout=30s;
  server signage-server-3:3002 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  
  location / {
    proxy_pass http://signage_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  
  # Sticky sessions for WebSocket
  location /ws {
    proxy_pass http://signage_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_read_timeout 86400;
  }
}
```

#### Screen Groups & Hierarchical Management

```typescript
// Hierarchical screen organization
interface ScreenGroup {
  id: string;
  name: string;
  parent_id?: string; // For nested groups
  metadata: {
    location: string;
    department: string;
    building: string;
    floor: number;
  };
}

// Bulk operations
async function updateGroupContent(
  groupId: string, 
  contentId: string
): Promise<void> {
  const screens = await pool.query(
    'SELECT id FROM screens WHERE group_name = $1',
    [groupId]
  );
  
  // Update all screens in parallel
  await Promise.all(
    screens.rows.map(screen =>
      pool.query(
        'UPDATE screens SET current_content_id = $1 WHERE id = $2',
        [contentId, screen.id]
      )
    )
  );
  
  // Broadcast update via WebSocket
  broadcastUpdate({
    type: 'group_update',
    group_id: groupId,
    content_id: contentId,
    screens: screens.rows.map(s => s.id)
  });
}
```

### Geographic Distribution

For multi-site deployments:

```typescript
// Regional server configuration
interface RegionalConfig {
  region: string;
  serverUrl: string;
  fallbackUrl: string;
  latencyThreshold: number; // ms
}

const regions: RegionalConfig[] = [
  {
    region: 'norway',
    serverUrl: 'https://signage.aquatiq.com',
    fallbackUrl: 'https://signage-backup.aquatiq.com',
    latencyThreshold: 100
  },
  {
    region: 'international',
    serverUrl: 'https://signage-global.aquatiq.com',
    fallbackUrl: 'https://signage.aquatiq.com',
    latencyThreshold: 200
  }
];

// Auto-select best server based on latency
async function selectOptimalServer(): Promise<string> {
  const tests = await Promise.all(
    regions.map(async region => {
      const start = Date.now();
      try {
        await fetch(`${region.serverUrl}/health`);
        const latency = Date.now() - start;
        return { region, latency };
      } catch {
        return { region, latency: Infinity };
      }
    })
  );
  
  tests.sort((a, b) => a.latency - b.latency);
  return tests[0].region.serverUrl;
}
```

## 🏢 Reusable Internal Platform

### White-Label Configuration

Transform the signage server into a **multi-tenant platform** for different departments or clients:

#### Tenant Isolation

```sql
-- Add tenant support to all tables
ALTER TABLE screens ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE content ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE playlists ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Tenant table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row-level security
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON screens
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

#### Branding Customization

```typescript
interface TenantBranding {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  custom_css?: string;
}

interface TenantSettings {
  features: {
    videos: boolean;
    schedules: boolean;
    bx_integration: boolean;
  };
  limits: {
    max_screens: number;
    max_storage_mb: number;
  };
  integrations: {
    allowed_domains: string[];
    api_keys: Record<string, string>;
  };
}

// Middleware for tenant context
app.use((req, res, next) => {
  const tenantDomain = req.headers.host;
  const tenant = getTenantByDomain(tenantDomain);
  
  if (tenant) {
    req.tenant = tenant;
    // Set PostgreSQL session variable
    pool.query(
      `SET app.current_tenant = '${tenant.id}'`
    );
  }
  
  next();
});
```

#### API Key Management

```typescript
// Per-tenant API access
interface ApiKey {
  id: string;
  tenant_id: string;
  key: string; // Hashed
  name: string;
  permissions: string[];
  rate_limit: number; // requests per minute
  expires_at?: Date;
}

// Rate limiting per tenant
const rateLimiters = new Map<string, RateLimiter>();

function getTenantRateLimiter(tenantId: string): RateLimiter {
  if (!rateLimiters.has(tenantId)) {
    rateLimiters.set(tenantId, new RateLimiter({
      windowMs: 60000, // 1 minute
      max: 100 // 100 requests per minute per tenant
    }));
  }
  return rateLimiters.get(tenantId)!;
}
```

#### Multi-Tenant Deployment

```yaml
# Docker Compose for multi-tenant deployment
version: '3.8'

services:
  signage-server:
    image: aquatiq-signage-server:latest
    environment:
      - MULTI_TENANT=true
      - DEFAULT_TENANT_ID=${DEFAULT_TENANT_ID}
    volumes:
      - tenant-data:/app/data
    labels:
      - "traefik.enable=true"
      # Tenant 1: Aquatiq
      - "traefik.http.routers.tenant1.rule=Host(`signage.aquatiq.com`)"
      - "traefik.http.routers.tenant1.tls=true"
      # Tenant 2: Client A
      - "traefik.http.routers.tenant2.rule=Host(`signage.client-a.com`)"
      - "traefik.http.routers.tenant2.tls=true"
      # Tenant 3: Client B
      - "traefik.http.routers.tenant3.rule=Host(`signage.client-b.com`)"
      - "traefik.http.routers.tenant3.tls=true"
```

### Plugin Architecture

Extend functionality without modifying core code:

```typescript
// Plugin interface
interface SignagePlugin {
  name: string;
  version: string;
  init: (app: Express, pool: Pool) => void;
  routes?: PluginRoute[];
  hooks?: PluginHooks;
}

interface PluginRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: RequestHandler;
}

interface PluginHooks {
  beforeContentDisplay?: (content: Content) => Content;
  afterScreenHeartbeat?: (screen: Screen) => void;
  onScheduleChange?: (schedule: Schedule) => void;
}

// Plugin manager
class PluginManager {
  private plugins: Map<string, SignagePlugin> = new Map();
  
  register(plugin: SignagePlugin): void {
    console.log(`Registering plugin: ${plugin.name} v${plugin.version}`);
    
    // Initialize plugin
    plugin.init(app, pool);
    
    // Register routes
    if (plugin.routes) {
      plugin.routes.forEach(route => {
        app[route.method.toLowerCase()](
          `/plugins/${plugin.name}${route.path}`,
          route.handler
        );
      });
    }
    
    this.plugins.set(plugin.name, plugin);
  }
  
  executeHook(hookName: keyof PluginHooks, data: any): any {
    let result = data;
    
    this.plugins.forEach(plugin => {
      if (plugin.hooks && plugin.hooks[hookName]) {
        result = plugin.hooks[hookName]!(result);
      }
    });
    
    return result;
  }
}

// Example plugin: Weather display
const weatherPlugin: SignagePlugin = {
  name: 'weather',
  version: '1.0.0',
  
  init: (app, pool) => {
    console.log('Weather plugin initialized');
  },
  
  routes: [
    {
      method: 'GET',
      path: '/current',
      handler: async (req, res) => {
        const weather = await fetchWeather();
        res.json(weather);
      }
    }
  ],
  
  hooks: {
    beforeContentDisplay: (content) => {
      // Inject weather data into content
      if (content.metadata?.showWeather) {
        content.metadata.currentWeather = getCachedWeather();
      }
      return content;
    }
  }
};

// Register plugins
pluginManager.register(weatherPlugin);
```

### Configuration Templates

Pre-built templates for common scenarios:

```typescript
interface DeploymentTemplate {
  name: string;
  description: string;
  screens: Partial<Screen>[];
  content: Partial<Content>[];
  playlists: Partial<Playlist>[];
  schedules: Partial<Schedule>[];
}

const templates: DeploymentTemplate[] = [
  {
    name: 'office-basic',
    description: 'Basic office setup with 3 screens',
    screens: [
      { name: 'Reception', location: 'Entrance', group_name: 'Office' },
      { name: 'Cafeteria', location: 'Break Room', group_name: 'Office' },
      { name: 'Meeting Room', location: 'Conference', group_name: 'Office' }
    ],
    content: [
      { name: 'Company Dashboard', type: 'url', url: 'https://dashboard.company.com', duration: 60 },
      { name: 'News Feed', type: 'feed', url: 'https://news.company.com/rss', duration: 30 }
    ],
    playlists: [
      { name: 'Default Rotation', is_default: true }
    ],
    schedules: [
      { 
        start_time: '08:00:00', 
        end_time: '17:00:00', 
        days_of_week: [1,2,3,4,5],
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
      { name: 'BX Dashboard', type: 'url', url: '/proxy/logistic-dashboard-embed', duration: 30 }
    ],
    playlists: [
      { name: 'Warehouse Feed', is_default: true }
    ],
    schedules: []
  }
];

// API to apply template
app.post('/api/templates/:name/apply', async (req, res) => {
  const template = templates.find(t => t.name === req.params.name);
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  // Apply template (create screens, content, playlists, schedules)
  const result = await applyTemplate(template, req.body.tenantId);
  
  res.json({ success: true, result });
});
```

## 📖 Documentation

- **Frontend Integration**: See `/apps/frontend/src/app/(dashboard)/signage/page.tsx`
- **Consolidation Details**: See `CONSOLIDATION-COMPLETE.md`
- **BX Integration**: See `BX-INTEGRATION.md`
- **Local Testing**: See `LOCAL-TESTING.md`
- **Deployment Guide**: See `SIGNAGE-README.md`

## 🤝 Integration with Frontend

The signage server is consumed by a Next.js frontend with 6 management tabs:

1. **Screens Tab** - Monitor and manage displays
2. **Content Tab** - Manage content library
3. **Playlists Tab** - Create content rotations
4. **Schedules Tab** - Configure time-based scheduling
5. **Videos Tab** - Upload and manage videos
6. **BX Dashboard Tab** - View warehouse statistics

**Frontend Repository**: `apps/frontend/`  
**Signage UI**: `https://tools.aquatiq.com/signage`

## 🔒 Security

### Authentication
- BxSoftware credentials stored server-side only
- 12-hour session caching to minimize login requests
- Environment variables for sensitive data
- No client-side credential exposure

### API Security
- CORS enabled with origin validation
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- File upload size limits
- Content-type validation

### Network Security
- HTTPS/TLS encryption (Traefik)
- WebSocket secure (WSS)
- Docker network isolation
- PostgreSQL connection pooling

## 📊 Performance

### Optimizations
- Database connection pooling (max 20)
- Content caching with ETags
- Video streaming with range requests
- WebSocket for real-time updates (vs polling)
- Scheduled tasks with cron (vs constant polling)
- BxSoftware session caching (12-hour lifetime)

### Scalability
- Stateless design (horizontal scaling ready)
- Persistent volume for video storage
- Database indexes on common queries
- Automatic offline detection (30s intervals)

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs aquatiq-signage-server

# Verify environment
docker exec aquatiq-signage-server env | grep POSTGRES
```

### Database Connection Errors
```bash
# Test PostgreSQL connection
docker exec -it postgres.aquatiq-backend psql -U postgres -l

# Check database exists
docker exec postgres.aquatiq-backend psql -U postgres -c "\l aquatiq_signage"
```

### Video Upload Fails
```bash
# Check volume exists
docker volume ls | grep signage-videos

# Verify permissions
docker exec aquatiq-signage-server ls -la /app/videos
```

### BX Dashboard Not Loading
```bash
# Check BX credentials
docker exec aquatiq-signage-server env | grep BX_

# Test BX API manually
curl -X POST https://api.bxsoftware.no/1.0/Login \
  -H "Content-Type: application/json" \
  -d '{"username":"...","password":"...","companycode":"..."}'
```

## 📝 License

Internal Aquatiq project - All rights reserved

## 👥 Contributors

- **Aquatiq Development Team**

## 🔗 Related Projects

- **Frontend**: Aquatiq Tools Frontend (Next.js)
- **Screenshot Server**: Puppeteer-based screenshot capture
- **YouTube Proxy**: Video proxy service

---

**Last Updated**: February 2, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

For questions or support, contact the Aquatiq development team.
