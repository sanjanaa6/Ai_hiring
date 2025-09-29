const Interview = require('../models/Interview');
const User = require('../models/User');

// Store monitoring data in memory (in production, use Redis or database)
const monitoringData = new Map();

/**
 * Record eye tracking violation
 */
const recordEyeTrackingViolation = async (req, res) => {
  try {
    const { interviewId, userId, violationType, duration, timestamp } = req.body;
    
    if (!interviewId || !userId || !violationType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: interviewId, userId, violationType'
      });
    }

    // Get or create monitoring record
    const monitoringKey = `${interviewId}_${userId}`;
    let monitoringRecord = monitoringData.get(monitoringKey);
    
    if (!monitoringRecord) {
      monitoringRecord = {
        interviewId,
        userId,
        violations: [],
        totalViolationTime: 0,
        flagged: false,
        startTime: new Date(),
        lastUpdate: new Date()
      };
    }

    // Add violation
    const violation = {
      type: violationType, // 'look_away', 'face_not_visible', 'shoulders_not_visible'
      duration: duration || 0,
      timestamp: timestamp || new Date(),
      severity: calculateViolationSeverity(violationType, duration)
    };

    monitoringRecord.violations.push(violation);
    monitoringRecord.totalViolationTime += duration || 0;
    monitoringRecord.lastUpdate = new Date();

      // Check if should be flagged
      const shouldFlag = shouldFlagInterview(monitoringRecord);
      if (shouldFlag && !monitoringRecord.flagged) {
        monitoringRecord.flagged = true;
        monitoringRecord.flaggedAt = new Date();
        monitoringRecord.flagReason = generateFlagReason(monitoringRecord);
        
        // Update interview status
        await Interview.findByIdAndUpdate(interviewId, {
          $set: {
            'monitoring.flagged': true,
            'monitoring.flagReason': monitoringRecord.flagReason,
            'monitoring.flaggedAt': monitoringRecord.flaggedAt
          }
        });
        
        // AGGRESSIVE: Automatically remove candidate from interview
        await automaticallyRemoveCandidate(interviewId, userId, monitoringRecord.flagReason);
      }

    // Store updated record
    monitoringData.set(monitoringKey, monitoringRecord);

    res.json({
      success: true,
      data: {
        violation,
        totalViolations: monitoringRecord.violations.length,
        totalViolationTime: monitoringRecord.totalViolationTime,
        flagged: monitoringRecord.flagged,
        flagReason: monitoringRecord.flagReason
      }
    });

  } catch (error) {
    console.error('Error recording eye tracking violation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get monitoring data for an interview
 */
const getMonitoringData = async (req, res) => {
  try {
    const { interviewId, userId } = req.params;
    
    if (!interviewId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing interviewId or userId'
      });
    }

    const monitoringKey = `${interviewId}_${userId}`;
    const monitoringRecord = monitoringData.get(monitoringKey);

    if (!monitoringRecord) {
      return res.json({
        success: true,
        data: {
          violations: [],
          totalViolationTime: 0,
          flagged: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        violations: monitoringRecord.violations,
        totalViolationTime: monitoringRecord.totalViolationTime,
        flagged: monitoringRecord.flagged,
        flagReason: monitoringRecord.flagReason,
        flaggedAt: monitoringRecord.flaggedAt,
        startTime: monitoringRecord.startTime,
        lastUpdate: monitoringRecord.lastUpdate
      }
    });

  } catch (error) {
    console.error('Error getting monitoring data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get flagged interviews for admin review
 */
const getFlaggedInterviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Get flagged interviews from database
    const query = { 'monitoring.flagged': true };
    if (status !== 'all') {
      query.status = status;
    }

    const interviews = await Interview.find(query)
      .populate('candidate', 'name email')
      .populate('job', 'title company')
      .sort({ 'monitoring.flaggedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Interview.countDocuments(query);

    // Enrich with monitoring data
    const enrichedInterviews = interviews.map(interview => {
      const monitoringKey = `${interview._id}_${interview.candidate._id}`;
      const monitoringRecord = monitoringData.get(monitoringKey);
      
      return {
        ...interview.toObject(),
        monitoringData: monitoringRecord || {
          violations: [],
          totalViolationTime: 0,
          flagged: false
        }
      };
    });

    res.json({
      success: true,
      data: {
        interviews: enrichedInterviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error getting flagged interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Clear flag for an interview (admin action)
 */
const clearInterviewFlag = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { reason, adminId } = req.body;

    if (!interviewId || !reason || !adminId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: interviewId, reason, adminId'
      });
    }

    // Update interview
    const interview = await Interview.findByIdAndUpdate(interviewId, {
      $set: {
        'monitoring.flagged': false,
        'monitoring.flagClearedAt': new Date(),
        'monitoring.flagClearedBy': adminId,
        'monitoring.flagClearReason': reason
      }
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Update monitoring record
    const monitoringKey = `${interviewId}_${interview.candidate}`;
    const monitoringRecord = monitoringData.get(monitoringKey);
    if (monitoringRecord) {
      monitoringRecord.flagged = false;
      monitoringRecord.flagClearedAt = new Date();
      monitoringRecord.flagClearedBy = adminId;
      monitoringRecord.flagClearReason = reason;
      monitoringData.set(monitoringKey, monitoringRecord);
    }

    res.json({
      success: true,
      message: 'Interview flag cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing interview flag:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Automatically remove candidate from interview due to violations
 */
const automaticallyRemoveCandidate = async (interviewId, userId, reason) => {
  try {
    console.log(`🚨 [MONITORING] Automatically removing candidate ${userId} from interview ${interviewId} due to: ${reason}`);
    
    // Update interview to mark candidate as removed
    await Interview.findByIdAndUpdate(interviewId, {
      $set: {
        'monitoring.autoRemoved': true,
        'monitoring.autoRemovedAt': new Date(),
        'monitoring.autoRemovalReason': reason,
        'monitoring.removedCandidateId': userId,
        status: 'terminated'
      }
    });
    
    // Log the removal for audit purposes
    console.log(`✅ [MONITORING] Candidate ${userId} automatically removed from interview ${interviewId}`);
    
  } catch (error) {
    console.error('❌ [MONITORING] Error automatically removing candidate:', error);
  }
};

/**
 * Calculate violation severity (AGGRESSIVE MODE)
 */
const calculateViolationSeverity = (type, duration) => {
  const baseSeverity = {
    'look_away': 2,
    'face_not_visible': 3,
    'shoulders_not_visible': 2,
    'mobile_phone_detected': 5, // MAXIMUM SEVERITY
    'earphones_detected': 5, // MAXIMUM SEVERITY
    'suspicious_hand_movement': 4
  };

  let severity = baseSeverity[type] || 2; // Default to higher severity
  
  // AGGRESSIVE: Increase severity based on duration (much stricter)
  if (duration > 3) severity += 2; // Was 10
  else if (duration > 1) severity += 1; // Was 5
  
  return Math.min(severity, 5); // Max severity of 5
};

/**
 * Determine if interview should be flagged (ZERO TOLERANCE MODE)
 */
const shouldFlagInterview = (monitoringRecord) => {
  const { violations, totalViolationTime } = monitoringRecord;
  
  // ZERO TOLERANCE: Flag if ANY violation exists
  if (violations.length > 0) return true;
  
  // ZERO TOLERANCE: Flag if ANY violation time
  if (totalViolationTime > 0) return true;
  
  // ZERO TOLERANCE: Always flag for mobile phone or earphones
  const mobileViolations = violations.filter(v => 
    v.type === 'mobile_phone_detected' || v.type === 'earphones_detected'
  );
  if (mobileViolations.length > 0) return true;
  
  // ZERO TOLERANCE: Flag for ANY violation duration
  const anyViolations = violations.filter(v => v.duration > 0);
  if (anyViolations.length > 0) return true;
  
  // ZERO TOLERANCE: Flag for face not visible
  const faceViolations = violations.filter(v => 
    v.type === 'face_not_visible'
  );
  if (faceViolations.length > 0) return true;
  
  // ZERO TOLERANCE: Flag for suspicious hand movement
  const handViolations = violations.filter(v => 
    v.type === 'suspicious_hand_movement'
  );
  if (handViolations.length > 0) return true;
  
  // ZERO TOLERANCE: Flag for looking away
  const lookAwayViolations = violations.filter(v => 
    v.type === 'looking_away'
  );
  if (lookAwayViolations.length > 0) return true;
  
  return false;
};

/**
 * Generate flag reason (ULTRA AGGRESSIVE MODE)
 */
const generateFlagReason = (monitoringRecord) => {
  const { violations, totalViolationTime } = monitoringRecord;
  
  const reasons = [];
  
  // ULTRA AGGRESSIVE: Check for 5+ seconds total violation time
  if (totalViolationTime > 5) {
    reasons.push(`EXCESSIVE VIOLATIONS: ${Math.round(totalViolationTime)}s total (threshold: 5s)`);
  }
  
  // ULTRA AGGRESSIVE: Check for ANY violations
  if (violations.length > 0) {
    reasons.push(`VIOLATIONS DETECTED: ${violations.length} total (threshold: 0)`);
  }
  
  // ULTRA AGGRESSIVE: Check for mobile phone usage
  const mobileViolations = violations.filter(v => v.type === 'mobile_phone_detected');
  if (mobileViolations.length > 0) {
    reasons.push(`MOBILE PHONE DETECTED: ${mobileViolations.length} violations (ZERO TOLERANCE)`);
  }
  
  // ULTRA AGGRESSIVE: Check for earphones/headphones
  const earphoneViolations = violations.filter(v => v.type === 'earphones_detected');
  if (earphoneViolations.length > 0) {
    reasons.push(`EARPHONES DETECTED: ${earphoneViolations.length} violations (ZERO TOLERANCE)`);
  }
  
  // ULTRA AGGRESSIVE: Check for suspicious hand movement
  const handViolations = violations.filter(v => v.type === 'suspicious_hand_movement');
  if (handViolations.length > 0) {
    reasons.push(`SUSPICIOUS HAND MOVEMENT: ${handViolations.length} violations`);
  }
  
  // ULTRA AGGRESSIVE: Check for face not visible
  const faceViolations = violations.filter(v => 
    v.type === 'face_not_visible' && v.duration > 1
  );
  if (faceViolations.length > 0) {
    reasons.push(`FACE NOT VISIBLE: ${faceViolations.length} violations over 1 second`);
  }
  
  // ULTRA AGGRESSIVE: Check for looking away
  const lookAwayViolations = violations.filter(v => v.type === 'looking_away');
  if (lookAwayViolations.length > 0) {
    reasons.push(`LOOKING AWAY: ${lookAwayViolations.length} violations`);
  }
  
  return reasons.join('; ');
};

/**
 * Get automatically removed interviews
 */
const getAutoRemovedInterviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get auto-removed interviews
    const interviews = await Interview.find({ 'monitoring.autoRemoved': true })
      .populate('candidate', 'name email')
      .populate('job', 'title company')
      .sort({ 'monitoring.autoRemovedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Interview.countDocuments({ 'monitoring.autoRemoved': true });

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error getting auto-removed interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get monitoring statistics
 */
const getMonitoringStats = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    let startDate = new Date();
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get flagged interviews count
    const flaggedCount = await Interview.countDocuments({
      'monitoring.flagged': true,
      'monitoring.flaggedAt': { $gte: startDate }
    });

    // Get total interviews count
    const totalInterviews = await Interview.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get monitoring data from memory
    const allMonitoringData = Array.from(monitoringData.values());
    const recentMonitoringData = allMonitoringData.filter(record => 
      new Date(record.startTime) >= startDate
    );

    const totalViolations = recentMonitoringData.reduce((sum, record) => 
      sum + record.violations.length, 0
    );

    const totalViolationTime = recentMonitoringData.reduce((sum, record) => 
      sum + record.totalViolationTime, 0
    );

    res.json({
      success: true,
      data: {
        timeRange,
        flaggedInterviews: flaggedCount,
        totalInterviews,
        flagRate: totalInterviews > 0 ? (flaggedCount / totalInterviews * 100).toFixed(2) : 0,
        totalViolations,
        totalViolationTime: Math.round(totalViolationTime),
        averageViolationsPerInterview: totalInterviews > 0 ? 
          (totalViolations / totalInterviews).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  recordEyeTrackingViolation,
  getMonitoringData,
  getFlaggedInterviews,
  clearInterviewFlag,
  getMonitoringStats,
  getAutoRemovedInterviews
};
