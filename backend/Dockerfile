# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install required system dependencies for nmap, nuclei, and other security tools
RUN apk add --no-cache \
    nmap \
    nmap-scripts \
    curl \
    bash \
    openssl

# Install Nuclei
RUN curl -L https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_3.3.6_linux_amd64.zip -o nuclei.zip && \
    unzip nuclei.zip && \
    mv nuclei /usr/local/bin/ && \
    chmod +x /usr/local/bin/nuclei && \
    rm nuclei.zip && \
    nuclei -update-templates

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["node", "--max-old-space-size=200", "server.js"]
