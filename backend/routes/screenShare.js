const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ScreenShareSession = require('../models/ScreenShareSession');

// ==================== START SCREEN SHARE SESSION ====================
// Allow unauthenticated access for candidates (they might not be logged in via link)
router.post('/start', async (req, res) => {
  try {
    const { interviewId, candidateId, candidateName, candidateEmail } = req.body;

    console.log(`🎬 [SCREEN SHARE] Starting session for interview ${interviewId}`);
    console.log(`📋 [SCREEN SHARE] Candidate: ${candidateName} (${candidateEmail}), ID: ${candidateId}`);

    // Check if THIS CANDIDATE already has an active session for THIS INTERVIEW
    const existingSession = await ScreenShareSession.findOne({
      interviewId: interviewId,
      candidateId: candidateId || `guest_${Date.now()}`,
      status: 'active'
    });

    if (existingSession) {
      console.log(`⚠️ [SCREEN SHARE] Active session already exists for this candidate in this interview: ${existingSession._id}`);
      return res.json({
        success: true,
        session: {
          id: existingSession._id,
          interviewId: existingSession.interviewId,
          candidateId: existingSession.candidateId,
          status: existingSession.status,
          startedAt: existingSession.startedAt
        },
        message: 'Using existing active session'
      });
    }

    // Create new session
    const session = new ScreenShareSession({
      interviewId,
      candidateId: candidateId || `guest_${Date.now()}`,
      candidateName: candidateName || 'Anonymous Candidate',
      candidateEmail: candidateEmail || 'no-email@provided.com',
      status: 'active',
      permissionGranted: true,
      permissionGrantedAt: new Date(),
      startedAt: new Date()
    });

    await session.save();

    console.log(`✅ [SCREEN SHARE] New session created: ${session._id}`);

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
    console.error('🔍 [SCREEN SHARE START] Error details:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to start screen share session',
      details: error.message
    });
  }
});

// ==================== END SCREEN SHARE SESSION ====================
// Allow unauthenticated access for candidates
router.post('/end', async (req, res) => {
  try {
    const { sessionId, interviewId, candidateId } = req.body;

    console.log(`🛑 [SCREEN SHARE] Ending session request:`, {
      sessionId,
      interviewId,
      candidateId,
      body: req.body
    });

    let session;
    
    if (sessionId) {
      console.log(`🔍 [SCREEN SHARE] Looking for session by ID: ${sessionId}`);
      session = await ScreenShareSession.findById(sessionId);
    } else if (interviewId) {
      // Find by interviewId and candidateId (or any active session for that interview)
      const query = {
        interviewId,
        ...(candidateId ? { candidateId } : {}),
        status: 'active'
      };
      console.log(`🔍 [SCREEN SHARE] Looking for session with query:`, query);
      
      session = await ScreenShareSession.findOne(query).sort({ startedAt: -1 }); // Get most recent
      
      if (session) {
        console.log(`✅ [SCREEN SHARE] Found session:`, {
          id: session._id,
          interviewId: session.interviewId,
          candidateId: session.candidateId,
          status: session.status,
          startedAt: session.startedAt
        });
      }
    }

    if (!session) {
      console.log(`⚠️ [SCREEN SHARE] No active session found`);
      console.log(`🔍 [SCREEN SHARE] Checking all sessions for interview: ${interviewId}`);
      
      const allSessions = await ScreenShareSession.find({ interviewId }).sort({ startedAt: -1 });
      console.log(`📊 [SCREEN SHARE] All sessions for this interview:`, allSessions.map(s => ({
        id: s._id,
        candidateId: s.candidateId,
        status: s.status,
        startedAt: s.startedAt,
        endedAt: s.endedAt
      })));
      
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
        candidateId: s.candidateId, // Already a string!
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
// Temporarily allow without auth for testing
router.get('/active', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log(`📊 [SCREEN SHARE] Fetching active sessions${token ? ' (authenticated)' : ' (guest mode)'}`);

    // Get all active sessions (recruiters can see all)
    const sessions = await ScreenShareSession.getActiveSessions();

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s._id,
        interviewId: s.interviewId,
        candidateId: s.candidateId, // Don't use ._id, it's already a string!
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

// ==================== CLEANUP OLD SESSIONS ====================
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 [SCREEN SHARE] Cleaning up old sessions...');
    
    // End all sessions that have been active for more than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const result = await ScreenShareSession.updateMany(
      {
        status: 'active',
        startedAt: { $lt: twoHoursAgo }
      },
      {
        status: 'ended',
        endedAt: new Date()
      }
    );

    console.log(`✅ [SCREEN SHARE] Cleaned up ${result.modifiedCount} old sessions`);

    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} old sessions`
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE CLEANUP] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup sessions'
    });
  }
});

// ==================== FORCE END ALL ACTIVE SESSIONS ====================
router.post('/force-cleanup', async (req, res) => {
  try {
    console.log('🧹 [SCREEN SHARE] Force ending ALL active sessions...');
    
    const result = await ScreenShareSession.updateMany(
      { status: 'active' },
      { 
        status: 'ended',
        endedAt: new Date()
      }
    );

    console.log(`✅ [SCREEN SHARE] Force ended ${result.modifiedCount} sessions`);

    res.json({
      success: true,
      message: `Force ended ${result.modifiedCount} active sessions`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ [SCREEN SHARE FORCE CLEANUP] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force cleanup sessions'
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
