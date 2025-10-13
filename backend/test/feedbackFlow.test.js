/**
 * Integration Test: Answer Submission and Feedback Generation Flow
 * 
 * This test simulates a complete interview flow:
 * 1. Submit answers for multiple questions
 * 2. Verify answers are saved in database
 * 3. Generate AI feedback
 * 4. Verify PDF is created
 * 
 * Run with: node backend/test/feedbackFlow.test.js
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_INTERVIEW_ID = 'interview_1760346048993_gm0rba6mj'; // Python developer interview
const TEST_CANDIDATE = {
  id: `test_candidate_${Date.now()}`,
  name: 'Test Candidate',
  email: 'test@example.com'
};

// Test data
const TEST_ANSWERS = [
  {
    roundId: 'round_1',
    questionId: 'q1',
    question: 'Tell me about yourself',
    answer: 'I am a software developer with 5 years of experience in full-stack development. I have worked with React, Node.js, and MongoDB.',
    answerType: 'voice',
    timeTaken: 120
  },
  {
    roundId: 'round_1',
    questionId: 'q2',
    question: 'What are your strengths?',
    answer: 'My strengths include problem-solving, teamwork, and quick learning. I am passionate about clean code and best practices.',
    answerType: 'voice',
    timeTaken: 90
  },
  {
    roundId: 'round_2',
    questionId: 'q3',
    question: 'Write a function to reverse a string',
    answer: 'function reverseString(str) { return str.split("").reverse().join(""); }',
    answerType: 'code',
    timeTaken: 180
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Submit answers
 */
async function testSubmitAnswers() {
  logSection('TEST 1: Submitting Answers');
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TEST_ANSWERS.length; i++) {
    const answer = TEST_ANSWERS[i];
    
    try {
      log(`📤 Submitting answer ${i + 1}/${TEST_ANSWERS.length}...`, 'blue');
      log(`   Question: ${answer.question}`, 'yellow');
      
      const response = await axios.post(
        `${BASE_URL}/interviews/${TEST_INTERVIEW_ID}/answer`,
        {
          ...answer,
          candidateId: TEST_CANDIDATE.id,
          candidateName: TEST_CANDIDATE.name,
          candidateEmail: TEST_CANDIDATE.email
        }
      );

      if (response.data.success) {
        log(`   ✅ Answer submitted successfully`, 'green');
        log(`   Total answers in DB: ${response.data.data.totalAnswers}`, 'green');
        successCount++;
      } else {
        log(`   ❌ Failed: ${response.data.error}`, 'red');
        failCount++;
      }
      
      await sleep(500); // Small delay between requests
    } catch (error) {
      log(`   ❌ Error: ${error.response?.data?.error || error.message}`, 'red');
      failCount++;
    }
  }

  log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed`, 
      successCount === TEST_ANSWERS.length ? 'green' : 'yellow');
  
  return successCount === TEST_ANSWERS.length;
}

/**
 * Test 2: Verify answers in database
 */
async function testVerifyAnswers() {
  logSection('TEST 2: Verifying Answers in Database');
  
  try {
    // Connect to MongoDB
    log('🔌 Connecting to MongoDB...', 'blue');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_hiring');
    log('✅ Connected to MongoDB', 'green');

    // Get Interview model
    const Interview = require('../models/Interview');
    
    log(`🔍 Looking for interview: ${TEST_INTERVIEW_ID}`, 'blue');
    const interview = await Interview.findOne({ interviewId: TEST_INTERVIEW_ID });

    if (!interview) {
      log('❌ Interview not found in database', 'red');
      return false;
    }

    log('✅ Interview found', 'green');

    // Check candidate answers
    const candidateAnswers = interview.candidateAnswers.filter(
      ans => ans.candidateId === TEST_CANDIDATE.id
    );

    log(`\n📋 Found ${candidateAnswers.length} answers for candidate`, 'blue');
    
    if (candidateAnswers.length === 0) {
      log('❌ No answers found for this candidate!', 'red');
      return false;
    }

    // Display answers
    candidateAnswers.forEach((ans, idx) => {
      log(`\n   Answer ${idx + 1}:`, 'yellow');
      log(`   Question: ${ans.question}`, 'reset');
      log(`   Answer: ${ans.answer.substring(0, 100)}${ans.answer.length > 100 ? '...' : ''}`, 'reset');
      log(`   Type: ${ans.answerType || 'text'}`, 'reset');
      log(`   Time: ${ans.timeTaken}s`, 'reset');
    });

    log(`\n✅ All answers verified in database`, 'green');
    return true;

  } catch (error) {
    log(`❌ Database error: ${error.message}`, 'red');
    return false;
  } finally {
    await mongoose.disconnect();
    log('🔌 Disconnected from MongoDB', 'blue');
  }
}

/**
 * Test 3: Generate feedback
 */
async function testGenerateFeedback() {
  logSection('TEST 3: Generating AI Feedback');
  
  try {
    log('🤖 Requesting AI feedback generation...', 'blue');
    log('⏳ This may take 10-30 seconds...', 'yellow');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BASE_URL}/interviews/${TEST_INTERVIEW_ID}/feedback/generate`,
      {
        candidateId: TEST_CANDIDATE.id,
        candidateName: TEST_CANDIDATE.name,
        candidateEmail: TEST_CANDIDATE.email
      },
      {
        timeout: 60000 // 60 second timeout
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`✅ Feedback generated in ${duration}s`, 'green');

    if (response.data.success) {
      const feedback = response.data.data.feedback;
      const pdfUrl = response.data.data.pdfUrl;

      log('\n📄 Feedback Summary:', 'cyan');
      log(`   Overall Performance: ${feedback.overallPerformance?.substring(0, 150)}...`, 'reset');
      log(`   Strengths: ${feedback.strengths?.length || 0} identified`, 'green');
      log(`   Areas for Improvement: ${feedback.areasForImprovement?.length || 0} identified`, 'yellow');
      log(`   Recommendations: ${feedback.recommendations?.length || 0} provided`, 'blue');
      log(`   PDF URL: ${pdfUrl}`, 'cyan');
      log(`   Generated at: ${new Date(feedback.generatedAt).toLocaleString()}`, 'reset');

      // Display strengths
      if (feedback.strengths && feedback.strengths.length > 0) {
        log('\n💪 Strengths:', 'green');
        feedback.strengths.forEach((s, idx) => {
          log(`   ${idx + 1}. ${s}`, 'reset');
        });
      }

      // Display improvements
      if (feedback.areasForImprovement && feedback.areasForImprovement.length > 0) {
        log('\n📈 Areas for Improvement:', 'yellow');
        feedback.areasForImprovement.forEach((a, idx) => {
          log(`   ${idx + 1}. ${a}`, 'reset');
        });
      }

      log('\n✅ Feedback generation test PASSED', 'green');
      return true;
    } else {
      log(`❌ Failed: ${response.data.error}`, 'red');
      return false;
    }

  } catch (error) {
    log(`❌ Error: ${error.response?.data?.error || error.message}`, 'red');
    
    if (error.response?.data?.error === 'No interview answers found for this candidate') {
      log('\n💡 Tip: Make sure Test 1 (Submit Answers) passed successfully', 'yellow');
    }
    
    if (error.response?.data?.error?.includes('OPENROUTER_API_KEY')) {
      log('\n💡 Tip: Set OPENROUTER_API_KEY in your .env file', 'yellow');
    }
    
    return false;
  }
}

