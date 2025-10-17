# Screen Recording Feature - Implementation Guide

## 📋 Overview

This document describes the complete implementation of the **Screen Recording Feature** for the AI Hiring Interview Platform. This feature automatically records candidate screens during interviews and uploads recordings to AWS S3 for recruiter review.

---

## 🎯 Features Implemented

### For Candidates
- ✅ Automatic screen recording when interview starts
- ✅ Recording indicator during interview
- ✅ Automatic upload to AWS S3 when interview ends
- ✅ No manual intervention required
- ✅ Browser-based recording (no plugins needed)

### For Recruiters
- ✅ View all interview recordings in dashboard
- ✅ Play recordings with full video controls
- ✅ Download recordings for offline viewing
- ✅ Delete recordings (soft delete)
- ✅ View recording metadata (duration, file size, views)
- ✅ Filter recordings by interview/candidate
- ✅ Track recording views and statistics

---

## 🏗️ Architecture

### Backend Components

#### 1. **Database Model** (`backend/models/InterviewRecording.js`)
```javascript
- interviewId: Interview identifier
- candidateId: Candidate reference
- s3Key: AWS S3 object key
- s3Url: Public S3 URL
- duration: Recording duration in seconds
- fileSize: File size in bytes
- status: uploading/completed/failed
- viewCount: Number of views
- metadata: Screen resolution, browser info, etc.
```

#### 2. **S3 Upload Service** (`backend/services/recordingUploadService.js`)
- Upload recordings to AWS S3
- Generate signed URLs for secure access
- Delete recordings from S3
- Organize files by date (YYYY/MM/DD structure)

#### 3. **API Routes** (`backend/routes/interviewRecordings.js`)
```
POST   /api/interview-recordings/upload              - Upload recording
GET    /api/interview-recordings/:recordingId        - Get recording with signed URL
GET    /api/interview-recordings/interview/:id       - Get all recordings for interview
GET    /api/interview-recordings/recruiter/my-recordings - Get recruiter's recordings
GET    /api/interview-recordings/candidate/:id       - Get candidate's recordings
DELETE /api/interview-recordings/:recordingId        - Delete recording
GET    /api/interview-recordings/stats/overview      - Get statistics (admin)
```

### Frontend Components

#### 1. **Recording Hook** (`frontend/src/hooks/useScreenRecording.js`)
Custom React hook that handles:
- Starting/stopping screen recording
- Pausing/resuming recording
- Automatic upload to backend
- Progress tracking
- Error handling

#### 2. **Recording Service** (`frontend/src/services/recordingService.js`)
API client for recording operations:
- Upload recordings
- Fetch recordings
- Delete recordings
- Get statistics

#### 3. **Recording Viewer** (`frontend/src/components/RecordingViewer.js`)
Full-featured video player with:
- Play/pause controls
- Volume control
- Playback speed (0.5x, 1x, 1.5x, 2x)
- Seek bar
- Fullscreen mode
- Download option
- Recording metadata display

#### 4. **Recordings List** (`frontend/src/components/RecordingsList.js`)
List view showing:
- All recordings for recruiter
- Recording metadata
- Quick actions (play, download, delete)
- Status indicators

#### 5. **Integration** (`frontend/src/components/ModernInterview.js`)
- Automatically starts recording when interview begins
- Stops and uploads when interview ends
- Shows recording status to candidate

---

## 🔧 Setup Instructions

### 1. Environment Variables

Add to `backend/.env`:
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=ai-hiring-recordings
AWS_REGION=us-east-1
```

### 2. AWS S3 Setup

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://ai-hiring-recordings --region us-east-1
   ```

