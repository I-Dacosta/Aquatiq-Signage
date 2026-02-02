# Aquatiq Digital Signage Control Center

Complete Docker-based digital signage system with YouTube proxy, NTP synchronization, and modern dashboard.

## 🧠 Architecture

- **YouTube Proxy**: Streams YouTube videos as MP4 for MagicINFO compatibility
- **NTP Server**: Provides accurate time synchronization
- **Dashboard**: Next.js control panel for managing videos and monitoring system

## 🚀 Quick Start

1. **Clone and navigate**:
```bash
cd aquatiq-digital-signage
```

2. **Build and run all services**:
```bash
docker compose up -d
```

3. **Access the dashboard**:
```
http://localhost:3000
```

4. **Test the proxy**:
```
http://localhost:8085/stream?v=GMtfScXZ118
```

## 📋 Services

| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3000 | Control panel and video management |
| YouTube Proxy | 8085 | Converts YouTube to MP4 streams |
| NTP Server | 123/udp | Time synchronization |

## 🎯 How to Use

### 1. Add Videos via Dashboard
- Open http://localhost:3000
- Enter YouTube video ID (e.g., `GMtfScXZ118`)
- Click "Add Video"

### 2. Generate MagicINFO URLs
- Click "Copy URL" next to any video
- Use this URL in MagicINFO Web Content

### 3. Create MagicINFO HTML
```html
<video autoplay muted loop playsinline width="100%" height="100%">
  <source src="http://YOUR_SERVER_IP:8085/stream?v=VIDEO_ID" type="video/mp4">
</video>
```

### 4. Deploy to Screens
- Upload the HTML as Web Content in MagicINFO
- Schedule and publish normally

## 🔧 Configuration

### Environment Variables

**Proxy** (`proxy/.env`):
```env
PORT=8085
BASIC_AUTH_USER=admin    # Optional
BASIC_AUTH_PASS=secret   # Optional
```

**Dashboard** (via docker-compose.yml):
```env
NEXT_PUBLIC_PROXY_URL=http://localhost:8085
TZ=Europe/Oslo
```

### Custom NTP Servers
Edit `docker-compose.yml`:
```yaml
ntp-server:
  environment:
    - NTP_SERVERS=your.ntp.server,backup.ntp.server
```

## 📊 Features

### Dashboard
- ✅ Real-time system monitoring
- ✅ Video library management
- ✅ URL generation for MagicINFO
- ✅ System status overview
- ✅ Time synchronization display

### YouTube Proxy
- ✅ Converts YouTube to MP4 streams
- ✅ Video quality optimization
- ✅ Error handling and cleanup
- ✅ Optional basic authentication
- ✅ Health monitoring API

### NTP Server
- ✅ Accurate time synchronization
- ✅ Norwegian NTP pool by default
- ✅ Container-based deployment

## 🛠 Development

### Local Development
```bash
# Proxy only
cd proxy && npm install && npm start

# Dashboard only
cd dashboard && npm install && npm run dev
```

### Production Deployment
```bash
# Build optimized images
docker compose build

# Run in production mode
docker compose up -d
```

## 🔒 Security

### Basic Authentication
Enable in `proxy/.env`:
```env
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=your-secure-password
```

### HTTPS (Optional)
Add reverse proxy (Caddy/Nginx) in front for SSL termination.

## 🔍 Troubleshooting

### Check Service Status
```bash
docker compose ps
docker compose logs [service-name]
```

### Common Issues

**Videos not playing**: Check YouTube video ID and network connectivity
**Time sync issues**: Verify NTP server accessibility
**Dashboard not loading**: Check if all services are running

### Health Checks
- Proxy: `http://localhost:8085/health`
- Dashboard: `http://localhost:3000`
- System status: Dashboard → System Status cards

## 📝 Notes

- **Memory usage**: ~300MB total for all services
- **Storage**: No persistent video storage (streams on-demand)
- **Compatibility**: Works with MagicINFO and all Samsung SSSP displays
- **Scalability**: Can handle multiple concurrent streams

## 🤝 Integration

This system integrates with your existing MagicINFO setup:
- **MagicINFO**: Handles scheduling, publishing, and device management
- **Proxy**: Provides reliable video streams
- **Dashboard**: Offers modern management interface
- **NTP**: Ensures accurate time across all displays

The dashboard complements (doesn't replace) MagicINFO's core functionality.