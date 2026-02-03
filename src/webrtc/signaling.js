/**
 * WebSocket Signaling for WebRTC
 * Handles signaling through AWS API Gateway WebSocket
 */

class SignalingClient {
    constructor(meetingId, userId) {
        // Use environment variable directly as requested
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

                // Connect to AWS API Gateway WebSocket
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected successfully!');
                    this.reconnectAttempts = 0;

                    // Join meeting room
                    this.send({
                        action: 'join',
                        meetingId: this.meetingId,
                        userId: this.userId
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
                    // Don't reject immediatly allows retry logic to kick in if needed
                    // but for initial connection failure we might want to reject
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
    handleMessage(data) {
        const { type, ...payload } = data;

        console.log('📨 Received message:', type, payload);

        // Call registered handlers
        if (this.handlers[type]) {
            this.handlers[type](payload);
        }

        // Default handlers
        switch (type) {
            case 'user-joined':
                console.log('👋 User joined:', payload.userId);
                break;
            case 'user-left':
                console.log('👋 User left:', payload.userId);
                break;
            case 'offer':
            case 'answer':
            case 'ice-candidate':
                // These are handled by registered handlers
                break;
            default:
                console.log('ℹ️ Unhandled message type:', type);
        }
    }

    // Send message through WebSocket
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                ...data,
                meetingId: this.meetingId,
                userId: this.userId,
                timestamp: Date.now()
            };

            this.ws.send(JSON.stringify(message));
            console.log('📤 Sent message:', data.action || data.type);
        } else {
            console.log('⏳ WebSocket not ready, queuing message');
            this.messageQueue.push(data);
        }
    }

    // Register message handler
    on(type, handler) {
        this.handlers[type] = handler;
    }

    // Remove message handler
    off(type) {
        delete this.handlers[type];
    }

    // Send WebRTC offer
    sendOffer(targetUserId, offer) {
        this.send({
            action: 'signal',
            type: 'offer',
            targetUserId,
            offer
        });
    }

    // Send WebRTC answer
    sendAnswer(targetUserId, answer) {
        this.send({
            action: 'signal',
            type: 'answer',
            targetUserId,
            answer
        });
    }

    // Send ICE candidate
    sendIceCandidate(targetUserId, candidate) {
        this.send({
            action: 'signal',
            type: 'ice-candidate',
            targetUserId,
            candidate
        });
    }

    // Notify screen sharing started
    sendScreenShareStart() {
        this.send({
            action: 'screen-share',
            type: 'started'
        });
    }

    // Notify screen sharing stopped
    sendScreenShareStop() {
        this.send({
            action: 'screen-share',
            type: 'stopped'
        });
    }

    // Handle reconnection with exponential backoff
    handleReconnect() {
        // Don't reconnect if we explicitly closed the connection
        if (this.intentionalClose) {
            console.log('⚠️ Skipping reconnect: connection was intentionally closed');
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            this.reconnectTimeout = setTimeout(() => {
                console.log('🔌 Attempting to reconnect...');
                this.connect().catch(error => {
                    console.error('❌ Reconnection failed:', error.message);
                    // The onclose handler will trigger another reconnect attempt
                });
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached. Please refresh the page or check your connection.');
            if (this.handlers['connection-failed']) {
                this.handlers['connection-failed']();
            }
        }
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.ws) {
            // Mark this as an intentional close to prevent reconnection
            this.intentionalClose = true;

            // Clear any pending reconnection attempts
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }

            // Send leave message
            this.send({
                action: 'leave',
                meetingId: this.meetingId,
                userId: this.userId
            });

            // Close connection
            this.ws.close();
            this.ws = null;
            console.log('👋 Disconnected from signaling server');
        }
    }

    // Check connection status
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

export default SignalingClient;
