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

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isDev = (process.env.NODE_ENV || 'development') !== 'production';
      
      if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
        return callback(null, true);
      }
      
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5000',
        'https://aihiring.eval8.ai',
        'https://aihire.eval8.ai',
        'https://www.aihiring.eval8.ai',
        'https://www.aihire.eval8.ai'
      ];
      
      if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

console.log('✅ [SOCKET.IO] Initialized successfully');

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
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://aihiring.eval8.ai',
      'https://aihire.eval8.ai',
      'https://www.aihiring.eval8.ai',
      'https://www.aihire.eval8.ai'
    ];

    if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
      console.log('✅ [CORS] Allowed origin:', normalizedOrigin);
      callback(null, true);
    } else {
      console.log('❌ [CORS] Blocked origin:', origin);
      console.log('🔍 [CORS] Normalized origin:', normalizedOrigin);
      console.log('📋 [CORS] Allowed origins:', allowedOrigins);
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

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📨 [${timestamp}] ${req.method} ${req.path}`);
  
  // Log query params if present
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  
  // Log body for POST/PUT/PATCH (but not for file uploads)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.path.includes('/upload')) {
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
    }
  }
  
  next();
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

console.log('🔗 [SERVER] Attempting to connect to MongoDB...');
console.log('🌐 [SERVER] MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI, {
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
console.log('📦 [SERVER] Loading routes...');

try {
  app.use('/api/dashboard', require('./routes/dashboard'));
  console.log('  ✅ Dashboard routes loaded');
} catch (err) {
  console.error('  ❌ Dashboard routes failed:', err.message);
}

try {
  app.use('/api/jobs', require('./routes/jobs'));
  console.log('  ✅ Jobs routes loaded');
} catch (err) {
  console.error('  ❌ Jobs routes failed:', err.message);
}

try {
  app.use('/api/applications', require('./routes/applications'));
  console.log('  ✅ Applications routes loaded');
} catch (err) {
  console.error('  ❌ Applications routes failed:', err.message);
}

try {
  app.use('/api/users', require('./routes/users'));
  console.log('  ✅ Users routes loaded');
} catch (err) {
  console.error('  ❌ Users routes failed:', err.message);
}

// Session management routes
try {
  app.use('/api/sessions', require('./routes/sessions'));
  console.log('  ✅ Session management routes loaded');
} catch (err) {
  console.error('  ❌ Session routes failed:', err.message);
}

// Recording management routes
try {
  app.use('/api/recordings', require('./routes/recordings'));
  console.log('  ✅ Recording management routes loaded');
} catch (err) {
  console.error('  ❌ Recording routes failed:', err.message);
}

// Interview scheduling routes must come BEFORE main interviews routes to avoid conflicts
try {
  app.use('/api/interviews', require('./routes/interviewScheduling'));
  console.log('  ✅ Interview scheduling routes loaded');
} catch (err) {
  console.error('  ❌ Interview scheduling routes failed:', err.message);
}

try {
  app.use('/api/interviews', require('./routes/formSubmission'));
  console.log('  ✅ Form submission routes loaded');
} catch (err) {
  console.error('  ❌ Form submission routes failed:', err.message);
}

try {
  app.use('/api/interviews', require('./routes/interviews'));
  console.log('  ✅ Interview routes loaded');
} catch (err) {
  console.error('  ❌ Interview routes failed:', err.message);
}

try {
  app.use('/api/ai', require('./routes/ai'));
  console.log('  ✅ AI routes loaded');
} catch (err) {
  console.error('  ❌ AI routes failed:', err.message);
}

try {
  app.use('/api/ai', require('./routes/aiEvaluation'));
  console.log('  ✅ AI evaluation routes loaded');
} catch (err) {
  console.error('  ❌ AI evaluation routes failed:', err.message);
}

try {
  app.use('/api/ai', require('./routes/aiLanguageDetection'));
  console.log('  ✅ AI language detection routes loaded');
} catch (err) {
  console.error('  ❌ AI language detection routes failed:', err.message);
}

try {
  app.use('/api/ai', require('./routes/salesInterviewService'));
  console.log('  ✅ Sales interview service routes loaded');
} catch (err) {
  console.error('  ❌ Sales interview service routes failed:', err.message);
}

try {
  app.use('/api/electronics', require('./routes/electronicsInterviewService'));
  console.log('  ✅ Electronics interview service routes loaded');
} catch (err) {
  console.error('  ❌ Electronics interview service routes failed:', err.message);
}

try {
  app.use('/api/coding-tutor', require('./routes/codingTutor'));
  console.log('  ✅ Coding tutor routes loaded');
} catch (err) {
  console.error('  ❌ Coding tutor routes failed:', err.message);
}

try {
  app.use('/api/admin', require('./routes/admin'));
  console.log('  ✅ Admin routes loaded');
} catch (err) {
  console.error('  ❌ Admin routes failed:', err.message);
}

try {
  app.use('/api/admin', require('./routes/adminAuth'));
  console.log('  ✅ Admin auth routes loaded');
} catch (err) {
  console.error('  ❌ Admin auth routes failed:', err.message);
}

try {
  app.use('/api/tts', require('./routes/tts'));
  console.log('  ✅ TTS routes loaded');
} catch (err) {
  console.error('  ❌ TTS routes failed:', err.message);
}

try {
  app.use('/api/stt', require('./routes/stt'));
  console.log('  ✅ STT routes loaded');
} catch (err) {
  console.error('  ❌ STT routes failed:', err.message);
}

try {
  app.use('/api/interviews', require('./routes/systemDesign'));
  console.log('  ✅ System Design routes loaded');
} catch (err) {
  console.error('  ❌ System Design routes failed:', err.message);
}

try {
  app.use('/api/interviews', require('./routes/pcbDesign'));
  console.log('  ✅ PCB Design routes loaded');
} catch (err) {
  console.error('  ❌ PCB Design routes failed:', err.message);
}

try {
  app.use('/api/screen-share', require('./routes/screenShare'));
  console.log('  ✅ Screen Share routes loaded');
} catch (err) {
  console.error('  ❌ Screen Share routes failed:', err.message);
}

try {
  app.use('/api/interview-recordings', require('./routes/interviewRecordings'));
  console.log('  ✅ Interview Recordings routes loaded');
} catch (err) {
  console.error('  ❌ Interview Recordings routes failed:', err.message);
}

console.log('📦 [SERVER] All routes loaded successfully!\n');

// Serve recruiter documents statically for admin review
app.use('/uploads/recruiter-docs', express.static(path.join(__dirname, 'uploads', 'recruiter-docs')));
// Serve form submission files statically
app.use('/uploads/form-submissions', express.static(path.join(__dirname, 'uploads', 'form-submissions')));
// Serve feedback PDFs statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add specific CORS handling for auth routes to ensure headers on all responses
app.use('/api/auth', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
}, require('./routes/auth'));
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
app.use('/api/judge0', require('./routes/judge0'));

// Global OPTIONS handler to guarantee preflight success across all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  res.sendStatus(200);
});



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

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory with proper cache headers
  app.use(express.static(path.join(__dirname, '../frontend/build'), {
    // Cache static assets (JS, CSS, images) for 1 year
    maxAge: '1y',
    // Don't cache HTML files to ensure users get the latest version
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
        // Cache static assets with versioning
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  
  // Handle React routing, but ONLY for non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes - let them be handled by API middleware
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // For all other routes, serve the React app with no-cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
  
  // 404 handler for API routes that don't exist
  app.use('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(404).json({ message: 'API endpoint not found' });
  });
} else {
  // 404 handler for development (API routes only)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    res.status(404).json({ message: 'Not Found' });
  });
}

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
  // Ensure CORS headers are present even on error responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');

  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize Screen Share Socket.IO handlers
try {
  const screenShareSocket = require('./socket/screenShareSocket');
  screenShareSocket(io);
  console.log('✅ [SOCKET.IO] Screen share handlers initialized');
} catch (err) {
  console.error('❌ [SOCKET.IO] Failed to initialize screen share handlers:', err.message);
}

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 [SERVER] AI HIRING BACKEND SERVER');
  console.log('='.repeat(60));
  console.log(`🌐 Server URL:        http://localhost:${PORT}`);
  console.log(`🔗 API Base URL:      http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check:      http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.IO:         ws://localhost:${PORT}`);
  console.log(`📊 Environment:       ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started At:        ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));
  console.log('\n📋 Available Endpoints:');
  console.log('  • /api/sessions       - Session Management');
  console.log('  • /api/recordings     - Recording Management (NEW)');
  console.log('  • /api/interviews     - Interview Management');
  console.log('  • /api/users          - User Management');
  console.log('  • /api/jobs           - Job Management');
  console.log('  • /api/ai             - AI Services');
  console.log('  • /api/admin          - Admin Panel');
  console.log('  • /api/screen-share   - Screen Share (WebRTC)');
  console.log('  • Socket.IO           - Real-time WebRTC Signaling');
  console.log('='.repeat(60));
  console.log('✅ [SERVER] Server is ready to accept connections!\n');
});
