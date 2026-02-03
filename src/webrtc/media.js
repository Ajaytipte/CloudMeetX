/**
 * Media Stream Management
 * Handles webcam, microphone, and screen sharing streams
 */

// Get user media (camera + microphone)
export const getUserMedia = async (constraints = {}) => {
    try {
        const defaultConstraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };

        const finalConstraints = { ...defaultConstraints, ...constraints };
        const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);

        console.log('✅ Got user media stream:', stream.id);
        return stream;
    } catch (error) {
        console.error('❌ Error getting user media:', error);
        throw new Error(`Failed to access camera/microphone: ${error.message}`);
    }
};

// Get screen sharing stream
export const getDisplayMedia = async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                displaySurface: 'monitor'
            },
            audio: false
        });

        console.log('✅ Got screen share stream:', stream.id);
        return stream;
    } catch (error) {
        console.error('❌ Error getting screen share:', error);
        throw new Error(`Failed to share screen: ${error.message}`);
    }
};

// Toggle audio track
export const toggleAudio = (stream, enabled) => {
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
        track.enabled = enabled;
    });
    console.log(`🎤 Audio ${enabled ? 'enabled' : 'muted'}`);
    return enabled;
};

// Toggle video track
export const toggleVideo = (stream, enabled) => {
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach(track => {
        track.enabled = enabled;
    });
    console.log(`📹 Video ${enabled ? 'enabled' : 'disabled'}`);
    return enabled;
};

// Stop all tracks in a stream
export const stopStream = (stream) => {
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
        console.log('⏹️ Stopped stream:', stream.id);
    }
};

// Replace video track (for screen sharing)
export const replaceVideoTrack = async (peerConnection, newTrack) => {
    try {
        const sender = peerConnection.getSenders().find(s =>
            s.track && s.track.kind === 'video'
        );

        if (sender) {
            await sender.replaceTrack(newTrack);
            console.log('🔄 Replaced video track');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error replacing track:', error);
        return false;
    }
};

// Get media devices list
export const getMediaDevices = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return {
            audioInputs: devices.filter(d => d.kind === 'audioinput'),
            videoInputs: devices.filter(d => d.kind === 'videoinput'),
            audioOutputs: devices.filter(d => d.kind === 'audiooutput')
        };
    } catch (error) {
        console.error('❌ Error enumerating devices:', error);
        return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
};

// Switch camera (front/back on mobile)
export const switchCamera = async (currentStream) => {
    const videoTrack = currentStream.getVideoTracks()[0];
    const currentFacingMode = videoTrack.getSettings().facingMode;

    stopStream(currentStream);

    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return getUserMedia({
        video: { facingMode: newFacingMode }
    });
};

// Check if browser supports WebRTC
export const checkWebRTCSupport = () => {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasRTCPeerConnection = !!window.RTCPeerConnection;

    return {
        supported: hasGetUserMedia && hasRTCPeerConnection,
        getUserMedia: hasGetUserMedia,
        peerConnection: hasRTCPeerConnection
    };
};
