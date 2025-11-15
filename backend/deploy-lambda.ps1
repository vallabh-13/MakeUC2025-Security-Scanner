





# AWS Lambda Deployment Script for Security Scanner Backend (PowerShell)
# This script builds a Docker image and deploys it to AWS Lambda via ECR

$ErrorActionPreference = "Stop"

# Set the current location to the script's directory
Set-Location $PSScriptRoot

# Configuration
$AWS_REGION = "us-east-1"
$ECR_REPO = "561645284595.dkr.ecr.us-east-1.amazonaws.com/makeuc-security-scanner"
$LAMBDA_FUNCTION = "makeuc-security-scanner-function"
$IMAGE_TAG = "latest"

Write-Host "🚀 Starting deployment to AWS Lambda..." -ForegroundColor Green
Write-Host "=================================="
Write-Host "ECR Repository: $ECR_REPO"
Write-Host "Lambda Function: $LAMBDA_FUNCTION"
Write-Host "Image Tag: $IMAGE_TAG"
Write-Host "=================================="

# Step 1: Authenticate Docker with ECR
Write-Host ""
Write-Host "📝 Step 1/6: Authenticating with AWS ECR..." -ForegroundColor Cyan
$password = aws ecr get-login-password --region $AWS_REGION
$password | docker login --username AWS --password-stdin $ECR_REPO
if ($LASTEXITCODE -ne 0) { throw "ECR authentication failed" }
Write-Host "✅ Authentication successful" -ForegroundColor Green

# Step 2: Build Docker image
Write-Host ""
Write-Host "🔨 Step 2/6: Building Docker image..." -ForegroundColor Cyan
docker build -t security-scanner-backend:$IMAGE_TAG --platform linux/amd64 --provenance=false --sbom=false .
if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Step 3: Tag image for ECR
Write-Host ""
Write-Host "🏷️  Step 3/6: Tagging image for ECR..." -ForegroundColor Cyan
docker tag "security-scanner-backend:${IMAGE_TAG}" "${ECR_REPO}:${IMAGE_TAG}"
if ($LASTEXITCODE -ne 0) { throw "Docker tag failed" }
Write-Host "✅ Image tagged successfully" -ForegroundColor Green

# Step 4: Push to ECR
Write-Host ""
Write-Host "⬆️  Step 4/6: Pushing image to ECR..." -ForegroundColor Cyan
docker push "${ECR_REPO}:${IMAGE_TAG}"
if ($LASTEXITCODE -ne 0) { throw "Docker push failed" }
Write-Host "✅ Image pushed to ECR successfully" -ForegroundColor Green

# Step 5: Update Lambda function code
Write-Host ""
Write-Host "🔄 Step 5/6: Updating Lambda function with new image..." -ForegroundColor Cyan
$imageUri = "${ECR_REPO}:${IMAGE_TAG}"
aws lambda update-function-code `
  --function-name $LAMBDA_FUNCTION `
  --image-uri $imageUri `
  --region $AWS_REGION `
  --output json | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Lambda update failed" }
Write-Host "✅ Lambda function code updated" -ForegroundColor Green

# Step 6: Wait for update to complete
Write-Host ""
Write-Host "⏳ Step 6/6: Waiting for Lambda update to complete..." -ForegroundColor Cyan
aws lambda wait function-updated `
  --function-name $LAMBDA_FUNCTION `
  --region $AWS_REGION
if ($LASTEXITCODE -ne 0) { throw "Lambda wait failed" }
Write-Host "✅ Lambda function is now active" -ForegroundColor Green

# Step 7: Update environment variables (optional)
Write-Host ""
Write-Host "📋 To update Lambda environment variables, run:" -ForegroundColor Yellow
Write-Host "aws lambda update-function-configuration \`" -ForegroundColor Gray
Write-Host "  --function-name $LAMBDA_FUNCTION \`" -ForegroundColor Gray
Write-Host "  --environment 'Variables={NODE_ENV=production,FRONTEND_URL=https://securityscanner.netlify.app,RATE_LIMIT_WINDOW_MS=900000,RATE_LIMIT_MAX_REQUESTS=100,LOG_LEVEL=info}' \`" -ForegroundColor Gray
Write-Host "  --region $AWS_REGION" -ForegroundColor Gray

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Lambda Function URL: https://gdknxtbsizoibcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/"
Write-Host ""
Write-Host "📊 Test the deployment:" -ForegroundColor Cyan
Write-Host "curl https://gdknxtbsizoibcoexozxq3qysy0ljkiq.lambda-url.us-east-1.on.aws/api/health"

