const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const isDev = (process.env.NODE_ENV || 'development') !== 'production';

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'https://aihiring.eval8.ai',
  'https://aihire.eval8.ai',
  'https://www.aihiring.eval8.ai',
  'https://www.aihire.eval8.ai',
  'https://aihiring.eval8.xyz',
  'https://aihire.eval8.xyz',
  'https://www.aihiring.eval8.xyz',
  'https://www.aihire.eval8.xyz'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');

    // In development, allow all localhost origins
    if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      console.log('✅ [CORS] Dev mode - Allowed origin:', normalizedOrigin);
      return callback(null, true);
    }

    // Check against allowed origins
    if (allowedOrigins.includes(normalizedOrigin)) {
      console.log('✅ [CORS] Allowed origin:', normalizedOrigin);
      callback(null, true);
    } else {
      console.log('❌ [CORS] Blocked origin:', normalizedOrigin);
      console.log('📋 [CORS] Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400 // 24 hours
};

// ============================================================================
// SOCKET.IO INITIALIZATION
// ============================================================================
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

console.log('✅ [SOCKET.IO] Initialized successfully');

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================
// CORS middleware (must be first)
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📨 [${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.path.includes('/upload')) {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyStr = JSON.stringify(req.body);
      console.log(`   Body:`, bodyStr.length > 200 ? bodyStr.substring(0, 200) + '...' : bodyStr);
    }
  }
  
  next();
});

// Global OPTIONS handler (must be early in middleware chain)
app.options('*', cors(corsOptions));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

