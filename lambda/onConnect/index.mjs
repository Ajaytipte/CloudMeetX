/**
 * CloudMeetX - onConnect Lambda Function
 * 
 * This function is triggered when a WebSocket client connects to the API Gateway.
 * It stores the connectionId and meetingId in DynamoDB for later message routing.
 * 
 * Event structure:
 * - connectionId: Unique WebSocket connection identifier
 * - queryStringParameters.meetingId: Meeting room identifier
 * - queryStringParameters.userId: User identifier (optional)
 * - queryStringParameters.userName: User display name (optional)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client with explicit region
const REGION = process.env.REGION || process.env.AWS_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'CloudMeetXConnections';

export const handler = async (event) => {
    console.log('onConnect event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const meetingId = event.queryStringParameters?.meetingId;
    const userId = event.queryStringParameters?.userId;
    const userName = event.queryStringParameters?.userName || 'Anonymous';

    // Validate required parameters
    if (!meetingId) {
        console.error('Missing required parameter: meetingId');
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing required parameter: meetingId'
            })
        };
    }

    // Prepare connection data
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    const connectionData = {
        connectionId,
        meetingId,
        userId: userId || connectionId, // Use connectionId as fallback userId
        userName,
        connectedAt: timestamp,
        ttl, // Auto-expire old connections
        status: 'connected'
    };

    try {
        // Store connection in DynamoDB
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: connectionData
        });

        await docClient.send(command);

        console.log('Connection stored successfully:', connectionData);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Connected successfully',
                connectionId,
                meetingId
            })
        };

    } catch (error) {
        console.error('Error storing connection:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to connect',
                error: error.message
            })
        };
    }
};
