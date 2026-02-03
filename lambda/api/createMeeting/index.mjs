import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomBytes } from 'crypto';

// Use REGION env var or fallback to Lambda's region
const REGION = process.env.REGION || process.env.AWS_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Environment Variables
const MEETINGS_TABLE = process.env.MEETINGS_TABLE || 'CloudMeetXMeetings';
const DEFAULT_MEETING_DURATION = parseInt(process.env.DEFAULT_MEETING_DURATION || '60');

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (event) => {
    // Log configuration for debugging (Remove in production if sensitive)
    console.log('Function Config:', {
        region: REGION,
        tableName: MEETINGS_TABLE,
        meetingDuration: DEFAULT_MEETING_DURATION
    });

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        console.log('Incoming Event:', JSON.stringify(event, null, 2));

        const body = JSON.parse(event.body || '{}');
        const { title, hostId, hostName, description = '' } = body;

        // Validation
        if (!title || !hostId) {
            console.error('Validation Error: Missing title or hostId');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: title, hostId' })
            };
        }

        const meetingId = randomBytes(4).toString('hex'); // e.g. "a1b2c3d4"
        const timestamp = new Date().toISOString();

        // TTL: 7 days
        const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

        const meeting = {
            meetingId,
            title,
            description,
            hostId,
            hostName: hostName || 'Anonymous',
            startTime: timestamp,
            duration: DEFAULT_MEETING_DURATION,
            status: 'active',
            createdAt: timestamp,
            ttl
        };

        console.log('Attempting to write to DynamoDB:', {
            TableName: MEETINGS_TABLE,
            Item: meeting
        });

        await docClient.send(new PutCommand({
            TableName: MEETINGS_TABLE,
            Item: meeting
        }));

        console.log(`Meeting created successfully: ${meetingId}`);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Meeting created successfully',
                meetingId,
                meeting
            })
        };

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        console.error('Error Stack:', error.stack);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal Server Error',
                details: error.message,
                suggestion: 'Check CloudWatch logs for DynamoDB permission or table name errors.'
            })
        };
    }
};
