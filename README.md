# CloudMeetX - Real-time Video Conferencing Application

CloudMeetX is a modern, serverless video conferencing platform built with React, AWS WebRTC, and Lambda. It features real-time video/audio communication, screen sharing, chat, and secure meeting rooms.

## 🚀 Features

*   **Real-time Video & Audio**: High-quality communication using WebRTC.
*   **Screen Sharing**: Share your screen with other participants.
*   **Chat System**: Real-time messaging within meetings.
*   **Meeting Management**: Create and join meetings with unique IDs.
*   **Secure Access**: Powered by AWS Cognito and API Gateway.
*   **Serverless Backend**: Built on AWS Lambda, DynamoDB, and WebSocket APIs.

---

## 🛠️ Technology Stack

*   **Frontend**: React, Vite, TailwindCSS
*   **Real-time**: WebRTC, WebSocket (AWS API Gateway)
*   **Backend**: AWS Lambda (Node.js)
*   **Database**: Amazon DynamoDB
*   **Storage**: Amazon S3
*   **Auth**: AWS Cognito

---

## 📦 Project Setup

### 1. Prerequisites
*   Node.js (v18+)
*   AWS CLI (configured with credentials)
*   Git

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd CloudMeetX

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# AWS Configuration
# AWS Configuration
VITE_AWS_REGION=your-aws-region
VITE_AWS_USER_POOL_ID=your-user-pool-id
VITE_AWS_USER_POOL_WEB_CLIENT_ID=your-client-id

# API Configuration
VITE_API_BASE_URL=https://your-api-id.execute-api.your-region.amazonaws.com/Prod
VITE_WEBSOCKET_URL=wss://your-ws-api-id.execute-api.your-region.amazonaws.com/prod/

# Feature Flags
VITE_ENABLE_RECORDING=true
VITE_ENABLE_SCREEN_SHARE=true
```

### 4. Running Locally
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

---

## 📂 Project Structure

```text
CloudMeetX/
├── lambda/                     # AWS Lambda Functions (Backend)
│   ├── api/                    # REST API Functions
│   │   ├── createMeeting/      # POST /createMeeting
│   │   ├── saveChatMessage/    # POST /saveChatMessage
│   │   └── ...
│   ├── onConnect/              # WebSocket $connect
│   ├── onDisconnect/           # WebSocket $disconnect
│   └── sendMessage/            # WebSocket sendMessage (Routing)
│
├── src/                        # React Frontend Source
│   ├── components/             # Reusable UI Components
│   ├── config/                 # API & App Configuration
│   ├── pages/                  # Main Page Views
│   │   ├── Dashboard.jsx       # User Dashboard
│   │   ├── MeetingRoom.jsx     # Video Conference Room
│   │   ├── CreateMeetingPage.jsx # Meeting Setup/Share
│   │   └── ...
│   ├── webrtc/                 # WebRTC Core Logic
│   │   ├── media.js            # Camera/Mic/Screen API
│   │   ├── signaling.js        # WebSocket Signaling Class
│   │   └── useWebRTC.js        # Main React Hook
│   ├── App.jsx                 # Routing & Layout
│   └── main.jsx                # Entry Point
│
├── public/                     # Static Assets
├── .env                        # Environment Variables (Secrets)
├── tailwind.config.js          # Tailwind Styling Config
└── package.json                # Dependencies & Scripts
```

---

## ☁️ AWS Services Setup & Deployment

### 1. DynamoDB Tables
Create these tables in `ap-south-1` (Mumbai):

*   **CloudMeetXMeetings**
    *   Partition Key: `meetingId` (String)
*   **CloudMeetXMessages**
    *   Partition Key: `meetingId` (String)
    *   Sort Key: `timestamp` (String)
*   **CloudMeetXConnections**
    *   Partition Key: `connectionId` (String)

### 2. AWS Lambda Functions
Deploy the functions located in the `/lambda` directory.

| Function Name | Handler | Environment Vars | Permissions |
|Params|---|---|---|
| `createMeeting` | `api/createMeeting/index.handler` | `MEETINGS_TABLE` | `DynamoDBFullAccess` |
| `saveChatMessage` | `api/saveChatMessage/index.handler` | `MESSAGES_TABLE` | `DynamoDBFullAccess` |
| `onConnect` | `onConnect/index.handler` | `TABLE_NAME` | `DynamoDBFullAccess` |
| `onDisconnect` | `onDisconnect/index.handler` | `TABLE_NAME` | `DynamoDBFullAccess` |
| `sendMessage` | `sendMessage/index.handler` | `TABLE_NAME`, `REGION` | `DynamoDBFullAccess`, `ExecuteApi` |

### 3. WebSocket API Gateway
1.  **Create API**: "WebSocket API" named `CloudMeetX-WS`
2.  **Routes**:
    *   `$connect` -> Link to `onConnect` Lambda
    *   `$disconnect` -> Link to `onDisconnect` Lambda
    *   `sendMessage` -> Link to `sendMessage` Lambda
3.  **Deploy**: Create a stage named `prod` and deploy.

### 4. REST API Gateway (HTTP API)
1.  **Create API**: "HTTP API" named `CloudMeetX-REST`
2.  **Routes**:
    *   `POST /createMeeting` -> Link to `createMeeting` Lambda
    *   `POST /saveChatMessage` -> Link to `saveChatMessage` Lambda
3.  **CORS**: Enable CORS for `*` (All origins).

---

## 🎥 WebRTC Implementation

CloudMeetX uses **production-ready WebRTC** for two-way video conferencing. The implementation includes:

- ✅ Complete peer-to-peer connections (host ↔ guest)
- ✅ Full signaling protocol (offer → answer → ICE candidates)
- ✅ AWS WebSocket API integration
- ✅ Comprehensive error handling
- ✅ ICE connection monitoring

### 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_START_TESTING.md](docs/QUICK_START_TESTING.md)** | Quick guide to test WebRTC locally |
| **[WEBRTC_IMPLEMENTATION.md](docs/WEBRTC_IMPLEMENTATION.md)** | Complete implementation details |
| **[WEBRTC_UPDATE_SUMMARY.md](docs/WEBRTC_UPDATE_SUMMARY.md)** | Summary of production updates |
| **[SIGNALING_FLOW_DIAGRAM.md](docs/SIGNALING_FLOW_DIAGRAM.md)** | Visual signaling flow diagrams |
| **[IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md)** | Verification checklist |

### 🧪 Quick Test

```bash
# Start development server
npm run dev

