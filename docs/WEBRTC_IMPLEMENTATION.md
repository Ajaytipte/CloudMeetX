# WebRTC Implementation Guide - CloudMeetX

## Overview
This document describes the complete WebRTC signaling flow for CloudMeetX, integrated with AWS API Gateway WebSocket backend.

## Architecture

### Components
1. **Frontend (React)**
   - `useWebRTC.js` - Main WebRTC hook
   - `signaling.js` - WebSocket signaling client
   - `MeetingRoom.jsx` - Meeting UI component

2. **Backend (AWS)**
   - API Gateway WebSocket API: `wss://8yjdh5z9mg.execute-api.ap-south-1.amazonaws.com/prod`
   - Lambda functions for message routing

## WebRTC Signaling Flow

### 1. Host Flow (User who creates the meeting)

```
1. Join Meeting
   └─> getUserMedia() - Get camera/microphone
   └─> Create RTCPeerConnection
   └─> Add local tracks to peer connection
   └─> Connect to WebSocket
   └─> Send "ready" signal
   
2. When Guest Joins (receives "ready" signal)
   └─> Create offer
   └─> Set local description (offer)
   └─> Send offer via WebSocket:
       {
         action: "sendMessage",
         meetingId: "<meeting-id>",
         targetUserId: "<guest-id>",
         messageType: "offer",
         data: { offer: <SDP> }
       }

3. Receive Answer from Guest
   └─> Set remote description (answer)
   └─> Connection established ✅

4. Exchange ICE Candidates
   └─> When onicecandidate fires → send candidate
   └─> When receiving candidate → addIceCandidate()
```

### 2. Guest Flow (User who joins the meeting)

```
1. Join Meeting
   └─> getUserMedia() - Get camera/microphone
   └─> Create RTCPeerConnection
   └─> Add local tracks to peer connection
   └─> Connect to WebSocket
   └─> Send "ready" signal

2. Receive Offer from Host
   └─> Set remote description (offer)
   └─> Create answer
   └─> Set local description (answer)
   └─> Send answer via WebSocket:
       {
         action: "sendMessage",
         meetingId: "<meeting-id>",
         targetUserId: "<host-id>",
         messageType: "answer",
         data: { answer: <SDP> }
       }

3. Connection Established ✅

4. Exchange ICE Candidates
   └─> When onicecandidate fires → send candidate
   └─> When receiving candidate → addIceCandidate()
```

## Message Types

### WebSocket Message Format

All messages sent to the backend use this format:
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "user-456",  // Optional - for direct messages
  "messageType": "offer|answer|candidate|ready|join",
  "data": { ... }
}
```

### Message Types Supported

#### 1. `ready`
Sent when a user is ready to receive offers.
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "messageType": "ready",
  "data": { "userId": "user-123" }
}
```

#### 2. `offer`
Host sends WebRTC offer to guest.
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "guest-id",
  "messageType": "offer",
  "data": {
    "offer": {
      "type": "offer",
      "sdp": "v=0\r\no=..."
    }
  }
}
```

#### 3. `answer`
Guest sends WebRTC answer to host.
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "host-id",
  "messageType": "answer",
  "data": {
    "answer": {
      "type": "answer",
      "sdp": "v=0\r\no=..."
    }
  }
}
```

#### 4. `candidate`
ICE candidate exchange.
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "peer-id",
  "messageType": "candidate",
  "data": {
    "candidate": {
      "candidate": "candidate:...",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }
}
```

#### 5. `join` / `user-joined`
User joined notification.
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "messageType": "join",
  "data": { "userId": "user-123" }
}
```

## Code Structure

### useWebRTC Hook

**Purpose**: Manages WebRTC peer connections, media streams, and signaling.

**Key Functions**:
- `initializeWebRTC()` - Initialize local media and signaling
- `createPeerConnection(remoteUserId, createOffer)` - Create peer connection
- `handleOffer(remoteUserId, offer)` - Handle incoming offer
- `handleAnswer(remoteUserId, answer)` - Handle incoming answer
- `handleIceCandidate(remoteUserId, candidate)` - Handle ICE candidate

**State**:
- `localStream` - Local camera/microphone stream
- `remoteStreams` - Map of remote user streams
- `participants` - Map of participant metadata
- `connectionState` - WebRTC connection state

### SignalingClient

**Purpose**: WebSocket communication with AWS API Gateway.

**Key Methods**:
- `connect()` - Establish WebSocket connection
- `sendOffer(targetUserId, offer)` - Send WebRTC offer
- `sendAnswer(targetUserId, answer)` - Send WebRTC answer
- `sendIceCandidate(targetUserId, candidate)` - Send ICE candidate
- `sendReady()` - Send ready signal
- `on(type, handler)` - Register message handler
- `handleMessage(message)` - Process incoming messages

## Debugging

### Browser Console Logs

The implementation includes comprehensive logging:
- 🔌 WebSocket connection events
- 📨 Received messages
- 📤 Sent messages
- 🔗 Peer connection creation
- ➕ Track additions
- 🧊 ICE candidate events
- 📺 Remote track events
- ✅ Success indicators
- ❌ Error messages

### Common Issues & Solutions

#### 1. Remote video not showing
**Symptoms**: Local video works, but remote video is black/missing.
**Check**:
- Console for "📺 Received remote track" messages
- Check if `ontrack` event is firing
- Verify both peers have sent/received offer and answer
- Check ICE connection state

#### 2. WebSocket connection fails
**Symptoms**: "WebSocket closed" or connection errors.
**Check**:
- `.env` file has correct `VITE_WEBSOCKET_URL`
- AWS API Gateway WebSocket API is deployed
- Lambda functions are configured correctly
- Check browser console for error details

#### 3. ICE connection fails
**Symptoms**: Connection state stuck at "checking" or "failed".
**Check**:
- STUN server is accessible
- Network allows WebRTC connections
- Check firewall/NAT settings
- Consider adding TURN server for NAT traversal

#### 4. No offer/answer exchange
**Symptoms**: Peers join but no video exchange.
**Check**:
- "ready" signal is being sent and received
- `createPeerConnection` is being called
- Offer/answer are being sent via WebSocket
- Backend is routing messages correctly

## Testing

### Local Testing Steps

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open two browser windows**:
   - Window 1: Host (create meeting)
   - Window 2: Guest (join with meeting ID)

3. **Monitor console logs** in both windows:
   - Look for WebSocket connection
   - Check for "ready" signals
   - Verify offer/answer exchange
   - Watch ICE candidates

4. **Expected flow**:
   ```
   Host: Connected → Ready → Creating offer → Sent offer → Received answer → Connected
   Guest: Connected → Ready → Received offer → Sent answer → Connected
   ```

### Production Testing

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to AWS Amplify

3. Test with real users on different networks

4. Monitor AWS CloudWatch logs for Lambda functions

## Performance Optimization

- **Bandwidth**: Use video constraints to limit resolution
- **CPU**: Disable video when not needed
- **Network**: Add TURN server for better connectivity
- **Latency**: Use regional STUN/TURN servers

## Security Considerations

- Use HTTPS/WSS for all connections
- Validate user authentication before allowing WebRTC
- Implement meeting access controls
- Consider end-to-end encryption for sensitive data

## Future Enhancements

- [ ] Support for more than 2 participants (mesh or SFU)
- [ ] Simulcast for better quality
- [ ] Data channels for chat/file transfer
- [ ] Recording functionality
- [ ] Screen sharing
- [ ] Virtual backgrounds

## References

- [WebRTC API Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [AWS API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Perfect Negotiation Pattern](https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/)
