/**
 * CloudMeetX - sendMessage Lambda Function
 * 
 * This function handles sending WebSocket messages to specific users or broadcast to all
 * users in a meeting. It fetches target connectionIds from DynamoDB and uses the
 * ApiGatewayManagementApi to send messages.
 * 
 * Message body structure:
 * {
 *   "action": "sendMessage",
 *   "targetUserId": "user123",        // Optional: specific user
 *   "targetConnectionId": "abc123",   // Optional: specific connection
 *   "meetingId": "meeting456",        // Optional: broadcast to all in meeting
 *   "messageType": "chat|signal|event",
 *   "data": { ... }                    // Message payload
 * }
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    ScanCommand,
    GetCommand
} from '@aws-sdk/lib-dynamodb';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';

// Initialize DynamoDB client with explicit region
const REGION = process.env.REGION || process.env.AWS_REGION || 'ap-south-1';
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME || 'CloudMeetXConnections';

export const handler = async (event) => {
    console.log('sendMessage event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    // Initialize API Gateway Management API client
    const apiGatewayClient = new ApiGatewayManagementApiClient({
        region: REGION,
        endpoint: `https://${domain}/${stage}`
    });

    let body;
    try {
        body = JSON.parse(event.body || "{}");
    } catch (error) {
        console.error('Invalid JSON in request body:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Invalid JSON in request body'
            })
        };
    }

    const {
        targetUserId,
        targetConnectionId,
        meetingId,
        messageType = 'message',
        data
    } = body;

    // Validate message data
    if (!data) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing required field: data'
            })
        };
    }

    try {
        // Get sender's connection data
        let senderData = null;
        try {
            const senderCommand = new GetCommand({
                TableName: TABLE_NAME,
                Key: { connectionId }
            });

            const senderResult = await docClient.send(senderCommand);
            senderData = senderResult.Item;
        } catch (error) {
            console.warn('Could not fetch sender data:', error.message);
        }

        // Prepare message payload
        const messagePayload = {
            type: messageType,
            from: {
                connectionId: connectionId,
                userId: senderData?.userId,
                userName: senderData?.userName
            },
            data,
            timestamp: new Date().toISOString()
        };

        let targetConnections = [];

        // Determine target connections
        if (targetConnectionId) {
            // Send to specific connection
            targetConnections = [{ connectionId: targetConnectionId }];

        } else if (targetUserId) {
            // Send to specific user (find their connectionId)
            targetConnections = await findUserConnections(targetUserId);

        } else if (meetingId) {
            // Broadcast to all in meeting
            targetConnections = await findMeetingConnections(meetingId, connectionId);

        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Must specify targetUserId, targetConnectionId, or meetingId'
                })
            };
        }

        // Send message to all target connections
        const results = await Promise.allSettled(
            targetConnections.map(target =>
                sendToConnection(apiGatewayClient, target.connectionId, messagePayload)
            )
        );

        // Count successes and failures
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Message sent: ${successful} successful, ${failed} failed`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Message sent',
                sent: successful,
                failed
            })
        };

    } catch (error) {
        console.error('Error sending message:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to send message',
                error: error.message
            })
        };
    }
};

/**
 * Find all connections for a specific user
 */
async function findUserConnections(userId) {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    });

    const result = await docClient.send(command);
    return result.Items || [];
}

/**
 * Find all connections in a meeting (excluding sender)
 */
async function findMeetingConnections(meetingId, excludeConnectionId) {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'meetingId = :meetingId AND connectionId <> :excludeId',
        ExpressionAttributeValues: {
            ':meetingId': meetingId,
            ':excludeId': excludeConnectionId
        }
    });

    const result = await docClient.send(command);
    return result.Items || [];
}

/**
 * Send message to a specific connection
 * Handles stale connections by catching GoneException
 */
async function sendToConnection(apiGatewayClient, connectionId, data) {
    try {
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: JSON.stringify(data)
        });

        await apiGatewayClient.send(command);
        console.log(`Message sent to connection: ${connectionId}`);

    } catch (error) {
        if (error.name === 'GoneException') {
            // Connection is stale, remove from DynamoDB
            console.log(`Stale connection detected: ${connectionId}, removing...`);
            await removeStaleConnection(connectionId);
        }
        throw error;
    }
}

/**
 * Remove stale connection from DynamoDB
 */
async function removeStaleConnection(connectionId) {
    try {
        const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { connectionId }
        });

        await docClient.send(command);
        console.log(`Removed stale connection: ${connectionId}`);
    } catch (error) {
        console.error(`Failed to remove stale connection: ${connectionId}`, error);
    }
}
