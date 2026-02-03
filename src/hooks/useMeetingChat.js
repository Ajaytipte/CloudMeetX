/**
 * CloudMeetX - In-Meeting Chat Hook
 * 
 * Chat functionality using WebSocket for real-time messages
 * and REST API for message persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat as useChatAPI } from './useApi';

/**
 * Hook for in-meeting chat with WebSocket + DynamoDB
 * 
 * @param {object} webSocket - WebSocket connection from useWebSocket
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - Current user ID
 * @param {string} userName - Current user name
 * @returns {object} Chat state and functions
 */
export const useMeetingChat = (webSocket, meetingId, userId, userName) => {
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isTyping, setIsTyping] = useState({});
    const [error, setError] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef({});
    const { saveMessage, getChatHistory } = useChatAPI();

    /**
     * Send a chat message
     */
    const sendMessage = useCallback(async (text, saveToDb = true) => {
        if (!text.trim() || !webSocket?.isConnected) {
            return false;
        }

        const message = {
            type: 'chat',
            meetingId,
            sender: {
                userId,
                userName
            },
            text: text.trim(),
            timestamp: Date.now(),
            messageId: `${userId}-${Date.now()}` // Temporary ID
        };

        try {
            // Send via WebSocket for real-time delivery
            webSocket.broadcastToMeeting('chat', message);

            // Add to local messages immediately (optimistic update)
            setMessages(prev => [...prev, {
                ...message,
                status: 'sending',
                fromSelf: true
            }]);

            // Save to DynamoDB for persistence (optional)
            if (saveToDb) {
                try {
                    const saved = await saveMessage(
                        meetingId,
                        userId,
                        userName,
                        text,
                        'text'
                    );

                    if (saved) {
                        // Update message with DB info
                        setMessages(prev => prev.map(msg =>
                            msg.messageId === message.messageId
                                ? { ...msg, ...saved, status: 'sent' }
                                : msg
                        ));
                    }
                } catch (dbError) {
                    console.warn('Failed to save message to DB:', dbError);
                    // Message still sent via WebSocket, just not persisted
                    setMessages(prev => prev.map(msg =>
                        msg.messageId === message.messageId
                            ? { ...msg, status: 'sent_not_saved' }
                            : msg
                    ));
                }
            } else {
                // Mark as sent
                setTimeout(() => {
                    setMessages(prev => prev.map(msg =>
                        msg.messageId === message.messageId
                            ? { ...msg, status: 'sent' }
                            : msg
                    ));
                }, 100);
            }

            return true;

        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message');

            // Mark message as failed
            setMessages(prev => prev.map(msg =>
                msg.messageId === message.messageId
                    ? { ...msg, status: 'failed' }
                    : msg
            ));

            return false;
        }
    }, [webSocket, meetingId, userId, userName, saveMessage]);

    /**
     * Handle receiving a message via WebSocket
     */
    const handleIncomingMessage = useCallback((message) => {
        // Don't add our own messages (already added optimistically)
        if (message.sender?.userId === userId) {
            return;
        }

        // Add to messages
        setMessages(prev => {
            // Check for duplicates
            if (prev.some(m => m.messageId === message.messageId ||
                (m.timestamp === message.timestamp && m.sender?.userId === message.sender?.userId))) {
                return prev;
            }

            return [...prev, {
                ...message,
                fromSelf: false,
                status: 'received'
            }];
        });

        // Increment unread count if not focused
        if (document.hidden) {
            setUnreadCount(prev => prev + 1);
        }

    }, [userId]);

    /**
     * Load chat history from DynamoDB
     */
    const loadChatHistory = useCallback(async (limit = 50) => {
        if (!meetingId) return;

        setIsLoadingHistory(true);
        setError(null);

        try {
            const history = await getChatHistory(meetingId, limit);

            if (history && Array.isArray(history)) {
                const formattedMessages = history.map(msg => ({
                    messageId: msg.messageId,
                    type: 'chat',
                    meetingId: msg.meetingId,
                    sender: {
                        userId: msg.userId,
                        userName: msg.userName
                    },
                    text: msg.message,
                    timestamp: new Date(msg.timestamp).getTime(),
                    fromSelf: msg.userId === userId,
                    status: 'received',
                    saved: true
                }));

                // Sort by timestamp (oldest first)
                formattedMessages.sort((a, b) => a.timestamp - b.timestamp);

                setMessages(formattedMessages);
            }

            setIsLoadingHistory(false);
            return history;

        } catch (err) {
            console.error('Error loading chat history:', err);
            setError('Failed to load chat history');
            setIsLoadingHistory(false);
            return null;
        }
    }, [meetingId, userId, getChatHistory]);

    /**
     * Send typing indicator
     */
    const sendTypingIndicator = useCallback((isTypingNow) => {
        if (!webSocket?.isConnected) return;

        webSocket.broadcastToMeeting('event', {
            eventType: isTypingNow ? 'typing_start' : 'typing_stop',
            userId,
            userName,
            meetingId,
            timestamp: Date.now()
        });
    }, [webSocket, meetingId, userId, userName]);

    /**
     * Handle typing indicator from others
     */
    const handleTypingIndicator = useCallback((event) => {
        if (event.userId === userId) return; // Ignore own typing

        const typingUserId = event.userId;

        if (event.eventType === 'typing_start') {
            setIsTyping(prev => ({ ...prev, [typingUserId]: event.userName }));

            // Clear after 3 seconds
            if (typingTimeoutRef.current[typingUserId]) {
                clearTimeout(typingTimeoutRef.current[typingUserId]);
            }

            typingTimeoutRef.current[typingUserId] = setTimeout(() => {
                setIsTyping(prev => {
                    const newState = { ...prev };
                    delete newState[typingUserId];
                    return newState;
                });
            }, 3000);

        } else if (event.eventType === 'typing_stop') {
            setIsTyping(prev => {
                const newState = { ...prev };
                delete newState[typingUserId];
                return newState;
            });

            if (typingTimeoutRef.current[typingUserId]) {
                clearTimeout(typingTimeoutRef.current[typingUserId]);
                delete typingTimeoutRef.current[typingUserId];
            }
        }
    }, [userId]);

    /**
     * Clear unread count
     */
    const clearUnreadCount = useCallback(() => {
        setUnreadCount(0);
    }, []);

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    /**
     * Delete a message (soft delete)
     */
    const deleteMessage = useCallback((messageId) => {
        setMessages(prev => prev.map(msg =>
            msg.messageId === messageId
                ? { ...msg, deleted: true, text: 'Message deleted' }
                : msg
        ));
    }, []);

    /**
     * Clear all messages
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        setUnreadCount(0);
    }, []);

    // Setup WebSocket message listener
    useEffect(() => {
        if (!webSocket) return;

        const handleWebSocketMessage = (msg) => {
            if (msg.type === 'chat') {
                handleIncomingMessage(msg);
            } else if (msg.type === 'event') {
                if (msg.eventType === 'typing_start' || msg.eventType === 'typing_stop') {
                    handleTypingIndicator(msg);
                }
            }
        };

        // Assuming webSocket has an event emitter or callback system
        // Adjust based on your actual WebSocket implementation
        const originalOnMessage = webSocket.onMessage;
        webSocket.onMessage = (msg) => {
            originalOnMessage?.(msg);
            handleWebSocketMessage(msg);
        };

        return () => {
            webSocket.onMessage = originalOnMessage;
        };
    }, [webSocket, handleIncomingMessage, handleTypingIndicator]);

    // Load chat history on mount
    useEffect(() => {
        if (meetingId) {
            loadChatHistory();
        }
    }, [meetingId, loadChatHistory]);

    // Clear unread count when tab is focused
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                clearUnreadCount();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [clearUnreadCount]);

    // Cleanup typing timeouts
    useEffect(() => {
        return () => {
            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        };
    }, []);

    return {
        messages,
        sendMessage,
        loadChatHistory,
        deleteMessage,
        clearMessages,
        sendTypingIndicator,
        isTyping,
        unreadCount,
        clearUnreadCount,
        error,
        isLoadingHistory,
        messagesEndRef,
        scrollToBottom
    };
};

/**
 * Get typing indicator text
 */
export const getTypingIndicatorText = (isTyping) => {
    const typingUsers = Object.values(isTyping);

    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return `${typingUsers.length} people are typing...`;
};

export default useMeetingChat;
