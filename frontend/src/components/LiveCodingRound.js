import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Bot, 
  MessageSquare, 
  Code2, 
  Send,
  Loader2,
  Mic,
  MicOff,
  Clock,
  AlertCircle,
  ThumbsUp,
  Lightbulb,
  Volume2,
  VolumeX
} from 'lucide-react';
import EnhancedCodeEditor from './EnhancedCodeEditor';
import axios from 'axios';
import { toast } from 'react-toastify';

const LiveCodingRound = ({ 
  interviewId, 
  question, 
  language = 'javascript', 
  starterCode = '',
  onComplete,
  onError 
}) => {
  const [sessionId, setSessionId] = useState(null);
  const [code, setCode] = useState(starterCode);
  const [testCases, setTestCases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [aiComments, setAiComments] = useState([]);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [codeReview, setCodeReview] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isDone, setIsDone] = useState(false);
  
  // Voice-related state
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceAnswer, setVoiceAnswer] = useState('');
  const [currentVoiceQuestion, setCurrentVoiceQuestion] = useState('');
  const [showVoiceAnswer, setShowVoiceAnswer] = useState(false);
  
  const monitoringIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const codeUpdateTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  // Start the coding round
  useEffect(() => {
    startCodingRound();
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (sessionId && !isDone) {
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sessionId, isDone]);

  const startCodingRound = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/interviews/coding-round/start', {
        interviewId,
        question,
        language,
        starterCode
      });

      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        setTestCases(response.data.data.testCases);
        setIsMonitoring(true);
        toast.success('Coding round started! AI is monitoring your progress.');
        
        // Start live monitoring
        startLiveMonitoring(response.data.data.sessionId);
      } else {
        throw new Error(response.data.error || 'Failed to start coding round');
      }
    } catch (error) {
      console.error('Error starting coding round:', error);
      toast.error('Failed to start coding round');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const startLiveMonitoring = (sessionId) => {
    // Monitor code changes every 5 seconds
    monitoringIntervalRef.current = setInterval(() => {
      if (code.trim() && code !== starterCode) {
        monitorCodeChanges(sessionId);
      }
    }, 5000);
  };

  const monitorCodeChanges = async (sessionId) => {
    try {
      const response = await axios.post('/api/interviews/coding-round/monitor', {
        sessionId,
        code,
        question,
        language
      });

      if (response.data.success) {
        const { analysis, suggestions, questions, encouragement } = response.data.data;
        
        // Add AI comment
        const newComment = {
          id: Date.now(),
          type: 'analysis',
          content: analysis,
          suggestions,
          encouragement,
          timestamp: new Date()
        };
        
        setAiComments(prev => [...prev.slice(-4), newComment]);
        
        // Add questions if any
        if (questions && questions.length > 0) {
          setAiQuestions(prev => [...prev, ...questions.map(q => ({
            id: Date.now() + Math.random(),
            question: q,
            timestamp: new Date()
          }))]);
          
          // Automatically ask the first question as a voice question if no voice question is currently active
          if (!showVoiceAnswer && questions.length > 0) {
            const firstQuestion = questions[0];
            setCurrentVoiceQuestion(firstQuestion);
            speakQuestion(firstQuestion).then(() => {
              setShowVoiceAnswer(true);
              setVoiceAnswer('');
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in live monitoring:', error);
    }
  };

  const askAIQuestion = async () => {
    try {
      const response = await axios.post('/api/interviews/coding-round/ask-question', {
        sessionId,
        code,
        question,
        context: 'User requested AI question'
      });

      if (response.data.success) {
        const aiQuestion = response.data.data.question;
        setCurrentAiQuestion(aiQuestion);
        setCurrentVoiceQuestion(aiQuestion);
        setAiQuestions(prev => [...prev, {
          id: Date.now(),
          question: aiQuestion,
          timestamp: new Date()
        }]);
        
        // Speak the question and show voice answer interface
        await speakQuestion(aiQuestion);
        setShowVoiceAnswer(true);
        setVoiceAnswer('');
      }
    } catch (error) {
      console.error('Error asking AI question:', error);
      toast.error('Failed to get AI question');
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    
    // Debounce code monitoring
    if (codeUpdateTimeoutRef.current) {
      clearTimeout(codeUpdateTimeoutRef.current);
    }
    
    codeUpdateTimeoutRef.current = setTimeout(() => {
      if (sessionId && isMonitoring && newCode.trim() && newCode !== starterCode) {
        monitorCodeChanges(sessionId);
      }
    }, 2000);
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/interviews/coding-round/submit', {
        sessionId,
        code,
        question,
        language,
        testCases
      });

      if (response.data.success) {
        setTestResults(response.data.data.testResults);
        setCodeReview(response.data.data.review);
        setShowTestResults(true);
        setIsDone(true);
        setIsMonitoring(false);
        
        if (monitoringIntervalRef.current) {
          clearInterval(monitoringIntervalRef.current);
        }
        
        toast.success('Code submitted successfully!');
        onComplete?.(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to submit code');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Failed to submit code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      console.log('🎙️ Starting voice recording for AI question...');
      
      if (isRecording) {
        console.log('⚠️ Already recording, skipping start');
        return;
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
            setVoiceAnswer(prev => prev + finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please allow microphone access and try again.');
          } else if (event.error === 'no-speech') {
            console.log('⚠️ No speech detected, continuing...');
          } else if (event.error === 'aborted') {
            console.log('⚠️ Speech recognition aborted, this is normal');
          } else {
            toast.error('Speech recognition error: ' + event.error);
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
      toast.error(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    try {
      if (recognitionRef.current) {
        console.log('🛑 Stopping voice recording...');
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
      }
    } catch (err) {
      console.error('❌ Error stopping recording:', err);
      setIsRecording(false);
    }
  };

  // Text-to-speech function
  const speakQuestion = (questionText) => {
    return new Promise((resolve) => {
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
          resolve();
        };
        
        utterance.onerror = () => {
          setIsAISpeaking(false);
          resolve();
        };
        
        console.log('🗣️ AI speaking question:', questionText.substring(0, 50) + '...');
        setIsAISpeaking(true);
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('⚠️ Speech synthesis not supported');
        setIsAISpeaking(false);
        resolve();
      }
    });
  };

  // Handle voice answer submission
  const submitVoiceAnswer = async () => {
    if (!voiceAnswer.trim()) {
      toast.error('Please provide a voice answer before submitting');
      return;
    }

    try {
      const response = await axios.post('/api/interviews/coding-round/voice-answer', {
        sessionId,
        question: currentVoiceQuestion,
        voiceAnswer: voiceAnswer,
        code: code,
        language: language
      });

      if (response.data.success) {
        toast.success('Voice answer submitted successfully!');
        setVoiceAnswer('');
        setCurrentVoiceQuestion('');
        setShowVoiceAnswer(false);
        
        // Add the AI response to comments
        if (response.data.data.aiResponse) {
          const newComment = {
            id: Date.now(),
            type: 'voice_response',
            content: response.data.data.aiResponse,
            timestamp: new Date()
          };
          setAiComments(prev => [...prev.slice(-4), newComment]);
        }
      } else {
        throw new Error(response.data.error || 'Failed to submit voice answer');
      }
    } catch (error) {
      console.error('Error submitting voice answer:', error);
      toast.error('Failed to submit voice answer');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Starting coding round...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Code2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Live Coding Round</h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isMonitoring && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI Monitoring</span>
              </div>
            )}
            
            {!isDone && (
              <button
                onClick={handleSubmitCode}
                disabled={isSubmitting || !code.trim()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Submit Code</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Half - Code Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-white border-r border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Question</h3>
            <p className="text-gray-700 text-sm">{question}</p>
          </div>
          
          <div className="flex-1">
            <EnhancedCodeEditor
              language={language}
              starterCode={starterCode}
              onCodeChange={handleCodeChange}
              disabled={isDone}
              sessionId={sessionId}
            />
          </div>
        </div>

        {/* Right Half - AI Interviewer */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* AI Header */}
          <div className="p-4 border-b border-gray-300 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Interviewer</h3>
                {isMonitoring && (
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    Live Monitoring
                  </span>
                )}
              </div>
              
              {!isDone && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={askAIQuestion}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Ask Voice Question</span>
                  </button>
                  {isAISpeaking && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Volume2 className="h-3 w-3 animate-pulse" />
                      <span className="text-xs">Speaking...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {isMonitoring 
                ? "I'm watching your code and will ask questions about your approach"
                : "Coding session completed"
              }
            </p>
          </div>

          {/* AI Comments */}
          {aiComments.length > 0 && (
            <div className="border-b border-gray-300 bg-yellow-50 p-4 max-h-40 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800 text-sm">Live Feedback</h4>
              </div>
              <div className="space-y-2">
                {aiComments.slice(-2).map((comment) => (
                  <div key={comment.id} className="bg-white p-3 rounded border border-yellow-200">
                    <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                    {comment.suggestions && comment.suggestions.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {comment.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start space-x-1">
                              <span className="text-blue-500">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {comment.encouragement && (
                      <p className="text-xs text-green-600 font-medium">{comment.encouragement}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Questions */}
          {aiQuestions.length > 0 && (
            <div className="border-b border-gray-300 bg-purple-50 p-4 max-h-40 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold text-purple-800 text-sm">AI Questions</h4>
              </div>
              <div className="space-y-2">
                {aiQuestions.slice(-3).map((q) => (
                  <div key={q.id} className="bg-white p-3 rounded border border-purple-200">
                    <p className="text-sm text-gray-700">{q.question}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {q.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Answer Interface */}
          {showVoiceAnswer && currentVoiceQuestion && (
            <div className="border-b border-gray-300 bg-green-50 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Mic className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-green-800 text-sm">Voice Answer</h4>
                {isAISpeaking && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Volume2 className="h-3 w-3 animate-pulse" />
                    <span className="text-xs">AI Speaking...</span>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-3 rounded border border-green-200 mb-3">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Question:</strong> {currentVoiceQuestion}
                </p>
                {voiceAnswer && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Your Answer:</strong>
                    </p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                      {voiceAnswer}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {!isRecording ? (
                  <button
                    onClick={startVoiceRecording}
                    disabled={isAISpeaking}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopVoiceRecording}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <MicOff className="h-4 w-4" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {voiceAnswer.trim() && (
                  <button
                    onClick={submitVoiceAnswer}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit Answer</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowVoiceAnswer(false);
                    setVoiceAnswer('');
                    setCurrentVoiceQuestion('');
                    stopVoiceRecording();
                  }}
                  className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>

              {isRecording && (
                <div className="mt-3 flex items-center space-x-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording... Speak now</span>
                </div>
              )}
            </div>
          )}

          {/* Test Results */}
          {showTestResults && testResults.length > 0 && (
            <div className="border-b border-gray-300 bg-gray-50 p-4 max-h-40 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <h4 className="font-semibold text-gray-800 text-sm">Test Results</h4>
              </div>
              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <div key={idx} className={`p-2 rounded text-sm ${
                    result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="font-medium">Test {result.testCase}</span>
                    </div>
                    <p className="text-xs mt-1">{result.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Review */}
          {codeReview && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-3">
                <ThumbsUp className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Code Review</h4>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Score: {codeReview.overallScore}/100
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Overall Feedback</h5>
                  <p className="text-sm text-gray-600">{codeReview.feedback}</p>
                </div>
                
                {codeReview.strengths && codeReview.strengths.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {codeReview.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {codeReview.improvements && codeReview.improvements.length > 0 && (
                  <div>
                    <h5 className="font-medium text-orange-700 mb-2">Areas for Improvement</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {codeReview.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {codeReview.technicalQuestions && codeReview.technicalQuestions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">Technical Questions</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {codeReview.technicalQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isMonitoring && aiComments.length === 0 && aiQuestions.length === 0 && !codeReview && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">AI will start monitoring once you begin coding</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveCodingRound;

