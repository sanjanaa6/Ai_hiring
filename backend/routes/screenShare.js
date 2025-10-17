const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ScreenShareSession = require('../models/ScreenShareSession');

// ==================== START SCREEN SHARE SESSION ====================
router.post('/start', auth, async (req, res) => {
  try {
    const { interviewId, candidateName, candidateEmail } = req.body;

    console.log(`🎬 [SCREEN SHARE] Starting session for interview ${interviewId}`);

    // Create new session
    const session = new ScreenShareSession({
      interviewId,
      candidateId: req.user.id,
      candidateName: candidateName || req.user.name,
      candidateEmail: candidateEmail || req.user.email,
      status: 'active',
      permissionGranted: true,
      permissionGrantedAt: new Date(),
      startedAt: new Date()
    });

    await session.save();

    console.log(`✅ [SCREEN SHARE] Session created: ${session._id}`);

    res.json({
      success: true,
      session: {
        id: session._id,
        interviewId: session.interviewId,
        status: session.status,
        startedAt: session.startedAt
      }
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE START] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start screen share session'
    });
  }
});

// ==================== END SCREEN SHARE SESSION ====================
router.post('/end', auth, async (req, res) => {
  try {
    const { sessionId, interviewId } = req.body;

    console.log(`🛑 [SCREEN SHARE] Ending session ${sessionId || `for interview ${interviewId}`}`);

    let session;
    
    if (sessionId) {
      session = await ScreenShareSession.findById(sessionId);
    } else if (interviewId) {
      session = await ScreenShareSession.findOne({
        interviewId,
        candidateId: req.user.id,
        status: 'active'
      });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await session.end();

    console.log(`✅ [SCREEN SHARE] Session ended: ${session._id}, Duration: ${session.duration}s`);

    res.json({
      success: true,
      session: {
        id: session._id,
        duration: session.duration,
        endedAt: session.endedAt
      }
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE END] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end screen share session'
    });
  }
});

// ==================== GET SESSION BY INTERVIEW ====================
router.get('/session/:interviewId', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    console.log(`📊 [SCREEN SHARE] Fetching sessions for interview ${interviewId}`);

    const sessions = await ScreenShareSession.getSessionsByInterview(interviewId);

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s._id,
        candidateId: s.candidateId?._id,
        candidateName: s.candidateName,
        candidateEmail: s.candidateEmail,
        recruiterId: s.recruiterId?._id,
        recruiterName: s.recruiterName,
        status: s.status,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        duration: s.duration,
        flagged: s.flagged,
        flagReason: s.flagReason,
        notes: s.notes
      }))
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE GET] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// ==================== GET ACTIVE SESSIONS (FOR RECRUITERS) ====================
router.get('/active', auth, async (req, res) => {
  try {
    console.log(`📊 [SCREEN SHARE] Fetching active sessions for recruiter ${req.user.id}`);

    // Get all active sessions (recruiters can see all)
    const sessions = await ScreenShareSession.getActiveSessions();

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s._id,
        interviewId: s.interviewId,
        candidateId: s.candidateId?._id,
        candidateName: s.candidateName,
        candidateEmail: s.candidateEmail,
        status: s.status,
        startedAt: s.startedAt,
        duration: Math.floor((new Date() - s.startedAt) / 1000),
        flagged: s.flagged,
        quality: s.quality
      }))
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE ACTIVE] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active sessions'
    });
  }
});

// ==================== ADD NOTE TO SESSION ====================
router.post('/note', auth, async (req, res) => {
  try {
    const { sessionId, note } = req.body;

    console.log(`📝 [SCREEN SHARE] Adding note to session ${sessionId}`);

    const session = await ScreenShareSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await session.addNote(req.user.id, req.user.name, note);

    console.log(`✅ [SCREEN SHARE] Note added to session ${sessionId}`);

    res.json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE NOTE] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    });
  }
});

// ==================== FLAG SESSION ====================
router.post('/flag', auth, async (req, res) => {
  try {
    const { sessionId, reason } = req.body;

    console.log(`⚠️ [SCREEN SHARE] Flagging session ${sessionId}: ${reason}`);

    const session = await ScreenShareSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await session.flag(reason);

    console.log(`✅ [SCREEN SHARE] Session ${sessionId} flagged`);

    res.json({
      success: true,
      message: 'Session flagged successfully'
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE FLAG] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to flag session'
    });
  }
});

// ==================== UPDATE SESSION STATUS ====================
router.patch('/status', auth, async (req, res) => {
  try {
    const { sessionId, status } = req.body;

    console.log(`🔄 [SCREEN SHARE] Updating session ${sessionId} status to ${status}`);

    const session = await ScreenShareSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.status = status;
    await session.save();

    console.log(`✅ [SCREEN SHARE] Session ${sessionId} status updated`);

    res.json({
      success: true,
      session: {
        id: session._id,
        status: session.status
      }
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE STATUS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session status'
    });
  }
});

// ==================== UPDATE SESSION QUALITY METRICS ====================
router.post('/quality', auth, async (req, res) => {
  try {
    const { sessionId, quality } = req.body;

    const session = await ScreenShareSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.quality = {
      ...session.quality,
      ...quality
    };

    await session.save();

    res.json({
      success: true,
      message: 'Quality metrics updated'
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE QUALITY] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quality metrics'
    });
  }
});

module.exports = router;
