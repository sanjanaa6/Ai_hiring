#!/usr/bin/env node

/**
 * Installation script for XTTS-v2 TTS dependencies
 * This script helps set up the required dependencies for the TTS service
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎤 [TTS INSTALLER] Starting XTTS-v2 setup...');

try {
  // Check if Python is installed
  console.log('🐍 [TTS INSTALLER] Checking Python installation...');
  try {
    execSync('python --version', { stdio: 'pipe' });
    console.log('✅ [TTS INSTALLER] Python is installed');
  } catch (error) {
    console.log('❌ [TTS INSTALLER] Python is not installed. Please install Python 3.8+ first.');
    console.log('   Download from: https://www.python.org/downloads/');
    process.exit(1);
  }

  // Check if pip is available
  console.log('📦 [TTS INSTALLER] Checking pip installation...');
  try {
    execSync('pip --version', { stdio: 'pipe' });
    console.log('✅ [TTS INSTALLER] pip is available');
  } catch (error) {
    console.log('❌ [TTS INSTALLER] pip is not available. Please install pip first.');
    process.exit(1);
  }

  // Install Python dependencies
  console.log('📦 [TTS INSTALLER] Installing Python dependencies...');
  const pythonDeps = [
    'TTS>=0.22.0',
    'torch>=2.0.0',
    'torchaudio>=2.0.0',
    'numpy>=1.24.0',
    'scipy>=1.10.0',
    'librosa>=0.10.0',
    'soundfile>=0.12.0'
  ];

  for (const dep of pythonDeps) {
    console.log(`📦 [TTS INSTALLER] Installing ${dep}...`);
    try {
      execSync(`pip install "${dep}"`, { stdio: 'inherit' });
      console.log(`✅ [TTS INSTALLER] ${dep} installed successfully`);
    } catch (error) {
      console.log(`⚠️ [TTS INSTALLER] Failed to install ${dep}, continuing...`);
    }
  }

  // Create necessary directories
  console.log('📁 [TTS INSTALLER] Creating necessary directories...');
  const directories = [
    path.join(__dirname, '..', 'temp'),
    path.join(__dirname, '..', 'uploads', 'reference-audio'),
    path.join(__dirname, '..', 'models')
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ [TTS INSTALLER] Created directory: ${dir}`);
    }
  }

  // Download XTTS-v2 model (this will happen on first use)
  console.log('🤖 [TTS INSTALLER] XTTS-v2 model will be downloaded on first use...');

  // Create environment variables template
  console.log('⚙️ [TTS INSTALLER] Creating environment configuration...');
  const envTemplate = `
# TTS Configuration
TTS_MODEL_PATH=./models/xtts_v2
TTS_CACHE_DIR=./temp
TTS_USE_GPU=false
TTS_MAX_TEXT_LENGTH=1000
`;

  const envPath = path.join(__dirname, '..', '.env.tts');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ [TTS INSTALLER] Created .env.tts template');
  }

  console.log('🎉 [TTS INSTALLER] XTTS-v2 setup completed successfully!');
  console.log('');
  console.log('📋 [TTS INSTALLER] Next steps:');
  console.log('1. Review and update .env.tts with your preferred settings');
  console.log('2. Start your backend server: npm run dev');
  console.log('3. The XTTS-v2 model will be downloaded automatically on first use');
  console.log('4. Test the TTS service at: http://localhost:5000/api/tts/health');
  console.log('');
  console.log('⚠️ [TTS INSTALLER] Note: First TTS request may take longer due to model download');

} catch (error) {
  console.error('❌ [TTS INSTALLER] Setup failed:', error.message);
  process.exit(1);
}
