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

This frontend is configured to deploy to Netlify. See `netlify.toml` for configuration.

## Notes

- The frontend uses Vite's proxy feature in development to avoid CORS issues
- WebSocket connections are used for real-time scan progress updates
- The app is a Single Page Application (SPA) with client-side routing
