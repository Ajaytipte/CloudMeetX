/**
 * CloudMeetX - Join Meeting Lambda Function
 * 
 * Adds a participant to an existing meeting
 * 
 * Request body:
 * {
 *   "meetingId": "abc123def456",
 *   "userId": "user789",
 *   "userName": "Jane Smith"
 * }
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const MEETINGS_TABLE = process.env.MEETINGS_TABLE || 'CloudMeetX-Meetings';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (event) => {
    console.log('Join meeting event:', JSON.stringify(event, null, 2));

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

        const { meetingId, userId, userName } = body;

        // Validate required fields
        if (!meetingId || !userId || !userName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required fields: meetingId, userId, userName'
                })
            };
        }

        // Get meeting details
        const getCommand = new GetCommand({
            TableName: MEETINGS_TABLE,
            Key: { meetingId }
        });

        const result = await docClient.send(getCommand);

        if (!result.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Meeting not found',
                    meetingId
                })
            };
        }

        const meeting = result.Item;

        // Check if meeting is active or scheduled
        if (meeting.status === 'ended') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Meeting has ended',
                    meetingId
                })
            };
        }

        // Check max participants limit
        const currentParticipants = meeting.participants || [];
        if (currentParticipants.length >= meeting.maxParticipants) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Meeting is full',
                    maxParticipants: meeting.maxParticipants
                })
            };
        }

        // Check if user already joined
        const existingParticipant = currentParticipants.find(p => p.userId === userId);
        if (existingParticipant) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Already joined',
                    meeting: {
                        meetingId,
                        title: meeting.title,
                        hostName: meeting.hostName,
                        status: meeting.status,
                        participantCount: currentParticipants.length
                    }
                })
            };
        }

        // Add participant
        const participant = {
            userId,
            userName,
            joinedAt: new Date().toISOString(),
            status: 'joined'
        };

        const updateCommand = new UpdateCommand({
            TableName: MEETINGS_TABLE,
            Key: { meetingId },
            UpdateExpression: 'SET participants = list_append(if_not_exists(participants, :empty_list), :participant), participantCount = participantCount + :inc, #status = :active, updatedAt = :timestamp',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':participant': [participant],
                ':empty_list': [],
                ':inc': 1,
                ':active': 'active',
                ':timestamp': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        });

        const updateResult = await docClient.send(updateCommand);
        const updatedMeeting = updateResult.Attributes;

        console.log('User joined meeting:', { meetingId, userId, userName });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Joined meeting successfully',
                meeting: {
                    meetingId,
                    title: updatedMeeting.title,
                    description: updatedMeeting.description,
                    hostId: updatedMeeting.hostId,
                    hostName: updatedMeeting.hostName,
                    status: updatedMeeting.status,
                    participantCount: updatedMeeting.participantCount,
                    participants: updatedMeeting.participants,
                    scheduledAt: updatedMeeting.scheduledAt,
                    duration: updatedMeeting.duration
                }
            })
        };

    } catch (error) {
        console.error('Error joining meeting:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to join meeting',
                message: error.message
            })
        };
    }
};
