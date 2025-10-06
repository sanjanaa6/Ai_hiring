#!/usr/bin/env node

/**
 * CORS Test Script
 * This script tests the CORS configuration for the AI Hiring backend
 */

const axios = require('axios');

const BACKEND_URL = 'https://aihire.eval8.xyz/api';
const FRONTEND_ORIGIN = 'https://aihiring.eval8.xyz';

async function testCORS() {
  console.log('🧪 Testing CORS configuration...');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend Origin: ${FRONTEND_ORIGIN}`);
  console.log('');

  try {
    // Test 1: Basic CORS test endpoint
    console.log('1️⃣ Testing basic CORS endpoint...');
    const corsResponse = await axios.get(`${BACKEND_URL}/cors-test`, {
      headers: {
        'Origin': FRONTEND_ORIGIN
      }
    });
    console.log('✅ CORS test endpoint successful');
    console.log('Response:', corsResponse.data);
    console.log('');

    // Test 2: Test OPTIONS preflight request
    console.log('2️⃣ Testing OPTIONS preflight request...');
    const optionsResponse = await axios.options(`${BACKEND_URL}/files/interviews/test/upload`, {
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log('✅ OPTIONS preflight request successful');
    console.log('Status:', optionsResponse.status);
    console.log('Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers'],
      'Access-Control-Allow-Credentials': optionsResponse.headers['access-control-allow-credentials']
    });
    console.log('');

    console.log('🎉 All CORS tests passed!');
    
  } catch (error) {
    console.error('❌ CORS test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testCORS();
