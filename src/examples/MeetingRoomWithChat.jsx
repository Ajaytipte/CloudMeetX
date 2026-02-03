/**
 * Example: Meeting Room with Integrated Chat
 * 
 * Complete meeting room component with video and chat
 */

import { useState, useEffect } from 'react';
import { MessageCircle, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import useWebSocket from '../hooks/useWebSocket';
import MeetingChatPanel from '../components/MeetingChatPanel';

const MeetingRoomWithChat = ({ meetingId, userId, userName }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

    // WebSocket connection for signaling AND chat
    const webSocket = useWebSocket(
        import.meta.env.VITE_WEBSOCKET_URL,
        {
            meetingId,
            userId,
            userName,
            onMessage: (message) => {
                console.log('WebSocket message:', message);

                // Handle different message types
                switch (message.type) {
                    case 'chat':
                        // Chat messages handled by useMeetingChat hook
                        console.log('Chat message:', message.text);
                        break;

                    case 'signal':
                        // WebRTC signaling
                        console.log('WebRTC signal:', message.data);
                        handleWebRTCSignal(message.data);
                        break;

                    case 'event':
                        // Meeting events
                        console.log('Meeting event:', message.eventType);
                        break;

                    default:
                        console.log('Unknown message type:', message.type);
                }
            },
            onConnect: () => {
                console.log('Connected to meeting:', meetingId);
            },
            onDisconnect: () => {
                console.log('Disconnected from meeting');
            }
        }
    );

    const handleWebRTCSignal = (data) => {
        // Handle WebRTC signaling (offer, answer, ICE candidates)
        // Implementation depends on your WebRTC setup
        console.log('Handle WebRTC signal:', data);
    };

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const toggleVideo = () => {
        setVideoEnabled(!videoEnabled);
        // Add logic to enable/disable video track
    };

    const toggleAudio = () => {
        setAudioEnabled(!audioEnabled);
        // Add logic to enable/disable audio track
    };

    return (
        <div className="meeting-room">
            {/* Main Content */}
            <div className={`meeting-content ${isChatOpen ? 'with-chat' : ''}`}>
                {/* Video Grid */}
                <div className="video-grid">
                    <div className="video-container">
                        <video className="participant-video" autoPlay playsInline />
                        <div className="participant-name">{userName} (You)</div>
                    </div>

                    {/* Other participants will be rendered here */}
                </div>

                {/* Meeting Controls */}
                <div className="meeting-controls">
                    <button
                        onClick={toggleAudio}
                        className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
                    >
                        {audioEnabled ? <Mic /> : <MicOff />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
                    >
                        {videoEnabled ? <Video /> : <VideoOff />}
                    </button>

                    <button
                        onClick={toggleChat}
                        className="control-btn chat-toggle"
                    >
                        <MessageCircle />
                        Chat
                    </button>

                    <button className="control-btn leave-btn">
                        Leave Meeting
                    </button>
                </div>

                {/* Connection Status */}
                {!webSocket.isConnected && (
                    <div className="connection-status">
                        <span>Reconnecting...</span>
                    </div>
                )}
            </div>

            {/* Chat Panel */}
            {isChatOpen && (
                <div className="chat-sidebar">
                    <MeetingChatPanel
                        webSocket={webSocket}
                        meetingId={meetingId}
                        userId={userId}
                        userName={userName}
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                    />
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
        .meeting-room {
          display: flex;
          height: 100vh;
          background: #1a1a1a;
        }

        .meeting-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .meeting-content.with-chat {
          flex: 0 0 70%;
        }

        .video-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          padding: 16px;
          overflow-y: auto;
        }

        .video-container {
          position: relative;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 16/9;
        }

        .participant-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .participant-name {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
        }

        .meeting-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: rgba(0, 0, 0, 0.8);
        }

        .control-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .control-btn.disabled {
          background: #ef4444;
        }

        .chat-toggle {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }

        .leave-btn {
          background: #ef4444;
        }

        .leave-btn:hover {
          background: #dc2626;
        }

        .connection-status {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: #fbbf24;
          color: #78350f;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .chat-sidebar {
          flex: 0 0 30%;
          min-width: 320px;
          max-width: 400px;
          background: white;
          border-left: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .meeting-room {
            flex-direction: column;
          }

          .meeting-content.with-chat {
            flex: 1;
          }

          .chat-sidebar {
            flex: 0 0 50%;
            max-width: none;
            border-left: none;
            border-top: 1px solid #e5e7eb;
          }
        }
      `}</style>
        </div>
    );
};

export default MeetingRoomWithChat;
