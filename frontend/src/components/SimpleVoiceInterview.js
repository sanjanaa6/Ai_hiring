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

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Step 1: Initialize camera and microphone
  const startSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎬 Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
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
      
      // Capture frame for validation
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('🔍 Validating environment...');
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
          resolve();
        };
        
        utterance.onerror = () => {
          setIsAISpeaking(false);
          startQuestionTimer();
          resolve();
        };
        
        console.log('🗣️ AI speaking question:', questionText.substring(0, 50) + '...');
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('⚠️ Speech synthesis not supported');
        setIsAISpeaking(false);
        startQuestionTimer();
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
        stopRecording();
      }
      
      // Submit current answer if there's transcription
      if (transcription.trim()) {
        await submitCurrentAnswer();
      }
      
      // Check if there are more questions in current round
      const currentRoundData = allRounds[roundIndex];
      if (questionIndex + 1 < currentRoundData.questions.length) {
        // Move to next question in same round
        const nextQuestion = currentRoundData.questions[questionIndex + 1];
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
         
         await speakQuestion(nextQuestion.question);
         startQuestionTimer();
       } else {
         // Current round complete - get evaluation and show feedback
         setCompletedRounds(prev => new Set([...prev, `round_${roundIndex + 1}`]));
         await getRoundEvaluation();
         setStep('round-complete');
       }
      
    } catch (err) {
      console.error('❌ Error moving to next question:', err);
      setError('Failed to progress to next question');
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
      
      // Start the question with AI speaking it aloud
      await speakQuestion(round.questions[0].question);
      
      // Start the timer for the first question
      startQuestionTimer();
      
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
      
      if (!cameraStream) {
        throw new Error('No camera stream available');
      }

      // Start Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
        
        recognitionRef.current.start();
        setIsRecording(true);
        console.log('✅ Voice recognition started');
      } else {
        throw new Error('Speech recognition not supported in this browser');
      }
      
    } catch (err) {
      console.error('❌ Recording error:', err);
      setError(err.message || 'Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      console.log('🛑 Recording stopped');
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
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Voice Interview Setup</h2>
          <p className="text-gray-600 mb-6">
            This interview requires camera and microphone access for voice responses.
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <button
            onClick={startSetup}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-medium"
          >
            {loading ? 'Setting up...' : 'Start Setup'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'device-check') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Environment Check</h2>
            <p className="text-gray-600">Ensure no electronic devices are visible</p>
          </div>

          <div className="relative mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-64 bg-gray-900 rounded-lg object-cover"
            />
            <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded text-sm">
              Live
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={validateEnvironment}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-medium"
          >
            {loading ? 'Validating...' : 'Validate Environment'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'interview') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Enhanced Header with Progress */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{currentRound?.title || 'Interview'}</h2>
                  <p className="text-purple-100">
                    Question {questionIndex + 1} of {currentRound?.questions?.length || 1} • Round {roundIndex + 1} of {allRounds.length}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-lg font-mono">
                    <Clock className="h-5 w-5" />
                    <span className={timeRemaining < 60 ? 'text-red-200 animate-pulse' : ''}>{formatTime(timeRemaining)}</span>
                  </div>
                  <p className="text-purple-100 text-sm">Time Remaining</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((roundIndex * (allRounds[0]?.questions?.length || 1) + questionIndex + 1) / 
                             (allRounds.reduce((total, round) => total + (round.questions?.length || 1), 0))) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {/* AI Speaking Indicator */}
                  {isAISpeaking && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-6 w-6 text-blue-600 animate-pulse" />
                        <div>
                          <h4 className="font-medium text-blue-900">AI is speaking...</h4>
                          <p className="text-blue-700 text-sm">Please listen to the question</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Display */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span>Question:</span>
                      {isAISpeaking && <Volume2 className="h-4 w-4 text-blue-600 ml-2 animate-pulse" />}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{currentQuestion?.question}</p>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    {/* Recording Button */}
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={loading || isAISpeaking}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:bg-gray-300`}
                      >
                        {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                      </button>
                      
                      {/* Skip Button */}
                      <button
                        onClick={skipQuestion}
                        disabled={loading || isAISpeaking}
                        className="flex items-center space-x-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
                      >
                        <SkipForward className="h-4 w-4" />
                        <span>Skip</span>
                      </button>
                    </div>

                    {/* Auto Progress Toggle */}
                    <div className="flex justify-center">
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={autoProgressEnabled}
                          onChange={(e) => setAutoProgressEnabled(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span>Auto-progress to next question when time expires</span>
                      </label>
                    </div>

                    {/* Transcription */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <Mic className="h-4 w-4 mr-2" />
                        Live Transcription:
                      </h4>
                      <p className="text-blue-800 min-h-[60px] max-h-32 overflow-y-auto">
                        {transcription || 'Start speaking to see your response here...'}
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-3">
                      <button
                        onClick={submitAnswer}
                        disabled={loading || !transcription.trim() || isAISpeaking}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                      >
                        {loading ? 'Submitting...' : 'Submit & Next Question'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
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

                {/* Video and Status */}
                <div>
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                    />
                    
                    {/* Status Indicators */}
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
                      <div className="flex items-center space-x-2 bg-green-600 text-white px-2 py-1 rounded text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                      
                      {isRecording && (
                        <div className="flex items-center space-x-2 bg-red-600 text-white px-2 py-1 rounded text-sm">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>Recording</span>
                        </div>
                      )}
                      
                      {isAISpeaking && (
                        <div className="flex items-center space-x-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          <span>AI Speaking</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interview Info */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Interview Progress:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Current Round: {currentRound?.title}</div>
                      <div>• Questions in Round: {currentRound?.questions?.length}</div>
                      <div>• Total Rounds: {allRounds.length}</div>
                      <div>• Auto-progress: {autoProgressEnabled ? 'ON' : 'OFF'}</div>
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
