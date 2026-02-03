import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const REGION = process.env.REGION || 'ap-south-1';
const s3Client = new S3Client({ region: REGION });

// Environment Variables
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET || 'cloudmeetx-files';
const EXPIRY_SECONDS = parseInt(process.env.EXPIRY_SECONDS || '3600');

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { fileName, fileType, meetingId, userId } = body;

        // Validation
        if (!fileName || !fileType) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: fileName, fileType' })
            };
        }

        // Clean filename and create unique key
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileId = randomUUID();
        const folder = meetingId ? `meetings/${meetingId}` : `users/${userId || 'public'}`;
        const key = `${folder}/${fileId}-${cleanFileName}`;

        const command = new PutObjectCommand({
            Bucket: UPLOAD_BUCKET,
            Key: key,
            ContentType: fileType,
            Metadata: {
                meetingId: meetingId || '',
                userId: userId || '',
                originalName: fileName
            }
        });

        // Generate Presigned URL
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: EXPIRY_SECONDS });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Presigned URL generated',
                uploadUrl,
                key, // Useful for storing reference in DB later
                fileUrl: `https://${UPLOAD_BUCKET}.s3.${REGION}.amazonaws.com/${key}`
            })
        };

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
