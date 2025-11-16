# Security Scanner Frontend

This is the frontend application for the Security Scanner project, built with React, TypeScript, and Vite.

## Prerequisites

- Node.js 20 or higher
- npm (comes with Node.js)

## Local Development Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the frontend directory (already created for you):

```env
VITE_BACKEND_URL=http://localhost:3000
```

This tells the frontend to connect to the backend running on localhost.

### 3. Start the Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` by default.

### 4. Start the Backend

**Important:** The frontend needs the backend to be running. In a separate terminal:

```bash
cd backend
npm install
npm start
```

The backend will start on `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── assets/         # Images, icons, etc.
│   ├── App.tsx         # Main app component
│   ├── index.tsx       # Entry point
│   └── styles.css      # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS config
└── tsconfig.json       # TypeScript config
```

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time updates
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Recharts** - Data visualization

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Production Deployment on Netlify

The Security Scanner frontend is deployed on **Netlify** for fast global CDN distribution, automatic SSL, and continuous deployment.

#### 🌐 Live Application
- **Production URL:** https://securityscanner.netlify.app
- **CDN:** Global edge network for fast loading
- **SSL:** Automatic HTTPS with Let's Encrypt

---

### Deployment Configuration

The deployment is configured via `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Environment Variables for Production

When deploying to Netlify, configure these environment variables in the Netlify dashboard:

1. Go to **Site settings** → **Build & deploy** → **Environment variables**
2. Add the following variable:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_BACKEND_URL` | `https://gdknxxxxxxxxxxxxxxxcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/` | Your AWS Lambda backend URL |

**Note:** Variables must be prefixed with `VITE_` to be accessible in Vite applications.

---

### Deployment Methods

#### Option 1: Continuous Deployment (Recommended)

1. **Connect your GitHub repository to Netlify:**
   - Go to Netlify dashboard → **Add new site** → **Import an existing project**
   - Select your GitHub repository
   - Netlify will auto-detect Vite configuration

2. **Configure build settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
   - **Node version:** 20.x

3. **Add environment variables** (see above)

4. **Deploy:**
   - Click **Deploy site**
   - Every push to your main branch will auto-deploy

#### Option 2: Manual Deployment via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Navigate to frontend directory
cd frontend

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### Option 3: Drag & Drop Deployment

1. Build the project locally:
   ```bash
   cd frontend
   npm run build
   ```

2. Go to Netlify dashboard → **Sites** → **Add new site** → **Deploy manually**

3. Drag and drop the `dist/` folder


---

### Troubleshooting Deployment Issues

#### Build Fails on Netlify

**Issue:** `Failed to compile` or `Module not found`

**Solution:**
```bash
# Ensure all dependencies are in package.json (not devDependencies)
# Check that package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

#### Environment Variables Not Working

**Issue:** `VITE_BACKEND_URL is undefined`

**Solution:**
- Ensure variable name starts with `VITE_`
- Redeploy after adding environment variables
- Check Netlify build logs for variable visibility

#### 404 Errors on Page Refresh

**Issue:** Refreshing on `/scan` returns 404

**Solution:**
- Ensure `netlify.toml` has the SPA redirect rule (already configured)
- This redirects all routes to `index.html` for client-side routing

#### WebSocket Connection Fails

**Issue:** Real-time updates not working

**Solution:**
- Check that `VITE_BACKEND_URL` points to the correct Lambda URL
- Ensure Lambda function supports WebSocket connections (Socket.IO)
- Check browser console for CORS errors

---

### Rollback Deployments

If a deployment introduces bugs:

1. Go to Netlify dashboard → **Deploys**
2. Find a previous working deployment
3. Click **Publish deploy**
4. Your site instantly rolls back to that version

---

## Notes

- The frontend uses Vite's proxy feature in development to avoid CORS issues
- WebSocket connections (Socket.IO) are used for real-time scan progress updates
- The app is a Single Page Application (SPA) with client-side routing via React Router
- PDF generation happens entirely client-side using `@react-pdf/renderer`
- Dark mode is the default theme with toggle support
