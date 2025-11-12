# 🚀 Render + Netlify Deployment Guide

**Total Time:** ~15 minutes
**Cost:** $0.00 (100% Free)
**Credit Card:** Not required

---

## ✅ Pre-Deployment Checklist

- [ ] GitHub repository is up to date
- [ ] `render.yaml` created in root directory
- [ ] `frontend/netlify.toml` configured

---

## 📦 STEP 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to: https://render.com/
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest method)
4. Authorize Render to access your GitHub repositories

### 1.2 Create New Web Service
1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Connect your repository:
   - Search for: `MakeUC2025-Security-Scanner`
   - Click **"Connect"**

### 1.3 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name:** `security-scanner-backend` (or your choice)
- **Region:** `Oregon` (US West) - *required for free tier*
- **Branch:** `main`
- **Root Directory:** `backend`

**Build Settings:**
- **Runtime:** `Docker`
- **Dockerfile Path:** `Dockerfile` (should auto-detect)

**Instance Type:**
- **Plan:** `Free` - **512MB RAM, $0/month**

**Environment Variables:**
Click "Add Environment Variable" for each:
```
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=*
```

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for first deployment
3. Watch the build logs (you'll see):
   - Docker image building
   - Installing nmap, nuclei
   - Downloading nuclei templates (~3000 templates)
   - Server starting

### 1.5 Get Your Backend URL
Once deployed (status: "Live" with green dot):
- Copy the URL from the top of the page
- Format: `https://security-scanner-backend-XXXX.onrender.com`
- **Save this URL - you'll need it for Step 2!**

### 1.6 Test Backend
Open in browser:
```
https://YOUR-BACKEND-URL.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T...",
  "activeScans": 0,
  "version": "1.0.0"
}
```

✅ **Backend deployed successfully!**

---

## 🎨 STEP 2: Update Frontend Configuration

### 2.1 Update Netlify Config
Edit `frontend/netlify.toml` line 13:

**Replace:**
```toml
VITE_BACKEND_URL = "https://security-scanner-backend-PLACEHOLDER.onrender.com"
```

**With your actual Render URL:**
```toml
VITE_BACKEND_URL = "https://YOUR-ACTUAL-URL.onrender.com"
```

### 2.2 Commit Changes
```bash
git add .
git commit -m "Configure for Render + Netlify deployment"
git push origin main
```

---

## 🌐 STEP 3: Deploy Frontend to Netlify

### 3.1 Create Netlify Account
1. Go to: https://app.netlify.com/
2. Click **"Sign up"**
3. Sign up with **GitHub** (easiest)
4. Authorize Netlify

### 3.2 Deploy from GitHub
1. Click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"**
3. Select your repository: `MakeUC2025-Security-Scanner`
4. Configure build settings:

**Build Settings:**
- **Base directory:** `frontend`
- **Build command:** `npm install && npm run build`
- **Publish directory:** `frontend/dist`
- **Branch:** `main`

5. Click **"Deploy site"**

### 3.3 Wait for Deployment
- Takes 2-3 minutes
- Watch the deploy log
- Status will change to "Published"

### 3.4 Get Your Frontend URL
- Netlify gives you a random URL like: `https://random-name-12345.netlify.app`
- You can customize this later in Site Settings

---

## 🎉 STEP 4: Test Everything

### 4.1 Open Your App
Visit your Netlify URL: `https://your-app.netlify.app`

### 4.2 Run a Test Scan
1. Enter a URL (try: `https://example.com`)
2. Click "Start Scan"
3. Watch real-time progress
4. View results

### 4.3 Verify Backend Connection
In browser DevTools (F12) → Network tab:
- Should see WebSocket connection to your Render backend
- API calls should go to `https://YOUR-BACKEND.onrender.com`

---

## ⚙️ STEP 5: Configure CORS (Important!)

Go back to Render dashboard:

1. Open your backend service
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-actual-netlify-app.netlify.app
   ```
4. Click **"Save Changes"**
5. Service will auto-redeploy (takes ~30 seconds)

This ensures only your frontend can access your backend.

---

## 🎯 Final URLs

Save these for reference:

**Backend (Render):**
- URL: `https://security-scanner-backend-XXXX.onrender.com`
- Health Check: `/api/health`
- Logs: Render Dashboard → Your Service → Logs

**Frontend (Netlify):**
- URL: `https://your-app.netlify.app`
- Deploys: Netlify Dashboard → Site → Deploys
- Logs: Click on any deploy to see logs

---

## ⚠️ Important Notes

### Render Free Tier Limits:
- ✅ 512MB RAM
- ✅ 750 hours/month free
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **Takes ~30 seconds to wake up** on first request
- ✅ No request limits
- ✅ Automatic HTTPS

### First Request After Sleep:
- User visits your site → Frontend loads instantly
- User starts scan → Backend wakes up (~30 sec delay)
- After that → All scans are instant until it sleeps again

### Keeping Backend Awake (Optional):
Use a free uptime monitor to ping your backend every 14 minutes:
- https://uptimerobot.com/ (free)
- Ping URL: `https://YOUR-BACKEND.onrender.com/api/health`
- Interval: Every 14 minutes

---

## 🔧 Troubleshooting

### Backend won't start
**Check Render logs:**
- Render Dashboard → Your Service → Logs
- Look for errors in Docker build
- Common issues:
  - Nuclei templates failing to download (can ignore, will download on first scan)
  - Port already in use (shouldn't happen on Render)

### Frontend can't connect to backend
**Check:**
1. Backend health endpoint works: `https://YOUR-BACKEND.onrender.com/api/health`
2. `netlify.toml` has correct backend URL
3. CORS is configured with correct frontend URL
4. Both deployments are "Live"

### Scans timing out
**First scan after sleep:**
- Backend needs 30 seconds to wake up
- Plus 5-10 minutes for scan = ~6 minutes total
- Tell users first scan may take longer

**Ongoing scans:**
- Should complete in 4-5 minutes

### Out of Memory on Render
**Shouldn't happen** - your app uses ~450MB max, Render gives 512MB
If it does:
- Check Render metrics/logs
- May need to reduce `MAX_CONCURRENT_SCANS` to 1 (already set)

---

## 🎊 Success Criteria

✅ Backend health check returns `{"status": "ok"}`
✅ Frontend loads and shows scan form
✅ Can complete a full scan successfully
✅ Real-time progress updates work
✅ PDF report downloads work
✅ No CORS errors in browser console

---

## 📈 Optional: Custom Domain

**Backend (Render):**
- Render Dashboard → Your Service → Settings → Custom Domains
- Add your domain (e.g., `api.yourdomain.com`)

**Frontend (Netlify):**
- Netlify Dashboard → Site Settings → Domain Management
- Add custom domain (e.g., `scanner.yourdomain.com`)

Both provide free SSL certificates automatically!

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Netlify Docs:** https://docs.netlify.com/
- **Project Issues:** https://github.com/vallabh-13/MakeUC2025-Security-Scanner/issues

---

**Estimated Total Time:** 15 minutes
**Total Cost:** $0.00
**Maintenance:** $0.00/month

Happy scanning! 🔒✨
