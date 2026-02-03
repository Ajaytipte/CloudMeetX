import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Video, Shield, ArrowRight, User } from 'lucide-react';

const JoinMeetingPage = () => {
    const navigate = useNavigate();
    const { meetingId: urlMeetingId } = useParams();
    const location = useLocation();

    // State
    const [meetingId, setMeetingId] = useState(urlMeetingId || '');
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Update meeting ID if it changes in URL
    useEffect(() => {
        if (urlMeetingId) {
            setMeetingId(urlMeetingId);
        }
    }, [urlMeetingId]);

    const handleJoin = (e) => {
        e.preventDefault();
        setError('');

        if (!meetingId.trim()) {
            setError('Please enter a valid Meeting ID');
            return;
        }

        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }

        setIsLoading(true);

        // Simulate a small delay for better UX (or validate ID with API here)
        setTimeout(() => {
            // Navigate to meeting room with state
            navigate(`/meeting/${meetingId}`, {
                state: {
                    userName: userName,
                    isGuest: true
                }
            });
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                        <Video className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Join Meeting</h1>
                    <p className="text-gray-400">Enter the meeting details to connect</p>
                </div>

                {/* Card */}
                <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleJoin} className="space-y-6">

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Meeting ID Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Meeting ID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Shield className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter meeting code"
                                />
                            </div>
                        </div>

                        {/* User Name Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Your Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        {/* Join Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    Join Meeting
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JoinMeetingPage;
