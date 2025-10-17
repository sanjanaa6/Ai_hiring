const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const InterviewRecording = require('../models/InterviewRecording');
const fs = require('fs');
const path = require('path');

// Check if AWS credentials are configured
const AWS_CONFIGURED = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Initialize S3 Client only if AWS is configured
let s3Client = null;
if (AWS_CONFIGURED) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    forcePathStyle: true // Use path-style URLs instead of virtual-hosted-style
  });
  console.log('✅ [S3] AWS S3 configured and ready');
} else {
  console.log('⚠️  [S3] AWS credentials not found - using local file storage');
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'ai-hiring-recordings';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds
const LOCAL_STORAGE_PATH = path.join(__dirname, '../uploads/recordings');

/**
 * Generate a unique S3 key for the recording
 */
const generateS3Key = (interviewId, candidateId, timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format: recordings/YYYY/MM/DD/interviewId_candidateId_timestamp.webm
  return `recordings/${year}/${month}/${day}/${interviewId}_${candidateId}_${Date.now()}.webm`;
};

/**
 * Upload recording to S3 or local storage
 */
const uploadRecording = async (buffer, recordingData) => {
  try {
    console.log('📤 [UPLOAD] Starting upload...', {
      interviewId: recordingData.interviewId,
      candidateId: recordingData.candidateId,
      size: buffer.length,
      storage: AWS_CONFIGURED ? 'AWS S3' : 'Local'
    });

    const s3Key = generateS3Key(
      recordingData.interviewId,
      recordingData.candidateId,
      recordingData.recordingStartedAt
    );

    if (AWS_CONFIGURED) {
      // Upload to AWS S3
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: recordingData.mimeType || 'video/webm',
        Metadata: {
          interviewId: recordingData.interviewId,
          candidateId: recordingData.candidateId.toString(),
          candidateName: recordingData.candidateName,
          uploadedAt: new Date().toISOString()
        }
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Use path-style URL format
      const s3Url = `https://s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${BUCKET_NAME}/${s3Key}`;

      console.log('✅ [S3 UPLOAD] Upload successful:', s3Url);

      return {
        s3Key,
        s3Bucket: BUCKET_NAME,
        s3Url,
        s3Region: process.env.AWS_REGION || 'us-east-1'
      };
    } else {
      // Save to local file system
      const localPath = path.join(LOCAL_STORAGE_PATH, s3Key);
      const dir = path.dirname(localPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(localPath, buffer);

      const localUrl = `/uploads/recordings/${s3Key}`;

      console.log('✅ [LOCAL UPLOAD] Upload successful:', localPath);

      return {
        s3Key,
        s3Bucket: 'local-storage',
        s3Url: localUrl,
        s3Region: 'local'
      };
    }
  } catch (error) {
    console.error('❌ [UPLOAD] Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Generate a signed URL for secure access to the recording
 */
const generateSignedUrl = async (s3Key, expiresIn = SIGNED_URL_EXPIRY) => {
  try {
    if (AWS_CONFIGURED) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      
      console.log('🔐 [S3 SIGNED URL] Generated for:', s3Key);
      
      return signedUrl;
    } else {
      // For local storage, return the local URL
      const localUrl = `http://localhost:${process.env.PORT || 5000}/uploads/recordings/${s3Key}`;
      console.log('🔐 [LOCAL URL] Generated for:', s3Key);
      return localUrl;
    }
  } catch (error) {
    console.error('❌ [SIGNED URL] Generation failed:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete recording from S3
 */
const deleteRecording = async (s3Key) => {
  try {
    console.log('🗑️ [S3 DELETE] Deleting:', s3Key);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });

    await s3Client.send(command);
    
    console.log('✅ [S3 DELETE] Deleted successfully:', s3Key);
    
    return true;
  } catch (error) {
    console.error('❌ [S3 DELETE] Deletion failed:', error);
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
};

/**
 * Save recording metadata to database and upload to S3
 */
const saveRecording = async (recordingData, buffer) => {
  try {
    console.log('💾 [RECORDING] Saving recording...', {
      interviewId: recordingData.interviewId,
      candidateId: recordingData.candidateId
    });

    // Create initial database record
    const recording = new InterviewRecording({
      ...recordingData,
      status: 'uploading',
      fileSize: buffer.length
    });

    await recording.save();
    console.log('✅ [RECORDING] Database record created:', recording._id);

    try {
      // Upload to S3
      const s3Data = await uploadRecording(buffer, recordingData);
      
      console.log('📦 [RECORDING] S3 upload data:', s3Data);

      // Update database record with S3 details
      recording.s3Key = s3Data.s3Key;
      recording.s3Bucket = s3Data.s3Bucket;
      recording.s3Url = s3Data.s3Url;
      recording.s3Region = s3Data.s3Region || 'us-east-1';
      recording.status = 'completed';
      recording.uploadedAt = new Date();
      recording.uploadProgress = 100;

      await recording.save();
      
      console.log('✅ [RECORDING] Recording saved successfully:', recording._id);
      console.log('   S3 URL:', recording.s3Url);

      return recording;
    } catch (uploadError) {
      // Mark as failed if upload fails
      recording.status = 'failed';
      recording.error = {
        message: uploadError.message,
        code: 'UPLOAD_FAILED',
        timestamp: new Date()
      };
      await recording.save();
      
      throw uploadError;
    }
  } catch (error) {
    console.error('❌ [RECORDING] Save failed:', error);
    throw error;
  }
};

/**
 * Get recording with signed URL
 */
const getRecordingWithSignedUrl = async (recordingId, userId) => {
  try {
    const recording = await InterviewRecording.findById(recordingId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');

    if (!recording || recording.isDeleted) {
      throw new Error('Recording not found');
    }

    // Generate signed URL
    const signedUrl = await generateSignedUrl(recording.s3Key);

    // Record view
    if (userId) {
      await recording.recordView(userId);
    }

    // Return recording with signed URL
    const recordingObj = recording.toObject();
    recordingObj.signedUrl = signedUrl;

    return recordingObj;
  } catch (error) {
    console.error('❌ [RECORDING] Get failed:', error);
    throw error;
  }
};

/**
 * Get all recordings for an interview
 */
const getInterviewRecordings = async (interviewId) => {
  try {
    const recordings = await InterviewRecording.findByInterview(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');

    // Generate signed URLs for all recordings
    const recordingsWithUrls = await Promise.all(
      recordings.map(async (recording) => {
        const signedUrl = await generateSignedUrl(recording.s3Key);
        const recordingObj = recording.toObject();
        recordingObj.signedUrl = signedUrl;
        return recordingObj;
      })
    );

    return recordingsWithUrls;
  } catch (error) {
    console.error('❌ [RECORDING] Get interview recordings failed:', error);
    throw error;
  }
};

/**
 * Get all recordings for a recruiter
 * Shows all recordings (including those without recruiterId)
 */
const getRecruiterRecordings = async (recruiterId) => {
  try {
    console.log('📥 [GET RECRUITER RECORDINGS] Request by:', recruiterId);
    
    // Get recordings where recruiterId matches OR is null (show all for now)
    const recordings = await InterviewRecording.findActive({
      $or: [
        { recruiterId: recruiterId },
        { recruiterId: null },
        { recruiterId: { $exists: false } }
      ]
    })
      .populate('candidateId', 'name email profile')
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 })
      .limit(100); // Limit for performance

    console.log('✅ [GET RECRUITER RECORDINGS] Found:', recordings.length);
    
    return recordings;
  } catch (error) {
    console.error('❌ [RECORDING] Get recruiter recordings failed:', error);
    throw error;
  }
};

/**
 * Delete recording (soft delete in DB, hard delete from S3)
 */
const removeRecording = async (recordingId, userId) => {
  try {
    const recording = await InterviewRecording.findById(recordingId);

    if (!recording || recording.isDeleted) {
      throw new Error('Recording not found');
    }

    // Soft delete in database
    await recording.softDelete(userId);

    // Hard delete from S3 (optional - you may want to keep for backup)
    // await deleteRecording(recording.s3Key);

    console.log('✅ [RECORDING] Recording deleted:', recordingId);

    return recording;
  } catch (error) {
    console.error('❌ [RECORDING] Delete failed:', error);
    throw error;
  }
};

module.exports = {
  uploadRecording,
  generateSignedUrl,
  deleteRecording,
  saveRecording,
  getRecordingWithSignedUrl,
  getInterviewRecordings,
  getRecruiterRecordings,
  removeRecording,
  s3Client,
  BUCKET_NAME
};
