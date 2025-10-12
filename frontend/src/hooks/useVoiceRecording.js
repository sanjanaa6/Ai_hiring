import { useState, useRef, useCallback } from 'react';
import useGoogleSTT from './useGoogleSTT';

export const useVoiceRecording = (options = {}) => {
  const { useGoogleSTT: useGoogle = false, ...sttOptions } = options;
  
  // Always call all hooks at the top level
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscription, setInterimTranscription] = useState('');
  const recognitionRef = useRef(null);

  // Use Google STT if enabled
  const googleSTT = useGoogleSTT({
    ...sttOptions,
    continuousMode: true,
    autoTranscribeInterval: 2000 // Transcribe every 2 seconds
  });

  // Define all callbacks at the top level
  const startRecording = useCallback(async () => {
    try {
      console.log('🎙️ Starting recording...');
      
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsRecording(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcription with final results only
        if (finalTranscript) {
          setTranscription(prev => prev + finalTranscript);
        }
        
        // Update interim transcription for live feedback
        setInterimTranscription(interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsRecording(false);
        setInterimTranscription(''); // Clear interim transcription when recording ends
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setIsRecording(false);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    try {
      if (recognitionRef.current) {
        console.log('🛑 Stopping recording...');
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription('');
    setInterimTranscription('');
  }, []);

  // If Google STT is enabled, return Google STT hook
  if (useGoogle) {
    return {
      isRecording: googleSTT.isRecording,
      transcription: googleSTT.transcription,
      interimTranscription: googleSTT.interimTranscription,
      startRecording: googleSTT.startRecording,
      stopRecording: googleSTT.stopRecording,
      clearTranscription: googleSTT.clearTranscription,
      error: googleSTT.error,
      confidence: googleSTT.confidence,
      isTranscribing: googleSTT.isTranscribing,
      forceStop: googleSTT.forceStop,
      checkHealth: googleSTT.checkHealth,
      getSupportedLanguages: googleSTT.getSupportedLanguages
    };
  }

  // Return Web Speech API implementation
  return {
    isRecording,
    transcription,
    interimTranscription,
    startRecording,
    stopRecording,
    clearTranscription
  };
};
