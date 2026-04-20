#!/usr/bin/env bash
set -euo pipefail

echo "Updating Ubuntu packages..."
sudo apt update
sudo apt upgrade -y

echo "Installing base packages..."
sudo apt install -y curl nginx ufw certbot python3-certbot-nginx git build-essential

echo "Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

echo "Installing PM2..."
sudo npm install -g pm2

echo "Opening firewall for SSH and Nginx..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

echo "Versions:"
node -v
npm -v
pm2 -v

echo "Base setup complete."
