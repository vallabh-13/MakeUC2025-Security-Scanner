# Use Node.js 20 with Debian base for better package support
FROM node:20-bullseye-slim

# Install system dependencies and security tools
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    nmap \
    ca-certificates \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Install Nuclei - skip template update during build, happens at runtime
RUN wget -q --show-progress https://github.com/projectdiscovery/nuclei/releases/download/v3.3.7/nuclei_3.3.7_linux_amd64.zip -O nuclei.zip \
    && unzip -q nuclei.zip \
    && mv nuclei /usr/local/bin/ \
    && chmod +x /usr/local/bin/nuclei \
    && rm nuclei.zip LICENSE.md README.md 2>/dev/null || true

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["npm", "start"]
