const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// Auto-save system design diagram
router.post('/system-design/autosave', async (req, res) => {
  try {
    const {
      interviewId,
      roundId,
      diagramData,
      timeSpent,
      candidateId,
      candidateName,
      candidateEmail
    } = req.body;

    console.log('📐 [SYSTEM DESIGN] Auto-saving diagram:', {
      interviewId,
      roundId,
      candidateId,
      elementsCount: diagramData?.elements?.length || 0
    });

    // Find the interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if submission already exists
    const existingSubmissionIndex = interview.systemDesignSubmissions.findIndex(
      sub => sub.candidateId === candidateId && sub.roundId === roundId
    );

    const submissionData = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      diagramData,
      timeSpent,
      submittedAt: new Date(),
      status: 'submitted'
    };

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      interview.systemDesignSubmissions[existingSubmissionIndex] = {
        ...interview.systemDesignSubmissions[existingSubmissionIndex].toObject(),
        ...submissionData
      };
    } else {
      // Create new submission
      interview.systemDesignSubmissions.push(submissionData);
    }

    await interview.save();

    console.log('✅ [SYSTEM DESIGN] Auto-save successful');
    res.json({ success: true, message: 'Diagram auto-saved successfully' });
  } catch (error) {
    console.error('❌ [SYSTEM DESIGN] Auto-save error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-save diagram', error: error.message });
  }
});

// Submit system design diagram (final submission)
router.post('/system-design/submit', async (req, res) => {
  try {
    const {
      interviewId,
      roundId,
      diagramData,
      timeSpent,
      candidateId,
      candidateName,
      candidateEmail
    } = req.body;

    console.log('📐 [SYSTEM DESIGN] Submitting diagram:', {
      interviewId,
      roundId,
      candidateId,
      elementsCount: diagramData?.elements?.length || 0
    });

    // Find the interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if submission already exists
    const existingSubmissionIndex = interview.systemDesignSubmissions.findIndex(
      sub => sub.candidateId === candidateId && sub.roundId === roundId
    );

    const submissionData = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      diagramData,
      timeSpent,
      submittedAt: new Date(),
      status: 'submitted'
    };

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      interview.systemDesignSubmissions[existingSubmissionIndex] = {
        ...interview.systemDesignSubmissions[existingSubmissionIndex].toObject(),
        ...submissionData
      };
    } else {
      // Create new submission
      interview.systemDesignSubmissions.push(submissionData);
    }

    await interview.save();

    console.log('✅ [SYSTEM DESIGN] Submission successful');
    res.json({ 
      success: true, 
      message: 'System design submitted successfully',
      submission: submissionData
    });
  } catch (error) {
    console.error('❌ [SYSTEM DESIGN] Submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit diagram', error: error.message });
  }
});

// Get system design submission for a candidate
router.get('/system-design/:interviewId/:roundId/:candidateId', async (req, res) => {
  try {
    const { interviewId, roundId, candidateId } = req.params;

    console.log('📐 [SYSTEM DESIGN] Fetching submission:', {
      interviewId,
      roundId,
      candidateId
    });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const submission = interview.systemDesignSubmissions.find(
      sub => sub.candidateId === candidateId && sub.roundId === roundId
    );

    if (!submission) {
      return res.json({ success: true, submission: null, message: 'No submission found' });
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error('❌ [SYSTEM DESIGN] Fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission', error: error.message });
  }
});

// Get all system design submissions for an interview (for recruiters)
router.get('/system-design/:interviewId/all', async (req, res) => {
  try {
    const { interviewId } = req.params;

    console.log('📐 [SYSTEM DESIGN] Fetching all submissions for interview:', interviewId);

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.json({ 
      success: true, 
      submissions: interview.systemDesignSubmissions || [],
      count: interview.systemDesignSubmissions?.length || 0
    });
  } catch (error) {
    console.error('❌ [SYSTEM DESIGN] Fetch all error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
});

// Review/score a system design submission (for recruiters)
router.post('/system-design/review', async (req, res) => {
  try {
    const {
      interviewId,
      roundId,
      candidateId,
      score,
      reviewNotes,
      status,
      reviewedBy
    } = req.body;

    console.log('📐 [SYSTEM DESIGN] Reviewing submission:', {
      interviewId,
      roundId,
      candidateId,
      score,
      status
    });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const submissionIndex = interview.systemDesignSubmissions.findIndex(
      sub => sub.candidateId === candidateId && sub.roundId === roundId
    );

    if (submissionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Update submission with review
    interview.systemDesignSubmissions[submissionIndex] = {
      ...interview.systemDesignSubmissions[submissionIndex].toObject(),
      score,
      reviewNotes,
      status: status || 'reviewed',
      reviewedBy,
      reviewedAt: new Date()
    };

    await interview.save();

    console.log('✅ [SYSTEM DESIGN] Review saved successfully');
    res.json({ 
      success: true, 
      message: 'Review saved successfully',
      submission: interview.systemDesignSubmissions[submissionIndex]
    });
  } catch (error) {
    console.error('❌ [SYSTEM DESIGN] Review error:', error);
    res.status(500).json({ success: false, message: 'Failed to save review', error: error.message });
  }
});

module.exports = router;
