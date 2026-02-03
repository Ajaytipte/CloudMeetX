/**
 * Example: Using CloudMeetX REST API in React
 */

import { useState, useEffect } from 'react';
import { useMeetings, useChat } from '../hooks/useApi';
import { Users, Send, Calendar, Clock } from 'lucide-react';

const ExampleMeetingComponent = ({ userId, userName }) => {
    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const {
        createMeeting,
        joinMeeting,
        listMeetings,
        loading: meetingsLoading
    } = useMeetings();

    const {
        saveMessage,
        getChatHistory,
        loading: chatLoading
    } = useChat();

    // Load meetings on component mount
    useEffect(() => {
        loadMeetings();
    }, []);

    // Load chat history when meeting selected
    useEffect(() => {
        if (selectedMeeting) {
            loadChatHistory(selectedMeeting.meetingId);
        }
    }, [selectedMeeting]);

    const loadMeetings = async () => {
        const myMeetings = await listMeetings({
            userId,
            status: 'active'
        });
        setMeetings(myMeetings || []);
    };

    const handleCreateMeeting = async () => {
        const meeting = await createMeeting({
            title: 'New Meeting',
            description: 'Description here',
            hostId: userId,
            hostName: userName,
            duration: 60,
            maxParticipants: 10
        });

        if (meeting) {
            setMeetings(prev => [meeting, ...prev]);
            setSelectedMeeting(meeting);
        }
    };

    const handleJoinMeeting = async (meetingId) => {
        const meeting = await joinMeeting(meetingId, userId, userName);

        if (meeting) {
            setSelectedMeeting(meeting);
        }
    };

    const loadChatHistory = async (meetingId) => {
        const messages = await getChatHistory(meetingId);
        setChatMessages(messages || []);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedMeeting) return;

        const chatMessage = await saveMessage(
            selectedMeeting.meetingId,
            userId,
            userName,
            newMessage
        );

        if (chatMessage) {
            setChatMessages(prev => [chatMessage, ...prev]);
            setNewMessage('');
        }
    };

    return (
        <div className="meeting-container">
            {/* Header */}
            <div className="header">
                <h1>CloudMeetX</h1>
                <button
                    onClick={handleCreateMeeting}
                    disabled={meetingsLoading}
                    className="btn-primary"
                >
                    Create Meeting
                </button>
            </div>

            <div className="content">
                {/* Meetings List */}
                <div className="meetings-sidebar">
                    <h2>Active Meetings</h2>
                    {meetingsLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <ul>
                            {meetings.map(meeting => (
                                <li
                                    key={meeting.meetingId}
                                    onClick={() => setSelectedMeeting(meeting)}
                                    className={selectedMeeting?.meetingId === meeting.meetingId ? 'active' : ''}
                                >
                                    <h3>{meeting.title}</h3>
                                    <div className="meeting-info">
                                        <span>
                                            <Users className="icon" />
                                            {meeting.participantCount}/{meeting.maxParticipants}
                                        </span>
                                        <span>
                                            <Clock className="icon" />
                                            {meeting.duration}min
                                        </span>
                                    </div>
                                    <p>{meeting.description}</p>
                                    <small>Host: {meeting.hostName}</small>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Selected Meeting Details */}
                {selectedMeeting && (
                    <div className="meeting-details">
                        <div className="meeting-header">
                            <h2>{selectedMeeting.title}</h2>
                            <p>{selectedMeeting.description}</p>
                            <div className="meeting-meta">
                                <span>
                                    <Calendar className="icon" />
                                    {new Date(selectedMeeting.scheduledAt).toLocaleString()}
                                </span>
                                <span>
                                    <Users className="icon" />
                                    {selectedMeeting.participantCount} participants
                                </span>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="chat-section">
                            <h3>Chat</h3>
                            <div className="chat-messages">
                                {chatMessages.map(msg => (
                                    <div key={msg.messageId} className="message">
                                        <strong>{msg.userName}:</strong> {msg.message}
                                        <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                    </div>
                                ))}
                            </div>

                            {/* Send Message */}
                            <div className="chat-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    disabled={chatLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={chatLoading || !newMessage.trim()}
                                    className="btn-send"
                                >
                                    <Send className="icon" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExampleMeetingComponent;
