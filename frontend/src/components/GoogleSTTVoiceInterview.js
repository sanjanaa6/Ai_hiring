import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import useGoogleSTT from '../hooks/useGoogleSTT';
import ttsService from '../services/ttsService';

const GoogleSTTVoiceInterview = ({ 
  interviewId, 
  candidateInfo, 
  onComplete, 
  onError,
  questions = [],
  autoProgressEnabled = true
}) => {
  const { isDarkMode } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSTTStatus, setShowSTTStatus] = useState(false);
  const [sttHealth, setSttHealth] = useState(null);
  
  const speakQuestionRef = useRef(null);
  const currentQuestion = questions[currentQuestionIndex];

  // Google STT hook
  const {
    isRecording,
    transcription,
    interimTranscription,
    isTranscribing,
    error: sttError,
    confidence,
    startRecording,
    stopRecording,
    clearTranscription,
    forceStop,
    checkHealth,
    getSupportedLanguages
  } = useGoogleSTT({
    language: 'en-US',
    enablePunctuation: true,
    model: 'default',
    useEnhanced: true,
    continuousMode: true,
    autoTranscribeInterval: 3000,
    onTranscription: handleTranscription,
    onError: handleSTTError,
    onRecordingStart: () => console.log('🎤 Google STT recording started'),
    onRecordingStop: () => console.log('🛑 Google STT recording stopped')
  });

  // Check STT health on component mount
  useEffect(() => {
    checkSTTHealth();
  }, []);

  const checkSTTHealth = async () => {
    try {
      const health = await checkHealth();
      setSttHealth(health);
      console.log('🏥 [STT Health]', health);
    } catch (error) {
      console.error('❌ [STT Health] Check failed:', error);
      setSttHealth({ success: false, error: error.message });
    }
  };

  const handleSTTError = (error) => {
    console.error('❌ [Google STT] Error:', error);
    setError(`Speech recognition error: ${error.message || error}`);
  };

  const handleTranscription = (transcript, confidence) => {
    console.log('📝 [Google STT] New transcription:', transcript);
    console.log('🎯 [Google STT] Confidence:', confidence);
    
    // Auto-submit answer if confidence is high and transcript is substantial
    if (confidence > 0.8 && transcript.length > 10) {
      setTimeout(() => {
        handleAnswerSubmit(transcript);
      }, 1000);
    }
  };

  const handleAnswerSubmit = useCallback(async (answerText) => {
    if (!answerText || !answerText.trim()) {
      console.log('⚠️ No answer text to submit');
      return;
    }

    try {
      console.log('📝 Submitting answer:', answerText);
      
      const answer = {
        questionId: currentQuestion?.id || `q${currentQuestionIndex}`,
        question: currentQuestion?.question || `Question ${currentQuestionIndex + 1}`,
        answer: answerText.trim(),
        timestamp: new Date().toISOString(),
        confidence: confidence,
        type: 'voice',
        sttService: 'google'
      };

      setAnswers(prev => [...prev, answer]);
      clearTranscription();

      // Auto-progress to next question
      if (autoProgressEnabled && currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          moveToNextQuestion();
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setError('Failed to submit answer');
    }
  }, [currentQuestion, currentQuestionIndex, confidence, autoProgressEnabled, questions.length, clearTranscription]);

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      clearTranscription();
    } else {
      // Interview completed
      handleInterviewComplete();
    }
  }, [currentQuestionIndex, questions.length, clearTranscription]);

  const handleInterviewComplete = useCallback(() => {
    console.log('✅ Interview completed');
    if (onComplete) {
      onComplete({
        answers,
        totalQuestions: questions.length,
        completedAt: new Date().toISOString()
      });
    }
  }, [answers, questions.length, onComplete]);

  const speakQuestion = useCallback(async (questionText) => {
    if (!questionText) return;

    return new Promise(async (resolve) => {
      const handleSpeechEnd = () => {
        setIsSpeaking(false);
        console.log('🗣️ AI finished speaking question');
        resolve();
      };

      try {
        console.log('🗣️ AI speaking question using Google TTS:', questionText.substring(0, 50) + '...');
        setIsSpeaking(true);

        await ttsService.speak(questionText, {
          language: 'en',
          speed: 0.9,
          pitch: 1.0,
          emotion: 'neutral'
        });

        console.log('✅ AI finished speaking question with Google TTS');
        handleSpeechEnd();

      } catch (error) {
        console.error('❌ Error with Google TTS:', error);
        console.log('⚠️ Google TTS failed, continuing without speech');
        handleSpeechEnd();
      }
    });
  }, []);

  const handleStartRecording = async () => {
    try {
      setError(null);
      await startRecording();
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      setError('Failed to stop recording.');
    }
  };

  const handleManualSubmit = () => {
    if (transcription.trim()) {
      handleAnswerSubmit(transcription);
    }
  };

  const handleSkipQuestion = () => {
    const answer = {
      questionId: currentQuestion?.id || `q${currentQuestionIndex}`,
      question: currentQuestion?.question || `Question ${currentQuestionIndex + 1}`,
      answer: '[SKIPPED]',
      timestamp: new Date().toISOString(),
      type: 'skipped'
    };

    setAnswers(prev => [...prev, answer]);
    clearTranscription();
    moveToNextQuestion();
  };

  const handleRetrySTT = async () => {
    await checkSTTHealth();
    if (sttHealth?.success) {
      setError(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
            Loading interview...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Voice Interview with Google STT</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          
          {/* STT Status */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setShowSTTStatus(!showSTTStatus)}
              className={`px-3 py-1 rounded text-xs ${
                sttHealth?.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              STT: {sttHealth?.success ? 'Healthy' : 'Error'}
            </button>
            
            {sttHealth?.success && (
              <span className="text-xs text-gray-500">
                Confidence: {confidence ? Math.round(confidence * 100) : 0}%
              </span>
            )}
          </div>

          {showSTTStatus && (
            <div className={`mt-2 p-3 rounded text-xs ${
              sttHealth?.success 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <p><strong>Status:</strong> {sttHealth?.success ? 'Connected' : 'Disconnected'}</p>
              {sttHealth?.error && <p><strong>Error:</strong> {sttHealth.error}</p>}
              <button
                onClick={handleRetrySTT}
                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Current Question */}
        {currentQuestion && (
          <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className="text-xl font-semibold mb-4">Question {currentQuestionIndex + 1}</h2>
            <p className="text-lg mb-4">{currentQuestion.question}</p>
            
            {/* Speak Question Button */}
            <button
              onClick={() => speakQuestion(currentQuestion.question)}
              disabled={isSpeaking}
              className={`px-4 py-2 rounded mr-2 ${
                isSpeaking 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isSpeaking ? 'Speaking...' : '🔊 Speak Question'}
            </button>
          </div>
        )}

        {/* Recording Section */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className="text-lg font-semibold mb-4">Your Response</h3>
          
          {/* Recording Controls */}
          <div className="flex items-center gap-4 mb-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={!sttHealth?.success || isTranscribing}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  !sttHealth?.success || isTranscribing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                {isTranscribing ? 'Processing...' : '🎤 Start Recording'}
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
              >
                🛑 Stop Recording
              </button>
            )}

            <button
              onClick={handleManualSubmit}
              disabled={!transcription.trim()}
              className={`px-4 py-2 rounded ${
                !transcription.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              Submit Answer
            </button>

            <button
              onClick={handleSkipQuestion}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Skip Question
            </button>
          </div>

          {/* Transcription Display */}
          <div className={`p-4 rounded border-2 ${
            isRecording 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="mb-2">
              <strong>Final Transcription:</strong>
              <p className={`mt-1 ${transcription ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                {transcription || 'No transcription yet...'}
              </p>
            </div>
            
            {interimTranscription && (
              <div>
                <strong>Live Transcription:</strong>
                <p className="mt-1 text-blue-600 italic">{interimTranscription}</p>
              </div>
            )}

            {isRecording && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600">Recording...</span>
              </div>
            )}

            {isTranscribing && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600">Processing...</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <p><strong>Error:</strong> {error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {sttError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <p><strong>STT Error:</strong> {sttError}</p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h4 className="font-semibold mb-2">Progress</h4>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {answers.length} answers submitted
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleSTTVoiceInterview;
