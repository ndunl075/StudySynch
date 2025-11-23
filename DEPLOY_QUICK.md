# Quick Deployment Guide

## Option 1: Railway (Easiest - Recommended)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your StudySynch repository
6. Railway will auto-detect Node.js and deploy
7. Your app will be live at `https://your-app-name.up.railway.app`

**That's it!** Railway handles everything automatically.

---

## Option 2: Render (Free Tier Available)

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: calendar-converter
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid)
6. Click "Create Web Service"
7. Your app will be live at `https://calendar-converter.onrender.com`

---

## Option 3: Fly.io (Good Performance)

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Sign up: `fly auth signup`
3. In your project directory:
   ```bash
   fly launch
   ```
4. Follow the prompts
5. Deploy: `fly deploy`
6. Your app will be live at `https://your-app-name.fly.dev`

---

## Option 4: Oracle Cloud (Always Free)

See `DEPLOYMENT.md` for detailed Oracle Cloud instructions.

---

## Option 5: DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub repository
4. Select your StudySynch repo
5. Configure:
   - **Type**: Web Service
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
6. Deploy!

---

## Important Notes for All Platforms

- **Set the GEMINI_API_KEY environment variable** in your platform's settings
- Get your API key from: https://makersuite.google.com/app/apikey
- Add it as an environment variable named `GEMINI_API_KEY`
- Make sure port is set to use `process.env.PORT` (already configured)
- The app listens on `0.0.0.0` (already configured)
- Static files are served from `frontend/` directory (already configured)

## Recommended: Railway

Railway is the easiest option - just connect your GitHub repo and it deploys automatically!

