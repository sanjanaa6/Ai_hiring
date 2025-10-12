const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const sttService = require('../services/sttService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'stt-audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `stt-audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (wav, mp3, m4a, flac, ogg, webm) are allowed'));
    }
  }
});

// Transcribe audio file
router.post('/transcribe-file', auth, upload.single('audio'), async (req, res) => {
  console.log('🎤 [STT API] Transcribing audio file...');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const {
      language = 'en-US',
      sampleRate = 16000,
      enablePunctuation = true,
      enableWordTimeOffsets = false,
      enableWordConfidence = false,
      model = 'default',
      useEnhanced = false,
      maxAlternatives = 1,
      profanityFilter = false,
      enableSpeakerDiarization = false,
      diarizationSpeakerCount = 2
    } = req.body;

    console.log('🔧 [STT API] Transcription options:', {
      language,
      sampleRate,
      enablePunctuation,
      model,
      useEnhanced
    });

    const result = await sttService.transcribeAudio(req.file.path, {
      language,
      sampleRate: parseInt(sampleRate),
      enablePunctuation: enablePunctuation === 'true',
      enableWordTimeOffsets: enableWordTimeOffsets === 'true',
      enableWordConfidence: enableWordConfidence === 'true',
      model,
      useEnhanced: useEnhanced === 'true',
      maxAlternatives: parseInt(maxAlternatives),
      profanityFilter: profanityFilter === 'true',
      enableSpeakerDiarization: enableSpeakerDiarization === 'true',
      diarizationSpeakerCount: parseInt(diarizationSpeakerCount)
    });

    // Clean up uploaded file
    setTimeout(() => {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (error) {
        console.error('Error cleaning up uploaded file:', error);
      }
    }, 1000);

    if (result.success) {
      res.json({
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          languageCode: result.languageCode,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [STT API] Error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio file'
    });
  }
});

// Transcribe audio buffer (for real-time transcription)
router.post('/transcribe-buffer', auth, async (req, res) => {
  console.log('🎤 [STT API] Transcribing audio buffer...');
  
  try {
    const { 
      audioData, // Base64 encoded audio data
      language = 'en-US',
      encoding = 'WEBM_OPUS',
      sampleRate = 16000,
      enablePunctuation = true,
      enableWordTimeOffsets = false,
      enableWordConfidence = false,
      model = 'default',
      useEnhanced = false,
      maxAlternatives = 1,
      profanityFilter = false,
      enableSpeakerDiarization = false,
      diarizationSpeakerCount = 2
    } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'Audio data is required'
      });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    console.log('🔧 [STT API] Transcription options:', {
      language,
      encoding,
      sampleRate,
      enablePunctuation,
      model,
      useEnhanced
    });

    const result = await sttService.transcribeBuffer(audioBuffer, {
      language,
      encoding,
      sampleRate: parseInt(sampleRate),
      enablePunctuation: enablePunctuation === 'true',
      enableWordTimeOffsets: enableWordTimeOffsets === 'true',
      enableWordConfidence: enableWordConfidence === 'true',
      model,
      useEnhanced: useEnhanced === 'true',
      maxAlternatives: parseInt(maxAlternatives),
      profanityFilter: profanityFilter === 'true',
      enableSpeakerDiarization: enableSpeakerDiarization === 'true',
      diarizationSpeakerCount: parseInt(diarizationSpeakerCount)
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          transcript: result.transcript,
          confidence: result.confidence,
          languageCode: result.languageCode,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [STT API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio buffer'
    });
  }
});

// Get supported languages
router.get('/languages', auth, (req, res) => {
  try {
    const languages = sttService.getSupportedLanguages();
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('❌ [STT API] Error getting languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages'
    });
  }
});

// Health check for STT service
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await sttService.healthCheck();
    if (healthCheck.success) {
      res.json({
        success: true,
        message: 'STT service is healthy',
        initialized: sttService.isInitialized
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'STT service is not healthy',
        details: healthCheck.error
      });
    }
  } catch (error) {
    console.error('❌ [STT API] Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'STT service is not healthy',
      details: error.message
    });
  }
});

// Test endpoint for quick transcription testing
router.post('/test', auth, upload.single('audio'), async (req, res) => {
  console.log('🧪 [STT API] Testing transcription...');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required for testing'
      });
    }

    const result = await sttService.transcribeAudio(req.file.path, {
      language: 'en-US',
      enablePunctuation: true,
      model: 'default'
    });

    // Clean up uploaded file
    setTimeout(() => {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (error) {
        console.error('Error cleaning up uploaded file:', error);
      }
    }, 1000);

    res.json({
      success: true,
      data: {
        transcript: result.transcript || 'No transcript generated',
        confidence: result.confidence || 0,
        success: result.success,
        error: result.error || null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [STT API] Test error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Test transcription failed',
      details: error.message
    });
  }
});

module.exports = router;
