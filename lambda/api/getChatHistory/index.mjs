/**
 * CloudMeetX - Get Chat History Lambda Function
 * 
 * Retrieves chat messages for a meeting with pagination
 * 
 * Query parameters:
 * - meetingId: Meeting ID (required)
 * - limit: Number of messages (default: 50, max: 100)
 * - lastKey: For pagination
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CHAT_TABLE = process.env.CHAT_TABLE || 'CloudMeetX-ChatMessages';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

export const handler = async (event) => {
    console.log('Get chat history event:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const params = event.queryStringParameters || {};
        const meetingId = params.meetingId;
        const limit = Math.min(parseInt(params.limit || '50'), 100);
        const lastKey = params.lastKey ? JSON.parse(decodeURIComponent(params.lastKey)) : null;

        if (!meetingId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required parameter: meetingId'
                })
            };
        }

        // Query messages for meeting
        const command = new QueryCommand({
            TableName: CHAT_TABLE,
            IndexName: 'meetingId-timestamp-index', // GSI on meetingId
            KeyConditionExpression: 'meetingId = :meetingId',
            ExpressionAttributeValues: {
                ':meetingId': meetingId
            },
            ScanIndexForward: false, // Sort descending (newest first)
            Limit: limit,
            ...(lastKey && { ExclusiveStartKey: lastKey })
        });

        const result = await docClient.send(command);

        const messages = (result.Items || [])
            .filter(msg => !msg.deleted)
            .map(msg => ({
                messageId: msg.messageId,
                userId: msg.userId,
                userName: msg.userName,
                message: msg.message,
                messageType: msg.messageType,
                timestamp: msg.timestamp,
                edited: msg.edited
            }));

        const nextKey = result.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
            : null;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                messages,
                count: messages.length,
                nextKey,
                hasMore: !!result.LastEvaluatedKey
            })
        };

    } catch (error) {
        console.error('Error getting chat history:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to get chat history',
                message: error.message
            })
        };
    }
};
