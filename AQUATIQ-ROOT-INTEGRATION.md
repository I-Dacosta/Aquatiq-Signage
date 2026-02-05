# Aquatiq Root Container Integration

> **Integration Date:** February 5, 2026  
> **Status:** ✅ Complete

## Overview

The Aquatiq Signage system has been integrated with the **Aquatiq Root Container** shared infrastructure to eliminate resource duplication and provide consistent environment management.

## What Changed

### Before Integration
```
Aquatiq Signage (Standalone)
├── postgres:16-alpine (dedicated instance)
├── signage-server
├── youtube-proxy
├── screenshot-server
└── ntp-server
```

**Issues:**
- Separate PostgreSQL instance consuming ~200MB RAM
- Duplicate credentials and configuration
- Manual extension management (pgvector)
- No shared infrastructure benefits

### After Integration
```
Aquatiq Root Container (Shared)
├── PostgreSQL 17 (postgres:5432)
├── Redis, NATS, MinIO, n8n
├── pgAdmin, RedisInsight, Aquatiq Gateway
└── Automatic pgvector extension
        ▲
        │ (aquatiq-local network)
        │
Aquatiq Signage Services
├── signage-server (connects to shared postgres)
├── youtube-proxy
├── screenshot-server
└── ntp-server
```

**Benefits:**
✅ ~200MB RAM savings (no duplicate PostgreSQL)  
✅ Shared credentials from centralized `.env.local`  
✅ Automatic pgvector extension in all databases  
✅ Access to Redis, NATS, MinIO for future features  
✅ Unified monitoring via pgAdmin and RedisInsight  
✅ Production-ready architecture from day one  

## Technical Changes

### 1. Docker Compose (`docker-compose.yml`)

**Removed:**
- Standalone `postgres` service
- `postgres-data` volume
- `aquatiq-net` internal network
- `taskpriority_internal` network reference
- All Traefik labels (signage.sensilist.com, youtube.sensilist.com)

**Updated:**
- All services now use `aquatiq-local` external network
- `signage-server` connects to `postgres:5432` (shared container)
- Port binding changed to `127.0.0.1:3002:3002` (localhost only)
- `POSTGRES_HOST=postgres` (container name from Aquatiq Root Container)
- `POSTGRES_USER=aquatiq` (matches Aquatiq Root Container default)

### 2. Environment Configuration (`.env.example`)

**Updated credentials to match Aquatiq Root Container defaults:**
```env
POSTGRES_USER=aquatiq          # Was: postgres
POSTGRES_PASSWORD=postgres     # Default for local dev
POSTGRES_DB=aquatiq_signage
```

Added comment: 
> "These should match the credentials in your aquatiq-root-container/.env.local"

### 3. Database Setup (`setup-database.sh`)

**New automated setup script:**
```bash
./setup-database.sh
```

**Features:**
- Verifies Aquatiq Root Container is running
- Creates `aquatiq_signage` database if missing
- Applies `signage-server/schema.sql`
- Enables pgvector extension automatically
- Provides connection details

### 4. Documentation (`PRODUCTION.md`)

**Major updates:**
- Added prerequisites section requiring Aquatiq Root Container
- Updated architecture diagram showing shared infrastructure
- New verification steps for shared services
- Connection examples using container hostnames
- Troubleshooting section for integration issues

## Migration Guide

### For Existing Deployments

If you have an existing standalone deployment:

#### 1. Backup Current Data
```bash
# Export current database
docker exec aquatiq-postgres pg_dump -U postgres aquatiq_signage > backup.sql
```

#### 2. Stop Old Stack
```bash
docker compose down
```

#### 3. Start Aquatiq Root Container
```bash
cd ../aquatiq-root-container
./start-local.sh
```

#### 4. Import Data to Shared PostgreSQL
```bash
cd ../aquatiq-digital-signage
docker exec -i aquatiq-postgres-local psql -U aquatiq -c "CREATE DATABASE aquatiq_signage;"
docker exec -i aquatiq-postgres-local psql -U aquatiq aquatiq_signage < backup.sql
```

#### 5. Start New Stack
```bash
# Update docker-compose.yml (already done in this commit)
docker compose up -d --build
```

### For Fresh Deployments

Just follow the normal process:

```bash
# 1. Start Aquatiq Root Container
cd ../aquatiq-root-container
./start-local.sh

# 2. Setup signage database
cd ../aquatiq-digital-signage
./setup-database.sh

# 3. Start signage services
docker compose up -d --build
```

## Connection Examples

### From Host Machine (Development)
```bash
# PostgreSQL
psql -h localhost -p 5432 -U aquatiq -d aquatiq_signage

# API endpoint
curl http://localhost:3002/api/screens
```

### From Docker Containers
```yaml
services:
  your-app:
    environment:
      DATABASE_URL: postgres://aquatiq:postgres@postgres:5432/aquatiq_signage
      REDIS_URL: redis://:redis@redis:6379
      NATS_URL: nats://nats:4222?token=nats
      MINIO_ENDPOINT: http://minio:9000
    networks:
      - aquatiq-local

networks:
  aquatiq-local:
    external: true
```

### From Backend Code (Node.js)
```javascript
// PostgreSQL
const pool = new Pool({
  host: 'postgres',      // Container name
  port: 5432,
  database: 'aquatiq_signage',
  user: 'aquatiq',
  password: 'postgres'
});

// Redis (if needed in future)
const redis = require('redis');
const client = redis.createClient({
  host: 'redis',
  port: 6379,
  password: 'redis'
});
```

## Troubleshooting

### "Connection refused" errors

**Check if Aquatiq Root Container is running:**
```bash
docker ps | grep aquatiq-postgres-local
```

**If not running:**
```bash
cd ../aquatiq-root-container
./start-local.sh
```

### "Database does not exist"

**Run the setup script:**
```bash
./setup-database.sh
```

### "Network aquatiq-local not found"

The Aquatiq Root Container creates this network automatically. Start it first:
```bash
cd ../aquatiq-root-container
./start-local.sh
```

### Services can't connect to postgres

**Verify network connection:**
```bash
docker network inspect aquatiq-local | grep -A 5 aquatiq-signage-server
docker network inspect aquatiq-local | grep -A 5 aquatiq-postgres-local
```

Both should be on the same network.

### Wrong credentials

**Check your `.env` matches Aquatiq Root Container:**
```bash
# In aquatiq-root-container/.env.local
cat ../aquatiq-root-container/.env.local | grep POSTGRES

# In aquatiq-digital-signage/.env
cat .env | grep POSTGRES
```

They should match (default: `aquatiq` / `postgres`).

## Future Enhancements

Now that we're integrated with Aquatiq Root Container, we can easily add:

- **Redis caching**: For API responses and session management
- **NATS messaging**: For real-time screen updates
- **MinIO storage**: For video and image assets
- **n8n workflows**: For automated content scheduling
- **Aquatiq Gateway**: For centralized API management

All these services are already running and available via the `aquatiq-local` network!

## Rollback

If you need to revert to standalone mode:

```bash
# Checkout previous version
git checkout dcb6cfa  # Commit before integration

# Start with standalone database
docker compose up -d --build
```

## Support

For issues related to:
- **Shared infrastructure**: See `aquatiq-root-container/README.md`
- **Signage services**: See `PRODUCTION.md` in this repository
- **Database setup**: Run `./setup-database.sh` with `-h` flag

## References

- [Aquatiq Root Container README](../aquatiq-root-container/README.md)
- [Production Deployment Guide](./PRODUCTION.md)
- [Database Schema](./signage-server/schema.sql)
- [Environment Configuration](./env.example)
