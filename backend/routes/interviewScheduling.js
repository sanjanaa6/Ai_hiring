const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const InterviewSchedule = require('../models/InterviewSchedule');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { 
  validateCandidateAccess, 
  getCurrentRoundStatus, 
  getAccessStatus,
  validateCandidateAccessMiddleware 
} = require('../utils/timeValidation');

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

    // Get the existing access link for this round from the interview
    const accessLinkInfo = interview.getAccessLinkInfo(parseInt(roundNumber));
    
    if (!accessLinkInfo) {
      return res.status(400).json({ 
        success: false, 
        message: `No access link found for round ${roundNumber}` 
      });
    }

    const schedule = new InterviewSchedule({
      ...scheduleData,
      interviewId: interviewId,
      accessLink: accessLinkInfo.accessLink,
      accessCode: accessLinkInfo.accessCode,
      createdBy: req.user.id,
      createdAt: new Date()
    });
    
    await schedule.save();

    // Update the interview's access link to mark it as scheduled
    interview.updateAccessLinkForSchedule(parseInt(roundNumber), schedule._id);
    await interview.save();

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

// Validate candidate access to a specific schedule
router.get('/:interviewId/schedules/:scheduleId/access', auth, async (req, res) => {
  try {
    const { interviewId, scheduleId } = req.params;
    
    // Get the schedule
    const schedule = await InterviewSchedule.findOne({ 
      _id: scheduleId, 
      interviewId: interviewId 
    });
    
    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }
    
    // Validate candidate access
    const accessValidation = validateCandidateAccess(schedule);
    const currentStatus = getCurrentRoundStatus(
      schedule.startDateTime, 
      schedule.endDateTime, 
      schedule.status
    );
    
    res.json({
      success: true,
      data: {
        schedule: {
          _id: schedule._id,
          roundName: schedule.roundName,
          roundNumber: schedule.roundNumber,
          startDateTime: schedule.startDateTime,
          endDateTime: schedule.endDateTime,
          duration: schedule.duration,
          maxCandidates: schedule.maxCandidates,
          status: currentStatus
        },
        accessValidation,
        currentTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error validating candidate access:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all schedules with current status and access validation
router.get('/:interviewId/schedules/status', auth, async (req, res) => {
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

    // Add current status and access validation to each schedule
    const schedulesWithStatus = schedules.map(schedule => {
      const currentStatus = getCurrentRoundStatus(
        schedule.startDateTime, 
        schedule.endDateTime, 
        schedule.status
      );
      const accessValidation = validateCandidateAccess(schedule);
      
      return {
        ...schedule.toObject(),
        currentStatus,
        accessValidation,
        lastUpdated: new Date().toISOString()
      };
    });

    res.json({ 
      success: true, 
      data: schedulesWithStatus,
      summary: {
        total: schedulesWithStatus.length,
        active: schedulesWithStatus.filter(s => s.currentStatus === 'active').length,
        upcoming: schedulesWithStatus.filter(s => s.currentStatus === 'upcoming').length,
        ended: schedulesWithStatus.filter(s => s.currentStatus === 'ended').length
      }
    });
  } catch (error) {
    console.error('Error fetching schedules with status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update schedule status based on current time (auto-update endpoint)
router.put('/:interviewId/schedules/:scheduleId/auto-status', auth, async (req, res) => {
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

    const schedule = await InterviewSchedule.findOne({ 
      _id: scheduleId, 
      interviewId: interviewId 
    });
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    
    // Get current status based on time
    const currentStatus = getCurrentRoundStatus(
      schedule.startDateTime, 
      schedule.endDateTime, 
      schedule.status
    );
    
    // Only update if status has changed
    if (currentStatus !== schedule.status) {
      schedule.status = currentStatus;
      schedule.updatedAt = new Date();
      await schedule.save();
    }
    
    const accessValidation = validateCandidateAccess(schedule);
    
    res.json({
      success: true,
      data: {
        schedule: {
          _id: schedule._id,
          roundName: schedule.roundName,
          roundNumber: schedule.roundNumber,
          startDateTime: schedule.startDateTime,
          endDateTime: schedule.endDateTime,
          duration: schedule.duration,
          maxCandidates: schedule.maxCandidates,
          status: schedule.status,
          previousStatus: req.body.previousStatus || 'unknown'
        },
        accessValidation,
        statusChanged: currentStatus !== (req.body.previousStatus || schedule.status),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error auto-updating schedule status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Bulk update all schedule statuses based on current time
router.put('/:interviewId/schedules/auto-status-all', auth, async (req, res) => {
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

    const schedules = await InterviewSchedule.find({ interviewId: interviewId });
    const updatedSchedules = [];
    let statusChangesCount = 0;
    
    for (const schedule of schedules) {
      const currentStatus = getCurrentRoundStatus(
        schedule.startDateTime, 
        schedule.endDateTime, 
        schedule.status
      );
      
      // Only update if status has changed
      if (currentStatus !== schedule.status) {
        schedule.status = currentStatus;
        schedule.updatedAt = new Date();
        await schedule.save();
        statusChangesCount++;
      }
      
      const accessValidation = validateCandidateAccess(schedule);
      
      updatedSchedules.push({
        _id: schedule._id,
        roundName: schedule.roundName,
        roundNumber: schedule.roundNumber,
        startDateTime: schedule.startDateTime,
        endDateTime: schedule.endDateTime,
        duration: schedule.duration,
        maxCandidates: schedule.maxCandidates,
        status: schedule.status,
        accessValidation
      });
    }
    
    res.json({
      success: true,
      data: {
        schedules: updatedSchedules,
        summary: {
          total: updatedSchedules.length,
          statusChanges: statusChangesCount,
          active: updatedSchedules.filter(s => s.status === 'active').length,
          upcoming: updatedSchedules.filter(s => s.status === 'upcoming').length,
          ended: updatedSchedules.filter(s => s.status === 'ended').length
        },
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error bulk auto-updating schedule statuses:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get round access link and validate access
router.get('/round/:accessLink', auth, async (req, res) => {
  try {
    const { accessLink } = req.params;
    const candidateId = req.user?.id;
    
    // First try to find by schedule (if scheduled)
    let schedule = await InterviewSchedule.findByAccessLink(accessLink);
    let interview = null;
    let accessValidation = null;
    let candidateStatus = null;
    
    if (schedule) {
      // Round is scheduled - validate access based on schedule
      interview = await Interview.findOne({ interviewId: schedule.interviewId });
      accessValidation = schedule.validateAccess();
      
      // Check candidate status if user is authenticated
      if (candidateId) {
        const candidate = await User.findById(candidateId);
        if (candidate) {
          const interviewProgress = candidate.interviewProgress.find(
            progress => progress.interviewId === schedule.interviewId
          );
          if (interviewProgress) {
            candidateStatus = interviewProgress.status;
            
            // Check if candidate status allows access
            const allowedStatuses = ['passed', 'in_progress', 'started'];
            if (!allowedStatuses.includes(interviewProgress.status)) {
              let message = 'Access denied';
              let reason = 'status_restriction';
              
              switch (interviewProgress.status) {
                case 'rejected':
                  message = 'You have been rejected from this interview. Access denied.';
                  reason = 'rejected';
                  break;
                case 'on_hold':
                  message = 'Your interview is on hold. Please wait for recruiter approval to continue.';
                  reason = 'on_hold';
                  break;
                case 'failed':
                  message = 'You have failed this interview. Access denied.';
                  reason = 'failed';
                  break;
                case 'completed':
                  message = 'You have already completed this interview.';
                  reason = 'completed';
                  break;
                case 'abandoned':
                  message = 'You have abandoned this interview. Access denied.';
                  reason = 'abandoned';
                  break;
                default:
                  message = 'Your interview status does not allow access at this time.';
                  reason = 'invalid_status';
              }
              
              return res.status(403).json({
                success: false,
                message,
                reason,
                candidateStatus: interviewProgress.status,
                data: {
                  schedule: {
                    _id: schedule._id,
                    roundName: schedule.roundName,
                    roundNumber: schedule.roundNumber,
                    startDateTime: schedule.startDateTime,
                    endDateTime: schedule.endDateTime,
                    duration: schedule.duration,
                    maxCandidates: schedule.maxCandidates,
                    status: accessValidation.reason
                  },
                  accessValidation,
                  currentTime: new Date().toISOString()
                }
              });
            }
          }
        }
      }
    } else {
      // Check if it's an unscheduled round access link
      interview = await Interview.findByAccessLink(accessLink);
      
      if (!interview) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invalid round access link' 
        });
      }
      
      // Find the specific access link info
      const accessLinkInfo = interview.accessLinks.find(link => link.accessLink === accessLink);
      
      if (!accessLinkInfo) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invalid round access link' 
        });
      }
      
      // Round is not scheduled yet - deny access
      accessValidation = {
        canAccess: false,
        reason: 'not_scheduled',
        message: 'This round has not been scheduled yet. Please wait for the recruiter to schedule it.',
        timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
      };
      
      // Create a mock schedule object for response
      const round = interview.rounds.find(r => r.roundNumber === accessLinkInfo.roundNumber);
      schedule = {
        _id: null,
        roundName: round?.title || `Round ${accessLinkInfo.roundNumber}`,
        roundNumber: accessLinkInfo.roundNumber,
        startDateTime: null,
        endDateTime: null,
        duration: round?.duration || 0,
        description: round?.description || '',
        requirements: '',
        accessLink: accessLink
      };
    }
    
    // If access is denied, return 403 status
    if (!accessValidation.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: accessValidation.reason,
        details: accessValidation.message,
        data: {
          schedule: {
            _id: schedule._id,
            roundName: schedule.roundName,
            roundNumber: schedule.roundNumber,
            startDateTime: schedule.startDateTime,
            endDateTime: schedule.endDateTime,
            duration: schedule.duration,
            description: schedule.description,
            requirements: schedule.requirements,
            accessLink: schedule.accessLink,
            status: schedule.status
          },
          interview: interview ? {
            title: interview.title,
            jobTitle: interview.jobTitle,
            description: interview.description
          } : null,
          accessValidation,
          currentTime: new Date().toISOString()
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        schedule: {
          _id: schedule._id,
          roundName: schedule.roundName,
          roundNumber: schedule.roundNumber,
          startDateTime: schedule.startDateTime,
          endDateTime: schedule.endDateTime,
          duration: schedule.duration,
          description: schedule.description,
          requirements: schedule.requirements,
          accessLink: schedule.accessLink,
          status: schedule.status
        },
        interview: interview ? {
          title: interview.title,
          jobTitle: interview.jobTitle,
          description: interview.description
        } : null,
        accessValidation,
        candidateStatus,
        currentTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error validating round access:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Middleware to validate candidate status for interview access
const validateCandidateStatus = async (req, res, next) => {
  try {
    const { accessLink } = req.params;
    const candidateId = req.user?.id; // Assuming user is authenticated
    
    if (!candidateId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find schedule by access link
    const schedule = await InterviewSchedule.findByAccessLink(accessLink);
    
    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid round access link' 
      });
    }
    
    // Get candidate's interview progress
    const candidate = await User.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Find candidate's progress for this interview
    const interviewProgress = candidate.interviewProgress.find(
      progress => progress.interviewId === schedule.interviewId
    );
    
    if (!interviewProgress) {
      return res.status(403).json({
        success: false,
        message: 'You have not applied to this interview',
        reason: 'not_applied'
      });
    }
    
    // Check candidate status - only allow access if status is 'passed' or 'in_progress'
    const allowedStatuses = ['passed', 'in_progress', 'started'];
    if (!allowedStatuses.includes(interviewProgress.status)) {
      let message = 'Access denied';
      let reason = 'status_restriction';
      
      switch (interviewProgress.status) {
        case 'rejected':
          message = 'You have been rejected from this interview. Access denied.';
          reason = 'rejected';
          break;
        case 'on_hold':
          message = 'Your interview is on hold. Please wait for recruiter approval to continue.';
          reason = 'on_hold';
          break;
        case 'failed':
          message = 'You have failed this interview. Access denied.';
          reason = 'failed';
          break;
        case 'completed':
          message = 'You have already completed this interview.';
          reason = 'completed';
          break;
        case 'abandoned':
          message = 'You have abandoned this interview. Access denied.';
          reason = 'abandoned';
          break;
        default:
          message = 'Your interview status does not allow access at this time.';
          reason = 'invalid_status';
      }
      
      return res.status(403).json({
        success: false,
        message,
        reason,
        candidateStatus: interviewProgress.status
      });
    }
    
    // Add schedule and interview progress to request for use in the main handler
    req.schedule = schedule;
    req.interviewProgress = interviewProgress;
    next();
  } catch (error) {
    console.error('Error validating candidate status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during status validation' 
    });
  }
};

// Start round interview (candidate access)
router.post('/round/:accessLink/start', auth, validateCandidateStatus, async (req, res) => {
  try {
    const { accessLink } = req.params;
    const schedule = req.schedule; // From middleware
    const interviewProgress = req.interviewProgress; // From middleware
    
    // Validate time-based access
    const accessValidation = schedule.validateAccess();
    
    if (!accessValidation.canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: accessValidation.reason,
        details: accessValidation.message
      });
    }
    
    // Get interview details and round information
    const interview = await Interview.findOne({ interviewId: schedule.interviewId });
    
    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        message: 'Interview not found' 
      });
    }
    
    // Find the specific round in the interview
    const round = interview.rounds.find(r => r.roundNumber === schedule.roundNumber);
    
    if (!round) {
      return res.status(404).json({ 
        success: false, 
        message: 'Round not found in interview' 
      });
    }
    
    res.json({
      success: true,
      data: {
        schedule: {
          _id: schedule._id,
          roundName: schedule.roundName,
          roundNumber: schedule.roundNumber,
          startDateTime: schedule.startDateTime,
          endDateTime: schedule.endDateTime,
          duration: schedule.duration,
          accessLink: schedule.accessLink
        },
        interview: {
          title: interview.title,
          jobTitle: interview.jobTitle,
          description: interview.description
        },
        round: {
          roundId: round.roundId,
          title: round.title,
          description: round.description,
          duration: round.duration,
          questions: round.questions,
          evaluationCriteria: round.evaluationCriteria
        },
        accessValidation,
        startedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error starting round interview:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Regenerate access link for a schedule
router.put('/:interviewId/schedules/:scheduleId/regenerate-link', auth, async (req, res) => {
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

    const schedule = await InterviewSchedule.findOne({ 
      _id: scheduleId, 
      interviewId: interviewId 
    });
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    
    // Generate new access link
    const newAccessLink = schedule.generateAccessLink();
    await schedule.save();
    
    res.json({
      success: true,
      data: {
        schedule: {
          _id: schedule._id,
          roundName: schedule.roundName,
          roundNumber: schedule.roundNumber,
          accessLink: schedule.accessLink,
          accessCode: schedule.accessCode
        },
        newAccessLink,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error regenerating access link:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get access links for an interview
router.get('/:interviewId/access-links', auth, async (req, res) => {
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

    // Get all access links with schedule information
    const accessLinksWithSchedule = await Promise.all(
      interview.accessLinks.map(async (accessLink) => {
        // Check if this round is scheduled
        const schedule = await InterviewSchedule.findOne({ 
          interviewId: interviewId, 
          roundNumber: accessLink.roundNumber 
        });
        
        const round = interview.rounds.find(r => r.roundNumber === accessLink.roundNumber);
        
        return {
          roundNumber: accessLink.roundNumber,
          roundName: round?.title || `Round ${accessLink.roundNumber}`,
          accessLink: accessLink.accessLink,
          isScheduled: accessLink.isScheduled,
          scheduleId: accessLink.scheduleId,
          schedule: schedule ? {
            _id: schedule._id,
            startDateTime: schedule.startDateTime,
            endDateTime: schedule.endDateTime,
            status: schedule.status
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        accessLinks: accessLinksWithSchedule
      }
    });
  } catch (error) {
    console.error('Error fetching access links:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
