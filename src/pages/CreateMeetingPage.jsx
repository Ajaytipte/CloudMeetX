import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Copy, Check, Video, ArrowRight, Calendar, Users, Shield } from 'lucide-react';

const CreateMeetingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    // Get meeting data from navigation state
    // Fallback or redirect if accessed directly without state
    const { meetingId, meeting } = location.state || {};

    if (!meetingId) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400 mb-6">
                        No meeting information found. Please create a meeting from the dashboard.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium w-full"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const meetingUrl = `${window.location.origin}/meeting/${meetingId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(meetingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code', err);
        }
    };

    const handleStartMeeting = () => {
        navigate(`/meeting/${meetingId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Success Animation/Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg shadow-green-500/10">
                        <Video className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Meeting Ready!</h1>
                    <p className="text-gray-400">
                        Your meeting room has been created successfully.
                    </p>
                </div>

                {/* Meeting Details Card */}
                <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-6 shadow-2xl animate-fade-in-up delay-100">
                    {/* Header Info */}
                    <div className="flex items-center justify-between pb-6 border-b border-gray-700 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">
                                {meeting?.title || "Instant Meeting"}
                            </h2>
                            <p className="text-sm text-gray-400 flex items-center">
                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                Hosted by {meeting?.hostName || "You"}
                            </p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center">
                            <Calendar className="w-4 h-4 text-blue-400 mr-2" />
                            <span className="text-blue-400 text-sm font-medium">Now</span>
                        </div>
                    </div>

                    {/* Link Section */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Meeting Link
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 font-mono text-sm truncate">
                                    {meetingUrl}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    title="Copy Link"
                                    className={`p-3 rounded-xl border transition-all duration-200 ${copied
                                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 hover:text-white'
                                        }`}
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Meeting ID
                            </label>
                            <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-lg font-semibold tracking-wider text-center">
                                {meetingId}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={handleStartMeeting}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Video className="w-5 h-5 mr-2" />
                            Start Meeting Now
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-3 rounded-xl transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Security Note */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 flex items-center justify-center">
                            <Shield className="w-3 h-3 mr-1.5" />
                            This meeting is secured with end-to-end encryption
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateMeetingPage;
