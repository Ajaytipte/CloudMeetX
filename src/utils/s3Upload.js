/**
 * AWS S3 Upload Utilities
 * Handles pre-signed URL generation and file uploads to S3
 */

// Get pre-signed URL from your backend
export const getPresignedUrl = async (fileName, fileType, meetingId) => {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/upload/presigned-url`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName,
                    fileType,
                    meetingId
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get pre-signed URL');
        }

        const data = await response.json();

        // Expected response format:
        // {
        //   uploadUrl: 'https://bucket.s3.amazonaws.com/...',
        //   fileUrl: 'https://bucket.s3.amazonaws.com/...',
        //   key: 'meetings/meeting-id/file-name'
        // }

        return data;
    } catch (error) {
        console.error('❌ Error getting pre-signed URL:', error);
        throw error;
    }
};

// Upload file to S3 using pre-signed URL
export const uploadToS3 = async (file, presignedUrl, onProgress) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (onProgress) {
                    onProgress(percentComplete);
                }
            }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                console.log('✅ File uploaded successfully');
                resolve();
            } else {
                console.error('❌ Upload failed:', xhr.statusText);
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
            console.error('❌ Upload error');
            reject(new Error('Upload failed'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
            console.log('⏹️ Upload aborted');
            reject(new Error('Upload aborted'));
        });

        // Open connection and send file
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
};

// Complete upload flow
export const uploadFile = async (file, meetingId, onProgress) => {
    try {
        // Step 1: Get pre-signed URL
        console.log('📝 Getting pre-signed URL for:', file.name);
        const { uploadUrl, fileUrl, key } = await getPresignedUrl(
            file.name,
            file.type,
            meetingId
        );

        // Step 2: Upload to S3
        console.log('📤 Uploading file to S3...');
        await uploadToS3(file, uploadUrl, onProgress);

        // Step 3: Return file URL
        console.log('✅ Upload complete! File URL:', fileUrl);
        return {
            fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            key
        };
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
};

// Validate file
export const validateFile = (file, maxSizeMB = 50, allowedTypes = []) => {
    const errors = [];

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        errors.push(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check file type
    if (allowedTypes.length > 0) {
        const fileType = file.type;
        const fileExtension = file.name.split('.').pop().toLowerCase();

        const isAllowed = allowedTypes.some(type => {
            // Check MIME type
            if (fileType === type) return true;
            // Check extension
            if (type.startsWith('.') && `.${fileExtension}` === type) return true;
            // Check wildcard (e.g., 'image/*')
            if (type.endsWith('/*')) {
                const category = type.split('/')[0];
                return fileType.startsWith(category + '/');
            }
            return false;
        });

        if (!isAllowed) {
            errors.push(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return '📦';
    return '📎';
};
