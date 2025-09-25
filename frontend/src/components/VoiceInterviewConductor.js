import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Mic, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Shield,
  Volume2
} from 'lucide-react';

const VoiceInterviewConductor = ({ 
  interviewId, 
  candidateInfo, 
  onComplete,
  onError 
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState('setup'); // setup, device-check, interview, complete
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [deviceCheckResult, setDeviceCheckResult] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize camera and microphone
  const initializeMedia = async () => {
    try {
      setLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraActive(true);
      setMicActive(true);
      setError(null);
      console.log('✅ Media initialized successfully');
    } catch (err) {
      console.error('❌ Media initialization failed:', err);
      setError('Failed to access camera and microphone. Please grant permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Capture frame for device detection
  const captureFrame = () => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Perform device check using AI
  const performDeviceCheck = async () => {
    try {
      setLoading(true);
      const imageData = captureFrame();
      
      if (!imageData) {
        throw new Error('Failed to capture camera frame');
      }

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

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Device check failed');
      }

      setDeviceCheckResult(result.data);
      
      if (result.data.deviceCheckPassed) {
        setCurrentStep('interview');
        await startFirstRound();
      } else {
        setError(`Device check failed: ${result.data.message}`);
      }
      
    } catch (err) {
      console.error('❌ Device check failed:', err);
      setError(err.message || 'Device validation failed');
    } finally {
      setLoading(false);
    }
  };

  // Start first round of interview
  const startFirstRound = async () => {
    try {
      setLoading(true);
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
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start interview round');
      }

      setCurrentRound(result.data.round);
      setCurrentQuestion(result.data.currentQuestion);
      setTimeRemaining(result.data.instructions.timeLimit);
      startTimer(result.data.instructions.timeLimit);
      
      console.log('✅ Interview round started:', result.data.round.title);
    } catch (err) {
      console.error('❌ Failed to start round:', err);
      setError(err.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  // Timer management
  const startTimer = (seconds) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        throw new Error('No media stream available');
      }

      audioChunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        processAudioToText(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start Web Speech API for real-time transcription
      startSpeechRecognition();
      
      console.log('🎙️ Recording started');
    } catch (err) {
      console.error('❌ Recording start failed:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopSpeechRecognition();
      console.log('🛑 Recording stopped');
    }
  };

  // Speech recognition for real-time transcription
  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
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
        
        setTranscription(finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.start();
    } else {
      console.warn('⚠️ Speech recognition not supported');
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Process audio to text (fallback/enhancement)
  const processAudioToText = async (audioBlob) => {
    // For now, we'll rely on the real-time transcription
    // In production, you might want to use a more robust STT service
    console.log('🎤 Audio processing completed, using real-time transcription');
  };

  // Submit answer
  const submitAnswer = async () => {
    try {
      setLoading(true);
      stopTimer();
      
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
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      // Check if there's a next question
      if (result.data.nextQuestion) {
        setCurrentQuestion(result.data.nextQuestion);
        setTimeRemaining(result.data.nextQuestion.timeLimit * 60);
        setTranscription('');
        setAudioBlob(null);
        startTimer(result.data.nextQuestion.timeLimit * 60);
        
        if (result.data.nextQuestion.newRound) {
          setCurrentRound({
            ...currentRound,
            roundId: result.data.nextQuestion.roundId,
            title: result.data.nextQuestion.roundTitle
          });
        }
      } else {
        // Interview complete
        setCurrentStep('complete');
        cleanup();
        if (onComplete) {
          onComplete(result.data);
        }
      }
      
    } catch (err) {
      console.error('❌ Submit answer failed:', err);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup function
  const cleanup = () => {
    stopTimer();
    stopSpeechRecognition();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setCameraActive(false);
    setMicActive(false);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Component cleanup
  useEffect(() => {
    return () => cleanup();
  }, []);

  // Render different steps
  const renderSetup = () => (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Interview Setup
        </h2>
        
        <p className="text-gray-600 mb-8">
          This interview requires camera and microphone access for voice responses and environment validation.
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <Camera className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">Camera access for identity verification</span>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <Mic className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">Microphone for voice responses</span>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <Shield className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">Environment validation</span>
          </div>
        </div>
        
        <button
          onClick={initializeMedia}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Initializing...' : 'Start Interview Setup'}
        </button>
      </motion.div>
    </div>
  );

  const renderDeviceCheck = () => (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-6">
          <div className="p-4 bg-orange-100 rounded-full inline-block mb-4">
            <Eye className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Environment Check
          </h2>
          <p className="text-gray-600">
            Please ensure no electronic devices are visible in your camera view
          </p>
        </div>

        <div className="relative mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
          />
          {cameraActive && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Camera Active</span>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Important Guidelines</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Remove all mobile phones, tablets, and smart watches</li>
                <li>• Ensure no additional monitors or screens are visible</li>
                <li>• Keep your workspace clean and professional</li>
                <li>• Look directly at the camera when speaking</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={performDeviceCheck}
          disabled={loading || !cameraActive}
          className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Validating Environment...' : 'Validate Environment'}
        </button>
      </motion.div>
    </div>
  );

  const renderInterview = () => (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{currentRound?.title}</h2>
              <p className="text-purple-100 mt-1">
                Question {currentQuestion?.questionNumber} of {currentQuestion?.totalQuestions}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-lg font-mono">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 60 ? 'text-red-200' : ''}>{formatTime(timeRemaining)}</span>
              </div>
              <p className="text-purple-100 text-sm mt-1">Time Remaining</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Question */}
            <div>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Question:</h3>
                <p className="text-gray-700 leading-relaxed">{currentQuestion?.question}</p>
              </div>

              {/* Recording Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading || timeRemaining === 0}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:bg-gray-300`}
                  >
                    {isRecording ? (
                      <>
                        <Pause className="h-5 w-5" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Transcription */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Live Transcription:
                  </h4>
                  <p className="text-blue-800 min-h-[40px]">
                    {transcription || 'Start speaking to see your response here...'}
                  </p>
                </div>

                <button
                  onClick={submitAnswer}
                  disabled={loading || !transcription.trim() || timeRemaining === 0}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </div>

            {/* Video Feed */}
            <div>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {cameraActive && (
                    <div className="flex items-center space-x-2 bg-green-600 text-white px-2 py-1 rounded text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Live</span>
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex items-center space-x-2 bg-red-600 text-white px-2 py-1 rounded text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Recording</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Interview Guidelines:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Look at the camera when responding</li>
                  <li>• You can pause and restart recording if needed</li>
                  <li>• Submit your answer when you're satisfied</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderComplete = () => (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Interview Complete!
        </h2>
        
        <p className="text-gray-600 mb-8">
          Thank you for completing the voice interview. Your responses have been recorded and will be reviewed by our team.
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            You will be contacted regarding the next steps in the hiring process.
          </p>
        </div>
      </motion.div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 text-sm underline mt-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'setup' && renderSetup()}
          {currentStep === 'device-check' && cameraActive && renderDeviceCheck()}
          {currentStep === 'interview' && renderInterview()}
          {currentStep === 'complete' && renderComplete()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceInterviewConductor;
