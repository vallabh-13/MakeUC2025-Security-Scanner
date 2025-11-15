# STAGE 1: Build Nmap from source for a compatible binary
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS builder

# Install build tools and nmap dependencies
RUN dnf update -y && \
    dnf install -y --allowerasing gcc gcc-c++ make flex bison openssl-devel libpcap-devel tar bzip2 curl && \
    dnf clean all

# Download and compile Nmap (using a recent stable version)
ARG NMAP_VERSION=7.95
RUN curl -o nmap.tar.bz2 https://nmap.org/dist/nmap-${NMAP_VERSION}.tar.bz2 && \
    tar -xjf nmap.tar.bz2 && \
    cd nmap-${NMAP_VERSION} && \
    ./configure --without-zenmap --without-nmap-update --without-libssh2 && \
    make && \
    make install

# STAGE 2: Final Lambda image with the compiled Nmap
FROM public.ecr.aws/lambda/nodejs:20

# Copy the compiled nmap and its data files from the builder stage
COPY --from=builder /usr/local/bin/nmap /usr/local/bin/nmap
COPY --from=builder /usr/local/share/nmap /usr/local/share/nmap

# Install system dependencies (openssl for crypto, unzip for nuclei)
# We no longer install nmap via dnf
RUN dnf install -y openssl unzip

# Install Nuclei - Get latest version dynamically
# (This part remains the same)
RUN NUCLEI_VERSION=$(curl -s https://api.github.com/repos/projectdiscovery/nuclei/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^\"]+)".*/\1/') && \
    curl -sL "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_amd64.zip" -o nuclei.zip && \
    unzip nuclei.zip && \
    mv nuclei /usr/local/bin/ && \
    chmod +x /usr/local/bin/nuclei && \
    rm nuclei.zip && \
    mkdir -p /opt/nuclei-templates && \
    HOME=/tmp NUCLEI_TEMPLATES_DIRECTORY=/opt/nuclei-templates nuclei -update-templates -silent && \
    chmod -R 755 /opt/nuclei-templates || true

# Set working directory to the Lambda standard
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files and the new lambda handler first for better caching
COPY package*.json ./
COPY lambda.js ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create logs directory (if your logger writes to file)
RUN mkdir -p logs

# Set the CMD to your handler file name and the handler function
CMD [ "lambda.handler" ]
