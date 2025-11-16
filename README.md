# 🛡️ Security Scanner (MAKEUC 2025 Hackathon)

## Click the links below to explore the running application and test its functionality.

- **Live Website:** [Demo Link](https://securityscanner.netlify.app/)
- **Demo Video:** [Test Link](https://your-test-link-here)

## 🔥 Why We Built This

* **The Problem:** Web security analysis is often **manual**, **slow**, and **requires multiple specialized command-line tools**, creating a high barrier to entry. This leaves countless small to mid-sized websites exposed to easily preventable attacks, as comprehensive auditing is too complex or costly for most developers and site owners.

* **The Solution:** We saw that while powerful security testing tools exist (like Nmap, CVE, SSL Labs and Nuclei), they are inaccessible to many. Our goal was to democratize web security by building a simple, unified interface. **Security Scanner** was born from the idea of automating all necessary vulnerability scans and reporting into a single one-click web application with absolutely no command-line tools needed by the user.

## 🚀 How We're Solving It

We built a single web application that handles the entire security lifecycle:

*   **Input & Execution:** The user provides a URL to our front end.
*   **API Abstraction:** Our custom backend API (deployed as AWS Lambda functions) acts as an orchestrator, securely integrating and running established testing resources like SSL Labs      Nmap, CVE and Nuclei against the input URL.
*   **Data Consolidation:** We parse the raw output from these tools, merge it with custom vulnerability checks (like missing security headers), and normalize it into clear, readable data.
*   **Actionable Reporting:** Finally, we generate a clean PDF report with a Security Score and specific remediation steps for every finding.

## Project Features

### Security Scans Performed

1. **Software Detection** - Identifies web servers, frameworks, and libraries using Cheerio HTML parsing
2. **SSL/TLS Analysis** - Comprehensive SSL certificate and configuration check via SSL Labs API
3. **Port Scanning** - Discovers open ports and running services using Nmap 7.95
4. **Vulnerability Scanning** - Tests for known vulnerabilities using Nuclei templates (latest version)
5. **CVE Database Lookup** - Checks for known vulnerabilities in detected software via NVD API
6. **Security Headers Analysis** - Checks for missing security headers (CSP, HSTS, X-Frame-Options, etc.)
7. **Real-time Progress Updates** - Live scan status updates via Socket.IO
8. **Security Scoring** - Automated security score calculation with lenient scoring (HTTP-only sites not penalized)
9. **PDF Report Generation** - Client-side PDF generation with detailed findings and remediation steps

---

## Team Contributors

- [Ilyaas K](https://www.linkedin.com/in/ilyaask/)
- [Bhanudas Mahadik](https://www.linkedin.com/in/bhanudas-mahadik/)
- [Nguyen Hile](https://www.linkedin.com/in/nhiledn06/)
- [An Nguyen Le](https://www.linkedin.com/in/an-nguyen-le-782788342/)
  
---

## System Architecture Diagram
(A visual diagram will be inserted here. Below is a textual representation of the system flow.)

![alt text](Diagram/makeuc-2025)

---

## 📁 Project Structure

```
MakeUC2025-Security-Scanner/
├── backend/
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handling middleware
│   ├── services/
│   │   ├── cveDatabase.js         # CVE vulnerability lookup service
│   │   ├── nmapScanner.js         # Network port scanning service
│   │   ├── nucleiScanner.js       # Vulnerability template scanning
│   │   ├── softwareDetector.js    # Web technology detection
│   │   ├── SSLLabsScanner.js      # SSL/TLS analysis integration
│   │   └── urlValidator.js        # URL validation utilities
│   ├── utils/
│   │   ├── aggregator.js          # Scan result aggregation & scoring
│   │   └── logger.js              # Winston-based logging utility
│   ├── cache/                     # Runtime cache directory
│   ├── logs/                      # Application logs
│   ├── server.js                  # Main Express server (local development)
│   ├── lambda.js                  # AWS Lambda handler wrapper
│   ├── Dockerfile                 # Multi-stage Docker build for Lambda
│   ├── deploy-lambda.ps1          # PowerShell deployment script
│   ├── package.json               # Backend dependencies
│   └── .env                       # Environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DarkModeToggle.tsx     # Theme switching component
│   │   │   ├── Footer.tsx             # Application footer
│   │   │   ├── Header.tsx             # Navigation header
│   │   │   ├── ScanForm.tsx           # URL input form
│   │   │   ├── ScanResults.tsx        # Real-time scan results display
│   │   │   └── SecurityReportPDF.tsx  # PDF report generator (@react-pdf/renderer)
│   │   ├── pages/
│   │   │   └── MainPage.tsx           # Main application page
│   │   ├── App.tsx                    # Root application component
│   │   ├── index.tsx                  # Application entry point
│   │   └── styles.css                 # Global styles
│   ├── public/                        # Static assets
│   ├── dist/                          # Build output
│   ├── vite.config.ts                 # Vite configuration
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── netlify.toml                   # Netlify deployment config
│   ├── package.json                   # Frontend dependencies
│   └── .env                           # Environment variables
│
├── Diagram/
│   └── makeuc-2025.png                # System architecture & workflow diagram
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Major Errors Fixed](#major-errors-fixed)
- [What We Learned](#what-we-learned)

---

## Prerequisites

### Required

-   **Node.js**: Version 20 or higher (recommended: 20.x LTS). Download from [nodejs.org](https://nodejs.org/)
-   **npm**: Node Package Manager (comes with Node.js)

### For Local Development (Security Tools)

For full local functionality, you can optionally install these tools. **Note:** In production, these are containerized in our AWS Lambda deployment and require no manual installation.

-   **Nmap 7.95+**: Network scanner for port scanning
    -   **Installation**: [nmap.org/download.html](https://nmap.org/download.html)
    -   Without it: Basic connectivity checks only (local dev)

-   **Nuclei**: Fast vulnerability scanner
    -   **Installation**: [github.com/projectdiscovery/nuclei#installation](https://github.com/projectdiscovery/nuclei#installation)
    -   **Update Templates**: `nuclei -update-templates`
    -   Without it: No vulnerability template scanning (local dev)

-   **SSL Labs API**: Used automatically for SSL/TLS analysis (no installation required)

### For AWS Deployment (Optional)

-   **AWS CLI**: For deploying to AWS Lambda
-   **Docker**: For building container images
-   **PowerShell** (Windows) or **Bash** (Linux/Mac): For running deployment scripts

---

## Local Development Setup (clone the repository first)

### Backend Configuration

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the `backend/` directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # Frontend URLs (for CORS - comma-separated for multiple origins)
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Concurrency Control
   # Adjust based on available memory (3-5 for Lambda with 1GB, higher for more memory)
   MAX_CONCURRENT_SCANS=5

   # Logging
   LOG_LEVEL=info

   # Optional: NVD API Key for enhanced CVE lookups
   # Get one at https://nvd.nist.gov/developers/request-an-api-key
   NVD_API_KEY=
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`

### Frontend Configuration

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** in the `frontend/` directory:
   ```env
   # Backend API URL
   VITE_BACKEND_URL=http://localhost:3000
   ```

   **Note:** For production deployment on Netlify, update this to your Lambda URL:
   ```env
   VITE_BACKEND_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws/
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

5. **Build for production:**
   ```bash
   npm run build
   ```
   Output will be in the `dist/` directory

---

## Deployment

Our deployment strategy leverages a **hybrid architecture** for optimal performance and separation of concerns:

### 🌐 Frontend (Netlify)
- **Platform:** Netlify with global CDN
- **Production URL:** https://securityscanner.netlify.app
- **Technology:** React 19 + TypeScript + Vite 7
- **Features:** Automatic SSL, continuous deployment, client-side PDF generation

📖 **[View Detailed Frontend Deployment Guide →](./frontend/README.md#deployment)**

### ⚡ Backend (AWS Lambda)
- **Platform:** AWS Lambda with containerized deployment via ECR
- **Lambda URL:** https://gdknxtbsizoibcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/
- **Technology:** Node.js 20, Express 5, Docker multi-stage builds
- **Features:** Nmap 7.95 (compiled from source), Nuclei (latest), Socket.IO real-time updates

📖 **[View Detailed Backend Deployment Guide →](./backend/README.md#deployment)**

---

## Major Errors Fixed
We tackled numerous challenges to ensure a reliable system, addressing several critical issues:

*   **Lambda Multi-Container 404 Errors (Nov 15, 2025):**
    *   **Problem:** When multiple scan requests hit different Lambda container instances simultaneously, subsequent requests would receive 404 errors due to race conditions in scan state management.
    *   **Solution:** Implemented synchronous scan execution to ensure only one scan runs at a time per Lambda instance, eliminating container conflicts and 404 errors. This was crucial for production stability.

*   **Lenient Security Scoring for HTTP Sites (Nov 15, 2025):**
    *   **Problem:** HTTP-only websites were being unfairly penalized with strict grading for HTTPS-related security checks they couldn't possibly pass.
    *   **Solution:** Implemented lenient scoring logic that adjusts expectations based on whether the site uses HTTPS. HTTP sites are now graded fairly without harsh penalties for missing HTTPS-specific features.

*   **Unused React Hook References (Nov 14, 2025):**
    *   **Problem:** Unused `useRef` imports and references (like `lastStepRef`) were causing linting errors and cluttering the codebase.
    *   **Solution:** Removed unused imports and references, cleaning up the code and resolving build warnings.

*   **PDF Generation Overhaul (Nov 14, 2025):**
    *   **Problem:** Initial PDF generation on the backend (Lambda) led to issues like blank pages, rendering problems, and increased Lambda execution time.
    *   **Solution:** Moved PDF generation entirely to the frontend using `@react-pdf/renderer` (v4.3.1). This resulted in faster, more reliable, and easier-to-debug client-side generation, eliminating backend dependency for PDF creation and reducing Lambda costs.

*   **Software Detection Failure (Nov 13, 2025):**
    *   **Problem:** An undefined `html` variable caused software detection to fail, leading to blank sections in PDFs.
    *   **Solution:** Fixed the `html` variable issue in the software detector service, ensuring accurate web technology detection.

*   **Vulnerable Components Not Detected (Nov 13, 2025):**
    *   **Problem:** A property name mismatch (`comp.component` vs `comp.name`) prevented the correct detection of vulnerable components from CVE database results.
    *   **Solution:** Corrected the property name mapping, allowing proper identification and reporting of vulnerable components.

---

## What We Learned

Our technical challenges provided valuable learning experiences:

*   **Client-Side vs Server-Side PDF Generation:** The major hurdle was converting complex, aggregated JSON results into a clean, formatted PDF. Initially implementing server-side generation in Lambda, we discovered that client-side rendering with `@react-pdf/renderer` was far superior—faster, more reliable, easier to debug, and reduced Lambda costs. This taught us the importance of choosing the right architecture for each feature.

*   **Real-time Communication with Socket.IO:** Managing long-running scans (2-5 minutes) without freezing the UI was critical. We implemented Socket.IO for bidirectional real-time communication, allowing the backend to push scan progress updates to the frontend. This created a responsive user experience and eliminated the need for inefficient polling.

*   **Lambda Container State Management:** Discovered that AWS Lambda can spin up multiple container instances under load, causing race conditions when managing scan state. We learned to implement synchronous scan execution and proper state isolation to prevent 404 errors and ensure reliability in a serverless environment.

*   **Docker Multi-Stage Builds for Lambda:** Successfully created a multi-stage Docker build that compiles Nmap 7.95 from source on Amazon Linux 2023, then packages it with Nuclei and Node.js 20 into a Lambda-compatible container. This taught us about cross-platform binary compatibility and optimizing container image sizes.

*   **Integrating Command-Line Security Tools:** Successfully created custom API wrappers to execute Nmap and Nuclei programmatically, parsing their XML/JSON outputs into structured data. This taught us about process spawning, stdout/stderr handling, and timeout management in Node.js.

*   **TypeScript + React 19 Best Practices:** Leveraging the latest React 19 features with TypeScript 5.9 taught us about modern frontend architecture, including React Server Components considerations, proper type safety, and build optimization with Vite 7.

*   **Cloud Cost Optimization:** By moving PDF generation to the client, implementing efficient caching, and using synchronous scan execution, we minimized Lambda execution time and costs while improving user experience—a win-win optimization.

---

## License

This project is licensed under the **Apache License 2.0** 

---

## Links

- **Repository**: https://github.com/vallabh-13/MakeUC2025-Security-Scanner
- **Frontend README**: [frontend/README.md](./frontend/README.md)
- **Backend README**: [backend/README.md](./backend/README.md)

 
