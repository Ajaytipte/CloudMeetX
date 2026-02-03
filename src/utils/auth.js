/**
 * Authentication Utility Functions
 * Common auth operations for CloudMeetX
 */

import {
    signOut as amplifySignOut,
    fetchAuthSession,
    updatePassword,
    updateUserAttributes,
    getCurrentUser,
    fetchUserAttributes
} from 'aws-amplify/auth';

/**
 * Sign out the current user
 */
export const handleSignOut = async () => {
    try {
        await amplifySignOut();
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error };
    }
};

/**
 * Get current user session and tokens
 */
export const getCurrentSession = async () => {
    try {
        const session = await fetchAuthSession();
        return {
            success: true,
            tokens: session.tokens,
            idToken: session.tokens?.idToken?.toString(),
            accessToken: session.tokens?.accessToken?.toString(),
        };
    } catch (error) {
        console.error('Get session error:', error);
        return { success: false, error };
    }
};

/**
 * Get current user info
 */
export const getUserInfo = async () => {
    try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        return {
            success: true,
            user,
            attributes,
        };
    } catch (error) {
        console.error('Get user info error:', error);
        return { success: false, error };
    }
};

/**
 * Update user password
 */
export const changePassword = async (oldPassword, newPassword) => {
    try {
        await updatePassword({ oldPassword, newPassword });
        return { success: true };
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error };
    }
};

/**
 * Update user attributes
 */
export const updateUserProfile = async (attributes) => {
    try {
        await updateUserAttributes({ userAttributes: attributes });
        return { success: true };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error };
    }
};

/**
 * Check if user is authenticated
 */
export const checkAuthStatus = async () => {
    try {
        await getCurrentUser();
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Get access token for API calls
 */
export const getAccessToken = async () => {
    try {
        const session = await fetchAuthSession();
        return session.tokens?.accessToken?.toString();
    } catch (error) {
        console.error('Get access token error:', error);
        return null;
    }
};

export default {
    handleSignOut,
    getCurrentSession,
    getUserInfo,
    changePassword,
    updateUserProfile,
    checkAuthStatus,
    getAccessToken,
};