2. **Configure Bucket Policy** (for private access with signed URLs)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER"
         },
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::ai-hiring-recordings/*"
       }
     ]
   }
   ```

3. **Enable CORS** (if accessing from browser)
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### 3. Install Dependencies

Backend dependencies are already included in `package.json`:
```json
{
  "@aws-sdk/client-s3": "^3.700.0",
  "@aws-sdk/s3-request-presigner": "^3.700.0",
  "multer": "^2.0.2"
}
```

If not installed:
```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
```

### 4. Start the Application

```bash
# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm start
```

---

## 📖 Usage Guide

### For Candidates

1. **Start Interview**
   - Navigate to interview page
   - Click "Start Interview"
   - Browser will prompt for screen sharing permission
   - Allow screen sharing to begin recording

2. **During Interview**
   - Recording indicator shows in interview UI
   - Recording happens automatically in background
   - No need to manually stop recording

3. **Complete Interview**
   - Click "Complete Interview"
   - Recording automatically stops and uploads
   - Success notification appears when upload completes

### For Recruiters

1. **Access Recordings**
   - Login to recruiter dashboard
   - Click "Recordings" in sidebar
   - View all interview recordings

2. **Play Recording**
   - Click play button on any recording
   - Video player opens with full controls
   - Use playback speed controls for faster review

3. **Download Recording**
   - Click download button
   - Recording downloads to local machine
   - File format: `.webm`

4. **Delete Recording**
   - Click delete button
   - Confirm deletion
   - Recording is soft-deleted (can be recovered by admin)

---

## 🔒 Security Features

### Access Control
- **Candidates**: Can only view their own recordings
- **Recruiters**: Can view recordings for their interviews
- **Admins**: Can view all recordings and statistics

### Data Protection
- Recordings stored in private S3 bucket
- Access via signed URLs (1-hour expiry)
- JWT authentication required for all API calls
- Soft delete prevents accidental data loss

### Privacy
- Recording only captures screen (not camera by default)
- Candidate must grant permission to share screen
- Recording indicator always visible during recording
- Candidates can stop sharing at any time

---

## 📊 Database Schema

### InterviewRecording Collection
```javascript
{
  _id: ObjectId,
  interviewId: String,
  candidateId: ObjectId (ref: User),
  candidateName: String,
  candidateEmail: String,
  recruiterId: ObjectId (ref: User),
  jobId: ObjectId (ref: Job),
  
  // Recording metadata
  recordingType: 'screen' | 'screen_audio' | 'camera' | 'full',
  duration: Number,  // seconds
  fileSize: Number,  // bytes
  mimeType: String,  // 'video/webm'
  
  // AWS S3 details
  s3Key: String,
  s3Bucket: String,
  s3Url: String,
  s3Region: String,
  
  // Status tracking
  status: 'uploading' | 'completed' | 'failed' | 'processing',
  uploadProgress: Number,  // 0-100
  
  // Timestamps
  recordingStartedAt: Date,
  recordingEndedAt: Date,
  uploadedAt: Date,
  
  // Access control
  isPublic: Boolean,
  viewCount: Number,
  lastViewedAt: Date,
  viewedBy: [{ userId, viewedAt }],
  
  // Additional metadata
  metadata: {
    screenResolution: String,
    browserInfo: String,
    deviceInfo: String,
    roundNumber: Number,
    roundTitle: String
  },
  
  // Error tracking
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  
  // Soft delete
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId (ref: User),
  
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
- { candidateId: 1, createdAt: -1 }
- { recruiterId: 1, createdAt: -1 }
- { interviewId: 1, candidateId: 1 }
- { status: 1, createdAt: -1 }
- { isDeleted: 1 }
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Candidate Flow
- [ ] Start interview and grant screen sharing permission
- [ ] Verify recording indicator appears
- [ ] Complete interview
- [ ] Verify upload success notification
- [ ] Check recording appears in database

#### Recruiter Flow
- [ ] Navigate to Recordings tab
- [ ] Verify recordings list loads
- [ ] Click play on a recording
- [ ] Test video controls (play, pause, seek, volume)
- [ ] Test playback speed controls
- [ ] Download a recording
- [ ] Delete a recording

#### Edge Cases
- [ ] Deny screen sharing permission
- [ ] Stop sharing screen mid-interview
- [ ] Network interruption during upload
- [ ] Large file upload (>100MB)
- [ ] Multiple recordings for same interview

### API Testing

```bash
# Upload recording
curl -X POST http://localhost:5000/api/interview-recordings/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "recording=@test-recording.webm" \
  -F "interviewId=interview_123" \
  -F "candidateName=John Doe" \
  -F "candidateEmail=john@example.com" \
  -F "duration=300"

# Get recording
curl http://localhost:5000/api/interview-recordings/RECORDING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all recordings
curl http://localhost:5000/api/interview-recordings/recruiter/my-recordings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Screen Recording Not Starting
**Problem**: Recording doesn't start when interview begins

**Solutions**:
- Check browser compatibility (Chrome/Edge recommended)
- Verify screen sharing permission granted
- Check browser console for errors
- Ensure HTTPS connection (required for screen capture API)

#### 2. Upload Failing
**Problem**: Recording fails to upload to S3

**Solutions**:
- Verify AWS credentials in `.env`
- Check S3 bucket exists and is accessible
- Verify IAM user has PutObject permission
- Check network connectivity
- Review backend logs for detailed error

#### 3. Signed URL Expired
**Problem**: "Access Denied" when playing recording

**Solutions**:
- Signed URLs expire after 1 hour
- Refresh the page to generate new signed URL
- Check system time is synchronized

#### 4. Large File Upload Timeout
**Problem**: Upload times out for large recordings

**Solutions**:
- Increase server timeout in `server.js`
- Implement chunked upload for files >100MB
- Consider reducing recording quality/bitrate

### Debug Mode

Enable detailed logging:

**Backend** (`server.js`):
```javascript
// Add at top of file
process.env.DEBUG = 'recording:*';
```

**Frontend** (Browser Console):
```javascript
localStorage.setItem('DEBUG', 'recording:*');
```

---

## 📈 Performance Optimization

### Backend
- Use streaming upload for large files
- Implement upload progress tracking
- Add Redis caching for frequently accessed recordings
- Use CloudFront CDN for faster video delivery

### Frontend
- Lazy load recording viewer component
- Implement virtual scrolling for large recording lists
- Compress recordings before upload
- Use Web Workers for encoding

### Storage
- Set S3 lifecycle policies to archive old recordings
- Use S3 Intelligent-Tiering for cost optimization
- Implement automatic cleanup of failed uploads

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Live recording preview for candidates
- [ ] Multiple camera angles (screen + webcam)
- [ ] Audio transcription with timestamps
- [ ] AI-powered highlights detection
- [ ] Recording annotations and bookmarks
- [ ] Batch download multiple recordings
- [ ] Recording sharing via secure links
- [ ] Recording analytics (watch time, completion rate)
- [ ] Mobile app support
- [ ] Recording compression options

### Advanced Features
- [ ] Real-time streaming to recruiter
- [ ] Picture-in-picture mode
- [ ] Recording editing tools
- [ ] Automatic blur of sensitive information
- [ ] Multi-language subtitles
- [ ] Recording quality selection
- [ ] Resume interrupted uploads

---

## 📝 API Documentation

### Upload Recording
```
POST /api/interview-recordings/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- recording: File (video/webm)
- interviewId: String (required)
- candidateName: String (required)
- candidateEmail: String (required)
- recruiterId: String (optional)
- jobId: String (optional)
- duration: Number (seconds)
- recordingStartedAt: ISO Date
- recordingEndedAt: ISO Date
- metadata: JSON String

Response: 201 Created
{
  "success": true,
  "message": "Recording uploaded successfully",
  "data": {
    "recordingId": "64abc123...",
    "s3Url": "https://...",
    "status": "completed",
    "duration": 300,
    "fileSize": 52428800
  }
}
```

### Get Recording
```
GET /api/interview-recordings/:recordingId
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "interviewId": "interview_123",
    "candidateName": "John Doe",
    "signedUrl": "https://s3.amazonaws.com/...",
    "duration": 300,
    "fileSize": 52428800,
    "viewCount": 5,
    "status": "completed",
    ...
  }
}
```

### Get All Recordings
```
GET /api/interview-recordings/recruiter/my-recordings
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

---

## 💰 Cost Estimation

### AWS S3 Costs (US East)
- **Storage**: $0.023 per GB/month
- **PUT Requests**: $0.005 per 1,000 requests
- **GET Requests**: $0.0004 per 1,000 requests
- **Data Transfer Out**: $0.09 per GB

### Example Monthly Cost
- 100 interviews/month
- 30 minutes average duration
- ~500MB per recording
- 50GB total storage
- 500 uploads, 1000 views

**Estimated Cost**: ~$5-10/month

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs: `backend/logs/`
3. Check browser console for frontend errors
4. Contact development team

---

## ✅ Implementation Checklist

- [x] Backend recording model created
- [x] S3 upload service implemented
- [x] API routes configured
- [x] Frontend recording hook created
- [x] Recording viewer component built
- [x] Recordings list component built
- [x] Integrated into ModernInterview component
- [x] Added to recruiter dashboard
- [x] Documentation completed
- [ ] AWS S3 bucket configured
- [ ] Environment variables set
- [ ] Manual testing completed
- [ ] Production deployment

---

**Version**: 1.0.0  
**Last Updated**: October 17, 2025  
**Author**: AI Development Team
