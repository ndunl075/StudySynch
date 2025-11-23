#!/bin/bash

# Oracle Cloud Deployment Script for Calendar Converter

echo "Starting deployment..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Navigate to app directory
cd /home/ubuntu/calendar-converter || cd ~/calendar-converter

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Create logs directory
mkdir -p logs

# Set up PM2
pm2 delete calendar-converter 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Set up firewall (if needed)
sudo ufw allow 3000/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

echo "Deployment complete!"
echo "Your app should be running on http://your-server-ip:3000"
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs calendar-converter"

