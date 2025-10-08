const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ttsService = require('../services/ttsService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'reference-audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `ref-audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.wav', '.mp3', '.m4a', '.flac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (wav, mp3, m4a, flac) are allowed'));
    }
  }
});

// Generate speech from text
router.post('/generate-speech', auth, async (req, res) => {
  console.log('🎤 [TTS API] Generating speech...');
  
  try {
    const { 
      text, 
      language = 'en', 
      speed = 1.0, 
      pitch = 1.0,
      emotion = 'neutral',
      voice,
      ssmlGender
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long. Maximum 1000 characters allowed.'
      });
    }

    const result = await ttsService.generateSpeech(text, {
      language,
      speed,
      pitch,
      emotion,
      voice,
      ssmlGender
    });

    if (result.success) {
      // Set appropriate headers for audio response
      const contentType = result.contentType || 'audio/wav';
      const extension = contentType === 'audio/mpeg' ? 'mp3' : (contentType === 'audio/ogg' ? 'ogg' : 'wav');
      res.set({
        'Content-Type': contentType,
        'Content-Length': result.audioData.length,
        'Content-Disposition': `attachment; filename="tts_${Date.now()}.${extension}"`
      });

      // Send the audio data
      res.send(result.audioData);

    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [TTS API] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech'
    });
  }
});

// Generate speech with voice cloning
router.post('/generate-speech-cloned', auth, upload.single('referenceAudio'), async (req, res) => {
  console.log('🎤 [TTS API] Generating cloned speech...');
  
  try {
    const { 
      text, 
      language = 'en', 
      speed = 1.0, 
      pitch = 1.0
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Reference audio file is required'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long. Maximum 1000 characters allowed.'
      });
    }

    const result = await ttsService.generateSpeechWithVoiceCloning(
      text, 
      req.file.path, 
      {
        language,
        speed,
        pitch
      }
    );

    if (result.success) {
      // Set appropriate headers for audio response
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': result.audioData.length,
        'Content-Disposition': `attachment; filename="tts_cloned_${Date.now()}.wav"`
      });

      // Send the audio data
      res.send(result.audioData);

      // Clean up uploaded reference file
      setTimeout(() => {
        try {
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (error) {
          console.error('Error cleaning up uploaded file:', error);
        }
      }, 1000);

    } else {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [TTS API] Error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate cloned speech'
    });
  }
});

// Get supported languages
router.get('/languages', auth, (req, res) => {
  try {
    const languages = ttsService.getSupportedLanguages();
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('❌ [TTS API] Error getting languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages'
    });
  }
});

// Health check for TTS service (public endpoint)
router.get('/health', async (req, res) => {
  try {
    await ttsService.initialize();
    res.json({
      success: true,
      message: 'TTS service is healthy',
      initialized: ttsService.isInitialized
    });
  } catch (error) {
    console.error('❌ [TTS API] Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'TTS service is not healthy',
      details: error.message
    });
  }
});

module.exports = router;
