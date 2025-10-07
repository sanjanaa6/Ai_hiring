const express = require('express');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

const router = express.Router();

// Get all pending recruiters for approval
router.get('/pending-recruiters', auth, requireRole(['admin']), async (req, res) => {
  try {
    const pendingRecruiters = await User.find({
      role: 'recruiter',
      approvalStatus: 'pending'
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingRecruiters
    });
  } catch (error) {
    console.error('Error fetching pending recruiters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending recruiters'
    });
  }
});

// Get all recruiters with their approval status
router.get('/recruiters', auth, requireRole(['admin']), async (req, res) => {
  try {
    console.log('🔍 [ADMIN] Fetching all recruiters');
    console.log('👤 [ADMIN] Admin user:', req.user?.email);
    
    const recruiters = await User.find({
      role: 'recruiter'
    }).select('-password').sort({ createdAt: -1 });

    console.log('📊 [ADMIN] Found', recruiters.length, 'recruiters');

    // Map in safe document URLs for admin preview
    const withDocUrls = recruiters.map(r => {
      const plain = r.toObject();
      let docs = plain.recruiterDocuments ? { ...plain.recruiterDocuments } : null;

      // If DB doesn't have docs, attempt to infer from filesystem
      if (!docs || (!docs.gstFile && !docs.panFile)) {
        try {
          const userDir = path.join(__dirname, '..', 'uploads', 'recruiter-docs', String(r._id));
          if (fs.existsSync(userDir)) {
            const files = fs.readdirSync(userDir);
            const gst = files.find(f => /^gst[-_]/i.test(f)) || files.find(f => /gst/i.test(f));
            const pan = files.find(f => /^pan[-_]/i.test(f)) || files.find(f => /pan/i.test(f));
            if (gst || pan) {
              docs = docs || {};
              if (gst) {
                docs.gstFile = path.join(userDir, gst).replace(/\\/g, '/');
              }
              if (pan) {
                docs.panFile = path.join(userDir, pan).replace(/\\/g, '/');
              }
            }
          }
        } catch (fsErr) {
          console.warn('[ADMIN] Could not infer recruiter docs from FS for', r._id, fsErr.message);
        }
      }

      if (docs) {
        docs.gstFileUrl = docs.gstFile ? `/uploads/recruiter-docs/${String(r._id)}/${path.basename(docs.gstFile)}` : null;
        docs.panFileUrl = docs.panFile ? `/uploads/recruiter-docs/${String(r._id)}/${path.basename(docs.panFile)}` : null;
      }

      return {
        ...plain,
        recruiterDocuments: docs
      };
    });

    res.json({
      success: true,
      data: withDocUrls
    });
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching recruiters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recruiters'
    });
  }
});

// Approve a recruiter
router.patch('/approve-recruiter/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 [ADMIN] Approving recruiter with ID:', id);
    console.log('👤 [ADMIN] Admin user:', req.user?.email);

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recruiter ID format'
      });
    }

    const recruiter = await User.findById(id);
    if (!recruiter) {
      console.log('❌ [ADMIN] Recruiter not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    console.log('👤 [ADMIN] Found recruiter:', recruiter.email, 'Role:', recruiter.role);

    if (recruiter.role !== 'recruiter') {
      return res.status(400).json({
        success: false,
        message: 'User is not a recruiter'
      });
    }

    // Update recruiter approval status
    recruiter.isApproved = true;
    recruiter.approvalStatus = 'approved';
    recruiter.approvedBy = req.user._id;
    recruiter.approvedAt = new Date();
    recruiter.rejectionReason = null;

    await recruiter.save();

    res.json({
      success: true,
      message: 'Recruiter approved successfully',
      data: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        approvalStatus: recruiter.approvalStatus,
        approvedAt: recruiter.approvedAt
      }
    });
  } catch (error) {
    console.error('Error approving recruiter:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving recruiter'
    });
  }
});

