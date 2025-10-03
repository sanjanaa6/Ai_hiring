const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const {
  upload,
  uploadInterviewFile,
  getCandidateUploads,
  getAllInterviewUploads,
  downloadFile,
  reviewFile
} = require('../handlers/fileUpload');

// Upload file for interview round
router.post('/interviews/:interviewId/upload', 
  auth, 
  upload.single('file'), 
  uploadInterviewFile
);

// Get candidate's uploaded files
router.get('/interviews/:interviewId/uploads', 
  auth, 
  getCandidateUploads
);

// Get all uploaded files for an interview (for recruiters/admins)
router.get('/interviews/:interviewId/all-uploads', 
  auth, 
  requireRole(['admin', 'recruiter']), 
  getAllInterviewUploads
);

// Download file (for recruiters/admins)
router.get('/interviews/:interviewId/files/:fileName/download', 
  auth, 
  requireRole(['admin', 'recruiter']), 
  downloadFile
);

// Review uploaded file (for recruiters/admins)
router.put('/interviews/:interviewId/files/:fileName/review', 
  auth, 
  requireRole(['admin', 'recruiter']), 
  reviewFile
);

module.exports = router;

