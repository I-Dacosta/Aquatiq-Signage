# 🚀 GitHub & VPS Deployment Complete

Successfully set up GitHub repo with automatic VPS deployment via webhooks.

---

## ✅ What's Done

### 1. **GitHub Repository** ✅
- **URL**: https://github.com/I-Dacosta/Aquatiq-Signage.git
- **Branches**: 
  - `main` — Production (auto-deploys to VPS)
  - `dev` — Development (no auto-deploy)
- **Initial Commit**: 74 files, 15.5 KB of production code
- **Status**: Ready for development

### 2. **Webhook System** ✅
- **Webhook File**: `/root/webhook-receiver.js` (VPS)
- **Port**: 3001 (open and ready)
- **Verification**: GitHub signature validation (SHA256)
- **Actions**:
  - ✅ Main branch push → Auto-deploy
  - ✅ Dev branch push → Skip (do nothing)

### 3. **Deployment Pipeline** ✅
Automatic steps when main is pushed:
1. Fetch latest code from GitHub
2. Rebuild Docker images
3. Deploy docker-compose stack
4. Application running on port 3002

---

## 🔗 Connection Flow

```
Your Local Machine
    ↓ git push origin main
GitHub Repository
    ↓ Webhook trigger
VPS (31.97.38.31:3001)
    ↓ Webhook receiver processes
Docker Stack
    ↓ Auto-redeployed
App Running (port 3002) ✅
```

---

## 🎯 Quick Start

### Make Changes Locally:
```bash
cd /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage

# Make your changes
git commit -am "Your changes"

# Push to main = Auto-deploy to VPS
git push origin main

# Push to dev = No deployment (safe testing)
git push origin dev
```

### View Deployment Logs:
```bash
ssh root@31.97.38.31
tail -f /var/log/webhook-out.log
```

### VPS Status:
```bash
ssh root@31.97.38.31

# Check webhook receiver
pm2 status

# Check application
docker-compose ps
```

---

## 🔐 GitHub Webhook Configuration

### To Enable Automatic Deployments:

1. **Go to**: https://github.com/I-Dacosta/Aquatiq-Signage/settings/hooks

2. **Add Webhook**:
   ```
   Payload URL:     http://31.97.38.31:3001/webhook
   Content type:    application/json
   Secret:          aquatiq-signage-webhook
   Events:          Push events
   Active:          ✅ Yes
   ```

3. **Test**: Recent Deliveries → Redeliver

---

## 📊 Repository Structure

```
aquatiq-signage/
├── signage-server/          🎯 Main app
│   ├── src/                 TypeScript source
│   ├── public/              HTML/JS for TVs
│   └── dist/                Compiled code
├── proxy/                   YouTube proxy service
├── screenshot-server/       Screenshot service
├── migrations/              Database migrations
├── docker-compose.yml       Docker config
├── deploy-to-vps.sh         Manual deployment script
└── README.md                Documentation
```

---

## 🌳 Branch Strategy

