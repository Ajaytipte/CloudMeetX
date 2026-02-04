# WebRTC Signaling Flow Diagram

## Complete Two-Way Video Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CloudMeetX WebRTC Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

HOST (User A)                   AWS WebSocket API                   GUEST (User B)
─────────────                   ─────────────────                   ──────────────

1. Create Meeting
   └─> getUserMedia()
       ├─> Get video track
       └─> Get audio track
   
2. Initialize WebRTC
   └─> Create RTCPeerConnection
   └─> Add tracks to PC
   
3. Connect WebSocket ────────────────────────────────────────────> Connect WebSocket
   │                                                                    │
   │                                                                4. Initialize WebRTC
   │                                                                   └─> getUserMedia()
   │                                                                   └─> Create RTCPeerConnection
   │                                                                   └─> Add tracks to PC
   │
5. Send "ready" signal ──────┐                              ┌────── Send "ready" signal
   │                         │                              │
   │                         ▼                              ▼
   │                    ┌────────────────────────────────────┐
   │                    │  AWS Lambda (sendMessage)          │
   │                    │  - Routes to all participants      │
   │                    │  - Excludes sender                 │
   │                    └────────────────────────────────────┘
   │                         │                              │
   │◄────────────────────────┘                              └──────────────────────┐
   │ Receive "ready" signal                                   Receive "ready" signal│
   │ from Guest                                               from Host             │
   │                                                                                │
6. Create Offer                                                                    │
   └─> pc.createOffer()                                                            │
   └─> pc.setLocalDescription(offer)                                               │
   │                                                                                │
7. Send "offer" ─────────┐                                                         │
   │                     │                                                         │
   │                     ▼                                                         │
   │                ┌────────────────────┐                                         │
   │                │  AWS Lambda        │                                         │
   │                │  (Route to Guest)  │                                         │
   │                └────────────────────┘                                         │
   │                     │                                                         │
   │                     └────────────────────────────────────────────────────────►│
   │                                                           Receive "offer"     │
   │                                                           └─> pc.setRemoteDescription(offer)
   │                                                           └─> pc.createAnswer()
   │                                                           └─> pc.setLocalDescription(answer)
   │                                                                                │
   │                                                           Send "answer" ──────┐
   │                                                                                │
   │                                                                                ▼
   │                                                           ┌────────────────────┐
   │                                                           │  AWS Lambda        │
   │                                                           │  (Route to Host)   │
   │                                                           └────────────────────┘
   │                                                                                │
   │◄───────────────────────────────────────────────────────────────────────────────┘
   │ Receive "answer"
   └─> pc.setRemoteDescription(answer)
   
8. ✅ WebRTC Handshake Complete!

   ┌──────────────────────────────────────────────────────────────────────────┐
   │                       ICE Candidate Exchange                              │
   │                                                                           │
   │  HOST                          AWS Lambda                         GUEST  │
   │   │                                                                │      │
   │   ├─> pc.onicecandidate ───────────────────────────────────────> │      │
   │   │    └─> Send "candidate"              Receive "candidate"     │      │
   │   │                                       └─> pc.addIceCandidate()│      │
   │   │                                                                │      │
   │   │ <─────────────────────────────────────────────────────────────┤      │
   │   │      Receive "candidate"              Send "candidate"        │      │
   │   │      └─> pc.addIceCandidate()         pc.onicecandidate       │      │
   │   │                                                                │      │
   │   │ (Multiple candidates exchanged until ICE gathering complete)  │      │
   └──────────────────────────────────────────────────────────────────────────┘

9. ✅ ICE Connection Established

   ┌──────────────────────────────────────────────────────────────────────────┐
   │                         Media Flow (Direct P2P)                           │
   │                                                                           │
   │  HOST ◄─────────────────── Video/Audio ──────────────────────► GUEST    │
   │   │                                                                │      │
   │   ├─> pc.ontrack                                                  │      │
   │   │    └─> event.streams[0]                                       │      │
   │   │    └─> remoteVideo.srcObject = stream                         │      │
   │   │                                                                │      │
   │   │                                                      pc.ontrack┤      │
   │   │                                          event.streams[0]      │      │
   │   │                              remoteVideo.srcObject = stream    │      │
   │   │                                                                │      │
   └──────────────────────────────────────────────────────────────────────────┘

