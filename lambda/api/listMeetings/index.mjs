/**
 * CloudMeetX - List Meetings Lambda Function
 * 
 * Lists meetings with optional filters
 * 
 * Query parameters:
 * - userId: Filter by host or participant
 * - status: Filter by status (scheduled, active, ended)
 * - limit: Number of results (default: 20, max: 100)
 * - lastKey: For pagination
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    ScanCommand,
    QueryCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const MEETINGS_TABLE = process.env.MEETINGS_TABLE || 'CloudMeetX-Meetings';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

export const handler = async (event) => {
    console.log('List meetings event:', JSON.stringify(event, null, 2));

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Get query parameters
        const params = event.queryStringParameters || {};
        const userId = params.userId;
        const status = params.status;
        const limit = Math.min(parseInt(params.limit || '20'), 100);
        const lastKey = params.lastKey ? JSON.parse(decodeURIComponent(params.lastKey)) : null;

        let filterExpression = [];
        let expressionAttributeNames = {};
        let expressionAttributeValues = {};

        // Build filter expression
        if (userId) {
            filterExpression.push('(hostId = :userId OR contains(participants, :userId))');
            expressionAttributeValues[':userId'] = userId;
        }

        if (status) {
            filterExpression.push('#status = :status');
            expressionAttributeNames['#status'] = 'status';
            expressionAttributeValues[':status'] = status;
        }

        // Scan parameters
        const scanParams = {
            TableName: MEETINGS_TABLE,
            Limit: limit,
            ...(lastKey && { ExclusiveStartKey: lastKey }),
            ...(filterExpression.length > 0 && {
                FilterExpression: filterExpression.join(' AND '),
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues
            })
        };

        // Execute scan
        const command = new ScanCommand(scanParams);
        const result = await docClient.send(command);

        // Transform meetings for response
        const meetings = (result.Items || []).map(meeting => ({
            meetingId: meeting.meetingId,
            title: meeting.title,
            description: meeting.description,
            hostId: meeting.hostId,
            hostName: meeting.hostName,
            status: meeting.status,
            scheduledAt: meeting.scheduledAt,
            duration: meeting.duration,
            participantCount: meeting.participantCount || 0,
            maxParticipants: meeting.maxParticipants,
            createdAt: meeting.createdAt,
            updatedAt: meeting.updatedAt
        }));

        // Sort by createdAt (newest first)
        meetings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination info
        const nextKey = result.LastEvaluatedKey
            ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
            : null;

        console.log(`Listed ${meetings.length} meetings`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                meetings,
                count: meetings.length,
                nextKey,
                hasMore: !!result.LastEvaluatedKey
            })
        };

    } catch (error) {
        console.error('Error listing meetings:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to list meetings',
                message: error.message
            })
        };
    }
};