| Branch | Auto-Deploy | Use Case |
|--------|-------------|----------|
| **main** | ✅ Yes | Stable, production-ready |
| **dev** | ❌ No | Development & testing |
| **feature/*** | ❌ No | Feature development |

```bash
# Typical workflow:
git checkout -b feature/my-feature
# ... make changes ...
git commit -am "My feature"
git push origin feature/my-feature

# When ready, create pull request to main
# After merge, automatic deployment happens
git push origin main  # 🚀 Auto-deploys
```

---

## 📝 Git Configuration

```bash
# Set up local repo
cd /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage

# View remote
git remote -v
# output: origin https://github.com/I-Dacosta/Aquatiq-Signage.git

# View current branch
git branch
# output: * main

# Check status
git status
```

---

## 🧪 Test the Webhook

### Step 1: Make a small change
```bash
cd /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage
echo "# Test deployment" >> TEST.md
git add TEST.md
git commit -m "Test webhook deployment"
git push origin main
```

### Step 2: Check VPS logs
```bash
ssh root@31.97.38.31
tail -f /var/log/webhook-out.log

# You should see:
# [timestamp] 📨 push on main
# [timestamp] 🚀 Main push - deploying
# [timestamp] 1️⃣ Pulling code...
# [timestamp] 2️⃣ Building images...
# ... deployment steps ...
# [timestamp] ✅ Deployment complete!
```

### Step 3: Verify deployment
```bash
# Check app is running
curl http://31.97.38.31:3002/health

# Check Docker containers
docker-compose ps
```

---

## 🔄 Update VPS Configuration

After webhook is configured, you can update the secret:

**On GitHub**:
1. Settings → Webhooks → Edit
2. Change Secret field
3. Save

**On VPS**:
```bash
ssh root@31.97.38.31

# Edit webhook receiver
nano /root/webhook-receiver.js

# Find: const SECRET = process.env.WEBHOOK_SECRET || "aquatiq-signage-webhook";
# Update the default value to match GitHub

# Restart webhook
pm2 restart webhook-receiver
pm2 save
```

---

## 📋 Files Modified/Created

### Local (Your Machine):
- ✅ `.git/` folder (git repository initialized)
- ✅ All files committed to GitHub

### VPS (31.97.38.31):
- ✅ `/root/webhook-receiver.js` — Webhook listener
- ✅ `/root/aquatiq-signage/.git/` — Git repository
- ✅ `/var/log/webhook-out.log` — Deployment logs
- ✅ PM2 configuration updated

---

## 🎛️ Advanced: Manual Commands

### Deploy without webhook:
```bash
ssh root@31.97.38.31
cd /root/aquatiq-signage
./deploy-to-vps.sh
```

### View detailed deployment logs:
```bash
ssh root@31.97.38.31
pm2 logs webhook-receiver --lines 100
```

### Restart webhook receiver:
```bash
ssh root@31.97.38.31
pm2 restart webhook-receiver
pm2 save
```

### View webhook configuration:
```bash
ssh root@31.97.38.31
cat /root/webhook-receiver.js
```

---

## 🚨 Troubleshooting

**Problem**: Webhook not triggering
- [ ] Check firewall: `ssh root@31.97.38.31 && ufw status | grep 3001`
- [ ] Check process: `pm2 status`
- [ ] Test connectivity: `curl http://31.97.38.31:3001/`

**Problem**: Push succeeded but no deployment
- [ ] Check branch: `git branch` (must be on main)
- [ ] Check webhook: GitHub Settings → Webhooks → Recent Deliveries
- [ ] Check secret: GitHub webhook secret matches VPS receiver

**Problem**: Deployment failed
- [ ] Check logs: `tail -f /var/log/webhook-out.log`
- [ ] Check git: `cd /root/aquatiq-signage && git status`
- [ ] Check docker: `docker-compose ps`

---

## 📚 Documentation

For detailed webhook setup, see: [GITHUB-WEBHOOK-SETUP.md](./GITHUB-WEBHOOK-SETUP.md)

---

## ✨ Next Steps

1. ✅ **Configure GitHub Webhook** (see GITHUB-WEBHOOK-SETUP.md)
2. ✅ **Test deployment** (push to main, check logs)
3. ✅ **Create development workflow** (use dev/feature branches)
4. ✅ **Monitor VPS** (check logs regularly)

---

## 🎯 Summary

| Component | Status | Details |
|-----------|--------|---------|
| GitHub Repo | ✅ Ready | https://github.com/I-Dacosta/Aquatiq-Signage |
| Main Branch | ✅ Setup | All commits auto-deploy |
| Dev Branch | ✅ Setup | No auto-deploy |
| Webhook | ⏳ Configure | See GITHUB-WEBHOOK-SETUP.md |
| VPS Receiver | ✅ Running | Port 3001 open |
| App Server | ✅ Running | Port 3002 (health check: `/health`) |

---

**Status**: 🟢 All systems ready for deployment

**Last Updated**: Feb 2, 2026
**Repository**: https://github.com/I-Dacosta/Aquatiq-Signage
**VPS**: 31.97.38.31
