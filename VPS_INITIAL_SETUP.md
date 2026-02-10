# VPS Initial Setup - REQUIRED BEFORE FIRST DEPLOYMENT

⚠️ **This must be completed BEFORE the GitHub Actions workflow can work!**

## Prerequisites
- VPS with Docker and Docker Compose installed
- SSH access configured
- GitHub personal access token with `read:packages` permission

---

## Step 1: SSH to Your VPS

```bash
ssh root@31.97.38.31
```

---

## Step 2: Install Required Tools (if not already installed)

```bash
# Update system
apt update && apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (if not installed)
apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

---

## Step 3: Clone the Repository

```bash
# Navigate to root directory
cd /root

# Clone the repository
git clone https://github.com/I-Dacosta/Aquatiq-Signage.git aquatiq-signage

# Navigate into project
cd aquatiq-signage

# Verify files
ls -la
```

---

## Step 4: Create Environment Files

### Create root .env file

```bash
cd /root/aquatiq-signage
nano .env
```

Add the following (replace with your actual passwords):
```dotenv
# PostgreSQL Configuration
POSTGRES_USER=aquatiq
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
POSTGRES_DB=aquatiq_signage

# Environment
NODE_ENV=production

# Optional: BxSoftware Credentials
BXSOFTWARE_USERNAME=
BXSOFTWARE_PASSWORD=
BXSOFTWARE_BASE_URL=

# Optional: SharePoint Configuration
SHAREPOINT_SITE_URL=
SHAREPOINT_CLIENT_ID=
SHAREPOINT_CLIENT_SECRET=
SHAREPOINT_TENANT_ID=
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Create signage-server/.env file

```bash
nano signage-server/.env
```

Add the following (match passwords with root .env):
```dotenv
# Server Configuration
PORT=3002
NODE_ENV=production

# PostgreSQL Database
POSTGRES_HOST=postgres.aquatiq-backend
POSTGRES_PORT=5432
POSTGRES_DB=aquatiq_signage
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Video Storage
VIDEOS_DIR=/app/videos
VIDEO_BASE_URL=https://signage.aquatiq.com

# External Services
TOOLS_BASE_URL=https://tools.aquatiq.com

# Optional: BxSoftware Authentication
BX_USERNAME=
BX_PASSWORD=
BX_COMPANYCODE=
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Create screenshot-server/.env file

```bash
nano screenshot-server/.env
```

Add the following:
```dotenv
# PostgreSQL Configuration
POSTGRES_HOST=postgres.aquatiq-backend
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Redis Configuration
REDIS_HOST=redis.aquatiq-backend
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# NATS Configuration
NATS_HOST=nats.aquatiq-backend
NATS_PORT=4222
NATS_AUTH_TOKEN=YOUR_NATS_TOKEN_HERE

# Server Configuration
NODE_ENV=production
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

---

## Step 5: Create Docker Networks

```bash
# Create required Docker networks
docker network create aquatiq-backend 2>/dev/null || echo "Network aquatiq-backend already exists"
docker network create internal 2>/dev/null || echo "Network internal already exists"
docker network create aquatiq-net 2>/dev/null || echo "Network aquatiq-net already exists"

# Verify networks
docker network ls
```

---

## Step 6: Add YouTube Cookies (if needed)

```bash
cd /root/aquatiq-signage
nano youtube-cookies.txt
```

Add your YouTube cookies, then save.

---

## Step 7: Login to GitHub Container Registry

```bash
# You'll need a Personal Access Token with read:packages permission
# Create one at: https://github.com/settings/tokens

# Login (you'll be prompted for password - paste your token)
docker login ghcr.io -u I-Dacosta
```

When prompted for password, paste your GitHub Personal Access Token (starts with `ghp_`).

---

## Step 8: Pull Initial Images

Since the automated workflow hasn't run yet, you may need to either:

**Option A: Wait for first workflow run** (recommended)
- The workflow will build and push images on your next git push
- Then come back and run: `docker compose -f docker-compose.prod.yml pull`

**Option B: Build locally on VPS** (if you need to start immediately)
```bash
cd /root/aquatiq-signage

# Build all images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d
```

---

## Step 9: Verify Setup

```bash
# Check if directory exists
ls -la /root/aquatiq-signage

# Check if .env files exist
ls -la /root/aquatiq-signage/.env
ls -la /root/aquatiq-signage/signage-server/.env
ls -la /root/aquatiq-signage/screenshot-server/.env

# Check Docker networks
docker network ls | grep aquatiq

# Check if logged into registry
docker login ghcr.io -u I-Dacosta
```

---

## Step 10: Test GitHub Actions Workflow

Now that the VPS is set up, test the automated deployment:

```bash
# On your LOCAL machine (not VPS)
cd /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage

# Make a small change to trigger workflow
echo "" >> README.md

# Commit and push
git add README.md
git commit -m "Test automated deployment"
git push origin main
```

Watch the workflow in GitHub Actions: https://github.com/I-Dacosta/Aquatiq-Signage/actions

---

## Troubleshooting

### "cd: /root/aquatiq-signage: No such file or directory"
- You haven't cloned the repository yet
- Run: `git clone https://github.com/I-Dacosta/Aquatiq-Signage.git /root/aquatiq-signage`

### "open docker-compose.prod.yml: no such file or directory"
- You're in the wrong directory
- Run: `cd /root/aquatiq-signage && ls -la`

### "error pulling image: unauthorized"
- You need to login to GitHub Container Registry
- Run: `docker login ghcr.io -u I-Dacosta`
- Use your GitHub Personal Access Token as password

### "Cannot connect to the Docker daemon"
- Docker is not running
- Run: `systemctl start docker`

---

## What Happens After Setup?

Once this initial setup is complete:
1. ✅ Every push to `main` triggers GitHub Actions
2. ✅ Images are built and pushed to GitHub Container Registry
3. ✅ VPS automatically pulls latest images
4. ✅ Services restart with zero downtime
5. ✅ Health checks verify deployment

---

## Next Steps

After completing this setup:
1. Go back to GitHub and re-run the failed workflow
2. Or push a new commit to trigger deployment
3. Monitor logs: `docker compose -f docker-compose.prod.yml logs -f`

---

## Quick Reference Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart services
docker compose -f docker-compose.prod.yml restart

# Check status
docker compose -f docker-compose.prod.yml ps

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Update and restart
cd /root/aquatiq-signage && \
  git pull origin main && \
  docker compose -f docker-compose.prod.yml up -d
```

# VPS Setup Complete - Tue Feb 10 22:45:23 CET 2026
