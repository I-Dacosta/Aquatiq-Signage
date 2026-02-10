# GitHub Workflow Setup Complete ✅

## Summary
Your automated deployment workflow is now fully configured and operational!

## Current Setup

### VPS Configuration
- **Host**: 31.97.38.31
- **Location**: /root/aquatiq-signage
- **Status**: ✅ All services running and healthy

### Running Services
1. **youtube-proxy** - Running on port 8085
2. **signage-server** - Running on port 3002 (localhost only)
3. **screenshot-server** - Running on port 3003
4. **ntp-server** - Running on port 123/udp

### GitHub Workflow
- **File**: `.github/workflows/deploy.yml`
- **Trigger**: Automatically runs on push to `main` branch
- **Can also be**: Manually triggered from GitHub Actions tab

## How It Works

When you push code to the `main` branch:

1. **GitHub Action triggers** on your repository
2. **VPS receives notification** via SSH
3. **Git pulls latest code** from the repository
4. **Docker builds** all service images locally on VPS
5. **Services restart** with zero downtime
6. **Health check** verifies everything is working
7. **Old images cleaned up** to save disk space

## Workflow Steps

```yaml
- Pull latest code from GitHub
- Build Docker images on VPS
- Restart services
- Run health checks
- Clean up old images
```

## Required GitHub Secrets

These are already configured in your repository:

- `VPS_HOST`: Your VPS IP address
- `VPS_USER`: SSH username (root)
- `VPS_SSH_KEY`: Private SSH key for authentication
- `VPS_PORT`: SSH port (defaults to 22 if not set)

## Testing the Workflow

### Automatic Deployment
Simply push to main:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Trigger
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Deploy to VPS" workflow
4. Click "Run workflow"
5. Select branch (main)
6. Click "Run workflow" button

## Monitoring Deployments

### View Workflow Runs
Go to: `https://github.com/I-Dacosta/Aquatiq-Signage/actions`

### Check Service Status on VPS
```bash
ssh root@31.97.38.31 'cd /root/aquatiq-signage && docker compose ps'
```

### Check Service Health
```bash
ssh root@31.97.38.31 'curl http://localhost:3002/health'
```

### View Service Logs
```bash
# All services
ssh root@31.97.38.31 'cd /root/aquatiq-signage && docker compose logs -f'

# Specific service
ssh root@31.97.38.31 'cd /root/aquatiq-signage && docker compose logs -f signage-server'
```

## Current Service Status

**Last checked**: 2026-02-10 21:55:24 UTC

```json
{
  "status": "ok",
  "timestamp": "2026-02-10T21:55:24.648Z"
}
```

✅ All services are healthy and running!

## Troubleshooting

### If deployment fails:

1. **Check workflow logs** on GitHub Actions tab
2. **Check VPS logs**: 
   ```bash
   ssh root@31.97.38.31 'cd /root/aquatiq-signage && docker compose logs --tail=100'
   ```
3. **Restart services manually**:
   ```bash
   ssh root@31.97.38.31 'cd /root/aquatiq-signage && docker compose restart'
   ```

### If services won't start:

1. **Check .env files exist**:
   ```bash
   ssh root@31.97.38.31 'ls -la /root/aquatiq-signage/.env && ls -la /root/aquatiq-signage/signage-server/.env && ls -la /root/aquatiq-signage/screenshot-server/.env'
   ```

2. **Rebuild from scratch**:
   ```bash
   ssh root@31.97.38.31 'cd /root/aquatiq-signage && docker compose down && docker compose build --no-cache && docker compose up -d'
   ```

## Next Steps

Your CI/CD pipeline is ready! Every push to `main` will automatically:
- Build your applications
- Deploy to production
- Verify everything is healthy
- Notify you of success or failure

You can now focus on development - the deployment is fully automated! 🚀

## File Structure

```
/root/aquatiq-signage/
├── .env                          # Main environment variables
├── docker-compose.yml            # Service definitions (used for deployment)
├── docker-compose.prod.yml       # Production config (not currently used)
├── proxy/                        # YouTube proxy service
│   ├── Dockerfile
│   └── server.js
├── signage-server/              # Main signage application
│   ├── .env                     # Signage-specific config
│   ├── Dockerfile
│   └── src/
├── screenshot-server/           # Screenshot generation service
│   ├── .env                     # Screenshot-specific config
│   ├── Dockerfile
│   └── server.js
└── .github/
    └── workflows/
        └── deploy.yml           # Automated deployment workflow
```

## Notes

- The workflow uses `docker-compose.yml` instead of `docker-compose.prod.yml`
- Images are built directly on the VPS (no registry needed)
- Old images are automatically pruned after 72 hours
- Health checks ensure services are responding before marking deployment as successful
- The workflow can be manually triggered for testing or emergency deployments
