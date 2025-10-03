const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const {
  trackViolation,
  getEyeTrackingStatus,
  startEyeTracking,
  stopEyeTracking,
  terminateInterview,
  getViolationAnalytics
} = require('../handlers/eyeTrackingMonitoring');

// Track eye tracking violation
// POST /api/eye-tracking/violation
router.post('/violation', auth, trackViolation);

// Get eye tracking status for an interview
// GET /api/eye-tracking/status/:interviewId
router.get('/status/:interviewId', auth, getEyeTrackingStatus);

// Start eye tracking monitoring
// POST /api/eye-tracking/start
router.post('/start', auth, startEyeTracking);

// Stop eye tracking monitoring
// POST /api/eye-tracking/stop
router.post('/stop', auth, stopEyeTracking);

// Terminate interview due to violations
// POST /api/eye-tracking/terminate
router.post('/terminate', auth, terminateInterview);

// Get violation analytics (admin only)
// GET /api/eye-tracking/analytics
router.get('/analytics', auth, requireRole(['admin', 'recruiter']), getViolationAnalytics);

module.exports = router;
