/**
 * CloudMeetX - Generate S3 Presigned Download URL
 * 
 * Generates a presigned URL for downloading files from S3
 * 
 * Request body:
 * {
 *   "s3Key": "meetings/abc123/2026-02-03/uuid-document.pdf",
 *   "expiresIn": 3600,      // Optional, seconds (default: 3600)
 *   "downloadAs": "my-file.pdf"  // Optional, custom filename for download
 * }
 * 
 * OR Query parameters:
 * ?s3Key=meetings/abc123/...&expiresIn=3600&downloadAs=file.pdf
 */

import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

const BUCKET_NAME = process.env.BUCKET_NAME || 'cloudmeetx-files';
const DEFAULT_EXPIRATION = 3600; // 1 hour

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

export const handler = async (event) => {
    console.log('Generate download URL event:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        let s3Key, expiresIn, downloadAs;

        // Support both POST (body) and GET (query params)
        if (event.httpMethod === 'POST') {
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

            s3Key = body.s3Key;
            expiresIn = body.expiresIn;
            downloadAs = body.downloadAs;

        } else if (event.httpMethod === 'GET') {
            // Parse query parameters
            const params = event.queryStringParameters || {};
            s3Key = params.s3Key;
            expiresIn = params.expiresIn;
            downloadAs = params.downloadAs;
        }

        // Validate required fields
        if (!s3Key) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required field: s3Key'
                })
            };
        }

        // Validate expiration time
        const expirationSeconds = Math.min(Math.max(parseInt(expiresIn) || DEFAULT_EXPIRATION, 60), 86400);

        // Check if file exists
        try {
            const headCommand = new HeadObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key
            });

            const headResult = await s3Client.send(headCommand);

            // Get file metadata
            const contentType = headResult.ContentType;
            const contentLength = headResult.ContentLength;
            const lastModified = headResult.LastModified;
            const metadata = headResult.Metadata || {};

            // Generate presigned URL for GET operation
            const commandParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key
            };

            // Add custom download filename if provided
            if (downloadAs) {
                commandParams.ResponseContentDisposition = `attachment; filename="${downloadAs}"`;
            }

            const command = new GetObjectCommand(commandParams);

            const downloadUrl = await getSignedUrl(s3Client, command, {
                expiresIn: expirationSeconds
            });

            console.log('Download URL generated:', { s3Key });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Download URL generated successfully',
                    downloadUrl,
                    s3Key,
                    expiresIn: expirationSeconds,
                    expiresAt: new Date(Date.now() + expirationSeconds * 1000).toISOString(),
                    fileInfo: {
                        contentType,
                        size: contentLength,
                        sizeReadable: formatBytes(contentLength),
                        lastModified: lastModified?.toISOString(),
                        originalFileName: metadata.originalFileName,
                        fileId: metadata.fileId,
                        uploadedBy: metadata.uploadedBy
                    }
                })
            };

        } catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        error: 'File not found',
                        s3Key
                    })
                };
            }
            throw error;
        }

    } catch (error) {
        console.error('Error generating download URL:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate download URL',
                message: error.message
            })
        };
    }
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
