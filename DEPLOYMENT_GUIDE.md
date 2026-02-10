# Aquatiq Digital Signage - Deployment Guide

This guide covers the initial VPS setup and GitHub Actions automated deployment.

## Table of Contents
1. [Initial VPS Setup (One-time)](#initial-vps-setup)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Automated Deployment](#automated-deployment)
4. [Manual Deployment (Alternative)](#manual-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Initial VPS Setup

### Prerequisites
- VPS with Docker and Docker Compose installed
- Root or sudo access
- SSH key-based authentication configured

### Step 1: Clone the Repository

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to deployment directory
cd /root

# Clone the repository
git clone https://github.com/I-Dacosta/Aquatiq-Signage.git aquatiq-signage

# Navigate to project directory
cd aquatiq-signage
```

### Step 2: Create Environment Files

#### Root .env file
Create `/root/aquatiq-signage/.env`:

```bash
nano .env
```

Add the following:
```dotenv
# PostgreSQL Configuration
POSTGRES_USER=aquatiq
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=aquatiq_signage

# Environment
NODE_ENV=production

# BxSoftware Credentials (optional)
BXSOFTWARE_USERNAME=
BXSOFTWARE_PASSWORD=
BXSOFTWARE_BASE_URL=

# SharePoint Configuration (optional)
SHAREPOINT_SITE_URL=
SHAREPOINT_CLIENT_ID=
SHAREPOINT_CLIENT_SECRET=
SHAREPOINT_TENANT_ID=
```

#### Signage Server .env
Create `/root/aquatiq-signage/signage-server/.env`:

```bash
nano signage-server/.env
```

Add the following:
```dotenv
# Server Configuration
PORT=3002
NODE_ENV=production

# PostgreSQL Database
POSTGRES_HOST=postgres.aquatiq-backend
POSTGRES_PORT=5432
POSTGRES_DB=aquatiq_signage
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Video Storage
VIDEOS_DIR=/app/videos
VIDEO_BASE_URL=https://signage.aquatiq.com

# External Services
TOOLS_BASE_URL=https://tools.aquatiq.com

# BxSoftware Authentication (optional)
BX_USERNAME=
BX_PASSWORD=
BX_COMPANYCODE=
```

#### Screenshot Server .env
Create `/root/aquatiq-signage/screenshot-server/.env`:

```bash
nano screenshot-server/.env
```

Add the following:
```dotenv
# PostgreSQL Configuration
POSTGRES_HOST=postgres.aquatiq-backend
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Redis Configuration
REDIS_HOST=redis.aquatiq-backend
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# NATS Configuration
NATS_HOST=nats.aquatiq-backend
NATS_PORT=4222
NATS_AUTH_TOKEN=your_nats_token_here
```

### Step 3: Create Required Networks

```bash
# Create Docker networks if they don't exist
docker network create aquatiq-backend || true
docker network create internal || true
docker network create aquatiq-net || true
docker network create aquatiq-local || true
```

### Step 4: Set Up youtube-cookies.txt

```bash
# Create the cookies file
nano youtube-cookies.txt

# Add your YouTube cookies (see YouTube Proxy documentation)
# Save and exit
```

### Step 5: Initialize Database

```bash
# Run database migrations
docker compose -f docker-compose.prod.yml run --rm signage-server npm run migrate

# Or manually run migrations
cd migrations
./run-migrations.sh
```

### Step 6: Start Services Manually (First Time)

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## GitHub Repository Setup

### Step 1: Add GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VPS_HOST` | VPS IP address or hostname | `31.97.38.31` |
| `VPS_USER` | SSH username | `root` |
| `VPS_SSH_KEY` | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (optional, defaults to 22) | `22` |

### Step 2: Generate SSH Key (if needed)

On your local machine:
```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Copy the public key to VPS
ssh-copy-id -i ~/.ssh/github-actions.pub root@your-vps-ip

# Add the private key to GitHub Secrets (VPS_SSH_KEY)
cat ~/.ssh/github-actions
```

### Step 3: Configure GitHub Container Registry

The workflow automatically uses GitHub Container Registry (ghcr.io). Images will be stored at:
- `ghcr.io/i-dacosta/aquatiq-signage/youtube-proxy`
- `ghcr.io/i-dacosta/aquatiq-signage/signage-server`
- `ghcr.io/i-dacosta/aquatiq-signage/screenshot-server`

### Step 4: Update docker-compose.prod.yml

Update the image references in `docker-compose.prod.yml`:

```yaml
services:
  youtube-proxy:
    image: ghcr.io/i-dacosta/aquatiq-signage/youtube-proxy:latest
    # ... rest of configuration

  signage-server:
    image: ghcr.io/i-dacosta/aquatiq-signage/signage-server:latest
    # ... rest of configuration

  screenshot-server:
    image: ghcr.io/i-dacosta/aquatiq-signage/screenshot-server:latest
    # ... rest of configuration
```

---

## Automated Deployment

### How It Works

1. **Push to main branch** triggers the workflow
2. **Build Docker images** for all services
3. **Push images** to GitHub Container Registry
4. **SSH into VPS** and pull latest images
5. **Restart services** with zero downtime
6. **Health check** to verify deployment
7. **Clean up** old Docker images

### Trigger Deployment

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# The workflow will automatically start
```

### Manual Trigger

You can also trigger deployment manually from GitHub:
1. Go to **Actions** tab
2. Select **Deploy to VPS** workflow
3. Click **Run workflow**

### Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. View real-time logs

---

## Manual Deployment

If you need to deploy manually without GitHub Actions:

```bash
# SSH into VPS
ssh root@31.97.38.31

# Navigate to project
cd /root/aquatiq-signage

# Pull latest code
git pull origin main

# Rebuild and restart services
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Troubleshooting

### Check Container Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f signage-server
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart signage-server
```

### Check Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/github-actions root@your-vps-ip

# Check SSH key permissions
chmod 600 ~/.ssh/github-actions
```

### Docker Registry Authentication

```bash
# Login to GitHub Container Registry on VPS
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Database Connection Issues

```bash
# Check database container
docker compose -f docker-compose.prod.yml exec postgres psql -U aquatiq -d aquatiq_signage

# Run migrations manually
docker compose -f docker-compose.prod.yml run --rm signage-server npm run migrate
```

### Clean Up Docker System

```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove specific service and recreate
docker compose -f docker-compose.prod.yml rm -f signage-server
docker compose -f docker-compose.prod.yml up -d signage-server
```

---

## Security Best Practices

1. **Never commit .env files** - They contain sensitive credentials
2. **Use strong passwords** - Generate secure random passwords
3. **Rotate secrets regularly** - Update credentials periodically
4. **Limit SSH access** - Use SSH keys only, disable password auth
5. **Keep Docker updated** - Regular security updates
6. **Monitor logs** - Check for suspicious activity

---

## Maintenance

### Update Docker Images

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Backup Database

```bash
# Create backup
docker exec aquatiq-postgres pg_dump -U aquatiq aquatiq_signage > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i aquatiq-postgres psql -U aquatiq aquatiq_signage < backup_20260210.sql
```

### View Disk Usage

```bash
# Check Docker disk usage
docker system df

# Check volumes
docker volume ls
```

---

## Support

For issues or questions:
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- Review documentation in the repository
- Contact the development team
