/**
 * CloudMeetX - Generate S3 Presigned Upload URL
 * 
 * Generates a presigned URL for uploading files to S3
 * 
 * Request body:
 * {
 *   "fileName": "document.pdf",
 *   "fileType": "application/pdf",
 *   "meetingId": "abc123",         // Optional
 *   "userId": "user456",           // Optional
 *   "expiresIn": 3600             // Optional, seconds (default: 3600)
 * }
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

const BUCKET_NAME = process.env.BUCKET_NAME || 'cloudmeetx-files';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const DEFAULT_EXPIRATION = 3600; // 1 hour

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

// Allowed file types
const ALLOWED_MIME_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',

    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',

    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/webm',

    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
];

export const handler = async (event) => {
    console.log('Generate upload URL event:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (error) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }

        const { fileName, fileType, meetingId, userId, expiresIn = DEFAULT_EXPIRATION } = body;

        // Validate required fields
        if (!fileName || !fileType) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required fields: fileName, fileType'
                })
            };
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(fileType)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid file type',
                    allowedTypes: ALLOWED_MIME_TYPES
                })
            };
        }

        // Validate expiration time
        const expirationSeconds = Math.min(Math.max(parseInt(expiresIn) || DEFAULT_EXPIRATION, 60), 86400);

        // Sanitize filename
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Generate unique file key
        const fileId = randomUUID();
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Construct S3 key with organized folder structure
        let s3Key;
        if (meetingId) {
            s3Key = `meetings/${meetingId}/${timestamp}/${fileId}-${sanitizedFileName}`;
        } else if (userId) {
            s3Key = `users/${userId}/${timestamp}/${fileId}-${sanitizedFileName}`;
        } else {
            s3Key = `uploads/${timestamp}/${fileId}-${sanitizedFileName}`;
        }

        // Create metadata
        const metadata = {
            uploadedBy: userId || 'anonymous',
            originalFileName: fileName,
            fileId,
            uploadTimestamp: new Date().toISOString(),
            ...(meetingId && { meetingId })
        };

        // Generate presigned URL for PUT operation
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType,
            Metadata: metadata,
            // Server-side encryption
            ServerSideEncryption: 'AES256',
            // Optional: Add tagging for cost tracking
            Tagging: `FileId=${fileId}&UploadedBy=${userId || 'anonymous'}`
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: expirationSeconds
        });

        console.log('Upload URL generated:', { fileId, s3Key });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Upload URL generated successfully',
                uploadUrl,
                fileId,
                s3Key,
                expiresIn: expirationSeconds,
                expiresAt: new Date(Date.now() + expirationSeconds * 1000).toISOString(),
                metadata: {
                    fileName: sanitizedFileName,
                    fileType,
                    maxSize: MAX_FILE_SIZE,
                    maxSizeReadable: `${MAX_FILE_SIZE / (1024 * 1024)} MB`
                }
            })
        };

    } catch (error) {
        console.error('Error generating upload URL:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate upload URL',
                message: error.message
            })
        };
    }
};
