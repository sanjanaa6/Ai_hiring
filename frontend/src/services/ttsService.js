import axios from 'axios';

// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith('/api') 
      ? process.env.REACT_APP_API_URL 
      : `${process.env.REACT_APP_API_URL}/api`;
  }
  
  // For production deployment
  if (process.env.NODE_ENV === 'production') {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname.includes('eval8.ai')) {
        return 'https://aihire.eval8.xyz/api';  // Backend domain
      }
      return `${protocol}//${hostname}:5000/api`;
    }
    return 'https://aihire.eval8.xyz/api';  // Backend domain
  }
  
  // For development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

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
      voice,
      ssmlGender,
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
      console.log('🎤 [TTS] Request payload:', { text, language, speed, pitch, emotion, voice, ssmlGender });

      const response = await axios.post(
        `${API_BASE_URL}/tts/generate-speech`,
        {
          text,
          language,
          speed,
          pitch,
          emotion,
          voice,
          ssmlGender
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

      const contentType = response.headers?.['content-type'] || 'audio/wav';
      console.log('🎤 [TTS] Response Content-Type:', contentType);
      const audioBlob = new Blob([response.data], { type: contentType });
      
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
   * Generate and play speech using Google TTS only
   * @param {string} text - Text to convert to speech
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async speak(text, options = {}) {
    try {
      // Use Google TTS service only
      console.log('🎤 [TTS] Using Google TTS service...');
      await this._useGoogleTTSService(text, options);
    } catch (error) {
      console.error('❌ [TTS] Google TTS service failed:', error);
      throw error; // Don't fallback to browser TTS, just throw the error
    }
  }

  /**
   * Use Google TTS service
   * @param {string} text - Text to speak
   * @param {Object} options - TTS options
   * @returns {Promise<void>}
   */
  async _useGoogleTTSService(text, options = {}) {
    // Call backend TTS endpoint (Google Cloud TTS behind the scenes)
    const audioBlob = await this.generateSpeech(text, options);
    await this.playAudio(audioBlob);
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