10. ✅ Two-Way Video Call Active!

    HOST sees:                                    GUEST sees:
    ┌─────────────────────┐                      ┌─────────────────────┐
    │  Local Video (You)  │                      │  Local Video (You)  │
    │  Remote Video (B)   │                      │  Remote Video (A)   │
    └─────────────────────┘                      └─────────────────────┘
```

## Message Format Reference

### 1. Ready Signal
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "messageType": "ready",
  "data": {
    "userId": "user-abc"
  }
}
```

### 2. Offer Signal
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "user-xyz",
  "messageType": "offer",
  "data": {
    "offer": {
      "type": "offer",
      "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
    }
  }
}
```

### 3. Answer Signal
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "user-abc",
  "messageType": "answer",
  "data": {
    "answer": {
      "type": "answer",
      "sdp": "v=0\r\no=- 987654321 2 IN IP4 127.0.0.1\r\n..."
    }
  }
}
```

### 4. ICE Candidate
```json
{
  "action": "sendMessage",
  "meetingId": "meeting-123",
  "targetUserId": "user-xyz",
  "messageType": "candidate",
  "data": {
    "candidate": {
      "candidate": "candidate:842163049 1 udp 1677729535 192.168.1.100 54321 typ srflx...",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }
}
```

## Connection States Timeline

```
Time  Host State              Guest State             Description
────  ─────────────────────   ─────────────────────   ──────────────────────────
0s    new                     new                     Initial state
2s    connecting              connecting              WebSocket connected
3s    connected (signaling)   connected (signaling)   "ready" signals exchanged
4s    have-local-offer        -                       Host created offer
5s    -                       have-remote-offer       Guest received offer
6s    stable                  stable                  Answer received/sent
7s    checking (ICE)          checking (ICE)          ICE candidates exchanged
8s    connected (ICE)         connected (ICE)         ICE connection established
9s    ✅ Video streaming       ✅ Video streaming       Two-way video active
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────────┐
│                        Error Scenarios                          │
└────────────────────────────────────────────────────────────────┘

Scenario 1: Camera Permission Denied
─────────────────────────────────────
getUserMedia() → Error
    └─> Show error message
    └─> Fallback to audio-only
    └─> Or prevent joining

Scenario 2: WebSocket Connection Failed
────────────────────────────────────────
ws.onerror → Reconnection logic
    └─> Retry 5 times with exponential backoff
    └─> Show "Connection failed" message
    └─> Allow manual retry

Scenario 3: ICE Connection Failed
──────────────────────────────────
pc.connectionState === 'failed'
    └─> Close peer connection
    └─> Remove from participants
    └─> Show "Connection lost" message
    └─> Allow reconnection

Scenario 4: No Local Stream Available
──────────────────────────────────────
createPeerConnection() → No localStream
    └─> Throw error
    └─> Clean up failed connection
    └─> Log error message
```

## Best Practices ✅

1. **Always wait for "ready" signal** before creating offers
2. **Error handling** at every async operation
3. **Clean up** peer connections on failure
4. **Comprehensive logging** for debugging
5. **Null checks** before accessing streams/connections
6. **Proper cleanup** when leaving meeting

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ useWebRTC.js │  │ signaling.js │  │ media.js     │      │
│  │   (React     │  │ (WebSocket)  │  │ (getUserMedia)│      │
│  │    Hook)     │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ WebSocket
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                            ▼                                 │
│              AWS API Gateway (WebSocket)                     │
│                            │                                 │
│                            ▼                                 │
│              AWS Lambda (sendMessage)                        │
│              - Routes messages                               │
│              - Validates meetingId                           │
│              - Broadcasts to participants                    │
└──────────────────────────────────────────────────────────────┘
```
