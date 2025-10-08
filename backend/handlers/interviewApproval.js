// Interview approval and rejection handlers
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');

// Approve interview endpoint
const approveInterview = async (req, res) => {
  console.log('✅ [APPROVE INTERVIEW] Approving interview:', req.params.interviewId);
  console.log('👤 [APPROVE INTERVIEW] User ID:', req.user.id);
  console.log('👤 [APPROVE INTERVIEW] User role:', req.user.role);
  
  try {
    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      console.log('❌ [APPROVE INTERVIEW] Unauthorized user role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Only recruiters and admins can approve interviews'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [APPROVE INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    if (interview.approvalStatus === 'approved') {
      console.log('⚠️ [APPROVE INTERVIEW] Interview already approved:', req.params.interviewId);
      return res.status(400).json({
        success: false,
        error: 'Interview is already approved'
      });
    }

    // Update interview status to approved
    interview.approvalStatus = 'approved';
    interview.approvedAt = new Date();
    interview.approvedBy = req.user.id;

    await interview.save();

    console.log('✅ [APPROVE INTERVIEW] Interview approved successfully');
    console.log('📊 [APPROVE INTERVIEW] Interview ID:', interview.interviewId);
    console.log('📊 [APPROVE INTERVIEW] Approved by:', req.user.id);
    console.log('📊 [APPROVE INTERVIEW] Approved at:', interview.approvedAt);

    // Generate shareable link
    const frontendBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const shareableLink = `${frontendBase}/interviews/${interview.interviewId}`;

    res.json({
      success: true,
      message: 'Interview approved successfully',
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        approvalStatus: interview.approvalStatus,
        approvedAt: interview.approvedAt,
        approvedBy: interview.approvedBy,
        shareableLink: shareableLink
      }
    });

  } catch (error) {
    console.error('❌ [APPROVE INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [APPROVE INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to approve interview'
    });
  }
};

// Reject interview endpoint
const rejectInterview = async (req, res) => {
  console.log('❌ [REJECT INTERVIEW] Rejecting interview:', req.params.interviewId);
  console.log('👤 [REJECT INTERVIEW] User ID:', req.user.id);
  console.log('👤 [REJECT INTERVIEW] User role:', req.user.role);
  
  try {
    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      console.log('❌ [REJECT INTERVIEW] Unauthorized user role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Only recruiters and admins can reject interviews'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [REJECT INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    if (interview.approvalStatus === 'rejected') {
      console.log('⚠️ [REJECT INTERVIEW] Interview already rejected:', req.params.interviewId);
      return res.status(400).json({
        success: false,
        error: 'Interview is already rejected'
      });
    }

    // Update interview status to rejected
    interview.approvalStatus = 'rejected';
    interview.rejectedAt = new Date();
    interview.rejectedBy = req.user.id;
    
    // Add rejection reason if provided
    if (req.body.rejectionReason) {
      interview.rejectionReason = req.body.rejectionReason;
    }

    await interview.save();

    console.log('✅ [REJECT INTERVIEW] Interview rejected successfully');
    console.log('📊 [REJECT INTERVIEW] Interview ID:', interview.interviewId);
    console.log('📊 [REJECT INTERVIEW] Rejected by:', req.user.id);
    console.log('📊 [REJECT INTERVIEW] Rejected at:', interview.rejectedAt);

    res.json({
      success: true,
      message: 'Interview rejected successfully',
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        approvalStatus: interview.approvalStatus,
        rejectedAt: interview.rejectedAt,
        rejectedBy: interview.rejectedBy,
        rejectionReason: interview.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ [REJECT INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [REJECT INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reject interview'
    });
  }
};

module.exports = {
  approveInterview,
  rejectInterview
};
