const Interview = require('../models/Interview');
const Application = require('../models/Application');
const User = require('../models/User');

// Track eye tracking violations
const trackViolation = async (req, res) => {
  try {
    const { interviewId, violationType, violationData, timestamp } = req.body;
    const userId = req.user?.id;

    console.log('🎯 Tracking eye tracking violation:', {
      interviewId,
      violationType,
      userId,
      timestamp
    });

    // Validate required fields
    if (!interviewId || !violationType) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID and violation type are required'
      });
    }

    // Find the interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Create violation record
    const violation = {
      id: Date.now().toString(),
      type: violationType,
      data: violationData || {},
      timestamp: timestamp || new Date(),
      userId: userId || 'anonymous'
    };

    // Update interview with violation
    if (!interview.eyeTrackingData) {
      interview.eyeTrackingData = {
        violations: [],
        totalViolations: 0,
        isMonitoringActive: true,
        startedAt: new Date()
      };
    }

    interview.eyeTrackingData.violations.push(violation);
    interview.eyeTrackingData.totalViolations += 1;
    interview.eyeTrackingData.lastViolationAt = new Date();

    // Check if user should be removed
    const maxViolations = interview.eyeTrackingData.maxViolations || 3;
    const shouldRemoveUser = interview.eyeTrackingData.totalViolations >= maxViolations;

    if (shouldRemoveUser) {
      interview.eyeTrackingData.isMonitoringActive = false;
      interview.eyeTrackingData.terminatedAt = new Date();
      interview.eyeTrackingData.terminationReason = 'max_violations_reached';
      
      // Mark interview as terminated
      interview.status = 'terminated';
      interview.completedAt = new Date();
    }

    await interview.save();

    // Log violation for monitoring
    console.log('📊 Violation recorded:', {
      interviewId,
      violationType,
      totalViolations: interview.eyeTrackingData.totalViolations,
      shouldRemoveUser
    });

    res.json({
      success: true,
      data: {
        violation,
        totalViolations: interview.eyeTrackingData.totalViolations,
        maxViolations,
        shouldRemoveUser,
        isMonitoringActive: interview.eyeTrackingData.isMonitoringActive
      }
    });

  } catch (error) {
    console.error('❌ Error tracking violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track violation'
    });
  }
};

// Get eye tracking status for an interview
const getEyeTrackingStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user?.id;

    console.log('🔍 Getting eye tracking status for interview:', interviewId);

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Check if user has access to this interview
    if (userId && interview.candidateId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const eyeTrackingData = interview.eyeTrackingData || {
      violations: [],
      totalViolations: 0,
      isMonitoringActive: false,
      maxViolations: 3
    };

    res.json({
      success: true,
      data: {
        isMonitoringActive: eyeTrackingData.isMonitoringActive,
        totalViolations: eyeTrackingData.totalViolations,
        maxViolations: eyeTrackingData.maxViolations || 3,
        violations: eyeTrackingData.violations || [],
        startedAt: eyeTrackingData.startedAt,
        lastViolationAt: eyeTrackingData.lastViolationAt,
        terminatedAt: eyeTrackingData.terminatedAt,
        terminationReason: eyeTrackingData.terminationReason
      }
    });

  } catch (error) {
    console.error('❌ Error getting eye tracking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get eye tracking status'
    });
  }
};

// Start eye tracking monitoring
const startEyeTracking = async (req, res) => {
  try {
    const { interviewId, maxViolations = 3 } = req.body;
    const userId = req.user?.id;

    console.log('🎯 Starting eye tracking for interview:', interviewId);

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Initialize eye tracking data
    interview.eyeTrackingData = {
      violations: [],
      totalViolations: 0,
      isMonitoringActive: true,
      maxViolations,
      startedAt: new Date()
    };

    await interview.save();

    console.log('✅ Eye tracking started for interview:', interviewId);

    res.json({
      success: true,
      data: {
        isMonitoringActive: true,
        maxViolations,
        startedAt: interview.eyeTrackingData.startedAt
      }
    });

  } catch (error) {
    console.error('❌ Error starting eye tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start eye tracking'
    });
  }
};