// Reject a recruiter
router.patch('/reject-recruiter/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    console.log('🔍 [ADMIN] Rejecting recruiter with ID:', id);
    console.log('👤 [ADMIN] Admin user:', req.user?.email);
    console.log('📝 [ADMIN] Rejection reason:', rejectionReason);

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recruiter ID format'
      });
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const recruiter = await User.findById(id);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    if (recruiter.role !== 'recruiter') {
      return res.status(400).json({
        success: false,
        message: 'User is not a recruiter'
      });
    }

    // Update recruiter approval status
    recruiter.isApproved = false;
    recruiter.approvalStatus = 'rejected';
    recruiter.approvedBy = req.user._id;
    recruiter.approvedAt = new Date();
    recruiter.rejectionReason = rejectionReason;

    await recruiter.save();

    res.json({
      success: true,
      message: 'Recruiter rejected successfully',
      data: {
        id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        approvalStatus: recruiter.approvalStatus,
        rejectionReason: recruiter.rejectionReason,
        rejectedAt: recruiter.approvedAt
      }
    });
  } catch (error) {
    console.error('Error rejecting recruiter:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting recruiter'
    });
  }
});

// Get admin dashboard data
router.get('/dashboard', auth, requireRole(['admin']), async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const userStatsObj = userStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get pending recruiters count
    const pendingRecruitersCount = await User.countDocuments({
      role: 'recruiter',
      approvalStatus: 'pending'
    });

    // Get recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get pending recruiters for dashboard
    const pendingRecruiters = await User.find({
      role: 'recruiter',
      approvalStatus: 'pending'
    }).select('-password').sort({ createdAt: -1 }).limit(5);

    // Get recent applications (if you have an Application model)
    // const recentApplications = await Application.find()
    //   .populate('candidate', 'name email')
    //   .populate('job', 'title')
    //   .sort({ createdAt: -1 })
    //   .limit(10);

    res.json({
      success: true,
      data: {
        userStats: userStatsObj,
        pendingRecruitersCount,
        pendingRecruiters,
        recentUsers,
        // applications: recentApplications || []
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get all users for admin management
router.get('/users', auth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// Get recruiter document details (DB or filesystem fallback)
router.get('/recruiters/:id/docs', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }

    let docs = user.recruiterDocuments ? { ...user.recruiterDocuments } : {};

    // If paths missing, scan filesystem
    try {
      const userDir = path.join(__dirname, '..', 'uploads', 'recruiter-docs', String(user._id));
      if (fs.existsSync(userDir)) {
        const files = fs.readdirSync(userDir);
        if (!docs.gstFile) {
          const gst = files.find(f => /^gst[-_]/i.test(f)) || files.find(f => /gst/i.test(f));
          if (gst) docs.gstFile = path.join(userDir, gst).replace(/\\/g, '/');
        }
        if (!docs.panFile) {
          const pan = files.find(f => /^pan[-_]/i.test(f)) || files.find(f => /pan/i.test(f));
          if (pan) docs.panFile = path.join(userDir, pan).replace(/\\/g, '/');
        }
      }
    } catch (e) {
      console.warn('[ADMIN] FS scan error for recruiter docs', e.message);
    }

    // Build public URLs (served by server.js static mapping)
    const buildUrl = (absPath) => {
      if (!absPath) return null;
      const fileName = path.basename(absPath);
      return `/uploads/recruiter-docs/${String(user._id)}/${fileName}`;
    };

    return res.json({
      success: true,
      data: {
        gstNumber: docs.gstNumber || null,
        panNumber: docs.panNumber || null,
        gstFileUrl: buildUrl(docs.gstFile),
        panFileUrl: buildUrl(docs.panFile)
      }
    });
  } catch (error) {
    console.error('Error getting recruiter docs:', error);
    return res.status(500).json({ success: false, message: 'Failed to get recruiter documents' });
  }
});

module.exports = router;

