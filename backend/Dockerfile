# Use the official AWS Lambda base image for Node.js 20
FROM public.ecr.aws/lambda/nodejs:20

# Install system dependencies required for the scanners
# Update first to ensure we get the latest compatible libraries
RUN dnf update -y && dnf install -y nmap openssl unzip

# Install Nuclei - Get latest version dynamically
# The Lambda environment is x86_64, so this will download the amd64 build.
RUN NUCLEI_VERSION=$(curl -s https://api.github.com/repos/projectdiscovery/nuclei/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/') && \
    curl -sL "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_amd64.zip" -o nuclei.zip && \
    unzip nuclei.zip && \
    mv nuclei /usr/local/bin/ && \
    chmod +x /usr/local/bin/nuclei && \
    rm nuclei.zip && \
    # Create a permanent templates directory accessible at runtime
    mkdir -p /opt/nuclei-templates && \
    # Download templates to /opt/nuclei-templates using environment variable
    HOME=/tmp NUCLEI_TEMPLATES_DIRECTORY=/opt/nuclei-templates nuclei -update-templates -silent && \
    # Make templates directory readable
    chmod -R 755 /opt/nuclei-templates || true

# Set working directory to the Lambda standard
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files and the new lambda handler first for better caching
COPY package*.json ./
COPY lambda.js ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
# This includes server.js, services/, utils/, etc.
COPY . .

# Create logs directory (if your logger writes to file)
RUN mkdir -p logs

# Set the CMD to your handler file name and the handler function
CMD [ "lambda.handler" ]