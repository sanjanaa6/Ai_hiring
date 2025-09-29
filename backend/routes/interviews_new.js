const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Import all handlers
const {
  getAllInterviews,
  getInterviewById,
  getPublicInterview,
  updateInterview,
  deleteInterview,
  generateInterview
} = require('../handlers/interviewCrud');

const {
  getUserProgress,
  startAnonymousInterview,
  startInterview,
  updateProgress,
  completeInterview
} = require('../handlers/interviewProgress');

const {
  submitAnswer,
  submitAnswers,
  getAnswers,
  completeInterview: completeInterviewAnswers
} = require('../handlers/interviewAnswers');

const {
  approveInterview,
  rejectInterview
} = require('../handlers/interviewApproval');

const {
  codingAssistant,
  generateCodingQuestion,
  getCodingHints,
  postCodingHints,
  markCodingDone,
  getCodingSubmissions
} = require('../handlers/interviewCoding');

const {
  getPerformanceAnalytics
} = require('../handlers/interviewAnalytics');

const {
  aiVoice,
  aiVoiceSpeak
} = require('../handlers/interviewVoice');

// ===== PUBLIC ROUTES (No authentication required) =====

// Get public interview (for shareable links)
router.get('/public/:interviewId', getPublicInterview);

// Start anonymous interview
router.post('/:interviewId/start-anonymous', startAnonymousInterview);

// Submit answers (anonymous)
router.post('/:interviewId/answer', submitAnswer);
router.post('/:interviewId/answers', submitAnswers);

// Get answers
router.get('/:interviewId/answers', getAnswers);

// Complete interview (anonymous)
router.post('/:interviewId/complete', completeInterviewAnswers);

// Live coding assistant (anonymous)
router.post('/:interviewId/coding-assistant', codingAssistant);

// Generate coding question (anonymous)
router.post('/:interviewId/generate-coding-question', generateCodingQuestion);

// Get coding hints (anonymous)
router.get('/:interviewId/coding-hints', getCodingHints);
router.post('/:interviewId/coding-hints', postCodingHints);

// Mark coding as done (anonymous)
router.post('/:interviewId/coding-done', markCodingDone);

// Get coding submissions (anonymous)
router.get('/:interviewId/coding-submissions', getCodingSubmissions);

// AI Voice endpoints (anonymous)
router.post('/:interviewId/ai-voice', aiVoice);
router.post('/:interviewId/ai-voice-speak', aiVoiceSpeak);

// ===== AUTHENTICATED ROUTES =====

// Get user's interview progress
router.get('/progress', auth, getUserProgress);

// Get all interviews for user
router.get('/', auth, getAllInterviews);

// Generate interview
router.post('/generate', auth, generateInterview);

// ===== INTERVIEW-SPECIFIC AUTHENTICATED ROUTES =====

// Get interview by ID (authenticated)
router.get('/:interviewId', auth, getInterviewById);

// Update interview
router.patch('/:interviewId', auth, updateInterview);

// Delete interview
router.delete('/:interviewId', auth, deleteInterview);

// Start interview (authenticated)
router.post('/:interviewId/start', auth, startInterview);

// Update progress (authenticated)
router.post('/:interviewId/progress', auth, updateProgress);

// Complete interview (authenticated)
router.post('/:interviewId/complete', auth, completeInterview);

// Approve interview
router.post('/:interviewId/approve', auth, approveInterview);

// Reject interview
router.post('/:interviewId/reject', auth, rejectInterview);

// Get performance analytics
router.get('/:interviewId/performance', auth, getPerformanceAnalytics);

module.exports = router;
