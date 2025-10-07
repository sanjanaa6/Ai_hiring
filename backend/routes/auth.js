const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Multer for recruiter docs during registration
const recruiterRegStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'recruiter-docs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = file.fieldname === 'gstFile' ? 'gst' : 'pan';
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const recruiterRegFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Only PDF/JPG/PNG are allowed for documents'));
};

const uploadRecruiterOnRegister = multer({
  storage: recruiterRegStorage,
  fileFilter: recruiterRegFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Register (supports multipart for recruiter docs)
router.post('/register', uploadRecruiterOnRegister.fields([
  { name: 'gstFile', maxCount: 1 },
  { name: 'panFile', maxCount: 1 }
]), [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['candidate', 'recruiter']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'candidate', gstNumber, panNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ name, email, password, role });
    // For recruiters, ensure pending approval by default and capture docs
    if (user.role === 'recruiter') {
      user.isApproved = false;
      user.approvalStatus = 'pending';
      const gstPath = req.files?.gstFile?.[0]?.path || null;
      const panPath = req.files?.panFile?.[0]?.path || null;
      if (gstPath && panPath && gstNumber && panNumber) {
        user.recruiterDocuments = {
          gstNumber,
          panNumber,
          gstFile: gstPath.replace(/\\/g, '/'),
          panFile: panPath.replace(/\\/g, '/'),
          uploadedAt: new Date()
        };
      }
    }
    await user.save();

    // If recruiter docs exist, move files into per-user directory for organization
    if (user.role === 'recruiter' && user.recruiterDocuments?.gstFile && user.recruiterDocuments?.panFile) {
      try {
        const userDir = path.join(__dirname, '..', 'uploads', 'recruiter-docs', String(user._id));
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }

        const moveFile = (srcPath) => {
          const fileName = path.basename(srcPath);
          const destPath = path.join(userDir, fileName);
          try {
            fs.renameSync(srcPath, destPath);
          } catch (_) {
            fs.copyFileSync(srcPath, destPath);
            fs.unlinkSync(srcPath);
          }
          return destPath.replace(/\\/g, '/');
        };

        const finalGstPath = moveFile(user.recruiterDocuments.gstFile);
        const finalPanPath = moveFile(user.recruiterDocuments.panFile);
        user.recruiterDocuments.gstFile = finalGstPath;
        user.recruiterDocuments.panFile = finalPanPath;
        await user.save();
      } catch (moveErr) {
        console.error('⚠️ [REGISTER] Failed to move recruiter docs to user folder:', moveErr.message);
      }
    }

    // If recruiter not approved, allow login but they will be blocked on protected routes
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login (candidates and recruiters)
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔍 [AUTH] Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [AUTH] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('✅ [AUTH] Validation passed, attempting login for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ [AUTH] User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // In production, admins must use the dedicated admin login route
    if (user.role === 'admin' && (process.env.NODE_ENV || 'development') === 'production') {
      return res.status(403).json({ message: 'Admins must login via /api/admin/login' });
    }

    console.log('👤 [AUTH] User found:', { id: user._id, email: user.email, role: user.role });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ [AUTH] Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ [AUTH] Password verified for user:', email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update login count for admin users
    if (user.role === 'admin') {
      user.adminProfile.loginCount = (user.adminProfile.loginCount || 0) + 1;
      user.adminProfile.lastLogin = new Date();
      await user.save();
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        candidateProfile: user.candidateProfile,
        recruiterProfile: user.recruiterProfile,
        adminProfile: user.adminProfile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile,
        candidateProfile: req.user.candidateProfile,
        recruiterProfile: req.user.recruiterProfile,
        adminProfile: req.user.adminProfile,
        isActive: req.user.isActive,
        isApproved: req.user.isApproved,
        approvalStatus: req.user.approvalStatus
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
