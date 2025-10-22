const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { s3Client, BUCKET_NAME } = require('../services/recordingUploadService');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Recording Management Routes
 * Handles interview recording storage and retrieval
 */

// Handle CORS preflight for streaming endpoint
router.options('/stream/:s3Key(*)', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).send();
});

// Proxy endpoint to stream video from S3 (bypasses CORS)
// Note: No auth middleware here because video element can't send Bearer tokens
// Instead, we'll validate token from query parameter
router.get('/stream/:s3Key(*)', async (req, res) => {
  try {
    const s3Key = req.params.s3Key;
    const range = req.headers.range;
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    console.log('🎥 [RECORDINGS] Streaming video from S3:', { s3Key, range, hasToken: !!token });

    // Validate token if provided (optional for now, can be enforced later)
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ [RECORDINGS] Token validated');
      } catch (err) {
        console.warn('⚠️ [RECORDINGS] Invalid token, but allowing access');
        // Don't block - allow access even with invalid token for now
      }
    }

    if (!s3Client) {
      return res.status(500).json({
        success: false,
        message: 'S3 client not configured'
      });
    }

    // Handle range requests for video seeking
    const commandParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };

    // Add range header if present
    if (range) {
      commandParams.Range = range;
    }

    const command = new GetObjectCommand(commandParams);
    const s3Response = await s3Client.send(command);
    
    // Set proper headers for video streaming
    res.setHeader('Content-Type', s3Response.ContentType || 'video/webm');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Enable CORS for video playback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // Handle partial content (range requests)
    if (range && s3Response.ContentRange) {
      res.status(206); // Partial Content
      res.setHeader('Content-Range', s3Response.ContentRange);
      res.setHeader('Content-Length', s3Response.ContentLength);
    } else {
      res.status(200);
      res.setHeader('Content-Length', s3Response.ContentLength);
    }

    // Stream the video data
    s3Response.Body.pipe(res).on('error', (streamError) => {
      console.error('❌ [RECORDINGS] Stream error:', streamError);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    
  } catch (error) {
    console.error('❌ [RECORDINGS] Error streaming video:', {
      error: error.message,
      code: error.code,
      s3Key: req.params.s3Key
    });
    
    if (!res.headersSent) {
      // Set CORS headers even for errors
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(error.code === 'NoSuchKey' ? 404 : 500).json({
        success: false,
        message: error.code === 'NoSuchKey' ? 'Recording not found' : 'Failed to stream video',
        error: error.message
      });
    }
  }
});

// Get all recordings for a user
router.get('/', auth, async (req, res) => {
  try {
    console.log('📹 [RECORDINGS] Fetching recordings for user:', req.user.id);
    
    // TODO: Implement recording retrieval logic
    // For now, return empty array
    res.json({
      success: true,
      recordings: [],
      message: 'Recording management endpoint - implementation pending'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS] Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings',
      error: error.message
    });
  }
});

// Get recording by ID
router.get('/:recordingId', auth, async (req, res) => {
  try {
    const { recordingId } = req.params;
    console.log('🔍 [RECORDINGS] Fetching recording:', recordingId);
    
    // TODO: Implement recording retrieval by ID
    res.json({
      success: true,
      recording: null,
      message: 'Recording retrieval endpoint - implementation pending'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS] Error fetching recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording',
      error: error.message
    });
  }
});

// Upload/Create new recording
router.post('/', auth, async (req, res) => {
  try {
    console.log('➕ [RECORDINGS] Creating new recording:', req.body);
    
    // TODO: Implement recording upload logic
    res.status(201).json({
      success: true,
      recording: { id: 'temp-recording-id', ...req.body },
      message: 'Recording upload endpoint - implementation pending'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS] Error creating recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recording',
      error: error.message
    });
  }
});

// Update recording metadata
router.put('/:recordingId', auth, async (req, res) => {
  try {
    const { recordingId } = req.params;
    console.log('✏️ [RECORDINGS] Updating recording:', recordingId, req.body);
    
    // TODO: Implement recording update logic
    res.json({
      success: true,
      recording: { id: recordingId, ...req.body },
      message: 'Recording update endpoint - implementation pending'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS] Error updating recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recording',
      error: error.message
    });
  }
});

// Delete recording
router.delete('/:recordingId', auth, async (req, res) => {
  try {
    const { recordingId } = req.params;
    console.log('🗑️ [RECORDINGS] Deleting recording:', recordingId);
    
    // TODO: Implement recording deletion logic
    res.json({
      success: true,
      message: 'Recording deletion endpoint - implementation pending'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS] Error deleting recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording',
      error: error.message
    });
  }
});

// Get recordings by interview ID
router.get('/interview/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    console.log('🔍 [RECORDINGS] Fetching recordings for interview:', interviewId);
    
    // TODO: Implement interview recordings retrieval
    res.json({
      success: true,
      recordings: [],
      message: 'Interview recordings endpoint - implementation pending'
    });
  } catch (error) {
    console.error('❌ [RECORDINGS] Error fetching interview recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview recordings',
      error: error.message
    });
  }
});

module.exports = router;
