# Aquatiq Digital Signage - Quick Reference

## 🚀 Deployment Workflow

### Initial Setup (One-time)
```bash
# On VPS
cd /root
git clone https://github.com/I-Dacosta/Aquatiq-Signage.git aquatiq-signage
cd aquatiq-signage
./setup-vps.sh
```

### Automated Deployment
```bash
# Push to main branch - automatic deployment via GitHub Actions
git push origin main
```

### Manual Deployment
```bash
# On VPS
cd /root/aquatiq-signage
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 📁 Repository Structure

```
aquatiq-digital-signage/
├── .github/workflows/
│   └── deploy.yml              # CI/CD workflow
├── proxy/                      # YouTube proxy service
├── signage-server/             # Main signage application
├── screenshot-server/          # Screenshot service
├── migrations/                 # Database migrations
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # Production deployment
├── setup-vps.sh               # VPS setup script
└── DEPLOYMENT_GUIDE.md        # Detailed deployment guide
```

## 🔧 Common Commands

### Service Management
```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart specific service
docker compose -f docker-compose.prod.yml restart signage-server

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f signage-server
```

### Container Management
```bash
# List running containers
docker compose -f docker-compose.prod.yml ps

# Execute command in container
docker compose -f docker-compose.prod.yml exec signage-server sh

# Remove and recreate service
docker compose -f docker-compose.prod.yml up -d --force-recreate signage-server
```

### Image Management
```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Build images locally
docker compose -f docker-compose.prod.yml build

# Remove unused images
docker image prune -a
```

### Database Operations
```bash
# Run migrations
docker compose -f docker-compose.prod.yml run --rm signage-server npm run migrate

# Backup database
docker exec aquatiq-postgres pg_dump -U aquatiq aquatiq_signage > backup.sql

# Restore database
docker exec -i aquatiq-postgres psql -U aquatiq aquatiq_signage < backup.sql

# Connect to database
docker compose -f docker-compose.prod.yml exec postgres psql -U aquatiq -d aquatiq_signage
```

## 🔐 GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH username (usually `root`) |
| `VPS_SSH_KEY` | Private SSH key |
| `VPS_PORT` | SSH port (default: 22) |

## 📦 Environment Files

### Root .env
```dotenv
POSTGRES_USER=aquatiq
POSTGRES_PASSWORD=your_password
POSTGRES_DB=aquatiq_signage
NODE_ENV=production
```

### signage-server/.env
```dotenv
PORT=3002
POSTGRES_HOST=postgres.aquatiq-backend
VIDEO_BASE_URL=https://signage.aquatiq.com
TOOLS_BASE_URL=https://tools.aquatiq.com
```

### screenshot-server/.env
```dotenv
POSTGRES_HOST=postgres.aquatiq-backend
REDIS_HOST=redis.aquatiq-backend
NATS_HOST=nats.aquatiq-backend
```

## 🌐 Service URLs

- **Signage Server**: https://signage.aquatiq.com
- **Tools**: https://tools.aquatiq.com

## 🔍 Troubleshooting

### Check service health
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f signage-server
```

### Restart services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Clean Docker system
```bash
docker system prune -a
docker volume prune
```

### GitHub Actions not triggering
1. Check workflow file syntax
2. Verify GitHub Actions is enabled
3. Check branch protection rules
4. Review workflow logs in Actions tab

### SSH connection fails
```bash
# Test SSH key
ssh -i ~/.ssh/github-actions root@31.97.38.31

# Check key permissions
chmod 600 ~/.ssh/github-actions
```

### Container won't start
```bash
# View detailed logs
docker logs aquatiq-signage-server

# Check environment variables
docker compose -f docker-compose.prod.yml config

# Recreate container
docker compose -f docker-compose.prod.yml up -d --force-recreate signage-server
```

## 📚 Documentation

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [PRODUCTION.md](PRODUCTION.md) - Production configuration
- [README.md](README.md) - Project overview

## 🆘 Support

For issues:
1. Check logs: `docker compose logs -f`
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. Contact development team
