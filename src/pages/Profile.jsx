/**
 * Profile Page - User Profile Management
 * View and edit user profile, upload avatar, change password
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Calendar, Camera, Save, ArrowLeft,
    Shield, Key, LogOut, Upload, CheckCircle
} from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // User data (would come from auth context/API)
    const [userData, setUserData] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        avatar: null,
        joinDate: '2024-01-15',
        bio: 'Product Manager | Tech Enthusiast',
        company: 'CloudMeetX Inc.',
        timezone: 'America/New_York'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Handle profile update
    const handleSave = async () => {
        setIsSaving(true);

        try {
            // API call to update profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Profile updated:', userData);

            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle avatar upload
    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle password change
    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            // API call to change password
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Password changed');

            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Password changed successfully!');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gradient">My Profile</h1>
                        <div className="w-32"></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Avatar & Quick Actions */}
                    <div className="space-y-6">
                        {/* Avatar Card */}
                        <div className="card text-center">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                                    {userData.avatar ? (
                                        <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        userData.name.charAt(0)
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all hover:scale-110"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mt-4">{userData.name}</h2>
                            <p className="text-sm text-gray-600">{userData.email}</p>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Joined {new Date(userData.joinDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card space-y-3">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>

                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="flex items-center">
                                    <Key className="w-5 h-5 mr-3 text-blue-600" />
                                    <span className="text-sm font-semibold">Change Password</span>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/settings')}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="flex items-center">
                                    <Shield className="w-5 h-5 mr-3 text-green-600" />
                                    <span className="text-sm font-semibold">Privacy Settings</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to logout?')) {
                                        navigate('/login');
                                    }
                                }}
                                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <div className="flex items-center">
                                    <LogOut className="w-5 h-5 mr-3 text-red-600" />
                                    <span className="text-sm font-semibold text-red-600">Logout</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Profile Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-primary text-sm py-2 px-4"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn-secondary text-sm py-2 px-4"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="btn-primary text-sm py-2 px-4 flex items-center"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={userData.name}
                                            onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                                            disabled={!isEditing}
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={userData.email}
                                            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                                            disabled={!isEditing}
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={userData.phone}
                                            onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                                            disabled={!isEditing}
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        value={userData.bio}
                                        onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                                        disabled={!isEditing}
                                        rows={3}
                                        className="input-field resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        value={userData.company}
                                        onChange={(e) => setUserData(prev => ({ ...prev, company: e.target.value }))}
                                        disabled={!isEditing}
                                        className="input-field"
                                    />
                                </div>

                                {/* Timezone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={userData.timezone}
                                        onChange={(e) => setUserData(prev => ({ ...prev, timezone: e.target.value }))}
                                        disabled={!isEditing}
                                        className="input-field"
                                    >
                                        <option value="America/New_York">Eastern Time (ET)</option>
                                        <option value="America/Chicago">Central Time (CT)</option>
                                        <option value="America/Denver">Mountain Time (MT)</option>
                                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                        <option value="Europe/London">London (GMT)</option>
                                        <option value="Asia/Kolkata">India (IST)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Account Statistics */}
                        <div className="card">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Account Statistics</h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">48</div>
                                    <div className="text-sm text-gray-600 mt-1">Meetings</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">124</div>
                                    <div className="text-sm text-gray-600 mt-1">Hours</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-3xl font-bold text-purple-600">89</div>
                                    <div className="text-sm text-gray-600 mt-1">Contacts</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Change Password</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="input-field"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="input-field"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="input-field"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                className="flex-1 btn-primary"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
