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

class STTService {
  constructor() {
    this.apiUrl = getApiBaseUrl();
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognitionTimeout = null;
  }

  /**
   * Check if Google STT service is available
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.apiUrl}/stt/health`);
      return response.data;
    } catch (error) {
      console.error('❌ [STT] Health check failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get supported languages
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getSupportedLanguages() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${this.apiUrl}/stt/languages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ [STT] Failed to get languages:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Start voice recording for STT
   * @param {Object} options - Recording options
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async startRecording(options = {}) {
    try {
      if (this.isRecording) {
        console.log('⚠️ [STT] Already recording, stopping previous recording');
        await this.stopRecording();
      }

      console.log('🎤 [STT] Starting voice recording...');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: options.sampleRate || 16000
        }
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this._getSupportedMimeType(),
        audioBitsPerSecond: 128000
      });

      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        console.log('🛑 [STT] Recording stopped');
        this.isRecording = false;
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log('✅ [STT] Recording started successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ [STT] Failed to start recording:', error);
      return {
        success: false,
        error: error.message || 'Failed to start recording'
      };
    }
  }

  /**
   * Stop voice recording and transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<{success: boolean, transcript?: string, confidence?: number, error?: string}>}
   */
  async stopRecording(options = {}) {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        console.log('⚠️ [STT] No active recording to stop');
        return {
          success: false,
          error: 'No active recording'
        };
      }

      console.log('🛑 [STT] Stopping recording and transcribing...');

      // Stop recording
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Wait for recording to stop
      await new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          resolve();
        };
      });

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { 
        type: this.mediaRecorder.mimeType 
      });

      console.log('🎵 [STT] Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Transcribe the audio
      const result = await this.transcribeAudioBlob(audioBlob, options);

      // Clear chunks
      this.audioChunks = [];

      return result;

    } catch (error) {
      console.error('❌ [STT] Failed to stop recording:', error);
      return {
        success: false,
        error: error.message || 'Failed to stop recording'
      };
    }
  }

  /**
   * Transcribe audio blob using Google STT
   * @param {Blob} audioBlob - Audio data blob
   * @param {Object} options - Transcription options
   * @returns {Promise<{success: boolean, transcript?: string, confidence?: number, error?: string}>}
   */
  async transcribeAudioBlob(audioBlob, options = {}) {
    try {
      console.log('🎤 [STT] Transcribing audio blob...');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Convert blob to base64
      const base64Audio = await this._blobToBase64(audioBlob);

      const requestData = {
        audioData: base64Audio,
        language: options.language || 'en-US',
        encoding: this._getAudioEncoding(audioBlob.type),
        sampleRate: options.sampleRate || 16000,
        enablePunctuation: options.enablePunctuation !== false,
        enableWordTimeOffsets: options.enableWordTimeOffsets || false,
        enableWordConfidence: options.enableWordConfidence || false,
        model: options.model || 'default',
        useEnhanced: options.useEnhanced || false,
        maxAlternatives: options.maxAlternatives || 1,
        profanityFilter: options.profanityFilter || false,
        enableSpeakerDiarization: options.enableSpeakerDiarization || false,
        diarizationSpeakerCount: options.diarizationSpeakerCount || 2
      };

      console.log('🔧 [STT] Transcription options:', {
        language: requestData.language,
        encoding: requestData.encoding,
        sampleRate: requestData.sampleRate,
        enablePunctuation: requestData.enablePunctuation
      });

      const response = await axios.post(`${this.apiUrl}/stt/transcribe-buffer`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ [STT] Transcription successful');
        console.log('📝 [STT] Transcript:', response.data.data.transcript);
        console.log('🎯 [STT] Confidence:', response.data.data.confidence);
        
        return {
          success: true,
          transcript: response.data.data.transcript,
          confidence: response.data.data.confidence,
          languageCode: response.data.data.languageCode
        };
      } else {
        throw new Error(response.data.error || 'Transcription failed');
      }

    } catch (error) {
      console.error('❌ [STT] Transcription failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Transcription failed'
      };
    }
  }

  /**
   * Transcribe audio file using Google STT
   * @param {File} audioFile - Audio file
   * @param {Object} options - Transcription options
   * @returns {Promise<{success: boolean, transcript?: string, confidence?: number, error?: string}>}
   */
  async transcribeAudioFile(audioFile, options = {}) {
    try {
      console.log('🎤 [STT] Transcribing audio file...');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', options.language || 'en-US');
      formData.append('sampleRate', options.sampleRate || 16000);
      formData.append('enablePunctuation', options.enablePunctuation !== false);
      formData.append('enableWordTimeOffsets', options.enableWordTimeOffsets || false);
      formData.append('enableWordConfidence', options.enableWordConfidence || false);
      formData.append('model', options.model || 'default');
      formData.append('useEnhanced', options.useEnhanced || false);
      formData.append('maxAlternatives', options.maxAlternatives || 1);
      formData.append('profanityFilter', options.profanityFilter || false);
      formData.append('enableSpeakerDiarization', options.enableSpeakerDiarization || false);
      formData.append('diarizationSpeakerCount', options.diarizationSpeakerCount || 2);

      console.log('🔧 [STT] File transcription options:', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type,
        language: options.language || 'en-US'
      });

      const response = await axios.post(`${this.apiUrl}/stt/transcribe-file`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        console.log('✅ [STT] File transcription successful');
        console.log('📝 [STT] Transcript:', response.data.data.transcript);
        console.log('🎯 [STT] Confidence:', response.data.data.confidence);
        
        return {
          success: true,
          transcript: response.data.data.transcript,
          confidence: response.data.data.confidence,
          languageCode: response.data.data.languageCode
        };
      } else {
        throw new Error(response.data.error || 'File transcription failed');
      }

    } catch (error) {
      console.error('❌ [STT] File transcription failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'File transcription failed'
      };
    }
  }

  /**
   * Test STT service with a simple audio file
   * @param {File} audioFile - Test audio file
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async testSTT(audioFile) {
    try {
      console.log('🧪 [STT] Testing STT service...');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('audio', audioFile);

      const response = await axios.post(`${this.apiUrl}/stt/test`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;

    } catch (error) {
      console.error('❌ [STT] Test failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'STT test failed'
      };
    }
  }

  /**
   * Get supported MIME type for MediaRecorder
   * @returns {string} Supported MIME type
   */
  _getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Get audio encoding for Google STT
   * @param {string} mimeType - MIME type
   * @returns {string} Google STT encoding
   */
  _getAudioEncoding(mimeType) {
    if (mimeType.includes('webm')) {
      return 'WEBM_OPUS';
    } else if (mimeType.includes('mp4')) {
      return 'MP3';
    } else if (mimeType.includes('ogg')) {
      return 'OGG_OPUS';
    } else if (mimeType.includes('wav')) {
      return 'LINEAR16';
    } else {
      return 'WEBM_OPUS'; // Default
    }
  }

  /**
   * Convert blob to base64
   * @param {Blob} blob - Blob to convert
   * @returns {Promise<string>} Base64 string
   */
  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:audio/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if recording is active
   * @returns {boolean} Recording status
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }

  /**
   * Force stop recording (emergency stop)
   */
  forceStopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
        this.isRecording = false;
        this.audioChunks = [];
        console.log('🛑 [STT] Recording force stopped');
      } catch (error) {
        console.error('❌ [STT] Error force stopping recording:', error);
      }
    }
  }
}

export default new STTService();
