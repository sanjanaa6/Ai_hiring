import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook for screen recording with automatic upload to backend
 * @param {Object} options - Configuration options
 * @param {string} options.interviewId - Interview ID
 * @param {string} options.candidateName - Candidate name
 * @param {string} options.candidateEmail - Candidate email
 * @param {string} options.recruiterId - Recruiter ID (optional)
 * @param {string} options.jobId - Job ID (optional)
 * @param {Function} options.onUploadSuccess - Callback on successful upload
 * @param {Function} options.onUploadError - Callback on upload error
 */
const useScreenRecording = (options = {}) => {
  const {
    interviewId,
    candidateName,
    candidateEmail,
    recruiterId,
    jobId,
    onUploadSuccess,
    onUploadError
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  // Start recording timer
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  // Stop recording timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Format time for display (HH:MM:SS)
  const formatTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Start screen recording
   * @param {Object} config - Recording configuration
   * @param {boolean} config.audio - Include system audio (default: true)
   * @param {boolean} config.video - Include video (default: true)
   */
  const startRecording = useCallback(async (config = {}) => {
    try {
      console.log('🎬 [RECORDING] Starting screen recording...');
      setError(null);
      chunksRef.current = [];

      const { audio = true, video = true } = config;

      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: video ? {
          cursor: 'always',
          displaySurface: 'monitor'
        } : false,
        audio: audio
      });

      streamRef.current = displayStream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      console.log('📹 [RECORDING] Using MIME type:', mimeType);

      mediaRecorderRef.current = new MediaRecorder(displayStream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      // Handle data available
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📦 [RECORDING] Chunk received:', event.data.size, 'bytes');
        }
      };

      // Handle recording stop
      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 [RECORDING] Recording stopped');
        endTimeRef.current = new Date();
        
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordingBlob(blob);
        console.log('💾 [RECORDING] Recording blob created:', blob.size, 'bytes');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      // Handle errors
      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ [RECORDING] MediaRecorder error:', event.error);
        setError(event.error.message);
      };

      // Detect when user stops sharing
      displayStream.getVideoTracks()[0].onended = () => {
        console.log('🛑 [RECORDING] User stopped sharing');
        stopRecording();
      };

      // Start recording
      startTimeRef.current = new Date();
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();

      console.log('✅ [RECORDING] Recording started successfully');
    } catch (err) {
      console.error('❌ [RECORDING] Failed to start recording:', err);
      setError(err.message);
      
      // Handle specific errors
      if (err.name === 'NotAllowedError') {
        setError('Screen recording permission denied. Please allow screen sharing.');
      } else if (err.name === 'NotFoundError') {
        setError('No screen available to record.');
      } else {
        setError('Failed to start recording: ' + err.message);
      }
    }
  }, [startTimer]);

  /**
   * Stop screen recording
   */
  const stopRecording = useCallback(() => {
    console.log('🛑 [RECORDING] Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
  }, [stopTimer]);

  /**
   * Pause screen recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      console.log('⏸️ [RECORDING] Recording paused');
    }
  }, [stopTimer]);

  /**
   * Resume screen recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
      console.log('▶️ [RECORDING] Recording resumed');
    }
  }, [startTimer]);

  /**
   * Upload recording to backend
   */
  const uploadRecording = useCallback(async (blob = recordingBlob) => {
    if (!blob) {
      console.error('❌ [UPLOAD] No recording blob available');
      setError('No recording available to upload');
      return;
    }

    if (!interviewId || !candidateName || !candidateEmail) {
      console.error('❌ [UPLOAD] Missing required fields');
      setError('Missing required interview information');
      return;
    }

    try {
      console.log('📤 [UPLOAD] Starting upload...', {
        size: blob.size,
        type: blob.type,
        interviewId
      });

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('recording', blob, `interview_${interviewId}_${Date.now()}.webm`);
      formData.append('interviewId', interviewId);
      formData.append('candidateName', candidateName);
      formData.append('candidateEmail', candidateEmail);
      formData.append('duration', recordingTime);
      formData.append('recordingStartedAt', startTimeRef.current?.toISOString() || new Date().toISOString());
      formData.append('recordingEndedAt', endTimeRef.current?.toISOString() || new Date().toISOString());
      formData.append('recordingType', 'screen');
      
      if (recruiterId) formData.append('recruiterId', recruiterId);
      if (jobId) formData.append('jobId', jobId);

      // Add metadata
      const metadata = {
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        browserInfo: navigator.userAgent,
        deviceInfo: navigator.platform
      };
      formData.append('metadata', JSON.stringify(metadata));

      // Upload to backend
      const response = await axios.post(
        '/api/interview-recordings/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            console.log('📊 [UPLOAD] Progress:', percentCompleted + '%');
          }
        }
      );

      console.log('✅ [UPLOAD] Upload successful:', response.data);

      setIsUploading(false);
      setUploadProgress(100);

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      return response.data;
    } catch (err) {
      console.error('❌ [UPLOAD] Upload failed:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);

      // Call error callback
      if (onUploadError) {
        onUploadError(err);
      }

      throw err;
    }
  }, [recordingBlob, interviewId, candidateName, candidateEmail, recruiterId, jobId, recordingTime, onUploadSuccess, onUploadError]);

  /**
   * Stop recording and upload automatically
   */
  const stopAndUpload = useCallback(async () => {
    console.log('🎬 [RECORDING] Stopping and uploading...');
    
    return new Promise((resolve, reject) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        // Set up one-time handler for when recording stops
        const handleStop = async () => {
          try {
            stopTimer();
            setIsRecording(false);
            setIsPaused(false);

            // Wait a bit for the blob to be created
            await new Promise(resolve => setTimeout(resolve, 500));

            // Upload the recording
            const blob = new Blob(chunksRef.current, { 
              type: mediaRecorderRef.current.mimeType 
            });
            
            const result = await uploadRecording(blob);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorderRef.current.addEventListener('stop', handleStop, { once: true });
        mediaRecorderRef.current.stop();
      } else {
        reject(new Error('No active recording'));
      }
    });
  }, [stopTimer, uploadRecording]);

  /**
   * Download recording locally (for testing)
   */
  const downloadRecording = useCallback((blob = recordingBlob) => {
    if (!blob) {
      console.error('❌ [DOWNLOAD] No recording available');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview_${interviewId}_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 [DOWNLOAD] Recording downloaded');
  }, [recordingBlob, interviewId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopTimer]);

  return {
    // State
    isRecording,
    isPaused,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    isUploading,
    uploadProgress,
    error,
    recordingBlob,
    hasRecording: !!recordingBlob,

    // Methods
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    stopAndUpload,
    downloadRecording,
    clearError: () => setError(null)
  };
};

export default useScreenRecording;
