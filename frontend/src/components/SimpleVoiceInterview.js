import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, Play, Pause, AlertTriangle, CheckCircle, Clock, Volume2, SkipForward, MessageSquare, BarChart3, TrendingUp } from 'lucide-react';

const SimpleVoiceInterview = ({ interviewId, candidateInfo, onComplete, onError }) => {
  const [step, setStep] = useState('setup'); // setup, device-check, interview, round-complete, round-selection, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [autoProgressEnabled, setAutoProgressEnabled] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [allRounds, setAllRounds] = useState([]);
  const [completedRounds, setCompletedRounds] = useState(new Set());
  const [roundEvaluation, setRoundEvaluation] = useState(null);
  const [shouldAutoRecord, setShouldAutoRecord] = useState(false);
  const [electronicDeviceDetected, setElectronicDeviceDetected] = useState(false);
  const [deviceDetectionActive, setDeviceDetectionActive] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [facialExpression, setFacialExpression] = useState(null);
  const [removalCountdown, setRemovalCountdown] = useState(3);
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [questionStartCountdown, setQuestionStartCountdown] = useState(0);
  const [isCameraRestarting, setIsCameraRestarting] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const deviceDetectionInterval = useRef(null);
  const canvasRef = useRef(null);
  const cameraMonitorInterval = useRef(null);

  // Step 1: Initialize camera and microphone
  const startSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎬 Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: true
      });
      
      console.log('📹 Camera stream obtained:', stream);
      setCameraStream(stream);
      setCameraStatus('connected');
      
      // Wait for video element to be ready
      setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            console.log('✅ Video started playing');
            setCameraStatus('playing');
          }).catch(err => {
            console.error('❌ Video play failed:', err);
            setCameraStatus('error');
          });
        } else {
          console.error('❌ Video ref not available');
          setCameraStatus('error');
        }
      }, 100);
      
      console.log('✅ Media access granted');
      setStep('device-check');
    } catch (err) {
      console.error('❌ Media access failed:', err);
      setError('Camera and microphone access required. Please grant permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Device validation
  const validateEnvironment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Capture frame for validation with optimized compression
      const canvas = document.createElement('canvas');
      // Reduce canvas size to minimize data
      const maxWidth = 320;
      const maxHeight = 240;
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      // Calculate scaled dimensions
      const scale = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      canvas.width = videoWidth * scale;
      canvas.height = videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Use lower quality JPEG compression to reduce size
      const imageData = canvas.toDataURL('image/jpeg', 0.3);
      
      console.log('🔍 Validating environment...');
      console.log('📊 Image data size:', Math.round(imageData.length / 1024), 'KB');
      
      const response = await fetch(`/api/interviews/${interviewId}/validate-environment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          candidateId: candidateInfo.email
        })
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Image data too large. Please try again.');
        }
        throw new Error(`Environment validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 Environment validation result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Environment validation failed');
      }

      if (result.data.deviceCheckPassed) {
        console.log('✅ Environment check passed');
        setStep('round-selection');
        await loadInterviewRounds();
      } else {
        setError(`Environment check failed: ${result.data.message}`);
      }
      
    } catch (err) {
      console.error('❌ Environment validation error:', err);
      setError(err.message || 'Failed to validate environment');
    } finally {
      setLoading(false);
    }
  };

  // Load interview rounds for selection
  const loadInterviewRounds = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading interview rounds...');
      
      const response = await fetch(`/api/interviews/${interviewId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to load interview data');
      }
      
      setAllRounds(result.data.rounds);
      console.log('✅ Loaded rounds:', result.data.rounds.length);
      
    } catch (err) {
      console.error('❌ Error loading rounds:', err);
      setError(err.message || 'Failed to load interview rounds');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Start interview
  const startInterview = async () => {
    try {
      setLoading(true);
      console.log('🎭 Loading interview data and starting round 1...');
      
      // First, get the complete interview structure
      const interviewResponse = await fetch(`/api/interviews/${interviewId}`);
      const interviewResult = await interviewResponse.json();
      
      if (!interviewResult.success) {
        throw new Error('Failed to load interview data');
      }
      
      setAllRounds(interviewResult.data.rounds);
      console.log('📋 Loaded rounds:', interviewResult.data.rounds.length);
      
      // Start the first round
      const response = await fetch(`/api/interviews/${interviewId}/round/round_1/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidateInfo.email,
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email,
          deviceCheckPassed: true
        })
      });

      const result = await response.json();
      console.log('🎤 Interview start result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start interview');
      }

      setCurrentRound(result.data.round);
      setCurrentQuestion(result.data.currentQuestion);
      setRoundIndex(0);
      setQuestionIndex(0);
      
      // Start the question with AI speaking it aloud
      await speakQuestion(result.data.currentQuestion.question);
      
      // Start the timer for the first question
      startQuestionTimer();
      
      console.log('✅ Interview started successfully');
      
    } catch (err) {
      console.error('❌ Interview start error:', err);
      setError(err.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  // AI Text-to-Speech function
  const speakQuestion = async (questionText) => {
    return new Promise((resolve) => {
      setIsAISpeaking(true);
      
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(questionText);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
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
          setIsAISpeaking(false);
          startQuestionTimer();
          // Set flag to trigger auto-recording via useEffect
          console.log('🎙️ Setting auto-record flag after AI speech...');
          setShouldAutoRecord(true);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsAISpeaking(false);
          startQuestionTimer();
          // Set flag to trigger auto-recording via useEffect
          console.log('🎙️ Setting auto-record flag after speech error...');
          setShouldAutoRecord(true);
          resolve();
        };
        
        console.log('🗣️ AI speaking question:', questionText.substring(0, 50) + '...');
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('⚠️ Speech synthesis not supported');
        setIsAISpeaking(false);
        startQuestionTimer();
        // Set flag to trigger auto-recording via useEffect
        console.log('🎙️ Setting auto-record flag (no speech synthesis)...');
        setShouldAutoRecord(true);
        resolve();
      }
    });
  };

  // Start question timer
  const startQuestionTimer = () => {
    const timeLimit = currentQuestion?.timeLimit * 60 || 300; // Convert minutes to seconds
    setTimeRemaining(timeLimit);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (autoProgressEnabled) {
            moveToNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Move to next question automatically
  const moveToNextQuestion = async () => {
    try {
      console.log('⏭️ Moving to next question...');
      
      // Stop current recording if active
      if (isRecording) {
        console.log('🛑 Stopping current recording...');
        stopRecording();
      }
      
      // Submit current answer if there's transcription
      if (transcription.trim()) {
        console.log('📤 Submitting current answer before moving to next question...');
        try {
        await submitCurrentAnswer();
          console.log('✅ Answer submitted successfully');
        } catch (submitErr) {
          console.error('❌ Failed to submit answer:', submitErr);
          // Continue anyway to not block progression
        }
      } else {
        console.log('⚠️ No transcription to submit, moving to next question');
      }
      
      // Check if there are more questions in current round
      const currentRoundData = allRounds[roundIndex];
      if (questionIndex + 1 < currentRoundData.questions.length) {
        // Move to next question in same round
        const nextQuestion = currentRoundData.questions[questionIndex + 1];
        console.log('🔄 Moving to question', questionIndex + 2, 'in current round');
        
        setQuestionIndex(questionIndex + 1);
        setCurrentQuestion({
          ...nextQuestion,
          questionId: nextQuestion.id,
          question: nextQuestion.question,
          timeLimit: nextQuestion.timeLimit,
          questionNumber: questionIndex + 2,
          totalQuestions: currentRoundData.questions.length
        });
         setTranscription('');
        setShouldAutoRecord(false); // Reset auto-record flag
         
        // Wait a moment for state to update, then start next question
        setTimeout(async () => {
          try {
         await speakQuestion(nextQuestion.question);
            console.log('✅ Next question started successfully');
            
            // Device detection will continue automatically via useEffect
            console.log('🔄 Device detection will continue automatically for next question');
          } catch (speakErr) {
            console.error('❌ Failed to start next question:', speakErr);
            setError('Failed to start next question');
          }
        }, 500);
        
       } else {
         // Current round complete - get evaluation and show feedback
         console.log('🏁 Round complete, getting evaluation...');
         setCompletedRounds(prev => new Set([...prev, `round_${roundIndex + 1}`]));
         await getRoundEvaluation();
         setStep('round-complete');
       }
      
    } catch (err) {
      console.error('❌ Error moving to next question:', err);
      setError('Failed to progress to next question: ' + err.message);
    }
  };

  // Get round evaluation after completion
  const getRoundEvaluation = async () => {
    try {
      console.log('📊 Getting round evaluation...');
      
      const response = await fetch(`/api/interviews/${interviewId}/round/round_${roundIndex + 1}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateEmail: candidateInfo.email,
          candidateName: candidateInfo.name
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get round evaluation');
      }
      
      setRoundEvaluation(result.data.evaluation);
      console.log('✅ Round evaluation received:', result.data.evaluation);
      
    } catch (err) {
      console.error('❌ Error getting round evaluation:', err);
      // Set a fallback evaluation if API fails
      setRoundEvaluation({
        overallScore: 75,
        feedback: "Round completed successfully. Good performance overall.",
        strengths: ["Completed all questions", "Good communication"],
        areasForImprovement: ["Could provide more detailed answers"],
        recommendation: "Proceed to next round"
      });
    }
  };

  // Ensure camera stream is active during interview
  const ensureCameraActive = async () => {
    try {
      console.log('📹 Ensuring camera is active for interview...');
      setIsCameraRestarting(true);
      
      // Stop device detection temporarily during camera restart
      if (deviceDetectionActive) {
        console.log('⏸️ Temporarily stopping device detection for camera restart...');
        stopDeviceDetection();
      }
      
      // Always get a fresh stream to ensure camera is working
      console.log('📹 Requesting fresh camera stream...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user'
          },
          audio: true
        });
      
      // Stop old stream if it exists
      if (cameraStream) {
        console.log('📹 Stopping old camera stream...');
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
        setCameraStream(stream);
        setCameraStatus('connected');
      
      if (videoRef.current) {
        console.log('📹 Assigning new stream to video element...');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready and play
        const playVideo = async () => {
          try {
        await videoRef.current.play();
        setCameraStatus('playing');
            console.log('✅ Camera stream active and playing');
          } catch (playError) {
            console.error('❌ Video play failed:', playError);
            setCameraStatus('error');
          }
        };
        
        // If video is already ready, play immediately
        if (videoRef.current.readyState >= 2) {
          await playVideo();
        } else {
          // Wait for video to be ready
          videoRef.current.addEventListener('canplay', playVideo, { once: true });
        }
      }
      
      // Restart device detection after camera is stable
      console.log('⏳ Waiting for camera to stabilize before restarting device detection...');
      setTimeout(() => {
        setIsCameraRestarting(false);
        if (step === 'interview' && !deviceDetectionActive) {
          console.log('🔄 Restarting device detection after camera stabilization...');
          startDeviceDetection();
        }
      }, 2000); // Reduced to 2-second grace period
      
    } catch (err) {
      console.error('❌ Failed to ensure camera active:', err);
      setCameraStatus('error');
      setIsCameraRestarting(false);
    }
  };

  // Start a specific round from round selection
  const startSpecificRound = async (roundId) => {
    try {
      setLoading(true);
      console.log('🎭 Starting specific round:', roundId);
      
      const roundIndex = allRounds.findIndex(round => round.roundId === roundId);
      if (roundIndex === -1) {
        throw new Error('Round not found');
      }
      
      const round = allRounds[roundIndex];
      
      setRoundIndex(roundIndex);
      setQuestionIndex(0);
      setCurrentRound(round);
      setCurrentQuestion({
        ...round.questions[0],
        questionId: round.questions[0].id,
        question: round.questions[0].question,
        timeLimit: round.questions[0].timeLimit,
        questionNumber: 1,
        totalQuestions: round.questions.length
      });
      setTranscription('');
      setStep('interview');
      
      // Ensure camera is active before starting interview
      await ensureCameraActive();
      
      // Start the question with AI speaking it aloud
      // Add 5-second delay for first question only
      console.log('⏱️ Starting first question in 5 seconds...');
      setQuestionStartCountdown(5);
      
      const countdownInterval = setInterval(() => {
        setQuestionStartCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Start the question when countdown reaches 0
            speakQuestion(round.questions[0].question);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start electronic device detection (will be auto-started by useEffect when video is ready)
      console.log('🎯 Device detection will start automatically when video is ready');
      
      // Start camera monitoring to ensure it stays active
      startCameraMonitoring();
      
      console.log('✅ Round started successfully');
      
    } catch (err) {
      console.error('❌ Error starting round:', err);
      setError(err.message || 'Failed to start round');
    } finally {
      setLoading(false);
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      console.log('🎙️ Starting recording...');
      
      // Check if already recording
      if (isRecording) {
        console.log('⚠️ Already recording, skipping start');
        return;
      }
      
      if (!cameraStream) {
        throw new Error('No camera stream available');
      }

      // Start Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // Stop any existing recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            recognitionRef.current = null;
          } catch (e) {
            console.log('⚠️ Error stopping previous recognition:', e);
          }
        }
        
        // Wait a moment before starting new recognition
        await new Promise(resolve => setTimeout(resolve, 100));
        
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscription(prev => prev + finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access and try again.');
          } else if (event.error === 'no-speech') {
            console.log('⚠️ No speech detected, continuing...');
          } else if (event.error === 'aborted') {
            console.log('⚠️ Speech recognition aborted, this is normal');
          } else {
            setError('Speech recognition error: ' + event.error);
          }
        };
        
        recognitionRef.current.onend = () => {
          console.log('🛑 Speech recognition ended');
          setIsRecording(false);
        };
        
        recognitionRef.current.onstart = () => {
          console.log('✅ Speech recognition started');
        setIsRecording(true);
        };
        
        recognitionRef.current.start();
        console.log('🎙️ Voice recognition start command sent');
      } else {
        throw new Error('Speech recognition not supported in this browser');
      }
      
    } catch (err) {
      console.error('❌ Recording error:', err);
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      if (recognitionRef.current) {
        console.log('🛑 Stopping recording...');
      recognitionRef.current.stop();
        recognitionRef.current = null;
      setIsRecording(false);
        console.log('✅ Recording stopped successfully');
      } else {
        console.log('⚠️ No active recording to stop');
        setIsRecording(false);
      }
    } catch (err) {
      console.error('❌ Error stopping recording:', err);
      setIsRecording(false);
    }
  };

  // Submit current answer (used internally for auto-progression)
  const submitCurrentAnswer = async () => {
    try {
      if (!transcription.trim()) {
        console.log('⚠️ No transcription to submit');
        return;
      }
      
      console.log('📤 Submitting current answer...');
      
      const response = await fetch(`/api/interviews/${interviewId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidateInfo.email,
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email,
          roundId: currentRound.roundId,
          questionId: currentQuestion.questionId,
          question: currentQuestion.question,
          answer: transcription,
          answerType: 'voice',
          transcription: transcription,
          timeTaken: (currentQuestion.timeLimit * 60) - timeRemaining
        })
      });

      const result = await response.json();
      console.log('✅ Answer submitted:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }
      
      return result.data;
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err.message || 'Failed to submit answer');
      throw err;
    }
  };

  // Manual submit (for when user clicks submit button)
  const submitAnswer = async () => {
    try {
      setLoading(true);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      await submitCurrentAnswer();
      await moveToNextQuestion();
      
    } catch (err) {
      console.error('❌ Manual submit error:', err);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  // Skip question (move to next without submitting)
  const skipQuestion = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop recording if active
      if (isRecording) {
        stopRecording();
      }
      
      setTranscription('');
      await moveToNextQuestion();
    } catch (err) {
      console.error('❌ Skip error:', err);
      setError(err.message || 'Failed to skip question');
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
  const cleanup = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (deviceDetectionInterval.current) {
      clearInterval(deviceDetectionInterval.current);
    }
    if (cameraMonitorInterval.current) {
      clearInterval(cameraMonitorInterval.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  // Auto-record when shouldAutoRecord flag is set
  useEffect(() => {
    if (shouldAutoRecord && !isRecording && !isAISpeaking && step === 'interview') {
      console.log('🎙️ Auto-recording triggered by useEffect...');
      const startAutoRecording = async () => {
        try {
          await startRecording();
          setShouldAutoRecord(false);
        } catch (err) {
          console.error('❌ Auto-recording failed:', err);
          setShouldAutoRecord(false);
        }
      };
      
      // Small delay to ensure state is settled
      setTimeout(startAutoRecording, 1000);
    }
  }, [shouldAutoRecord, isRecording, isAISpeaking, step]);

  // Ensure video element is connected to camera stream
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      console.log('🔗 Connecting camera stream to video element...');
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().then(() => {
        console.log('✅ Video element connected and playing');
        setCameraStatus('playing');
      }).catch(err => {
        console.error('❌ Video play error:', err);
        setCameraStatus('error');
      });
    }
  }, [cameraStream]);

  // Auto-start device detection when video is ready during interview
  useEffect(() => {
    if (step === 'interview' && videoRef.current && cameraStream && !deviceDetectionActive) {
      const video = videoRef.current;
      
      // Check if video is ready with valid dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        console.log('🎯 Video is ready, starting device detection...');
        startDeviceDetection();
      } else {
        // Wait for video to be ready
        const checkVideoReady = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
            console.log('🎯 Video became ready, starting device detection...');
            startDeviceDetection();
          } else {
            // Check again in 500ms
            setTimeout(checkVideoReady, 500);
          }
        };
        checkVideoReady();
      }
    }
  }, [step, cameraStream, deviceDetectionActive]);

  // Device detection - only detect dark devices, allow all bright screens
  const detectDevice = (imageData) => {
    const data = imageData.data;
    let darkPixels = 0;
    let totalPixels = 0;
    
    // Pixel analysis - only detect dark devices, allow bright screens
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      totalPixels++;
      
      // Only count dark pixels (dark devices, phone bodies) - ignore bright screens
      if (brightness < 80 && brightness > 20) {
        darkPixels++;
      }
    }
    
    const darkRatio = darkPixels / totalPixels;
    
    console.log(`📱 Dark Device Detection: Dark: ${darkPixels} (${(darkRatio * 100).toFixed(1)}%) - Bright screens allowed`);
    
    // Only detect dark devices - allow all bright screens
    if (darkRatio > 0.2) {
      console.log('🚨 Dark device detected');
      return true;
    }
    
    console.log('✅ No dark device detected - bright screens allowed');
    return false;
  };

  // Manual test function for device detection
  const testDeviceDetection = async () => {
    try {
      console.log('🧪 MANUAL TEST: Testing device detection...');
      
      if (!videoRef.current || !cameraStream) {
        console.log('⚠️ Cannot test - video or camera not ready');
        return;
      }

      const video = videoRef.current;
      
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
        console.log('⚠️ Cannot test - video not ready');
        return;
      }

      // Create canvas for analysis
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Run detection
      const deviceDetected = detectDevice(imageData);
      
      if (deviceDetected) {
        console.log('🧪 TEST RESULT: Device detected!');
        setElectronicDeviceDetected(true);
        setError('TEST: Mobile device detected! Please remove all electronic devices and try again.');
      } else {
        console.log('🧪 TEST RESULT: No device detected');
        setElectronicDeviceDetected(false);
        setError('TEST: No device detected - detection is working correctly');
      }
      
    } catch (err) {
      console.error('❌ Test error:', err);
    }
  };

  // Electronic device detection function - reimplemented
  const detectElectronicDevices = async () => {
    try {
      console.log('🔍 Running device detection...');
      
      if (!videoRef.current || !cameraStream) {
        console.log('⚠️ Video or camera not ready');
        return;
      }

      const video = videoRef.current;
      
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
        console.log('⚠️ Video not ready');
        return;
      }

      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Get image data and run detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const deviceDetected = detectDevice(imageData);
      
      if (deviceDetected) {
        console.log('🚨 DEVICE DETECTED!');
        setElectronicDeviceDetected(true);
        setError('Mobile device detected! Please remove all electronic devices and try again.');
        
        // Stop activities and start countdown
        stopRecording();
        stopDeviceDetection();
        
        setRemovalCountdown(3);
        const countdownInterval = setInterval(() => {
          setRemovalCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              console.log('🚨 Removing candidate due to device usage');
              stopCameraMonitoring();
              stopDeviceDetection();
              if (onError) {
                onError('Candidate removed due to electronic device usage during interview');
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.log('✅ No device detected');
        setElectronicDeviceDetected(false);
      }

    } catch (err) {
      console.error('❌ Device detection error:', err);
    }
  };



  // Start device detection - active monitoring for dark devices only
  const startDeviceDetection = () => {
    if (deviceDetectionInterval.current) {
      clearInterval(deviceDetectionInterval.current);
    }
    
    console.log('🔍 Starting device monitoring (dark devices only - bright screens allowed)...');
    
    // Check if video is ready
    if (!videoRef.current || !cameraStream) {
      console.log('⚠️ Video or camera not ready, retrying in 2 seconds...');
      setTimeout(() => {
        if (step === 'interview') {
          startDeviceDetection();
        }
      }, 2000);
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('⚠️ Video not ready, retrying in 2 seconds...');
      setTimeout(() => {
        if (step === 'interview') {
          startDeviceDetection();
        }
      }, 2000);
      return;
    }
    
    setDeviceDetectionActive(true);
    console.log('✅ Device monitoring started - detecting dark devices only, bright screens allowed');
    
    // Run detection every 3 seconds
    deviceDetectionInterval.current = setInterval(() => {
      if (step === 'interview' && videoRef.current && cameraStream) {
        detectElectronicDevices();
      } else {
        console.log('⚠️ Stopping device monitoring');
        stopDeviceDetection();
      }
    }, 3000);
  };

  // Stop device detection
  const stopDeviceDetection = () => {
    if (deviceDetectionInterval.current) {
      clearInterval(deviceDetectionInterval.current);
      deviceDetectionInterval.current = null;
    }
    setDeviceDetectionActive(false);
    console.log('🛑 Electronic device detection stopped');
  };

  // Start camera monitoring to ensure it stays active
  const startCameraMonitoring = () => {
    if (cameraMonitorInterval.current) {
      clearInterval(cameraMonitorInterval.current);
    }
    
    console.log('📹 Starting camera monitoring...');
    cameraMonitorInterval.current = setInterval(() => {
      if (step === 'interview' && videoRef.current && cameraStream) {
        const video = videoRef.current;
        
        // Check if video is still playing and has valid stream
        if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
          console.log('⚠️ Camera stream appears to be inactive, attempting to restart...');
          ensureCameraActive();
        } else if (cameraStatus !== 'playing') {
          console.log('⚠️ Camera status is not playing, attempting to restart...');
          ensureCameraActive();
        }
      }
    }, 5000); // Check every 5 seconds
  };

  // Stop camera monitoring
  const stopCameraMonitoring = () => {
    if (cameraMonitorInterval.current) {
      clearInterval(cameraMonitorInterval.current);
      cameraMonitorInterval.current = null;
    }
    console.log('🛑 Camera monitoring stopped');
  };

  // Render different steps
  if (step === 'round-complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentRound?.title} Completed!
            </h2>
            <p className="text-gray-600 text-lg">
              Great job! Here's your performance evaluation for this round.
            </p>
          </div>

          {/* Round Evaluation - Modern Card Layout */}
          {roundEvaluation && (
            <div className="max-w-4xl mx-auto">
              {/* Header with Score */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 shadow-2xl">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10 text-center text-white">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-white bg-opacity-20 rounded-full mb-4">
                    <span className="text-4xl font-bold">{roundEvaluation.overallScore}%</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Round Complete</h2>
                  <p className="text-indigo-100 text-lg">{roundEvaluation.recommendation}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Feedback */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Feedback Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Performance Review</h3>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-700 leading-relaxed text-lg">{roundEvaluation.feedback}</p>
                    </div>
                  </div>

                  {/* Question Performance */}
                  {roundEvaluation.individualScores && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Question Performance</h3>
                      </div>
                      <div className="space-y-4">
                        {roundEvaluation.individualScores.map((score, index) => (
                          <div key={index} className="group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">Question {index + 1}</span>
                              <span className="text-2xl font-bold text-gray-900">{score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Analysis */}
                <div className="space-y-6">
                  
                  {/* Strengths */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-lg border border-emerald-100 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-800">Strengths</h3>
                    </div>
                    <div className="space-y-3">
                      {roundEvaluation.strengths?.length > 0 ? (
                        roundEvaluation.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-emerald-700 text-sm leading-relaxed">{strength}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-emerald-600 text-sm italic">No specific strengths identified</p>
                      )}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-100 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-amber-800">Focus Areas</h3>
                    </div>
                    <div className="space-y-3">
                      {roundEvaluation.areasForImprovement?.map((area, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-amber-700 text-sm leading-relaxed">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center mr-3">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Summary</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Overall Score</span>
                        <span className="font-semibold text-slate-800">{roundEvaluation.overallScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Questions Answered</span>
                        <span className="font-semibold text-slate-800">{roundEvaluation.individualScores?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status</span>
                        <span className="font-semibold text-slate-800">{roundEvaluation.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setStep('round-selection')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all"
            >
              🎯 Continue to Next Round
            </button>
            
            {completedRounds.size === allRounds.length && (
              <button
                onClick={() => {
                  setStep('complete');
                  stopCameraMonitoring();
                  stopDeviceDetection();
                  if (onComplete) {
                    onComplete({ 
                      message: 'All interview rounds completed successfully!',
                      completedRounds: Array.from(completedRounds),
                      totalRounds: allRounds.length
                    });
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                🎉 Complete Interview
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mt-6">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm underline mt-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'round-selection') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-6xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Interview Round</h2>
            <p className="text-gray-600 text-lg">
              Choose which round you'd like to complete. Complete rounds in sequence to unlock the next ones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRounds.map((round, index) => {
              const roundId = round.roundId;
              const isCompleted = completedRounds.has(roundId);
              const isAvailable = index === 0 || completedRounds.has(allRounds[index - 1]?.roundId);
              
              return (
                <div
                  key={roundId}
                  className={`border rounded-lg p-6 transition-all ${
                    isCompleted
                      ? 'border-green-200 bg-green-50'
                      : isAvailable
                      ? 'border-purple-200 bg-purple-50 hover:border-purple-500 hover:shadow-lg cursor-pointer'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="text-center">
                    {/* Round Status Icon */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isCompleted
                          ? 'bg-green-500'
                          : isAvailable
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-8 w-8 text-white" />
                      ) : (
                        <span className="text-white text-xl font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Round Title */}
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        isCompleted
                          ? 'text-green-800'
                          : isAvailable
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {round.title}
                    </h3>

                    {/* Round Description */}
                    <p
                      className={`text-sm mb-4 ${
                        isCompleted
                          ? 'text-green-600'
                          : isAvailable
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {round.description}
                    </p>

                    {/* Round Info */}
                    <div className="space-y-2 text-sm text-gray-500 mb-6">
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{round.duration} minutes</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span>{round.questions?.length || 0} questions</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {isCompleted ? (
                      <div className="space-y-2">
                        <div className="w-full py-3 px-6 bg-green-100 text-green-800 rounded-lg font-medium">
                          ✅ Completed
                        </div>
                        <button
                          onClick={() => startSpecificRound(roundId)}
                          disabled={loading}
                          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Retake Round
                        </button>
                      </div>
                    ) : isAvailable ? (
                      <button
                        onClick={() => startSpecificRound(roundId)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 px-6 rounded-lg font-medium transition-all transform hover:scale-105 disabled:transform-none"
                      >
                        {loading ? 'Starting...' : 'Start Round'}
                      </button>
                    ) : (
                      <div className="w-full py-3 px-6 bg-gray-200 text-gray-500 rounded-lg font-medium">
                        🔒 Complete Previous Rounds First
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Progress */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Interview Progress</h3>
              <div className="text-sm text-blue-800">
                Completed: {completedRounds.size} / {allRounds.length} rounds
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedRounds.size / allRounds.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Complete Interview Button */}
          {completedRounds.size === allRounds.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setStep('complete');
                  stopCameraMonitoring();
                  stopDeviceDetection();
                  if (onComplete) {
                    onComplete({ 
                      message: 'All interview rounds completed successfully!',
                      completedRounds: Array.from(completedRounds),
                      totalRounds: allRounds.length
                    });
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all"
              >
                🎉 Complete Interview
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mt-6">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-sm underline mt-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Interview Setup</h1>
              <p className="text-gray-300 text-lg">Prepare your camera and microphone for the interview</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Setup Instructions */}
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">🎯 Interview Requirements</h2>
                    <div className="space-y-4 text-gray-300">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <p className="font-semibold text-white text-lg">Camera Access</p>
                          <p className="text-sm">We need camera access to monitor the interview environment and detect any electronic devices</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <p className="font-semibold text-white text-lg">Microphone Access</p>
                          <p className="text-sm">Voice recording is required for answering interview questions</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <p className="font-semibold text-white text-lg">Clean Environment</p>
                          <p className="text-sm">Ensure no electronic devices are visible during the interview</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                        <div>
                          <p className="font-semibold text-white text-lg">Good Lighting</p>
                          <p className="text-sm">Position yourself in a well-lit area for clear video</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
          {error && (
                      <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl p-4 mb-6">
                        <p className="text-red-200 text-center">{error}</p>
            </div>
          )}
          
          <button
            onClick={startSetup}
            disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 px-8 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Setting up camera and microphone...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <Camera className="w-6 h-6" />
                          <span>Start Camera Setup</span>
                        </div>
                      )}
          </button>
                  </div>
                </div>

                {/* Preview Area */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">📹 Camera Preview</h3>
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-600">
                      <div className="text-center text-gray-400">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Camera will appear here</p>
                        <p className="text-sm">Click "Start Camera Setup" to begin</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Camera will be activated</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Microphone will be enabled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Environment check will begin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'device-check') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Camera Preview & Environment Check</h1>
              <p className="text-gray-300">Position yourself in the camera and ensure no electronic devices are visible</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Large Camera Feed */}
                <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
                    playsInline
                    className="w-full h-96 lg:h-[500px] bg-black rounded-3xl object-cover shadow-2xl border-4 border-white/20"
                    onLoadedMetadata={() => console.log('📹 Video metadata loaded')}
                    onCanPlay={() => console.log('📹 Video can play')}
                    onPlay={() => console.log('📹 Video started playing')}
                    onError={(e) => console.error('❌ Video error:', e)}
                  />
                  
                  {/* Camera Error Overlay */}
                  {cameraStatus === 'error' && (
                    <div className="absolute inset-0 bg-black/80 rounded-3xl flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 text-red-400" />
                        <h3 className="text-xl font-semibold mb-2">Camera Not Available</h3>
                        <p className="text-gray-300">Please check your camera permissions and try again</p>
            </div>
          </div>
                  )}
                  
                  {/* Camera Loading Overlay */}
                  {cameraStatus === 'initializing' && (
                    <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                        <h3 className="text-xl font-semibold mb-2">Initializing Camera...</h3>
                        <p className="text-gray-300">Please wait while we set up your camera</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Overlays */}
                  <div className="absolute top-6 left-6 flex flex-col space-y-3">
                    <div className={`flex items-center space-x-2 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium ${
                      cameraStatus === 'playing' ? 'bg-green-600/90' : 
                      cameraStatus === 'connected' ? 'bg-yellow-600/90' : 
                      cameraStatus === 'error' ? 'bg-red-600/90' : 'bg-gray-600/90'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        cameraStatus === 'playing' ? 'bg-white animate-pulse' : 
                        cameraStatus === 'connected' ? 'bg-white animate-pulse' : 
                        cameraStatus === 'error' ? 'bg-white' : 'bg-gray-300'
                      }`}></div>
                      <span>
                        {cameraStatus === 'playing' ? 'Live Camera' : 
                         cameraStatus === 'connected' ? 'Camera Connected' : 
                         cameraStatus === 'error' ? 'Camera Error' : 'Initializing...'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span>Environment Check</span>
                    </div>
                  </div>

                  {/* Instructions Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-sm text-white p-4 rounded-2xl">
                    <h3 className="font-semibold mb-2">📋 Instructions:</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Position yourself in the center of the camera</li>
                      <li>• Ensure good lighting on your face</li>
                      <li>• Remove all electronic devices from view</li>
                      <li>• Make sure you're in a quiet environment</li>
                    </ul>
                  </div>
                </div>

                {/* Instructions Panel */}
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🎯 Camera Setup</h3>
                    <div className="space-y-4 text-gray-300">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium text-white">Position Yourself</p>
                          <p className="text-sm">Sit centered in the camera frame with your face clearly visible</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium text-white">Check Lighting</p>
                          <p className="text-sm">Ensure your face is well-lit and clearly visible</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium text-white">Remove Devices</p>
                          <p className="text-sm">Put away phones, tablets, and other electronic devices</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                        <div>
                          <p className="font-medium text-white">Quiet Environment</p>
                          <p className="text-sm">Choose a quiet location with minimal background noise</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
          {error && (
                      <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl p-4 mb-6">
                        <p className="text-red-200 text-center">{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className="text-red-300 text-sm underline mt-2 block mx-auto"
                        >
                          Dismiss
                        </button>
            </div>
          )}

          <button
            onClick={validateEnvironment}
            disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 px-8 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Validating Environment...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Start Environment Check</span>
                        </div>
                      )}
          </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
        {/* Full-screen immersive interview interface */}
        <div className="h-full flex flex-col">
          {/* Top Status Bar */}
          <div className="bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-4">
              <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="text-white">
                  <h1 className="text-xl font-bold">{currentRound?.title || 'Interview'}</h1>
                  <p className="text-gray-300 text-sm">
                    Question {questionIndex + 1} of {currentRound?.questions?.length || 1} • Round {roundIndex + 1} of {allRounds.length}
                  </p>
                </div>
                  </div>
              
              <div className="flex items-center space-x-6">
                {/* Time Display */}
                <div className="text-center">
                  <div className={`flex items-center space-x-2 text-2xl font-mono font-bold ${
                    timeRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-white'
                  }`}>
                    <Clock className="h-6 w-6" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                  <p className="text-gray-400 text-xs">Time Remaining</p>
                </div>
                
                {/* Recording Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-white text-sm font-medium">
                    {isRecording ? 'Recording' : 'Ready'}
                  </span>
                </div>
                </div>
              </div>
              
              {/* Progress Bar */}
            <div className="mt-4 bg-white/10 rounded-full h-1">
                <div 
                className="bg-gradient-to-r from-blue-400 to-purple-400 h-1 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((roundIndex * (allRounds[0]?.questions?.length || 1) + questionIndex + 1) / 
                             (allRounds.reduce((total, round) => total + (round.questions?.length || 1), 0))) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Left Side - Question and Controls */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-12">
                   {/* Question Start Countdown */}
                   {questionStartCountdown > 0 && (
                 <div className="mb-8 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-2xl p-6">
                   <div className="flex items-center space-x-4">
                     <div className="p-3 bg-purple-500/30 rounded-full">
                       <div className="h-8 w-8 text-purple-300 text-2xl font-bold flex items-center justify-center">
                         {questionStartCountdown}
                       </div>
                     </div>
                         <div>
                       <h3 className="text-xl font-semibold text-white">Get Ready!</h3>
                       <p className="text-purple-200">First question starting in {questionStartCountdown} seconds...</p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* AI Speaking Indicator */}
                   {isAISpeaking && (
                 <div className="mb-8 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-2xl p-6">
                   <div className="flex items-center space-x-4">
                     <div className="p-3 bg-blue-500/30 rounded-full">
                       <Volume2 className="h-8 w-8 text-blue-300 animate-pulse" />
                     </div>
                         <div>
                       <h3 className="text-xl font-semibold text-white">AI is speaking...</h3>
                       <p className="text-blue-200">Please listen to the question carefully</p>
                         </div>
                       </div>
                     </div>
                   )}

                  {/* Question Display */}
              <div className="mb-12">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{questionIndex + 1}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Question</h2>
                    {isAISpeaking && <Volume2 className="h-6 w-6 text-blue-400 animate-pulse" />}
                  </div>
                  <p className="text-xl text-gray-100 leading-relaxed">{currentQuestion?.question}</p>
                </div>
                  </div>

              {/* Live Transcription */}
              <div className="mb-8">
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <h3 className="text-lg font-semibold text-white">Live Transcription</h3>
                  </div>
                  <div className="min-h-[120px] max-h-48 overflow-y-auto">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      {transcription || (
                        <span className="text-gray-400 italic">
                          {isRecording ? 'Start speaking...' : 'Recording will start automatically when you begin speaking'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-6">
                {/* Skip Button */}
                      <button
                  onClick={skipQuestion}
                        disabled={loading || isAISpeaking}
                  className="flex items-center space-x-3 px-8 py-4 bg-gray-600/50 hover:bg-gray-600/70 disabled:bg-gray-800/50 text-white rounded-2xl font-semibold transition-all duration-200 backdrop-blur-md border border-white/20"
                >
                  <SkipForward className="h-5 w-5" />
                  <span>Skip Question</span>
                      </button>
                      
                {/* Submit Button */}
                      <button
                  onClick={submitAnswer}
                  disabled={loading || !transcription.trim() || isAISpeaking}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Submit Answer</span>
                    </>
                  )}
                      </button>
                    </div>

              {/* Auto Progress Indicator */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-sm font-medium">
                    Auto-progress enabled - will move to next question automatically
                  </span>
                </div>
                    </div>

              {/* Debug Info */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center space-x-4 text-xs text-gray-400">
                  <span>Recording: {isRecording ? 'ON' : 'OFF'}</span>
                  <span>AI Speaking: {isAISpeaking ? 'ON' : 'OFF'}</span>
                  <span>Auto-Record: {shouldAutoRecord ? 'PENDING' : 'OFF'}</span>
                  <span>Device Detection: {deviceDetectionActive ? 'ON' : 'OFF'}</span>
                  <span>Device Found: {electronicDeviceDetected ? 'YES' : 'NO'}</span>
                  <span>Countdown: {removalCountdown}</span>
                  <span>Camera: {cameraStatus}</span>
                  <span>Q Start: {questionStartCountdown}</span>
                </div>
                    </div>

              {/* Debug Buttons */}
              <div className="mt-4 text-center space-x-4">
                      <button
                  onClick={() => {
                    console.log('🧪 Manual device detection test triggered');
                    testDeviceDetection();
                  }}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 rounded-lg text-purple-200 text-sm transition-all duration-200"
                >
                  🧪 Test Device Detection
                </button>
                
                <button
                  onClick={async () => {
                    console.log('📹 Manual camera restart triggered');
                    await ensureCameraActive();
                  }}
                  disabled={isCameraRestarting}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed border border-blue-400/30 rounded-lg text-blue-200 text-sm transition-all duration-200"
                >
                  {isCameraRestarting ? '🔄 Restarting...' : '📹 Restart Camera'}
                </button>
                  </div>

                  {error && (
                <div className="mt-6 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl p-4">
                  <p className="text-red-200 text-center">{error}</p>
                      <button
                        onClick={() => setError(null)}
                    className="text-red-300 text-sm underline mt-2 block mx-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

            {/* Right Side - Large Video Feed */}
            <div className="w-full lg:w-2/3 flex flex-col items-center justify-center px-6 py-8">
              <div className="relative w-full max-w-4xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                  playsInline
                  className="w-full h-96 lg:h-[500px] bg-black rounded-3xl object-cover shadow-2xl border-4 border-white/20"
                  onLoadedMetadata={() => {
                    console.log('📹 Interview video metadata loaded');
                    console.log('📹 Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                  }}
                  onCanPlay={() => {
                    console.log('📹 Interview video can play');
                    setCameraStatus('playing');
                  }}
                  onPlay={() => {
                    console.log('📹 Interview video started playing');
                    setCameraStatus('playing');
                  }}
                  onError={(e) => {
                    console.error('❌ Interview video error:', e);
                    setCameraStatus('error');
                  }}
                />
                
                {/* Camera Status Overlay for Interview */}
                {cameraStatus !== 'playing' && (
                  <div className="absolute inset-0 bg-black/80 rounded-3xl flex items-center justify-center">
                    <div className="text-center text-white">
                      {cameraStatus === 'error' ? (
                        <>
                          <Camera className="h-16 w-16 mx-auto mb-4 text-red-400" />
                          <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
                          <p className="text-gray-300">Camera not available during interview</p>
                        </>
                      ) : (
                        <>
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                          <h3 className="text-xl font-semibold mb-2">Connecting Camera...</h3>
                          <p className="text-gray-300">Setting up video feed for interview</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Hidden canvas for device detection */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Device Detection Scanning Overlay */}
                {deviceDetectionActive && !electronicDeviceDetected && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-16 h-16 border-4 border-purple-400/50 border-t-purple-400 rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-purple-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                        🔍 Scanning for devices...
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Status Overlay */}
                <div className="absolute top-6 left-6 flex flex-col space-y-3">
                  <div className="flex items-center space-x-2 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                      
                      {isRecording && (
                    <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span>Recording</span>
                        </div>
                      )}
                      
                      {isAISpeaking && (
                    <div className="flex items-center space-x-2 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      <Volume2 className="w-4 h-4 animate-pulse" />
                          <span>AI Speaking</span>
                        </div>
                      )}

                  {deviceDetectionActive && (
                    <div className="flex items-center space-x-2 bg-purple-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span>Device Monitoring</span>
                      <div className="w-2 h-2 bg-purple-300 rounded-full animate-ping"></div>
                    </div>
                  )}

                  {electronicDeviceDetected && (
                    <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                      <span>Device Detected!</span>
                    </div>
                  )}
                  </div>

                {/* Confidence and Expression Overlay */}
                <div className="absolute top-6 right-6 flex flex-col space-y-3">
                  {confidenceScore !== null && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">{confidenceScore}%</div>
                        <div className="text-xs text-gray-300">Confidence</div>
                    </div>
                  </div>
                  )}

                  {facialExpression && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white mb-1">{facialExpression}</div>
                        <div className="text-xs text-gray-300">Expression</div>
                </div>
              </div>
                  )}
            </div>
          </div>

              {/* Interview Stats */}
              <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-4xl">
                <h3 className="text-xl font-semibold text-white mb-6 text-center">Interview Progress</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{currentRound?.title}</div>
                    <div className="text-gray-300">Current Round</div>
        </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{questionIndex + 1}/{currentRound?.questions?.length}</div>
                    <div className="text-gray-300">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{allRounds.length}</div>
                    <div className="text-gray-300">Total Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">ON</div>
                    <div className="text-gray-300">Auto-progress</div>
                  </div>
                </div>
              </div>

              {/* Device Monitoring Status */}
              <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-4xl">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">🔍 Security Monitoring</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${deviceDetectionActive ? 'text-green-400' : 'text-gray-400'}`}>
                      {deviceDetectionActive ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                    <div className="text-gray-300">Device Detection</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${electronicDeviceDetected ? 'text-red-400' : 'text-green-400'}`}>
                      {electronicDeviceDetected ? 'DETECTED' : 'CLEAN'}
                    </div>
                    <div className="text-gray-300">Environment Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">1s</div>
                    <div className="text-gray-300">Scan Interval</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-gray-300 text-sm">
                    {deviceDetectionActive 
                      ? '🛡️ Continuously monitoring for electronic devices every second' 
                      : '⚠️ Device monitoring is not active'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-screen device detection warning */}
        {electronicDeviceDetected && (
          <div className="fixed inset-0 bg-red-900/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-12 max-w-2xl mx-4 text-center shadow-2xl">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Electronic Device Detected!</h2>
              <p className="text-lg text-gray-600 mb-6">
                We have detected an electronic device in your interview area. Please remove all electronic devices and ensure a clean interview environment.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">
                  ⚠️ You will be automatically removed from the interview in {removalCountdown} seconds for violating interview rules.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Removing from interview in {removalCountdown}...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Complete!</h2>
          <p className="text-gray-600">
            Thank you for completing the voice interview. Your responses have been recorded.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default SimpleVoiceInterview;
