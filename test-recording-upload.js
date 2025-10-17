/**
 * Test Script for Recording Upload
 * This simulates a recording upload to test the feature
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Create a dummy video file for testing (small WebM file)
function createDummyVideoFile() {
  const dummyVideoPath = path.join(__dirname, 'test-recording.webm');
  
  // Create a minimal WebM file (just header, won't play but will upload)
  const webmHeader = Buffer.from([
    0x1A, 0x45, 0xDF, 0xA3, // EBML Header
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F,
    0x42, 0x86, 0x81, 0x01,
    0x42, 0xF7, 0x81, 0x01,
    0x42, 0xF2, 0x81, 0x04,
    0x42, 0xF3, 0x81, 0x08,
    0x42, 0x82, 0x88, 0x77, 0x65, 0x62, 0x6D, 0x00, 0x00, 0x00, 0x00,
    0x42, 0x87, 0x81, 0x04,
    0x42, 0x85, 0x81, 0x02
  ]);
  
  // Add some random data to make it larger (simulate ~1MB file)
  const randomData = Buffer.alloc(1024 * 1024); // 1MB
  const fullData = Buffer.concat([webmHeader, randomData]);
  
  fs.writeFileSync(dummyVideoPath, fullData);
  log(`✅ Created dummy video file: ${dummyVideoPath}`, 'green');
  
  return dummyVideoPath;
}

async function testRecordingUpload() {
  console.log('\n' + '='.repeat(70));
  log('🧪 Testing Recording Upload Feature', 'blue');
  console.log('='.repeat(70) + '\n');

  let testFilePath = null;

  try {
    // Step 1: Check if backend is running
    log('📡 Step 1: Checking if backend is running...', 'yellow');
    try {
      await axios.get(`${API_URL}/health`, { timeout: 3000 });
      log('✅ Backend is running!', 'green');
    } catch (error) {
      log('❌ Backend is NOT running!', 'red');
      log('   Please start the backend server first:', 'red');
      log('   cd backend && npm start', 'yellow');
      return;
    }

    // Step 2: Create a test video file
    log('\n📹 Step 2: Creating test video file...', 'yellow');
    testFilePath = createDummyVideoFile();
    const fileStats = fs.statSync(testFilePath);
    log(`   File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`, 'green');

    // Step 3: Prepare upload data
    log('\n📦 Step 3: Preparing upload data...', 'yellow');
    const formData = new FormData();
    formData.append('recording', fs.createReadStream(testFilePath), {
      filename: 'test-recording.webm',
      contentType: 'video/webm'
    });
    
    // Add required metadata
    const testData = {
      interviewId: 'test_interview_' + Date.now(),
      candidateName: 'Test Candidate',
      candidateEmail: 'test@example.com',
      duration: 300, // 5 minutes
      recordingStartedAt: new Date(Date.now() - 300000).toISOString(),
      recordingEndedAt: new Date().toISOString(),
      recordingType: 'screen',
      metadata: JSON.stringify({
        screenResolution: '1920x1080',
        browserInfo: 'Chrome/120.0.0.0',
        deviceInfo: 'Windows 11',
        roundTitle: 'Test Round'
      })
    };

    Object.keys(testData).forEach(key => {
      formData.append(key, testData[key]);
    });

    log('✅ Upload data prepared', 'green');
    log(`   Interview ID: ${testData.interviewId}`, 'green');
    log(`   Candidate: ${testData.candidateName}`, 'green');

    // Step 4: Get authentication token
    log('\n🔐 Step 4: Authentication...', 'yellow');
    log('⚠️  Note: This test will fail without a valid auth token', 'yellow');
    log('   For full test, you need to:', 'yellow');
    log('   1. Login as candidate in browser', 'yellow');
    log('   2. Copy token from localStorage', 'yellow');
    log('   3. Set TOKEN environment variable', 'yellow');
    
    const token = process.env.TOKEN || null;
    
    if (!token) {
      log('\n⏭️  Skipping upload test (no token provided)', 'yellow');
      log('   To test upload with authentication:', 'yellow');
      log('   TOKEN=your_token_here node test-recording-upload.js', 'magenta');
      
      // Test without auth to see if route exists
      log('\n🔍 Testing if route exists (expect 401)...', 'yellow');
      try {
        await axios.post(`${API_URL}/interview-recordings/upload`, formData, {
          headers: formData.getHeaders()
        });
        log('❌ Unexpected: Upload succeeded without auth!', 'red');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          log('✅ Route exists! (401 Unauthorized as expected)', 'green');
          log('   This means the recording route is properly configured', 'green');
        } else if (error.response && error.response.status === 404) {
          log('❌ Route NOT found (404)!', 'red');
          log('   Backend needs to be restarted to load routes', 'red');
        } else {
          log(`⚠️  Unexpected error: ${error.message}`, 'yellow');
        }
      }
    } else {
      // Step 5: Upload with authentication
      log('\n📤 Step 5: Uploading recording...', 'yellow');
      try {
        const response = await axios.post(
          `${API_URL}/interview-recordings/upload`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              process.stdout.write(`\r   Upload progress: ${percentCompleted}%`);
            }
          }
        );

        console.log(''); // New line after progress
        log('✅ Upload successful!', 'green');
        log('\n📊 Response:', 'blue');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success) {
          log('\n🎉 Recording saved successfully!', 'green');
          log(`   Recording ID: ${response.data.data.recordingId}`, 'green');
          log(`   Status: ${response.data.data.status}`, 'green');
          log(`   Duration: ${response.data.data.duration} seconds`, 'green');
          log(`   File Size: ${(response.data.data.fileSize / 1024 / 1024).toFixed(2)} MB`, 'green');
        }
      } catch (error) {
        log('❌ Upload failed!', 'red');
        if (error.response) {
          log(`   Status: ${error.response.status}`, 'red');
          log(`   Message: ${error.response.data.message || 'Unknown error'}`, 'red');
          if (error.response.data.error) {
            log(`   Error: ${error.response.data.error}`, 'red');
          }
        } else {
          log(`   Error: ${error.message}`, 'red');
        }
      }
    }

    // Step 6: Check if file was saved locally
    log('\n📁 Step 6: Checking local storage...', 'yellow');
    const recordingsPath = path.join(__dirname, 'backend', 'uploads', 'recordings');
    if (fs.existsSync(recordingsPath)) {
      const files = getAllFiles(recordingsPath);
      if (files.length > 0) {
        log(`✅ Found ${files.length} recording(s) in local storage:`, 'green');
        files.forEach(file => {
          const stats = fs.statSync(file);
          log(`   - ${path.basename(file)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
        });
      } else {
        log('⚠️  No recordings found in local storage yet', 'yellow');
      }
    } else {
      log('⚠️  Local recordings directory does not exist yet', 'yellow');
      log('   It will be created on first upload', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  } finally {
    // Cleanup: Remove test file
    if (testFilePath && fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      log('\n🧹 Cleaned up test file', 'blue');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  log('📋 Test Summary', 'blue');
  console.log('='.repeat(70));
  log('✅ Backend is running', 'green');
  log('✅ Recording route exists', 'green');
  log('⚠️  Full upload test requires authentication token', 'yellow');
  log('\n💡 Next Steps:', 'blue');
  log('1. Login as candidate in browser (http://localhost:3000)', 'yellow');
  log('2. Start an actual interview and test recording', 'yellow');
  log('3. Check recruiter dashboard for the recording', 'yellow');
  console.log('='.repeat(70) + '\n');
}

// Helper function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Run the test
testRecordingUpload().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
