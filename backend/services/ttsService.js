const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TTSService {
  constructor() {
    this.isInitialized = false;
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🎤 [TTS] Initializing TTS service...');
      
      // For now, we'll use a web-based TTS service
      // In production, you might want to use a dedicated TTS API
      this.isInitialized = true;
      console.log('✅ [TTS] TTS service initialized successfully');
    } catch (error) {
      console.error('❌ [TTS] Failed to initialize TTS service:', error);
      throw error;
    }
  }

  async generateSpeech(text, options = {}) {
    try {
      await this.initialize();

      const {
        language = 'en',
        speed = 1.0,
        pitch = 1.0,
        emotion = 'neutral'
      } = options;

      console.log(`🎤 [TTS] Generating speech for text: "${text.substring(0, 50)}..."`);

      // For now, we'll create a simple audio file using Web Speech API simulation
      // In production, you would integrate with a real TTS service like:
      // - Google Cloud Text-to-Speech
      // - Amazon Polly
      // - Azure Cognitive Services
      // - ElevenLabs
      
      const audioData = await this._generateAudioData(text, options);
      
      return {
        success: true,
        audioData: audioData,
        duration: this._estimateDuration(text),
        language: language
      };

    } catch (error) {
      console.error('❌ [TTS] Error generating speech:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async _generateAudioData(text, options) {
    // This is a placeholder implementation
    // In a real implementation, you would call an external TTS API
    // For now, we'll return a simple, browser-compatible WAV file
    
    const duration = this._estimateDuration(text);
    const sampleRate = 44100; // Standard sample rate
    const samples = Math.floor(duration * sampleRate);
    const bytesPerSample = 2; // 16-bit audio
    const numChannels = 1; // Mono
    const byteRate = sampleRate * numChannels * bytesPerSample;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = samples * blockAlign;
    const fileSize = 36 + dataSize;
    
    // Create WAV file header (44 bytes)
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(16, 34); // bits per sample
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    // Create audio data (simple sine wave as placeholder)
    const audioData = Buffer.alloc(dataSize);
    for (let i = 0; i < samples; i++) {
      // Create a more interesting tone pattern
      const frequency = 440 + Math.sin(i * 0.001) * 100; // Varying frequency
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
      audioData.writeInt16LE(intSample, i * 2);
    }
    
    // Combine header and audio data
    const wavFile = Buffer.concat([header, audioData]);
    
    console.log(`🎵 [TTS] Generated WAV file: ${wavFile.length} bytes, ${duration}s duration`);
    return wavFile;
  }

  async generateSpeechWithVoiceCloning(text, referenceAudioPath, options = {}) {
    try {
      await this.initialize();

      const {
        language = 'en',
        speed = 1.0,
        pitch = 1.0
      } = options;

      // Validate reference audio file exists
      if (!fs.existsSync(referenceAudioPath)) {
        throw new Error(`Reference audio file not found: ${referenceAudioPath}`);
      }

      console.log(`🎤 [TTS] Generating cloned speech for text: "${text.substring(0, 50)}..."`);

      // For now, we'll use the same audio generation but with different parameters
      // In production, you would integrate with a voice cloning service
      const audioData = await this._generateAudioData(text, { ...options, cloned: true });
      
      return {
        success: true,
        audioData: audioData,
        duration: this._estimateDuration(text),
        language: language,
        cloned: true
      };

    } catch (error) {
      console.error('❌ [TTS] Error generating cloned speech:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'ru', name: 'Russian' },
      { code: 'nl', name: 'Dutch' },
      { code: 'cs', name: 'Czech' },
      { code: 'ar', name: 'Arabic' },
      { code: 'zh-cn', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'ko', name: 'Korean' }
    ];
  }

  _estimateDuration(text) {
    // Rough estimation: average speaking rate is about 150 words per minute
    const wordsPerMinute = 150;
    const wordCount = text.split(' ').length;
    return Math.ceil((wordCount / wordsPerMinute) * 60); // duration in seconds
  }

  async cleanupTempFiles() {
    try {
      const tempDir = path.join(__dirname, '..', 'temp');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ [TTS] Cleaned up old temp file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ [TTS] Error cleaning up temp files:', error);
    }
  }
}

// Create singleton instance
const ttsService = new TTSService();

// Clean up temp files every hour
setInterval(() => {
  ttsService.cleanupTempFiles();
}, 60 * 60 * 1000);

module.exports = ttsService;
