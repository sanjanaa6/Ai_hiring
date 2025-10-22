const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const InterviewRecording = require('../models/InterviewRecording');
const fs = require('fs');
const path = require('path');

// Check if AWS credentials are configured
const AWS_CONFIGURED = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

console.log('🔍 [S3 DEBUG] Environment check:', {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'NOT SET',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1 (default)',
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'ai-hiring-recordings (default)',
  AWS_CONFIGURED
});

// Initialize S3 Client - REQUIRED for this service
let s3Client = null;
if (AWS_CONFIGURED) {
  try {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      forcePathStyle: true // Use path-style URLs instead of virtual-hosted-style
    });
    console.log('✅ [S3 DEBUG] AWS S3 client initialized successfully');
    console.log('🔧 [S3 DEBUG] S3 Client config:', {
      region: process.env.AWS_REGION || 'us-east-1',
      forcePathStyle: true,
      bucket: process.env.AWS_S3_BUCKET_NAME || 'ai-hiring-recordings'
    });
  } catch (error) {
    console.error('❌ [S3 DEBUG] Failed to initialize S3 client:', error);
    throw new Error(`S3 initialization failed: ${error.message}`);
  }
} else {
  console.error('❌ [S3 DEBUG] AWS credentials not configured - S3-only mode requires credentials');
  throw new Error('AWS credentials are required for S3-only recording uploads');
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'ai-hiring-recordings';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

console.log('📋 [S3 DEBUG] Service configuration:', {
  BUCKET_NAME,
  SIGNED_URL_EXPIRY,
  S3_ONLY_MODE: true
});

/**
 * Generate a unique S3 key for the recording
 */
const generateS3Key = (interviewId, candidateId, timestamp) => {
  console.log('🔑 [S3 DEBUG] Generating S3 key with params:', {
    interviewId,
    candidateId,
    timestamp,
    timestampType: typeof timestamp
  });
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format: recordings/YYYY/MM/DD/interviewId_candidateId_timestamp.webm
  const s3Key = `recordings/${year}/${month}/${day}/${interviewId}_${candidateId}_${Date.now()}.webm`;
  
  console.log('✅ [S3 DEBUG] Generated S3 key:', {
    s3Key,
    date: date.toISOString(),
    year,
    month,
    day
  });
  
  return s3Key;
};

/**
 * Upload recording to S3 ONLY (no local fallback)
 */
const uploadRecording = async (buffer, recordingData) => {
  console.log('🚀 [S3 DEBUG] Starting S3-only upload process...');
  console.log('📊 [S3 DEBUG] Upload parameters:', {
    interviewId: recordingData.interviewId,
    candidateId: recordingData.candidateId,
    candidateName: recordingData.candidateName,
    bufferSize: buffer.length,
    bufferType: buffer.constructor.name,
    mimeType: recordingData.mimeType,
    recordingStartedAt: recordingData.recordingStartedAt,
    storage: 'AWS S3 ONLY'
  });

  if (!AWS_CONFIGURED || !s3Client) {
    const error = 'S3 client not configured - cannot upload recording';
    console.error('❌ [S3 DEBUG]', error);
    throw new Error(error);
  }

  try {
    const s3Key = generateS3Key(
      recordingData.interviewId,
      recordingData.candidateId,
      recordingData.recordingStartedAt
    );

    console.log('📦 [S3 DEBUG] Preparing upload parameters...');
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: recordingData.mimeType || 'video/webm',
      Metadata: {
        interviewId: recordingData.interviewId,
        candidateId: recordingData.candidateId.toString(),
        candidateName: recordingData.candidateName || 'Unknown',
        uploadedAt: new Date().toISOString(),
        originalSize: buffer.length.toString()
      }
    };

    console.log('📋 [S3 DEBUG] Upload parameters prepared:', {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      BodySize: uploadParams.Body.length,
      Metadata: uploadParams.Metadata
    });

    console.log('⏳ [S3 DEBUG] Sending PutObjectCommand to S3...');
    const command = new PutObjectCommand(uploadParams);
    
    const startTime = Date.now();
    const result = await s3Client.send(command);
    const uploadTime = Date.now() - startTime;
    
    console.log('✅ [S3 DEBUG] S3 upload completed successfully!');
    console.log('📈 [S3 DEBUG] Upload result:', {
      ETag: result.ETag,
      uploadTimeMs: uploadTime,
      uploadTimeSec: (uploadTime / 1000).toFixed(2)
    });

    // Use path-style URL format
    const s3Url = `https://s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${BUCKET_NAME}/${s3Key}`;
    
    const returnData = {
      s3Key,
      s3Bucket: BUCKET_NAME,
      s3Url,
      s3Region: process.env.AWS_REGION || 'us-east-1',
      uploadTime,
      etag: result.ETag
    };

    console.log('🎉 [S3 DEBUG] Upload successful! Return data:', returnData);
    return returnData;
    
  } catch (error) {
    console.error('❌ [S3 DEBUG] S3 upload failed with error:', {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      requestId: error.$metadata?.requestId,
      httpStatusCode: error.$metadata?.httpStatusCode
    });
    
    // Enhanced error details for common S3 errors
    if (error.name === 'NoSuchBucket') {
      console.error('🪣 [S3 DEBUG] Bucket does not exist:', BUCKET_NAME);
    } else if (error.name === 'AccessDenied') {
      console.error('🔒 [S3 DEBUG] Access denied - check IAM permissions');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('🔑 [S3 DEBUG] Invalid access key ID');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('✍️ [S3 DEBUG] Invalid secret access key');
    }
    
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Generate a signed URL for secure access to the recording (S3 ONLY)
 */
const generateSignedUrl = async (s3Key, expiresIn = SIGNED_URL_EXPIRY) => {
  console.log('🔐 [S3 DEBUG] Generating signed URL...', {
    s3Key,
    expiresIn,
    bucket: BUCKET_NAME
  });
  
  if (!AWS_CONFIGURED || !s3Client) {
    const error = 'S3 client not configured - cannot generate signed URL';
    console.error('❌ [S3 DEBUG]', error);
    throw new Error(error);
  }
  
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });

    console.log('⏳ [S3 DEBUG] Requesting signed URL from S3...');
    const startTime = Date.now();
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const generationTime = Date.now() - startTime;
    
    console.log('✅ [S3 DEBUG] Signed URL generated successfully!');
    console.log('📋 [S3 DEBUG] Signed URL details:', {
      s3Key,
      expiresIn,
      generationTimeMs: generationTime,
      urlLength: signedUrl.length,
      urlPreview: signedUrl.substring(0, 100) + '...'
    });
    
    return signedUrl;
  } catch (error) {
    console.error('❌ [S3 DEBUG] Signed URL generation failed:', {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      s3Key,
      bucket: BUCKET_NAME
    });
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete recording from S3 ONLY
 */
const deleteRecording = async (s3Key) => {
  console.log('🗑️ [S3 DEBUG] Starting S3 deletion process...', {
    s3Key,
    bucket: BUCKET_NAME
  });
  
  if (!AWS_CONFIGURED || !s3Client) {
    const error = 'S3 client not configured - cannot delete recording';
    console.error('❌ [S3 DEBUG]', error);
    throw new Error(error);
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });

    console.log('⏳ [S3 DEBUG] Sending DeleteObjectCommand to S3...');
    const startTime = Date.now();
    const result = await s3Client.send(command);
    const deleteTime = Date.now() - startTime;
    
    console.log('✅ [S3 DEBUG] S3 deletion completed successfully!');
    console.log('📊 [S3 DEBUG] Deletion details:', {
      s3Key,
      deleteTimeMs: deleteTime,
      requestId: result.$metadata?.requestId
    });
    
    return true;
  } catch (error) {
    console.error('❌ [S3 DEBUG] S3 deletion failed:', {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      s3Key,
      bucket: BUCKET_NAME
    });
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
};

