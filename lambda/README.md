# CloudMeetX WebSocket Lambda Functions

AWS Lambda functions for CloudMeetX real-time WebSocket communication backend.

## 📁 Project Structure

```
lambda/
├── onConnect/
│   ├── index.mjs           # Connection handler
│   └── package.json
├── onDisconnect/
│   ├── index.mjs           # Disconnection handler
│   └── package.json
└── sendMessage/
    ├── index.mjs           # Message routing handler
    └── package.json
```

## 🎯 Overview

These Lambda functions provide real-time WebSocket communication for CloudMeetX video conferencing:

### 1. **onConnect** (`$connect` route)
- Triggered when a client connects to the WebSocket
- Stores connection details in DynamoDB
- Validates meetingId parameter
- Sets TTL for auto-cleanup

### 2. **onDisconnect** (`$disconnect` route)
- Triggered when a client disconnects
- Removes connection from DynamoDB
- Handles graceful cleanup

### 3. **sendMessage** (`sendMessage` route)
- Routes messages between connected clients
- Supports:
  - Direct messages to specific users
  - Broadcast to all users in a meeting
  - Multiple message types (chat, signals, events)
- Automatically removes stale connections

## 🗄️ DynamoDB Table Schema

**Table Name**: `CloudMeetXConnections`

**Schema**:
```javascript
{
  connectionId: String,        // Partition Key
  meetingId: String,          // Meeting room identifier
  userId: String,             // User identifier
  userName: String,           // Display name
  connectedAt: String,        // ISO timestamp
  ttl: Number,               // Unix timestamp for auto-expiry
  status: String             // 'connected'
}
```

**Indexes**:
- Primary Key: `connectionId` (String)
- Consider adding GSI on `meetingId` for faster queries

## 📦 Deployment

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **DynamoDB Table** created:
   ```bash
   aws dynamodb create-table \
     --table-name CloudMeetXConnections \
     --attribute-definitions AttributeName=connectionId,AttributeType=S \
     --key-schema AttributeName=connectionId,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --time-to-live-specification "Enabled=true,AttributeName=ttl"
   ```

3. **API Gateway WebSocket API** created

### Step 1: Install Dependencies

For each function directory:

```bash
cd lambda/onConnect
npm install

cd ../onDisconnect
npm install

cd ../sendMessage
npm install
```

### Step 2: Create Deployment Packages

For each function:

```bash
# onConnect
cd lambda/onConnect
zip -r onConnect.zip index.mjs node_modules package.json

# onDisconnect
cd ../onDisconnect
zip -r onDisconnect.zip index.mjs node_modules package.json

# sendMessage
cd ../sendMessage
zip -r sendMessage.zip index.mjs node_modules package.json
```

### Step 3: Create Lambda Functions

```bash
# Create onConnect function
aws lambda create-function \
  --function-name CloudMeetX-onConnect \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/CloudMeetX-Lambda-Role \
  --handler index.handler \
  --zip-file fileb://lambda/onConnect/onConnect.zip \
  --timeout 10 \
  --memory-size 256 \
  --environment Variables={TABLE_NAME=CloudMeetXConnections}

# Create onDisconnect function
aws lambda create-function \
  --function-name CloudMeetX-onDisconnect \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/CloudMeetX-Lambda-Role \
  --handler index.handler \
  --zip-file fileb://lambda/onDisconnect/onDisconnect.zip \
  --timeout 10 \
  --memory-size 256 \
  --environment Variables={TABLE_NAME=CloudMeetXConnections}

# Create sendMessage function
aws lambda create-function \
  --function-name CloudMeetX-sendMessage \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/CloudMeetX-Lambda-Role \
  --handler index.handler \
  --zip-file fileb://lambda/sendMessage/sendMessage.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables={TABLE_NAME=CloudMeetXConnections}
```

### Step 4: Create IAM Role