/**
 * Test 4: Retrieve feedback
 */
async function testRetrieveFeedback() {
  logSection('TEST 4: Retrieving Feedback');
  
  try {
    log('📥 Fetching feedback from API...', 'blue');
    
    const response = await axios.get(
      `${BASE_URL}/interviews/${TEST_INTERVIEW_ID}/feedback/${TEST_CANDIDATE.id}`
    );

    if (response.data.success) {
      log('✅ Feedback retrieved successfully', 'green');
      log(`   PDF URL: ${response.data.data.pdfUrl}`, 'cyan');
      return true;
    } else {
      log(`❌ Failed: ${response.data.error}`, 'red');
      return false;
    }

  } catch (error) {
    log(`❌ Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   AI Interview Feedback Flow - Integration Test Suite     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n📋 Test Configuration:', 'yellow');
  log(`   Base URL: ${BASE_URL}`, 'reset');
  log(`   Interview ID: ${TEST_INTERVIEW_ID}`, 'reset');
  log(`   Candidate: ${TEST_CANDIDATE.name} (${TEST_CANDIDATE.email})`, 'reset');
  log(`   Test Answers: ${TEST_ANSWERS.length}`, 'reset');

  const results = {
    submitAnswers: false,
    verifyAnswers: false,
    generateFeedback: false,
    retrieveFeedback: false
  };

  // Run tests sequentially
  try {
    // Test 1: Submit answers
    results.submitAnswers = await testSubmitAnswers();
    
    if (!results.submitAnswers) {
      log('\n⚠️  Skipping remaining tests due to answer submission failure', 'yellow');
      return printSummary(results);
    }

    await sleep(1000);

    // Test 2: Verify answers in database
    results.verifyAnswers = await testVerifyAnswers();
    
    if (!results.verifyAnswers) {
      log('\n⚠️  Skipping feedback tests due to verification failure', 'yellow');
      return printSummary(results);
    }

    await sleep(1000);

    // Test 3: Generate feedback
    results.generateFeedback = await testGenerateFeedback();

    if (results.generateFeedback) {
      await sleep(1000);
      
      // Test 4: Retrieve feedback
      results.retrieveFeedback = await testRetrieveFeedback();
    }

  } catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
  }

  printSummary(results);
}

/**
 * Print test summary
 */
function printSummary(results) {
  logSection('TEST SUMMARY');
  
  const tests = [
    { name: 'Submit Answers', result: results.submitAnswers },
    { name: 'Verify Answers in DB', result: results.verifyAnswers },
    { name: 'Generate AI Feedback', result: results.generateFeedback },
    { name: 'Retrieve Feedback', result: results.retrieveFeedback }
  ];

  tests.forEach(test => {
    const status = test.result ? '✅ PASSED' : '❌ FAILED';
    const color = test.result ? 'green' : 'red';
    log(`${status} - ${test.name}`, color);
  });

  const passedCount = tests.filter(t => t.result).length;
  const totalCount = tests.length;

  log(`\n📊 Overall: ${passedCount}/${totalCount} tests passed`, 
      passedCount === totalCount ? 'green' : 'yellow');

  if (passedCount === totalCount) {
    log('\n🎉 All tests passed! The feedback flow is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
  }

  log('\n💡 Tips:', 'cyan');
  log('   1. Make sure backend server is running on port 5000', 'reset');
  log('   2. Update TEST_INTERVIEW_ID with a real interview ID', 'reset');
  log('   3. Ensure OPENROUTER_API_KEY is set in .env file', 'reset');
  log('   4. Check MongoDB connection string', 'reset');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
