# Permission Denied Error Fix Guide

## Error Description
```
❌ Feedback generation failed: EACCES: permission denied, mkdir '/app/uploads'
```

## Root Cause
The Docker container runs as a non-root user (`backend` with UID 1001) for security purposes. When the application tries to create the `/app/uploads` directory at runtime, it fails because:

1. The directory doesn't exist in the container
2. The non-root user lacks permissions to create directories in `/app`

## Solution Applied

### 1. Updated Backend Dockerfile
Modified `backend/Dockerfile` to create the uploads directory structure **before** switching to the non-root user:

```dockerfile
# Create uploads directory and subdirectories with proper permissions
RUN mkdir -p /app/uploads/recruiter-docs \
    /app/uploads/form-submissions \
    /app/uploads/interviews \
    /app/uploads/recordings \
    /app/uploads/stt-audio \
    /app/uploads/reference-audio

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend
```

This ensures:
- All required upload directories exist
- Proper ownership is set (backend:nodejs)
- The non-root user has write permissions

## Deployment Steps

### For Docker Deployment:

1. **Rebuild the Docker image:**
   ```bash
   cd backend
   docker build -t ai-hiring-backend .
   ```

2. **Stop and remove the old container:**
   ```bash
   docker stop ai-hiring-backend
   docker rm ai-hiring-backend
   ```

3. **Run the new container:**
   ```bash
   docker run -d \
     --name ai-hiring-backend \
     -p 5000:5000 \
     --env-file .env \
     ai-hiring-backend
   ```

### For Docker Compose:

1. **Rebuild and restart:**
   ```bash
   cd backend
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### For Production Server (e.g., Render, Railway, etc.):

1. **Commit the Dockerfile changes:**
   ```bash
   git add backend/Dockerfile
   git commit -m "Fix: Add uploads directory creation in Dockerfile to prevent permission errors"
   git push
   ```

2. **Trigger a new deployment** on your hosting platform

3. **Verify the fix** by testing the feedback generation feature

## Verification

After deployment, test the feedback generation:

1. Complete an interview
2. Generate feedback
3. Check browser console - the error should be gone
4. Verify the PDF is generated successfully

## Additional Notes

### Files That Create Upload Directories:
- `handlers/interviewFeedback.js` - Main feedback PDF generation
- `handlers/fileUpload.js` - Interview file uploads
- `routes/auth.js` - Recruiter document uploads
- `routes/formSubmission.js` - Form submission files
- `routes/stt.js` - Speech-to-text audio files
- `routes/tts.js` - Text-to-speech reference audio

### Alternative Solution (Not Recommended):
If you need persistent uploads across container restarts, you could use Docker volumes:

```yaml
volumes:
  - ./uploads:/app/uploads
```

However, this is only suitable for development, not production deployments.

## Troubleshooting

If the error persists after deployment:

1. **Check container logs:**
   ```bash
   docker logs ai-hiring-backend
   ```

2. **Verify directory exists in container:**
   ```bash
   docker exec ai-hiring-backend ls -la /app/uploads
   ```

3. **Check permissions:**
   ```bash
   docker exec ai-hiring-backend ls -la /app
   ```

4. **Ensure the image was rebuilt:**
   ```bash
   docker images | grep ai-hiring-backend
   ```
   Check the "CREATED" timestamp

## Related Files Modified
- ✅ `backend/Dockerfile` - Added uploads directory creation