# Open browser console and run:
window.testWebRTC.runAll()
```

**Two-Person Test**:
1. Open two browser windows
2. Window 1: Create meeting (host)
3. Window 2: Join meeting (guest)
4. Both should see each other's video ✅

### 🔍 Expected Console Output

**Host should see**:
```
✅ WebSocket connected successfully!
📤 Sent ready signal
📨 Peer ready, creating offer for: user-xxx
✅ Set local description (offer)
📤 Sent offer to: user-xxx
📥 Handling answer from user-xxx
✅ WebRTC handshake completed
📺 Received remote video track
```

**Guest should see**:
```
✅ WebSocket connected successfully!
📤 Sent ready signal
📥 Handling offer from user-xxx
✅ Set local description (answer)
📤 Sent answer to: user-xxx
📺 Received remote video track
```

### ⚙️ WebRTC Configuration

**STUN Server**: `stun:stun.l.google.com:19302` (Google's public STUN)

**For production NAT traversal**, add a TURN server in `src/webrtc/useWebRTC.js`:
```javascript
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:your-turn-server.com:3478',
            username: 'your-username',
            credential: 'your-password'
        }
    ]
};
```

---

## 🐛 Troubleshooting

### WebSocket Connection Fails
*   Check if `VITE_WEBSOCKET_URL` matches your deployed API Gateway stage URL.
*   Ensure `$connect` route in API Gateway is correctly integrated with the `onConnect` Lambda.

### 500 Internal Server Error
*   Check CloudWatch Logs for the specific Lambda function.
*   Verify DynamoDB table names match Environment Variables.
*   Ensure Lambda IAM roles have permission to access DynamoDB used.

### Video/Audio Issues
*   **No remote video**: Check console for "📺 Received remote track" messages. Verify both peers completed WebRTC handshake.
*   **Camera permission denied**: Grant browser permissions and refresh the page.
*   **ICE connection failed**: Firewall may be blocking WebRTC. Try different network or add TURN server.
*   **WebRTC not supported**: Use latest Chrome, Firefox, or Edge browser.
*   **Audio echo**: Ensure local video is muted (already handled in code).

**Detailed Debugging**:
- Open `chrome://webrtc-internals/` (Chrome/Edge) or `about:webrtc` (Firefox)
- Run `window.testWebRTC.runAll()` in browser console
- Check [QUICK_START_TESTING.md](docs/QUICK_START_TESTING.md) for step-by-step troubleshooting

---

## 📝 License
This project is licensed under the MIT License.
