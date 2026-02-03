import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebRTC from '../webrtc/useWebRTC';
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    PhoneOff,
    MonitorUp,
    MessageSquare,
    Users,
    MoreVertical,
    Settings,
    Send,
    Paperclip,
    X,
    Circle,
    Hand,
    Grid3x3,
    Maximize2
} from 'lucide-react';

const MeetingRoom = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, sender: 'John Doe', message: 'Hey everyone!', time: '10:30 AM', isMe: true },
        { id: 2, sender: 'Jane Smith', message: 'Good morning!', time: '10:31 AM', isMe: false },
    ]);

    // WebRTC Integration
    const userId = useRef(`user-${Math.floor(Math.random() * 10000)}`).current; // Temporary ID
    const {
        localStream,
        remoteStreams,
        participants: rtcParticipants,
        toggleMicrophone,
        toggleCamera,
        leaveMeeting,
        isAudioEnabled,
        isVideoEnabled,
        connectionState
    } = useWebRTC(meetingId, userId);

    // Merge WebRTC participants with local UI state
    // In a real app, you'd merge this with user profile data
    const activeParticipants = [
        {
            id: 'local',
            name: 'You',
            isMuted: !isAudioEnabled,
            isVideoOff: !isVideoEnabled,
            isHost: true,
            stream: localStream
        },
        ...remoteStreams.map(p => ({
            id: p.userId,
            name: `User ${p.userId}`,
            isMuted: false, // You'd need signaling for this status
            isVideoOff: false,
            isHost: false,
            stream: p.stream
        }))
    ];

    // Handlers
    const handleLeaveMeeting = () => {
        if (confirm('Are you sure you want to leave this meeting?')) {
            leaveMeeting();
            navigate('/dashboard');
        }
    };

    const handleToggleMic = () => {
        toggleMicrophone();
        setIsMuted(!isMuted);
    };

    const handleToggleCamera = () => {
        toggleCamera();
        setIsVideoOff(!isVideoOff);
    };

    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            setMessages([
                ...messages,
                {
                    id: messages.length + 1,
                    sender: 'John Doe',
                    message: chatMessage,
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    isMe: true
                }
            ]);
            setChatMessage('');
        }
    };

    return (
        <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <VideoIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white font-semibold">CloudMeetX</span>
                        </div>
                        <div className="h-6 w-px bg-gray-700"></div>
                        <div>
                            <p className="text-sm text-gray-300">Meeting ID: <span className="text-white font-mono">{meetingId}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {isRecording && (
                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <Circle className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                                <span className="text-sm text-red-400 font-semibold">Recording</span>
                            </div>
                        )}
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                {/* Video Grid */}
                <div className={`p-4 grid gap-4 h-full overflow-y-auto ${remoteStreams.length === 0 ? 'grid-cols-1' :
                        remoteStreams.length === 1 ? 'grid-cols-1 md:grid-cols-2' :
                            remoteStreams.length <= 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' :
                                'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    }`}>

                    {/* Local Participant */}
                    <ParticipantVideo
                        stream={localStream}
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        name="You"
                        isLocal={true}
                    />

                    {/* Remote Participants */}
                    {remoteStreams.map((p) => (
                        <ParticipantVideo
                            key={p.userId}
                            stream={p.stream}
                            isMuted={false} // Would need connection metadata for this
                            isVideoOff={!p.stream?.getVideoTracks()[0]?.enabled}
                            name={`User ${p.userId}`} // Replace with actual name if available
                            isLocal={false}
                        />
                    ))}

                    {/* Show placeholder if waiting for others */}
                    {remoteStreams.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-800/50 text-gray-400">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <Users className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-xl font-medium mb-1">Waiting for others</h3>
                            <p className="text-sm opacity-60">Share the meeting link to invite participants</p>
                        </div>
                    )}
                </div>

                {/* Chat Panel */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col animate-slide-up">
                        <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-semibold flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Chat
                            </h3>
                            <button
                                onClick={() => setShowChat(false)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] ${msg.isMe ? 'order-2' : 'order-1'}`}>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-xs text-gray-400">{msg.sender}</span>
                                            <span className="text-xs text-gray-500">{msg.time}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg ${msg.isMe
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-100'
                                            }`}>
                                            <p className="text-sm">{msg.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-gray-900 border-t border-gray-700">
                            <div className="flex space-x-2">
                                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Participants Panel */}
                {showParticipants && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col animate-slide-up">
                        <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-semibold flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Participants ({activeParticipants.length})
                            </h3>
                            <button
                                onClick={() => setShowParticipants(false)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {activeParticipants.map((participant) => (
                                <div
                                    key={participant.id}
                                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {participant.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-semibold">{participant.name}</p>
                                            {participant.isHost && (
                                                <span className="text-xs text-blue-400">Host</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {participant.isMuted ? (
                                            <MicOff className="w-4 h-4 text-red-400" />
                                        ) : (
                                            <Mic className="w-4 h-4 text-green-400" />
                                        )}
                                        {participant.isVideoOff ? (
                                            <VideoOff className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <VideoIcon className="w-4 h-4 text-green-400" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Control Bar */}
            <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    {/* Left Controls */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleToggleMic}
                            className={`p-4 rounded-xl transition-all duration-200 ${isMuted
                                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            {isMuted ? (
                                <MicOff className="w-6 h-6 text-white" />
                            ) : (
                                <Mic className="w-6 h-6 text-white" />
                            )}
                        </button>

                        <button
                            onClick={handleToggleCamera}
                            className={`p-4 rounded-xl transition-all duration-200 ${isVideoOff
                                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            {isVideoOff ? (
                                <VideoOff className="w-6 h-6 text-white" />
                            ) : (
                                <VideoIcon className="w-6 h-6 text-white" />
                            )}
                        </button>

                        <div className="h-8 w-px bg-gray-700"></div>

                        <button
                            onClick={() => setIsScreenSharing(!isScreenSharing)}
                            className={`p-4 rounded-xl transition-all duration-200 ${isScreenSharing
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            <MonitorUp className="w-6 h-6 text-white" />
                        </button>

                        <button
                            onClick={() => setIsRecording(!isRecording)}
                            className={`p-4 rounded-xl transition-all duration-200 ${isRecording
                                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                            title="Start/Stop Recording"
                        >
                            <Circle className={`w-6 h-6 text-white ${isRecording ? 'fill-white' : ''}`} />
                        </button>
                    </div>

                    {/* Center Control - Leave Meeting */}
                    <button
                        onClick={handleLeaveMeeting}
                        className="btn-danger px-8 py-4 flex items-center space-x-2"
                    >
                        <PhoneOff className="w-6 h-6" />
                        <span className="font-semibold">Leave Meeting</span>
                    </button>

                    {/* Right Controls */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowParticipants(!showParticipants)}
                            className={`p-4 rounded-xl transition-all duration-200 ${showParticipants
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            <Users className="w-6 h-6 text-white" />
                        </button>

                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`relative p-4 rounded-xl transition-all duration-200 ${showChat
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            <MessageSquare className="w-6 h-6 text-white" />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                        </button>

                        <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-200">
                            <Hand className="w-6 h-6 text-white" />
                        </button>

                        <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-200">
                            <Grid3x3 className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for rendering video
const ParticipantVideo = ({ participant }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    return (
        <div className="relative bg-gray-800 rounded-xl overflow-hidden group aspect-video">
            {/* Video or Fallback */}
            {participant.isVideoOff || !participant.stream ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl font-bold text-white">
                                {participant.name.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <p className="text-white font-semibold">{participant.name}</p>
                        <p className="text-gray-500 text-sm mt-1">Video Off</p>
                    </div>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={participant.id === 'local'} // Mute local video to prevent echo
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror local video
                />
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold text-sm drop-shadow-md">
                            {participant.name} {participant.id === 'local' && '(You)'}
                        </span>
                        {participant.isMuted && (
                            <div className="bg-red-500/90 rounded-full p-1.5 backdrop-blur-sm">
                                <MicOff className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                    <button className="p-1.5 bg-black/40 hover:bg-black/60 rounded-lg transition-colors pointer-events-auto">
                        <MoreVertical className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-3 right-3 flex space-x-2">
                {participant.isHost && (
                    <span className="px-2 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-md shadow-sm">
                        Host
                    </span>
                )}
            </div>

            {/* Connection State (Debug) */}
            {participant.id === 'local' && (
                <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-green-400 text-xs font-mono rounded-md">
                        Signal: Active
                    </span>
                </div>
            )}
        </div>
    );
};

export default MeetingRoom;
