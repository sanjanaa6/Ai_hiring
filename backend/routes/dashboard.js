const express = require('express');
const { authAndRole } = require('../middleware/roleAuth');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

const router = express.Router();

// Candidate Dashboard
router.get('/candidate', authAndRole(['candidate']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get candidate's applications
    const applications = await Application.find({ candidate: userId })
      .populate('job', 'title company location salary type')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recommended jobs
    const user = await User.findById(userId);
    const skills = user.profile.skills || [];
    
    const recommendedJobs = await Job.find({
      $or: [
        { skills: { $in: skills } },
        { 'recruiterProfile.industry': user.candidateProfile?.jobPreferences || [] }
      ],
      status: 'active'
    })
    .populate('recruiter', 'name recruiterProfile.company')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get application statistics
    const stats = await Application.aggregate([
      { $match: { candidate: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          candidateProfile: user.candidateProfile
        },
        applications,
        recommendedJobs,
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Candidate dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Recruiter Dashboard
router.get('/recruiter', authAndRole(['recruiter', 'admin']), async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recruiter's jobs (match Job.postedBy)
    const jobs = await Job.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get applications for recruiter's jobs
    const jobIds = jobs.map(job => job._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'name email profile.skills')
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get statistics
    const jobStats = await Job.aggregate([
      { $match: { postedBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const applicationStats = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          profile: req.user.profile,
          recruiterProfile: req.user.recruiterProfile
        },
        jobs,
        applications,
        jobStats: jobStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        applicationStats: applicationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Recruiter dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Dashboard
router.get('/admin', authAndRole(['admin']), async (req, res) => {
  try {
    // Get all users
    const users = await User.find()
      .select('name email role isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get all jobs
    const jobs = await Job.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get all applications
    const applications = await Application.find()
      .populate('candidate', 'name email')
      .populate('job', 'title company')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          adminProfile: req.user.adminProfile
        },
        users,
        jobs,
        applications,
        userStats: userStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        jobStats: jobStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        applicationStats: applicationStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
