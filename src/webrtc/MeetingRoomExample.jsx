/**
 * Example: Using useWebRTC Hook in MeetingRoom Component
 * 
 * This example shows how to integrate the WebRTC functionality
 * into your CloudMeetX meeting room.
 */

import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useWebRTC from '../webrtc/useWebRTC';

const MeetingRoomWithWebRTC = () => {
    const { meetingId } = useParams();
    const userId = 'user-' + Math.random().toString(36).substr(2, 9);

    // AWS API Gateway WebSocket URL
    // Replace with your actual WebSocket URL from AWS
    const SIGNALING_URL = import.meta.env.VITE_WEBSOCKET_URL ||
        'wss://your-api-id.execute-api.region.amazonaws.com/production';

    // Use WebRTC hook
    const {
        localStream,
        remoteStreams,
        participants,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        connectionState,
        error,
        toggleMicrophone,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        leaveMeeting
    } = useWebRTC(meetingId, userId, SIGNALING_URL);

    // Refs for video elements
    const localVideoRef = useRef(null);

    // Set local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="meeting-room">
            {/* Connection Status */}
            {connectionState === 'connecting' && (
                <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Connecting...
                </div>
            )}

            {connectionState === 'failed' && (
                <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg">
                    Connection Failed
                </div>
            )}

            {error && (
                <div className="fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg">
                    {error}
                </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-xl overflow-hidden">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 text-white font-semibold">
                        You {isAudioEnabled ? '' : '(Muted)'}
                    </div>
                </div>

                {/* Remote Videos */}
                {remoteStreams.map(({ userId, stream }) => (
                    <RemoteVideo
                        key={userId}
                        userId={userId}
                        stream={stream}
                        participant={participants.find(p => p.userId === userId)}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
                <div className="flex justify-center space-x-4">
                    {/* Microphone */}
                    <button
                        onClick={toggleMicrophone}
                        className={`p-4 rounded-xl ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'
                            }`}
                    >
                        {isAudioEnabled ? '🎤' : '🔇'}
                    </button>

                    {/* Camera */}
                    <button
                        onClick={toggleCamera}
                        className={`p-4 rounded-xl ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'
                            }`}
                    >
                        {isVideoEnabled ? '📹' : '📹❌'}
                    </button>

                    {/* Screen Share */}
                    <button
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        className={`p-4 rounded-xl ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'
                            }`}
                    >
                        🖥️
                    </button>

                    {/* Leave */}
                    <button
                        onClick={leaveMeeting}
                        className="p-4 rounded-xl bg-red-600"
                    >
                        📞 Leave
                    </button>
                </div>
            </div>

            {/* Participants Info */}
            <div className="fixed top-4 left-4 bg-gray-800 text-white p-4 rounded-lg">
                <div className="font-semibold mb-2">
                    Participants: {participants.length + 1}
                </div>
                <div className="space-y-1">
                    <div>You (Host)</div>
                    {participants.map(p => (
                        <div key={p.userId}>
                            {p.userId.substring(0, 8)}...
                            {p.isScreenSharing && ' 🖥️'}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Remote Video Component
const RemoteVideo = ({ userId, stream, participant }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative bg-gray-800 rounded-xl overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 text-white font-semibold">
                {userId.substring(0, 8)}...
                {participant?.isScreenSharing && ' 🖥️'}
                {!participant?.hasAudio && ' (Muted)'}
            </div>
        </div>
    );
};

export default MeetingRoomWithWebRTC;
