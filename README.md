# 🛡️ Security Scanner
> **Instant, comprehensive web security analysis**

## 🔥 Why We Built This
* **The Problem:** Web security analysis is **manual**, **slow**, and **requires multiple tools**, leaving many websites vulnerable to attacks.
* **The Solution:** **Security Scanner** automates all vulnerability scans and reporting with no command-line tools needed

---

## 📁 Project Structure

```
MakeUC2025-Security-Scanner/
├── frontend/           # React + TypeScript frontend
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   ├── package.json    # Frontend dependencies
│   └── README.md       # Frontend setup guide
├── backend/            # Node.js + Express backend
│   ├── services/       # Scanner services
│   ├── middleware/     # Express middleware
│   ├── package.json    # Backend dependencies
│   └── README.md       # Backend setup guide
├── README.md           # This file
└── DEPLOYMENT_GUIDE.md # Deployment instructions
```

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Security Tools](#security-tools-optional)
- [Project Features](#project-features)
- [Deployment](#deployment)

## Quick Start

**For local development, follow these steps:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vallabh-13/MakeUC2025-Security-Scanner.git
   cd MakeUC2025-Security-Scanner
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create and configure .env
   npm start             # Starts on http://localhost:3000
   ```

3. **Setup Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev           # Starts on http://localhost:5173
   ```

4. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

**That's it!** The scanner will work with basic functionality. For full features, install the security tools below.

---

## Prerequisites

### Required

-   **Node.js**: Version 20 or higher. Download from [nodejs.org](https://nodejs.org/)
-   **npm**: Node Package Manager (comes with Node.js)

### Optional Security Tools (for full functionality)

-   **Nmap**: Network scanner for port scanning
    -   **Installation**: [nmap.org/download.html](https://nmap.org/download.html)
    -   Without it: Basic connectivity checks only

-   **Nuclei**: Fast vulnerability scanner
    -   **Installation**: [github.com/projectdiscovery/nuclei#installation](https://github.com/projectdiscovery/nuclei#installation)
    -   **Update Templates**: `nuclei -update-templates`
    -   Without it: No vulnerability template scanning

-   **SSL Labs API**: Used automatically for SSL/TLS analysis (no installation required)

---

## Local Development Setup

### Backend Configuration

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file:**
   ```bash
   # Copy the example or create manually
   cp .env.example .env
   ```

3. **Edit `backend/.env`:**
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=info

   # Optional: NVD API Key for enhanced CVE lookups
   # Get one at https://nvd.nist.gov/developers/request-an-api-key
   NVD_API_KEY=your_api_key_here
   ```

### Frontend Configuration

The frontend `.env` is already configured for local development:
- `VITE_BACKEND_URL=http://localhost:3000`

No changes needed unless you change the backend port.

---

## Project Features

### Security Scans Performed

1. **Software Detection** - Identifies web servers, frameworks, and libraries
2. **SSL/TLS Analysis** - Comprehensive SSL certificate and configuration check
3. **Port Scanning** - Discovers open ports and running services
4. **Vulnerability Scanning** - Tests for known vulnerabilities using Nuclei templates
5. **CVE Database Lookup** - Checks for known vulnerabilities in detected software
6. **PDF Report Generation** - Generates downloadable security reports

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Socket.io Client (real-time updates)
- Framer Motion (animations)

**Backend:**
- Node.js + Express
- Socket.io (WebSocket server)
- Security tools integration (Nmap, Nuclei)
- Winston (logging)
- Helmet + CORS (security)

---

## Deployment

### Current Production Deployment
- **Frontend**: Netlify - https://securityscanner.netlify.app
- **Backend**: AWS Lambda (Docker/ECR) - https://gdknxtbsizoibcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/
- **Planned Domain**: securescan.tech

### Recent Updates (Nov 13, 2025)
Fixed critical bugs:
1. **Software detection failing** - Fixed undefined `html` variable causing blank PDFs
2. **Vulnerable components not detected** - Fixed property name mismatch (`comp.component` vs `comp.name`)
3. **Info severity color** - Changed from gray to cyan for better visibility in PDF reports
4. **Technology detection** - Always shows "Detected Technologies" section with helpful message when empty

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## Troubleshooting

### Port Already in Use
If port 3000 or 5173 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will automatically use the next available port

### Backend Not Connecting
- Ensure backend is running on http://localhost:3000
- Check `frontend/.env` has correct `VITE_BACKEND_URL`
- Check browser console for errors

### Security Tools Not Working
- The scanner works without Nmap/Nuclei but with limited functionality
- Install tools for full features (see Prerequisites section)
- Verify tools are in PATH: `nmap --version` and `nuclei -version`

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Links

- **Repository**: https://github.com/vallabh-13/MakeUC2025-Security-Scanner
- **Frontend README**: [frontend/README.md](./frontend/README.md)
- **Backend README**: [backend/README.md](./backend/README.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)



---





\








