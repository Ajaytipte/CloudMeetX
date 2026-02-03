/**
 * useFileUpload Hook
 * Manages file upload state and logic
 */

import { useState, useCallback } from 'react';
import { uploadFile, validateFile } from '../utils/s3Upload';

const useFileUpload = (meetingId, options = {}) => {
    const {
        maxSizeMB = 50,
        allowedTypes = [],
        onUploadComplete,
        onUploadError
    } = options;

    const [uploads, setUploads] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    // Add file to upload queue
    const addFile = useCallback((file) => {
        const uploadId = Date.now() + Math.random();

        const newUpload = {
            id: uploadId,
            file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            progress: 0,
            status: 'pending', // pending, uploading, success, error
            error: null,
            fileUrl: null
        };

        setUploads(prev => [...prev, newUpload]);
        return uploadId;
    }, []);

    // Update upload progress
    const updateProgress = useCallback((uploadId, progress) => {
        setUploads(prev => prev.map(upload =>
            upload.id === uploadId
                ? { ...upload, progress, status: 'uploading' }
                : upload
        ));
    }, []);

    // Mark upload as complete
    const markComplete = useCallback((uploadId, fileUrl, key) => {
        setUploads(prev => prev.map(upload =>
            upload.id === uploadId
                ? { ...upload, status: 'success', progress: 100, fileUrl, key }
                : upload
        ));
    }, []);

    // Mark upload as failed
    const markFailed = useCallback((uploadId, error) => {
        setUploads(prev => prev.map(upload =>
            upload.id === uploadId
                ? { ...upload, status: 'error', error: error.message }
                : upload
        ));
    }, []);

    // Remove upload from list
    const removeUpload = useCallback((uploadId) => {
        setUploads(prev => prev.filter(upload => upload.id !== uploadId));
    }, []);

    // Upload single file
    const uploadSingleFile = useCallback(async (file) => {
        // Validate file
        const validation = validateFile(file, maxSizeMB, allowedTypes);
        if (!validation.isValid) {
            const error = new Error(validation.errors.join(', '));
            if (onUploadError) {
                onUploadError(error, file);
            }
            throw error;
        }

        const uploadId = addFile(file);

        try {
            // Upload to S3
            const result = await uploadFile(
                file,
                meetingId,
                (progress) => updateProgress(uploadId, progress)
            );

            // Mark as complete
            markComplete(uploadId, result.fileUrl, result.key);

            // Callback
            if (onUploadComplete) {
                onUploadComplete(result);
            }

            return result;
        } catch (error) {
            markFailed(uploadId, error);

            if (onUploadError) {
                onUploadError(error, file);
            }

            throw error;
        }
    }, [meetingId, maxSizeMB, allowedTypes, onUploadComplete, onUploadError, addFile, updateProgress, markComplete, markFailed]);

    // Upload multiple files
    const uploadFiles = useCallback(async (files) => {
        setIsUploading(true);

        try {
            const uploadPromises = Array.from(files).map(file =>
                uploadSingleFile(file).catch(error => {
                    console.error('Error uploading file:', file.name, error);
                    return null;
                })
            );

            const results = await Promise.all(uploadPromises);
            return results.filter(result => result !== null);
        } finally {
            setIsUploading(false);
        }
    }, [uploadSingleFile]);

    // Clear completed uploads
    const clearCompleted = useCallback(() => {
        setUploads(prev => prev.filter(upload => upload.status !== 'success'));
    }, []);

    // Clear all uploads
    const clearAll = useCallback(() => {
        setUploads([]);
    }, []);

    // Retry failed upload
    const retryUpload = useCallback(async (uploadId) => {
        const upload = uploads.find(u => u.id === uploadId);
        if (!upload) return;

        // Remove old upload
        removeUpload(uploadId);

        // Try again
        return uploadSingleFile(upload.file);
    }, [uploads, removeUpload, uploadSingleFile]);

    return {
        uploads,
        isUploading,
        uploadFiles,
        uploadSingleFile,
        removeUpload,
        clearCompleted,
        clearAll,
        retryUpload
    };
};

export default useFileUpload;
