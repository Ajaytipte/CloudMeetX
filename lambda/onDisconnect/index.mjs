/**
 * CloudMeetX - onDisconnect Lambda Function
 * 
 * This function is triggered when a WebSocket client disconnects from the API Gateway.
 * It removes the connectionId from DynamoDB and optionally notifies other users in the meeting.
 * 
 * Event structure:
 * - connectionId: Unique WebSocket connection identifier to be removed
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    DeleteCommand,
    GetCommand
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client with explicit region
const REGION = process.env.REGION || process.env.AWS_REGION || 'ap-south-1';
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'CloudMeetXConnections';

export const handler = async (event) => {
    console.log('onDisconnect event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
        console.error('Missing connectionId');
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing connectionId' })
        };
    }

    try {
        // Optional: Get connection data before deleting (for notifications)
        let connectionData = null;
        try {
            const getCommand = new GetCommand({
                TableName: TABLE_NAME,
                Key: { connectionId }
            });

            const result = await docClient.send(getCommand);
            connectionData = result.Item;

            if (connectionData) {
                console.log('Disconnecting user:', {
                    userId: connectionData.userId,
                    userName: connectionData.userName,
                    meetingId: connectionData.meetingId
                });
            }
        } catch (getError) {
            console.warn('Could not retrieve connection data:', getError.message);
            // Continue with deletion even if get fails
        }

        // Delete connection from DynamoDB
        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { connectionId }
        });

        await docClient.send(deleteCommand);

        console.log('Connection deleted successfully:', connectionId);

        // TODO: Optionally notify other users in the meeting that this user left
        // This would require querying for other connections in the same meetingId
        // and sending them a 'user-left' message

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Disconnected successfully',
                connectionId
            })
        };

    } catch (error) {
        console.error('Error deleting connection:', error);

        // Still return 200 to acknowledge the disconnect
        // API Gateway expects 200 for successful disconnection
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Disconnection processed',
                error: error.message
            })
        };
    }
};
