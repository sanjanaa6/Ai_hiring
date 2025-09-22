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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

console.log('🔗 [SERVER] Attempting to connect to MongoDB...');
console.log('🌐 [SERVER] MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI)
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
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/ai', require('./routes/ai'));

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Basic route
app.get('/api', (req, res) => {
  console.log('🏠 [API] Health check endpoint accessed');
  res.json({ message: 'AI Hiring Backend API is running!' });
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
