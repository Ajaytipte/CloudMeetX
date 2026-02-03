/**
 * useWebRTC Hook
 * Main WebRTC hook for CloudMeetX
 * Handles peer connections, signaling, and media streams
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import SignalingClient from './signaling';
import {
    getUserMedia,
    getDisplayMedia,
    toggleAudio,
    toggleVideo,
    stopStream,
    replaceVideoTrack,
    checkWebRTCSupport
} from './media';

// STUN/TURN server configuration
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add your TURN server here
        // {
        //   urls: 'turn:your-turn-server.com:3478',
        //   username: 'username',
        //   credential: 'password'
        // }
    ]
};

const useWebRTC = (meetingId, userId) => {
    // State
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [participants, setParticipants] = useState(new Map());
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [error, setError] = useState(null);

    // Refs
    const signalingClient = useRef(null);
    const peerConnections = useRef(new Map());
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);

    // Initialize WebRTC
    useEffect(() => {
        const support = checkWebRTCSupport();
        if (!support.supported) {
            setError('WebRTC is not supported in this browser');
            return;
        }

        initializeWebRTC();

        return () => {
            cleanup();
        };
    }, [meetingId, userId]);

    // Initialize WebRTC connection
    const initializeWebRTC = async () => {
        try {
            setConnectionState('connecting');

            // Get local media stream
            const stream = await getUserMedia();
            setLocalStream(stream);
            localStreamRef.current = stream;

            // Initialize signaling
            signalingClient.current = new SignalingClient(
                meetingId,
                userId
            );

            // Register signaling handlers
            registerSignalingHandlers();

            // Connect to signaling server
            await signalingClient.current.connect();

            setConnectionState('connected');
        } catch (err) {
            console.error('❌ Error initializing WebRTC:', err);
            setError(err.message);
            setConnectionState('failed');
        }
    };

    // Register signaling event handlers
    const registerSignalingHandlers = () => {
        const client = signalingClient.current;

        // User joined
        client.on('user-joined', async ({ userId: remoteUserId }) => {
            console.log('👋 User joined, creating offer for:', remoteUserId);
            await createPeerConnection(remoteUserId, true);
        });

        // User left
        client.on('user-left', ({ userId: remoteUserId }) => {
            console.log('👋 User left:', remoteUserId);
            removePeerConnection(remoteUserId);
        });

        // Received offer
        client.on('offer', async ({ userId: remoteUserId, offer }) => {
            console.log('📨 Received offer from:', remoteUserId);
            await handleOffer(remoteUserId, offer);
        });

        // Received answer
        client.on('answer', async ({ userId: remoteUserId, answer }) => {
            console.log('📨 Received answer from:', remoteUserId);
            await handleAnswer(remoteUserId, answer);
        });

        // Received ICE candidate
        client.on('ice-candidate', async ({ userId: remoteUserId, candidate }) => {
            console.log('📨 Received ICE candidate from:', remoteUserId);
            await handleIceCandidate(remoteUserId, candidate);
        });

        // Screen share started
        client.on('screen-share', ({ userId: remoteUserId, type }) => {
            if (type === 'started') {
                console.log('🖥️ User started screen sharing:', remoteUserId);
                updateParticipant(remoteUserId, { isScreenSharing: true });
            } else if (type === 'stopped') {
                console.log('🖥️ User stopped screen sharing:', remoteUserId);
                updateParticipant(remoteUserId, { isScreenSharing: false });
            }
        });

        // Connection failed
        client.on('connection-failed', () => {
            setError('Connection to signaling server failed');
            setConnectionState('failed');
        });
    };

    // Create peer connection
    const createPeerConnection = async (remoteUserId, createOffer = false) => {
        try {
            if (peerConnections.current.has(remoteUserId)) {
                console.log('⚠️ Peer connection already exists for:', remoteUserId);
                return peerConnections.current.get(remoteUserId);
            }

            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnections.current.set(remoteUserId, pc);

            // Add local stream tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current);
                });
            }

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    signalingClient.current.sendIceCandidate(remoteUserId, event.candidate);
                }
            };

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log('📺 Received remote track from:', remoteUserId);
                const [remoteStream] = event.streams;

                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.set(remoteUserId, remoteStream);
                    return newMap;
                });

                updateParticipant(remoteUserId, {
                    stream: remoteStream,
                    hasAudio: remoteStream.getAudioTracks().length > 0,
                    hasVideo: remoteStream.getVideoTracks().length > 0
                });
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`🔌 Connection state for ${remoteUserId}:`, pc.connectionState);

                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    removePeerConnection(remoteUserId);
                }
            };

            // Create offer if needed
            if (createOffer) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                signalingClient.current.sendOffer(remoteUserId, offer);
            }

            return pc;
        } catch (err) {
            console.error('❌ Error creating peer connection:', err);
            throw err;
        }
    };

    // Handle received offer
    const handleOffer = async (remoteUserId, offer) => {
        try {
            const pc = await createPeerConnection(remoteUserId, false);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            signalingClient.current.sendAnswer(remoteUserId, answer);
        } catch (err) {
            console.error('❌ Error handling offer:', err);
        }
    };

    // Handle received answer
    const handleAnswer = async (remoteUserId, answer) => {
        try {
            const pc = peerConnections.current.get(remoteUserId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (err) {
            console.error('❌ Error handling answer:', err);
        }
    };

    // Handle ICE candidate
    const handleIceCandidate = async (remoteUserId, candidate) => {
        try {
            const pc = peerConnections.current.get(remoteUserId);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (err) {
            console.error('❌ Error handling ICE candidate:', err);
        }
    };

    // Remove peer connection
    const removePeerConnection = (remoteUserId) => {
        const pc = peerConnections.current.get(remoteUserId);
        if (pc) {
            pc.close();
            peerConnections.current.delete(remoteUserId);
        }

        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(remoteUserId);
            return newMap;
        });

        setParticipants(prev => {
            const newMap = new Map(prev);
            newMap.delete(remoteUserId);
            return newMap;
        });
    };

    // Update participant info
    const updateParticipant = (userId, updates) => {
        setParticipants(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(userId) || {};
            newMap.set(userId, { ...existing, ...updates });
            return newMap;
        });
    };

    // Toggle microphone
    const toggleMicrophone = useCallback(() => {
        if (localStreamRef.current) {
            const enabled = !isAudioEnabled;
            toggleAudio(localStreamRef.current, enabled);
            setIsAudioEnabled(enabled);
            return enabled;
        }
        return isAudioEnabled;
    }, [isAudioEnabled]);

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const enabled = !isVideoEnabled;
            toggleVideo(localStreamRef.current, enabled);
            setIsVideoEnabled(enabled);
            return enabled;
        }
        return isVideoEnabled;
    }, [isVideoEnabled]);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await getDisplayMedia();
            screenStreamRef.current = stream;
            setScreenStream(stream);
            setIsScreenSharing(true);

            // Replace video track for all peer connections
            const videoTrack = stream.getVideoTracks()[0];
            peerConnections.current.forEach(pc => {
                replaceVideoTrack(pc, videoTrack);
            });

            // Notify others
            signalingClient.current.sendScreenShareStart();

            // Handle screen share stop
            videoTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error('❌ Error starting screen share:', err);
            setError('Failed to start screen sharing');
        }
    }, []);

    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            stopStream(screenStreamRef.current);
            screenStreamRef.current = null;
            setScreenStream(null);
            setIsScreenSharing(false);

            // Restore camera track
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                peerConnections.current.forEach(pc => {
                    replaceVideoTrack(pc, videoTrack);
                });
            }

            // Notify others
            signalingClient.current.sendScreenShareStop();
        }
    }, []);

    // Leave meeting
    const leaveMeeting = useCallback(() => {
        cleanup();
    }, []);

    // Cleanup
    const cleanup = () => {
        // Stop local streams
        if (localStreamRef.current) {
            stopStream(localStreamRef.current);
            localStreamRef.current = null;
        }

        if (screenStreamRef.current) {
            stopStream(screenStreamRef.current);
            screenStreamRef.current = null;
        }

        // Close all peer connections
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();

        // Disconnect signaling
        if (signalingClient.current) {
            signalingClient.current.disconnect();
            signalingClient.current = null;
        }

        // Reset state
        setLocalStream(null);
        setScreenStream(null);
        setRemoteStreams(new Map());
        setParticipants(new Map());
        setConnectionState('disconnected');
    };

    return {
        // Streams
        localStream,
        screenStream,
        remoteStreams: Array.from(remoteStreams.entries()).map(([userId, stream]) => ({
            userId,
            stream
        })),

        // Participants
        participants: Array.from(participants.entries()).map(([userId, info]) => ({
            userId,
            ...info
        })),

        // State
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        connectionState,
        error,

        // Actions
        toggleMicrophone,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        leaveMeeting
    };
};

export default useWebRTC;
