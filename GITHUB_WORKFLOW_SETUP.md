# GitHub Workflow Setup - Complete ✅

## What We've Created

### 1. GitHub Actions Workflow
📄 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- Automatic deployment on push to `main`
- Builds 3 Docker images (youtube-proxy, signage-server, screenshot-server)
- Pushes to GitHub Container Registry
- Deploys to VPS via SSH
- Includes health checks

### 2. Documentation
- 📕 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- 📗 [QUICK_DEPLOY_REFERENCE.md](QUICK_DEPLOY_REFERENCE.md) - Quick command reference
- 📘 [.github/workflows/README.md](.github/workflows/README.md) - Workflow documentation

### 3. Setup Scripts
- 🔧 [setup-vps.sh](setup-vps.sh) - Automated VPS setup script

### 4. Environment Templates
- [.env.example](.env.example) - Root environment variables
- [signage-server/.env.example](signage-server/.env.example) - Signage server config
- [screenshot-server/.env.example](screenshot-server/.env.example) - Screenshot server config

### 5. Updated Configuration
- ✅ [docker-compose.prod.yml](docker-compose.prod.yml) - Uses GitHub Container Registry images
- ✅ [.gitignore](.gitignore) - Protects sensitive .env files

---

## 🚀 Next Steps

### Step 1: Initial VPS Setup (Do this first)

SSH into your VPS and clone the repository:

```bash
# SSH to VPS
ssh root@31.97.38.31

# Clone repository
cd /root
git clone https://github.com/I-Dacosta/Aquatiq-Signage.git aquatiq-signage
cd aquatiq-signage

# Run setup script (will prompt for configurations)
./setup-vps.sh
```

The setup script will:
- Create .env files from templates
- Create Docker networks
- Login to GitHub Container Registry
- Pull latest images
- Start services

### Step 2: Configure GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

   | Secret Name | Value | How to Get |
   |------------|-------|------------|
   | `VPS_HOST` | `31.97.38.31` | Your VPS IP |
   | `VPS_USER` | `root` | Your SSH user |
   | `VPS_SSH_KEY` | `-----BEGIN...` | See below |
   | `VPS_PORT` | `22` | SSH port (optional) |

#### Generate SSH Key for GitHub Actions

On your local machine:
```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github-actions.pub root@31.97.38.31

# Display private key (copy entire output including BEGIN/END lines)
cat ~/.ssh/github-actions

# Paste this into GitHub Secret: VPS_SSH_KEY
```

### Step 3: Make Your First Deployment

```bash
# On your local machine
cd /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage

# Commit the new workflow files
git add .
git commit -m "Add CI/CD workflow with GitHub Actions"
git push origin main
```

This will trigger the deployment workflow! 🎉

### Step 4: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflow run in real-time
4. Wait for ✅ green checkmark

---

## 📋 Manual Setup Checklist

- [ ] VPS is accessible via SSH
- [ ] Docker and Docker Compose are installed on VPS
- [ ] Repository cloned to `/root/aquatiq-signage`
- [ ] `.env` files created for all services
- [ ] Docker networks created
- [ ] `youtube-cookies.txt` added (if needed)
- [ ] All GitHub secrets configured
- [ ] SSH key generated and added to VPS
- [ ] First deployment tested

---

## 🔄 Deployment Workflow

After initial setup, every push to `main` will:

1. ⚙️ Build Docker images
2. 📦 Push to GitHub Container Registry
3. 🚀 Deploy to VPS
4. ✅ Run health checks
5. 🧹 Clean up old images

**Total time**: 5-10 minutes per deployment

---

## 🎯 Quick Commands

### Deploy manually (without GitHub Actions)
```bash
ssh root@31.97.38.31
cd /root/aquatiq-signage
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### View logs
```bash
ssh root@31.97.38.31
cd /root/aquatiq-signage
docker compose -f docker-compose.prod.yml logs -f
```

### Restart services
```bash
ssh root@31.97.38.31
cd /root/aquatiq-signage
docker compose -f docker-compose.prod.yml restart
```

---

## 🆘 Troubleshooting

### Workflow fails at "Deploy to VPS"
- Check SSH secrets are correct
- Verify VPS is accessible: `ssh root@31.97.38.31`
- Check `.env` files exist on VPS

### Workflow fails at "Health check"
- SSH to VPS and check logs: `docker compose logs -f`
- Verify services are running: `docker compose ps`
- Check database connection

### Images won't pull
- Ensure logged into GitHub Container Registry on VPS
- Run: `docker login ghcr.io -u YOUR_USERNAME`
- Check image names match in docker-compose.prod.yml

---

## 📚 Documentation

- **Complete Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Quick Reference**: [QUICK_DEPLOY_REFERENCE.md](QUICK_DEPLOY_REFERENCE.md)
- **Workflow Details**: [.github/workflows/README.md](.github/workflows/README.md)

---

## 🎉 Success!

Once set up, your deployment workflow is:

```
git push origin main → GitHub Actions → Build → Deploy → Done! ✅
```

No more manual deployments! 🚀
