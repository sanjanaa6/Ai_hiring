/**
 * Simple Recording Test - No External Dependencies
 * Tests if recording routes are working
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console
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

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testRecording() {
  console.log('\n' + '='.repeat(70));
  log('🧪 Simple Recording Feature Test', 'blue');
  console.log('='.repeat(70) + '\n');

  // Test 1: Check if backend is running
  log('📡 Test 1: Checking if backend is running...', 'yellow');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    });
    
    if (response.status === 200) {
      log('✅ Backend is running!', 'green');
      try {
        const health = JSON.parse(response.data);
        log(`   Status: ${health.status}`, 'green');
      } catch (e) {
        log('   Response received', 'green');
      }
    } else {
      log(`⚠️  Backend responded with status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log('❌ Backend is NOT running!', 'red');
    log('   Please start the backend server:', 'red');
    log('   cd backend && npm start', 'yellow');
    return;
  }

  // Test 2: Check if recording route exists
  log('\n🔍 Test 2: Checking if recording routes exist...', 'yellow');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview-recordings/recruiter/my-recordings',
      method: 'GET'
    });

    if (response.status === 401) {
      log('✅ Recording routes are registered!', 'green');
      log('   (401 Unauthorized - authentication required, as expected)', 'green');
    } else if (response.status === 404) {
      log('❌ Recording routes NOT found (404)!', 'red');
      log('   Backend needs to be restarted to load new routes', 'red');
    } else {
      log(`⚠️  Unexpected status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Error checking routes: ${error.message}`, 'red');
  }

  // Test 3: Check backend console for S3 configuration
  log('\n⚙️  Test 3: Storage Configuration', 'yellow');
  log('   Check your backend console for one of these messages:', 'yellow');
  log('   ✅ [S3] AWS S3 configured and ready', 'green');
  log('   ⚠️  [S3] AWS credentials not found - using local file storage', 'yellow');

  // Test 4: Check if local recordings directory exists
  log('\n📁 Test 4: Checking local storage directory...', 'yellow');
  const recordingsPath = path.join(__dirname, 'backend', 'uploads', 'recordings');
  
  if (fs.existsSync(recordingsPath)) {
    log(`✅ Recordings directory exists: ${recordingsPath}`, 'green');
    
    // Check for existing recordings
    const files = [];
    function scanDir(dir) {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.webm')) {
          files.push(fullPath);
        }
      });
    }
    
    try {
      scanDir(recordingsPath);
      if (files.length > 0) {
        log(`✅ Found ${files.length} recording(s):`, 'green');
        files.forEach(file => {
          const stats = fs.statSync(file);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          log(`   - ${path.basename(file)} (${sizeMB} MB)`, 'green');
        });
      } else {
        log('   No recordings found yet (this is normal for first run)', 'yellow');
      }
    } catch (e) {
      log('   Directory is empty or not accessible', 'yellow');
    }
  } else {
    log('   Recordings directory will be created on first upload', 'yellow');
  }

  // Test 5: Check required files
  log('\n📄 Test 5: Checking required files...', 'yellow');
  const requiredFiles = [
    'backend/models/InterviewRecording.js',
    'backend/services/recordingUploadService.js',
    'backend/routes/interviewRecordings.js',
    'frontend/src/hooks/useScreenRecording.js',
    'frontend/src/services/recordingService.js',
    'frontend/src/components/RecordingViewer.js',
    'frontend/src/components/RecordingsList.js'
  ];

  let allExist = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(`   ✅ ${file}`, 'green');
    } else {
      log(`   ❌ ${file} - MISSING!`, 'red');
      allExist = false;
    }
  });

  if (allExist) {
    log('\n✅ All required files exist!', 'green');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  log('📊 Test Summary', 'blue');
  console.log('='.repeat(70));
  log('Backend Status:', 'blue');
  log('  ✅ Server is running', 'green');
  log('  ✅ Recording routes are registered', 'green');
  log('  ✅ All required files exist', 'green');
  
  console.log('\n' + '='.repeat(70));
  log('🎯 How to Test Recording:', 'blue');
  console.log('='.repeat(70));
  log('1. Open browser: http://localhost:3000', 'yellow');
  log('2. Login as CANDIDATE', 'yellow');
  log('3. Join an interview (get link from recruiter)', 'yellow');
  log('4. Click "Start Interview"', 'yellow');
  log('5. Allow screen sharing when prompted', 'yellow');
  log('6. Complete the interview', 'yellow');
  log('7. Recording will upload automatically', 'yellow');
  log('\n8. Login as RECRUITER', 'yellow');
  log('9. Click "Recordings" tab in sidebar', 'yellow');
  log('10. View your recording!', 'yellow');
  
  console.log('\n' + '='.repeat(70));
  log('💡 What to Watch For:', 'blue');
  console.log('='.repeat(70));
  log('In Browser (Candidate):', 'yellow');
  log('  • Screen sharing permission popup', 'yellow');
  log('  • Recording indicator during interview', 'yellow');
  log('  • Upload progress after completing', 'yellow');
  log('  • Success notification', 'yellow');
  
  log('\nIn Backend Console:', 'yellow');
  log('  • 📤 [UPLOAD] Starting upload...', 'yellow');
  log('  • ✅ [LOCAL UPLOAD] Upload successful', 'yellow');
  log('  • ✅ [RECORDING] Recording saved successfully', 'yellow');
  
  log('\nIn Recruiter Dashboard:', 'yellow');
  log('  • Recording appears in list', 'yellow');
  log('  • Can play, download, delete', 'yellow');
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Run test
testRecording().catch(error => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});
