# 🚀 Deployment Guide for Security Scanner

This guide will help you deploy your security scanner to make it accessible for your hackathon demo.

## 📋 Overview

- **Frontend**: Netlify (Free tier)
- **Backend**: Render.com (Free tier)
- **Total Cost**: $0/month

## 🎯 Prerequisites

Before deploying, make sure you have:
- [ ] A GitHub account (to push your code)
- [ ] A Netlify account (sign up at https://netlify.com)
- [ ] A Render account (sign up at https://render.com)
- [ ] Your code committed to a Git repository

---

## Part 1: Deploy Backend to Render.com

### Step 1: Push Your Code to GitHub

```bash
# If you haven't already, initialize git and push to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Render Service

1. Go to https://render.com and sign in
2. Click **"New +"** button in the top right
3. Select **"Web Service"**
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `security-scanner-backend` (or your preferred name)
   - **Region**: Choose closest to your location
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Plan**: **Free**

### Step 3: Configure Environment Variables

In the Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=*
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
NVD_API_KEY=
```

> **Note**: We'll update `FRONTEND_URL` after deploying the frontend

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for the build to complete
3. Once deployed, copy your backend URL (e.g., `https://security-scanner-backend-abc123.onrender.com`)

### Step 5: Verify Backend is Running

Visit: `https://your-backend-url.onrender.com/api/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T...",
  "activeScans": 0,
  "version": "1.0.0"
}
```

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Update Frontend Environment Variable

1. Edit `.env.production` in the project root
2. Replace the backend URL:

```env
VITE_BACKEND_URL=https://your-actual-backend-url.onrender.com
```

Replace `your-actual-backend-url` with the URL from Render (Step 4 above)

3. Commit and push:
```bash
git add .env.production
git commit -m "Update backend URL for production"
git push origin main
```

### Step 2: Deploy to Netlify

#### Option A: Using Netlify CLI (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Option B: Using Netlify Dashboard

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment variables**: Add `VITE_BACKEND_URL` with your Render backend URL
5. Click **"Deploy site"**

### Step 3: Get Your Frontend URL

After deployment, Netlify will give you a URL like:
```
https://your-site-name.netlify.app
```

### Step 4: Update Backend CORS Settings

1. Go back to Render dashboard
2. Navigate to your backend service
3. Update the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-site-name.netlify.app
   ```
4. Click **"Save"** - this will trigger a redeploy

---

## Part 3: Final Testing

### Test Your Deployed Application

1. Visit your Netlify URL: `https://your-site-name.netlify.app`
2. Try scanning a website (e.g., `https://example.com`)
3. Verify that:
   - [ ] The scan starts successfully
   - [ ] Progress updates appear in real-time
   - [ ] Results are displayed correctly
   - [ ] PDF download works

---

## ⚠️ Important Notes

### Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- First request after spin-down will take 30-60 seconds
- This is normal for free tier - perfect for hackathon demos!

### Making It Fast for Demos

Before your demo/presentation:
1. Visit your site 2-3 minutes beforehand to wake up the backend
2. Do a test scan to ensure everything is working
3. Keep the tab open during your presentation

### Custom Domain (Optional)

**Netlify:**
1. Go to Site Settings → Domain Management
2. Add your custom domain
3. Follow DNS configuration instructions

**Render:**
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

---

## 🐛 Troubleshooting

### Frontend can't connect to backend

- Check `VITE_BACKEND_URL` in `.env.production` is correct
- Verify backend is deployed and running (check health endpoint)
- Check browser console for CORS errors

### Backend errors on Render

- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Ensure Docker build completed successfully

### "Service Unavailable" errors

- Backend is probably spinning down (free tier)
- Wait 30-60 seconds and try again
- The service will wake up automatically

### Scans timing out

- Render free tier has limited CPU/memory
- This is expected for complex scans
- Consider simplifying scan operations for demo

---

## 📊 Monitoring

### Check Backend Health
```bash
curl https://your-backend-url.onrender.com/api/health
```

### View Backend Logs
1. Go to Render dashboard
2. Click on your service
3. Navigate to "Logs" tab

### Check Frontend Build
1. Go to Netlify dashboard
2. Click on your site
3. Navigate to "Deploys" tab

---

## 🎉 You're Done!

Your security scanner is now live and accessible to hackathon judges and attendees!

**Share your links:**
- 🌐 Frontend: `https://your-site-name.netlify.app`
- 🔧 Backend API: `https://your-backend-url.onrender.com`
- 📊 Health Check: `https://your-backend-url.onrender.com/api/health`

---

## 💡 Tips for Hackathon Demo

1. **Test before presenting**: Do a full scan test 5 minutes before your demo
2. **Have a backup**: Record a video of the scan in case of connectivity issues
3. **Prepare examples**: Have 2-3 good URLs ready to scan (your site, example.com, etc.)
4. **Explain limitations**: Mention it's a hackathon project on free tier if there are delays
5. **Show the features**: Highlight real-time updates, PDF reports, and security scoring

Good luck with your hackathon! 🚀
