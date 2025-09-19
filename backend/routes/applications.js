const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply for job
router.post('/', [
  auth,
  authorize('candidate'),
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('coverLetter').trim().isLength({ min: 10 }).withMessage('Cover letter must be at least 10 characters'),
  body('resume').trim().isLength({ min: 1 }).withMessage('Resume is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, coverLetter, resume, additionalDocuments = [] } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create application
    const application = new Application({
      job: jobId,
      candidate: req.user._id,
      coverLetter,
      resume,
      additionalDocuments
    });

    await application.save();

    // Add application to job
    job.applications.push(application._id);
    await job.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's applications
router.get('/my', auth, authorize('candidate'), async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate('job', 'title company location type status')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for a job (recruiters only)
router.get('/job/:jobId', [
  auth,
  authorize('recruiter', 'admin')
], async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email profile')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (recruiters only)
router.put('/:id/status', [
  auth,
  authorize('recruiter', 'admin'),
  body('status').isIn(['pending', 'reviewing', 'shortlisted', 'rejected', 'hired']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    if (notes) application.notes = notes;

    await application.save();

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single application
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company location type')
      .populate('candidate', 'name email profile');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is authorized to view this application
    const isOwner = application.candidate._id.toString() === req.user._id.toString();
    const isJobPoster = application.job.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isJobPoster && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
