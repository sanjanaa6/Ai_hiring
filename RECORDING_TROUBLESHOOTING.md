# 🔧 Recording Feature - Troubleshooting Guide

## ❌ Error: 404 Not Found on `/api/interview-recordings/recruiter/my-recordings`

### Error Message
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Get my recordings error: AxiosError
Failed to load recordings
```

### 🔍 Root Cause
The backend server hasn't been restarted after adding the new recording routes.

---

## ✅ Solution

### Step 1: Restart Backend Server

**Option A: If using `start-project.bat`**
1. Close all terminal windows running the backend
2. Double-click `start-project.bat` again

**Option B: If running manually**
1. Stop the backend server (Ctrl+C in terminal)
2. Restart it:
```bash
cd backend
npm start
```

### Step 2: Verify Routes Loaded

Check the backend console output. You should see:
```
✅ Interview Recordings routes loaded
```

If you see:
```
❌ Interview Recordings routes failed: [error message]
```

Then there's an issue with the route file. Check the error message.

---

## 🧪 Test the Fix

### 1. Check Backend Health
Open browser and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "environment": "development"
}
```

### 2. Test Recording Endpoint (as Recruiter)

**Get Auth Token:**
1. Login as recruiter
2. Open browser DevTools (F12)
3. Go to Application/Storage → Local Storage
4. Copy the `token` value

**Test API:**
```bash
curl http://localhost:5000/api/interview-recordings/recruiter/my-recordings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

---

## 🐛 Other Common Issues

### Issue 1: Module Not Found Error

**Error:**
```
❌ Interview Recordings routes failed: Cannot find module './routes/interviewRecordings'
```

**Solution:**
Verify the file exists:
```
backend/routes/interviewRecordings.js
```

If missing, the file wasn't created properly. Re-create it from the implementation guide.

---

### Issue 2: AWS SDK Error

**Error:**
```
Error: Cannot find module '@aws-sdk/client-s3'
```

**Solution:**
Install missing dependencies:
```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

### Issue 3: MongoDB Connection Error

**Error:**
```
❌ MongoDB connection error
```

**Solution:**
1. Check MongoDB is running:
   - Windows: Services → MongoDB Server
   - Mac/Linux: `sudo systemctl status mongod`

2. Verify connection string in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/ai-hiring
```

---

### Issue 4: CORS Error

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Verify frontend is running on `http://localhost:3000`
2. Check backend CORS configuration in `server.js`
3. Restart both frontend and backend

---

### Issue 5: Authentication Error

**Error:**
```
401 Unauthorized
```

**Solution:**
1. Verify you're logged in
2. Check token exists in localStorage
3. Token might be expired - logout and login again

---

### Issue 6: AWS S3 Upload Fails

**Error:**
```
Failed to upload recording: S3 upload failed
```

**Solution:**
1. Verify AWS credentials in `.env`:
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET_NAME=ai-hiring-recordings
AWS_REGION=us-east-1
```

2. Check S3 bucket exists:
```bash
aws s3 ls s3://ai-hiring-recordings
```

3. Verify IAM permissions:
   - s3:PutObject
   - s3:GetObject
   - s3:DeleteObject

---

## 📋 Complete Restart Checklist

If nothing works, do a complete restart:

1. **Stop Everything**
   - Close all terminal windows
   - Stop MongoDB (if you started it manually)
   - Close browser tabs

2. **Start MongoDB**
   - Windows: Should auto-start as service
   - Mac/Linux: `sudo systemctl start mongod`

3. **Start Backend**
   ```bash
   cd backend
   npm start
   ```
   
   Wait for:
   ```
   ✅ MongoDB connected successfully
   ✅ Interview Recordings routes loaded
   🚀 Server is ready to accept connections!
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   
   Wait for:
   ```
   Compiled successfully!
   ```

5. **Test**
   - Login as recruiter
   - Go to Recordings tab
   - Should see "No Recordings Found" (not 404 error)

---

## 🔍 Debug Mode

Enable detailed logging:

**Backend (`server.js`):**
```javascript
// Add after dotenv.config()
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Debug mode enabled');
  console.log('📍 Routes registered:', app._router.stack
    .filter(r => r.route)
    .map(r => r.route.path)
  );
}
```

**Frontend (Browser Console):**
```javascript
// Enable axios logging
localStorage.setItem('debug', 'axios:*');
```

---

## 📞 Still Having Issues?

1. **Check Backend Logs**
   - Look for error messages in terminal
   - Check for route loading errors

2. **Check Browser Console**
   - F12 → Console tab
   - Look for network errors
   - Check failed requests in Network tab

3. **Verify File Structure**
   ```
   backend/
   ├── models/
   │   └── InterviewRecording.js ✓
   ├── services/
   │   └── recordingUploadService.js ✓
   ├── routes/
   │   └── interviewRecordings.js ✓
   └── server.js (modified) ✓
   
   frontend/
   ├── src/
   │   ├── hooks/
   │   │   └── useScreenRecording.js ✓
   │   ├── services/
   │   │   └── recordingService.js ✓
   │   ├── components/
   │   │   ├── RecordingViewer.js ✓
   │   │   ├── RecordingsList.js ✓
   │   │   └── ModernInterview.js (modified) ✓
   │   └── recruiter/
   │       └── pages/
   │           └── RecruiterDashboard.js (modified) ✓
   ```

4. **Check Dependencies**
   ```bash
   # Backend
   cd backend
   npm list @aws-sdk/client-s3
   npm list multer
   
   # Frontend
   cd frontend
   npm list axios
   npm list react-toastify
   ```

---

## ✅ Success Indicators

You'll know it's working when:

1. **Backend Console Shows:**
   ```
   ✅ Interview Recordings routes loaded
   ```

2. **Recruiter Dashboard:**
   - "Recordings" tab appears in sidebar
   - Clicking it shows "No Recordings Found" (not 404)

3. **After Interview:**
   - Recording uploads successfully
   - Toast notification appears
   - Recording appears in recruiter dashboard

---

## 🎯 Quick Test

Run this in your terminal to verify everything is set up:

```bash
# Test 1: Check if route file exists
ls backend/routes/interviewRecordings.js

# Test 2: Check if model exists
ls backend/models/InterviewRecording.js

# Test 3: Check if service exists
ls backend/services/recordingUploadService.js

# Test 4: Check backend is running
curl http://localhost:5000/api/health

# Test 5: Check frontend is running
curl http://localhost:3000
```

All should return success (not "file not found" or connection errors).

---

**Last Updated:** October 17, 2025
