/**
 * Example: Meeting Recording Component
 * 
 * Demonstrates WebRTC stream recording with upload to S3
 */

import { useRef, useState, useEffect } from 'react';
import {
    Video,
    Circle,
    Square,
    Pause,
    Play,
    Download,
    Upload,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useRecordAndUpload, formatRecordingTime } from '../hooks/useMediaRecorder';

const MeetingRecorder = ({ meetingId, userId, userName }) => {
    const [localStream, setLocalStream] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const videoRef = useRef(null);

    const {
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        isRecording,
        isPaused,
        recordingTime,
        recordedBlob,
        recordError,
        uploadRecording,
        downloadRecording,
        isUploading,
        uploadProgress,
        uploadedFileInfo,
    } = useRecordAndUpload(localStream, {
        meetingId,
        userId,
        userName,
        autoUpload: false, // Manual upload for more control
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
    });

    // Start camera and microphone
    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            setLocalStream(stream);
            setIsStreaming(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Failed to access camera/microphone: ' + err.message);
        }
    };

    // Stop stream
    const stopStream = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            setIsStreaming(false);

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    // Handle start recording
    const handleStartRecording = async () => {
        if (!isStreaming) {
            await startStream();
        }
        await startRecording();
    };

    // Handle stop recording
    const handleStopRecording = () => {
        stopRecording();
    };

    // Handle upload
    const handleUpload = async () => {
        const result = await uploadRecording();

        if (result?.success) {
            alert('Recording uploaded successfully!');
        } else {
            alert('Upload failed: ' + (result?.error || 'Unknown error'));
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStream();
        };
    }, []);

    return (
        <div className="meeting-recorder">
            <h2>Meeting Recorder</h2>

            {/* Video Preview */}
            <div className="video-container">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-preview"
                />

                {isRecording && (
                    <div className="recording-indicator">
                        <Circle className="w-3 h-3 fill-red-600 animate-pulse" />
                        <span className="recording-text">REC</span>
                        <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                    </div>
                )}

                {isPaused && (
                    <div className="paused-overlay">
                        <Pause className="w-12 h-12" />
                        <span>Recording Paused</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="controls">
                {!isStreaming ? (
                    <button onClick={startStream} className="btn-primary">
                        <Video className="w-4 h-4 mr-2" />
                        Start Camera
                    </button>
                ) : !isRecording ? (
                    <>
                        <button onClick={handleStartRecording} className="btn-record">
                            <Circle className="w-4 h-4 mr-2 fill-red-600" />
                            Start Recording
                        </button>
                        {recordedBlob && (
                            <button onClick={resetRecording} className="btn-secondary">
                                Reset
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {!isPaused ? (
                            <button onClick={pauseRecording} className="btn-secondary">
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                            </button>
                        ) : (
                            <button onClick={resumeRecording} className="btn-primary">
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                            </button>
                        )}
                        <button onClick={handleStopRecording} className="btn-stop">
                            <Square className="w-4 h-4 mr-2" />
                            Stop Recording
                        </button>
                    </>
                )}

                {isStreaming && (
                    <button onClick={stopStream} className="btn-secondary">
                        Stop Camera
                    </button>
                )}
            </div>

            {/* Recording Info */}
            {isRecording && (
                <div className="recording-info">
                    <Clock className="w-4 h-4" />
                    <span>Recording: {formatRecordingTime(recordingTime)}</span>
                </div>
            )}

            {/* Error Display */}
            {recordError && (
                <div className="alert alert-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{recordError}</span>
                </div>
            )}

            {/* Recorded Blob Actions */}
            {recordedBlob && !isRecording && (
                <div className="recorded-section">
                    <h3>Recording Complete</h3>

                    <div className="recording-details">
                        <p className="detail-item">
                            <strong>Size:</strong> {formatFileSize(recordedBlob.size)}
                        </p>
                        <p className="detail-item">
                            <strong>Duration:</strong> {formatRecordingTime(recordingTime)}
                        </p>
                        <p className="detail-item">
                            <strong>Format:</strong> {recordedBlob.type}
                        </p>
                    </div>

                    {/* Preview Recorded Video */}
                    <div className="recorded-preview">
                        <h4>Preview</h4>
                        <video
                            src={URL.createObjectURL(recordedBlob)}
                            controls
                            className="preview-video"
                        />
                    </div>

                    {/* Actions */}
                    <div className="recording-actions">
                        <button
                            onClick={() => downloadRecording()}
                            className="btn-secondary"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </button>

                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="btn-primary"
                        >
                            {isUploading ? (
                                <>
                                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                                    Uploading... {uploadProgress}%
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload to S3
                                </>
                            )}
                        </button>
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="upload-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="progress-text">{uploadProgress}% uploaded</p>
                        </div>
                    )}

                    {/* Upload Success */}
                    {uploadedFileInfo && (
                        <div className="alert alert-success">
                            <CheckCircle className="w-5 h-5" />
                            <div>
                                <p><strong>Upload Successful!</strong></p>
                                <p className="text-sm">File ID: {uploadedFileInfo.fileId}</p>
                                <p className="text-sm">S3 Key: {uploadedFileInfo.s3Key}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Styles */}
            <style jsx>{`
        .meeting-recorder {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .video-container {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .video-preview {
          width: 100%;
          height: auto;
          display: block;
        }

        .recording-indicator {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.7);
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
        }

        .recording-text {
          color: #ef4444;
        }

        .paused-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          gap: 12px;
        }

        .controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .btn-primary, .btn-secondary, .btn-record, .btn-stop {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-record {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .btn-stop {
          background: #6b7280;
          color: white;
        }

        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .recording-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .alert-error {
          background: #fee;
          color: #c00;
          border: 1px solid #fcc;
        }

        .alert-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .recorded-section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .recording-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }

        .detail-item {
          padding: 12px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .recorded-preview {
          margin: 20px 0;
        }

        .preview-video {
          width: 100%;
          max-height: 400px;
          border-radius: 8px;
          background: #000;
        }

        .recording-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .upload-progress {
          margin-top: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          color: #6b7280;
        }
      `}</style>
        </div>
    );
};

export default MeetingRecorder;
