# Quick Start - Testing WebRTC in CloudMeetX

## Prerequisites ✅

1. ✅ Node.js installed
2. ✅ Dependencies installed (`npm install`)
3. ✅ `.env` file configured with WebSocket URL
4. ✅ Camera and microphone permissions granted in browser

## Quick Test (2-Person Meeting)

### Step 1: Start Development Server

```bash
npm run dev
```

The app should start on `http://localhost:5173` (or similar).

### Step 2: Open Two Browser Windows

**Window 1 - Host**:
1. Navigate to: `http://localhost:5173`
2. Click "Create Meeting" or navigate to a meeting page
3. Allow camera/microphone access when prompted
4. Note the meeting ID

**Window 2 - Guest**:
1. Open a new browser window (or incognito/private window)
2. Navigate to: `http://localhost:5173`
3. Click "Join Meeting"
4. Enter the meeting ID from Window 1
5. Allow camera/microphone access when prompted
6. Click "Join"

### Step 3: Verify Connection

**Both windows should show**:
- ✅ Your own video (local stream)
- ✅ The other person's video (remote stream)
- ✅ Audio working both ways

### Step 4: Check Console Logs

**Open browser DevTools (F12) in both windows and check console:**

**Host Console Should Show:**
```
✅ WebSocket connected successfully!
📤 Sent ready signal
📨 Peer ready, creating offer for: user-xxx
🔗 Creating peer connection for user-xxx (offer: true)
➕ Adding video track to peer connection
➕ Adding audio track to peer connection
📤 Creating offer for user-xxx...
✅ Set local description (offer) for user-xxx
📤 Sent offer to: user-xxx
🧊 ICE candidate for user-xxx
📤 Sent ICE candidate to: user-xxx
📥 Handling answer from user-xxx...
📝 Setting remote description (answer) for user-xxx
✅ WebRTC handshake completed with user-xxx
📨 Received ICE candidate from: user-xxx
📺 Received remote video track from: user-xxx
📺 Received remote audio track from: user-xxx
✅ Successfully connected to user-xxx
```

**Guest Console Should Show:**
```
✅ WebSocket connected successfully!
📤 Sent ready signal
📥 Handling offer from user-xxx...
🔗 Creating peer connection for user-xxx (offer: false)
➕ Adding video track to peer connection
➕ Adding audio track to peer connection
📝 Setting remote description (offer) for user-xxx
📤 Creating answer for user-xxx...
✅ Set local description (answer) for user-xxx
📤 Sent answer to: user-xxx
🧊 ICE candidate for user-xxx
📤 Sent ICE candidate to: user-xxx
📨 Received ICE candidate from: user-xxx
📺 Received remote video track from: user-xxx
📺 Received remote audio track from: user-xxx
✅ Successfully connected to user-xxx
```

## Troubleshooting 🔧

### Problem: "WebSocket connection failed"

**Symptoms**: Console shows WebSocket errors
**Solutions**:
1. Check `.env` file has correct `VITE_WEBSOCKET_URL`
2. Verify AWS API Gateway WebSocket is deployed
3. Check if backend Lambda functions are working
4. Try: `npm run dev` again (restart dev server)

### Problem: "Cannot create peer connection: No local stream available"

**Symptoms**: Console error about missing stream
**Solutions**:
1. Refresh the page and grant camera/microphone permissions
2. Check if another application is using your camera
3. Try closing other tabs/apps using camera
4. Check browser camera settings

### Problem: Local video shows, but no remote video

**Symptoms**: You see yourself, but not the other person
**Solutions**:
1. Check console for "📺 Received remote track" messages
2. Verify both peers completed the handshake:
   - Look for "✅ WebRTC handshake completed"
3. Check if ICE candidates are being exchanged:
   - Look for "🧊 ICE candidate" messages
4. Verify signaling messages are being sent/received:
   - Look for "📤 Sent offer/answer" and "📥 Handling offer/answer"
5. Try refreshing both windows

### Problem: Video freezes or stutters

**Symptoms**: Video is choppy or freezes
**Solutions**:
1. Check network connection quality
2. Close other bandwidth-heavy applications
3. Try on same WiFi network (for testing)
4. Check CPU usage in Task Manager

### Problem: No audio

**Symptoms**: Video works but no audio
**Solutions**:
1. Check browser audio permissions
2. Unmute yourself and the other person
3. Check system audio settings
4. Verify audio tracks in console:
   ```javascript
   localStream.getAudioTracks() // Should have 1 track
   ```

## Advanced Testing 🧪

### Run Automated Tests

Open browser console and run:

```javascript
// Test WebRTC support
window.testWebRTC.testSupport();

// Test WebSocket connection
await window.testWebRTC.testWebSocket();

// Test camera/microphone
await window.testWebRTC.testMedia();

// Test peer connection
await window.testWebRTC.testPeerConnection();

// Run all tests
await window.testWebRTC.runAll();
```

### Inspect WebRTC Statistics

**Chrome/Edge**:
1. Join a meeting
2. Open: `chrome://webrtc-internals/`
3. View real-time WebRTC stats, graphs, and logs

**Firefox**:
1. Join a meeting
2. Open: `about:webrtc`
3. View connection details and statistics

### Check Connection State

In browser console:
```javascript
// Get current peer connections (after joining meeting)
// This will be available if you expose it for debugging
```

## Performance Benchmarks 📊

**Expected Performance**:
- Connection establishment: 2-5 seconds
- Video quality: 480p-720p (depends on bandwidth)
- Audio latency: < 200ms
- Video latency: < 500ms

**Bandwidth Usage** (approximate):
- Audio: ~50-100 kbps
- Video (480p): ~500-1000 kbps
- Video (720p): ~1000-2000 kbps

## Testing Checklist ✅

Before declaring success, verify:

- [ ] Both users can see each other
- [ ] Audio works both ways
- [ ] Video is smooth (not frozen)
- [ ] Can toggle microphone on/off
- [ ] Can toggle video on/off
- [ ] Connection persists for > 1 minute
- [ ] Can leave meeting cleanly
- [ ] Works on different browsers (Chrome, Firefox, Edge)
- [ ] Works on different networks
- [ ] Console shows no errors

## Next Steps 🚀

Once local testing works:

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Deploy to AWS Amplify**:
   - Commit your changes
   - Push to GitHub
   - Amplify will auto-deploy

3. **Test in production**:
   - Use real domain (not localhost)
   - Test with friends on different networks
   - Monitor AWS CloudWatch logs

4. **Add monitoring**:
   - Set up error tracking (e.g., Sentry)
   - Monitor WebSocket connections
   - Track connection success rates

## Support 🆘

If you encounter issues:

1. **Check documentation**:
   - `docs/WEBRTC_IMPLEMENTATION.md` - Full implementation guide
   - `docs/WEBRTC_UPDATE_SUMMARY.md` - What changed

2. **Debug logs**:
   - All important events are logged with emojis
   - Look for ❌ errors in console
   - Check AWS CloudWatch for backend errors

3. **Common resources**:
   - [WebRTC Troubleshooting](https://webrtc.github.io/samples/)
   - [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
   - [AWS WebSocket Docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

Happy testing! 🎉
