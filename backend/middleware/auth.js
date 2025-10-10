const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const auth = async (req, res, next) => {
  console.log('🔐 [AUTH] Authentication check for:', req.path);
  
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ [AUTH] No token provided');
      // Ensure CORS headers are present even on error responses
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('🔑 [AUTH] Token present, verifying...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('👤 [AUTH] Token decoded, user ID:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ [AUTH] User not found for ID:', decoded.userId);
      // Ensure CORS headers are present even on error responses
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Allow recruiters to access the platform before approval.
    // Specific routes should enforce approval if needed rather than blocking here globally.

    console.log('✅ [AUTH] User authenticated:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [AUTH] Authentication error:', error.message);
    console.error('🔍 [AUTH] Error details:', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt
    });
    // Ensure CORS headers are present even on error responses
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { auth, authorize };
