/**
 * Time validation utilities for interview scheduling
 * Handles time-based access control and status management
 */

/**
 * Check if current time is within the scheduled time window
 * @param {Date|string} startDateTime - Start date and time
 * @param {Date|string} endDateTime - End date and time
 * @returns {boolean} - True if current time is within the window
 */
export const isWithinScheduledTime = (startDateTime, endDateTime) => {
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
export const isBeforeScheduledTime = (startDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  
  return now < start;
};

/**
 * Check if current time is after the scheduled end time
 * @param {Date|string} endDateTime - End date and time
 * @returns {boolean} - True if current time is after end
 */
export const isAfterScheduledTime = (endDateTime) => {
  const now = new Date();
  const end = new Date(endDateTime);
  
  return now > end;
};

/**
 * Get the time remaining until the scheduled start
 * @param {Date|string} startDateTime - Start date and time
 * @returns {Object} - Object with days, hours, minutes, seconds remaining
 */
export const getTimeUntilStart = (startDateTime) => {
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
export const getTimeUntilEnd = (endDateTime) => {
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
export const getCurrentRoundStatus = (startDateTime, endDateTime, originalStatus = 'scheduled') => {
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
export const formatTimeRemaining = (timeObj) => {
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
export const getAccessStatus = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  console.log('🔍 getAccessStatus Debug:', {
    now: now.toISOString(),
    start: start.toISOString(),
    end: end.toISOString(),
    nowTime: now.getTime(),
    startTime: start.getTime(),
    endTime: end.getTime(),
    isBeforeStart: now < start,
    isAfterEnd: now > end,
    isWithinWindow: now >= start && now <= end
  });
  
  if (now < start) {
    const timeUntil = getTimeUntilStart(startDateTime);
    console.log('🔍 Round is UPCOMING - access denied');
    return {
      canAccess: false,
      status: 'upcoming',
      message: `Round starts in ${formatTimeRemaining(timeUntil)}`,
      timeRemaining: timeUntil
    };
  } else if (now >= start && now <= end) {
    const timeUntil = getTimeUntilEnd(endDateTime);
    console.log('🔍 Round is ACTIVE - access granted');
    return {
      canAccess: true,
      status: 'active',
      message: `Round is active - ${formatTimeRemaining(timeUntil)} remaining`,
      timeRemaining: timeUntil
    };
  } else {
    console.log('🔍 Round is ENDED - access denied');
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
export const validateCandidateAccess = (schedule) => {
  if (!schedule || !schedule.startDateTime || !schedule.endDateTime) {
    return {
      canAccess: false,
      reason: 'Invalid schedule data',
      message: 'Schedule information is incomplete'
    };
  }
  
  // Debug logging
  const now = new Date();
  const start = new Date(schedule.startDateTime);
  const end = new Date(schedule.endDateTime);
  
  console.log('🔍 Time Validation Debug:', {
    now: now.toISOString(),
    start: start.toISOString(),
    end: end.toISOString(),
    nowTime: now.getTime(),
    startTime: start.getTime(),
    endTime: end.getTime(),
    isBeforeStart: now < start,
    isAfterEnd: now > end,
    isWithinWindow: now >= start && now <= end
  });
  
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
