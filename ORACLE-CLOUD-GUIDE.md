# Oracle Cloud Always Free Deployment Guide - Security Scanner

Deploy your security scanner on Oracle Cloud with **24GB RAM**, **4 ARM cores**, and **UNLIMITED scans forever - 100% FREE**.

---

## Why Oracle Cloud Always Free?

✅ **24 GB RAM** (vs Render's 512MB, Cloud Run's 1GB)
✅ **4 ARM cores** (Ampere A1 processor)
✅ **Forever free** (no 12-month limit like AWS)
✅ **200 GB storage**
✅ **10 TB bandwidth/month**
✅ **Unlimited scans** (within reasonable use)
✅ **No cold starts** (always running)

---

## Table of Contents

1. [Create Oracle Cloud Account](#step-1-create-oracle-cloud-account)
2. [Create VM Instance](#step-2-create-vm-instance)
3. [Configure Networking](#step-3-configure-networking-firewall)
4. [Install Dependencies](#step-4-install-dependencies)
5. [Deploy Backend](#step-5-deploy-backend-with-docker)
6. [Deploy Frontend (Netlify)](#step-6-deploy-frontend)
7. [Setup SSL & Domain](#step-7-optional-ssl--custom-domain)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Step 1: Create Oracle Cloud Account

### 1.1 Sign Up

1. Go to: https://www.oracle.com/cloud/free/
2. Click **"Start for free"**
3. Enter your details:
   - Email address
   - Country
   - Full name
4. Verify email
5. **Important**: You'll need a credit card for verification (NO CHARGES for Always Free services)

### 1.2 Choose Home Region

⚠️ **IMPORTANT**: You cannot change this later!

Recommended regions:
- **US East (Ashburn)** - us-ashburn-1
- **US West (Phoenix)** - us-phoenix-1
- **UK South (London)** - uk-london-1
- **Germany Central (Frankfurt)** - eu-frankfurt-1

Choose the one closest to your users.

---

## Step 2: Create VM Instance

### 2.1 Navigate to Compute Instances

1. Login to Oracle Cloud Console: https://cloud.oracle.com/
2. Click **☰ Menu** (top left)
3. Go to **Compute** → **Instances**
4. Click **"Create Instance"**

### 2.2 Configure Instance

**Instance Name**: `security-scanner-backend`

**Image and Shape**:
1. Click **"Change Image"**
   - Select: **Ubuntu 22.04** (or latest Ubuntu)
   - Click **"Select Image"**

2. Click **"Change Shape"**
   - Select **"Ampere"** (ARM-based)
   - Choose: **VM.Standard.A1.Flex**
   - Set:
     - **OCPUs**: 2 (or up to 4 for free)
     - **Memory**: 12 GB (or up to 24 GB for free)
   - Click **"Select Shape"**

**Networking**:
- **Virtual cloud network**: Select default VCN (or create new)
- **Subnet**: Select public subnet
- ✅ **Assign a public IPv4 address** (MUST check this!)

**Add SSH Keys**:

**Option A - Generate new keys (Windows)**:
```powershell
# Open PowerShell
ssh-keygen -t rsa -b 4096 -f $HOME\.ssh\oracle_cloud_rsa

# This creates:
# - Private key: C:\Users\YourName\.ssh\oracle_cloud_rsa
# - Public key: C:\Users\YourName\.ssh\oracle_cloud_rsa.pub

# Copy public key
Get-Content $HOME\.ssh\oracle_cloud_rsa.pub | clip
```

**Option B - Generate new keys (Linux/Mac)**:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_cloud_rsa

# Copy public key
cat ~/.ssh/oracle_cloud_rsa.pub
```

- Paste the public key content into Oracle Cloud
- Or click **"Choose SSH key files"** and upload `.pub` file

**Boot Volume**:
- Size: **50 GB** (free tier allows up to 200 GB total)

Click **"Create"** → Wait 2-3 minutes for provisioning

### 2.3 Note Your Instance Details

After creation, note:
- **Public IP Address**: (e.g., 123.456.789.10)
- **Username**: `ubuntu` (for Ubuntu image)

---

## Step 3: Configure Networking (Firewall)

### 3.1 Configure Security List (Oracle Firewall)

1. From Instance page, click your **VCN name**
2. Click **"Security Lists"** (left menu)
3. Click **"Default Security List for..."**
4. Click **"Add Ingress Rules"**

Add these rules:

**Rule 1 - HTTP**:
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `80`
- Description: `HTTP`

**Rule 2 - HTTPS**:
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `443`
- Description: `HTTPS`

**Rule 3 - Backend (temporary, for testing)**:
- Source CIDR: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port Range: `8080`
- Description: `Backend API`

### 3.2 Configure Ubuntu Firewall (inside VM)

We'll do this after connecting to the VM.

---

## Step 4: Install Dependencies

### 4.1 Connect to VM

**Windows (PowerShell)**:
```powershell
ssh -i $HOME\.ssh\oracle_cloud_rsa ubuntu@YOUR_PUBLIC_IP
```

**Linux/Mac**:
```bash
ssh -i ~/.ssh/oracle_cloud_rsa ubuntu@YOUR_PUBLIC_IP
```

If you get "permission denied", fix permissions:
```bash
chmod 600 ~/.ssh/oracle_cloud_rsa
```

### 4.2 Update System

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim nano htop
```

### 4.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (avoid sudo)
sudo usermod -aG docker ubuntu

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Logout and login again for group changes
exit
# Then reconnect with SSH
```

### 4.4 Install Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 4.5 Configure Ubuntu Firewall

```bash
# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend (temporary)
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## Step 5: Deploy Backend with Docker

### 5.1 Clone Your Repository

```bash
# Navigate to home
cd ~

# Clone your repository
git clone https://github.com/YOUR_USERNAME/MakeUC2025-Security-Scanner.git
cd MakeUC2025-Security-Scanner/backend
```

**OR** Upload files manually:

**From your local machine**:
```bash
# Create a zip of your backend
cd D:\Terraform_2\MakeUC2025-Security-Scanner
tar -czf backend.tar.gz backend/

# Upload to VM
scp -i ~/.ssh/oracle_cloud_rsa backend.tar.gz ubuntu@YOUR_PUBLIC_IP:~

# On VM, extract
ssh -i ~/.ssh/oracle_cloud_rsa ubuntu@YOUR_PUBLIC_IP
tar -xzf backend.tar.gz
cd backend
```

### 5.2 Update Dockerfile for ARM Architecture

Oracle Cloud uses ARM (Ampere A1) processors. Your current Dockerfile should work, but let's optimize it:

Create `backend/Dockerfile.arm` (or update existing):

```dockerfile
# Use Node.js 20 Alpine for ARM64
FROM node:20-alpine

# Install required system dependencies for ARM
RUN apk add --no-cache \
    nmap \
    nmap-scripts \
    curl \
    bash \
    openssl \
    unzip

# Install Nuclei for ARM64
RUN NUCLEI_VERSION=$(curl -s https://api.github.com/repos/projectdiscovery/nuclei/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/') && \
    curl -sL "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_arm64.zip" -o nuclei.zip && \
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

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Increase memory limit (Oracle has 12-24GB!)
CMD ["node", "--max-old-space-size=2048", "server.js"]
```

### 5.3 Create Docker Compose File

Create `backend/docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: security-scanner-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - RATE_LIMIT_WINDOW_MS=900000
      - RATE_LIMIT_MAX_REQUESTS=10
      - MAX_CONCURRENT_SCANS=3
    volumes:
      - ./logs:/app/logs
    mem_limit: 4g
    cpus: 2
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5.4 Build and Run

```bash
# Build Docker image
docker-compose build

# Start the service
docker-compose up -d

# Check logs
docker-compose logs -f

# Check if running
docker ps
```

### 5.5 Test Backend

```bash
# Test health endpoint
curl http://localhost:8080/api/health

# Test from your local machine
curl http://YOUR_PUBLIC_IP:8080/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T...",
  "activeScans": 0,
  "version": "1.0.0"
}
```

---

## Step 6: Deploy Frontend

### Option A: Netlify (Recommended)

**On your local machine**:

```bash
cd D:\Terraform_2\MakeUC2025-Security-Scanner\frontend

# Install Netlify CLI
npm install -g netlify-cli

# Update backend URL
cat > .env.production << EOF
VITE_BACKEND_URL=http://YOUR_ORACLE_PUBLIC_IP:8080
EOF

# Build
npm install
npm run build

# Deploy
netlify deploy --prod

# Follow prompts:
# 1. Login/create account
# 2. Create new site
# 3. Publish directory: dist
```

### Option B: Serve from Same VM with Nginx

```bash
# On Oracle VM
sudo apt install -y nginx

# Copy frontend files (from local machine)
# Build first:
cd D:\Terraform_2\MakeUC2025-Security-Scanner\frontend
npm run build

# Upload to VM
scp -i ~/.ssh/oracle_cloud_rsa -r dist/* ubuntu@YOUR_PUBLIC_IP:/tmp/frontend

# On VM, move to nginx
sudo mkdir -p /var/www/security-scanner
sudo mv /tmp/frontend/* /var/www/security-scanner/

# Configure nginx
sudo nano /etc/nginx/sites-available/security-scanner
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_PUBLIC_IP;

    # Frontend
    location / {
        root /var/www/security-scanner;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support for Socket.IO
    location /socket.io {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/security-scanner /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

Now visit: `http://YOUR_PUBLIC_IP`

---

## Step 7: (Optional) SSL & Custom Domain

### 7.1 Point Domain to Oracle Cloud

1. Buy a domain (Namecheap, GoDaddy, etc.)
2. Add A record:
   - Type: `A`
   - Name: `@` (or `scanner`)
   - Value: `YOUR_ORACLE_PUBLIC_IP`
   - TTL: `300`

### 7.2 Install Let's Encrypt SSL

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Auto-renewal (already configured by certbot)
sudo systemctl status certbot.timer
```

### 7.3 Update Frontend Environment

If using custom domain, rebuild frontend:

```bash
# Local machine
cd frontend

# Update .env.production
cat > .env.production << EOF
VITE_BACKEND_URL=https://yourdomain.com
EOF

# Rebuild and redeploy
npm run build
netlify deploy --prod

# Or if serving from VM, re-upload
```

---

## Monitoring & Maintenance

### Check Docker Logs

```bash
# View logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# Check specific service
docker-compose logs -f backend
```

### Monitor Resources

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check Docker stats
docker stats

# Process monitoring
htop
```

### Restart Services

```bash
# Restart backend
docker-compose restart

# Restart nginx (if using)
sudo systemctl restart nginx

# Check service status
docker-compose ps
```

### Update Application

```bash
# Pull latest code
cd ~/MakeUC2025-Security-Scanner
git pull origin main

# Rebuild and restart
cd backend
docker-compose down
docker-compose build
docker-compose up -d
```

### Auto-Start on Reboot

Docker Compose services already have `restart: unless-stopped`, but ensure Docker starts on boot:

```bash
sudo systemctl enable docker
```

### Backup Data

```bash
# Backup logs
tar -czf backup-logs-$(date +%Y%m%d).tar.gz ~/MakeUC2025-Security-Scanner/backend/logs

# Download to local
scp -i ~/.ssh/oracle_cloud_rsa ubuntu@YOUR_PUBLIC_IP:~/backup-logs-*.tar.gz .
```

---

## Troubleshooting

### Cannot Connect to VM

```bash
# Check if VM is running in Oracle Console
# Check security list allows port 22

# Try verbose SSH
ssh -v -i ~/.ssh/oracle_cloud_rsa ubuntu@YOUR_PUBLIC_IP
```

### Backend Not Accessible

```bash
# Check if Docker is running
docker ps

# Check logs
docker-compose logs

# Check if port is listening
sudo netstat -tlnp | grep 8080

# Check firewall
sudo ufw status
```

### Nuclei Templates Not Found

```bash
# Enter container
docker exec -it security-scanner-backend sh

# Update templates
nuclei -update-templates

# Exit
exit
```

### Out of Memory (Unlikely with 24GB!)

```bash
# Check memory
free -h

# Increase container limit in docker-compose.yml
mem_limit: 8g
```

---

## Performance Tuning

### Increase Concurrent Scans

Edit `backend/.env` or `docker-compose.yml`:

```yaml
environment:
  - MAX_CONCURRENT_SCANS=5  # With 12GB RAM, you can do 5+ concurrent scans
```

### Enable Rate Limiting

```yaml
environment:
  - RATE_LIMIT_MAX_REQUESTS=20  # Allow more requests
  - RATE_LIMIT_WINDOW_MS=900000  # Per 15 minutes
```

---

## Cost & Limits

### Always Free Resources (Per Account)

- ✅ **2 VMs** (VM.Standard.A1.Flex)
- ✅ **Up to 4 OCPUs total**
- ✅ **Up to 24 GB memory total**
- ✅ **200 GB block storage**
- ✅ **10 TB bandwidth/month**

### Your Current Usage

- 1 VM with 2 OCPUs + 12 GB RAM
- ~50 GB storage
- ~100 GB bandwidth/month

### Remaining Free Resources

- 1 more VM possible (or upgrade current to 4 OCPUs + 24 GB)
- 150 GB storage available
- 9,900 GB bandwidth available

**Monthly Cost**: **$0.00 forever** 🎉

---

## Upgrade Options (Within Free Tier)

### Increase VM Resources

```bash
# Stop instance in Oracle Console
# Edit instance → Change shape
# Select: 4 OCPUs, 24 GB RAM
# Start instance
```

This is still **100% FREE**!

---

## Security Checklist

- ✅ SSH key authentication (no passwords)
- ✅ Firewall configured (UFW + Oracle Security List)
- ✅ Regular updates (`sudo apt update && sudo apt upgrade`)
- ✅ Fail2ban (optional, for SSH brute-force protection)
- ✅ SSL with Let's Encrypt (if using custom domain)
- ✅ Docker containers isolated
- ✅ Rate limiting enabled in backend

### Optional: Install Fail2ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Summary

✅ **Oracle Cloud VM created** (2-4 OCPUs, 12-24 GB RAM)
✅ **Docker installed and running**
✅ **Backend deployed with Docker Compose**
✅ **Frontend deployed to Netlify or VM**
✅ **Firewall configured**
✅ **SSL enabled** (optional)
✅ **Monitoring setup**

**Your backend**: `http://YOUR_PUBLIC_IP:8080` or `https://yourdomain.com`
**Your frontend**: `https://your-app.netlify.app` or `http://YOUR_PUBLIC_IP`

**Unlimited scans per month - 100% FREE FOREVER!** 🚀

---

## Next Steps

1. Test with real scans
2. Monitor resource usage
3. Set up custom domain (optional)
4. Configure SSL (optional)
5. Set up automated backups
6. Add monitoring alerts

---

## Support

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Oracle Cloud Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

---

**Questions? Issues?** Check the troubleshooting section or Oracle Cloud documentation.
