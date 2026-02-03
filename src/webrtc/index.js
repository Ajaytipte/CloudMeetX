/**
 * WebRTC Module Exports for CloudMeetX
 */

// Main hook
export { default as useWebRTC } from './useWebRTC';

// Signaling client
export { default as SignalingClient } from './signaling';

// Media utilities
export {
    getUserMedia,
    getDisplayMedia,
    toggleAudio,
    toggleVideo,
    stopStream,
    replaceVideoTrack,
    getMediaDevices,
    switchCamera,
    checkWebRTCSupport
} from './media';

// Example component (for reference)
export { default as MeetingRoomExample } from './MeetingRoomExample';
