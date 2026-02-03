/**
 * useAuthRedirect Hook
 * Handles redirects based on authentication status
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAuthRedirect = (redirectTo = '/dashboard', shouldRedirect = true) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && shouldRedirect) {
            if (isAuthenticated) {
                navigate(redirectTo);
            }
        }
    }, [isAuthenticated, loading, navigate, redirectTo, shouldRedirect]);

    return { isAuthenticated, loading };
};

export const useProtectedRoute = (redirectTo = '/login') => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate(redirectTo);
        }
    }, [isAuthenticated, loading, navigate, redirectTo]);

    return { isAuthenticated, loading };
};
