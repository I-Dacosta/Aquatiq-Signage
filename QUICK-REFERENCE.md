# Aquatiq Signage - Quick Reference

## 🚀 Quick Start Commands

### First Time Setup
```bash
# 1. Start Aquatiq Root Container (shared infrastructure)
cd ../aquatiq-root-container
./start-local.sh

# 2. Setup signage database
cd ../aquatiq-digital-signage
cp .env.example .env  # Edit if needed
./setup-database.sh

# 3. Start signage services
docker compose up -d --build
```

### Daily Development
```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f signage-server

# Restart a service
docker compose restart signage-server

# Stop everything
docker compose down
```

### Database Operations
```bash
# Connect to PostgreSQL
docker exec -it aquatiq-postgres-local psql -U aquatiq -d aquatiq_signage

# Run migrations
docker exec -i aquatiq-postgres-local psql -U aquatiq aquatiq_signage < signage-server/schema.sql

# List tables
docker exec aquatiq-postgres-local psql -U aquatiq -d aquatiq_signage -c "\dt"

# Backup database
docker exec aquatiq-postgres-local pg_dump -U aquatiq aquatiq_signage > backup.sql

# Restore database
docker exec -i aquatiq-postgres-local psql -U aquatiq aquatiq_signage < backup.sql
```

### Testing
```bash
# Test API endpoints
curl http://localhost:3002/api/screens
curl http://localhost:3002/api/content
curl http://localhost:3002/api/playlists

# Test database connection
docker exec aquatiq-postgres-local psql -U aquatiq -d aquatiq_signage -c "SELECT COUNT(*) FROM screens;"

# Check service health
docker compose ps
docker compose logs --tail=50 signage-server
```

### Troubleshooting
```bash
# Check if Aquatiq Root Container is running
docker ps | grep aquatiq-.*-local

# Check network connection
docker network inspect aquatiq-local

# Restart everything
docker compose down
cd ../aquatiq-root-container && ./start-local.sh
cd ../aquatiq-digital-signage && docker compose up -d

# View all container logs
docker compose logs -f

# Check container resource usage
docker stats aquatiq-signage-server
```

## 📊 Service URLs

### Signage Services
- **API**: http://localhost:3002
- **YouTube Proxy**: Internal (port 8085)
- **Screenshot Server**: Internal (port 3003)
- **NTP Server**: UDP 123

### Shared Services (from Aquatiq Root Container)
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:5050
- **Redis**: localhost:6379
- **RedisInsight**: http://localhost:5540
- **MinIO Console**: http://localhost:9011
- **n8n**: http://localhost:5678
- **Aquatiq Gateway**: http://localhost:7500

## 🔐 Default Credentials (Local Development)

**PostgreSQL** (Shared)
- Host: `postgres` (from containers) or `localhost:5432` (from host)
- User: `aquatiq`
- Password: `postgres`
- Database: `aquatiq_signage`

**pgAdmin**
- URL: http://localhost:5050
- Email: admin@aquatiq.com
- Password: admin

**MinIO**
- URL: http://localhost:9011
- Username: admin
- Password: aquatiq-minio-2024

**Redis**
- Host: `redis:6379`
- Password: `redis`

**⚠️ Never use these in production!**

## 📦 Docker Networks

**aquatiq-local** (External)
- Created by Aquatiq Root Container
- Shared by all Aquatiq services
- Provides service discovery (postgres, redis, nats, minio)

## 🔄 Common Workflows

### Adding a New Screen
```bash
# Via API
curl -X POST http://localhost:3002/api/screens \
  -H "Content-Type: application/json" \
  -d '{"name":"Reception TV","location":"Building A"}'

# Via PostgreSQL
docker exec -it aquatiq-postgres-local psql -U aquatiq -d aquatiq_signage
INSERT INTO screens (name, location) VALUES ('Reception TV', 'Building A');
```

### Viewing Content
```bash
# All screens
curl http://localhost:3002/api/screens | jq

# Specific screen
curl http://localhost:3002/api/screens/1 | jq

# All content
curl http://localhost:3002/api/content | jq
```

### Updating Code
```bash
# Backend changes (TypeScript)
cd signage-server
pnpm build
docker compose restart signage-server

# With hot reload (development)
docker compose down signage-server
cd signage-server && pnpm dev
```

## 📝 File Locations

**Configuration**
- `.env` - Environment variables
- `docker-compose.yml` - Service definitions
- `signage-server/.env` - Server-specific config

**Database**
- `signage-server/schema.sql` - Database schema
- `setup-database.sh` - Automated setup script

**Code**
- `signage-server/src/` - Backend TypeScript code
- `signage-server/dist/` - Compiled JavaScript (auto-generated)

**Documentation**
- `README.md` - Project overview
- `PRODUCTION.md` - Deployment guide
- `AQUATIQ-ROOT-INTEGRATION.md` - Integration details
- `QUICK-REFERENCE.md` - This file

## 🆘 Emergency Commands

### Complete Reset
```bash
# Stop and remove everything
docker compose down -v

# Reset Aquatiq Root Container
cd ../aquatiq-root-container
./reset-local.sh
./start-local.sh

# Recreate signage database
cd ../aquatiq-digital-signage
./setup-database.sh
docker compose up -d --build
```

### Force Rebuild
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Check Disk Space
```bash
# Docker disk usage
docker system df

# Clean unused images/containers
docker system prune -a
```

## 📚 More Information

- Architecture Details: `AQUATIQ-ROOT-INTEGRATION.md`
- Production Deployment: `PRODUCTION.md`
- Aquatiq Root Container: `../aquatiq-root-container/README.md`
