/**
 * WebSocket Signaling for WebRTC
 * Handles signaling through AWS API Gateway WebSocket
 */

class SignalingClient {
    constructor(meetingId, userId) {
        this.url = import.meta.env.VITE_WEBSOCKET_URL;
        this.meetingId = meetingId;
        this.userId = userId;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.reconnectTimeout = null;
        this.intentionalClose = false;
        this.messageQueue = [];
        this.handlers = {};

        console.log('🔧 Signaling Client initialized:', {
            url: this.url,
            meetingId: this.meetingId,
            userId: this.userId
        });
    }

    // Connect to WebSocket
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // Validate WebSocket URL
                if (!this.url || this.url === 'undefined') {
                    const error = new Error('WebSocket URL is not configured. Check your .env file.');
                    console.error('❌', error.message);
                    reject(error);
                    return;
                }

                console.log('🔌 Connecting to WebSocket:', this.url);

                // Add parameters to URL for onConnect handler
                const wsUrl = new URL(this.url);
                wsUrl.searchParams.append('meetingId', this.meetingId);
                wsUrl.searchParams.append('userId', this.userId);

                this.ws = new WebSocket(wsUrl.toString());

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected successfully!');
                    this.reconnectAttempts = 0;

                    // We don't need to send explicit 'join' action if onConnect Lambda handles it via query params,
                    // BUT your sendMessage lambda might rely on it for updates. 
                    // Let's send a join-presence message to be safe and notify others immediately.
                    this.send({
                        action: 'sendMessage',
                        meetingId: this.meetingId,
                        messageType: 'user-joined',
                        data: { userId: this.userId }
                    });

                    // Send queued messages
                    while (this.messageQueue.length > 0) {
                        const message = this.messageQueue.shift();
                        this.send(message);
                    }

                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('❌ Error parsing message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', {
                        url: this.url,
                        readyState: this.ws?.readyState,
                        error: error
                    });
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 WebSocket closed', {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean
                    });
                    this.handleReconnect();
                };

            } catch (error) {
                console.error('❌ Error connecting to WebSocket:', error);
                reject(error);
            }
        });
    }

    // Handle incoming messages
    handleMessage(message) {
        // AWS Lambda sendMessage wraps content in: { type, from, data, timestamp }
        const { type, data, from } = message;
        console.log('📨 Received message:', type, message);

        // Filter out messages from self (backend should handle this, but double check)
        if (from?.userId === this.userId) {
            console.log('🔇 Ignoring message from self');
            return;
        }

        // Handle WebRTC signaling messages directly by type
        switch (type) {
            case 'offer':
                if (this.handlers['offer']) {
                    console.log('📨 Handling offer from:', from?.userId);
                    this.handlers['offer']({
                        userId: from?.userId,
                        offer: data.offer
                    });
                }
                break;

            case 'answer':
                if (this.handlers['answer']) {
                    console.log('📨 Handling answer from:', from?.userId);
                    this.handlers['answer']({
                        userId: from?.userId,
                        answer: data.answer
                    });
                }
                break;

            case 'candidate':
                if (this.handlers['candidate']) {
                    console.log('📨 Handling ICE candidate from:', from?.userId);
                    this.handlers['candidate']({
                        userId: from?.userId,
                        candidate: data.candidate
                    });
                }
                break;

            case 'ready':
                // Peer is ready to receive offers
                if (this.handlers['ready']) {
                    console.log('📨 Peer ready:', from?.userId);
                    this.handlers['ready']({ userId: from?.userId });
                }
                break;

            case 'join':
            case 'user-joined':
                if (this.handlers['user-joined']) {
                    console.log('👋 User joined:', data.userId || from?.userId);
                    this.handlers['user-joined']({
                        userId: data.userId || from?.userId
                    });
                }
                break;

            case 'user-left':
                if (this.handlers['user-left']) {
                    console.log('👋 User left:', data.userId || from?.userId);
                    this.handlers['user-left']({
                        userId: data.userId || from?.userId
                    });
                }
                break;

            case 'screen-share':
                if (this.handlers['screen-share']) {
                    console.log('🖥️ Screen share event:', data.type);
                    this.handlers['screen-share']({
                        userId: from?.userId,
                        type: data.type
                    });
                }
                break;

            default:
                console.log('ℹ️ Unhandled message type:', type);
                // Try generic handler
                if (this.handlers[type]) {
                    this.handlers[type]({ ...data, from });
                }
        }
    }

    // Send message through WebSocket
    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
            console.log('📤 Sent message:', payload.messageType || payload.action);
        } else {
            console.log('⏳ WebSocket not ready, queuing message');
            this.messageQueue.push(payload);
        }
    }

    on(type, handler) {
        this.handlers[type] = handler;
    }

    off(type) {
        delete this.handlers[type];
    }

    // --- WebRTC Signaling Methods ---

    // Send WebRTC offer
    sendOffer(targetUserId, offer) {
        this.send({
            action: 'sendMessage',
            meetingId: this.meetingId,
            targetUserId: targetUserId,
            messageType: 'offer',
            data: {
                offer: offer
            }
        });
        console.log('📤 Sent offer to:', targetUserId);
    }

    // Send WebRTC answer
    sendAnswer(targetUserId, answer) {
        this.send({
            action: 'sendMessage',
            meetingId: this.meetingId,
            targetUserId: targetUserId,
            messageType: 'answer',
            data: {
                answer: answer
            }
        });
        console.log('📤 Sent answer to:', targetUserId);
    }

    // Send ICE candidate
    sendIceCandidate(targetUserId, candidate) {
        this.send({
            action: 'sendMessage',
            meetingId: this.meetingId,
            targetUserId: targetUserId,
            messageType: 'candidate',
            data: {
                candidate: candidate
            }
        });
        console.log('📤 Sent ICE candidate to:', targetUserId);
    }

    // Send ready signal (guest ready to receive offer)
    sendReady() {
        this.send({
            action: 'sendMessage',
            meetingId: this.meetingId,
            messageType: 'ready',
            data: { userId: this.userId }
        });
        console.log('📤 Sent ready signal');
    }

    // Notify screen sharing
    sendScreenShareStart() {
        this.send({
            action: 'sendMessage',
            meetingId: this.meetingId, // Broadcast
            messageType: 'screen-share',
            data: { type: 'started' }
        });
    }

    sendScreenShareStop() {
        this.send({
            action: 'sendMessage',
            meetingId: this.meetingId, // Broadcast
            messageType: 'screen-share',
            data: { type: 'stopped' }
        });
    }

    // Handle reconnection
    handleReconnect() {
        if (this.intentionalClose) return;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`🔄 Reconnecting in ${delay}ms...`);
            this.reconnectTimeout = setTimeout(() => {
                this.connect().catch(e => console.error('Reconnect failed', e));
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            if (this.handlers['connection-failed']) this.handlers['connection-failed']();
        }
    }

    disconnect() {
        this.intentionalClose = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export default SignalingClient;
