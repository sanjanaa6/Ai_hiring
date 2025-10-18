const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const recordingService = require('../services/recordingUploadService');
const InterviewRecording = require('../models/InterviewRecording');

// Configure multer for memory storage (we'll upload directly to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

/**
 * @route   OPTIONS /api/interview-recordings/upload
 * @desc    Handle CORS preflight for upload
 * @access  Public
 */
router.options('/upload', (req, res) => {
  res.status(204).send();
});

/**
 * @route   POST /api/interview-recordings/upload
 * @desc    Upload interview recording to S3
 * @access  Private (Candidate)
 */
router.post('/upload', auth, upload.single('recording'), async (req, res) => {
  try {
    console.log('🚀 [ROUTE S3] Recording upload request received (S3-only mode)');
    console.log('👤 [ROUTE S3] User details:', {
      userId: req.user.id,
      userRole: req.user.role,
      userEmail: req.user.email
    });
    console.log('📋 [ROUTE S3] Request body:', {
      interviewId: req.body.interviewId,
      candidateName: req.body.candidateName,
      candidateEmail: req.body.candidateEmail,
      recruiterId: req.body.recruiterId,
      jobId: req.body.jobId,
      duration: req.body.duration,
      recordingType: req.body.recordingType,
      hasMetadata: !!req.body.metadata
    });
    console.log('📦 [ROUTE S3] File details:', req.file ? {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      sizeInMB: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
      bufferLength: req.file.buffer?.length
    } : 'No file received');

    if (!req.file) {
      console.error('❌ [ROUTE S3] No recording file provided in request');
      return res.status(400).json({
        success: false,
        message: 'No recording file provided'
      });
    }
    
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('❌ [ROUTE S3] File buffer is empty or invalid');
      return res.status(400).json({
        success: false,
        message: 'Invalid file buffer received'
      });
    }

    const {
      interviewId,
      candidateName,
      candidateEmail,
      recruiterId,
      jobId,
      duration,
      recordingStartedAt,
      recordingEndedAt,
      recordingType,
      metadata
    } = req.body;

    // Validate required fields
    if (!interviewId || !candidateName || !candidateEmail) {
      console.error('❌ [ROUTE S3] Missing required fields:', {
        hasInterviewId: !!interviewId,
        hasCandidateName: !!candidateName,
        hasCandidateEmail: !!candidateEmail
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: interviewId, candidateName, candidateEmail'
      });
    }

    // Prepare recording data
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};
    const recordingData = {
      interviewId,
      candidateId: req.user.id,
      candidateName,
      candidateEmail,
      recruiterId: recruiterId || null,
      jobId: jobId || null,
      duration: parseInt(duration) || 0,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      recordingType: recordingType || 'screen',
      recordingStartedAt: recordingStartedAt ? new Date(recordingStartedAt) : new Date(),
      recordingEndedAt: recordingEndedAt ? new Date(recordingEndedAt) : new Date(),
      metadata: parsedMetadata
    };
    
    console.log('📋 [ROUTE S3] Prepared recording data for S3 upload:', {
      ...recordingData,
      fileSize: `${recordingData.fileSize} bytes (${(recordingData.fileSize / 1024 / 1024).toFixed(2)} MB)`,
      duration: `${recordingData.duration}s`,
      recordingStartedAt: recordingData.recordingStartedAt.toISOString(),
      recordingEndedAt: recordingData.recordingEndedAt.toISOString(),
      metadataKeys: Object.keys(parsedMetadata)
    });

    // Save recording to S3 and database
    console.log('🚀 [ROUTE S3] Initiating S3 upload via recordingService...');
    const uploadStartTime = Date.now();
    
    const recording = await recordingService.saveRecording(recordingData, req.file.buffer);
    
    const uploadDuration = Date.now() - uploadStartTime;
    console.log('✅ [ROUTE S3] S3 upload and database save completed successfully!');
    console.log('📈 [ROUTE S3] Upload performance:', {
      recordingId: recording._id,
      totalTime: `${(uploadDuration / 1000).toFixed(2)}s`,
      uploadSpeed: `${(req.file.size / (uploadDuration / 1000) / 1024 / 1024).toFixed(2)} MB/s`,
      s3Key: recording.s3Key,
      s3Bucket: recording.s3Bucket,
      finalStatus: recording.status
    });

    const responseData = {
      success: true,
      message: 'Recording uploaded successfully to S3',
      data: {
        recordingId: recording._id,
        s3Url: recording.s3Url,
        s3Key: recording.s3Key,
        s3Bucket: recording.s3Bucket,
        s3Region: recording.s3Region,
        status: recording.status,
        duration: recording.duration,
        fileSize: recording.fileSize,
        uploadedAt: recording.uploadedAt,
        uploadProgress: recording.uploadProgress
      }
    };
    
    console.log('🎉 [ROUTE S3] Sending success response to frontend:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('❌ [ROUTE S3] Recording upload failed with error:', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      userId: req.user?.id,
      interviewId: req.body?.interviewId,
      fileSize: req.file?.size
    });
    
    // Enhanced error response based on error type
    let statusCode = 500;
    let errorMessage = 'Failed to upload recording to S3';
    
    if (error.message.includes('S3')) {
      statusCode = 503;
      errorMessage = 'S3 storage service unavailable';
      console.error('🔧 [ROUTE S3] S3-specific error detected');
    } else if (error.message.includes('credentials')) {
      statusCode = 500;
      errorMessage = 'S3 configuration error';
      console.error('🔐 [ROUTE S3] S3 credentials error detected');
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Upload timeout - file too large';
      console.error('⏰ [ROUTE S3] Upload timeout detected');
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      errorCode: error.name,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/interview-recordings/:recordingId
 * @desc    Get recording details with signed URL
 * @access  Private (Recruiter/Admin)
 */
router.get('/:recordingId', auth, async (req, res) => {
  try {
    const { recordingId } = req.params;

    console.log('📥 [GET RECORDING] Request:', recordingId, 'by user:', req.user.id);

    const recording = await recordingService.getRecordingWithSignedUrl(recordingId, req.user.id);

    // Check access permissions
    const isRecruiter = req.user.role === 'recruiter' || req.user.role === 'admin';
    const isOwner = recording.candidateId._id.toString() === req.user.id;

    if (!isRecruiter && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('✅ [GET RECORDING] Success:', recordingId);

    res.json({
      success: true,
      data: recording
    });
  } catch (error) {
    console.error('❌ [GET RECORDING] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recording',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/interview-recordings/interview/:interviewId
 * @desc    Get all recordings for an interview
 * @access  Private (Recruiter/Admin)
 */
router.get('/interview/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    console.log('📥 [GET INTERVIEW RECORDINGS] Request:', interviewId);

    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters and admins can view recordings.'
      });
    }

    const recordings = await recordingService.getInterviewRecordings(interviewId);

    console.log('✅ [GET INTERVIEW RECORDINGS] Found:', recordings.length);

    res.json({
      success: true,
      count: recordings.length,
      data: recordings
    });
  } catch (error) {
    console.error('❌ [GET INTERVIEW RECORDINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview recordings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/interview-recordings/recruiter/my-recordings
 * @desc    Get all recordings for the logged-in recruiter
 * @access  Private (Recruiter/Admin)
 */
router.get('/recruiter/my-recordings', auth, async (req, res) => {
  try {
    console.log('📥 [GET RECRUITER RECORDINGS] Request by:', req.user.id);

    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters and admins can view recordings.'
      });
    }

    const recordings = await recordingService.getRecruiterRecordings(req.user.id);

    console.log('✅ [GET RECRUITER RECORDINGS] Found:', recordings.length);

    res.json({
      success: true,
      count: recordings.length,
      data: recordings
    });
  } catch (error) {
    console.error('❌ [GET RECRUITER RECORDINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recruiter recordings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/interview-recordings/candidate/:candidateId
 * @desc    Get all recordings for a candidate
 * @access  Private (Recruiter/Admin/Own Candidate)
 */
router.get('/candidate/:candidateId', auth, async (req, res) => {
  try {
    const { candidateId } = req.params;

    console.log('📥 [GET CANDIDATE RECORDINGS] Request:', candidateId);

    // Check access permissions
    const isRecruiter = req.user.role === 'recruiter' || req.user.role === 'admin';
    const isOwner = candidateId === req.user.id;

    if (!isRecruiter && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const recordings = await InterviewRecording.findByCandidate(candidateId)
      .populate('recruiterId', 'name email')
      .populate('jobId', 'title company');

    console.log('✅ [GET CANDIDATE RECORDINGS] Found:', recordings.length);

    res.json({
      success: true,
      count: recordings.length,
      data: recordings
    });
  } catch (error) {
    console.error('❌ [GET CANDIDATE RECORDINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get candidate recordings',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/interview-recordings/:recordingId
 * @desc    Delete recording (soft delete)
 * @access  Private (Recruiter/Admin)
 */
router.delete('/:recordingId', auth, async (req, res) => {
  try {
    const { recordingId } = req.params;

    console.log('🗑️ [DELETE RECORDING] Request:', recordingId, 'by user:', req.user.id);

    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only recruiters and admins can delete recordings.'
      });
    }

    const recording = await recordingService.removeRecording(recordingId, req.user.id);

    console.log('✅ [DELETE RECORDING] Success:', recordingId);

    res.json({
      success: true,
      message: 'Recording deleted successfully',
      data: recording
    });
  } catch (error) {
    console.error('❌ [DELETE RECORDING] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/interview-recordings/stats/overview
 * @desc    Get recording statistics
 * @access  Private (Admin)
 */
router.get('/stats/overview', auth, async (req, res) => {
  try {
    console.log('📊 [RECORDING STATS] Request by:', req.user.id);

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const stats = await InterviewRecording.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalRecordings: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalDuration: { $sum: '$duration' },
          totalViews: { $sum: '$viewCount' },
          avgDuration: { $avg: '$duration' },
          avgFileSize: { $avg: '$fileSize' }
        }
      }
    ]);

    const statusBreakdown = await InterviewRecording.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('❌ [RECORDING STATS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recording stats',
      error: error.message
    });
  }
});

module.exports = router;
