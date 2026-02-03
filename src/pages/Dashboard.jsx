import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Video,
    Plus,
    LogIn,
    Calendar,
    Clock,
    Users,
    Settings,
    LogOut,
    Bell,
    ChevronRight,
    TrendingUp,
    Loader2
} from 'lucide-react';
import { ENDPOINTS } from '../config/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [meetingId, setMeetingId] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateMeeting = async () => {
        try {
            setIsCreating(true);

            // Generate temporary user info (replace with actual Auth context later)
            const userId = 'user-' + Math.floor(Math.random() * 10000);
            const userName = 'John Doe';

            console.log('🚀 Creating meeting...', {
                url: ENDPOINTS.CREATE_MEETING,
                payload: { title: "Instant Meeting", hostId: userId, hostName: userName }
            });

            const response = await fetch(ENDPOINTS.CREATE_MEETING, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: "Instant Meeting",
                    hostId: userId,
                    hostName: userName,
                    description: "Instant meeting created from dashboard"
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ API Response:', data);

            // Backend returns: { meetingId: "abc123", message: "...", meeting: {...} }
            // We check for meetingId at the root level
            if (!data.meetingId) {
                console.error('❌ Invalid response structure:', data);
                throw new Error('Invalid response format from server');
            }

            console.log(`✅ Navigating to meeting setup: ${data.meetingId}`);
            // Navigate to the intermediate "Create Meeting" page instead of directly to the room
            navigate('/create-meeting', {
                state: {
                    meetingId: data.meetingId,
                    meeting: data.meeting || {
                        title: "Instant Meeting",
                        hostId: userId,
                        hostName: userName
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error creating meeting:', error);
            alert(`Failed to create meeting: ${error.message}\n\nCheck the browser console for details.`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinMeeting = () => {
        if (meetingId.trim()) {
            navigate(`/meeting/${meetingId}`);
        }
    };

    const recentMeetings = [
        { id: 1, title: 'Team Standup', date: '2026-02-01', time: '10:00 AM', participants: 8 },
        { id: 2, title: 'Client Review', date: '2026-01-31', time: '2:30 PM', participants: 5 },
        { id: 3, title: 'Project Discussion', date: '2026-01-30', time: '4:00 PM', participants: 12 },
    ];

    const upcomingMeetings = [
        { id: 1, title: 'Sprint Planning', date: '2026-02-02', time: '9:00 AM', participants: 10 },
        { id: 2, title: 'Design Review', date: '2026-02-03', time: '11:30 AM', participants: 6 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                                <Video className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient">CloudMeetX</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Settings className="w-6 h-6" />
                            </button>
                            <div
                                onClick={() => navigate('/profile')}
                                className="flex items-center space-x-3 pl-4 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                    JD
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-semibold text-gray-900">John Doe</p>
                                    <p className="text-xs text-gray-500">john@example.com</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8 animate-slide-up">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, John! 👋
                    </h2>
                    <p className="text-gray-600">Ready to start your next meeting?</p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Create Meeting Card */}
                    <div className="card group hover:scale-[1.02] hover:shadow-2xl cursor-pointer" onClick={handleCreateMeeting}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className={`w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all ${isCreating ? 'opacity-75' : 'group-hover:shadow-xl group-hover:shadow-blue-500/40'}`}>
                                    {isCreating ? (
                                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                                    ) : (
                                        <Plus className="w-7 h-7 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Create Meeting</h3>
                                    <p className="text-gray-600 text-sm">Start an instant meeting now</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Get a unique meeting ID and share it with participants
                            </p>
                        </div>
                    </div>

                    {/* Join Meeting Card */}
                    <div className="card group hover:scale-[1.02] hover:shadow-2xl">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all">
                                    <LogIn className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Join Meeting</h3>
                                    <p className="text-gray-600 text-sm">Enter a meeting ID to join</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    placeholder="Enter meeting ID"
                                    className="input-field flex-1"
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
                                />
                                <button
                                    onClick={handleJoinMeeting}
                                    className="btn-primary px-6"
                                    disabled={!meetingId.trim()}
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card hover:shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 mb-1">Total Meetings</p>
                                <p className="text-3xl font-bold text-gray-900">48</p>
                                <p className="text-sm text-green-600 flex items-center mt-2">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    +12% this month
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Video className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 mb-1">Meeting Hours</p>
                                <p className="text-3xl font-bold text-gray-900">124</p>
                                <p className="text-sm text-green-600 flex items-center mt-2">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    +8% this month
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 mb-1">Participants</p>
                                <p className="text-3xl font-bold text-gray-900">342</p>
                                <p className="text-sm text-green-600 flex items-center mt-2">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    +18% this month
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meetings Section */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent Meetings */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                Recent Meetings
                            </h3>
                            <button
                                onClick={() => navigate('/meetings/recent')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentMeetings.map((meeting) => (
                                <div
                                    key={meeting.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <Video className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {meeting.title}
                                            </p>
                                            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                                <span className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {meeting.date}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {meeting.time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span>{meeting.participants}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Meetings */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                                Upcoming Meetings
                            </h3>
                            <button
                                onClick={() => navigate('/meetings/upcoming')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {upcomingMeetings.map((meeting) => (
                                <div
                                    key={meeting.id}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                                            <Video className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {meeting.title}
                                            </p>
                                            <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                                <span className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {meeting.date}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {meeting.time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 mr-3">
                                            <Users className="w-4 h-4" />
                                            <span>{meeting.participants}</span>
                                        </div>
                                        <button className="btn-primary px-4 py-2 text-sm">
                                            Join
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {upcomingMeetings.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p>No upcoming meetings</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
