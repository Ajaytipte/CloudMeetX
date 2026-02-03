/**
 * CloudMeetX - Complete Meeting Room with WebRTC
 * 
 * Implements the full CloudMeetX flow:
 * 1. User creates/joins meeting
 * 2. WebSocket connects
 * 3. User A sends offer to WebSocket
 * 4. WebSocket sends to User B
 * 5. User B sends answer
 * 6. ICE candidates exchanged
 * 7. Media stream established
 * 8. Chat and file sharing continue over WebSocket/S3
 */

import { useState, useEffect, useRef } from 'react';
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    MessageCircle,
    Users,
    Monitor,
    MonitorOff
} from 'lucide-react';
import useWebSocket from '../hooks/useWebSocket';
import useWebRTC from '../hooks/useWebRTC';
import MeetingChatPanel from '../components/MeetingChatPanel';

const CompleteMeetingRoom = ({ meetingId, userId, userName, onLeave }) => {
    // Media state
    const [localStream, setLocalStream] = useState(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // UI state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [participants, setParticipants] = useState([]);

    const localVideoRef = useRef(null);

    // Step 1 & 2: Connect to WebSocket
    const webSocket = useWebSocket(
        import.meta.env.VITE_WEBSOCKET_URL,
        {
            meetingId,
            userId,
            userName,
            onMessage: (message) => {
                console.log('WebSocket message:', message);

                // Handle different message types
                if (message.type === 'participant-joined') {
                    console.log('New participant joined:', message.userName);
                    handleParticipantJoined(message.userId, message.userName);
                } else if (message.type === 'participant-left') {
                    console.log('Participant left:', message.userName);
                    handleParticipantLeft(message.userId);
                }
            },
            onConnect: () => {
                console.log('✅ WebSocket connected to meeting:', meetingId);
                // Get current participants
                requestParticipantList();
            },
            onDisconnect: () => {
                console.log('❌ WebSocket disconnected');
            }
        }
    );

    // Steps 3-7: WebRTC peer connections
    const {
        peers,
        connectToPeer,
        disconnectFromPeer,
        disconnectAll,
        toggleAudio: toggleWebRTCAudio,
        toggleVideo: toggleWebRTCVideo,
        isConnecting,
        error: webrtcError
    } = useWebRTC(webSocket, userId, userName, localStream);

    /**
     * Initialize local media stream
     */
    const initializeMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            setLocalStream(stream);

            // Attach to video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            console.log('✅ Local media stream initialized');

        } catch (err) {
            console.error('❌ Error accessing media devices:', err);
            alert(`Failed to access camera/microphone: ${err.message}`);
        }
    };

    /**
     * Request list of current participants
     */
    const requestParticipantList = () => {
        if (webSocket?.isConnected) {
            webSocket.broadcastToMeeting('event', {
                eventType: 'request-participants',
                userId,
                userName
            });
        }
    };

    /**
     * Handle new participant joining
     * Step 3: User A sends offer to new participant
     */
    const handleParticipantJoined = (newUserId, newUserName) => {
        if (newUserId === userId) return; // Ignore self

        setParticipants(prev => {
            if (prev.some(p => p.userId === newUserId)) return prev;
            return [...prev, { userId: newUserId, userName: newUserName }];
        });

        // If we're already in the meeting, connect to the new participant
        // This initiates Steps 3-6: offer → answer → ICE exchange
        if (localStream) {
            console.log(`🔗 Connecting to new participant: ${newUserName}`);
            connectToPeer(newUserId, newUserName);
        }
    };

    /**
     * Handle participant leaving
     */
    const handleParticipantLeft = (leftUserId) => {
        setParticipants(prev => prev.filter(p => p.userId !== leftUserId));
        disconnectFromPeer(leftUserId);
    };

    /**
     * Toggle video
     */
    const toggleVideo = () => {
        const newState = !isVideoEnabled;
        setIsVideoEnabled(newState);
        toggleWebRTCVideo(newState);

        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = newState;
            });
        }
    };

    /**
     * Toggle audio
     */
    const toggleAudio = () => {
        const newState = !isAudioEnabled;
        setIsAudioEnabled(newState);
        toggleWebRTCAudio(newState);

        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = newState;
            });
        }
    };

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: true
                });

                // Replace video track in all peer connections
                const videoTrack = screenStream.getVideoTracks()[0];

                Object.values(peers).forEach(peer => {
                    const sender = peer.connection
                        .getSenders()
                        .find(s => s.track?.kind === 'video');

                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });

                // Update local video
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                setIsScreenSharing(true);

                // Handle screen share stop
                videoTrack.onended = () => {
                    stopScreenShare();
                };

            } else {
                stopScreenShare();
            }

        } catch (err) {
            console.error('Error toggling screen share:', err);
        }
    };

    /**
     * Stop screen sharing
     */
    const stopScreenShare = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];

            Object.values(peers).forEach(peer => {
                const sender = peer.connection
                    .getSenders()
                    .find(s => s.track?.kind === 'video');

                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });

            // Restore local video
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
        }

        setIsScreenSharing(false);
    };

    /**
     * Leave meeting
     */
    const leaveMeeting = () => {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Disconnect from all peers
        disconnectAll();

        // Notify others
        if (webSocket?.isConnected) {
            webSocket.broadcastToMeeting('event', {
                eventType: 'participant-left',
                userId,
                userName
            });
        }

        // Call parent callback
        onLeave?.();
    };

    // Initialize media stream on mount
    useEffect(() => {
        initializeMediaStream();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Connect to existing participants when local stream is ready
    useEffect(() => {
        if (localStream && participants.length > 0) {
            participants.forEach(participant => {
                if (!peers[participant.userId]) {
                    connectToPeer(participant.userId, participant.userName);
                }
            });
        }
    }, [localStream, participants, peers, connectToPeer]);

    return (
        <div className="complete-meeting-room">
            {/* Main Content */}
            <div className={`meeting-main ${isChatOpen ? 'with-sidebar' : ''}`}>
                {/* Video Grid */}
                <div className="video-grid">
                    {/* Local Video (Step 7: Media stream established) */}
                    <div className="video-tile">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="participant-video"
                        />
                        <div className="video-overlay">
                            <span className="participant-name">{userName} (You)</span>
                            {!isVideoEnabled && (
                                <div className="video-off-indicator">
                                    <VideoOff className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remote Videos (Step 7: Media streams from peers) */}
                    {Object.entries(peers).map(([peerId, peer]) => (
                        <div key={peerId} className="video-tile">
                            <video
                                autoPlay
                                playsInline
                                ref={(el) => {
                                    if (el && peer.stream) {
                                        el.srcObject = peer.stream;
                                    }
                                }}
                                className="participant-video"
                            />
                            <div className="video-overlay">
                                <span className="participant-name">{peer.userName}</span>
                            </div>
                        </div>
                    ))}

                    {/* Connecting indicator */}
                    {isConnecting && (
                        <div className="connecting-indicator">
                            <div className="spinner"></div>
                            <p>Connecting...</p>
                        </div>
                    )}
                </div>

                {/* Meeting Controls */}
                <div className="meeting-controls">
                    <button
                        onClick={toggleAudio}
                        className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
                        title={isAudioEnabled ? 'Mute' : 'Unmute'}
                    >
                        {isAudioEnabled ? <Mic /> : <MicOff />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
                        title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
                    >
                        {isVideoEnabled ? <Video /> : <VideoOff />}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`control-btn ${isScreenSharing ? 'active' : ''}`}
                        title="Share Screen"
                    >
                        {isScreenSharing ? <MonitorOff /> : <Monitor />}
                    </button>

                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="control-btn"
                        title="Chat"
                    >
                        <MessageCircle />
                    </button>

                    <button
                        onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                        className="control-btn"
                        title="Participants"
                    >
                        <Users />
                        <span className="participant-count">{Object.keys(peers).length + 1}</span>
                    </button>

                    <button
                        onClick={leaveMeeting}
                        className="control-btn leave-btn"
                        title="Leave Meeting"
                    >
                        <PhoneOff />
                    </button>
                </div>

                {/* Connection Status */}
                {!webSocket?.isConnected && (
                    <div className="connection-banner">
                        Reconnecting to meeting...
                    </div>
                )}

                {/* WebRTC Error */}
                {webrtcError && (
                    <div className="error-banner">
                        {webrtcError}
                    </div>
                )}
            </div>

            {/* Step 8: Chat continues over WebSocket */}
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

            {/* Participants Panel */}
            {isParticipantsOpen && (
                <div className="participants-panel">
                    <div className="panel-header">
                        <h3>Participants ({Object.keys(peers).length + 1})</h3>
                        <button onClick={() => setIsParticipantsOpen(false)}>×</button>
                    </div>
                    <div className="participants-list">
                        <div className="participant-item">
                            <div className="participant-avatar">{userName[0]}</div>
                            <span>{userName} (You)</span>
                        </div>
                        {Object.entries(peers).map(([peerId, peer]) => (
                            <div key={peerId} className="participant-item">
                                <div className="participant-avatar">{peer.userName[0]}</div>
                                <span>{peer.userName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
        .complete-meeting-room {
          display: flex;
          height: 100vh;
          background: #1a1a1a;
          overflow: hidden;
        }

        .meeting-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .meeting-main.with-sidebar {
          flex: 0 0 70%;
        }

        .video-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 12px;
          padding: 12px;
          overflow-y: auto;
        }

        .video-tile {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 16/9;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .participant-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          padding: 16px;
        }

        .participant-name {
          color: white;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .video-off-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
        }

        .connecting-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .meeting-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: rgba(0,0,0,0.9);
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255,255,255,0.15);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .control-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: scale(1.1);
        }

        .control-btn.disabled {
          background: #ef4444;
        }

        .control-btn.active {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }

        .leave-btn {
          background: #ef4444;
        }

        .leave-btn:hover {
          background: #dc2626;
        }

        .participant-count {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .connection-banner, .error-banner {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10;
        }

        .connection-banner {
          background: #fbbf24;
          color: #78350f;
        }

        .error-banner {
          background: #ef4444;
          color: white;
        }

        .chat-sidebar {
          flex: 0 0 30%;
          min-width: 320px;
          max-width: 400px;
          background: white;
        }

        .participants-panel {
          position: absolute;
          top: 80px;
          right: 20px;
          width: 300px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 20;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }

        .participants-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .participant-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .participant-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .complete-meeting-room {
            flex-direction: column;
          }

          .meeting-main.with-sidebar {
            flex: 1;
          }

          .chat-sidebar {
            flex: 0 0 40%;
            max-width: none;
          }

          .video-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default CompleteMeetingRoom;
