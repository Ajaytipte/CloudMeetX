/**
 * CloudMeetX API Client
 * React hooks for interacting with REST API endpoints
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod';

/**
 * Custom hook for API calls
 */
const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apiCall = useCallback(async (endpoint, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            setLoading(false);
            return { success: true, data };

        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            setLoading(false);
            return { success: false, error: err.message };
        }
    }, []);

    return { apiCall, loading, error };
};

/**
 * Hook for meeting operations
 */
export const useMeetings = () => {
    const { apiCall, loading, error } = useApi();

    const createMeeting = useCallback(async (meetingData) => {
        const result = await apiCall('/meetings/create', {
            method: 'POST',
            body: JSON.stringify(meetingData)
        });

        return result.success ? result.data.meeting : null;
    }, [apiCall]);

    const joinMeeting = useCallback(async (meetingId, userId, userName) => {
        const result = await apiCall('/meetings/join', {
            method: 'POST',
            body: JSON.stringify({ meetingId, userId, userName })
        });

        return result.success ? result.data.meeting : null;
    }, [apiCall]);

    const listMeetings = useCallback(async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const result = await apiCall(`/meetings?${params.toString()}`);

        return result.success ? result.data.meetings : [];
    }, [apiCall]);

    return {
        createMeeting,
        joinMeeting,
        listMeetings,
        loading,
        error
    };
};

/**
 * Hook for chat operations
 */
export const useChat = () => {
    const { apiCall, loading, error } = useApi();

    const saveMessage = useCallback(async (meetingId, userId, userName, message, messageType = 'text') => {
        const result = await apiCall('/chat/save', {
            method: 'POST',
            body: JSON.stringify({
                meetingId,
                userId,
                userName,
                message,
                messageType
            })
        });

        return result.success ? result.data.chatMessage : null;
    }, [apiCall]);

    const getChatHistory = useCallback(async (meetingId, limit = 50) => {
        const result = await apiCall(`/chat/history?meetingId=${meetingId}&limit=${limit}`);

        return result.success ? result.data.messages : [];
    }, [apiCall]);

    return {
        saveMessage,
        getChatHistory,
        loading,
        error
    };
};

export default useApi;
