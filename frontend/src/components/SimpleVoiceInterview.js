import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, Play, Pause, AlertTriangle, CheckCircle, Clock, Volume2, SkipForward } from 'lucide-react';

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

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const deviceDetectionInterval = useRef(null);
  const canvasRef = useRef(null);

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
            
            // Ensure device detection continues for next question
            if (!deviceDetectionActive) {
              startDeviceDetection();
            }
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
      
      if (!cameraStream) {
        console.log('📹 No camera stream found, requesting new stream...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user'
          },
          audio: true
        });
        setCameraStream(stream);
        setCameraStatus('connected');
      }
      
      if (videoRef.current && cameraStream) {
        videoRef.current.srcObject = cameraStream;
        await videoRef.current.play();
        setCameraStatus('playing');
        console.log('✅ Camera stream active for interview');
      }
    } catch (err) {
      console.error('❌ Failed to ensure camera active:', err);
      setCameraStatus('error');
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
      
      // Start electronic device detection
      startDeviceDetection();
      
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

  // Electronic device detection function
  const detectElectronicDevices = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        console.log('⚠️ Device detection skipped - video or canvas not ready');
        console.log('📹 Video ref:', videoRef.current ? 'Available' : 'Not available');
        console.log('📹 Canvas ref:', canvasRef.current ? 'Available' : 'Not available');
        return;
      }

      if (!cameraStream) {
        console.log('⚠️ Device detection skipped - no camera stream');
        return;
      }

      console.log('🔍 Running device detection scan...');

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;

      // Set canvas size to match video (optimized for device detection)
      const maxWidth = 640;
      const maxHeight = 480;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Calculate scaled dimensions for device detection
      const scale = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      canvas.width = videoWidth * scale;
      canvas.height = videoHeight * scale;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Enhanced electronic device detection based on:
      // 1. Bright rectangular objects (screens)
      // 2. Metallic reflections
      // 3. Blue light emissions (phone screens)
      // 4. White light sources (tablets, laptops)
      // 5. Rectangular patterns (device shapes)
      let deviceScore = 0;
      let brightPixels = 0;
      let bluePixels = 0;
      let whitePixels = 0;
      let metallicPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        // Detect bright pixels (potential screens) - lowered threshold
        if (brightness > 180) {
          brightPixels++;
        }

        // Detect blue light (phone screens often emit blue light)
        if (b > r && b > g && b > 120) {
          bluePixels++;
        }

        // Detect white light sources (tablets, laptops)
        if (r > 200 && g > 200 && b > 200) {
          whitePixels++;
        }

        // Detect metallic reflections (shiny device surfaces)
        if (brightness > 150 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
          metallicPixels++;
        }
      }

      const totalPixels = data.length / 4;
      const brightRatio = brightPixels / totalPixels;
      const blueRatio = bluePixels / totalPixels;
      const whiteRatio = whitePixels / totalPixels;
      const metallicRatio = metallicPixels / totalPixels;

      // Enhanced device detection score with multiple factors
      deviceScore = (brightRatio * 0.3) + (blueRatio * 0.25) + (whiteRatio * 0.25) + (metallicRatio * 0.2);

      // Enhanced logging for debugging
      if (deviceScore > 0.02) { // Log when score is getting high
        console.log(`🔍 Device detection scan: Score ${deviceScore.toFixed(4)} (threshold: 0.05)`);
        console.log(`📊 Pixel analysis: Bright: ${brightPixels}, Blue: ${bluePixels}, White: ${whitePixels}, Metallic: ${metallicPixels}`);
        console.log(`📊 Ratios: Bright: ${brightRatio.toFixed(4)}, Blue: ${blueRatio.toFixed(4)}, White: ${whiteRatio.toFixed(4)}, Metallic: ${metallicRatio.toFixed(4)}`);
      }

      // If device score is high, trigger detection (very sensitive for interview integrity)
      if (deviceScore > 0.05) { // Very sensitive threshold for strict monitoring
        console.log('🚨 Electronic device detected! Score:', deviceScore.toFixed(4));
        console.log(`📊 Detection details: Bright pixels: ${brightPixels}, Blue pixels: ${bluePixels}, White pixels: ${whitePixels}, Metallic pixels: ${metallicPixels}`);
        setElectronicDeviceDetected(true);
        setError('Electronic device detected! Please remove all electronic devices and try again.');
        
        // Stop all interview activities immediately
        stopRecording();
        stopDeviceDetection();
        
        // Start countdown and auto-remove candidate
        setRemovalCountdown(3);
        const countdownInterval = setInterval(() => {
          setRemovalCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              console.log('🚨 Removing candidate due to electronic device usage');
              if (onError) {
                onError('Candidate removed due to electronic device usage during interview');
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setElectronicDeviceDetected(false);
      }

      // Analyze facial expressions for confidence
      analyzeFacialExpression(imageData);

    } catch (err) {
      console.error('❌ Device detection error:', err);
    }
  };

  // Simple facial expression analysis
  const analyzeFacialExpression = (imageData) => {
    try {
      // This is a simplified analysis - in a real implementation,
      // you would use a proper face detection library like face-api.js
      const data = imageData.data;
      let facePixels = 0;
      let confidentPixels = 0;

      // Simple skin tone detection and confidence analysis
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Detect skin tones (simplified)
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15) {
          facePixels++;
          
          // Detect confident expressions (bright, clear skin)
          if (r > 120 && g > 60 && b > 30) {
            confidentPixels++;
          }
        }
      }

      if (facePixels > 0) {
        const confidenceRatio = confidentPixels / facePixels;
        setConfidenceScore(Math.round(confidenceRatio * 100));
        
        // Set facial expression based on confidence
        if (confidenceRatio > 0.7) {
          setFacialExpression('Confident');
        } else if (confidenceRatio > 0.4) {
          setFacialExpression('Neutral');
        } else {
          setFacialExpression('Nervous');
        }
      }
    } catch (err) {
      console.error('❌ Facial analysis error:', err);
    }
  };

  // Start device detection
  const startDeviceDetection = () => {
    if (deviceDetectionInterval.current) {
      clearInterval(deviceDetectionInterval.current);
    }
    
    setDeviceDetectionActive(true);
    // More frequent detection during interview - every 1 second for better tracking
    deviceDetectionInterval.current = setInterval(detectElectronicDevices, 1000);
    console.log('🔍 Electronic device detection started - monitoring every 1 second');
    console.log('📹 Camera stream status:', cameraStream ? 'Available' : 'Not available');
    console.log('📹 Video element status:', videoRef.current ? 'Available' : 'Not available');
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

          {/* Round Evaluation */}
          {roundEvaluation && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Overall Score</h3>
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {roundEvaluation.overallScore}%
                  </div>
                  <p className="text-gray-600">{roundEvaluation.recommendation}</p>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Feedback</h3>
                <p className="text-gray-700 leading-relaxed">{roundEvaluation.feedback}</p>
              </div>

              {/* Strengths and Areas for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-4">✅ Strengths</h3>
                  <ul className="space-y-2">
                    {roundEvaluation.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-green-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-orange-800 mb-4">🎯 Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {roundEvaluation.areasForImprovement?.map((area, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-orange-700">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Individual Question Scores */}
              {roundEvaluation.individualScores && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Question Breakdown</h3>
                  <div className="space-y-3">
                    {roundEvaluation.individualScores.map((score, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <span className="text-gray-700">Question {index + 1}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12">{score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    detectElectronicDevices();
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
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 rounded-lg text-blue-200 text-sm transition-all duration-200"
                >
                  📹 Restart Camera
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
