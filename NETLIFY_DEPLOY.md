# Netlify Deployment Guide

## ✅ Prerequisites
- Your backend is running on EC2: `http://3.19.232.233:3000`
- Netlify account (free tier works)
- Git repository pushed to GitHub/GitLab/Bitbucket

---

## 🚀 Method 1: Deploy via Netlify UI (Easiest)

### Step 1: Build Locally (Optional - to test)
```bash
npm run build
```
This creates the `dist/` folder with your production build.

### Step 2: Deploy to Netlify

#### Option A: Drag & Drop
1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your `dist` folder
4. Done! Your site will be live in seconds

#### Option B: Connect to Git (Recommended)
1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository: `MakeUC2025-Security-Scanner`
5. Configure build settings:
   - **Base directory**: (leave empty)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Add environment variable":
   - Key: `VITE_BACKEND_URL`
   - Value: `http://3.19.232.233:3000`
7. Click "Deploy site"

### Step 3: Wait for Build
Netlify will automatically:
- Install dependencies
- Build your project
- Deploy to a `*.netlify.app` domain

---

## 🔧 Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```bash
netlify login
```

### Step 3: Initialize and Deploy
```bash
# Initialize Netlify in your project
netlify init

# Build your project
npm run build

# Deploy to production
netlify deploy --prod --dir=dist
```

---

## ⚙️ Environment Variables in Netlify

After deployment, set environment variables:

1. Go to your site in Netlify dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Add variable:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: `http://3.19.232.233:3000`
4. Click "Save"
5. Trigger a redeploy: **Deploys** → **Trigger deploy** → **Deploy site**

---

## 🔒 Update Backend CORS (IMPORTANT!)

Once you have your Netlify domain (e.g., `https://your-app.netlify.app`), update the backend:

### Option 1: SSH into EC2 and update .env
```bash
ssh -i your-key.pem ubuntu@3.19.232.233

cd /path/to/MakeUC2025-Security-Scanner/backend

# Edit .env file
nano .env

# Change this line:
# FRONTEND_URL=*

# To your Netlify domain:
FRONTEND_URL=https://your-app.netlify.app

# Save and restart backend
pm2 restart all
```

### Option 2: Support multiple domains
```bash
# In backend/.env
FRONTEND_URL=https://your-app.netlify.app,http://localhost:5173
```

Then update `backend/server.js` to split and use array:
```javascript
// Parse multiple URLs
const allowedOrigins = process.env.FRONTEND_URL === '*'
  ? '*'
  : process.env.FRONTEND_URL.split(',');
```

---

## 🧪 Testing Your Deployment

1. **Visit your Netlify URL**: `https://your-app.netlify.app`
2. **Open browser console** (F12)
3. **Try scanning a website**
4. Check for:
   - ✅ WebSocket connection successful
   - ✅ No CORS errors
   - ✅ API requests working

### Common Issues

#### Issue 1: CORS Error
```
Access to fetch at 'http://3.19.232.233:3000/api/scan' from origin
'https://your-app.netlify.app' has been blocked by CORS policy
```
**Solution**: Update backend `FRONTEND_URL` in `.env` with your Netlify domain

#### Issue 2: Mixed Content Error (HTTP/HTTPS)
```
Mixed Content: The page at 'https://your-app.netlify.app' was loaded over
HTTPS, but requested an insecure resource 'http://3.19.232.233:3000'
```
**Solution**: You need to add HTTPS to your EC2 backend:
1. Get a domain name
2. Point it to your EC2 IP
3. Setup nginx with Let's Encrypt SSL

**Temporary Solution**: Use HTTP backend URL (not recommended for production)

#### Issue 3: WebSocket Connection Failed
**Solution**: Check if EC2 security group allows traffic on port 3000 from 0.0.0.0/0

---

## 🎯 Custom Domain (Optional)

### Add Custom Domain to Netlify
1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow DNS configuration instructions

---

## 🔄 Auto-Deploy on Git Push

If you connected via Git (Method 1, Option B):
- Every push to `main` branch automatically triggers a new deployment
- Check build logs in Netlify dashboard

To disable auto-deploy:
1. **Site settings** → **Build & deploy** → **Continuous deployment**
2. Click "Stop builds"

---

## 📊 Monitor Your Deployment

### Check Build Logs
- Go to **Deploys** tab
- Click on latest deploy
- View build logs for errors

### Check Function Logs (if using Netlify Functions)
- Go to **Functions** tab
- View real-time logs

### Analytics
- Go to **Analytics** tab (may require paid plan)

---

## 💡 Pro Tips

1. **Preview Deployments**: Every PR gets a unique preview URL
2. **Rollback**: Click any previous deploy and click "Publish deploy"
3. **Split Testing**: Test different versions with traffic splitting
4. **Edge Functions**: Run serverless functions at the edge (optional)

---

## 🆘 Troubleshooting

### Build Fails on Netlify
```bash
# Check your build works locally first
npm ci
npm run build

# If it works locally, check Netlify build logs for specific error
```

### Environment Variable Not Working
- Ensure variable name starts with `VITE_` for Vite
- Redeploy after adding/changing env vars
- Check build logs to confirm variable is set

### Site Shows Blank Page
- Check browser console for errors
- Verify `dist/index.html` exists after build
- Check `netlify.toml` publish directory is correct

---

## ✅ Deployment Checklist

- [ ] Backend running on EC2 at `http://3.19.232.233:3000`
- [ ] `.env` file has `VITE_BACKEND_URL=http://3.19.232.233:3000`
- [ ] Build works locally (`npm run build`)
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Environment variables set in Netlify
- [ ] Build settings configured correctly
- [ ] Site deployed successfully
- [ ] Backend CORS updated with Netlify domain
- [ ] Tested scan functionality on live site
- [ ] Custom domain configured (optional)

---

## 🎉 Your site is live!

Your Netlify URL will be: `https://[random-name].netlify.app`

You can change this to a custom name:
**Site settings** → **Site details** → **Change site name**
