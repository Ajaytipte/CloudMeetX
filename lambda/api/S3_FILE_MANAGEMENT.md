# CloudMeetX S3 File Management - Lambda Functions

AWS Lambda functions for generating S3 presigned URLs for secure file uploads and downloads.

## 📁 Structure

```
lambda/api/
├── generateUploadUrl/
│   ├── index.mjs
│   └── package.json
└── generateDownloadUrl/
    ├── index.mjs
    └── package.json
```

## 🗄️ S3 Bucket

**Bucket Name**: `cloudmeetx-files`

**Folder Structure**:
```
cloudmeetx-files/
├── meetings/{meetingId}/{date}/{fileId}-{filename}
├── users/{userId}/{date}/{fileId}-{filename}
└── uploads/{date}/{fileId}-{filename}
```

## 🔌 API Endpoints

### 1. Generate Upload URL

**Endpoint**: `POST /files/upload-url`

**Request**:
```json
{
  "fileName": "presentation.pdf",
  "fileType": "application/pdf",
  "meetingId": "abc123",        // Optional
  "userId": "user456",          // Optional
  "expiresIn": 3600            // Optional, seconds (default: 3600)
}
```

**Response** (200):
```json
{
  "message": "Upload URL generated successfully",
  "uploadUrl": "https://cloudmeetx-files.s3.ap-south-1.amazonaws.com/...",
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "s3Key": "meetings/abc123/2026-02-03/550e8400-...-presentation.pdf",
  "expiresIn": 3600,
  "expiresAt": "2026-02-03T14:00:00Z",
  "metadata": {
    "fileName": "presentation.pdf",
    "fileType": "application/pdf",
    "maxSize": 104857600,
    "maxSizeReadable": "100 MB"
  }
}
```

### 2. Generate Download URL

**Endpoint**: `POST /files/download-url` or `GET /files/download-url`

**Request** (POST):
```json
{
  "s3Key": "meetings/abc123/2026-02-03/550e8400-...-presentation.pdf",
  "expiresIn": 3600,           // Optional
  "downloadAs": "my-file.pdf"  // Optional
}
```

**Request** (GET):
```
GET /files/download-url?s3Key=meetings/abc123/...&downloadAs=file.pdf
```

**Response** (200):
```json
{
  "message": "Download URL generated successfully",
  "downloadUrl": "https://cloudmeetx-files.s3.ap-south-1.amazonaws.com/...",
  "s3Key": "meetings/abc123/2026-02-03/550e8400-...-presentation.pdf",
  "expiresIn": 3600,
  "expiresAt": "2026-02-03T14:00:00Z",
  "fileInfo": {
    "contentType": "application/pdf",
    "size": 524288,
    "sizeReadable": "512 KB",
    "lastModified": "2026-02-03T12:00:00Z",
    "originalFileName": "presentation.pdf",
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "uploadedBy": "user456"
  }
}
```

## 📋 Allowed File Types

### Documents
- PDF: `application/pdf`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- PowerPoint: `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- Text: `text/plain`, `text/csv`

### Images
- JPEG/JPG: `image/jpeg`, `image/jpg`
- PNG: `image/png`
- GIF: `image/gif`
- WebP: `image/webp`
- SVG: `image/svg+xml`

### Videos
- MP4: `video/mp4`
- WebM: `video/webm`
- QuickTime: `video/quicktime`

### Audio
- MP3: `audio/mpeg`
- WAV: `audio/wav`
- WebM: `audio/webm`

### Archives
- ZIP: `application/zip`, `application/x-zip-compressed`
- RAR: `application/x-rar-compressed`

## 🚀 Deployment

### Prerequisites

1. **Create S3 Bucket**:
```bash
aws s3 mb s3://cloudmeetx-files --region ap-south-1

# Configure CORS
aws s3api put-bucket-cors \
  --bucket cloudmeetx-files \
  --cors-configuration file://s3-cors.json

# Enable versioning (optional)
aws s3api put-bucket-versioning \
  --bucket cloudmeetx-files \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket cloudmeetx-files \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

2. **S3 CORS Configuration** (`s3-cors.json`):
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Deploy Lambda Functions

