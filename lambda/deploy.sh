#!/bin/bash

# CloudMeetX Lambda Deployment Script
# Deploys all WebSocket Lambda functions to AWS

set -e  # Exit on error

echo "🚀 CloudMeetX Lambda Deployment Script"
echo "======================================"

# Configuration
REGION="ap-south-1"
TABLE_NAME="CloudMeetXConnections"
ROLE_ARN="" # Set this to your Lambda execution role ARN

# Function names
ONCONNECT_FUNCTION="CloudMeetX-onConnect"
ONDISCONNECT_FUNCTION="CloudMeetX-onDisconnect"
SENDMESSAGE_FUNCTION="CloudMeetX-sendMessage"

# Check if ROLE_ARN is set
if [ -z "$ROLE_ARN" ]; then
    echo "❌ Error: ROLE_ARN is not set"
    echo "Please edit this script and set ROLE_ARN to your Lambda execution role ARN"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
echo "======================================"

# Install dependencies for each function
for func in onConnect onDisconnect sendMessage; do
    echo "Installing dependencies for $func..."
    cd lambda/$func
    npm install --production
    cd ../..
done

echo "✅ Dependencies installed"
echo ""
echo "📦 Step 2: Creating deployment packages..."
echo "======================================"

# Create deployment packages
for func in onConnect onDisconnect sendMessage; do
    echo "Packaging $func..."
    cd lambda/$func
    zip -r ${func}.zip index.mjs node_modules package.json > /dev/null 2>&1
    cd ../..
done

echo "✅ Packages created"
echo ""
echo "☁️  Step 3: Deploying to AWS..."
echo "======================================"

# Helper function to create or update Lambda function
deploy_function() {
    local FUNC_NAME=$1
    local HANDLER="index.handler"
    local ZIP_FILE=$2
    local TIMEOUT=$3
    local MEMORY=$4

    # Check if function exists
    if aws lambda get-function --function-name $FUNC_NAME --region $REGION > /dev/null 2>&1; then
        echo "Updating existing function: $FUNC_NAME..."
        aws lambda update-function-code \
            --function-name $FUNC_NAME \
            --zip-file fileb://$ZIP_FILE \
            --region $REGION > /dev/null
        
        aws lambda update-function-configuration \
            --function-name $FUNC_NAME \
            --timeout $TIMEOUT \
            --memory-size $MEMORY \
            --environment Variables={TABLE_NAME=$TABLE_NAME} \
            --region $REGION > /dev/null
    else
        echo "Creating new function: $FUNC_NAME..."
        aws lambda create-function \
            --function-name $FUNC_NAME \
            --runtime nodejs18.x \
            --role $ROLE_ARN \
            --handler $HANDLER \
            --zip-file fileb://$ZIP_FILE \
            --timeout $TIMEOUT \
            --memory-size $MEMORY \
            --environment Variables={TABLE_NAME=$TABLE_NAME} \
            --region $REGION > /dev/null
    fi
    
    echo "✅ $FUNC_NAME deployed"
}

# Deploy each function
deploy_function $ONCONNECT_FUNCTION "lambda/onConnect/onConnect.zip" 10 256
deploy_function $ONDISCONNECT_FUNCTION "lambda/onDisconnect/onDisconnect.zip" 10 256
deploy_function $SENDMESSAGE_FUNCTION "lambda/sendMessage/sendMessage.zip" 30 512

echo ""
echo "🧹 Step 4: Cleaning up..."
echo "======================================"

# Remove zip files
rm -f lambda/onConnect/onConnect.zip
rm -f lambda/onDisconnect/onDisconnect.zip
rm -f lambda/sendMessage/sendMessage.zip

echo "✅ Cleanup complete"
echo ""
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway routes:"
echo "   - \$connect → $ONCONNECT_FUNCTION"
echo "   - \$disconnect → $ONDISCONNECT_FUNCTION"
echo "   - sendMessage → $SENDMESSAGE_FUNCTION"
echo ""
echo "2. Deploy your API Gateway stage"
echo ""
echo "3. Test connection with:"
echo "   wscat -c 'wss://YOUR-API-ID.execute-api.$REGION.amazonaws.com/production?meetingId=test123'"
echo ""
