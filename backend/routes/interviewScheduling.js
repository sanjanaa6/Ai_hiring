const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const InterviewSchedule = require('../models/InterviewSchedule');
const Interview = require('../models/Interview');
const User = require('../models/User');

// Health check route for scheduling
router.get('/health', (req, res) => {
  console.log('🔍 [SCHEDULING] Health check endpoint accessed');
  res.json({ success: true, message: 'Interview scheduling routes are working!' });
});

// Get all schedules for an interview
router.get('/:interviewId/schedules', auth, async (req, res) => {
  console.log('🔍 [SCHEDULING] GET schedules for interview:', req.params.interviewId);
  try {
    const { interviewId } = req.params;
    
    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const schedules = await InterviewSchedule.find({ interviewId: interviewId })
      .sort({ roundNumber: 1 });

    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create a new schedule
router.post('/:interviewId/schedules', auth, async (req, res) => {
  console.log('🔍 [SCHEDULING] POST create schedule for interview:', req.params.interviewId);
  console.log('📊 [SCHEDULING] Request body:', req.body);
  try {
    const { interviewId } = req.params;
    const scheduleData = req.body;

    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate required fields
    const { roundName, roundNumber, startDateTime, endDateTime, duration, maxCandidates } = scheduleData;
    if (!roundName || !roundNumber || !startDateTime || !endDateTime || !duration || !maxCandidates) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: roundName, roundNumber, startDateTime, endDateTime, duration, maxCandidates' 
      });
    }

    // Check for duplicate round numbers
    const existingSchedule = await InterviewSchedule.findOne({ 
      interviewId: interviewId, 
      roundNumber: parseInt(roundNumber) 
    });
    if (existingSchedule) {
      return res.status(400).json({ 
        success: false, 
        message: `Round ${roundNumber} already exists for this interview` 
      });
    }

    const schedule = new InterviewSchedule({
      ...scheduleData,
      interviewId: interviewId,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await schedule.save();

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update a schedule
router.put('/:interviewId/schedules/:scheduleId', auth, async (req, res) => {
  try {
    const { interviewId, scheduleId } = req.params;
    const updateData = req.body;

    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const schedule = await InterviewSchedule.findOne({ _id: scheduleId, interviewId: interviewId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Update schedule
    Object.assign(schedule, updateData);
    schedule.updatedAt = new Date();
    await schedule.save();

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete a schedule
router.delete('/:interviewId/schedules/:scheduleId', auth, async (req, res) => {
  try {
    const { interviewId, scheduleId } = req.params;

    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const schedule = await InterviewSchedule.findOne({ _id: scheduleId, interviewId: interviewId });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await InterviewSchedule.findByIdAndDelete(scheduleId);

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get candidates for an interview
router.get('/:interviewId/candidates', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get candidates who have applied to this interview
    const candidates = await User.find({ 
      'interviewProgress.interviewId': interviewId 
    }).select('name email interviewProgress');

    // Transform the data to include interview-specific information
    const transformedCandidates = candidates.map(candidate => {
      const interviewProgress = candidate.interviewProgress.find(
        progress => progress.interviewId === interviewId
      );
      
      return {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        status: interviewProgress?.status || 'applied',
        currentRound: interviewProgress?.currentRound || null,
        score: interviewProgress?.score || null,
        completedAt: interviewProgress?.completedAt || null,
        appliedAt: interviewProgress?.appliedAt || null,
        updatedAt: interviewProgress?.updatedAt || null
      };
    });

    res.json({ success: true, data: transformedCandidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update candidate status
router.put('/:interviewId/candidates/:candidateId/status', auth, async (req, res) => {
  try {
    const { interviewId, candidateId } = req.params;
    const { status, roundId, updatedAt } = req.body;

    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate status
    const validStatuses = ['applied', 'scheduled', 'in_progress', 'passed', 'failed', 'on_hold', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    // Update candidate's interview progress
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Find and update the interview progress
    const interviewProgressIndex = candidate.interviewProgress.findIndex(
      progress => progress.interviewId === interviewId
    );

    if (interviewProgressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Candidate has not applied to this interview' });
    }

    // Update the progress
    candidate.interviewProgress[interviewProgressIndex].status = status;
    if (roundId) {
      candidate.interviewProgress[interviewProgressIndex].currentRound = roundId;
    }
    candidate.interviewProgress[interviewProgressIndex].updatedAt = new Date();

    await candidate.save();

    res.json({ 
      success: true, 
      message: 'Candidate status updated successfully',
      data: {
        candidateId,
        status,
        roundId,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Bulk update candidate status
router.put('/:interviewId/candidates/bulk-status', auth, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { candidateIds, status, roundId } = req.body;

    // Verify user has access to this interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Check if user is recruiter/admin or interview owner
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && interview.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate status
    const validStatuses = ['applied', 'scheduled', 'in_progress', 'passed', 'failed', 'on_hold', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'candidateIds must be a non-empty array' 
      });
    }

    // Update all candidates
    const updatePromises = candidateIds.map(async (candidateId) => {
      const candidate = await User.findById(candidateId);
      if (candidate) {
        const interviewProgressIndex = candidate.interviewProgress.findIndex(
          progress => progress.interviewId === interviewId
        );

        if (interviewProgressIndex !== -1) {
          candidate.interviewProgress[interviewProgressIndex].status = status;
          if (roundId) {
            candidate.interviewProgress[interviewProgressIndex].currentRound = roundId;
          }
          candidate.interviewProgress[interviewProgressIndex].updatedAt = new Date();
          await candidate.save();
        }
      }
    });

    await Promise.all(updatePromises);

    res.json({ 
      success: true, 
      message: `Updated status for ${candidateIds.length} candidates`,
      data: {
        candidateIds,
        status,
        roundId,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error bulk updating candidate status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
