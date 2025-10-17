/**
 * Quick Test Script for Recording Routes
 * Run this to verify the recording feature is working
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRecordingRoutes() {
  console.log('\n' + '='.repeat(60));
  log('🧪 Testing Recording Routes', 'blue');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Check if server is running
  log('\n📡 Test 1: Check if backend server is running...', 'yellow');
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 3000 });
    if (response.status === 200) {
      log('✅ Backend server is running!', 'green');
      log(`   Status: ${response.data.status}`, 'green');
      passed++;
    }
  } catch (error) {
    log('❌ Backend server is NOT running!', 'red');
    log('   Please start the backend server first:', 'red');
    log('   cd backend && npm start', 'yellow');
    failed++;
    return;
  }

  // Test 2: Check if recording routes exist (without auth - should get 401)
  log('\n🔐 Test 2: Check if recording routes are registered...', 'yellow');
  try {
    await axios.get(`${API_URL}/interview-recordings/recruiter/my-recordings`);
    log('❌ Route exists but should require authentication', 'red');
    failed++;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('✅ Recording routes are registered! (401 Unauthorized as expected)', 'green');
      passed++;
    } else if (error.response && error.response.status === 404) {
      log('❌ Recording routes NOT found (404)!', 'red');
      log('   The server needs to be restarted to load new routes.', 'red');
      log('   Stop the backend (Ctrl+C) and restart it:', 'yellow');
      log('   cd backend && npm start', 'yellow');
      failed++;
    } else {
      log(`❌ Unexpected error: ${error.message}`, 'red');
      failed++;
    }
  }

  // Test 3: Check if required files exist
  log('\n📁 Test 3: Check if required files exist...', 'yellow');
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'backend/models/InterviewRecording.js',
    'backend/services/recordingUploadService.js',
    'backend/routes/interviewRecordings.js',
    'frontend/src/hooks/useScreenRecording.js',
    'frontend/src/services/recordingService.js',
    'frontend/src/components/RecordingViewer.js',
    'frontend/src/components/RecordingsList.js'
  ];

  let allFilesExist = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(`   ✅ ${file}`, 'green');
    } else {
      log(`   ❌ ${file} - MISSING!`, 'red');
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    log('✅ All required files exist!', 'green');
    passed++;
  } else {
    log('❌ Some files are missing!', 'red');
    failed++;
  }

  // Test 4: Check if AWS SDK is installed
  log('\n📦 Test 4: Check if AWS SDK dependencies are installed...', 'yellow');
  try {
    require('@aws-sdk/client-s3');
    require('@aws-sdk/s3-request-presigner');
    log('✅ AWS SDK dependencies are installed!', 'green');
    passed++;
  } catch (error) {
    log('❌ AWS SDK dependencies are missing!', 'red');
    log('   Install them with:', 'yellow');
    log('   cd backend && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner', 'yellow');
    failed++;
  }

  // Test 5: Check if multer is installed
  log('\n📦 Test 5: Check if multer is installed...', 'yellow');
  try {
    require('multer');
    log('✅ Multer is installed!', 'green');
    passed++;
  } catch (error) {
    log('❌ Multer is missing!', 'red');
    log('   Install it with:', 'yellow');
    log('   cd backend && npm install multer', 'yellow');
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('📊 Test Summary', 'blue');
  console.log('='.repeat(60));
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    log('🎉 All tests passed! Recording feature is ready to use!', 'green');
    log('\n📝 Next steps:', 'blue');
    log('1. Configure AWS S3 credentials in backend/.env', 'yellow');
    log('2. Login as recruiter and check the "Recordings" tab', 'yellow');
    log('3. Start an interview as a candidate to test recording', 'yellow');
  } else {
    log('⚠️  Some tests failed. Please fix the issues above.', 'red');
  }
}

// Run tests
testRecordingRoutes().catch(error => {
  log(`\n❌ Test script error: ${error.message}`, 'red');
  process.exit(1);
});
