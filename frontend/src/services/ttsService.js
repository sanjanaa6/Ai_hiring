import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class TTSService {
  constructor() {
    this.audioCache = new Map();
    this.isGenerating = false;
  }

  /**
   * Generate speech from text using XTTS-v2
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<Blob>} - Audio blob
   */
  async generateSpeech(text, options = {}) {
    const {
      language = 'en',
      speed = 1.0,
      pitch = 1.0,
      emotion = 'neutral',
      useCache = true
    } = options;

    // Create cache key
    const cacheKey = `${text}_${language}_${speed}_${pitch}_${emotion}`;
    
    // Check cache first
    if (useCache && this.audioCache.has(cacheKey)) {
      console.log('🎤 [TTS] Using cached audio');
      return this.audioCache.get(cacheKey);
    }

    if (this.isGenerating) {
      throw new Error('TTS generation already in progress');
    }

    this.isGenerating = true;

    try {
      console.log('🎤 [TTS] Generating speech for:', text.substring(0, 50) + '...');
      console.log('🎤 [TTS] API URL:', `${API_BASE_URL}/tts/generate-speech`);
      console.log('🎤 [TTS] Request payload:', { text, language, speed, pitch, emotion });

      const response = await axios.post(
        `${API_BASE_URL}/tts/generate-speech`,
        {
          text,
          language,
          speed,
          pitch,
          emotion
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob',
          timeout: 30000 // 30 second timeout
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      
      console.log('🎵 [TTS] Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type,
        responseSize: response.data.size || response.data.length
      });
      
      // Cache the result
      if (useCache) {
        this.audioCache.set(cacheKey, audioBlob);
        
        // Limit cache size to prevent memory issues
        if (this.audioCache.size > 50) {
          const firstKey = this.audioCache.keys().next().value;
          this.audioCache.delete(firstKey);
        }
      }

      console.log('✅ [TTS] Speech generated successfully');
      return audioBlob;

    } catch (error) {
      console.error('❌ [TTS] Error generating speech:', error);
      console.error('❌ [TTS] Error response:', error.response);
      console.error('❌ [TTS] Error status:', error.response?.status);
      console.error('❌ [TTS] Error data:', error.response?.data);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Invalid request');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required - please login again');
      } else if (error.response?.status === 404) {
        throw new Error('TTS service not found - backend may not be running');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - TTS service may be busy');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error - cannot connect to TTS service');
      } else {
        throw new Error(`Failed to generate speech: ${error.message}`);
      }
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate speech with voice cloning
   * @param {string} text - Text to convert to speech
   * @param {File} referenceAudio - Reference audio file for voice cloning
   * @param {Object} options - TTS options
   * @returns {Promise<Blob>} - Audio blob
   */
  async generateClonedSpeech(text, referenceAudio, options = {}) {
    const {
      language = 'en',
      speed = 1.0,
      pitch = 1.0
    } = options;

    if (this.isGenerating) {
      throw new Error('TTS generation already in progress');
    }

    this.isGenerating = true;

    try {
      console.log('🎤 [TTS] Generating cloned speech for:', text.substring(0, 50) + '...');

      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);
      formData.append('speed', speed.toString());
      formData.append('pitch', pitch.toString());
      formData.append('referenceAudio', referenceAudio);

      const response = await axios.post(
        `${API_BASE_URL}/tts/generate-speech-cloned`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          },
          responseType: 'blob',
          timeout: 60000 // 60 second timeout for voice cloning
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      
      console.log('✅ [TTS] Cloned speech generated successfully');
      return audioBlob;

    } catch (error) {
      console.error('❌ [TTS] Error generating cloned speech:', error);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Invalid request');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - TTS service may be busy');
      } else {
        throw new Error('Failed to generate cloned speech');
      }
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Play audio blob
   * @param {Blob} audioBlob - Audio blob to play
   * @returns {Promise<void>}
   */
  async playAudio(audioBlob) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎵 [TTS] Playing audio blob, size:', audioBlob.size, 'type:', audioBlob.type);
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Set audio properties
        audio.preload = 'auto';
        audio.volume = 1.0;
        
        audio.onloadstart = () => {
          console.log('🎵 [TTS] Audio loading started');
        };
        
        audio.oncanplay = () => {
          console.log('🎵 [TTS] Audio can play');
        };
        
        audio.onplay = () => {
          console.log('🎵 [TTS] Audio started playing');
        };
        
        audio.onended = () => {
          console.log('🎵 [TTS] Audio finished playing');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('🎵 [TTS] Audio error:', error);
          console.error('🎵 [TTS] Audio error details:', {
            error: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src
          });
          URL.revokeObjectURL(audioUrl);
          reject(new Error(`Failed to play audio: ${audio.error?.message || 'Unknown error'}`));
        };
        
        audio.onabort = () => {
          console.log('🎵 [TTS] Audio playback aborted');
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback aborted'));
        };
        
        // Try to play the audio
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('🎵 [TTS] Play promise rejected:', error);
            URL.revokeObjectURL(audioUrl);
            reject(new Error(`Audio play failed: ${error.message}`));
          });
        }
        
      } catch (error) {
        console.error('🎵 [TTS] Error creating audio:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate and play speech
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async speak(text, options = {}) {
    try {
      // Try to use a real TTS service first
      console.log('🎤 [TTS] Attempting to use real TTS service...');
      await this._useRealTTSService(text, options);
    } catch (error) {
      console.error('❌ [TTS] Real TTS service failed:', error);
      
      // Fallback to browser speechSynthesis (which works well)
      console.log('🔄 [TTS] Falling back to browser speechSynthesis...');
      await this._fallbackToBrowserTTS(text, options);
    }
  }

  /**
   * Use a real TTS service (placeholder for now)
   * @param {string} text - Text to speak
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async _useRealTTSService(text, options = {}) {
    // For now, we'll use browser TTS but with better voice selection
    // In a real implementation, you would call an external TTS API like:
    // - Google Cloud Text-to-Speech
    // - Amazon Polly
    // - Azure Cognitive Services
    // - ElevenLabs
    
    console.log('🎤 [TTS] Using enhanced browser TTS with better voice selection...');
    await this._enhancedBrowserTTS(text, options);
  }

  /**
   * Enhanced browser TTS with better voice selection
   * @param {string} text - Text to speak
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async _enhancedBrowserTTS(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      try {
        window.speechSynthesis.cancel();
        
        // Clean and validate text
        const cleanText = this._cleanTextForTTS(text);
        if (!cleanText || cleanText.length === 0) {
          reject(new Error('No valid text to speak'));
          return;
        }
        
        // Check text length (some browsers have limits)
        if (cleanText.length > 1000) {
          console.warn('⚠️ [TTS] Text is very long, truncating...');
          const truncatedText = cleanText.substring(0, 1000) + '...';
          console.log('⚠️ [TTS] Truncated text:', truncatedText);
        }
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = options.speed || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = 0.8;
        
        // Get all available voices
        let voices = window.speechSynthesis.getVoices();
        console.log('🎤 [TTS] Available voices:', voices.length);
        
        // If no voices loaded, wait a bit and try again
        if (voices.length === 0) {
          console.log('🎤 [TTS] No voices loaded, waiting...');
          setTimeout(() => {
            voices = window.speechSynthesis.getVoices();
            console.log('🎤 [TTS] Voices after wait:', voices.length);
            this._selectAndSpeak(utterance, voices, resolve, reject);
          }, 100);
          return;
        }
        
        this._selectAndSpeak(utterance, voices, resolve, reject);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Select voice and speak
   * @param {SpeechSynthesisUtterance} utterance - The utterance to speak
   * @param {Array} voices - Available voices
   * @param {Function} resolve - Resolve function
   * @param {Function} reject - Reject function
   */
  _selectAndSpeak(utterance, voices, resolve, reject) {
    try {
      // Try to find the best voice for AI
      let selectedVoice = null;
      
      // Priority order for voice selection
      const voicePreferences = [
        'Microsoft Zira Desktop', // Windows
        'Microsoft Hazel Desktop', // Windows
        'Google UK English Female', // Chrome
        'Google US English Female', // Chrome
        'Samantha', // macOS
        'Karen', // macOS
        'female', // Generic
        'zira', // Partial match
        'hazel', // Partial match
        'susan' // Partial match
      ];
      
      // Try to find a preferred voice
      for (const preference of voicePreferences) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(preference.toLowerCase())
        );
        if (selectedVoice) {
          console.log('🎤 [TTS] Selected voice:', selectedVoice.name);
          break;
        }
      }
      
      // If no preferred voice found, use the first available voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
        console.log('🎤 [TTS] Using default voice:', selectedVoice.name);
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => {
        console.log('🎤 [TTS] Enhanced browser TTS started');
      };
      
      utterance.onend = () => {
        console.log('✅ [TTS] Enhanced browser TTS finished');
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('❌ [TTS] Enhanced browser TTS error:', error);
        console.error('❌ [TTS] Error details:', {
          type: error.type,
          error: error.error,
          charIndex: error.charIndex,
          utterance: error.utterance
        });
        reject(new Error(`Enhanced browser TTS failed: ${error.error || 'Unknown error'}`));
      };
      
      console.log('🗣️ [TTS] Using enhanced browser TTS');
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Fallback to browser speechSynthesis
   * @param {string} text - Text to speak
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async _fallbackToBrowserTTS(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      try {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.speed || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = 0.8;
        
        // Try to use a female voice for AI
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('susan')
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        utterance.onend = () => {
          console.log('✅ [TTS] Browser TTS fallback finished');
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error('❌ [TTS] Browser TTS fallback error:', error);
          console.error('❌ [TTS] Fallback error details:', {
            type: error.type,
            error: error.error,
            charIndex: error.charIndex,
            utterance: error.utterance
          });
          reject(new Error(`Browser TTS failed: ${error.error || 'Unknown error'}`));
        };
        
        console.log('🗣️ [TTS] Using browser TTS fallback');
        window.speechSynthesis.speak(utterance);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate and play audio directly using Web Audio API
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async _playGeneratedAudio(text, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎵 [TTS] Generating audio directly in browser for:', text.substring(0, 50) + '...');
        
        // Check if Web Audio API is supported
        if (!window.AudioContext && !window.webkitAudioContext) {
          throw new Error('Web Audio API not supported');
        }
        
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume audio context if it's suspended (required for user interaction)
        if (audioContext.state === 'suspended') {
          console.log('🎵 [TTS] Audio context suspended, resuming...');
          audioContext.resume().then(() => {
            console.log('🎵 [TTS] Audio context resumed');
          });
        }
        
        const duration = this._estimateDuration(text);
        const sampleRate = audioContext.sampleRate;
        const samples = Math.floor(duration * sampleRate);
        
        console.log('🎵 [TTS] Audio context info:', {
          state: audioContext.state,
          sampleRate: sampleRate,
          duration: duration,
          samples: samples
        });
        
        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(1, samples, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Generate audio data (simple tone as placeholder)
        for (let i = 0; i < samples; i++) {
          const frequency = 440 + Math.sin(i * 0.001) * 100; // Varying frequency
          const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
          channelData[i] = sample;
        }
        
        // Create and play audio
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          console.log('🎵 [TTS] Generated audio finished playing');
          resolve();
        };
        
        source.start();
        console.log('🎵 [TTS] Generated audio started playing');
        
      } catch (error) {
        console.error('🎵 [TTS] Error generating audio:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate and play cloned speech
   * @param {string} text - Text to convert to speech
   * @param {File} referenceAudio - Reference audio file
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async speakCloned(text, referenceAudio, options = {}) {
    try {
      const audioBlob = await this.generateClonedSpeech(text, referenceAudio, options);
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('❌ [TTS] Error in speakCloned method:', error);
      throw error;
    }
  }

  /**
   * Get supported languages
   * @returns {Promise<Array>} - Array of supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tts/languages`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('❌ [TTS] Error getting supported languages:', error);
      throw new Error('Failed to get supported languages');
    }
  }

  /**
   * Check TTS service health
   * @returns {Promise<boolean>} - Service health status
   */
  async checkHealth() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tts/health`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      return response.data.success;
    } catch (error) {
      console.error('❌ [TTS] Health check failed:', error);
      return false;
    }
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
    console.log('🗑️ [TTS] Audio cache cleared');
  }

  /**
   * Get cache size
   * @returns {number} - Number of cached audio files
   */
  getCacheSize() {
    return this.audioCache.size;
  }

  /**
   * Clean text for TTS
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  _cleanTextForTTS(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    // Remove or replace problematic characters
    let cleanText = text
      .replace(/[^\w\s.,!?;:'"()-]/g, ' ') // Remove special characters except basic punctuation
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    // Ensure text is not empty
    if (!cleanText) {
      cleanText = 'Hello, this is a test message.';
    }
    
    console.log('🧹 [TTS] Cleaned text:', cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : ''));
    return cleanText;
  }

  /**
   * Estimate duration of text
   * @param {string} text - Text to estimate duration for
   * @returns {number} - Duration in seconds
   */
  _estimateDuration(text) {
    // Rough estimation: average speaking rate is about 150 words per minute
    const wordsPerMinute = 150;
    const wordCount = text.split(' ').length;
    return Math.max(1, Math.ceil((wordCount / wordsPerMinute) * 60)); // minimum 1 second
  }
}

// Create singleton instance
const ttsService = new TTSService();

export default ttsService;
