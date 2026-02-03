/**
 * Authentication Context
 * Manages authentication state using AWS Cognito
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userAttributes, setUserAttributes] = useState(null);

    // Check if user is authenticated on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            // Fetch user attributes
            const attributes = await fetchUserAttributes();
            setUserAttributes(attributes);
        } catch (error) {
            // User is not authenticated
            setUser(null);
            setUserAttributes(null);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        userAttributes,
        loading,
        isAuthenticated: !!user,
        refreshAuth: checkAuthStatus,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
