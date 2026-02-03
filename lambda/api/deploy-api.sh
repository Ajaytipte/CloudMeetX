#!/bin/bash

# CloudMeetX REST API Deployment Script
# Deploys all Lambda functions for the REST API

set -e

echo "🚀 CloudMeetX REST API Deployment"
echo "================================="

# Configuration
REGION="ap-south-1"
MEETINGS_TABLE="CloudMeetX-Meetings"
CHAT_TABLE="CloudMeetX-ChatMessages"
ROLE_ARN="" # Set this to your Lambda execution role ARN

# Function names
CREATE_MEETING="CloudMeetX-CreateMeeting"
JOIN_MEETING="CloudMeetX-JoinMeeting"
LIST_MEETINGS="CloudMeetX-ListMeetings"
SAVE_CHAT="CloudMeetX-SaveChat"
GET_CHAT_HISTORY="CloudMeetX-GetChatHistory"

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
for func in createMeeting joinMeeting listMeetings saveChatMessage getChatHistory; do
    echo "Installing dependencies for $func..."
    cd $func
    npm install --production
    cd ..
done

echo "✅ Dependencies installed"
echo ""
echo "📦 Step 2: Creating deployment packages..."
echo "======================================"

# Create deployment packages
cd createMeeting
zip -r createMeeting.zip index.mjs node_modules package.json > /dev/null 2>&1
cd ..

cd joinMeeting
zip -r joinMeeting.zip index.mjs node_modules package.json > /dev/null 2>&1
cd ..

cd listMeetings
zip -r listMeetings.zip index.mjs node_modules package.json > /dev/null 2>&1
cd ..

cd saveChatMessage
zip -r saveChatMessage.zip index.mjs node_modules package.json > /dev/null 2>&1
cd ..

cd getChatHistory
zip -r getChatHistory.zip index.mjs node_modules package.json > /dev/null 2>&1
cd ..

echo "✅ Packages created"
echo ""
echo "☁️  Step 3: Deploying to AWS..."
echo "======================================"

# Helper function to create or update Lambda function
deploy_function() {
    local FUNC_NAME=$1
    local ZIP_FILE=$2
    local TIMEOUT=$3
    local MEMORY=$4
    local TABLE_ENV=$5
    local TABLE_NAME=$6

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
            --environment Variables="{$TABLE_ENV=$TABLE_NAME}" \
            --region $REGION > /dev/null
    else
        echo "Creating new function: $FUNC_NAME..."
        aws lambda create-function \
            --function-name $FUNC_NAME \
            --runtime nodejs18.x \
            --role $ROLE_ARN \
            --handler index.handler \
            --zip-file fileb://$ZIP_FILE \
            --timeout $TIMEOUT \
            --memory-size $MEMORY \
            --environment Variables="{$TABLE_ENV=$TABLE_NAME}" \
            --region $REGION > /dev/null
    fi
    
    echo "✅ $FUNC_NAME deployed"
}

# Deploy each function
deploy_function $CREATE_MEETING "createMeeting/createMeeting.zip" 10 256 "MEETINGS_TABLE" $MEETINGS_TABLE
deploy_function $JOIN_MEETING "joinMeeting/joinMeeting.zip" 10 256 "MEETINGS_TABLE" $MEETINGS_TABLE
deploy_function $LIST_MEETINGS "listMeetings/listMeetings.zip" 15 512 "MEETINGS_TABLE" $MEETINGS_TABLE
deploy_function $SAVE_CHAT "saveChatMessage/saveChatMessage.zip" 10 256 "CHAT_TABLE" $CHAT_TABLE
deploy_function $GET_CHAT_HISTORY "getChatHistory/getChatHistory.zip" 15 512 "CHAT_TABLE" $CHAT_TABLE

echo ""
echo "🧹 Step 4: Cleaning up..."
echo "======================================"

# Remove zip files
rm -f createMeeting/createMeeting.zip
rm -f joinMeeting/joinMeeting.zip
rm -f listMeetings/listMeetings.zip
rm -f saveChatMessage/saveChatMessage.zip
rm -f getChatHistory/getChatHistory.zip

echo "✅ Cleanup complete"
echo ""
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway endpoints:"
echo "   - POST /meetings/create → $CREATE_MEETING"
echo "   - POST /meetings/join → $JOIN_MEETING"
echo "   - GET /meetings → $LIST_MEETINGS"
echo "   - POST /chat/save → $SAVE_CHAT"
echo "   - GET /chat/history → $GET_CHAT_HISTORY"
echo ""
echo "2. Test endpoints:"
echo "   curl -X POST https://YOUR-API-ID.../prod/meetings/create \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"title\":\"Test\",\"hostId\":\"user1\",\"hostName\":\"Test User\"}'"
echo ""
