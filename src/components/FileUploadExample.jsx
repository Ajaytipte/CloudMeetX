/**
 * Example: Using FileUpload in Meeting Room
 */

import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import { MessageSquare, Paperclip } from 'lucide-react';

const MeetingRoomChatWithUpload = ({ meetingId }) => {
    const [showUpload, setShowUpload] = useState(false);
    const [messages, setMessages] = useState([]);

    const handleFileUploaded = (result) => {
        console.log('File uploaded:', result);

        // Add file message to chat
        const fileMessage = {
            id: Date.now(),
            type: 'file',
            sender: 'You',
            fileName: result.fileName,
            fileUrl: result.fileUrl,
            fileSize: result.fileSize,
            time: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, fileMessage]);

        // Close upload panel
        setShowUpload(false);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Chat
                </h3>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className={`p-2 rounded-lg transition-colors ${showUpload ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                >
                    <Paperclip className="w-5 h-5" />
                </button>
            </div>

            {/* File Upload Area */}
            {showUpload && (
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <FileUpload
                        meetingId={meetingId}
                        onFileUploaded={handleFileUploaded}
                        maxSizeMB={50}
                        allowedTypes={[
                            'image/*',
                            'video/*',
                            'application/pdf',
                            '.doc', '.docx',
                            '.xls', '.xlsx',
                            '.ppt', '.pptx',
                            '.zip', '.rar'
                        ]}
                        multiple={true}
                    />
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id}>
                        {msg.type === 'file' ? (
                            <FileMessage message={msg} />
                        ) : (
                            <TextMessage message={msg} />
                        )}
                    </div>
                ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-gray-900 border-t border-gray-700">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};

// File Message Component
const FileMessage = ({ message }) => {
    return (
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{message.sender}</span>
                <span className="text-xs text-gray-500">{message.time}</span>
            </div>

            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{message.fileName}</p>
                    <p className="text-xs text-gray-400">
                        {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                </div>
                <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                    Download
                </a>
            </div>
        </div>
    );
};

// Text Message Component
const TextMessage = ({ message }) => {
    return (
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{message.sender}</span>
                <span className="text-xs text-gray-500">{message.time}</span>
            </div>
            <p className="text-sm text-white">{message.text}</p>
        </div>
    );
};

export default MeetingRoomChatWithUpload;
