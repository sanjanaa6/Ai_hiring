const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Interview = require('../models/Interview');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/form-submissions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.body.fieldId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|rtf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'));
    }
  }
});

// Submit form data
router.post('/submit-form', async (req, res) => {
  try {
    console.log('Form submission request received:', req.body);
    const { candidateId, candidateName, candidateEmail, roundId, responses } = req.body;

    console.log('Extracted fields:', {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      responsesLength: responses?.length
    });

    if (!candidateId || !candidateName || !candidateEmail || !roundId || !responses) {
      console.log('Missing required fields:', {
        candidateId: !!candidateId,
        candidateName: !!candidateName,
        candidateEmail: !!candidateEmail,
        roundId: !!roundId,
        responses: !!responses
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Find the interview by roundId
    console.log('Looking for interview with roundId:', roundId);
    const interview = await Interview.findOne({ 'rounds.roundId': roundId });
    if (!interview) {
      console.log('Interview not found for roundId:', roundId);
      return res.status(404).json({
        success: false,
        error: 'Interview round not found'
      });
    }
    console.log('Found interview:', interview.interviewId);

    // Check if form submission already exists
    const existingSubmission = interview.formSubmissions.find(
      submission => submission.candidateId === candidateId && submission.roundId === roundId
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: 'Form already submitted for this round'
      });
    }

    // Create form submission
    const formSubmission = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      responses,
      submittedAt: new Date(),
      isComplete: true
    };

    // Add to interview
    interview.formSubmissions.push(formSubmission);
    await interview.save();

    res.json({
      success: true,
      message: 'Form submitted successfully',
      data: formSubmission
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit form'
    });
  }
});

// Upload file for form field
router.post('/upload-form-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { fieldId, roundId } = req.body;

    if (!fieldId || !roundId) {
      return res.status(400).json({
        success: false,
        error: 'Missing fieldId or roundId'
      });
    }

    // Find the interview and round
    const interview = await Interview.findOne({ 'rounds.roundId': roundId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview round not found'
      });
    }

    const round = interview.rounds.find(r => r.roundId === roundId);
    if (!round || round.type !== 'form_submission') {
      return res.status(400).json({
        success: false,
        error: 'Invalid round type'
      });
    }

    // Check if field exists and is file type
    const field = round.formFields.find(f => f.id === fieldId);
    if (!field || field.type !== 'file') {
      return res.status(400).json({
        success: false,
        error: 'Invalid field type'
      });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filePath: `/uploads/form-submissions/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
        fieldId: fieldId
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
});

// Get form submissions for a round (for recruiters)
router.get('/round/:roundId/submissions', async (req, res) => {
  try {
    const { roundId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const interview = await Interview.findOne({ 'rounds.roundId': roundId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview round not found'
      });
    }

    const round = interview.rounds.find(r => r.roundId === roundId);
    if (!round || round.type !== 'form_submission') {
      return res.status(400).json({
        success: false,
        error: 'Invalid round type'
      });
    }

    // Get form submissions for this round
    const submissions = interview.formSubmissions.filter(
      submission => submission.roundId === roundId
    );

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedSubmissions = submissions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        submissions: paginatedSubmissions,
        total: submissions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(submissions.length / limit),
        round: {
          roundId: round.roundId,
          title: round.title,
          description: round.description,
          formFields: round.formFields
        }
      }
    });

  } catch (error) {
    console.error('Get form submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get form submissions'
    });
  }
});

// Get specific form submission
router.get('/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    const interview = await Interview.findOne({ 
      'formSubmissions._id': submissionId 
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Form submission not found'
      });
    }

    const submission = interview.formSubmissions.id(submissionId);
    const round = interview.rounds.find(r => r.roundId === submission.roundId);

    res.json({
      success: true,
      data: {
        submission: submission,
        round: {
          roundId: round.roundId,
          title: round.title,
          description: round.description,
          formFields: round.formFields
        }
      }
    });

  } catch (error) {
    console.error('Get form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get form submission'
    });
  }
});

// Download form submission file
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/form-submissions', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
});

// Get form submission statistics
router.get('/round/:roundId/stats', async (req, res) => {
  try {
    const { roundId } = req.params;

    const interview = await Interview.findOne({ 'rounds.roundId': roundId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview round not found'
      });
    }

    const round = interview.rounds.find(r => r.roundId === roundId);
    if (!round || round.type !== 'form_submission') {
      return res.status(400).json({
        success: false,
        error: 'Invalid round type'
      });
    }

    const submissions = interview.formSubmissions.filter(
      submission => submission.roundId === roundId
    );

    const stats = {
      totalSubmissions: submissions.length,
      completedSubmissions: submissions.filter(s => s.isComplete).length,
      completionRate: submissions.length > 0 ? 
        (submissions.filter(s => s.isComplete).length / submissions.length) * 100 : 0,
      averageFieldsFilled: submissions.length > 0 ?
        submissions.reduce((sum, s) => sum + s.responses.length, 0) / submissions.length : 0,
      recentSubmissions: submissions
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get form submission stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get form submission statistics'
    });
  }
});

module.exports = router;
