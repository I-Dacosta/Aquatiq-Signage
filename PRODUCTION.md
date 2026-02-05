# Aquatiq Digital Signage - Production Deployment

## Overview
Complete digital signage solution integrated with **Aquatiq Root Container** shared infrastructure.

**Key Integration Points:**
- ✅ Uses shared PostgreSQL 17 from Aquatiq Root Container
- ✅ Connects via `aquatiq-local` Docker network
- ✅ No standalone database - reduced resource usage
- ✅ Automatic pgvector extension support
- ✅ Consistent credentials across infrastructure

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Aquatiq Root Container (Shared)                 │
│  - PostgreSQL 17 (postgres:5432)                        │
│  - Redis, NATS, MinIO, n8n, pgAdmin, RedisInsight      │
└─────────────────────────────────────────────────────────┘
              ▲
              │ aquatiq-local network
              │
┌─────────────────────────────────────────────────────────┐
│         Aquatiq Signage Services                        │
│  - signage-server:3002 (API + Content Management)      │
│  - youtube-proxy:8085 (YouTube content)                │
│  - screenshot-server:3003 (Screenshot automation)      │
│  - ntp-server:123 (Time sync for displays)             │
└─────────────────────────────────────────────────────────┘
```

**Components:**
- **Signage Server**: Express.js API for content management
- **YouTube Proxy**: Proxy for YouTube content delivery
- **Screenshot Server**: Automated screenshot service
- **NTP Server**: Network Time Protocol for display synchronization
- **Shared PostgreSQL**: From Aquatiq Root Container (no separate DB)

## Prerequisites

### Required
1. **Aquatiq Root Container** must be running first
   ```bash
   cd ../aquatiq-root-container
   ./start-local.sh  # For local development
   ```
   
2. **Docker & Docker Compose**
   - Docker Engine 24.0+
   - Docker Compose v2.20+

3. **Network Requirements**
   - `aquatiq-local` Docker network (created by Aquatiq Root Container)
   
4. **Resource Requirements**
   - 2GB+ RAM (in addition to Aquatiq Root Container)
   - 5GB+ disk space

### Verification
```bash
# Verify Aquatiq Root Container is running
docker ps | grep aquatiq-.*-local

# Verify network exists
docker network inspect aquatiq-local

# Verify PostgreSQL is accessible
docker exec aquatiq-postgres-local psql -U aquatiq -c "SELECT version();"
```

## Quick Start

### 1. Ensure Aquatiq Root Container is Running

```bash
# Start shared infrastructure
cd ../aquatiq-root-container
./start-local.sh

# Return to signage directory
cd ../aquatiq-digital-signage
```

### 2. Configuration

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values (defaults match Aquatiq Root Container):
```env
# PostgreSQL (shared from Aquatiq Root Container)
POSTGRES_USER=aquatiq
POSTGRES_PASSWORD=postgres
POSTGRES_DB=aquatiq_signage

NODE_ENV=development

# Optional integrations
BXSOFTWARE_USERNAME=
BXSOFTWARE_PASSWORD=
BXSOFTWARE_BASE_URL=

SHAREPOINT_SITE_URL=
SHAREPOINT_CLIENT_ID=
SHAREPOINT_CLIENT_SECRET=
SHAREPOINT_TENANT_ID=
```

### 3. Setup Database

```bash
# Run database setup script
./setup-database.sh
```

This creates the `aquatiq_signage` database in the shared PostgreSQL and applies the schema.

### 4. Deploy

```bash
docker compose up -d --build
```

### 5. Verify Deployment

Check all services are running:
```bash
docker compose ps
```

Check logs:
```bash
docker compose logs -f signage-server
```

Test API:
```bash
curl http://localhost:3002/api/screens
```

Verify database connection:
```bash
docker exec aquatiq-postgres-local psql -U aquatiq -d aquatiq_signage -c "\dt"
```

## Service URLs

| Service | Internal URL | External URL |
|---------|--------------|--------------|
| Signage Server | http://aquatiq-signage-server:3002 | https://signage.sensilist.com |
| PostgreSQL | aquatiq-postgres:5432 | Not exposed externally |
| YouTube Proxy | http://aquatiq-youtube-proxy:8085 | https://youtube.sensilist.com |
| Screenshot Server | http://aquatiq-screenshot-server:3003 | https://signage.sensilist.com/screenshot |
| NTP Server | aquatiq-ntp:123 | UDP port 123 |

## Docker Network Architecture

### Internal Communication
Services communicate via Docker container names:
- Frontend → `aquatiq-signage-server:3002`
- Signage Server → `aquatiq-postgres:5432`
- All services on `aquatiq-net` network

### External Access
Services exposed via Traefik on `taskpriority_internal` network with:
- Automatic SSL via Let's Encrypt
- Domain-based routing
- Load balancing

## Database

### Schema Initialization
Database schema is automatically initialized from `signage-server/schema.sql` on first run.

### Backup
```bash
docker compose exec postgres pg_dump -U postgres aquatiq_signage > backup.sql
```

### Restore
```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres aquatiq_signage
```

## Monitoring

### Health Checks
PostgreSQL has automated health checks. View status:
```bash
docker inspect aquatiq-postgres | jq '.[0].State.Health'
```

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f signage-server
docker compose logs -f postgres
```

## Updating

### Pull Latest Code
```bash
git pull origin main
```

### Rebuild and Deploy
```bash
docker compose up -d --build
```

### Zero-Downtime Update
```bash
docker compose up -d --no-deps --build signage-server
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker compose logs signage-server

# Check container status
docker compose ps

# Restart service
docker compose restart signage-server
```

### Database Connection Issues
```bash
# Verify database is running
docker compose exec postgres pg_isready -U postgres

# Check connection from signage-server
docker compose exec signage-server nc -zv aquatiq-postgres 5432
```

### Reset Everything
```bash
docker compose down -v
docker compose up -d --build
```

## Security Considerations

1. **Change Default Passwords**: Update `POSTGRES_PASSWORD` in `.env`
2. **Secrets Management**: Use Docker secrets or external secret manager in production
3. **Network Isolation**: Database only accessible within Docker network
4. **SSL/TLS**: All external traffic encrypted via Traefik
5. **Firewall**: Only expose necessary ports (80, 443, 123)

## Performance Tuning

### PostgreSQL
Adjust in docker-compose.yml:
```yaml
environment:
  - POSTGRES_MAX_CONNECTIONS=100
  - POSTGRES_SHARED_BUFFERS=256MB
```

### Node.js Memory
```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
```

## Volumes

Persistent data stored in Docker volumes:
- `postgres-data`: Database files
- `signage-videos`: Uploaded video files
- `screenshot-storage`: Generated screenshots

## Support

For issues, check:
1. Service logs: `docker compose logs -f`
2. Container status: `docker compose ps`
3. Network connectivity: `docker network inspect aquatiq-net`

## Development vs Production

### Development
Set in `.env`:
```
NODE_ENV=development
```
- Source code hot-reload enabled
- Verbose logging
- Debug endpoints available

### Production
Set in `.env`:
```
NODE_ENV=production
```
- Optimized builds
- Reduced logging
- Security hardening
