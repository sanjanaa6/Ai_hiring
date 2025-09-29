/**
 * Backend time validation utilities for interview scheduling
 * Handles time-based access control and status management
 */

/**
 * Check if current time is within the scheduled time window
 * @param {Date|string} startDateTime - Start date and time
 * @param {Date|string} endDateTime - End date and time
 * @returns {boolean} - True if current time is within the window
 */
const isWithinScheduledTime = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  return now >= start && now <= end;
};

/**
 * Check if current time is before the scheduled start time
 * @param {Date|string} startDateTime - Start date and time
 * @returns {boolean} - True if current time is before start
 */
const isBeforeScheduledTime = (startDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  
  return now < start;
};

/**
 * Check if current time is after the scheduled end time
 * @param {Date|string} endDateTime - End date and time
 * @returns {boolean} - True if current time is after end
 */
const isAfterScheduledTime = (endDateTime) => {
  const now = new Date();
  const end = new Date(endDateTime);
  
  return now > end;
};

/**
 * Get the time remaining until the scheduled start
 * @param {Date|string} startDateTime - Start date and time
 * @returns {Object} - Object with days, hours, minutes, seconds remaining
 */
const getTimeUntilStart = (startDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const diff = start - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: diff };
};

/**
 * Get the time remaining until the scheduled end
 * @param {Date|string} endDateTime - End date and time
 * @returns {Object} - Object with days, hours, minutes, seconds remaining
 */
const getTimeUntilEnd = (endDateTime) => {
  const now = new Date();
  const end = new Date(endDateTime);
  const diff = end - now;
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: diff };
};

/**
 * Determine the current status of a scheduled round based on time
 * @param {Date|string} startDateTime - Start date and time
 * @param {Date|string} endDateTime - End date and time
 * @param {string} originalStatus - Original status from database
 * @returns {string} - Current status: 'upcoming', 'active', 'ended'
 */
const getCurrentRoundStatus = (startDateTime, endDateTime, originalStatus = 'scheduled') => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  // If manually set to completed or cancelled, respect that
  if (originalStatus === 'completed' || originalStatus === 'cancelled') {
    return originalStatus;
  }
  
  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'active';
  } else {
    return 'ended';
  }
};

/**
 * Format time remaining in a human-readable format
 * @param {Object} timeObj - Time object with days, hours, minutes, seconds
 * @returns {string} - Formatted time string
 */
const formatTimeRemaining = (timeObj) => {
  const { days, hours, minutes, seconds } = timeObj;
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Get access status message for candidates
 * @param {Date|string} startDateTime - Start date and time
 * @param {Date|string} endDateTime - End date and time
 * @returns {Object} - Object with access status and message
 */
const getAccessStatus = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  if (now < start) {
    const timeUntil = getTimeUntilStart(startDateTime);
    return {
      canAccess: false,
      status: 'upcoming',
      message: `Round starts in ${formatTimeRemaining(timeUntil)}`,
      timeRemaining: timeUntil
    };
  } else if (now >= start && now <= end) {
    const timeUntil = getTimeUntilEnd(endDateTime);
    return {
      canAccess: true,
      status: 'active',
      message: `Round is active - ${formatTimeRemaining(timeUntil)} remaining`,
      timeRemaining: timeUntil
    };
  } else {
    return {
      canAccess: false,
      status: 'ended',
      message: 'Round has ended',
      timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    };
  }
};

/**
 * Validate if a candidate can access the round at the current time
 * @param {Object} schedule - Schedule object with startDateTime and endDateTime
 * @returns {Object} - Validation result with access status and details
 */
const validateCandidateAccess = (schedule) => {
  if (!schedule || !schedule.startDateTime || !schedule.endDateTime) {
    return {
      canAccess: false,
      reason: 'Invalid schedule data',
      message: 'Schedule information is incomplete'
    };
  }
  
  const accessStatus = getAccessStatus(schedule.startDateTime, schedule.endDateTime);
  
  return {
    canAccess: accessStatus.canAccess,
    reason: accessStatus.status,
    message: accessStatus.message,
    timeRemaining: accessStatus.timeRemaining,
    startDateTime: schedule.startDateTime,
    endDateTime: schedule.endDateTime
  };
};

/**
 * Middleware to validate candidate access to a scheduled round
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateCandidateAccessMiddleware = async (req, res, next) => {
  try {
    const { interviewId, scheduleId } = req.params;
    
    // Get the schedule
    const InterviewSchedule = require('../models/InterviewSchedule');
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
    
    // Validate access
    const accessValidation = validateCandidateAccess(schedule);
    
    // Add validation result to request object
    req.accessValidation = accessValidation;
    req.schedule = schedule;
    
    // If access is denied and this is not an admin/recruiter, block access
    if (!accessValidation.canAccess && 
        req.user.role !== 'admin' && 
        req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        reason: accessValidation.reason,
        details: accessValidation.message,
        timeRemaining: accessValidation.timeRemaining
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in candidate access validation middleware:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during access validation' 
    });
  }
};

module.exports = {
  isWithinScheduledTime,
  isBeforeScheduledTime,
  isAfterScheduledTime,
  getTimeUntilStart,
  getTimeUntilEnd,
  getCurrentRoundStatus,
  formatTimeRemaining,
  getAccessStatus,
  validateCandidateAccess,
  validateCandidateAccessMiddleware
};
