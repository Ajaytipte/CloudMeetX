/**
 * Notifications Page - View and manage notifications
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Bell, Video, Users, FileText, Calendar,
    Check, CheckCheck, Trash2, Settings as SettingsIcon, Filter
} from 'lucide-react';

const Notifications = () => {
    const navigate = useNavigate();

    const [filter, setFilter] = useState('all'); // all, unread, meetings, mentions
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'meeting',
            title: 'Meeting Starting Soon',
            message: 'Your meeting "Project Review" starts in 10 minutes',
            time: '5 minutes ago',
            read: false,
            icon: Video,
            color: 'blue'
        },
        {
            id: 2,
            type: 'mention',
            title: 'Sarah mentioned you',
            message: 'Sarah Thompson mentioned you in "Team Standup"',
            time: '1 hour ago',
            read: false,
            icon: Users,
            color: 'purple'
        },
        {
            id: 3,
            type: 'file',
            title: 'File Shared',
            message: 'John Doe shared "Q4_Report.pdf" in Design Review',
            time: '2 hours ago',
            read: true,
            icon: FileText,
            color: 'green'
        },
        {
            id: 4,
            type: 'meeting',
            title: 'New Meeting Invitation',
            message: 'You have been invited to "Budget Planning 2024"',
            time: '3 hours ago',
            read: false,
            icon: Calendar,
            color: 'orange'
        },
        {
            id: 5,
            type: 'mention',
            title: 'Mike Johnson mentioned you',
            message: 'Check out the new designs @John!',
            time: '5 hours ago',
            read: true,
            icon: Users,
            color: 'purple'
        },
        {
            id: 6,
            type: 'meeting',
            title: 'Meeting Ended',
            message: 'Your meeting "Daily Sync" has ended. Duration: 45 minutes',
            time: 'Yesterday',
            read: true,
            icon: Video,
            color: 'blue'
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Filter notifications
    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread') return !notif.read;
        if (filter === 'meetings') return notif.type === 'meeting';
        if (filter === 'mentions') return notif.type === 'mention';
        return true;
    });

    // Mark as read
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Delete notification
    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Clear all notifications
    const clearAll = () => {
        if (confirm('Are you sure you want to clear all notifications?')) {
            setNotifications([]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center min-w-0">
                            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gradient truncate">Notifications</h1>
                                {unreadCount > 0 && (
                                    <p className="text-xs sm:text-sm text-gray-600">{unreadCount} unread</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 rounded-lg"
                                >
                                    <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Mark all read</span>
                                    <span className="sm:hidden">All</span>
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <SettingsIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Back Button */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="font-medium">Back to Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:px-8">
                {/* Filters */}
                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />

                    {[
                        { key: 'all', label: 'All' },
                        { key: 'unread', label: 'Unread', count: unreadCount },
                        { key: 'meetings', label: 'Meetings' },
                        { key: 'mentions', label: 'Mentions' }
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0
                ${filter === key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }
              `}
                        >
                            {label}
                            {count > 0 && (
                                <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${filter === key ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
                        <p className="text-gray-600">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                            />
                        ))}
                    </div>
                )}

                {/* Clear All Button */}
                {notifications.length > 0 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={clearAll}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center mx-auto"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Clear all notifications
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
    const Icon = notification.icon;

    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    return (
        <div className={`
      bg-white rounded-xl p-3 sm:p-4 transition-all hover:shadow-md
      ${!notification.read ? 'border-2 border-blue-200' : 'border border-gray-200'}
    `}>
            <div className="flex items-start gap-2 sm:gap-4">
                {/* Icon */}
                <div className={`
          w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${colorClasses[notification.color]}
        `}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1 gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">{notification.title}</h4>
                        {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">{notification.time}</span>

                        <div className="flex items-center gap-2 flex-wrap">
                            {!notification.read && (
                                <button
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center"
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Mark as read</span>
                                    <span className="sm:hidden">Read</span>
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(notification.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center"
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
