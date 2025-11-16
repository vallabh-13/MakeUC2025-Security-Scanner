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

### Production Deployment on AWS Lambda

The Security Scanner backend is deployed as a **containerized AWS Lambda function** using Docker and AWS ECR (Elastic Container Registry). This provides scalable, serverless hosting for the Express API and security scanning tools.

#### ⚡ Live API
- **Lambda Function URL:** https://gdknxtxxxxxxxxxxxxozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/
- **Region:** us-east-1 (US East - N. Virginia)
- **Runtime:** Node.js 20 (containerized)
- **Architecture:** x86_64
- **Memory:** 1024 MB (recommended minimum)
- **Timeout:** 900 seconds (15 minutes)

---

### Lambda Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Memory | 1024 MB | Required for Nmap + Nuclei scans |
| Timeout | 900s (15 min) | Long-running security scans |
| Ephemeral Storage | 512 MB | Default (logs, cache) |
| Concurrency | Reserved: 1 | Prevents multi-container race conditions |
| Max Concurrency | 5 scans | Controlled via `MAX_CONCURRENT_SCANS` |

---

### Multi-Stage Docker Build

Our backend uses a **multi-stage Docker build** to create an optimized, production-ready Lambda container:

#### Stage 1: Build Nmap from Source
```dockerfile
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS builder

# Install build tools and dependencies
RUN dnf update -y && \
    dnf install -y gcc gcc-c++ make flex bison automake \
                   autoconf openssl-devel libpcap-devel tar bzip2 curl

# Download and compile Nmap 7.95 from source
ARG NMAP_VERSION=7.95
RUN curl -o nmap.tar.bz2 https://nmap.org/dist/nmap-${NMAP_VERSION}.tar.bz2 && \
    tar -xjf nmap.tar.bz2 && \
    cd nmap-${NMAP_VERSION} && \
    ./configure --without-zenmap --without-nmap-update \
                --without-libssh2 --without-ndiff && \
    make && make install
```

**Why compile from source?**
- Binary compatibility with Amazon Linux 2023
- Ensures all dependencies are properly linked
- Eliminates runtime library errors

#### Stage 2: Final Lambda Image
```dockerfile
FROM public.ecr.aws/lambda/nodejs:20

# Copy compiled Nmap binary and data files from builder
COPY --from=builder /usr/local/bin/nmap /usr/local/bin/nmap
COPY --from=builder /usr/local/share/nmap /usr/local/share/nmap

# Install runtime dependencies
RUN dnf install -y libpcap openssl unzip && dnf clean all

# Verify Nmap works
RUN /usr/local/bin/nmap --version

# Install Nuclei (latest version)
RUN NUCLEI_VERSION=$(curl -s https://api.github.com/repos/projectdiscovery/nuclei/releases/latest | \
    grep '"tag_name":' | sed -E 's/.*"v([^\"]+)".*/\1/') && \
    curl -sL "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_amd64.zip" -o nuclei.zip && \
    unzip nuclei.zip && mv nuclei /usr/local/bin/ && chmod +x /usr/local/bin/nuclei

# Update Nuclei templates
RUN mkdir -p /opt/nuclei-templates && \
    HOME=/tmp NUCLEI_TEMPLATES_DIRECTORY=/opt/nuclei-templates nuclei -update-templates -silent

# Copy application code
WORKDIR ${LAMBDA_TASK_ROOT}
COPY package*.json lambda.js ./
RUN npm ci --only=production
COPY . .

# Set Lambda handler
CMD ["lambda.handler"]
```

---

### Deployment Steps

#### Prerequisites
- AWS CLI installed and configured
- Docker installed (for building container images)
- AWS account with permissions for Lambda, ECR
- PowerShell (Windows) or Bash (Linux/Mac)

#### Step 1: Create ECR Repository (First Time Only)

```bash
# Create ECR repository for Lambda container images
aws ecr create-repository \
    --repository-name security-scanner-lambda \
    --region us-east-1
```

**Output:** You'll get a repository URI like:
```
<account-id>.dkr.ecr.us-east-1.amazonaws.com/security-scanner-lambda
```

#### Step 2: Build Docker Image

```bash
# Navigate to backend directory
cd backend

# Build for Linux/AMD64 platform (Lambda requirement)
docker build --platform linux/amd64 -t security-scanner-lambda:latest .
```

**Build time:** ~5-10 minutes (compiling Nmap from source)

#### Step 3: Authenticate with ECR

```bash
# Get login credentials and authenticate Docker
aws ecr get-login-password --region us-east-1 | \
    docker login --username AWS --password-stdin \
    <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### Step 4: Tag and Push Image

```bash
# Tag the image with ECR repository URI
docker tag security-scanner-lambda:latest \
    <account-id>.dkr.ecr.us-east-1.amazonaws.com/security-scanner-lambda:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/security-scanner-lambda:latest
```

**Push time:** ~2-3 minutes (image size: ~500MB)

#### Step 5: Create or Update Lambda Function

**First deployment:**
```bash
# Create Lambda function from container image
aws lambda create-function \
    --function-name security-scanner \
    --package-type Image \
    --code ImageUri=<account-id>.dkr.ecr.us-east-1.amazonaws.com/security-scanner-lambda:latest \
    --role arn:aws:iam::<account-id>:role/lambda-execution-role \
    --timeout 900 \
    --memory-size 1024 \
    --region us-east-1
