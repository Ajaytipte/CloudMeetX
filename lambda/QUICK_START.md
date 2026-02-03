# CloudMeetX WebSocket Lambda - Quick Start

## 🚀 Quick Deployment Guide

### Option 1: CloudFormation (Recommended)

**Deploy entire infrastructure with one command:**

```bash
aws cloudformation create-stack \
  --stack-name CloudMeetX-WebSocket \
  --template-body file://lambda/cloudformation-template.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1
```

**Update function code after stack creation:**

```bash
cd lambda
./deploy.sh
```

### Option 2: Manual Deployment

**Step 1: Create DynamoDB Table**
```bash
aws dynamodb create-table \
  --table-name CloudMeetXConnections \
  --attribute-definitions AttributeName=connectionId,AttributeType=S \
  --key-schema AttributeName=connectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification "Enabled=true,AttributeName=ttl" \
  --region ap-south-1
```

**Step 2: Deploy Lambda Functions**
```bash
cd lambda
chmod +x deploy.sh
./deploy.sh
```

**Step 3: Create API Gateway**
- Create WebSocket API in AWS Console
- Add routes: $connect, $disconnect, sendMessage
- Link to Lambda functions
- Deploy to stage

## 📝 Testing

**Connect to WebSocket:**
```bash
npm install -g wscat
wscat -c "wss://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/production?meetingId=test123&userId=user1&userName=TestUser"
```

**Send a message:**
```json
{"action":"sendMessage","meetingId":"test123","messageType":"chat","data":{"text":"Hello World"}}
```

## 🔗 Frontend Integration

```javascript
// Connect
const ws = new WebSocket(
  'wss://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/production' +
  `?meetingId=${meetingId}&userId=${userId}&userName=${userName}`
);

// Listen for messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send message
ws.send(JSON.stringify({
  action: 'sendMessage',
  targetUserId: 'user123',
  messageType: 'chat',
  data: { text: 'Hello!' }
}));
```

## 📊 Monitoring

**View CloudWatch Logs:**
```bash
aws logs tail /aws/lambda/CloudMeetX-sendMessage --follow
```

**Query DynamoDB:**
```bash
aws dynamodb scan --table-name CloudMeetXConnections
```

## 🔧 Environment Variables

Set in deployment script or CloudFormation:
- `TABLE_NAME`: CloudMeetXConnections (default)

## 📚 Full Documentation

See `README.md` for complete documentation including:
- Detailed API reference
- Message formats
- Error handling
- Security best practices
- Performance optimization

---

**Need Help?** Check the main README.md or AWS CloudWatch Logs
