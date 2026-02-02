#!/bin/bash

# Aquatiq Digital Signage - VPS Deployment Script
# Target: Hostinger VPS (31.97.38.31)

set -e  # Exit on error

VPS_HOST="root@31.97.38.31"
APP_NAME="aquatiq-signage"
APP_DIR="/root/$APP_NAME"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Deploying Aquatiq Digital Signage Server to VPS..."
echo "=================================================="

# Step 1: Install Node.js and dependencies on VPS
echo "📦 Step 1: Installing Node.js and dependencies on VPS..."
ssh $VPS_HOST << 'ENDSSH'
    # Install Node.js 20.x
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        echo "Node.js already installed: $(node --version)"
    fi
    
    # Install PostgreSQL
    if ! command -v psql &> /dev/null; then
        echo "Installing PostgreSQL..."
        apt-get update
        apt-get install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    else
        echo "PostgreSQL already installed: $(psql --version)"
    fi
    
    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        npm install -g pm2
    else
        echo "PM2 already installed: $(pm2 --version)"
    fi
    
    # Install pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "Installing pnpm..."
        npm install -g pnpm
    else
        echo "pnpm already installed: $(pnpm --version)"
    fi
ENDSSH

echo "✅ Dependencies installed"

# Step 2: Create application directory
echo "📁 Step 2: Creating application directory..."
ssh $VPS_HOST "mkdir -p $APP_DIR/videos && mkdir -p $APP_DIR/backups"

# Step 3: Build locally
echo "🔨 Step 3: Building application locally..."
cd /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage/signage-server
pnpm install
pnpm build

# Step 4: Transfer files
echo "📤 Step 4: Transferring files to VPS..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'videos/*' \
    --exclude '.git' \
    /Volumes/Lagring/Aquatiq/MagicInfo/aquatiq-digital-signage/signage-server/ \
    $VPS_HOST:$APP_DIR/

echo "✅ Files transferred"

# Step 5: Set up database
echo "🗄️  Step 5: Setting up PostgreSQL database..."
ssh $VPS_HOST << 'ENDSSH'
    cd /root/aquatiq-signage
    
    # Create database user and database
    sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE aquatiq_signage'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aquatiq_signage')\gexec

-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'aquatiq_user') THEN
        CREATE USER aquatiq_user WITH PASSWORD 'aquatiq_secure_2026';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aquatiq_signage TO aquatiq_user;

-- Connect to database and grant schema privileges
\c aquatiq_signage
GRANT ALL ON SCHEMA public TO aquatiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aquatiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aquatiq_user;
EOF
    
    # Import schema
    sudo -u postgres psql -d aquatiq_signage -f schema.sql || echo "Schema already exists or import failed"
    
    echo "Database setup complete"
ENDSSH

echo "✅ Database configured"

# Step 6: Create production environment file
echo "⚙️  Step 6: Creating production environment configuration..."
ssh $VPS_HOST << 'ENDSSH'
    cd /root/aquatiq-signage
    
    # Create .env file
    cat > .env << EOF
# Server Configuration
PORT=3002
NODE_ENV=production

# PostgreSQL Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=aquatiq_signage
POSTGRES_USER=aquatiq_user
POSTGRES_PASSWORD=aquatiq_secure_2026

# Video Storage
VIDEOS_DIR=/root/aquatiq-signage/videos
VIDEO_BASE_URL=https://signage.aquatiq.com

# External Services
TOOLS_BASE_URL=https://tools.aquatiq.com

# BxSoftware Authentication (update these)
BX_USERNAME=your_bx_username
BX_PASSWORD=your_bx_password
BX_COMPANYCODE=your_company_code
EOF
    
    echo "Environment file created"
ENDSSH

echo "✅ Environment configured"

# Step 7: Install dependencies and start with PM2
echo "🚀 Step 7: Installing dependencies and starting server..."
ssh $VPS_HOST << 'ENDSSH'
    cd /root/aquatiq-signage
    
    # Install production dependencies
    pnpm install --prod
    
    # Stop existing PM2 process if running
    pm2 delete aquatiq-signage 2>/dev/null || true
    
    # Start with PM2
    pm2 start dist/index.js \
        --name aquatiq-signage \
        --env production \
        --max-memory-restart 500M \
        --log /root/aquatiq-signage/logs/app.log \
        --error /root/aquatiq-signage/logs/error.log
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u root --hp /root
    
    # Show status
    pm2 status
    pm2 logs aquatiq-signage --lines 20
ENDSSH

echo "✅ Server started with PM2"

# Step 8: Setup Nginx reverse proxy
echo "🌐 Step 8: Configuring Nginx reverse proxy..."
ssh $VPS_HOST << 'ENDSSH'
    # Install Nginx if not present
    if ! command -v nginx &> /dev/null; then
        echo "Installing Nginx..."
        apt-get install -y nginx
    fi
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/aquatiq-signage << 'EOF'
server {
    listen 80;
    server_name signage.aquatiq.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name signage.aquatiq.com;
    
    # SSL certificates (update paths as needed)
    ssl_certificate /etc/letsencrypt/live/signage.aquatiq.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/signage.aquatiq.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size for video uploads
    client_max_body_size 500M;
    
    # Proxy to Node.js server
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
    
    # Static video files (optional direct serving)
    location /videos/ {
        alias /root/aquatiq-signage/videos/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/aquatiq-signage /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    echo "Nginx configured"
ENDSSH

echo "✅ Nginx configured"

# Step 9: Setup SSL with Let's Encrypt (if not already set up)
echo "🔒 Step 9: SSL Certificate setup..."
ssh $VPS_HOST << 'ENDSSH'
    if ! command -v certbot &> /dev/null; then
        echo "Installing Certbot..."
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Check if certificate exists
    if [ ! -d "/etc/letsencrypt/live/signage.aquatiq.com" ]; then
        echo "Please run this command manually to obtain SSL certificate:"
        echo "certbot --nginx -d signage.aquatiq.com"
    else
        echo "SSL certificate already exists"
    fi
ENDSSH

echo "
=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "📊 Server Status:"
ssh $VPS_HOST "pm2 status"
echo ""
echo "🌐 Access Points:"
echo "   - API: https://signage.aquatiq.com"
echo "   - Health: https://signage.aquatiq.com/health"
echo "   - Setup: https://signage.aquatiq.com/setup.html"
echo ""
echo "📝 Next Steps:"
echo "   1. Update BX credentials in /root/aquatiq-signage/.env"
echo "   2. Run: ssh $VPS_HOST 'cd /root/aquatiq-signage && pm2 restart aquatiq-signage'"
echo "   3. Setup SSL: ssh $VPS_HOST 'certbot --nginx -d signage.aquatiq.com'"
echo "   4. Configure DNS: Point signage.aquatiq.com to 31.97.38.31"
echo ""
echo "🔍 Monitor logs:"
echo "   ssh $VPS_HOST 'pm2 logs aquatiq-signage'"
echo ""
echo "🔄 To redeploy:"
echo "   ./deploy-to-vps.sh"
echo ""
