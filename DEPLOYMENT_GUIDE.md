# Deployment Guide: Netlify + Fly.io

This guide will walk you through deploying your Security Scanner application using **Netlify** for the frontend and **Fly.io** for the backend.

## Prerequisites

Before you begin, make sure you have:
- A GitHub account with your code pushed
- Git installed locally
- Node.js 20+ installed

## Part 1: Deploy Backend to Fly.io

### Step 1: Install Fly.io CLI

**Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Sign Up / Login to Fly.io

```bash
fly auth signup
# OR if you already have an account:
fly auth login
```

### Step 3: Navigate to Backend Directory

```bash
cd backend
```

### Step 4: Launch Your App on Fly.io

```bash
fly launch
```

When prompted:
- **App name**: Press Enter to accept `security-scanner-backend` (or choose your own)
- **Region**: Choose the closest region to you (e.g., `iad` for US East)
- **Would you like to set up a PostgreSQL database?**: **No**
- **Would you like to set up a Redis database?**: **No**
- **Would you like to deploy now?**: **No** (we'll set up secrets first)

### Step 5: Set Environment Variables (Secrets)

```bash
# Set production environment
fly secrets set NODE_ENV=production

# Set rate limiting (optional - adjust as needed)
fly secrets set RATE_LIMIT_WINDOW_MS=900000
fly secrets set RATE_LIMIT_MAX_REQUESTS=100

# Set log level
fly secrets set LOG_LEVEL=info

# If you have an NVD API key for CVE lookups (optional but recommended)
fly secrets set NVD_API_KEY=your-api-key-here
```

> **Get NVD API Key (Optional but Recommended):**
> Visit https://nvd.nist.gov/developers/request-an-api-key and request a free API key.

### Step 6: Deploy to Fly.io

```bash
fly deploy
```

This will:
- Build your Docker container
- Push it to Fly.io
- Deploy your app

Wait for the deployment to complete (3-5 minutes).

### Step 7: Verify Backend Deployment

```bash
fly status
fly open
```

Your backend URL will be: `https://security-scanner-backend.fly.dev` (or your custom app name)

Test the health endpoint:
```bash
curl https://security-scanner-backend.fly.dev/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-11-11T...",
  "version": "1.0.0"
}
```

### Step 8: Monitor Logs (Optional)

```bash
fly logs
```

### Step 9: Copy Your Backend URL

**IMPORTANT**: Copy your full backend URL (e.g., `https://security-scanner-backend.fly.dev`)
You'll need this in the next section!

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Update Backend URL in Netlify Config

Open `frontend/netlify.toml` and update line 13 with your **actual Fly.io backend URL** from Part 1, Step 9:

```toml
VITE_BACKEND_URL = "https://YOUR-ACTUAL-APP-NAME.fly.dev"
```

For example:
```toml
VITE_BACKEND_URL = "https://security-scanner-backend.fly.dev"
```

### Step 2: Commit and Push Changes

```bash
git add .
git commit -m "Update backend URL for Fly.io deployment"
git push origin main
```

### Step 3: Sign Up / Login to Netlify

1. Go to https://app.netlify.com/signup
2. Sign up with GitHub (recommended) or email
3. Authorize Netlify to access your repositories

### Step 4: Create New Site from Git

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"GitHub"**
3. Search for and select your repository: `MakeUC2025-Security-Scanner`
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`
   - **Branch to deploy**: `main`

5. Click **"Deploy site"**

### Step 5: Wait for Deployment

Netlify will:
- Clone your repository
- Run the build command
- Deploy your site (2-3 minutes)

### Step 6: Your Site is Live! 🎉

Once deployed, Netlify will give you a URL like:
```
https://random-name-12345.netlify.app
```

### Step 7: (Optional) Custom Domain

If you want a custom domain:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow Netlify's instructions to configure DNS

---

## Part 3: Testing Your Deployment

### Test Frontend

1. Open your Netlify URL in a browser
2. You should see the Security Scanner interface

### Test Full Integration

1. Enter a test URL (e.g., `https://example.com`)
2. Click **"Start Scan"**
3. Watch the real-time progress
4. Verify the scan completes and shows results
5. Try downloading the PDF report

---

## Important URLs to Save

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend (Netlify)** | `https://your-site.netlify.app` | User interface |
| **Backend (Fly.io)** | `https://your-app.fly.dev` | API server |
| **Health Check** | `https://your-app.fly.dev/api/health` | Backend status |

---

## Monitoring & Maintenance

### View Fly.io Logs
```bash
fly logs
```

### View Netlify Logs
1. Go to your Netlify dashboard
2. Click on your site
3. Go to **"Deploys"** tab
4. Click on any deploy to see logs

### Scale Fly.io if Needed
```bash
# Check current status
fly status

# Scale memory (if you hit limits)
fly scale memory 512

# Scale to multiple regions (for better performance)
fly scale count 2
```

---

## Troubleshooting

### Backend Issues

**Problem: Backend not responding**
```bash
fly logs
fly status
fly doctor
```

**Problem: Memory errors**
```bash
# Increase memory allocation
fly scale memory 512
```

**Problem: Nuclei templates not loading**
```bash
fly ssh console
nuclei -update-templates
exit
```

### Frontend Issues

**Problem: Can't connect to backend**
- Check that `VITE_BACKEND_URL` in `netlify.toml` matches your Fly.io URL
- Redeploy frontend after fixing:
  ```bash
  git add frontend/netlify.toml
  git commit -m "Fix backend URL"
  git push
  ```

**Problem: Build fails**
- Check Netlify build logs
- Ensure `frontend/package.json` has correct dependencies
- Try running `npm run build` locally first

---

## Cost Breakdown (Free Tiers)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Netlify** | Free forever | 100GB bandwidth/month, Unlimited sites |
| **Fly.io** | Free tier | 3 shared-cpu VMs, 256MB RAM each, 3GB storage |

**Estimated monthly cost: $0** (within free tier limits)

---

## Next Steps

- Share your live URL with others to test
- Monitor usage in both dashboards
- Set up custom domain (optional)
- Enable analytics (both platforms offer free analytics)

---

## Support

- **Fly.io Docs**: https://fly.io/docs/
- **Netlify Docs**: https://docs.netlify.com/
- **Project Issues**: https://github.com/vallabh-13/MakeUC2025-Security-Scanner/issues

---

Happy Scanning! 🔒✨
