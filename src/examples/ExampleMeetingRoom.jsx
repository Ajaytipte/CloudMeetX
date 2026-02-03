/**
 * Example: Using CloudMeetX WebSocket in a React component
 */

import { useState, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { Send, Users, Video } from 'lucide-react';

const WEBSOCKET_URL = 'wss://your-api-id.execute-api.ap-south-1.amazonaws.com/production';

const ExampleMeetingRoom = ({ meetingId, userId, userName }) => {
    const [messages, setMessages] = useState([]);
    const [chatMessage, setChatMessage] = useState('');
    const [participants, setParticipants] = useState([]);

    // Handle incoming WebSocket messages
    const handleMessage = useCallback((message) => {
        console.log('Received message:', message);

        switch (message.type) {
            case 'chat':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    from: message.from.userName,
                    text: message.data.text,
                    timestamp: message.timestamp
                }]);
                break;

            case 'signal':
                // Handle WebRTC signaling
                console.log('WebRTC signal received:', message.data);
                // Handle offer, answer, ice candidates, etc.
                break;

            case 'event':
                // Handle meeting events
                if (message.data.eventType === 'user-joined') {
                    setParticipants(prev => [...prev, {
                        userId: message.data.userId,
                        userName: message.data.userName
                    }]);
                }
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }, []);

    // Initialize WebSocket connection
    const {
        isConnected,
        error,
        reconnectCount,
        sendToUser,
        broadcastToMeeting,
        disconnect
    } = useWebSocket(WEBSOCKET_URL, {
        meetingId,
        userId,
        userName,
        onMessage: handleMessage,
        onConnect: () => {
            console.log('Connected to meeting!');
            // Announce joining
            broadcastToMeeting('event', {
                eventType: 'user-joined',
                userId,
                userName
            });
        },
        onDisconnect: () => {
            console.log('Disconnected from meeting');
        },
        onError: (err) => {
            console.error('WebSocket error:', err);
        }
    });

    // Send chat message
    const handleSendChat = () => {
        if (chatMessage.trim() && isConnected) {
            broadcastToMeeting('chat', {
                text: chatMessage,
                timestamp: new Date().toISOString()
            });

            // Add to local messages
            setMessages(prev => [...prev, {
                id: Date.now(),
                from: 'You',
                text: chatMessage,
                timestamp: new Date().toISOString()
            }]);

            setChatMessage('');
        }
    };

    // Send WebRTC signal to specific user
    const sendSignal = (targetUserId, signalData) => {
        sendToUser(targetUserId, 'signal', signalData);
    };

    return (
        <div className="meeting-room">
            {/* Connection Status */}
            <div className="status-bar">
                {isConnected ? (
                    <span className="text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                        Connected
                    </span>
                ) : (
                    <span className="text-red-600 flex items-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                        {error || `Reconnecting... (${reconnectCount})`}
                    </span>
                )}
            </div>

            {/* Participants */}
            <div className="participants">
                <h3 className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Participants ({participants.length + 1})
                </h3>
                <ul>
                    <li>{userName} (You)</li>
                    {participants.map(p => (
                        <li key={p.userId}>{p.userName}</li>
                    ))}
                </ul>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages">
                {messages.map(msg => (
                    <div key={msg.id} className="message">
                        <strong>{msg.from}:</strong> {msg.text}
                        <span className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chat Input */}
            <div className="chat-input">
                <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                />
                <button
                    onClick={handleSendChat}
                    disabled={!isConnected || !chatMessage.trim()}
                    className="btn-primary"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {/* Leave Meeting */}
            <button
                onClick={() => {
                    broadcastToMeeting('event', {
                        eventType: 'user-left',
                        userId,
                        userName
                    });
                    disconnect();
                }}
                className="btn-danger"
            >
                Leave Meeting
            </button>
        </div>
    );
};

export default ExampleMeetingRoom;
