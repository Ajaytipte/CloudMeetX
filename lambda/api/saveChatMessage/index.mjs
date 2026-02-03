import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Environment Variables
const MESSAGES_TABLE = process.env.MESSAGES_TABLE || 'CloudMeetXMessages';

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
        const { meetingId, userId, userName, content, type = 'text' } = body;

        // Validation
        if (!meetingId || !userId || !content) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: meetingId, userId, content' })
            };
        }

        const messageId = randomUUID();
        const timestamp = new Date().toISOString();

        // TTL: 30 days
        const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

        const message = {
            messageId,
            meetingId,
            userId,
            userName: userName || 'Anonymous',
            content,
            type, // 'text', 'file', 'image'
            timestamp,
            ttl
        };

        await docClient.send(new PutCommand({
            TableName: MESSAGES_TABLE,
            Item: message
        }));

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Chat message saved',
                data: message
            })
        };

    } catch (error) {
        console.error('Error saving chat message:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
