/**
 * Settings Page - App configuration and preferences
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Settings as SettingsIcon, Bell, Video, Lock,
    Monitor, Moon, Volume2, Mic, Camera, Globe, Shield,
    Save, CheckCircle
} from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        // General
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',

        // Notifications
        emailNotifications: true,
        pushNotifications: true,
        meetingReminders: true,
        chatMessages: true,
        soundNotifications: true,

        // Video & Audio
        defaultCamera: 'default',
        defaultMicrophone: 'default',
        defaultSpeaker: 'default',
        autoJoinAudio: true,
        autoStartVideo: false,
        mirrorVideo: true,
        noiseSuppression: true,
        echoCancellation: true,

        // Meeting
        autoRecord: false,
        showParticipantNames: true,
        raiseHandSound: true,
        chatSound: true,
        joinLeaveSound: false,

        // Privacy
        showOnlineStatus: true,
        allowDirectMessages: true,
        shareAnalytics: true,
        whoCanInvite: 'everyone'
    });

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);

        try {
            // API call to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Settings saved:', settings);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'video-audio', label: 'Video & Audio', icon: Video },
        { id: 'meeting', label: 'Meeting', icon: Monitor },
        { id: 'privacy', label: 'Privacy', icon: Lock }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center min-w-0">
                            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <h1 className="text-xl sm:text-2xl font-bold text-gradient truncate">Settings</h1>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving || saved}
                            className={`
                btn-primary flex items-center text-xs sm:text-sm px-3 sm:px-4 py-2
                ${saved ? 'bg-green-600 hover:bg-green-700' : ''}
              `}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2"></div>
                                    <span className="hidden sm:inline">Saving...</span>
                                    <span className="sm:hidden">Save</span>
                                </>
                            ) : saved ? (
                                <>
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Save Changes</span>
                                    <span className="sm:hidden">Save</span>
                                </>
                            )}
                        </button>
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
            <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Sidebar - Tabs */}
                    <div className="lg:col-span-1">
                        {/* Mobile: Horizontal scroll tabs */}
                        <div className="lg:hidden">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                flex items-center px-3 py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0 text-sm
                                                ${activeTab === tab.id
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                                }
                                            `}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            <span className="font-semibold">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop: Vertical tabs */}
                        <div className="hidden lg:block card space-y-1">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            w-full flex items-center px-4 py-3 rounded-lg transition-all
                                            ${activeTab === tab.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5 mr-3" />
                                        <span className="font-semibold">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        <div className="card">
                            {activeTab === 'general' && <GeneralSettings settings={settings} updateSetting={updateSetting} />}
                            {activeTab === 'notifications' && <NotificationSettings settings={settings} updateSetting={updateSetting} />}
                            {activeTab === 'video-audio' && <VideoAudioSettings settings={settings} updateSetting={updateSetting} />}
                            {activeTab === 'meeting' && <MeetingSettings settings={settings} updateSetting={updateSetting} />}
                            {activeTab === 'privacy' && <PrivacySettings settings={settings} updateSetting={updateSetting} />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// General Settings
const GeneralSettings = ({ settings, updateSetting }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>

        <div className="space-y-6">
            {/* Language */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Language
                </label>
                <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="input-field"
                >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                </select>
            </div>

            {/* Timezone */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Timezone
                </label>
                <select
                    value={settings.timezone}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
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

            {/* Theme */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Moon className="w-4 h-4 inline mr-2" />
                    Theme
                </label>
                <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    className="input-field"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                </select>
            </div>
        </div>
    </div>
);

// Notification Settings
const NotificationSettings = ({ settings, updateSetting }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

        <div className="space-y-4">
            <ToggleSetting
                label="Email Notifications"
                description="Receive email updates about meetings and messages"
                checked={settings.emailNotifications}
                onChange={(val) => updateSetting('emailNotifications', val)}
            />

            <ToggleSetting
                label="Push Notifications"
                description="Get browser notifications for important events"
                checked={settings.pushNotifications}
                onChange={(val) => updateSetting('pushNotifications', val)}
            />

            <ToggleSetting
                label="Meeting Reminders"
                description="Remind me before meetings start"
                checked={settings.meetingReminders}
                onChange={(val) => updateSetting('meetingReminders', val)}
            />

            <ToggleSetting
                label="Chat Messages"
                description="Notify me about new chat messages"
                checked={settings.chatMessages}
                onChange={(val) => updateSetting('chatMessages', val)}
            />

            <ToggleSetting
                label="Sound Notifications"
                description="Play sound for notifications"
                checked={settings.soundNotifications}
                onChange={(val) => updateSetting('soundNotifications', val)}
                icon={Volume2}
            />
        </div>
    </div>
);

// Video & Audio Settings
const VideoAudioSettings = ({ settings, updateSetting }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Video & Audio Settings</h2>

        <div className="space-y-6">
            {/* Camera */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Default Camera
                </label>
                <select
                    value={settings.defaultCamera}
                    onChange={(e) => updateSetting('defaultCamera', e.target.value)}
                    className="input-field"
                >
                    <option value="default">Default Camera</option>
                    <option value="camera1">FaceTime HD Camera</option>
                    <option value="camera2">External Webcam</option>
                </select>
            </div>

            {/* Microphone */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mic className="w-4 h-4 inline mr-2" />
                    Default Microphone
                </label>
                <select
                    value={settings.defaultMicrophone}
                    onChange={(e) => updateSetting('defaultMicrophone', e.target.value)}
                    className="input-field"
                >
                    <option value="default">Default Microphone</option>
                    <option value="mic1">Built-in Microphone</option>
                    <option value="mic2">External Microphone</option>
                </select>
            </div>

            {/* Speaker */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Volume2 className="w-4 h-4 inline mr-2" />
                    Default Speaker
                </label>
                <select
                    value={settings.defaultSpeaker}
                    onChange={(e) => updateSetting('defaultSpeaker', e.target.value)}
                    className="input-field"
                >
                    <option value="default">Default Speaker</option>
                    <option value="speaker1">Built-in Speakers</option>
                    <option value="speaker2">External Speakers</option>
                </select>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                <ToggleSetting
                    label="Auto Join Audio"
                    description="Automatically join meeting audio"
                    checked={settings.autoJoinAudio}
                    onChange={(val) => updateSetting('autoJoinAudio', val)}
                />

                <ToggleSetting
                    label="Auto Start Video"
                    description="Turn on camera when joining meetings"
                    checked={settings.autoStartVideo}
                    onChange={(val) => updateSetting('autoStartVideo', val)}
                />

                <ToggleSetting
                    label="Mirror Video"
                    description="Mirror your video feed"
                    checked={settings.mirrorVideo}
                    onChange={(val) => updateSetting('mirrorVideo', val)}
                />

                <ToggleSetting
                    label="Noise Suppression"
                    description="Reduce background noise"
                    checked={settings.noiseSuppression}
                    onChange={(val) => updateSetting('noiseSuppression', val)}
                />

                <ToggleSetting
                    label="Echo Cancellation"
                    description="Prevent audio echo"
                    checked={settings.echoCancellation}
                    onChange={(val) => updateSetting('echoCancellation', val)}
                />
            </div>
        </div>
    </div>
);

// Meeting Settings
const MeetingSettings = ({ settings, updateSetting }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Meeting Preferences</h2>

        <div className="space-y-4">
            <ToggleSetting
                label="Auto Record Meetings"
                description="Automatically record all meetings"
                checked={settings.autoRecord}
                onChange={(val) => updateSetting('autoRecord', val)}
            />

            <ToggleSetting
                label="Show Participant Names"
                description="Display names on video tiles"
                checked={settings.showParticipantNames}
                onChange={(val) => updateSetting('showParticipantNames', val)}
            />

            <ToggleSetting
                label="Raise Hand Sound"
                description="Play sound when someone raises hand"
                checked={settings.raiseHandSound}
                onChange={(val) => updateSetting('raiseHandSound', val)}
            />

            <ToggleSetting
                label="Chat Sound"
                description="Play sound for new chat messages"
                checked={settings.chatSound}
                onChange={(val) => updateSetting('chatSound', val)}
            />

            <ToggleSetting
                label="Join/Leave Sound"
                description="Play sound when participants join or leave"
                checked={settings.joinLeaveSound}
                onChange={(val) => updateSetting('joinLeaveSound', val)}
            />
        </div>
    </div>
);

// Privacy Settings
const PrivacySettings = ({ settings, updateSetting }) => (
    <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy & Security</h2>

        <div className="space-y-6">
            <ToggleSetting
                label="Show Online Status"
                description="Let others see when you're online"
                checked={settings.showOnlineStatus}
                onChange={(val) => updateSetting('showOnlineStatus', val)}
                icon={Shield}
            />

            <ToggleSetting
                label="Allow Direct Messages"
                description="Allow other users to message you"
                checked={settings.allowDirectMessages}
                onChange={(val) => updateSetting('allowDirectMessages', val)}
            />

            <ToggleSetting
                label="Share Usage Analytics"
                description="Help improve CloudMeetX by sharing anonymous usage data"
                checked={settings.shareAnalytics}
                onChange={(val) => updateSetting('shareAnalytics', val)}
            />

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Who Can Invite You to Meetings
                </label>
                <select
                    value={settings.whoCanInvite}
                    onChange={(e) => updateSetting('whoCanInvite', e.target.value)}
                    className="input-field"
                >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">Contacts Only</option>
                    <option value="organization">Organization Members Only</option>
                    <option value="none">No One (Request Only)</option>
                </select>
            </div>
        </div>
    </div>
);

// Toggle Setting Component
const ToggleSetting = ({ label, description, checked, onChange, icon: Icon }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
        <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
                {Icon && <Icon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />}
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">{label}</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{description}</p>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`
        relative w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors flex-shrink-0
        ${checked ? 'bg-blue-600' : 'bg-gray-300'}
      `}
        >
            <span
                className={`
          absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform
          ${checked ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}
        `}
            />
        </button>
    </div>
);

export default Settings;
