/**
 * API Configuration
 * Centralized configuration for REST and WebSocket endpoints
 */

// REST API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    'https://5cbnsn6mm6.execute-api.ap-south-1.amazonaws.com/Prod';

// WebSocket URL
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL ||
    'wss://8yjdh5z9mg.execute-api.ap-south-1.amazonaws.com/prod/';

// REST API Endpoints
export const ENDPOINTS = {
    CREATE_MEETING: `${API_BASE_URL}/createMeeting`,
    JOIN_MEETING: `${API_BASE_URL}/joinMeeting`,
    SAVE_CHAT: `${API_BASE_URL}/saveChatMessage`,
    GENERATE_PRESIGNED_URL: `${API_BASE_URL}/generatePresignedUrl`,
};

// Log configuration in development
if (import.meta.env.DEV) {
    console.log('🔧 API Configuration:', {
        REST: API_BASE_URL,
        WebSocket: WEBSOCKET_URL,
        Endpoints: ENDPOINTS
    });
}
