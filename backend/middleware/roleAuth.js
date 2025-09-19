const { auth } = require('./auth');

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Specific role middlewares
const requireCandidate = requireRole(['candidate']);
const requireRecruiter = requireRole(['recruiter', 'admin']);
const requireAdmin = requireRole(['admin']);

// Combined auth and role check
const authAndRole = (roles) => [auth, requireRole(roles)];

module.exports = {
  requireRole,
  requireCandidate,
  requireRecruiter,
  requireAdmin,
  authAndRole
};
