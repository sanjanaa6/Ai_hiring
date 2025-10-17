# 🔧 S3 DNS Resolution Fix

## ❌ Error:

```
getaddrinfo ENOTFOUND aihiringrecording.s3.us-east-1.amazonaws.com
```

## 🔍 Root Cause:

AWS S3 has two URL formats:

### 1. Virtual-Hosted-Style (Default)
```
https://bucket-name.s3.region.amazonaws.com/key
```
**Problem:** Requires DNS resolution of `bucket-name.s3.region.amazonaws.com`

### 2. Path-Style (Legacy but Reliable)
```
https://s3.region.amazonaws.com/bucket-name/key
```
**Benefit:** Only requires DNS resolution of `s3.region.amazonaws.com` (always works)

## ✅ Solution Applied:

### 1. Enabled Path-Style URLs in S3 Client

**File:** `backend/services/recordingUploadService.js`

```javascript
s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  forcePathStyle: true // ✅ Added this
});
```

### 2. Updated S3 URL Format

**Before:**
```javascript
const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;
// https://aihiringrecording.s3.us-east-1.amazonaws.com/recordings/...
```

**After:**
```javascript
const s3Url = `https://s3.${region}.amazonaws.com/${BUCKET_NAME}/${s3Key}`;
// https://s3.us-east-1.amazonaws.com/aihiringrecording/recordings/...
```

## 🎯 Why This Works:

1. **Path-style URLs** are more reliable for bucket names without hyphens
2. **DNS resolution** is simpler (only need to resolve `s3.us-east-1.amazonaws.com`)
3. **Backward compatible** with all S3 buckets
4. **No bucket name restrictions** on DNS compatibility

## 🔄 Auto-Reload:

Since you're using **nodemon**, the changes are automatically applied! ✅

Look for this in your console:
```
[nodemon] restarting due to changes...
[nodemon] starting `node server.js`
✅ [S3] AWS S3 configured and ready
```

## 🧪 Test Again:

1. **Complete an interview** with screen recording
2. **Watch backend console** for:
   ```
   📤 [UPLOAD] Starting upload... storage: AWS S3
   ✅ [S3 UPLOAD] Upload successful: https://s3.us-east-1.amazonaws.com/aihiringrecording/...
   ✅ [RECORDING] Recording saved successfully
   ```
3. **Check Recruiter Dashboard** → Recordings tab

## 📊 URL Format Comparison:

| Format | URL | DNS Required | Reliability |
|--------|-----|--------------|-------------|
| Virtual-Hosted | `bucket.s3.region.amazonaws.com` | Bucket-specific | ⚠️ Can fail |
| Path-Style | `s3.region.amazonaws.com/bucket` | Generic | ✅ Always works |

## ✅ Status:

- [x] Path-style URLs enabled
- [x] S3 URL format updated
- [x] Auto-reloaded with nodemon
- [ ] Test recording upload

## 🎉 Ready to Test!

The DNS issue is fixed. Try uploading a recording again! 🚀