// Stop eye tracking monitoring
const stopEyeTracking = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const userId = req.user?.id;

    console.log('🛑 Stopping eye tracking for interview:', interviewId);

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.eyeTrackingData) {
      interview.eyeTrackingData.isMonitoringActive = false;
      interview.eyeTrackingData.stoppedAt = new Date();
      await interview.save();
    }

    console.log('✅ Eye tracking stopped for interview:', interviewId);

    res.json({
      success: true,
      data: {
        isMonitoringActive: false,
        stoppedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error stopping eye tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop eye tracking'
    });
  }
};

// Terminate interview due to violations
const terminateInterview = async (req, res) => {
  try {
    const { interviewId, reason = 'violations' } = req.body;
    const userId = req.user?.id;

    console.log('🚨 Terminating interview due to violations:', interviewId);

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Update interview status
    interview.status = 'terminated';
    interview.completedAt = new Date();
    interview.terminationReason = reason;

    if (interview.eyeTrackingData) {
      interview.eyeTrackingData.isMonitoringActive = false;
      interview.eyeTrackingData.terminatedAt = new Date();
      interview.eyeTrackingData.terminationReason = reason;
    }

    await interview.save();

    // Update application status if exists
    if (interview.applicationId) {
      await Application.findByIdAndUpdate(interview.applicationId, {
        status: 'interview_terminated',
        updatedAt: new Date()
      });
    }

    console.log('✅ Interview terminated:', interviewId);

    res.json({
      success: true,
      data: {
        status: 'terminated',
        terminatedAt: interview.completedAt,
        reason
      }
    });

  } catch (error) {
    console.error('❌ Error terminating interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate interview'
    });
  }
};

// Get violation analytics for admin
const getViolationAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, interviewId } = req.query;

    console.log('📊 Getting violation analytics:', { startDate, endDate, interviewId });

    let query = {};
    
    if (interviewId) {
      query._id = interviewId;
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const interviews = await Interview.find(query)
      .select('eyeTrackingData status candidateId createdAt')
      .populate('candidateId', 'name email')
      .lean();

    const analytics = {
      totalInterviews: interviews.length,
      totalViolations: 0,
      terminatedInterviews: 0,
      violationTypes: {},
      averageViolationsPerInterview: 0,
      interviews: []
    };

    interviews.forEach(interview => {
      const eyeTrackingData = interview.eyeTrackingData;
      
      if (eyeTrackingData) {
        analytics.totalViolations += eyeTrackingData.totalViolations || 0;
        
        if (interview.status === 'terminated') {
          analytics.terminatedInterviews += 1;
        }

        // Count violation types
        if (eyeTrackingData.violations) {
          eyeTrackingData.violations.forEach(violation => {
            analytics.violationTypes[violation.type] = 
              (analytics.violationTypes[violation.type] || 0) + 1;
          });
        }

        analytics.interviews.push({
          interviewId: interview._id,
          candidateName: interview.candidateId?.name || 'Anonymous',
          candidateEmail: interview.candidateId?.email || 'N/A',
          totalViolations: eyeTrackingData.totalViolations || 0,
          status: interview.status,
          createdAt: interview.createdAt,
          terminatedAt: eyeTrackingData.terminatedAt
        });
      }
    });

    analytics.averageViolationsPerInterview = 
      analytics.totalInterviews > 0 
        ? (analytics.totalViolations / analytics.totalInterviews).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ Error getting violation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get violation analytics'
    });
  }
};

module.exports = {
  trackViolation,
  getEyeTrackingStatus,
  startEyeTracking,
  stopEyeTracking,
  terminateInterview,
  getViolationAnalytics
};
