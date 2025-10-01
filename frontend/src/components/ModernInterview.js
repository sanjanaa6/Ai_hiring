import React, { useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useInterviewState } from '../hooks/useInterviewState';
import { useCamera } from '../hooks/useCamera';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import InterviewSetup from './interview/InterviewSetup';
import RoundSelection from './interview/RoundSelection';
import InterviewMain from './interview/InterviewMain';
import InterviewComplete from './interview/InterviewComplete';
import aiLanguageDetectionService from '../services/aiLanguageDetectionService';
import apiService from '../services/apiService';
import ttsService from '../services/ttsService';

// Helper function to determine if a round is a coding round
const isCodingRound = (roundTitle) => {
  if (!roundTitle) return false;
  const title = roundTitle.toLowerCase();
  return title.includes('coding') || 
         title.includes('programming') ||
         (title.includes('technical') && 
          (title.includes('coding') ||
           title.includes('programming') ||
           title.includes('development') ||
           title.includes('software')));
};

const ModernInterview = ({ interviewId, candidateInfo, onComplete, onError }) => {
  const { isDarkMode } = useTheme();
  
  // Custom hooks
  const interviewState = useInterviewState();
  const camera = useCamera();
  const voiceRecording = useVoiceRecording();
  
  // Refs
  const recognitionRef = useRef(null);
  const handleAIQuestionAnswerRef = useRef(null);
  const handleVoiceRecordingCompleteForAIRef = useRef(null);

  // Destructure state and setters
  const {
    step, setStep,
    loading, setLoading,
    error, setError,
    userProgress, setUserProgress,
    currentQuestion, setCurrentQuestion,
    currentRound, setCurrentRound,
    timeRemaining, setTimeRemaining,
    isAISpeaking, setIsAISpeaking,
    questionIndex, setQuestionIndex,
    roundIndex, setRoundIndex,
    allRounds, setAllRounds,
    completedRounds, setCompletedRounds,
    networkRetryCount, setNetworkRetryCount,
    questionStartCountdown, setQuestionStartCountdown,
    isLiveCodingRound, setIsLiveCodingRound,
    isSalesRound, setIsSalesRound,
    codeAnswer, setCodeAnswer,
    selectedLanguage, setSelectedLanguage,
    isLanguageLocked, setIsLanguageLocked,
    aiDeterminedLanguage, setAiDeterminedLanguage,
    showCodeEditor, setShowCodeEditor,
    isCodeEditorFullscreen, setIsCodeEditorFullscreen,
    aiQuestions, setAiQuestions,
    currentAiQuestionIndex, setCurrentAiQuestionIndex,
    isAiQuestioning, setIsAiQuestioning,
    aiQuestionAnswers, setAiQuestionAnswers,
    interviewData, setInterviewData,
    aiQuestionMap, setAiQuestionMap,
    isCodeDone, setIsCodeDone,
    isAiQuestionAnswered, setIsAiQuestionAnswered,
    resetInterviewState
  } = interviewState;

  // Load interview data
  const loadInterviewData = useCallback(async () => {
    try {
      console.log('🔄 Loading interview data for interviewId:', interviewId);
      
      // Use apiService like the original component
      const result = await apiService.getInterview(interviewId);
      
      if (result.success) {
        setInterviewData(result.data);
        console.log('✅ Interview data loaded:', result.data);
      } else {
        throw new Error(result.error || 'Failed to load interview data');
      }
    } catch (error) {
      console.error('❌ Failed to load interview data:', error);
      setError(`Failed to load interview: ${error.message}`);
    }
  }, [interviewId, setInterviewData, setError]);

  // Load interview rounds from the interview data
  const loadInterviewRounds = useCallback(async () => {
    try {
      console.log('🔄 Loading interview rounds for interviewId:', interviewId);
      
      if (!interviewId) {
        console.log('⚠️ No interviewId provided, creating default rounds');
        const defaultRounds = [
          {
            _id: 'default-round-1',
            title: 'Technical Interview',
            description: 'Technical knowledge and problem-solving questions',
            questions: [
              {
                _id: 'q1',
                question: 'Tell me about yourself and your technical background.',
                description: 'Provide an overview of your experience and skills.'
              }
            ]
          }
        ];
        
        setAllRounds(defaultRounds);
        console.log('✅ Default rounds loaded:', defaultRounds.length);
        return;
      }

      // If we have interview data, extract rounds from it
      if (interviewData && interviewData.rounds) {
        setAllRounds(interviewData.rounds);
        console.log('✅ Interview rounds loaded from interview data:', interviewData.rounds.length);
        return;
      }

      // If no interview data yet, wait for it to be loaded
      console.log('⚠️ No interview data available yet, rounds will be loaded when data is available');
      
    } catch (error) {
      console.error('❌ Failed to load interview rounds:', error);
      setError('Failed to load interview rounds: ' + error.message);
    }
  }, [interviewId, interviewData, setAllRounds, setError]);

  // Refresh user progress
  const refreshUserProgress = useCallback(async () => {
    try {
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, skipping progress refresh');
        return;
      }

      const result = await apiService.getUserProgress();
      
      if (result.success && result.data.interviewProgress) {
        // Find progress for current interview
        const interviewProgress = result.data.interviewProgress.find(
          progress => progress.interviewId === interviewId
        );
        if (interviewProgress) {
          setUserProgress(interviewProgress);
          console.log('✅ User progress refreshed:', interviewProgress);
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh user progress:', error);
    }
  }, [interviewId, setUserProgress]);

  // Update progress
  const updateProgress = useCallback(async (roundId, questionId, status, timeSpent) => {
    try {
      console.log('📊 Updating progress:', { roundId, questionId, status, timeSpent });
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, skipping progress update');
        return;
      }

      const result = await apiService.updateInterviewProgress(interviewId, {
        roundId,
        questionId,
        status,
        timeSpent
      });
      
      if (result.success) {
        setUserProgress(result.data.progress);
        console.log('✅ Progress updated successfully');
      }
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
    }
  }, [interviewId, setUserProgress]);

  // Mark round as completed
  const markRoundCompleted = useCallback(async (roundId) => {
    try {
      console.log('🏁 Marking round as completed in backend:', roundId);
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, skipping round completion');
        return;
      }

      // Use the same approach as the original - update progress to completed
      const result = await apiService.updateInterviewProgress(interviewId, {
        roundId,
        questionId: null,
        status: 'completed',
        timeSpent: 0
      });
      
      if (result.success) {
        setCompletedRounds(prev => new Set([...prev, roundId]));
        console.log('✅ Round marked as completed');
      }
    } catch (error) {
      console.error('❌ Failed to mark round as completed:', error);
    }
  }, [interviewId, setCompletedRounds]);

  // Speak question
  const speakQuestion = useCallback(async (questionText) => {
    return new Promise(async (resolve) => {
      setIsAISpeaking(true);
      try {
        await ttsService.speak(questionText);
        console.log('🔊 Question spoken successfully');
      } catch (error) {
        console.error('❌ TTS failed:', error);
      } finally {
        setIsAISpeaking(false);
        resolve();
      }
    });
  }, [setIsAISpeaking]);

  // Move to next question
  const moveToNextQuestion = useCallback(async () => {
    try {
      console.log('⏭️ Moving to next question...');
      
      if (!currentRound || !currentRound.questions) return;

      const nextIndex = questionIndex + 1;
      
      if (nextIndex < currentRound.questions.length) {
        // Move to next question in current round
        setQuestionIndex(nextIndex);
        const nextQuestion = currentRound.questions[nextIndex];
        setCurrentQuestion(nextQuestion);
        
        // Speak the question
        if (nextQuestion.question) {
          await speakQuestion(nextQuestion.question);
        }
        
        // Clear previous answer
        voiceRecording.clearTranscription();
        setCodeAnswer('');
        
        console.log('✅ Moved to next question:', nextIndex + 1);
      } else {
        // Round completed
        console.log('🏁 Round completed, moving to round selection');
        const roundId = currentRound._id || currentRound.id;
        await markRoundCompleted(roundId);
        setStep('round-selection');
      }
    } catch (error) {
      console.error('❌ Failed to move to next question:', error);
    }
  }, [currentRound, questionIndex, setQuestionIndex, setCurrentQuestion, setStep, speakQuestion, voiceRecording.clearTranscription, setCodeAnswer, markRoundCompleted]);

  // Submit current answer
  const submitCurrentAnswer = useCallback(async (answerData = null) => {
    try {
      if (!currentQuestion || !currentRound) return;

      const roundId = currentRound._id || currentRound.id;
      const questionId = currentQuestion._id || currentQuestion.id;
      
      let answerContent = '';
      let answerType = 'text';
      let additionalData = {};

      if (isLiveCodingRound && codeAnswer.trim()) {
        answerContent = codeAnswer;
        answerType = 'code';
        
        // Include test results and execution data for coding answers
        if (answerData) {
          additionalData = {
            testResults: answerData.testResults || [],
            executionTime: answerData.executionTime || 0,
            testStats: answerData.stats || { passed: 0, total: 0, percentage: 0 },
            timestamp: answerData.timestamp || new Date()
          };
        }
      } else if (voiceRecording.transcription.trim()) {
        answerContent = voiceRecording.transcription;
        answerType = 'voice';
      }

      if (answerContent) {
        await updateProgress(roundId, questionId, 'answered', 0);
        console.log('✅ Answer submitted:', { 
          answerType, 
          answerContent, 
          additionalData 
        });
        
        // Move to next question after successful submission
        await moveToNextQuestion();
      }
    } catch (error) {
      console.error('❌ Failed to submit answer:', error);
    }
  }, [currentQuestion, currentRound, isLiveCodingRound, codeAnswer, voiceRecording.transcription, updateProgress, moveToNextQuestion]);

  // Start interview tracking
  const startInterviewTracking = useCallback(async () => {
    try {
      console.log('🚀 Starting interview tracking for:', interviewId);
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      let result;
      if (isAuthenticated) {
        // Use authenticated tracking
        result = await apiService.startInterview(interviewId);
      } else {
        // Use anonymous tracking
        result = await apiService.startInterviewAnonymous(interviewId, candidateInfo);
      }
      
      if (result.success) {
        setUserProgress(result.data.progress);
        console.log('✅ Interview tracking started');
      }
    } catch (error) {
      console.error('❌ Failed to start interview tracking:', error);
    }
  }, [interviewId, candidateInfo, setUserProgress]);

  // Handle round selection
  const handleSelectRound = useCallback(async (round) => {
    try {
      console.log('🎯 Selected round:', round);
      setCurrentRound(round);
      setQuestionIndex(0);
      
      // Determine round type
      const isCoding = isCodingRound(round.title);
      const isSales = round.title?.toLowerCase().includes('sales');
      
      setIsLiveCodingRound(isCoding);
      setIsSalesRound(isSales);
      
      // Set first question
      if (round.questions && round.questions.length > 0) {
        const firstQuestion = round.questions[0];
        setCurrentQuestion(firstQuestion);
      }
      
      setStep('interview');
      
      // Speak the question after setting the step
      if (round.questions && round.questions.length > 0 && round.questions[0].question) {
        speakQuestion(round.questions[0].question);
      }
    } catch (error) {
      console.error('❌ Failed to select round:', error);
      setError(`Failed to start round: ${error.message}`);
    }
  }, [setCurrentRound, setQuestionIndex, setIsLiveCodingRound, setIsSalesRound, setCurrentQuestion, setStep, setError, speakQuestion]);

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    try {
      setLoading(true);
      await startInterviewTracking();
      await loadInterviewRounds();
      setStep('round-selection');
    } catch (error) {
      console.error('❌ Failed to start interview:', error);
      setError(`Failed to start interview: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [startInterviewTracking, loadInterviewRounds, setStep, setError, setLoading]);

  // Handle restart interview
  const handleRestartInterview = useCallback(() => {
    resetInterviewState();
    setStep('setup');
  }, [resetInterviewState, setStep]);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('🎥 Starting camera initialization...');
        await camera.initializeCamera();
        console.log('✅ Camera initialization completed');
      } catch (error) {
        console.error('❌ Camera initialization failed:', error);
        setError('Camera access is required for the interview. Please grant camera permissions and refresh the page.');
      }
    };

    initCamera();
  }, [camera.initializeCamera, setError]);

  // Load interview data on mount
  useEffect(() => {
    if (interviewId) {
      loadInterviewData();
    }
  }, [interviewId, loadInterviewData]);

  // Load rounds when interview data is available
  useEffect(() => {
    if (interviewData && interviewData.rounds) {
      loadInterviewRounds();
    }
  }, [interviewData, loadInterviewRounds]);

  // Sync completed rounds with user progress
  useEffect(() => {
    if (userProgress && userProgress.rounds && allRounds.length > 0) {
      const completedRoundIds = new Set();
      
      userProgress.rounds.forEach(progressRound => {
        if (progressRound.status === 'completed') {
          completedRoundIds.add(progressRound.roundId);
        }
      });
      
      console.log('🔄 Syncing completed rounds:', Array.from(completedRoundIds));
      setCompletedRounds(completedRoundIds);
    }
  }, [userProgress, allRounds, setCompletedRounds]);

  // Error handling
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        <div className={`max-w-md w-full ${
          isDarkMode 
            ? 'bg-slate-800/50 backdrop-blur-md border border-red-500/30' 
            : 'bg-white/80 backdrop-blur-md border border-red-200'
        } rounded-2xl shadow-2xl p-8 text-center`}>
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Interview Error
          </h2>
          <p className={`text-lg mb-6 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isDarkMode
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate step
  switch (step) {
    case 'setup':
      return (
        <InterviewSetup
          cameraStatus={camera.cameraStatus}
          videoRef={camera.videoRef}
          onStartInterview={handleStartInterview}
          onRetryCamera={camera.restartCamera}
          isCameraRestarting={camera.isCameraRestarting}
          cameraStream={camera.cameraStream}
        />
      );

    case 'round-selection':
      return (
        <RoundSelection
          allRounds={allRounds}
          completedRounds={completedRounds}
          userProgress={userProgress}
          interviewData={interviewData}
          onSelectRound={handleSelectRound}
          loading={loading}
        />
      );

    case 'interview':
      return (
        <InterviewMain
          currentRound={currentRound}
          currentQuestion={currentQuestion}
          questionIndex={questionIndex}
          timeRemaining={timeRemaining}
          isAISpeaking={isAISpeaking}
          isRecording={voiceRecording.isRecording}
          transcription={voiceRecording.transcription}
          interimTranscription={voiceRecording.interimTranscription}
          codeAnswer={codeAnswer}
          selectedLanguage={selectedLanguage}
          isLanguageLocked={isLanguageLocked}
          showCodeEditor={showCodeEditor}
          isCodeEditorFullscreen={isCodeEditorFullscreen}
          isLiveCodingRound={isLiveCodingRound}
          isSalesRound={isSalesRound}
          isAiQuestioning={isAiQuestioning}
          aiQuestions={aiQuestions}
          currentAiQuestionIndex={currentAiQuestionIndex}
          cameraStream={camera.cameraStream}
          onStartRecording={voiceRecording.startRecording}
          onStopRecording={voiceRecording.stopRecording}
          onSkipQuestion={moveToNextQuestion}
          onNextQuestion={moveToNextQuestion}
          onSubmitAnswer={submitCurrentAnswer}
          onCodeChange={setCodeAnswer}
          onLanguageChange={setSelectedLanguage}
          onToggleCodeEditor={() => setShowCodeEditor(!showCodeEditor)}
          onToggleFullscreen={() => setIsCodeEditorFullscreen(!isCodeEditorFullscreen)}
          onToggleAISpeaking={() => setIsAISpeaking(!isAISpeaking)}
          onAnswerAIQuestion={() => {}}
          interviewData={interviewData}
        />
      );

    case 'complete':
      return (
        <InterviewComplete
          interviewData={interviewData}
          userProgress={userProgress}
          completedRounds={completedRounds}
          allRounds={allRounds}
          onRestartInterview={handleRestartInterview}
        />
      );

    default:
      return null;
  }
};

export default ModernInterview;