```

**Subsequent deployments:**
```bash
# Update existing Lambda function with new image
aws lambda update-function-code \
    --function-name security-scanner \
    --image-uri <account-id>.dkr.ecr.us-east-1.amazonaws.com/security-scanner-lambda:latest \
    --region us-east-1
```

#### Step 6: Configure Environment Variables

```bash
aws lambda update-function-configuration \
    --function-name security-scanner \
    --environment Variables="{
        NODE_ENV=production,
        PORT=3000,
        FRONTEND_URL=https://securityscanner.netlify.app,
        RATE_LIMIT_WINDOW_MS=900000,
        RATE_LIMIT_MAX_REQUESTS=100,
        MAX_CONCURRENT_SCANS=5,
        LOG_LEVEL=info,
        NVD_API_KEY=your_optional_nvd_api_key
    }" \
    --region us-east-1
```

#### Step 7: Create Function URL (First Time Only)

```bash
# Create a public function URL
aws lambda create-function-url-config \
    --function-name security-scanner \
    --auth-type NONE \
    --cors AllowOrigins=https://securityscanner.netlify.app,AllowMethods=GET,POST,AllowHeaders=Content-Type \
    --region us-east-1
```

**Output:** You'll get a Function URL like:
```
https://gdknxtbsizxxxxxxxxxozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/
```

---

### Automated Deployment Script

We provide a **PowerShell script** (`deploy-lambda.ps1`) that automates all steps:

```powershell
# Run from backend directory
cd backend
.\deploy-lambda.ps1
```

**What it does:**
1. Builds Docker image
2. Authenticates with ECR
3. Tags and pushes image
4. Updates Lambda function
5. Displays deployment status

---

### Environment Variables for Production

Configure these in Lambda:

| Variable | Value | Required | Description |
|----------|-------|----------|-------------|
| `NODE_ENV` | `production` | Yes | Environment mode |
| `PORT` | `3000` | Yes | Internal Express port |
| `FRONTEND_URL` | `https://securityscanner.netlify.app` | Yes | CORS allowed origins (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | No | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | No | Max requests per window |
| `MAX_CONCURRENT_SCANS` | `5` | Yes | Concurrent scans limit |
| `LOG_LEVEL` | `info` | No | Winston log level |
| `NVD_API_KEY` | `your_key` | No | Optional NVD API key for CVE lookups |

---

### Lambda Permissions (IAM Role)

Your Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "arn:aws:ecr:us-east-1:<account-id>:repository/security-scanner-lambda"
    }
  ]
}
```

---

### Monitoring & Logs

#### CloudWatch Logs
All Lambda logs are automatically sent to CloudWatch:

- **Log Group:** `/aws/lambda/security-scanner`
- **Retention:** 7 days (configurable)

**View logs:**
```bash
aws logs tail /aws/lambda/security-scanner --follow
```

#### CloudWatch Metrics
Monitor these metrics in AWS Console:

- **Invocations:** Number of scan requests
- **Duration:** Scan execution time (avg: 2-5 minutes)
- **Errors:** Failed scans
- **Throttles:** Rate limiting events
- **Concurrent Executions:** Active scans

---

### Troubleshooting Deployment Issues

#### Build Fails: "Nmap compilation error"

**Issue:** Nmap fails to compile in Docker build

**Solution:**
```bash
# Ensure you're building for the correct platform
docker build --platform linux/amd64 --no-cache -t security-scanner-lambda .
```

#### Lambda Times Out: "Task timed out after 300 seconds"

**Issue:** Default timeout (5 min) is too short for scans

**Solution:**
```bash
# Increase timeout to 15 minutes
aws lambda update-function-configuration \
    --function-name security-scanner \
    --timeout 900 \
    --region us-east-1
```

#### Out of Memory: "Runtime exited with error: signal: killed"

**Issue:** Lambda runs out of memory during scans

**Solution:**
```bash
# Increase memory to 2048 MB
aws lambda update-function-configuration \
    --function-name security-scanner \
    --memory-size 2048 \
    --region us-east-1
```

#### 404 Errors: "Cannot GET /api/scan"

**Issue:** Multi-container race conditions (scan state not found)

**Solution:** Already implemented - synchronous scan execution ensures one scan per container instance.

#### CORS Errors: "Access-Control-Allow-Origin missing"

**Issue:** Frontend can't connect to Lambda

**Solution:**
```bash
# Update FRONTEND_URL environment variable with correct origin
aws lambda update-function-configuration \
    --function-name security-scanner \
    --environment Variables="{FRONTEND_URL=https://securityscanner.netlify.app}" \
    --region us-east-1
```
---

### Scaling Considerations

The current configuration supports:

- **~200 scans/hour** with 5 concurrent scans
- **~5,000 scans/day** with current rate limits
- **Unlimited horizontal scaling** (Lambda auto-scales)

To increase capacity:
1. Increase `MAX_CONCURRENT_SCANS` to 10
2. Increase Lambda memory to 2048 MB
3. Adjust rate limits accordingly