**IAM Policy** (`CloudMeetX-Lambda-Policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/CloudMeetXConnections"
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "arn:aws:execute-api:REGION:ACCOUNT_ID:API_ID/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Step 5: Configure API Gateway Routes

In API Gateway WebSocket API:

1. **$connect** → CloudMeetX-onConnect
2. **$disconnect** → CloudMeetX-onDisconnect
3. **sendMessage** → CloudMeetX-sendMessage

## 🔌 WebSocket Connection

### Client Connection

```javascript
const ws = new WebSocket(
  'wss://your-api-id.execute-api.region.amazonaws.com/production' +
  '?meetingId=meeting123&userId=user456&userName=John%20Doe'
);

ws.onopen = () => {
  console.log('Connected to CloudMeetX');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Send Message to Specific User

```javascript
ws.send(JSON.stringify({
  action: 'sendMessage',
  targetUserId: 'user789',
  messageType: 'chat',
  data: {
    text: 'Hello!',
    timestamp: new Date().toISOString()
  }
}));
```

### Broadcast to Meeting

```javascript
ws.send(JSON.stringify({
  action: 'sendMessage',
  meetingId: 'meeting123',
  messageType: 'signal',
  data: {
    type: 'video-toggle',
    enabled: false
  }
}));
```

### Send to Specific Connection

```javascript
ws.send(JSON.stringify({
  action: 'sendMessage',
  targetConnectionId: 'abc123xyz',
  messageType: 'event',
  data: {
    eventType: 'screen-share-started'
  }
}));
```

## 📨 Message Types

### Chat Message
```javascript
{
  action: 'sendMessage',
  targetUserId: 'user123',
  messageType: 'chat',
  data: {
    text: 'Hello everyone!',
    timestamp: '2026-02-03T12:00:00Z'
  }
}
```

### WebRTC Signal
```javascript
{
  action: 'sendMessage',
  targetUserId: 'user123',
  messageType: 'signal',
  data: {
    type: 'offer',
    sdp: '...',
    candidateType: 'host'
  }
}
```

### Meeting Event
```javascript
{
  action: 'sendMessage',
  meetingId: 'meeting123',
  messageType: 'event',
  data: {
    eventType: 'user-joined',
    userId: 'user456',
    userName: 'Jane Doe'
  }
}
```

## 📊 Message Response Format

All received messages follow this structure:

```javascript
{
  type: 'chat|signal|event|message',
  from: {
    connectionId: 'abc123',
    userId: 'user123',
    userName: 'John Doe'
  },
  data: { /* your message data */ },
  timestamp: '2026-02-03T12:00:00Z'
}
```

## 🔒 Security Considerations

1. **Authentication**: Add Cognito authorizer to WebSocket API
2. **Validation**: Validate all input parameters
3. **Rate Limiting**: Implement throttling
4. **Encryption**: Use WSS (WebSocket Secure)
5. **TTL**: Automatic cleanup of old connections (24 hours)

## 🐛 Error Handling

### Connection Errors
- Missing meetingId → 400 Bad Request
- DynamoDB failure → 500 Internal Server Error

### Message Errors
- Invalid JSON → 400 Bad Request
- Missing required fields → 400 Bad Request
- Stale connections → Automatically cleaned up
- Failed sends → Logged and reported in response

## 📈 Monitoring

### CloudWatch Metrics
- Connection count per meeting
- Message send success/failure rates
- Lambda invocation count and duration
- DynamoDB read/write capacity

### CloudWatch Logs
All functions log:
- Connection events
- Message routing
- Errors and exceptions
- Stale connection cleanup

### Sample Log Query

```
fields @timestamp, @message
| filter @message like /Error/
| sort @timestamp desc
| limit 20
```

## 🧪 Testing

### Test onConnect

```bash
# Using wscat
npm install -g wscat
wscat -c "wss://your-api-id.execute-api.region.amazonaws.com/production?meetingId=test123&userId=user1&userName=TestUser"
```

### Test sendMessage

```javascript
// After connecting
> {"action":"sendMessage","meetingId":"test123","messageType":"chat","data":{"text":"Hello World"}}
```

### Test with Multiple Clients

Open multiple terminal windows and connect different users to test broadcasting.

## 🚀 Performance Tips

1. **Use GSI** on meetingId for faster queries
2. **Enable DynamoDB Auto Scaling**
3. **Increase Lambda memory** for sendMessage if handling many connections
4. **Use SQS** for high-volume message queuing
5. **Cache** user connection mappings in Lambda memory

## 📝 Environment Variables

All functions use:
- `TABLE_NAME`: DynamoDB table name (default: CloudMeetXConnections)

## 🔄 Updates

To update a function:

```bash
# Update code
cd lambda/sendMessage
zip -r sendMessage.zip index.mjs node_modules package.json

aws lambda update-function-code \
  --function-name CloudMeetX-sendMessage \
  --zip-file fileb://sendMessage.zip
```

## 📚 References

- [API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

---

**CloudMeetX WebSocket Backend** | Node.js 18 | AWS Lambda + DynamoDB + API Gateway
