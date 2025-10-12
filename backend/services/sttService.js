const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

class STTService {
  constructor() {
    this.isInitialized = false;
    this.client = null;
    this.googleApiKey = process.env.GOOGLE_STT_API_KEY || process.env.GOOGLE_CLOUD_STT_API_KEY || process.env.GOOGLE_API_KEY;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Google Cloud Speech client
      if (this.googleApiKey) {
        // Use API key authentication
        this.client = new speech.SpeechClient({
          apiKey: this.googleApiKey,
        });
      } else {
        // Use default authentication (service account key file or metadata server)
        this.client = new speech.SpeechClient();
      }

      this.isInitialized = true;
      console.log('✅ [STT] Google Speech-to-Text service initialized');
    } catch (error) {
      console.error('❌ [STT] Failed to initialize Google Speech-to-Text service:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio file using Google Cloud Speech-to-Text
   * @param {string} audioFilePath - Path to the audio file
   * @param {Object} options - Transcription options
   * @returns {Promise<{success: boolean, transcript?: string, confidence?: number, error?: string}>}
   */
  async transcribeAudio(audioFilePath, options = {}) {
    try {
      await this.initialize();

      if (!this.client) {
        throw new Error('STT client not initialized');
      }

      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      // Read the audio file
      const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

      // Configure the request
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: this._getAudioEncoding(audioFilePath),
          sampleRateHertz: options.sampleRate || 16000,
          languageCode: options.language || 'en-US',
          enableAutomaticPunctuation: options.enablePunctuation !== false,
          enableWordTimeOffsets: options.enableWordTimeOffsets || false,
          enableWordConfidence: options.enableWordConfidence || false,
          model: options.model || 'default',
          useEnhanced: options.useEnhanced || false,
          ...(options.alternativeLanguageCodes && {
            alternativeLanguageCodes: options.alternativeLanguageCodes
          }),
          ...(options.maxAlternatives && {
            maxAlternatives: options.maxAlternatives
          }),
          ...(options.profanityFilter !== undefined && {
            profanityFilter: options.profanityFilter
          }),
          ...(options.enableSpeakerDiarization && {
            enableSpeakerDiarization: options.enableSpeakerDiarization,
            diarizationSpeakerCount: options.diarizationSpeakerCount || 2
          })
        },
      };

      console.log('🎤 [STT] Transcribing audio file:', audioFilePath);
      console.log('🔧 [STT] Config:', JSON.stringify(request.config, null, 2));

      // Perform the transcription
      const [response] = await this.client.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return {
          success: false,
          error: 'No transcription results found'
        };
      }

      // Extract the transcript and confidence
      const result = response.results[0];
      const transcript = result.alternatives[0].transcript;
      const confidence = result.alternatives[0].confidence;

      console.log('✅ [STT] Transcription completed');
      console.log('📝 [STT] Transcript:', transcript);
      console.log('🎯 [STT] Confidence:', confidence);

      return {
        success: true,
        transcript: transcript,
        confidence: confidence,
        languageCode: request.config.languageCode
      };

    } catch (error) {
      console.error('❌ [STT] Transcription failed:', error);
      return {
        success: false,
        error: error.message || 'Transcription failed'
      };
    }
  }

  /**
   * Transcribe audio from buffer using Google Cloud Speech-to-Text
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {Object} options - Transcription options
   * @returns {Promise<{success: boolean, transcript?: string, confidence?: number, error?: string}>}
   */
  async transcribeBuffer(audioBuffer, options = {}) {
    try {
      await this.initialize();

      if (!this.client) {
        throw new Error('STT client not initialized');
      }

      // Convert buffer to base64
      const audioBytes = audioBuffer.toString('base64');

      // Configure the request
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: options.encoding || 'WEBM_OPUS',
          sampleRateHertz: options.sampleRate || 16000,
          languageCode: options.language || 'en-US',
          enableAutomaticPunctuation: options.enablePunctuation !== false,
          enableWordTimeOffsets: options.enableWordTimeOffsets || false,
          enableWordConfidence: options.enableWordConfidence || false,
          model: options.model || 'default',
          useEnhanced: options.useEnhanced || false,
          ...(options.alternativeLanguageCodes && {
            alternativeLanguageCodes: options.alternativeLanguageCodes
          }),
          ...(options.maxAlternatives && {
            maxAlternatives: options.maxAlternatives
          }),
          ...(options.profanityFilter !== undefined && {
            profanityFilter: options.profanityFilter
          }),
          ...(options.enableSpeakerDiarization && {
            enableSpeakerDiarization: options.enableSpeakerDiarization,
            diarizationSpeakerCount: options.diarizationSpeakerCount || 2
          })
        },
      };

      console.log('🎤 [STT] Transcribing audio buffer');
      console.log('🔧 [STT] Config:', JSON.stringify(request.config, null, 2));

      // Perform the transcription
      const [response] = await this.client.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return {
          success: false,
          error: 'No transcription results found'
        };
      }

      // Extract the transcript and confidence
      const result = response.results[0];
      const transcript = result.alternatives[0].transcript;
      const confidence = result.alternatives[0].confidence;

      console.log('✅ [STT] Transcription completed');
      console.log('📝 [STT] Transcript:', transcript);
      console.log('🎯 [STT] Confidence:', confidence);

      return {
        success: true,
        transcript: transcript,
        confidence: confidence,
        languageCode: request.config.languageCode
      };

    } catch (error) {
      console.error('❌ [STT] Transcription failed:', error);
      return {
        success: false,
        error: error.message || 'Transcription failed'
      };
    }
  }

  /**
   * Get supported languages for Google Speech-to-Text
   * @returns {Array} Array of supported language codes
   */
  getSupportedLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'en-AU', name: 'English (Australia)' },
      { code: 'en-CA', name: 'English (Canada)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'fr-CA', name: 'French (Canada)' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' },
      { code: 'nl-NL', name: 'Dutch' },
      { code: 'sv-SE', name: 'Swedish' },
      { code: 'no-NO', name: 'Norwegian' },
      { code: 'da-DK', name: 'Danish' },
      { code: 'fi-FI', name: 'Finnish' },
      { code: 'pl-PL', name: 'Polish' },
      { code: 'tr-TR', name: 'Turkish' },
      { code: 'th-TH', name: 'Thai' },
      { code: 'vi-VN', name: 'Vietnamese' },
      { code: 'id-ID', name: 'Indonesian' },
      { code: 'ms-MY', name: 'Malay' },
      { code: 'tl-PH', name: 'Filipino' }
    ];
  }

  /**
   * Get audio encoding from file extension
   * @param {string} filePath - Path to audio file
   * @returns {string} Google Cloud Speech encoding
   */
  _getAudioEncoding(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.wav':
        return 'LINEAR16';
      case '.flac':
        return 'FLAC';
      case '.mp3':
        return 'MP3';
      case '.ogg':
        return 'OGG_OPUS';
      case '.webm':
        return 'WEBM_OPUS';
      case '.m4a':
        return 'MP3';
      default:
        return 'LINEAR16';
    }
  }

  /**
   * Health check for STT service
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async healthCheck() {
    try {
      await this.initialize();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

module.exports = new STTService();
