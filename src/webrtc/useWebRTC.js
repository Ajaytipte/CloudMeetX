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

            // 1. Get local media stream (Wait for user permission)
            let localStream;
            try {
                // Try video + audio first
                localStream = await getUserMedia();
            } catch (mediaError) {
                console.warn('⚠️ Failed to get video/audio, trying audio only:', mediaError);
                try {
                    // Fallback to audio only
                    localStream = await getUserMedia({ video: false, audio: true });
                } catch (audioError) {
                    console.error('❌ Failed to get any media stream:', audioError);
                    setError('Camera/Microphone access denied. Please check permissions.');
                    setConnectionState('failed');
                    return; // Stop initialization
                }
            }

            // 2. Set stream to state and ref ONLY after successfully acquiring it
            setLocalStream(localStream);
            localStreamRef.current = localStream;
            console.log('✅ Local stream initialized:', localStream.id);

            // 3. Initialize signaling
            signalingClient.current = new SignalingClient(
                meetingId,
                userId
            );

            // 4. Register signaling handlers
            registerSignalingHandlers();

            // 5. Connect to signaling server
            await signalingClient.current.connect();

            // 6. Send ready signal to notify others we're ready to receive offers
            signalingClient.current.sendReady();

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

        // Peer is ready - create offer for them
        client.on('ready', async ({ userId: remoteUserId }) => {
            console.log('📨 Peer ready, creating offer for:', remoteUserId);
            await createPeerConnection(remoteUserId, true);
        });

        // User joined (legacy support)
        client.on('user-joined', async ({ userId: remoteUserId }) => {
            console.log('👋 User joined:', remoteUserId);
            // Don't auto-create offer - wait for ready signal
            updateParticipant(remoteUserId, { status: 'joined' });
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

        // Received ICE candidate (using 'candidate' instead of 'ice-candidate')
        client.on('candidate', async ({ userId: remoteUserId, candidate }) => {
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
            // Check if connection already exists
            if (peerConnections.current.has(remoteUserId)) {
                console.log('⚠️ Peer connection already exists for:', remoteUserId);
                return peerConnections.current.get(remoteUserId);
            }

            // Ensure we have local stream before creating peer connection
            if (!localStreamRef.current) {
                console.error('❌ Cannot create peer connection: No local stream available');
                throw new Error('Local stream not initialized');
            }

            console.log(`🔗 Creating peer connection for ${remoteUserId} (offer: ${createOffer})`);

            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnections.current.set(remoteUserId, pc);

            // Add local stream tracks to peer connection
            localStreamRef.current.getTracks().forEach(track => {
                console.log(`➕ Adding ${track.kind} track to peer connection`);
                pc.addTrack(track, localStreamRef.current);
            });

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`🧊 ICE candidate for ${remoteUserId}`);
                    signalingClient.current.sendIceCandidate(remoteUserId, event.candidate);
                } else {
                    console.log(`✅ ICE gathering complete for ${remoteUserId}`);
                }
            };

            // Handle ICE connection state
            pc.oniceconnectionstatechange = () => {
                console.log(`🧊 ICE connection state for ${remoteUserId}:`, pc.iceConnectionState);
            };

            // Handle remote stream
            pc.ontrack = (event) => {
                console.log(`📺 Received remote ${event.track.kind} track from:`, remoteUserId);
                const [remoteStream] = event.streams;

                if (remoteStream) {
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
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`🔌 Connection state for ${remoteUserId}:`, pc.connectionState);

                if (pc.connectionState === 'connected') {
                    console.log(`✅ Successfully connected to ${remoteUserId}`);
                }

                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    console.log(`❌ Connection ${pc.connectionState} for ${remoteUserId}`);
                    removePeerConnection(remoteUserId);
                }
            };

            // Create and send offer if needed (host flow)
            if (createOffer) {
                try {
                    console.log(`📤 Creating offer for ${remoteUserId}...`);
                    const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });

                    await pc.setLocalDescription(offer);
                    console.log(`✅ Set local description (offer) for ${remoteUserId}`);

                    signalingClient.current.sendOffer(remoteUserId, offer);
                } catch (err) {
                    console.error(`❌ Error creating/sending offer to ${remoteUserId}:`, err);
                    throw err;
                }
            }

            return pc;
        } catch (err) {
            console.error('❌ Error creating peer connection:', err);
            // Clean up failed connection
            if (peerConnections.current.has(remoteUserId)) {
                peerConnections.current.get(remoteUserId)?.close();
                peerConnections.current.delete(remoteUserId);
            }
            throw err;
        }
    };

    // Handle received offer (guest flow)
    const handleOffer = async (remoteUserId, offer) => {
        try {
            console.log(`📥 Handling offer from ${remoteUserId}...`);

            // Create peer connection without creating an offer
            const pc = await createPeerConnection(remoteUserId, false);

            // Set remote description from received offer
            console.log(`📝 Setting remote description (offer) for ${remoteUserId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Create answer
            console.log(`📤 Creating answer for ${remoteUserId}...`);
            const answer = await pc.createAnswer();

            // Set local description with our answer
            await pc.setLocalDescription(answer);
            console.log(`✅ Set local description (answer) for ${remoteUserId}`);

            // Send answer back to the peer
            signalingClient.current.sendAnswer(remoteUserId, answer);
        } catch (err) {
            console.error(`❌ Error handling offer from ${remoteUserId}:`, err);
            // Clean up on error
            removePeerConnection(remoteUserId);
        }
    };

    // Handle received answer (host flow)
    const handleAnswer = async (remoteUserId, answer) => {
        try {
            console.log(`📥 Handling answer from ${remoteUserId}...`);

            const pc = peerConnections.current.get(remoteUserId);
            if (!pc) {
                console.error(`❌ No peer connection found for ${remoteUserId}`);
                return;
            }

            // Set remote description from received answer
            console.log(`📝 Setting remote description (answer) for ${remoteUserId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`✅ WebRTC handshake completed with ${remoteUserId}`);
        } catch (err) {
            console.error(`❌ Error handling answer from ${remoteUserId}:`, err);
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
