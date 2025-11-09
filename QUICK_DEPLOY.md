# ⚡ Quick Deployment Checklist

Use this for rapid deployment during hackathon crunch time!

## 🎯 Step-by-Step Quick Deploy

### 1️⃣ Deploy Backend (5 minutes)

```bash
# Push code to GitHub
git add .
git commit -m "Deploy to production"
git push origin main
```

1. Go to https://render.com → **New +** → **Web Service**
2. Select your GitHub repo
3. Settings:
   - Runtime: **Docker**
   - Plan: **Free**
4. Add environment variable: `FRONTEND_URL=*`
5. Click **Create Web Service**
6. ⏰ Wait 5-10 minutes
7. Copy your backend URL: `https://xxxxx.onrender.com`

---

### 2️⃣ Update Frontend Config (1 minute)

Edit `.env.production`:
```env
VITE_BACKEND_URL=https://your-backend-from-step1.onrender.com
```

```bash
git add .env.production
git commit -m "Update backend URL"
git push origin main
```

---

### 3️⃣ Deploy Frontend (3 minutes)

**Using Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

**OR Using Dashboard:**
1. https://app.netlify.com → **Add new site**
2. Connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

---

### 4️⃣ Test It (1 minute)

1. Open your Netlify URL
2. Scan `https://example.com`
3. Check if results appear ✅

---

## 🆘 If Something Breaks

**Can't connect to backend:**
- Wait 60 seconds (backend waking up)
- Check backend health: `https://your-backend.onrender.com/api/health`

**Build fails:**
- Check Render/Netlify logs
- Verify environment variables are set

**CORS errors:**
- Update `FRONTEND_URL` in Render with your Netlify URL
- Or set it to `*` for hackathon demo

---

## 📋 URLs to Save

After deployment, save these:

```
Frontend: https://_____________.netlify.app
Backend:  https://_____________.onrender.com
Health:   https://_____________.onrender.com/api/health
```

## ⚡ Pre-Demo Checklist

5 minutes before presenting:
- [ ] Visit your site to wake up backend
- [ ] Do a test scan
- [ ] Screenshot working results (backup)
- [ ] Keep browser tab open

---

**Total Time: ~10 minutes** ⏱️

Good luck! 🚀
