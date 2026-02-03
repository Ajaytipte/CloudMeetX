/**
 * Upcoming Meetings Page - Full view of all upcoming meetings
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Video, Calendar, Clock, Users, Search,
    Filter, Edit, Trash2, MoreVertical, Plus
} from 'lucide-react';

const UpcomingMeetings = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, today, week, month

    // Sample data - replace with API call
    const allMeetings = [
        { id: 1, title: 'Sprint Planning', date: '2026-02-02', time: '9:00 AM', duration: '1 hr', participants: 10, status: 'scheduled' },
        { id: 2, title: 'Design Review', date: '2026-02-03', time: '11:30 AM', duration: '45 min', participants: 6, status: 'scheduled' },
        { id: 3, title: 'Client Presentation', date: '2026-02-03', time: '2:00 PM', duration: '1.5 hr', participants: 8, status: 'scheduled' },
        { id: 4, title: 'Team Building', date: '2026-02-04', time: '3:00 PM', duration: '2 hr', participants: 15, status: 'scheduled' },
        { id: 5, title: 'Quarterly Review', date: '2026-02-05', time: '10:00 AM', duration: '2 hr', participants: 12, status: 'scheduled' },
        { id: 6, title: 'Product Demo', date: '2026-02-05', time: '4:00 PM', duration: '45 min', participants: 7, status: 'scheduled' },
        { id: 7, title: 'Engineering Standup', date: '2026-02-06', time: '9:30 AM', duration: '30 min', participants: 9, status: 'scheduled' },
        { id: 8, title: 'Marketing Strategy', date: '2026-02-07', time: '1:00 PM', duration: '1 hr', participants: 6, status: 'scheduled' },
        { id: 9, title: 'Sales Pipeline Review', date: '2026-02-08', time: '11:00 AM', duration: '1 hr', participants: 8, status: 'scheduled' },
        { id: 10, title: 'All Hands Meeting', date: '2026-02-10', time: '2:00 PM', duration: '1.5 hr', participants: 50, status: 'scheduled' },
    ];

    // Filter meetings
    const filteredMeetings = allMeetings.filter(meeting => {
        const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterType === 'all') return matchesSearch;

        const meetingDate = new Date(meeting.date);
        const today = new Date();
        const daysDiff = Math.floor((meetingDate - today) / (1000 * 60 * 60 * 24));

        if (filterType === 'today') return matchesSearch && daysDiff === 0;
        if (filterType === 'week') return matchesSearch && daysDiff <= 7;
        if (filterType === 'month') return matchesSearch && daysDiff <= 30;

        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center min-w-0">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-2 sm:mr-4"
                            >
                                <ArrowLeft className="w-5 h-5 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                            <div className="flex items-center min-w-0">
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gradient truncate">Upcoming Meetings</h1>
                                    <p className="text-xs sm:text-sm text-gray-600">{filteredMeetings.length} scheduled</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">New Meeting</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:px-8">
                {/* Search and Filter */}
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search meetings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        {[
                            { key: 'all', label: 'All Upcoming' },
                            { key: 'today', label: 'Today' },
                            { key: 'week', label: 'This Week' },
                            { key: 'month', label: 'This Month' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilterType(key)}
                                className={`
                  px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                  ${filterType === key
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }
                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Meetings Grid */}
                {filteredMeetings.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming meetings</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                        <button className="btn-primary">Schedule a Meeting</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredMeetings.map((meeting) => (
                            <MeetingCard key={meeting.id} meeting={meeting} navigate={navigate} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

// Meeting Card Component
const MeetingCard = ({ meeting, navigate }) => {
    const [showMenu, setShowMenu] = useState(false);

    const getTimeRemaining = (date, time) => {
        const meetingDateTime = new Date(`${date} ${time}`);
        const now = new Date();
        const diff = meetingDateTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
        return 'Starting soon';
    };

    return (
        <div className="card hover:shadow-2xl transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Video className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors truncate">
                            {meeting.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {meeting.date}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {meeting.time} • {meeting.duration}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Meeting
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel Meeting
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Time Remaining Badge */}
            <div className="mb-4">
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                    {getTimeRemaining(meeting.date, meeting.time)}
                </span>
            </div>

            {/* Participants and Join Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{meeting.participants} participants</span>
                </div>
                <button
                    onClick={() => navigate('/meeting/' + Math.random().toString(36).substring(2, 11))}
                    className="btn-primary px-4 py-2 text-sm"
                >
                    Join
                </button>
            </div>
        </div>
    );
};

export default UpcomingMeetings;
