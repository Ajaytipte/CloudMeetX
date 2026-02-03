/**
 * Email Verification Page
 * Confirms user email with verification code from Cognito
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Video, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { confirmSignUp, resendSignUpCode, autoSignIn } from 'aws-amplify/auth';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const fromSignup = location.state?.fromSignup || false;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Confirm sign up with verification code
            const { isSignUpComplete, nextStep } = await confirmSignUp({
                username: email,
                confirmationCode: code
            });

            if (isSignUpComplete) {
                setSuccess('Email verified successfully!');

                // If auto sign-in is enabled, attempt to sign in
                if (fromSignup) {
                    try {
                        await autoSignIn();
                        // Successfully auto-signed in
                        setTimeout(() => {
                            navigate('/dashboard');
                        }, 1500);
                    } catch (autoSignInError) {
                        // Auto sign-in failed, redirect to login
                        console.log('Auto sign-in failed:', autoSignInError);
                        setTimeout(() => {
                            navigate('/login', {
                                state: { message: 'Email verified! Please sign in.' }
                            });
                        }, 1500);
                    }
                } else {
                    // Redirect to login after verification
                    setTimeout(() => {
                        navigate('/login', {
                            state: { message: 'Email verified! Please sign in.' }
                        });
                    }, 1500);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);

            if (err.name === 'CodeMismatchException') {
                setError('Invalid verification code. Please try again.');
            } else if (err.name === 'ExpiredCodeException') {
                setError('Verification code has expired. Please request a new one.');
            } else if (err.name === 'NotAuthorizedException') {
                setError('User is already confirmed. Please sign in.');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(err.message || 'Verification failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        setError('');
        setSuccess('');

        try {
            await resendSignUpCode({ username: email });
            setSuccess('Verification code sent! Check your email.');
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.message || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-soft"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo and header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-xl shadow-blue-500/30">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gradient mb-2">Verify Your Email</h1>
                    <p className="text-gray-600">
                        We've sent a verification code to<br />
                        <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                </div>

                {/* Verification form */}
                <div className="card">
                    <form onSubmit={handleVerify} className="space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Success Alert */}
                        {success && (
                            <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-green-700">{success}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter 6-digit code"
                                className="input-field text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">
                                Didn't receive the code?
                            </p>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resending}
                                className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                            >
                                {resending ? 'Sending...' : 'Resend Code'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Login
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    &copy; 2026 CloudMeetX. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
