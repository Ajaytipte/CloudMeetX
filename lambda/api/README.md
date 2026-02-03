# CloudMeetX REST API - Lambda + DynamoDB + API Gateway

Complete CRUD REST API for CloudMeetX meetings and chat functionality.

## 📁 Project Structure

```
lambda/api/
├── createMeeting/
│   ├── index.mjs
│   └── package.json
├── joinMeeting/
│   ├── index.mjs
│   └── package.json
├── listMeetings/
│   ├── index.mjs
│   └── package.json
├── saveChatMessage/
│   ├── index.mjs
│   └── package.json
├── getChatHistory/
│   ├── index.mjs
│   └── package.json
├── cloudformation-rest-api.json
├── deploy-api.sh
└── README.md
```

## 🗄️ DynamoDB Tables

### 1. CloudMeetX-Meetings

**Purpose**: Store meeting information

**Schema**:
```javascript
{
  meetingId: String,          // PK - unique meeting ID
  title: String,             // Meeting title
  description: String,        // Meeting description
  hostId: String,            // Host user ID
  hostName: String,          // Host display name
  scheduledAt: String,       // ISO timestamp
  duration: Number,          // Minutes
  maxParticipants: Number,   // Max allowed
  status: String,            // scheduled, active, ended
  participants: Array,       // List of participant objects
  participantCount: Number,  // Current count
  createdAt: String,         // ISO timestamp
  updatedAt: String,         // ISO timestamp
  ttl: Number               // Auto-expiry (7 days)
}
```

