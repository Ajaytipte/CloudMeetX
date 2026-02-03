# REST API Deployment Instructions

Follow these steps to deploy the CloudMeetX REST API on AWS.

## 1. Create DynamoDB Tables

Create two tables in **us-east-1** (or your region):

1.  **Table Name**: `CloudMeetXMeetings`
    *   **Partition Key**: `meetingId` (String)
2.  **Table Name**: `CloudMeetXMessages`
    *   **Partition Key**: `meetingId` (String)
    *   **Sort Key**: `timestamp` (String)

## 2. Create S3 Bucket

Create a bucket for file storage:
*   **Bucket Name**: `cloudmeetx-files` (must be globally unique, change if taken)
*   **CORS Configuration**:
    ```json
    [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["PUT", "GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": []
        }
    ]
    ```

## 3. Deploy Lambda Functions

Create 3 Lambda functions (Runtime: **Node.js 18.x** or newer) and upload the code provided in the `api/` folder.

### Function 1: `createMeeting`
*   **Code**: `createMeeting/index.mjs`
*   **Env Variables**:
    *   `MEETINGS_TABLE`: `CloudMeetXMeetings`
    *   `DEFAULT_MEETING_DURATION`: `60`
    *   `REGION`: `us-east-1`
*   **Permissions**: Add `DynamoDBFullAccess` (or specific `PutItem` policy).

### Function 2: `saveChatMessage`
*   **Code**: `saveChatMessage/index.mjs`
*   **Env Variables**:
    *   `MESSAGES_TABLE`: `CloudMeetXMessages`
    *   `REGION`: `us-east-1`
*   **Permissions**: Add `DynamoDBFullAccess`.

### Function 3: `generatePresignedUrl`
*   **Code**: `generatePresignedUrl/index.mjs`
*   **Env Variables**:
    *   `UPLOAD_BUCKET`: `cloudmeetx-files`
    *   `EXPIRY_SECONDS`: `3600`
    *   `REGION`: `us-east-1`
*   **Permissions**: Add `AmazonS3FullAccess` (or `PutObject` policy).

## 4. Setup API Gateway (HTTP API)

1.  Go to **API Gateway** -> **Create API** -> **HTTP API**.
2.  **API Name**: `CloudMeetX-REST-API`.
3.  **Add Routes**:
    *   `POST /createMeeting` -> Select `createMeeting` Lambda.
    *   `POST /saveChatMessage` -> Select `saveChatMessage` Lambda.
    *   `POST /generatePresignedUrl` -> Select `generatePresignedUrl` Lambda.
4.  **CORS Configuration** (in API Gateway settings):
    *   **Allowed Origins**: `*` (or your frontend URL)
    *   **Allowed Headers**: `Content-Type,Authorization`
    *   **Allowed Methods**: `POST,OPTIONS`

## 5. Update Frontend Config

After deployment, copy the **Invoke URL** (e.g., `https://abc12345.execute-api.us-east-1.amazonaws.com`) and update your frontend:

`src/config/api.js`:
```javascript
export const API_BASE_URL = 'https://abc12345.execute-api.us-east-1.amazonaws.com';
```
