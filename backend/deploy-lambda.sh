#!/bin/bash

# AWS Lambda Deployment Script for Security Scanner Backend
# This script builds a Docker image and deploys it to AWS Lambda via ECR

set -e  # Exit on any error

# Configuration
AWS_REGION="us-east-1"
ECR_REPO="561645284595.dkr.ecr.us-east-1.amazonaws.com/makeuc-security-scanner"
LAMBDA_FUNCTION="makeuc-security-scanner-function"
IMAGE_TAG="latest"

echo "🚀 Starting deployment to AWS Lambda..."
echo "=================================="
echo "ECR Repository: $ECR_REPO"
echo "Lambda Function: $LAMBDA_FUNCTION"
echo "Image Tag: $IMAGE_TAG"
echo "=================================="

# Step 1: Authenticate Docker with ECR
echo ""
echo "📝 Step 1/6: Authenticating with AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
echo "✅ Authentication successful"

# Step 2: Build Docker image
echo ""
echo "🔨 Step 2/6: Building Docker image..."
docker build -t security-scanner-backend:$IMAGE_TAG --platform linux/amd64 --provenance=false --sbom=false .
echo "✅ Docker image built successfully"

# Step 3: Tag image for ECR
echo ""
echo "🏷️  Step 3/6: Tagging image for ECR..."
docker tag security-scanner-backend:$IMAGE_TAG $ECR_REPO:$IMAGE_TAG
echo "✅ Image tagged successfully"

# Step 4: Push to ECR
echo ""
echo "⬆️  Step 4/6: Pushing image to ECR..."
docker push $ECR_REPO:$IMAGE_TAG
echo "✅ Image pushed to ECR successfully"

# Step 5: Update Lambda function code
echo ""
echo "🔄 Step 5/6: Updating Lambda function with new image..."
aws lambda update-function-code \
  --function-name $LAMBDA_FUNCTION \
  --image-uri $ECR_REPO:$IMAGE_TAG \
  --region $AWS_REGION \
  --output json > /dev/null
echo "✅ Lambda function code updated"

# Step 6: Wait for update to complete
echo ""
echo "⏳ Step 6/6: Waiting for Lambda update to complete..."
aws lambda wait function-updated \
  --function-name $LAMBDA_FUNCTION \
  --region $AWS_REGION
echo "✅ Lambda function is now active"

# Step 7: Update environment variables (optional - run separately if needed)
echo ""
echo "📋 To update Lambda environment variables, run:"
echo "aws lambda update-function-configuration \\"
echo "  --function-name $LAMBDA_FUNCTION \\"
echo "  --environment \"Variables={NODE_ENV=production,FRONTEND_URL=https://securityscanner.netlify.app,RATE_LIMIT_WINDOW_MS=900000,RATE_LIMIT_MAX_REQUESTS=100,LOG_LEVEL=info}\" \\"
echo "  --region $AWS_REGION"

echo ""
echo "=================================="
echo "✅ Deployment completed successfully!"
echo "=================================="
echo ""
echo "🔗 Lambda Function URL: https://gdknxtbsizoibcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/"
echo ""
echo "📊 Test the deployment:"
echo "curl https://gdknxtbsizoibcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/api/health"
