/**
 * CloudMeetX - WebRTC Stream Recorder Hook
 * 
 * Records audio/video streams using MediaRecorder API
 * and uploads recordings to S3 via presigned URLs
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useS3Files } from './useS3Files';

/**
 * Hook for recording WebRTC streams
 * 
 * @param {MediaStream} stream - The media stream to record
 * @param {object} options - Recording options
 * @returns {object} Recording controls and state
 */
export const useMediaRecorder = (stream, options = {}) => {
    const {
        mimeType = 'video/webm;codecs=vp9',
        audioBitsPerSecond = 128000,
        videoBitsPerSecond = 2500000,
        onDataAvailable = null,
        onRecordingComplete = null,
        timeslice = 1000, // Collect data every 1 second
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState(null);
    const [recordedBlob, setRecordedBlob] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    // Get supported MIME type
    const getSupportedMimeType = useCallback(() => {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'video/webm'; // Fallback
    }, []);

    /**
     * Start recording
     */
    const startRecording = useCallback(async () => {
        if (!stream) {
            setError('No media stream provided');
            return false;
        }

        try {
            chunksRef.current = [];
            setRecordedBlob(null);
            setError(null);

            const supportedMimeType = getSupportedMimeType();

            const recorderOptions = {
                mimeType: supportedMimeType,
                audioBitsPerSecond,
                videoBitsPerSecond,
            };

            const mediaRecorder = new MediaRecorder(stream, recorderOptions);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                    onDataAvailable?.(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: supportedMimeType });
                setRecordedBlob(blob);
                setIsRecording(false);
                setIsPaused(false);
                clearInterval(timerRef.current);
                onRecordingComplete?.(blob);
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setError('Recording error occurred');
                setIsRecording(false);
                clearInterval(timerRef.current);
            };

            mediaRecorder.start(timeslice);
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            return true;

        } catch (err) {
            console.error('Error starting recording:', err);
            setError(err.message);
            return false;
        }
    }, [stream, getSupportedMimeType, audioBitsPerSecond, videoBitsPerSecond, timeslice, onDataAvailable, onRecordingComplete]);

    /**
     * Stop recording
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
        }
    }, [isRecording]);

    /**
     * Pause recording
     */
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
        }
    }, [isRecording, isPaused]);

    /**
     * Resume recording
     */
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            // Restart timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        }
    }, [isRecording, isPaused]);

    /**
     * Reset recording state
     */
    const resetRecording = useCallback(() => {
        setRecordedBlob(null);
        setRecordingTime(0);
        setError(null);
        chunksRef.current = [];
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [isRecording]);

    return {
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        isRecording,
        isPaused,
        recordingTime,
        recordedBlob,
        error,
        mediaRecorder: mediaRecorderRef.current,
    };
};

/**
 * Hook for recording and uploading to S3
 * 
 * @param {MediaStream} stream - The media stream to record
 * @param {object} options - Recording and upload options
 * @returns {object} Recording and upload controls
 */
export const useRecordAndUpload = (stream, options = {}) => {
    const {
        meetingId,
        userId,
        userName,
        autoUpload = false,
        ...recorderOptions
    } = options;

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileInfo, setUploadedFileInfo] = useState(null);

    const { uploadFile } = useS3Files();

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
        error: recordError,
    } = useMediaRecorder(stream, {
        ...recorderOptions,
        onRecordingComplete: async (blob) => {
            console.log('Recording complete, blob size:', blob.size);

            if (autoUpload) {
                await uploadRecording(blob);
            }

            recorderOptions.onRecordingComplete?.(blob);
        },
    });

    /**
     * Upload recording to S3
     */
    const uploadRecording = useCallback(async (blob = recordedBlob) => {
        if (!blob) {
            console.error('No recording to upload');
            return null;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create a File object from Blob
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `recording-${timestamp}.webm`;
            const file = new File([blob], fileName, { type: blob.type });

            // Upload to S3
            const result = await uploadFile(
                file,
                meetingId,
                userId,
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            if (result.success) {
                setUploadedFileInfo({
                    ...result,
                    duration: recordingTime,
                    recordedBy: userName,
                    timestamp: new Date().toISOString(),
                });

                setIsUploading(false);
                return result;
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (err) {
            console.error('Error uploading recording:', err);
            setIsUploading(false);
            return { success: false, error: err.message };
        }
    }, [recordedBlob, uploadFile, meetingId, userId, userName, recordingTime]);

    /**
     * Download recording locally
     */
    const downloadRecording = useCallback((blob = recordedBlob, filename = null) => {
        if (!blob) {
            console.error('No recording to download');
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [recordedBlob]);

    return {
        // Recording controls
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,

        // Recording state
        isRecording,
        isPaused,
        recordingTime,
        recordedBlob,
        recordError,

        // Upload controls
        uploadRecording,
        downloadRecording,

        // Upload state
        isUploading,
        uploadProgress,
        uploadedFileInfo,
    };
};

/**
 * Format recording time to HH:MM:SS
 */
export const formatRecordingTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hrs, mins, secs]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
};

export default useMediaRecorder;
