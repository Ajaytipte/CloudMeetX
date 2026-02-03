/**
 * CloudMeetX S3 File Management Hooks
 * React hooks for file upload and download with S3 presigned URLs
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod';

/**
 * Hook for S3 file operations
 */
export const useS3Files = () => {
    const [uploading, setUploading] = useState(false);
    const [downloadPreparing, setDownloadPreparing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    /**
     * Upload file to S3 using presigned URL
     * 
     * @param {File} file - File object from input
     * @param {string} meetingId - Optional meeting ID
     * @param {string} userId - Optional user ID
     * @param {function} onProgress - Optional progress callback
     * @returns {Promise<object>} - Upload result with fileId and s3Key
     */
    const uploadFile = useCallback(async (file, meetingId = null, userId = null, onProgress = null) => {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Step 1: Get presigned upload URL
            const urlResponse = await fetch(`${API_BASE_URL}/files/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    meetingId,
                    userId
                })
            });

            if (!urlResponse.ok) {
                const errorData = await urlResponse.json();
                throw new Error(errorData.error || 'Failed to get upload URL');
            }

            const { uploadUrl, fileId, s3Key, metadata } = await urlResponse.json();

            // Check file size
            if (file.size > metadata.maxSize) {
                throw new Error(`File too large. Max size: ${metadata.maxSizeReadable}`);
            }

            // Step 2: Upload file to S3
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentComplete);
                    onProgress?.(percentComplete);
                }
            });

            // Upload promise
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });

            await uploadPromise;

            console.log('File uploaded successfully:', { fileId, s3Key });

            setUploading(false);
            setUploadProgress(100);

            return {
                success: true,
                fileId,
                s3Key,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            };

        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message);
            setUploading(false);
            return { success: false, error: err.message };
        }
    }, []);

    /**
     * Get download URL for a file
     * 
     * @param {string} s3Key - S3 object key
     * @param {string} downloadAs - Optional custom filename
     * @returns {Promise<object>} - Download URL and file info
     */
    const getDownloadUrl = useCallback(async (s3Key, downloadAs = null) => {
        setDownloadPreparing(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/files/download-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    s3Key,
                    downloadAs
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get download URL');
            }

            const data = await response.json();

            setDownloadPreparing(false);

            return {
                success: true,
                downloadUrl: data.downloadUrl,
                fileInfo: data.fileInfo
            };

        } catch (err) {
            console.error('Get download URL error:', err);
            setError(err.message);
            setDownloadPreparing(false);
            return { success: false, error: err.message };
        }
    }, []);

    /**
     * Download file directly (triggers browser download)
     * 
     * @param {string} s3Key - S3 object key
     * @param {string} downloadAs - Optional custom filename
     */
    const downloadFile = useCallback(async (s3Key, downloadAs = null) => {
        const result = await getDownloadUrl(s3Key, downloadAs);

        if (result.success) {
            // Trigger download in browser
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = downloadAs || '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        return result;
    }, [getDownloadUrl]);

    return {
        uploadFile,
        getDownloadUrl,
        downloadFile,
        uploading,
        downloadPreparing,
        uploadProgress,
        error
    };
};

export default useS3Files;
