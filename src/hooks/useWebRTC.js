/**
 * CloudMeetX - WebRTC Hook
 * 
 * Handles WebRTC peer connections for video/audio streaming
 * Uses WebSocket for signaling (offer, answer, ICE candidates)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ]
};

/**
 * Hook for WebRTC peer-to-peer connections
 * 
 * @param {object} webSocket - WebSocket instance for signaling
 * @param {string} userId - Current user ID
 * @param {string} userName - Current user name
 * @param {MediaStream} localStream - Local media stream
 * @returns {object} WebRTC state and functions
 */
export const useWebRTC = (webSocket, userId, userName, localStream) => {
    const [peers, setPeers] = useState({}); // { userId: { connection, stream, userName } }
    const [error, setError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const peerConnectionsRef = useRef({});
    const pendingIceCandidatesRef = useRef({}); // Store ICE candidates for pending connections

    /**
     * Create a new peer connection
     */
    const createPeerConnection = useCallback((peerId, peerName, isInitiator = false) => {
        try {
            console.log(`Creating peer connection for ${peerName} (${peerId}), initiator:`, isInitiator);

            const peerConnection = new RTCPeerConnection(ICE_SERVERS);

            // Add local stream tracks to peer connection
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            }

            // Handle incoming remote stream
            peerConnection.ontrack = (event) => {
                console.log(`Received remote track from ${peerName}:`, event.streams[0]);

                setPeers(prev => ({
                    ...prev,
                    [peerId]: {
                        ...prev[peerId],
                        connection: peerConnection,
                        stream: event.streams[0],
                        userName: peerName
                    }
                }));
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`Sending ICE candidate to ${peerName}`);

                    webSocket.sendToUser({
                        type: 'signal',
                        signalType: 'ice-candidate',
                        candidate: event.candidate,
                        from: { userId, userName },
                        to: peerId
                    }, peerId);
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log(`Connection state for ${peerName}:`, peerConnection.connectionState);

                if (peerConnection.connectionState === 'disconnected' ||
                    peerConnection.connectionState === 'failed') {
                    handlePeerDisconnection(peerId);
                }
            };

            // Handle ICE connection state
            peerConnection.oniceconnectionstatechange = () => {
                console.log(`ICE state for ${peerName}:`, peerConnection.iceConnectionState);
            };

            peerConnectionsRef.current[peerId] = peerConnection;

            return peerConnection;

        } catch (err) {
            console.error('Error creating peer connection:', err);
            setError(`Failed to create connection: ${err.message}`);
            return null;
        }
    }, [webSocket, userId, userName, localStream]);

    /**
     * Create and send offer to peer
     */
    const createOffer = useCallback(async (peerId, peerName) => {
        try {
            console.log(`Creating offer for ${peerName} (${peerId})`);
            setIsConnecting(true);

            const peerConnection = createPeerConnection(peerId, peerName, true);
            if (!peerConnection) return;

            // Create offer
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await peerConnection.setLocalDescription(offer);

            // Send offer via WebSocket
            console.log(`Sending offer to ${peerName}`);
            webSocket.sendToUser({
                type: 'signal',
                signalType: 'offer',
                offer: offer,
                from: { userId, userName },
                to: peerId
            }, peerId);

            setIsConnecting(false);

        } catch (err) {
            console.error('Error creating offer:', err);
            setError(`Failed to create offer: ${err.message}`);
            setIsConnecting(false);
        }
    }, [createPeerConnection, webSocket, userId, userName]);

    /**
     * Handle incoming offer
     */
    const handleOffer = useCallback(async (offer, fromUserId, fromUserName) => {
        try {
            console.log(`Received offer from ${fromUserName} (${fromUserId})`);
            setIsConnecting(true);

            const peerConnection = createPeerConnection(fromUserId, fromUserName, false);
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Process any pending ICE candidates
            if (pendingIceCandidatesRef.current[fromUserId]) {
                console.log(`Processing ${pendingIceCandidatesRef.current[fromUserId].length} pending ICE candidates`);

                for (const candidate of pendingIceCandidatesRef.current[fromUserId]) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }

                delete pendingIceCandidatesRef.current[fromUserId];
            }

            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer via WebSocket
            console.log(`Sending answer to ${fromUserName}`);
            webSocket.sendToUser({
                type: 'signal',
                signalType: 'answer',
                answer: answer,
                from: { userId, userName },
                to: fromUserId
            }, fromUserId);

            setIsConnecting(false);

        } catch (err) {
            console.error('Error handling offer:', err);
            setError(`Failed to handle offer: ${err.message}`);
            setIsConnecting(false);
        }
    }, [createPeerConnection, webSocket, userId, userName]);

    /**
     * Handle incoming answer
     */
    const handleAnswer = useCallback(async (answer, fromUserId, fromUserName) => {
        try {
            console.log(`Received answer from ${fromUserName} (${fromUserId})`);

            const peerConnection = peerConnectionsRef.current[fromUserId];

            if (!peerConnection) {
                console.warn(`No peer connection found for ${fromUserId}`);
                return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

            // Process any pending ICE candidates
            if (pendingIceCandidatesRef.current[fromUserId]) {
                console.log(`Processing ${pendingIceCandidatesRef.current[fromUserId].length} pending ICE candidates`);

                for (const candidate of pendingIceCandidatesRef.current[fromUserId]) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }

                delete pendingIceCandidatesRef.current[fromUserId];
            }

        } catch (err) {
            console.error('Error handling answer:', err);
            setError(`Failed to handle answer: ${err.message}`);
        }
    }, []);

    /**
     * Handle incoming ICE candidate
     */
    const handleIceCandidate = useCallback(async (candidate, fromUserId) => {
        try {
            const peerConnection = peerConnectionsRef.current[fromUserId];

            if (!peerConnection) {
                console.log(`Peer connection not ready, storing ICE candidate from ${fromUserId}`);

                if (!pendingIceCandidatesRef.current[fromUserId]) {
                    pendingIceCandidatesRef.current[fromUserId] = [];
                }
                pendingIceCandidatesRef.current[fromUserId].push(candidate);
                return;
            }

            if (peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`Added ICE candidate from ${fromUserId}`);
            } else {
                console.log(`Remote description not set, storing ICE candidate from ${fromUserId}`);

                if (!pendingIceCandidatesRef.current[fromUserId]) {
                    pendingIceCandidatesRef.current[fromUserId] = [];
                }
                pendingIceCandidatesRef.current[fromUserId].push(candidate);
            }

        } catch (err) {
            console.error('Error handling ICE candidate:', err);
        }
    }, []);

    /**
     * Handle peer disconnection
     */
    const handlePeerDisconnection = useCallback((peerId) => {
        console.log(`Peer disconnected: ${peerId}`);

        if (peerConnectionsRef.current[peerId]) {
            peerConnectionsRef.current[peerId].close();
            delete peerConnectionsRef.current[peerId];
        }

        setPeers(prev => {
            const newPeers = { ...prev };
            delete newPeers[peerId];
            return newPeers;
        });

        delete pendingIceCandidatesRef.current[peerId];
    }, []);

    /**
     * Connect to a specific peer
     */
    const connectToPeer = useCallback((peerId, peerName) => {
        console.log(`Initiating connection to ${peerName} (${peerId})`);
        createOffer(peerId, peerName);
    }, [createOffer]);

    /**
     * Disconnect from a specific peer
     */
    const disconnectFromPeer = useCallback((peerId) => {
        handlePeerDisconnection(peerId);
    }, [handlePeerDisconnection]);

    /**
     * Disconnect from all peers
     */
    const disconnectAll = useCallback(() => {
        console.log('Disconnecting from all peers');

        Object.keys(peerConnectionsRef.current).forEach(peerId => {
            if (peerConnectionsRef.current[peerId]) {
                peerConnectionsRef.current[peerId].close();
            }
        });

        peerConnectionsRef.current = {};
        pendingIceCandidatesRef.current = {};
        setPeers({});
    }, []);

    /**
     * Toggle audio track
     */
    const toggleAudio = useCallback((enabled) => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }, [localStream]);

    /**
     * Toggle video track
     */
    const toggleVideo = useCallback((enabled) => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }, [localStream]);

    // Setup WebSocket message listener for signaling
    useEffect(() => {
        if (!webSocket?.onMessage) return;

        const handleSignalingMessage = (message) => {
            if (message.type !== 'signal') return;

            const { signalType, from } = message;

            switch (signalType) {
                case 'offer':
                    handleOffer(message.offer, from.userId, from.userName);
                    break;

                case 'answer':
                    handleAnswer(message.answer, from.userId, from.userName);
                    break;

                case 'ice-candidate':
                    handleIceCandidate(message.candidate, from.userId);
                    break;

                default:
                    console.warn('Unknown signal type:', signalType);
            }
        };

        // Hook into WebSocket message handler
        const originalOnMessage = webSocket.onMessage;
        webSocket.onMessage = (msg) => {
            originalOnMessage?.(msg);
            handleSignalingMessage(msg);
        };

        return () => {
            webSocket.onMessage = originalOnMessage;
        };
    }, [webSocket, handleOffer, handleAnswer, handleIceCandidate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectAll();
        };
    }, [disconnectAll]);

    return {
        peers,
        connectToPeer,
        disconnectFromPeer,
        disconnectAll,
        toggleAudio,
        toggleVideo,
        isConnecting,
        error,
    };
};

export default useWebRTC;
