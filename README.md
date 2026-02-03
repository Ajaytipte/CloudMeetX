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

## 🐛 Troubleshooting

### WebSocket Connection Fails
*   Check if `VITE_WEBSOCKET_URL` matches your deployed API Gateway stage URL.
*   Ensure `$connect` route in API Gateway is correctly integrated with the `onConnect` Lambda.

### 500 Internal Server Error
*   Check CloudWatch Logs for the specific Lambda function.
*   Verify DynamoDB table names match Environment Variables.
*   Ensure Lambda IAM roles have permission to access DynamoDB used.

### Video/Audio Issues
*   Ensure browser permissions for Camera/Mic are allowed.
*   Check STUN server connectivity (default: Google STUN).

---

## 📝 License
This project is licensed under the MIT License.
