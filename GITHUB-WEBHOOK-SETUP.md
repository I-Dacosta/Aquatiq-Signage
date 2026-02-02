# GitHub Webhook Setup for Auto-Deployment

Complete guide to enable automatic deployments when pushing to GitHub.

## ✅ Status

- **Repository**: https://github.com/I-Dacosta/Aquatiq-Signage
- **Main Branch**: All pushes trigger auto-deployment to VPS
- **Dev Branch**: No deployment (as configured)
- **VPS Server**: 31.97.38.31

---

## 📦 What's Deployed

| Component | Location | Port | Status |
|-----------|----------|------|--------|
| Main Signage App | `/root/aquatiq-signage` | 3002 | ✅ Running |
| Webhook Receiver | `/root/webhook-receiver.js` | 3001 | ⏳ Configure below |

---

## 🚀 Setup Steps

### Step 1: Verify VPS Setup

SSH into your VPS and verify the webhook receiver is running:

```bash
ssh root@31.97.38.31

# Check if webhook file exists
ls -lah /root/webhook-receiver.js

# Start webhook (first time)
pm2 start /root/webhook-receiver.js
pm2 save

# Verify it's running
pm2 status
curl http://localhost:3001/webhook  # Should return 404 (expected)
```

### Step 2: Configure GitHub Webhook

1. **Go to GitHub Settings**:
   - Navigate to: https://github.com/I-Dacosta/Aquatiq-Signage
   - Click: **Settings** → **Webhooks** → **Add webhook**

2. **Fill in Webhook Details**:
   ```
   Payload URL:        http://31.97.38.31:3001/webhook
   Content type:       application/json
   Secret:             aquatiq-signage-webhook
   Events:             Just the push event
   Active:             ✅ Checked
   ```

3. **Click: Add webhook**

### Step 3: Open Firewall Port

Make sure port 3001 is open on your VPS:

```bash
ssh root@31.97.38.31

# Add firewall rule
ufw allow 3001/tcp

# Verify
ufw status | grep 3001
```

---

## 🧪 Test the Webhook

### Method 1: GitHub Delivery Test

1. Go to Webhook settings: Settings → Webhooks → Select your webhook
2. Click: **Recent Deliveries**
3. Click the latest delivery → **Redeliver**
4. Check VPS logs:

```bash
ssh root@31.97.38.31
tail -f /var/log/webhook-out.log
```

### Method 2: Manual Test

```bash
# Test webhook endpoint
curl -X POST http://31.97.38.31:3001/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -d '{"ref": "refs/heads/main"}'

# Should reject (invalid signature) but logs will show it received the request
```

---

## 🔄 How It Works

### When You Push to Main:

```
GitHub (main branch push)
    ↓
GitHub Webhooks
    ↓
POST to http://31.97.38.31:3001/webhook
    ↓
Webhook Receiver verifies signature
    ↓
Executes deployment:
  1. git fetch origin main
  2. git reset --hard origin/main
  3. docker-compose build
  4. docker-compose up -d
    ↓
✅ Stack redeployed
```

### When You Push to Dev:

```
GitHub (dev branch push)
    ↓
GitHub Webhooks
    ↓
POST to http://31.97.38.31:3001/webhook
    ↓
Webhook Receiver checks branch
    ↓
Branch is dev → Skip deployment
    ↓
✅ Nothing happens (as configured)
```

---

## 📋 Branch Strategy

| Branch | Action | Use Case |
|--------|--------|----------|
| **main** | ✅ Auto-deploy | Stable, production-ready code |
| **dev** | ⏭️ Skip | Development, testing, experiments |
| **feature/** | ⏭️ Skip | Feature branches (manual deploy when ready) |

---

## 📊 Deployment Files

### Webhook Receiver Script
**Location**: `/root/webhook-receiver.js`

Handles:
- GitHub webhook signature verification (SHA256)
- Branch detection (main vs dev)
- Automated deployment pipeline
- Error logging to `/var/log/aquatiq-webhook.log`

### PM2 Configuration
**Location**: `/root/ecosystem.config.js`

Manages:
- Webhook receiver process
- Auto-restart on crash
- Logging configuration
- Environment variables

---

## 🔐 Security

### Webhook Secret
```
Secret: aquatiq-signage-webhook
```

- GitHub signs all webhook requests with this secret
- Webhook receiver verifies the signature before deployment
- Only requests from GitHub (with correct signature) trigger deployment

### Best Practices
1. ✅ Secret is stored in GitHub only (not in code)
2. ✅ Webhook receiver validates signature before any action
3. ✅ Only `main` branch triggers deployment
4. ✅ All deployments logged for audit trail
5. ✅ Deployment failures logged but don't crash the webhook

---

## 📝 Logs & Debugging

### View Webhook Logs
```bash
ssh root@31.97.38.31

# Real-time logs
tail -f /var/log/webhook-out.log

# See errors
tail -f /var/log/webhook-error.log

# Full PM2 status
pm2 logs webhook-receiver
```

### Common Issues

**Issue**: Webhook not triggering
- ✅ Check port 3001 is open: `curl http://31.97.38.31:3001/`
- ✅ Verify PM2 process is running: `pm2 status`
- ✅ Check GitHub webhook recent deliveries for errors

**Issue**: Deployment fails after webhook triggers
- ✅ Check git repository state: `cd /root/aquatiq-signage && git status`
- ✅ Verify docker-compose syntax: `docker-compose config`
- ✅ Check logs: `tail -f /var/log/webhook-out.log`

**Issue**: Firewall blocking webhook
- ✅ Verify rule: `ufw status | grep 3001`
- ✅ Add rule: `ufw allow 3001/tcp`
- ✅ Test connectivity: `curl http://31.97.38.31:3001/`

---

## 🛠️ Manual Deployment

If webhook fails or you want to manually deploy:

```bash
ssh root@31.97.38.31
cd /root/aquatiq-signage

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Rebuild and deploy
docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose ps
```

---

## 🚨 Emergency Stop

If something goes wrong and you need to stop all services:

```bash
ssh root@31.97.38.31

# Stop webhook receiver
pm2 stop webhook-receiver

# Stop main application
pm2 stop aquatiq-signage

# Stop all Docker containers
docker-compose down
```

---

## ✨ Next Steps

1. **Test the webhook**:
   ```bash
   # Make a small change to README
   git commit -am "Test webhook deployment"
   git push origin main
   
   # Check VPS logs
   ssh root@31.97.38.31
   tail -f /var/log/webhook-out.log
   ```

2. **Monitor deployments**:
   - GitHub: Settings → Webhooks → Recent Deliveries
   - VPS logs: `/var/log/webhook-out.log`

3. **Update webhook secret** (optional but recommended):
   - Generate strong secret: `openssl rand -hex 32`
   - Update GitHub webhook
   - Update `/root/webhook-receiver.js` WEBHOOK_SECRET
   - Restart: `pm2 restart webhook-receiver`

---

## 📞 Support

For issues:
1. Check logs: `tail -f /var/log/webhook-out.log`
2. Verify connectivity: `curl http://31.97.38.31:3001/`
3. Test GitHub delivery: GitHub Webhooks → Recent Deliveries → Redeliver
4. Manual deployment: Follow "Manual Deployment" section above

---

**Last Updated**: Feb 2, 2026
**Repository**: https://github.com/I-Dacosta/Aquatiq-Signage
**VPS**: 31.97.38.31:3002
