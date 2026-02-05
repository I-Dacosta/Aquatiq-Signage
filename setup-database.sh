#!/bin/bash

# Setup database for Aquatiq Signage using Aquatiq Root Container shared PostgreSQL
# This script should be run after aquatiq-root-container is running

set -e

echo "🔧 Setting up Aquatiq Signage database..."

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️  No .env file found, using defaults"
  export POSTGRES_USER=${POSTGRES_USER:-aquatiq}
  export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
  export POSTGRES_DB=${POSTGRES_DB:-aquatiq_signage}
fi

echo "📋 Database: $POSTGRES_DB"
echo "👤 User: $POSTGRES_USER"

# Check if postgres container from aquatiq-root-container is running
if ! docker ps | grep -q "aquatiq-postgres-local"; then
  echo "❌ ERROR: Aquatiq Root Container PostgreSQL is not running!"
  echo "Please start it first:"
  echo "  cd ../aquatiq-root-container"
  echo "  ./start-local.sh"
  exit 1
fi

echo "✅ Aquatiq Root Container PostgreSQL is running"

# Create database if it doesn't exist
echo "📦 Creating database '$POSTGRES_DB' if it doesn't exist..."
docker exec aquatiq-postgres-local psql -U $POSTGRES_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || \
  docker exec aquatiq-postgres-local psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB"

# Run schema.sql
echo "📄 Applying schema..."
docker exec -i aquatiq-postgres-local psql -U $POSTGRES_USER -d $POSTGRES_DB < signage-server/schema.sql

# Enable pgvector extension
echo "🔌 Enabling pgvector extension..."
docker exec aquatiq-postgres-local psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Connection details:"
echo "  Host: postgres (from Docker) or localhost:5432 (from host)"
echo "  Database: $POSTGRES_DB"
echo "  User: $POSTGRES_USER"
echo "  Password: $POSTGRES_PASSWORD"
echo ""
echo "You can now start the signage services:"
echo "  docker compose up -d"
