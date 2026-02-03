/**
 * CloudMeetX - Meeting Chat Component
 * 
 * In-meeting chat panel with real-time messaging
 */

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Smile,
    Paperclip,
    X,
    MessageCircle,
    ChevronDown
} from 'lucide-react';
import { useMeetingChat, getTypingIndicatorText } from '../hooks/useMeetingChat';

const MeetingChatPanel = ({
    webSocket,
    meetingId,
    userId,
    userName,
    isOpen = false,
    onClose = null
}) => {
    const [messageText, setMessageText] = useState('');
    const [isTypingNow, setIsTypingNow] = useState(false);
    const inputRef = useRef(null);
    const typingTimerRef = useRef(null);

    const {
        messages,
        sendMessage,
        isTyping,
        unreadCount,
        clearUnreadCount,
        sendTypingIndicator,
        error,
        isLoadingHistory,
        messagesEndRef,
        scrollToBottom
    } = useMeetingChat(webSocket, meetingId, userId, userName);

    // Handle message send
    const handleSendMessage = async (e) => {
        e?.preventDefault();

        if (!messageText.trim()) return;

        const success = await sendMessage(messageText);

        if (success) {
            setMessageText('');
            setIsTypingNow(false);
            sendTypingIndicator(false);

            // Focus input
            inputRef.current?.focus();

            // Scroll to bottom
            setTimeout(scrollToBottom, 100);
        }
    };

    // Handle input change with typing indicator
    const handleInputChange = (e) => {
        const value = e.target.value;
        setMessageText(value);

        // Send typing indicator
        if (value.trim() && !isTypingNow) {
            setIsTypingNow(true);
            sendTypingIndicator(true);
        }

        // Clear existing timer
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimerRef.current = setTimeout(() => {
            if (isTypingNow) {
                setIsTypingNow(false);
                sendTypingIndicator(false);
            }
        }, 2000);
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Clear unread when panel opens
    useEffect(() => {
        if (isOpen) {
            clearUnreadCount();
        }
    }, [isOpen, clearUnreadCount]);

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = new Date(message.timestamp).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    return (
        <div className="meeting-chat-panel">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-title">
                    <MessageCircle className="w-5 h-5" />
                    <h3>Chat</h3>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount}</span>
                    )}
                </div>
                {onClose && (
                    <button onClick={onClose} className="close-btn">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="chat-error">
                    <span>{error}</span>
                </div>
            )}

            {/* Messages Container */}
            <div className="messages-container">
                {isLoadingHistory ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <MessageCircle className="w-12 h-12 text-gray-300" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    <>
                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date} className="message-group">
                                {/* Date Divider */}
                                <div className="date-divider">
                                    <span>{new Date(date).toLocaleDateString([], {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</span>
                                </div>

                                {/* Messages */}
                                {msgs.map((message, index) => (
                                    <div
                                        key={message.messageId || index}
                                        className={`message ${message.fromSelf ? 'message-self' : 'message-other'}`}
                                    >
                                        {!message.fromSelf && (
                                            <div className="message-sender">{message.sender?.userName || 'Unknown'}</div>
                                        )}
                                        <div className="message-content">
                                            {message.deleted ? (
                                                <span className="message-deleted">{message.text}</span>
                                            ) : (
                                                <p>{message.text}</p>
                                            )}
                                            <div className="message-footer">
                                                <span className="message-time">{formatTime(message.timestamp)}</span>
                                                {message.fromSelf && (
                                                    <span className={`message-status status-${message.status}`}>
                                                        {message.status === 'sending' && '○'}
                                                        {message.status === 'sent' && '✓'}
                                                        {message.status === 'failed' && '✗'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Typing Indicator */}
            {Object.keys(isTyping).length > 0 && (
                <div className="typing-indicator">
                    <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span className="typing-text">{getTypingIndicatorText(isTyping)}</span>
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-container">
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <textarea
                        ref={inputRef}
                        value={messageText}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="chat-input"
                        rows="1"
                        disabled={!webSocket?.isConnected}
                    />
                    <div className="input-actions">
                        <button
                            type="submit"
                            disabled={!messageText.trim() || !webSocket?.isConnected}
                            className="send-btn"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>

                {!webSocket?.isConnected && (
                    <div className="connection-warning">
                        Not connected. Reconnecting...
                    </div>
                )}
            </div>

            {/* Styles */}
            <style jsx>{`
        .meeting-chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .unread-badge {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .chat-error {
          background: #fee;
          color: #c00;
          padding: 12px;
          text-align: center;
          font-size: 14px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f9fafb;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9ca3af;
          gap: 12px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .message-group {
          margin-bottom: 24px;
        }

        .date-divider {
          text-align: center;
          margin: 16px 0;
        }

        .date-divider span {
          background: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          color: #6b7280;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .message {
          margin-bottom: 12px;
          max-width: 80%;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-self {
          margin-left: auto;
        }

        .message-other {
          margin-right: auto;
        }

        .message-sender {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .message-content {
          background: white;
          padding: 10px 14px;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .message-self .message-content {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }

        .message-content p {
          margin: 0;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .message-deleted {
          font-style: italic;
          color: #9ca3af;
        }

        .message-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 4px;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
        }

        .message-status {
          font-size: 12px;
        }

        .status-sending {
          opacity: 0.5;
        }

        .status-failed {
          color: #ef4444;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f3f4f6;
          border-top: 1px solid #e5e7eb;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .typing-text {
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
        }

        .chat-input-container {
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .chat-input-form {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px;
        }

        .chat-input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          resize: none;
          max-height: 120px;
          font-family: inherit;
        }

        .chat-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .chat-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .input-actions {
          display: flex;
          gap: 8px;
        }

        .send-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .connection-warning {
          padding: 8px 12px;
          background: #fef3c7;
          color: #92400e;
          font-size: 13px;
          text-align: center;
        }
      `}</style>
        </div>
    );
};

export default MeetingChatPanel;
