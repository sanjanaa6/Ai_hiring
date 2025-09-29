const express = require('express');
const router = express.Router();
const {
  recordEyeTrackingViolation,
  getMonitoringData,
  getFlaggedInterviews,
  clearInterviewFlag,
  getMonitoringStats,
  getAutoRemovedInterviews
} = require('../handlers/interviewMonitoring');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Record eye tracking violation (candidate endpoint)
router.post('/violations', auth, recordEyeTrackingViolation);

// Get monitoring data for an interview (candidate/admin endpoint)
router.get('/data/:interviewId/:userId', auth, getMonitoringData);

// Get flagged interviews (admin only)
router.get('/flagged', auth, requireRole(['admin']), getFlaggedInterviews);

// Clear interview flag (admin only)
router.post('/flagged/:interviewId/clear', auth, requireRole(['admin']), clearInterviewFlag);

// Get monitoring statistics (admin only)
router.get('/stats', auth, requireRole(['admin']), getMonitoringStats);

// Get automatically removed interviews (admin only)
router.get('/auto-removed', auth, requireRole(['admin']), getAutoRemovedInterviews);

module.exports = router;
