# Oracle Cloud Deployment Guide

This guide will help you deploy the Calendar Converter application on Oracle Cloud Infrastructure (OCI) Always Free Tier.

## Prerequisites

1. An Oracle Cloud account (sign up at https://cloud.oracle.com)
2. An Always Free compute instance running Ubuntu 20.04 or 22.04

## Step 1: Create an Always Free Compute Instance

1. Log in to Oracle Cloud Console
2. Navigate to **Compute** > **Instances**
3. Click **Create Instance**
4. Configure:
   - **Name**: calendar-converter (or your preferred name)
   - **Image**: Ubuntu 20.04 or 22.04
   - **Shape**: VM.Standard.A1.Flex (Always Free eligible)
   - **OCPUs**: 1
   - **Memory**: 6 GB
   - **Networking**: Create new VCN or use existing
   - **Add SSH keys**: Upload your public SSH key
5. Click **Create**

## Step 2: Configure Security Rules

1. Go to **Networking** > **Virtual Cloud Networks**
2. Select your VCN
3. Go to **Security Lists**
4. Click on the default security list
5. Add **Ingress Rule**:
   - **Source Type**: CIDR
   - **Source CIDR**: 0.0.0.0/0
   - **IP Protocol**: TCP
   - **Destination Port Range**: 3000
   - **Description**: Allow HTTP traffic for Calendar Converter

## Step 3: Connect to Your Instance

```bash
ssh ubuntu@<your-instance-public-ip>
```

## Step 4: Deploy the Application

### Option A: Using Git (Recommended)

```bash
# Install Git
sudo apt-get update
sudo apt-get install -y git

# Clone your repository
git clone <your-repo-url> calendar-converter
cd calendar-converter

# Or upload files using SCP from your local machine
```

### Option B: Upload Files via SCP

From your local machine:

```bash
scp -r * ubuntu@<your-instance-ip>:~/calendar-converter/
```

## Step 5: Run Deployment Script

```bash
cd ~/calendar-converter
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Step 6: Configure Environment Variables

The API key is already in the code, but if you want to use environment variables:

```bash
# Edit server.js or set environment variable
export GEMINI_API_KEY="your-api-key-here"
```

Or create a `.env` file (you'll need to install dotenv package):

```bash
npm install dotenv
```

Then create `.env`:
```
GEMINI_API_KEY=your-api-key-here
PORT=3000
NODE_ENV=production
```

## Step 7: Set Up Reverse Proxy (Optional but Recommended)

Install Nginx:

```bash
sudo apt-get install -y nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/calendar-converter
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/calendar-converter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Access Your Application

- Direct access: `http://<your-instance-ip>:3000`
- Via Nginx (if configured): `http://<your-instance-ip>` or `http://your-domain.com`

## Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs calendar-converter

# Restart application
pm2 restart calendar-converter

# Stop application
pm2 stop calendar-converter

# Monitor resources
pm2 monit
```

## Troubleshooting

### Application not accessible

1. Check if the app is running: `pm2 status`
2. Check firewall: `sudo ufw status`
3. Check security rules in OCI console
4. Check if port 3000 is listening: `sudo netstat -tlnp | grep 3000`

### Application crashes

1. Check logs: `pm2 logs calendar-converter`
2. Check system resources: `free -h` and `df -h`
3. Restart: `pm2 restart calendar-converter`

### Out of memory

The Always Free tier has limited resources. If you encounter memory issues:
- Reduce PM2 instances to 1
- Consider using a lighter Node.js version
- Monitor with `pm2 monit`

## Notes

- Always Free tier has limited resources - monitor usage
- The instance may be stopped if inactive for extended periods
- Consider setting up automatic backups
- Keep your API keys secure

## Next Steps

- Set up a domain name (optional)
- Configure SSL/HTTPS with Let's Encrypt (optional)
- Set up monitoring and alerts
- Configure automatic restarts

