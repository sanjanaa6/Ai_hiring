const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Normalize origin (strip trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // In development, allow all localhost origins to ease integration
    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      return callback(null, true);
    }

    // List of allowed origins (production safelist)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://aihiring.eval8.xyz',
      'https://aihire.eval8.xyz'
    ];

    if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

console.log('🔗 [SERVER] Attempting to connect to MongoDB...');
console.log('🌐 [SERVER] MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4
})
.then(() => {
  console.log('✅ [SERVER] MongoDB connected successfully');
  console.log('📊 [SERVER] Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ [SERVER] MongoDB connection error:', err.message);
  console.error('🔍 [SERVER] MongoDB error details:', {
    name: err.name,
    code: err.code,
    errno: err.errno,
    syscall: err.syscall
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users', require('./routes/users'));
// Interview scheduling routes must come BEFORE main interviews routes to avoid conflicts
app.use('/api/interviews', require('./routes/interviewScheduling'));
app.use('/api/interviews', require('./routes/formSubmission'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/aiEvaluation'));
app.use('/api/ai', require('./routes/aiLanguageDetection'));
app.use('/api/coding-tutor', require('./routes/codingTutor'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/adminAuth'));
app.use('/api/tts', require('./routes/tts'));
// Serve recruiter documents statically for admin review
app.use('/uploads/recruiter-docs', express.static(path.join(__dirname, 'uploads', 'recruiter-docs')));
// Serve form submission files statically
app.use('/uploads/form-submissions', express.static(path.join(__dirname, 'uploads', 'form-submissions')));
// Add specific CORS handling for file upload routes
app.use('/api/files', (req, res, next) => {
  // Set CORS headers for file upload routes
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, require('./routes/fileUpload'));
app.use('/api/eye-tracking', require('./routes/eyeTracking'));



// Basic route
app.get('/api', (req, res) => {
  console.log('🏠 [API] Health check endpoint accessed');
  res.json({ message: 'AI Hiring Backend API is running!' });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  console.log('🌐 [CORS] Test endpoint accessed from origin:', req.headers.origin);
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 [REQUEST] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('👤 [REQUEST] User-Agent:', req.get('User-Agent'));
  console.log('🌐 [REQUEST] IP:', req.ip);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ [ERROR] Unhandled error occurred:', err.message);
  console.error('🔍 [ERROR] Error stack:', err.stack);
  console.error('📡 [ERROR] Request details:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log('🚀 [SERVER] Starting AI Hiring Backend Server...');
  console.log(`🌐 [SERVER] Server is running on port ${PORT}`);
  console.log(`🔗 [SERVER] API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 [SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ [SERVER] Server started successfully!');
});
