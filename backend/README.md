# Security Scanner Backend

This is the backend API for the Security Scanner project, built with Node.js and Express.

## Prerequisites

- Node.js 20 or higher
- npm (comes with Node.js)

### Optional Security Tools (for full functionality)

- **Nmap** - Port scanning
- **Nuclei** - Vulnerability scanning

Without these tools, the scanner will still work but with limited functionality.

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

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

### 3. Start the Server

```bash
npm start
```

The backend will start on `http://localhost:3000`.

### 4. Verify the Server is Running

Open your browser and go to:
- `http://localhost:3000` - API info
- `http://localhost:3000/api/health` - Health check

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload (requires nodemon)
- `npm run logs` - View application logs

## API Endpoints

### Health Check
```
GET /api/health
```

### Start Security Scan
```
POST /api/scan
Content-Type: application/json

{
  "url": "https://example.com",
  "socketId": "optional-socket-id"
}
```

### Download PDF Report
```
GET /api/report/:scanId/pdf?results=<encoded-results>&url=<target-url>
```

## WebSocket Events

The backend uses Socket.io for real-time scan progress updates:

- `scan:progress` - Scan progress update
- `scan:step-complete` - A scan step completed
- `scan:complete` - Entire scan completed
- `scan:error` - An error occurred
- `scan:failed` - Scan failed

## Project Structure

```
backend/
├── services/           # Scanner services
│   ├── nmapScanner.js
│   ├── nucleiScanner.js
│   ├── SSLLabsScanner.js
│   ├── softwareDetector.js
│   ├── cveDatabase.js
│   └── pdfGenerator.js
├── middleware/         # Express middleware
│   └── errorHandler.js
├── utils/              # Utility functions
│   ├── logger.js
│   └── aggregator.js
├── logs/              # Application logs
├── server.js          # Main server file
└── package.json       # Dependencies
```

## Security Features

- **Rate Limiting** - Prevents abuse
- **Helmet** - Security headers
- **CORS** - Cross-origin protection
- **Input Validation** - URL validation
- **Concurrency Limiting** - Prevents memory overload

## Memory Management

The server is configured to run on limited memory environments (like Render free tier):

- Maximum 400MB heap size
- Only 1 concurrent scan at a time
- 20MB buffer limits for subprocess outputs
- Automatic cleanup of temporary files

## Installing Security Tools

### Nmap (Port Scanning)

**Ubuntu/Debian:**
```bash
sudo apt-get install nmap
```

**macOS:**
```bash
brew install nmap
```

**Windows:**
Download from https://nmap.org/download.html

### Nuclei (Vulnerability Scanning)

**Linux/macOS:**
```bash
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

Or download binary from https://github.com/projectdiscovery/nuclei/releases

**After installation, update templates:**
```bash
nuclei -update-templates
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, change the PORT in `.env`:
```env
PORT=3001
```

### Out of Memory Errors
The server uses `--max-old-space-size=400` to limit memory usage. For local development with more resources:
```bash
node --max-old-space-size=2048 server.js
```

### Security Tools Not Found
The scanner will fall back to basic checks if Nmap or Nuclei are not installed. For full functionality, install both tools.

## Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

View live logs:
```bash
npm run logs
```

## Deployment

This backend is configured to deploy to Render using Docker. See `render.yaml` and `Dockerfile` in the root directory.