console.log('🔗 [SERVER] Attempting to connect to MongoDB...');
console.log('🌐 [SERVER] MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

mongoose.connect(MONGODB_URI, {
  family: 4,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ [SERVER] MongoDB connected successfully');
  console.log('📊 [SERVER] Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ [SERVER] MongoDB connection error:', err.message);
  console.error('🔍 [SERVER] Error details:', {
    name: err.name,
    code: err.code
  });
});

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  [SERVER] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ [SERVER] MongoDB reconnected');
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================
app.use('/uploads/recruiter-docs', express.static(path.join(__dirname, 'uploads', 'recruiter-docs')));
app.use('/uploads/form-submissions', express.static(path.join(__dirname, 'uploads', 'form-submissions')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// ROUTES SETUP
// ============================================================================
console.log('📦 [SERVER] Loading routes...');

const routes = [
  { path: '/api/dashboard', file: './routes/dashboard', name: 'Dashboard' },
  { path: '/api/jobs', file: './routes/jobs', name: 'Jobs' },
  { path: '/api/applications', file: './routes/applications', name: 'Applications' },
  { path: '/api/users', file: './routes/users', name: 'Users' },
  { path: '/api/sessions', file: './routes/sessions', name: 'Session Management' },
  { path: '/api/recordings', file: './routes/recordings', name: 'Recording Management' },
  { path: '/api/interviews', file: './routes/interviewScheduling', name: 'Interview Scheduling' },
  { path: '/api/interviews', file: './routes/formSubmission', name: 'Form Submission' },
  { path: '/api/interviews', file: './routes/interviews', name: 'Interviews' },
  { path: '/api/ai', file: './routes/ai', name: 'AI Services' },
  { path: '/api/ai', file: './routes/aiEvaluation', name: 'AI Evaluation' },
  { path: '/api/ai', file: './routes/aiLanguageDetection', name: 'AI Language Detection' },
  { path: '/api/ai', file: './routes/salesInterviewService', name: 'Sales Interview' },
  { path: '/api/electronics', file: './routes/electronicsInterviewService', name: 'Electronics Interview' },
  { path: '/api/coding-tutor', file: './routes/codingTutor', name: 'Coding Tutor' },
  { path: '/api/admin', file: './routes/admin', name: 'Admin' },
  { path: '/api/admin', file: './routes/adminAuth', name: 'Admin Auth' },
  { path: '/api/tts', file: './routes/tts', name: 'TTS' },
  { path: '/api/stt', file: './routes/stt', name: 'STT' },
  { path: '/api/interviews', file: './routes/systemDesign', name: 'System Design' },
  { path: '/api/interviews', file: './routes/pcbDesign', name: 'PCB Design' },
  { path: '/api/screen-share', file: './routes/screenShare', name: 'Screen Share' },
  { path: '/api/interview-recordings', file: './routes/interviewRecordings', name: 'Interview Recordings' },
  { path: '/api/eye-tracking', file: './routes/eyeTracking', name: 'Eye Tracking' },
  { path: '/api/judge0', file: './routes/judge0', name: 'Judge0' }
];

// Load routes with error handling
routes.forEach(route => {
  try {
    app.use(route.path, require(route.file));
    console.log(`  ✅ ${route.name} routes loaded`);
  } catch (err) {
    console.error(`  ❌ ${route.name} routes failed:`, err.message);
  }
});

// Auth routes with explicit CORS
app.use('/api/auth', cors(corsOptions), require('./routes/auth'));
console.log('  ✅ Auth routes loaded');

// File upload routes with explicit CORS
app.use('/api/files', cors(corsOptions), require('./routes/fileUpload'));
console.log('  ✅ File Upload routes loaded');

console.log('📦 [SERVER] All routes loaded successfully!\n');

// ============================================================================
// API ENDPOINTS
// ============================================================================
app.get('/api', (req, res) => {
  console.log('🏠 [API] Health check endpoint accessed');
  res.json({ 
    message: 'AI Hiring Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/api/cors-test', (req, res) => {
  console.log('🌐 [CORS] Test endpoint accessed from origin:', req.headers.origin);
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// PRODUCTION FRONTEND SERVING
// ============================================================================
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../frontend/build');
  
  // Serve static files with caching
  app.use(express.static(buildPath, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  
  // Handle React routing for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log('❌ [404] API endpoint not found:', req.path);
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ [ERROR] Unhandled error:', err.message);
  console.error('🔍 [ERROR] Stack:', err.stack);
  console.error('📡 [ERROR] Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin
  });

  res.status(err.status || 500).json({ 
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// ============================================================================
// SOCKET.IO HANDLERS
// ============================================================================
try {
  const screenShareSocket = require('./socket/screenShareSocket');
  screenShareSocket(io);
  console.log('✅ [SOCKET.IO] Screen share handlers initialized');
} catch (err) {
  console.error('❌ [SOCKET.IO] Failed to initialize screen share handlers:', err.message);
}

// ============================================================================
// SERVER STARTUP
// ============================================================================
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 AI HIRING BACKEND SERVER');
  console.log('='.repeat(70));
  console.log(`🌐 Server URL:          http://localhost:${PORT}`);
  console.log(`🔗 API Base URL:        http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check:        http://localhost:${PORT}/api/health`);
  console.log(`🧪 CORS Test:           http://localhost:${PORT}/api/cors-test`);
  console.log(`🔌 Socket.IO:           ws://localhost:${PORT}`);
  console.log(`📊 Environment:         ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started At:          ${new Date().toLocaleString()}`);
  console.log(`🔒 CORS Allowed:        ${allowedOrigins.length} origins`);
  console.log('='.repeat(70));
  console.log('\n📋 Key Endpoints:');
  console.log('  • /api/auth           - Authentication');
  console.log('  • /api/sessions       - Session Management');
  console.log('  • /api/recordings     - Recording Management');
  console.log('  • /api/interviews     - Interview Management');
  console.log('  • /api/users          - User Management');
  console.log('  • /api/jobs           - Job Management');
  console.log('  • /api/ai             - AI Services');
  console.log('  • /api/admin          - Admin Panel');
  console.log('  • /api/screen-share   - Screen Share (WebRTC)');
  console.log('  • /api/files          - File Upload');
  console.log('='.repeat(70));
  console.log('✅ Server is ready to accept connections!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});
