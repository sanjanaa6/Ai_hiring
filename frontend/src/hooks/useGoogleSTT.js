import { useState, useRef, useCallback, useEffect } from 'react';
import sttService from '../services/sttService';

export const useGoogleSTT = (options = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscription, setInterimTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);
  
  const recordingIntervalRef = useRef(null);
  const lastTranscriptionRef = useRef('');

  // Default options
  const {
    language = 'en-US',
    enablePunctuation = true,
    model = 'default',
    useEnhanced = false,
    autoTranscribeInterval = 3000, // Transcribe every 3 seconds
    continuousMode = true,
    onTranscription = null,
    onError = null,
    onRecordingStart = null,
    onRecordingStop = null
  } = options;

  /**
   * Start recording with Google STT
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [Google STT] Starting recording...');
      setError(null);

      // Check if already recording
      if (isRecording) {
        console.log('⚠️ [Google STT] Already recording, skipping start');
        return;
      }

      // Start recording
      const result = await sttService.startRecording({
        sampleRate: 16000,
        language
      });

      if (result.success) {
        setIsRecording(true);
        setTranscription('');
        setInterimTranscription('');
        setConfidence(0);
        
        console.log('✅ [Google STT] Recording started successfully');
        
        if (onRecordingStart) {
          onRecordingStart();
        }

        // Set up continuous transcription if enabled
        if (continuousMode && autoTranscribeInterval > 0) {
          recordingIntervalRef.current = setInterval(async () => {
            await transcribeCurrentRecording();
          }, autoTranscribeInterval);
        }
      } else {
        throw new Error(result.error || 'Failed to start recording');
      }

    } catch (error) {
      console.error('❌ [Google STT] Failed to start recording:', error);
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
    }
  }, [isRecording, language, continuousMode, autoTranscribeInterval, onRecordingStart, onError]);

  /**
   * Stop recording and get final transcription
   */
  const stopRecording = useCallback(async () => {
    try {
      console.log('🛑 [Google STT] Stopping recording...');
      
      if (!isRecording) {
        console.log('⚠️ [Google STT] No active recording to stop');
        return;
      }

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsTranscribing(true);
      setError(null);

      // Stop recording and transcribe
      const result = await sttService.stopRecording({
        language,
        enablePunctuation,
        model,
        useEnhanced
      });

      if (result.success) {
        const finalTranscript = result.transcript || '';
        const finalConfidence = result.confidence || 0;
        
        setTranscription(prev => prev + finalTranscript);
        setInterimTranscription('');
        setConfidence(finalConfidence);
        
        console.log('✅ [Google STT] Recording stopped and transcribed');
        console.log('📝 [Google STT] Final transcript:', finalTranscript);
        console.log('🎯 [Google STT] Confidence:', finalConfidence);
        
        if (onTranscription) {
          onTranscription(finalTranscript, finalConfidence);
        }
      } else {
        throw new Error(result.error || 'Transcription failed');
      }

    } catch (error) {
      console.error('❌ [Google STT] Failed to stop recording:', error);
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsRecording(false);
      setIsTranscribing(false);
      
      if (onRecordingStop) {
        onRecordingStop();
      }
    }
  }, [isRecording, language, enablePunctuation, model, useEnhanced, onTranscription, onError, onRecordingStop]);

  /**
   * Transcribe current recording without stopping
   */
  const transcribeCurrentRecording = useCallback(async () => {
    if (!isRecording || isTranscribing) {
      return;
    }

    try {
      console.log('🔄 [Google STT] Transcribing current recording...');
      setIsTranscribing(true);

      // This would require a different approach since we can't get partial audio
      // For now, we'll just log that transcription is happening
      console.log('📝 [Google STT] Continuous transcription in progress...');
      
    } catch (error) {
      console.error('❌ [Google STT] Continuous transcription failed:', error);
      setError(error.message);
    } finally {
      setIsTranscribing(false);
    }
  }, [isRecording, isTranscribing]);

  /**
   * Transcribe audio file
   */
  const transcribeFile = useCallback(async (file) => {
    try {
      console.log('📁 [Google STT] Transcribing audio file:', file.name);
      setError(null);
      setIsTranscribing(true);

      const result = await sttService.transcribeAudioFile(file, {
        language,
        enablePunctuation,
        model,
        useEnhanced
      });

      if (result.success) {
        const transcript = result.transcript || '';
        const transcriptConfidence = result.confidence || 0;
        
        setTranscription(transcript);
        setConfidence(transcriptConfidence);
        
        console.log('✅ [Google STT] File transcription successful');
        console.log('📝 [Google STT] Transcript:', transcript);
        console.log('🎯 [Google STT] Confidence:', transcriptConfidence);
        
        if (onTranscription) {
          onTranscription(transcript, transcriptConfidence);
        }
        
        return { success: true, transcript, confidence: transcriptConfidence };
      } else {
        throw new Error(result.error || 'File transcription failed');
      }

    } catch (error) {
      console.error('❌ [Google STT] File transcription failed:', error);
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
      
      return { success: false, error: error.message };
    } finally {
      setIsTranscribing(false);
    }
  }, [language, enablePunctuation, model, useEnhanced, onTranscription, onError]);

  /**
   * Clear transcription
   */
  const clearTranscription = useCallback(() => {
    setTranscription('');
    setInterimTranscription('');
    setError(null);
    setConfidence(0);
    lastTranscriptionRef.current = '';
  }, []);

  /**
   * Force stop recording (emergency stop)
   */
  const forceStop = useCallback(() => {
    console.log('🛑 [Google STT] Force stopping recording...');
    
    // Clear interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // Force stop the service
    sttService.forceStopRecording();
    
    setIsRecording(false);
    setIsTranscribing(false);
    
    if (onRecordingStop) {
      onRecordingStop();
    }
  }, [onRecordingStop]);

  /**
   * Check STT service health
   */
  const checkHealth = useCallback(async () => {
    try {
      const result = await sttService.checkHealth();
      return result;
    } catch (error) {
      console.error('❌ [Google STT] Health check failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Get supported languages
   */
  const getSupportedLanguages = useCallback(async () => {
    try {
      const result = await sttService.getSupportedLanguages();
      return result;
    } catch (error) {
      console.error('❌ [Google STT] Failed to get languages:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (isRecording) {
        forceStop();
      }
    };
  }, [isRecording, forceStop]);

  return {
    // State
    isRecording,
    transcription,
    interimTranscription,
    isTranscribing,
    error,
    confidence,
    
    // Actions
    startRecording,
    stopRecording,
    transcribeFile,
    clearTranscription,
    forceStop,
    
    // Utilities
    checkHealth,
    getSupportedLanguages,
    
    // Service access
    sttService
  };
};

export default useGoogleSTT;
