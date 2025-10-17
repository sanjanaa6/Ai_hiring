const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// Auto-save PCB design
router.post('/pcb-design/autosave', async (req, res) => {
  try {
    const {
      interviewId,
      roundId,
      questionId,
      pcbData,
      timeSpent,
      candidateId,
      candidateName,
      candidateEmail
    } = req.body;

    console.log('🔧 [PCB DESIGN] Auto-saving design:', {
      interviewId,
      roundId,
      questionId,
      candidateId,
      componentsCount: pcbData?.canvasState?.components?.length || 0
    });

    // Find the interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if submission already exists
    const existingSubmissionIndex = interview.pcbDesignSubmissions?.findIndex(
      sub => sub.candidateId === candidateId && sub.roundId === roundId && sub.questionId === questionId
    ) ?? -1;

    const submissionData = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      questionId,
      pcbData,
      timeSpent,
      submittedAt: new Date(),
      status: 'in_progress'
    };

    // Initialize array if it doesn't exist
    if (!interview.pcbDesignSubmissions) {
      interview.pcbDesignSubmissions = [];
    }

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      interview.pcbDesignSubmissions[existingSubmissionIndex] = {
        ...interview.pcbDesignSubmissions[existingSubmissionIndex].toObject(),
        ...submissionData
      };
    } else {
      // Create new submission
      interview.pcbDesignSubmissions.push(submissionData);
    }

    await interview.save();

    console.log('✅ [PCB DESIGN] Auto-save successful');
    res.json({ success: true, message: 'PCB design auto-saved successfully' });
  } catch (error) {
    console.error('❌ [PCB DESIGN] Auto-save error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-save PCB design', error: error.message });
  }
});

// Submit PCB design (final submission)
router.post('/pcb-design/submit', async (req, res) => {
  try {
    const {
      interviewId,
      roundId,
      questionId,
      pcbData,
      timeSpent,
      candidateId,
      candidateName,
      candidateEmail
    } = req.body;

    console.log('🔧 [PCB DESIGN] Submitting design:', {
      interviewId,
      roundId,
      questionId,
      candidateId,
      componentsCount: pcbData?.canvasState?.components?.length || 0
    });

    // Validate required fields
    if (!interviewId || interviewId === '') {
      console.error('❌ [PCB DESIGN] Missing interviewId');
      return res.status(400).json({ success: false, message: 'Interview ID is required' });
    }

    if (!roundId || roundId === '') {
      console.error('❌ [PCB DESIGN] Missing roundId');
      return res.status(400).json({ success: false, message: 'Round ID is required' });
    }

    // Find the interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      console.error('❌ [PCB DESIGN] Interview not found:', interviewId);
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if submission already exists
    const existingSubmissionIndex = interview.pcbDesignSubmissions?.findIndex(
      sub => sub.candidateId === candidateId && sub.roundId === roundId && sub.questionId === questionId
    ) ?? -1;

    const submissionData = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      questionId,
      pcbData,
      timeSpent,
      submittedAt: new Date(),
      status: 'submitted'
    };

    // Initialize array if it doesn't exist
    if (!interview.pcbDesignSubmissions) {
      interview.pcbDesignSubmissions = [];
    }

    if (existingSubmissionIndex !== -1) {
      // Update existing submission
      interview.pcbDesignSubmissions[existingSubmissionIndex] = {
        ...interview.pcbDesignSubmissions[existingSubmissionIndex].toObject(),
        ...submissionData
      };
    } else {
      // Create new submission
      interview.pcbDesignSubmissions.push(submissionData);
    }

    await interview.save();

    console.log('✅ [PCB DESIGN] Submission successful');
    res.json({ 
      success: true, 
      message: 'PCB design submitted successfully',
      submission: submissionData
    });
  } catch (error) {
    console.error('❌ [PCB DESIGN] Submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit PCB design', error: error.message });
  }
});

// Get PCB design submission for a candidate
router.get('/pcb-design/:interviewId/:roundId/:questionId/:candidateId', async (req, res) => {
  try {
    const { interviewId, roundId, questionId, candidateId } = req.params;

    console.log('🔧 [PCB DESIGN] Fetching submission:', {
      interviewId,
      roundId,
      questionId,
      candidateId
    });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const submission = interview.pcbDesignSubmissions?.find(
      sub => sub.candidateId === candidateId && sub.roundId === roundId && sub.questionId === questionId
    );

    if (!submission) {
      return res.json({ success: true, submission: null, message: 'No submission found' });
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error('❌ [PCB DESIGN] Fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission', error: error.message });
  }
});

// Get all PCB design submissions for an interview (for recruiters)
router.get('/pcb-design/:interviewId/all', async (req, res) => {
  try {
    const { interviewId } = req.params;

    console.log('🔧 [PCB DESIGN] Fetching all submissions for interview:', interviewId);

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.json({ 
      success: true, 
      submissions: interview.pcbDesignSubmissions || [],
      count: interview.pcbDesignSubmissions?.length || 0
    });
  } catch (error) {
    console.error('❌ [PCB DESIGN] Fetch all error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
});

// Review/score a PCB design submission (for recruiters)
router.post('/pcb-design/review', async (req, res) => {
  try {
    const {
      interviewId,
      roundId,
      questionId,
      candidateId,
      score,
      reviewNotes,
      status,
      reviewedBy
    } = req.body;

    console.log('🔧 [PCB DESIGN] Reviewing submission:', {
      interviewId,
      roundId,
      questionId,
      candidateId,
      score,
      status
    });

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const submissionIndex = interview.pcbDesignSubmissions?.findIndex(
      sub => sub.candidateId === candidateId && sub.roundId === roundId && sub.questionId === questionId
    ) ?? -1;

    if (submissionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Update submission with review
    interview.pcbDesignSubmissions[submissionIndex] = {
      ...interview.pcbDesignSubmissions[submissionIndex].toObject(),
      score,
      reviewNotes,
      status: status || 'reviewed',
      reviewedBy,
      reviewedAt: new Date()
    };

    await interview.save();

    console.log('✅ [PCB DESIGN] Review saved successfully');
    res.json({ 
      success: true, 
      message: 'Review saved successfully',
      submission: interview.pcbDesignSubmissions[submissionIndex]
    });
  } catch (error) {
    console.error('❌ [PCB DESIGN] Review error:', error);
    res.status(500).json({ success: false, message: 'Failed to save review', error: error.message });
  }
});

module.exports = router;
