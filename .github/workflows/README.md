# GitHub Actions Workflows

This directory contains CI/CD workflows for the Aquatiq Digital Signage project.

## Workflows

### deploy.yml - Main Deployment Workflow

**Trigger**: Pushes to `main` branch or manual dispatch

**What it does**:
1. **Builds** Docker images for all services (youtube-proxy, signage-server, screenshot-server)
2. **Pushes** images to GitHub Container Registry (ghcr.io)
3. **Deploys** to VPS via SSH
4. **Health checks** to verify deployment
5. **Cleans up** old Docker images

**Duration**: ~5-10 minutes

## Image Registry

Images are stored in GitHub Container Registry:
- `ghcr.io/i-dacosta/aquatiq-signage/youtube-proxy:latest`
- `ghcr.io/i-dacosta/aquatiq-signage/signage-server:latest`
- `ghcr.io/i-dacosta/aquatiq-signage/screenshot-server:latest`

## Required Secrets

Configure these in: **Settings → Secrets and variables → Actions**

| Secret | Description | Example |
|--------|-------------|---------|
| `VPS_HOST` | VPS IP address | `31.97.38.31` |
| `VPS_USER` | SSH username | `root` |
| `VPS_SSH_KEY` | SSH private key | `-----BEGIN OPENSSH...` |
| `VPS_PORT` | SSH port (optional) | `22` |

## Workflow Steps Explained

### 1. Build Phase
- Checks out code
- Sets up Docker Buildx
- Logs into GitHub Container Registry
- Builds images with caching for faster builds

### 2. Deploy Phase
- SSHs into VPS
- Logs into GitHub Container Registry on VPS
- Pulls latest images
- Restarts services with `docker compose`
- Removes old images

### 3. Health Check Phase
- Waits for services to stabilize
- Checks container status
- Verifies signage-server health endpoint
- Fails deployment if health check fails

## Manual Trigger

To manually trigger a deployment:
1. Go to **Actions** tab
2. Select **Deploy to VPS**
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**

## Monitoring Deployments

### View Real-time Logs
1. Go to **Actions** tab
2. Click on running workflow
3. Click on job name to see logs

### Check Deployment Status
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- 🟡 Yellow circle = In progress

## Troubleshooting

### Build fails
- Check Dockerfile syntax
- Verify dependencies are available
- Review build logs in Actions tab

### Deploy fails
- Verify SSH secrets are correct
- Check VPS is accessible
- Ensure Docker is running on VPS
- Verify .env files exist on VPS

### Health check fails
- Check container logs on VPS
- Verify services are running
- Check network connectivity
- Review environment variables

## Local Testing

Test Docker builds locally before pushing:
```bash
# Build all services
docker compose -f docker-compose.prod.yml build

# Test specific service
docker build -t test-image ./signage-server

# Run locally
docker compose -f docker-compose.prod.yml up -d
```

## Performance Optimization

The workflow uses:
- **Docker Buildx** for parallel builds
- **GitHub Actions cache** for layer caching
- **Multi-stage builds** in Dockerfiles (if applicable)
- **Parallel image builds** to speed up CI

## Security

- Images are private by default in GitHub Container Registry
- SSH uses key-based authentication only
- Secrets are encrypted in GitHub
- .env files are never committed to git
- Images are scanned for vulnerabilities (if enabled)

## Rollback

If deployment fails:
```bash
# SSH to VPS
ssh root@31.97.38.31

# Pull previous image version
docker compose -f docker-compose.prod.yml pull

# Or use specific tag
docker pull ghcr.io/i-dacosta/aquatiq-signage/signage-server:main-abc1234

# Update docker-compose.prod.yml to use specific tag
# Restart services
docker compose -f docker-compose.prod.yml up -d
```

## Future Enhancements

Possible improvements:
- [ ] Add automated testing before deployment
- [ ] Implement staging environment
- [ ] Add Slack/Discord notifications
- [ ] Create rollback workflow
- [ ] Add security scanning
- [ ] Implement blue-green deployment
- [ ] Add performance metrics

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [SSH Action](https://github.com/appleboy/ssh-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
