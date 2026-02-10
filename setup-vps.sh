#!/bin/bash

# Quick Setup Script for VPS
# Run this script after cloning the repository

set -e  # Exit on error

echo "🚀 Aquatiq Digital Signage - Quick Setup"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your credentials"
    nano .env
else
    echo "✅ .env file already exists"
fi

# Check signage-server .env
if [ ! -f "signage-server/.env" ]; then
    echo "📝 Creating signage-server/.env file from template..."
    cp signage-server/.env.example signage-server/.env
    echo "⚠️  Please edit signage-server/.env and add your credentials"
    nano signage-server/.env
else
    echo "✅ signage-server/.env file already exists"
fi

# Check screenshot-server .env
if [ ! -f "screenshot-server/.env" ]; then
    echo "📝 Creating screenshot-server/.env file from template..."
    cp screenshot-server/.env.example screenshot-server/.env
    echo "⚠️  Please edit screenshot-server/.env and add your credentials"
    nano screenshot-server/.env
else
    echo "✅ screenshot-server/.env file already exists"
fi

# Create Docker networks
echo "🌐 Creating Docker networks..."
docker network create aquatiq-backend 2>/dev/null || echo "Network aquatiq-backend already exists"
docker network create internal 2>/dev/null || echo "Network internal already exists"
docker network create aquatiq-net 2>/dev/null || echo "Network aquatiq-net already exists"

echo "✅ Networks created"

# Check if youtube-cookies.txt exists
if [ ! -f "youtube-cookies.txt" ]; then
    echo "⚠️  youtube-cookies.txt not found. Creating empty file..."
    touch youtube-cookies.txt
    echo "Please add your YouTube cookies to youtube-cookies.txt"
fi

# Login to GitHub Container Registry
echo "🔐 Logging in to GitHub Container Registry..."
echo "Please enter your GitHub Personal Access Token (with read:packages permission):"
read -s GITHUB_TOKEN
echo "$GITHUB_TOKEN" | docker login ghcr.io -u $USER --password-stdin

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull

# Start services
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "📊 Service status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Check logs: docker compose -f docker-compose.prod.yml logs -f"
echo "2. Run database migrations if needed: docker compose -f docker-compose.prod.yml run --rm signage-server npm run migrate"
echo "3. Access services:"
echo "   - Signage Server: https://signage.aquatiq.com"
echo ""
