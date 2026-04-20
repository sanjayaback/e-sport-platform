#!/usr/bin/env bash
set -euo pipefail

APP_NAME="kill-pro-esports"
APP_DIR="/var/www/kill-pro-esports"

cd "$APP_DIR"

echo "Installing dependencies..."
npm ci

echo "Validating production env..."
node deploy/check-env.cjs .env.production.local

echo "Building Next.js app..."
npm run build

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "Restarting PM2 app..."
  pm2 restart "$APP_NAME" --update-env
else
  echo "Starting PM2 app..."
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "Deployment complete."