```bash
# Install dependencies
cd lambda/api/generateUploadUrl
npm install
cd ../generateDownloadUrl
npm install
cd ..

# Create deployment packages
cd generateUploadUrl
zip -r generateUploadUrl.zip index.mjs node_modules package.json
cd ../generateDownloadUrl
zip -r generateDownloadUrl.zip index.mjs node_modules package.json

# Deploy to AWS
aws lambda create-function \
  --function-name CloudMeetX-GenerateUploadUrl \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/CloudMeetX-Lambda-Role \
  --handler index.handler \
  --zip-file fileb://generateUploadUrl/generateUploadUrl.zip \
  --timeout 10 \
  --memory-size 256 \
  --environment Variables={BUCKET_NAME=cloudmeetx-files,AWS_REGION=ap-south-1}

aws lambda create-function \
  --function-name CloudMeetX-GenerateDownloadUrl \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/CloudMeetX-Lambda-Role \
  --handler index.handler \
  --zip-file fileb://generateDownloadUrl/generateDownloadUrl.zip \
  --timeout 10 \
  --memory-size 256 \
  --environment Variables={BUCKET_NAME=cloudmeetx-files,AWS_REGION=ap-south-1}
```

### IAM Permissions

Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:HeadObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cloudmeetx-files/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## 💻 Frontend Integration

### React Hook

```javascript
import { useS3Files } from './hooks/useS3Files';

const MyComponent = () => {
  const { uploadFile, downloadFile, uploading, uploadProgress } = useS3Files();

  const handleUpload = async (file) => {
    const result = await uploadFile(file, meetingId, userId);
    
    if (result.success) {
      console.log('Uploaded:', result.fileId);
      // Save result.s3Key to your database
    }
  };

  const handleDownload = async (s3Key) => {
    await downloadFile(s3Key, 'custom-filename.pdf');
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <p>Progress: {uploadProgress}%</p>}
    </div>
  );
};
```

### Direct Upload Flow

1. **Get presigned URL from Lambda**
2. **Upload file directly to S3 using PUT request**
3. **Save file metadata (fileId, s3Key) to your database**

```javascript
// Step 1: Get upload URL
const response = await fetch('/api/files/upload-url', {
  method: 'POST',
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    meetingId: 'abc123'
  })
});

const { uploadUrl, fileId, s3Key } = await response.json();

// Step 2: Upload to S3
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file
});

// Step 3: Save metadata
await saveToDatabase({ fileId, s3Key, meetingId, fileName: file.name });
```

## 🔒 Security Features

### Upload URL Lambda
- ✅ File type validation
- ✅ File name sanitization
- ✅ Unique file IDs (UUID)
- ✅ Server-side encryption (AES256)
- ✅ Expiration time limits (60s - 24h)
- ✅ Metadata tracking
- ✅ Organized folder structure
- ✅ File tagging for cost tracking

### Download URL Lambda
- ✅ File existence check
- ✅ Metadata retrieval
- ✅ Custom download filenames
- ✅ Expiration time limits
- ✅ Error handling (404 for missing files)

## 📊 File Size Limits

- **Max file size**: 100 MB (configurable)
- **Presigned URL expiration**: 1 hour (default)
- **Max expiration**: 24 hours
- **Min expiration**: 60 seconds

## 🧪 Testing

### Test Upload URL Generation

```bash
curl -X POST https://YOUR-API.../prod/files/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.pdf",
    "fileType": "application/pdf",
    "meetingId": "test123"
  }'
```

### Test File Upload

```bash
# Get upload URL
UPLOAD_URL=$(curl -s -X POST ... | jq -r '.uploadUrl')

# Upload file
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary @test.pdf
```

### Test Download URL Generation

```bash
curl -X POST https://YOUR-API.../prod/files/download-url \
  -H "Content-Type: application/json" \
  -d '{
    "s3Key": "meetings/test123/2026-02-03/uuid-test.pdf"
  }'
```

## 📈 Monitoring

### CloudWatch Logs

```bash
# View upload function logs
aws logs tail /aws/lambda/CloudMeetX-GenerateUploadUrl --follow

# View download function logs
aws logs tail /aws/lambda/CloudMeetX-GenerateDownloadUrl --follow
```

### S3 Metrics

```bash
# List files in bucket
aws s3 ls s3://cloudmeetx-files/ --recursive

# Get bucket size
aws s3 ls s3://cloudmeetx-files --recursive --summarize --human-readable
```

## 💰 Cost Estimation

**For 1000 uploads/day, 5000 downloads/day**:

- S3 Storage (10 GB): ~$0.23/month
- S3 PUT requests: ~$0.005/month
- S3 GET requests: ~$0.002/month
- Lambda invocations: ~$0.20/month
- **Total: ~$0.50/month**

## 🎯 Best Practices

1. **Always validate files on frontend** before upload
2. **Store s3Key in your database** after successful upload
3. **Use file IDs** for referencing files
4. **Set appropriate expiration times** for URLs
5. **Implement file size checks** in frontend
6. **Use progress tracking** for better UX
7. **Handle errors gracefully**
8. **Clean up unused files** periodically

## 📚 References

- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

---

**CloudMeetX S3 File Management** | Secure File Upload & Download | AWS Lambda + S3
