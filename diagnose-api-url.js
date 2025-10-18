/**
 * Diagnostic Script - Check API URL Configuration
 * Run this to identify which URL is being used in production
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('API URL Configuration Diagnostic');
console.log('========================================\n');

// Check environment files
const envFiles = [
  'frontend/.env',
  'frontend/.env.local',
  'frontend/.env.production',
  'frontend/.env.systemdesign'
];

console.log('📁 Checking environment files:\n');

envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} EXISTS`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const apiUrlMatch = content.match(/REACT_APP_API_URL=(.+)/);
      if (apiUrlMatch) {
        console.log(`  → API URL: ${apiUrlMatch[1]}`);
      } else {
        console.log(`  → No REACT_APP_API_URL found`);
      }
    } catch (err) {
      console.log(`  → Error reading file: ${err.message}`);
    }
  } else {
    console.log(`✗ ${file} NOT FOUND`);
  }
  console.log('');
});

// Check apiService.js
console.log('📄 Checking apiService.js:\n');

const apiServicePath = path.join(__dirname, 'frontend/src/services/apiService.js');
if (fs.existsSync(apiServicePath)) {
  const content = fs.readFileSync(apiServicePath, 'utf8');
  
  // Check for hardcoded URLs
  const urlPatterns = [
    /aihire\.eval8\.ai/g,
    /aihiring\.eval8\.ai/g,
    /eval8\.ai/g
  ];
  
  urlPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`✓ Found pattern: ${pattern.source}`);
      console.log(`  → Occurrences: ${matches.length}`);
    }
  });
  
  // Check the getApiBaseUrl function
  const getApiBaseUrlMatch = content.match(/return 'https:\/\/([^']+)'/g);
  if (getApiBaseUrlMatch) {
    console.log('\n🔍 Hardcoded URLs in getApiBaseUrl:');
    getApiBaseUrlMatch.forEach(url => {
      console.log(`  → ${url}`);
    });
  }
} else {
  console.log('✗ apiService.js NOT FOUND');
}

console.log('\n========================================');
console.log('📊 Analysis:');
console.log('========================================\n');

console.log('The error shows requests going to: aihire.eval8.ai');
console.log('Expected production URL should be: aihiring.eval8.ai\n');

console.log('Possible causes:');
console.log('1. Wrong .env.production file during build');
console.log('2. Typo in environment variable');
console.log('3. Old build cached in production');
console.log('4. CDN/proxy configuration issue\n');

console.log('========================================');
console.log('✅ Recommended Fix:');
console.log('========================================\n');

console.log('1. Run: fix-production-url.bat');
console.log('2. Upload frontend/build/ to production');
console.log('3. Clear browser cache');
console.log('4. Test with hard refresh (Ctrl+Shift+R)\n');

console.log('========================================\n');
