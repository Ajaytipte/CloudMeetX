/**
 * CloudMeetX WebSocket Client
 * React hook for WebSocket communication with AWS API Gateway
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket connection states
export const WS_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
};

/**
 * Custom hook for WebSocket connection
 * 
 * @param {string} websocketUrl - WSS URL from API Gateway
 * @param {object} options - Connection options
 * @param {string} options.meetingId - Meeting room ID
 * @param {string} options.userId - User ID
 * @param {string} options.userName - User display name
 * @param {boolean} options.autoConnect - Auto connect on mount (default: true)
 * @param {number} options.reconnectDelay - Delay before reconnect (ms, default: 3000)
 * @param {number} options.maxReconnectAttempts - Max reconnection attempts (default: 5)
 * @param {function} options.onMessage - Message handler
 * @param {function} options.onConnect - Connect handler
 * @param {function} options.onDisconnect - Disconnect handler
 * @param {function} options.onError - Error handler
 */
export const useWebSocket = (websocketUrl, options = {}) => {
    const {
        meetingId,
        userId,
        userName,
        autoConnect = true,
        reconnectDelay = 3000,
        maxReconnectAttempts = 5,
        onMessage,
        onConnect,
        onDisconnect,
        onError
    } = options;

    const [readyState, setReadyState] = useState(WS_STATE.CLOSED);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [reconnectCount, setReconnectCount] = useState(0);

    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const messageQueueRef = useRef([]);

    /**
     * Build WebSocket URL with query parameters
     */
    const buildUrl = useCallback(() => {
        if (!websocketUrl || !meetingId) return null;

        const params = new URLSearchParams({
            meetingId,
            ...(userId && { userId }),
            ...(userName && { userName })
        });

        return `${websocketUrl}?${params.toString()}`;
    }, [websocketUrl, meetingId, userId, userName]);

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(() => {
        const url = buildUrl();
        if (!url) {
            console.error('Cannot connect: missing websocketUrl or meetingId');
            return;
        }

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            console.log('Connecting to WebSocket:', url);
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setReadyState(WS_STATE.OPEN);
                setIsConnected(true);
                setError(null);
                setReconnectCount(0);

                // Send queued messages
                while (messageQueueRef.current.length > 0) {
                    const message = messageQueueRef.current.shift();
                    ws.send(JSON.stringify(message));
                }

                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('WebSocket message received:', message);
                    onMessage?.(message);
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                const errorMsg = 'WebSocket connection error';
                setError(errorMsg);
                onError?.(errorMsg);
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setReadyState(WS_STATE.CLOSED);
                setIsConnected(false);
                wsRef.current = null;

                onDisconnect?.(event);

                // Attempt reconnection
                if (reconnectCount < maxReconnectAttempts) {
                    console.log(`Reconnecting in ${reconnectDelay}ms... (Attempt ${reconnectCount + 1}/${maxReconnectAttempts})`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectCount(prev => prev + 1);
                        connect();
                    }, reconnectDelay);
                } else {
                    console.error('Max reconnection attempts reached');
                    setError('Connection lost. Please refresh the page.');
                }
            };

            wsRef.current = ws;
            setReadyState(WS_STATE.CONNECTING);

        } catch (err) {
            console.error('Failed to create WebSocket connection:', err);
            setError(err.message);
            onError?.(err.message);
        }
    }, [buildUrl, reconnectCount, maxReconnectAttempts, reconnectDelay, onConnect, onMessage, onDisconnect, onError]);

    /**
     * Disconnect from WebSocket
     */
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect');
            wsRef.current = null;
        }

        setIsConnected(false);
        setReadyState(WS_STATE.CLOSED);
        setReconnectCount(maxReconnectAttempts); // Prevent auto-reconnect
    }, [maxReconnectAttempts]);

    /**
     * Send message to specific user
     */
    const sendToUser = useCallback((targetUserId, messageType, data) => {
        const message = {
            action: 'sendMessage',
            targetUserId,
            messageType,
            data
        };

        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, queuing message');
            messageQueueRef.current.push(message);
        }
    }, [isConnected]);

    /**
     * Broadcast message to all users in meeting
     */
    const broadcastToMeeting = useCallback((messageType, data) => {
        const message = {
            action: 'sendMessage',
            meetingId,
            messageType,
            data
        };

        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, queuing message');
            messageQueueRef.current.push(message);
        }
    }, [isConnected, meetingId]);

    /**
     * Send message to specific connection
     */
    const sendToConnection = useCallback((targetConnectionId, messageType, data) => {
        const message = {
            action: 'sendMessage',
            targetConnectionId,
            messageType,
            data
        };

        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, queuing message');
            messageQueueRef.current.push(message);
        }
    }, [isConnected]);

    /**
     * Send raw message
     */
    const sendMessage = useCallback((message) => {
        if (isConnected && wsRef.current) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, queuing message');
            messageQueueRef.current.push(message);
        }
    }, [isConnected]);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect && meetingId) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            disconnect();
        };
    }, []); // Empty deps - only run on mount/unmount

    return {
        // State
        readyState,
        isConnected,
        error,
        reconnectCount,

        // Actions
        connect,
        disconnect,
        sendToUser,
        broadcastToMeeting,
        sendToConnection,
        sendMessage
    };
};

export default useWebSocket;