**Indexes**:
- Primary Key: `meetingId`
- GSI: `hostId-createdAt-index` (for listing user's meetings)

**Participant Object**:
```javascript
{
  userId: String,
  userName: String,
  joinedAt: String,
  status: String  // joined, left
}
```

### 2. CloudMeetX-ChatMessages

**Purpose**: Store chat messages for meetings

**Schema**:
```javascript
{
  messageId: String,      // PK - unique message ID (UUID)
  meetingId: String,      // Meeting this message belongs to
  userId: String,         // Sender user ID
  userName: String,       // Sender display name
  message: String,        // Message content (max 5000 chars)
  messageType: String,    // text, file, system
  timestamp: String,      // ISO timestamp
  edited: Boolean,        // Was message edited
  deleted: Boolean,       // Was message deleted
  ttl: Number            // Auto-expiry (30 days)
}
```

**Indexes**:
- Primary Key: `messageId`
- GSI: `meetingId-timestamp-index` (for querying messages by meeting)

## 🔌 API Endpoints

Base URL: `https://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/prod`

### 1. Create Meeting

**Endpoint**: `POST /meetings/create`

**Request**:
```json
{
  "title": "Team Standup",
  "description": "Daily standup meeting",
  "hostId": "user123",
  "hostName": "John Doe",
  "scheduledAt": "2026-02-03T14:00:00Z",
  "duration": 60,
  "maxParticipants": 10
}
```

**Response** (201):
```json
{
  "message": "Meeting created successfully",
  "meeting": {
    "meetingId": "abc123def456",
    "title": "Team Standup",
    "description": "Daily standup meeting",
    "hostId": "user123",
    "hostName": "John Doe",
    "scheduledAt": "2026-02-03T14:00:00Z",
    "duration": 60,
    "maxParticipants": 10,
    "status": "scheduled",
    "createdAt": "2026-02-03T12:00:00Z",
    "joinUrl": "https://cloudmeetx.com/meeting/abc123def456"
  }
}
```

### 2. Join Meeting

**Endpoint**: `POST /meetings/join`

**Request**:
```json
{
  "meetingId": "abc123def456",
  "userId": "user789",
  "userName": "Jane Smith"
}
```

**Response** (200):
```json
{
  "message": "Joined meeting successfully",
  "meeting": {
    "meetingId": "abc123def456",
    "title": "Team Standup",
    "description": "Daily standup meeting",
    "hostId": "user123",
    "hostName": "John Doe",
    "status": "active",
    "participantCount": 2,
    "participants": [
      {
        "userId": "user123",
        "userName": "John Doe",
        "joinedAt": "2026-02-03T12:00:00Z",
        "status": "joined"
      },
      {
        "userId": "user789",
        "userName": "Jane Smith",
        "joinedAt": "2026-02-03T12:05:00Z",
        "status": "joined"
      }
    ]
  }
}
```

### 3. List Meetings

**Endpoint**: `GET /meetings?userId={userId}&status={status}&limit={limit}`

**Query Parameters**:
- `userId` (optional): Filter by host or participant
- `status` (optional): Filter by status (scheduled, active, ended)
- `limit` (optional): Number of results (default: 20, max: 100)
- `lastKey` (optional): For pagination

**Response** (200):
```json
{
  "meetings": [
    {
      "meetingId": "abc123def456",
      "title": "Team Standup",
      "description": "Daily standup meeting",
      "hostId": "user123",
      "hostName": "John Doe",
      "status": "active",
      "scheduledAt": "2026-02-03T14:00:00Z",
      "duration": 60,
      "participantCount": 5,
      "maxParticipants": 10,
      "createdAt": "2026-02-03T12:00:00Z"
    }
  ],
  "count": 1,
  "nextKey": "eyJtZWV0aW5nSWQiOiJ4eXoifQ==",
  "hasMore": false
}
```

### 4. Save Chat Message

**Endpoint**: `POST /chat/save`

**Request**:
```json
{
  "meetingId": "abc123def456",
  "userId": "user789",
  "userName": "Jane Smith",
  "message": "Hello everyone!",
  "messageType": "text"
}
```

**Response** (201):
```json
{
  "message": "Chat message saved successfully",
  "chatMessage": {
    "messageId": "550e8400-e29b-41d4-a716-446655440000",
    "meetingId": "abc123def456",
    "userId": "user789",
    "userName": "Jane Smith",
    "message": "Hello everyone!",
    "messageType": "text",
    "timestamp": "2026-02-03T12:10:00Z"
  }
}
```

### 5. Get Chat History

**Endpoint**: `GET /chat/history?meetingId={meetingId}&limit={limit}`

**Query Parameters**:
- `meetingId` (required): Meeting ID
- `limit` (optional): Number of messages (default: 50, max: 100)
- `lastKey` (optional): For pagination

**Response** (200):
```json
{
  "messages": [
    {
      "messageId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user789",
      "userName": "Jane Smith",
      "message": "Hello everyone!",
      "messageType": "text",
      "timestamp": "2026-02-03T12:10:00Z",
      "edited": false
    }
  ],
  "count": 1,
  "nextKey": null,
  "hasMore": false
}
```

## 🚀 Deployment

### Option 1: CloudFormation (Recommended)

```bash
# Create stack
aws cloudformation create-stack \
  --stack-name CloudMeetX-REST-API \
  --template-body file://lambda/api/cloudformation-rest-api.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name CloudMeetX-REST-API

# Get API URL
aws cloudformation describe-stacks \
  --stack-name CloudMeetX-REST-API \
  --query 'Stacks[0].Outputs[?OutputKey==`RestAPIUrl`].OutputValue' \
  --output text
```

### Option 2: Deployment Script

```bash
cd lambda/api
chmod +x deploy-api.sh
./deploy-api.sh
```

## 📝 Usage Examples

### Create Meeting (cURL)

```bash
curl -X POST https://YOUR-API-ID.execute-api.ap-south-1.amazonaws.com/prod/meetings/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Standup",
    "description": "Daily standup",
    "hostId": "user123",
    "hostName": "John Doe",
    "duration": 30
  }'
```

### Join Meeting (JavaScript/Fetch)

```javascript
const response = await fetch(`${API_URL}/meetings/join`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    meetingId: 'abc123def456',
    userId: 'user789',
    userName: 'Jane Smith'
  })
});

const data = await response.json();
console.log(data.meeting);
```

### List Meetings (React)

```javascript
import { useState, useEffect } from 'react';

const MyMeetings = ({ userId }) => {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/meetings?userId=${userId}&status=active`)
      .then(res => res.json())
      .then(data => setMeetings(data.meetings));
  }, [userId]);

  return (
    <ul>
      {meetings.map(meeting => (
        <li key={meeting.meetingId}>
          {meeting.title} - {meeting.participantCount} participants
        </li>
      ))}
    </ul>
  );
};
```

### Save Chat Message

```javascript
const sendMessage = async (meetingId, userId, userName, message) => {
  const response = await fetch(`${API_URL}/chat/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meetingId,
      userId,
      userName,
      message,
      messageType: 'text'
    })
  });

  return response.json();
};
```

## 🔒 Security

### CORS Configuration

All endpoints include CORS headers:
```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}
```

### Recommended Enhancements

1. **Add Cognito Authorizer**
   - Require JWT tokens
   - Validate user identity

2. **Rate Limiting**
   - API Gateway throttling
   - WAF rules

3. **Input Validation**
   - Sanitize inputs
   - Prevent SQL injection

4. **Encryption**
   - DynamoDB encryption at rest
   - TLS in transit

## 📊 Monitoring

### CloudWatch Logs

**Log Groups**:
- `/aws/lambda/CloudMeetX-CreateMeeting`
- `/aws/lambda/CloudMeetX-JoinMeeting`
- `/aws/lambda/CloudMeetX-ListMeetings`
- `/aws/lambda/CloudMeetX-SaveChat`
- `/aws/lambda/CloudMeetX-GetChatHistory`

**View Logs**:
```bash
aws logs tail /aws/lambda/CloudMeetX-CreateMeeting --follow
```

### DynamoDB Queries

```bash
# List all meetings
aws dynamodb scan --table-name CloudMeetX-Meetings

# Get specific meeting
aws dynamodb get-item \
  --table-name CloudMeetX-Meetings \
  --key '{"meetingId":{"S":"abc123def456"}}'

# Query chat messages
aws dynamodb query \
  --table-name CloudMeetX-ChatMessages \
  --index-name meetingId-timestamp-index \
  --key-condition-expression "meetingId = :mid" \
  --expression-attribute-values '{":mid":{"S":"abc123def456"}}'
```

## 🧪 Testing

### Test with Postman

1. Import collection (coming soon)
2. Set environment variable: `API_URL`
3. Run tests

### Test with cURL

```bash
# Create meeting
MEETING_ID=$(curl -s -X POST $API_URL/meetings/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","hostId":"user1","hostName":"Test User"}' \
  | jq -r '.meeting.meetingId')

# Join meeting
curl -X POST $API_URL/meetings/join \
  -H "Content-Type: application/json" \
  -d "{\"meetingId\":\"$MEETING_ID\",\"userId\":\"user2\",\"userName\":\"User 2\"}"

# Send chat
curl -X POST $API_URL/chat/save \  -H "Content-Type: application/json" \
  -d "{\"meetingId\":\"$MEETING_ID\",\"userId\":\"user2\",\"userName\":\"User 2\",\"message\":\"Hello!\"}"

# Get history
curl "$API_URL/chat/history?meetingId=$MEETING_ID"
```

## 💰 Cost Estimation

**For 1000 meetings/day**:
- DynamoDB: ~$5-10/month (pay-per-request)
- Lambda: ~$2-5/month (first 1M requests free)
- API Gateway: ~$3.50/month (first 1M free)
- **Total: ~$10-20/month**

## 🎯 Best Practices

1. **Use GSI for queries** - Avoid scans when possible
2. **Enable TTL** - Auto-delete old data
3. **Pagination** - Use lastKey for large result sets
4. **Error handling** - Return appropriate status codes
5. **Logging** - Log all operations for debugging
6. **Idempotency** - Use unique IDs (UUID)

## 📚 References

- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)

---

**CloudMeetX REST API** | Node.js 18 | AWS Lambda + DynamoDB + API Gateway