/**
 * Save recording metadata to database and upload to S3 ONLY
 */
const saveRecording = async (recordingData, buffer) => {
  console.log('💾 [S3 DEBUG] Starting recording save process (S3-only mode)...');
  console.log('📊 [S3 DEBUG] Recording data:', {
    interviewId: recordingData.interviewId,
    candidateId: recordingData.candidateId,
    candidateName: recordingData.candidateName,
    bufferSize: buffer.length,
    mimeType: recordingData.mimeType,
    recordingStartedAt: recordingData.recordingStartedAt
  });

  try {
    // Create initial database record
    console.log('📝 [S3 DEBUG] Creating database record...');
    const recording = new InterviewRecording({
      ...recordingData,
      status: 'uploading',
      fileSize: buffer.length
    });

    await recording.save();
    console.log('✅ [S3 DEBUG] Database record created successfully:', {
      recordingId: recording._id,
      status: recording.status,
      fileSize: recording.fileSize
    });

    try {
      // Upload to S3 ONLY
      console.log('🚀 [S3 DEBUG] Starting S3 upload...');
      const s3Data = await uploadRecording(buffer, recordingData);
      
      console.log('📦 [S3 DEBUG] S3 upload completed! Data received:', s3Data);

      // Update database record with S3 details
      console.log('📝 [S3 DEBUG] Updating database record with S3 details...');
      recording.s3Key = s3Data.s3Key;
      recording.s3Bucket = s3Data.s3Bucket;
      recording.s3Url = s3Data.s3Url;
      recording.s3Region = s3Data.s3Region || 'us-east-1';
      recording.status = 'completed';
      recording.uploadedAt = new Date();
      recording.uploadProgress = 100;

      await recording.save();
      
      console.log('🎉 [S3 DEBUG] Recording saved successfully!');
      console.log('📋 [S3 DEBUG] Final recording details:', {
        recordingId: recording._id,
        s3Key: recording.s3Key,
        s3Bucket: recording.s3Bucket,
        s3Url: recording.s3Url,
        s3Region: recording.s3Region,
        status: recording.status,
        fileSize: recording.fileSize,
        uploadedAt: recording.uploadedAt
      });

      return recording;
    } catch (uploadError) {
      console.error('❌ [S3 DEBUG] Upload failed, updating database record...');
      console.error('💥 [S3 DEBUG] Upload error details:', {
        errorName: uploadError.name,
        errorMessage: uploadError.message,
        errorStack: uploadError.stack
      });
      
      // Mark as failed if upload fails
      recording.status = 'failed';
      recording.error = {
        message: uploadError.message,
        code: 'S3_UPLOAD_FAILED',
        timestamp: new Date(),
        details: {
          errorName: uploadError.name,
          errorCode: uploadError.code
        }
      };
      await recording.save();
      
      console.log('📝 [S3 DEBUG] Database record updated with failure status');
      throw uploadError;
    }
  } catch (error) {
    console.error('❌ [S3 DEBUG] Recording save process failed:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

/**
 * Get recording with signed URL
 */
const getRecordingWithSignedUrl = async (recordingId, userId) => {
  try {
    const recording = await InterviewRecording.findById(recordingId)
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
