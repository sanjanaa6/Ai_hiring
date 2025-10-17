import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useInterviewState } from '../hooks/useInterviewState';
import { useCamera } from '../hooks/useCamera';
import { useEyeTracking } from '../hooks/useEyeTracking';
import InterviewSetup from './interview/InterviewSetup';
import RoundSelection from './interview/RoundSelection';
import InterviewMain from './interview/InterviewMain';
import InterviewComplete from './interview/InterviewComplete';
import FileUploadRound from './FileUploadRound';
import FormSubmissionRound from './FormSubmissionRound';
import PCBInterviewInterface from './PCBInterviewInterface';
import ConversationalSalesRound from './interview/ConversationalSalesRound';
import EyeTrackingMonitor from './EyeTrackingMonitor';
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
  const eyeTracking = useEyeTracking(interviewId);
  
  // Voice recording with Web Speech API (fallback)
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscription, setInterimTranscription] = useState('');
  const recognitionRef = useRef(null);

  const startRecording = useCallback(() => {
    try {
      console.log('🎤 Starting voice recording...');
      
      // Check if browser supports Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('Your browser does not support speech recognition. Please use Chrome or Edge.');
        return;
      }

      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let interimText = '';
          let finalText = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += transcript + ' ';
            } else {
              interimText += transcript;
            }
          }

          if (finalText) {
            setTranscription(prev => prev + finalText);
            console.log('📝 Final transcript:', finalText);
          }
          
          setInterimTranscription(interimText);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          console.log('🛑 Speech recognition ended');
          if (isRecording) {
            // Restart if still supposed to be recording
            recognitionRef.current.start();
          }
        };
      }

      recognitionRef.current.start();
      setIsRecording(true);
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      alert('Failed to start recording: ' + error.message);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    try {
      console.log('🛑 Stopping voice recording...');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setInterimTranscription('');
      console.log('✅ Recording stopped');
      console.log('📝 Final transcription:', transcription);
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
    }
  }, [transcription]);

  const clearTranscription = useCallback(() => {
    setTranscription('');
    setInterimTranscription('');
  }, []);

  const voiceRecording = {
    isRecording,
    transcription,
    interimTranscription,
    startRecording,
    stopRecording,
    clearTranscription
  };
  
  const interviewRecording = {
    isSupported: false,
    isRecording: false,
    startRecording: () => {},
    stopRecording: () => {}
  };
  
  // Ref to track camera initialization
  const cameraInitialized = useRef(false);
  
  // Refs - commented out unused refs
  // const recognitionRef = useRef(null);
  // const handleAIQuestionAnswerRef = useRef(null);
  // const handleVoiceRecordingCompleteForAIRef = useRef(null);

  // Destructure state and setters
  const {
    step, setStep,
    loading, setLoading,
    error, setError,
    userProgress, setUserProgress,
    currentQuestion, setCurrentQuestion,
    currentRound, setCurrentRound,
    timeRemaining, // setTimeRemaining,
    isAISpeaking, setIsAISpeaking,
    questionIndex, setQuestionIndex,
    // roundIndex, setRoundIndex,
    allRounds, setAllRounds,
    completedRounds, setCompletedRounds,
    // networkRetryCount, setNetworkRetryCount,
    // questionStartCountdown, setQuestionStartCountdown,
    isLiveCodingRound, setIsLiveCodingRound,
    isSalesRound, setIsSalesRound,
    setIsPCBRound,
    isSystemDesignRound, setIsSystemDesignRound,
    codeAnswer, setCodeAnswer,
    selectedLanguage, setSelectedLanguage,
    isLanguageLocked, setIsLanguageLocked,
    aiDeterminedLanguage, setAiDeterminedLanguage,
    showCodeEditor, setShowCodeEditor,
    isCodeEditorFullscreen, setIsCodeEditorFullscreen,
    // aiQuestions, setAiQuestions,
    // currentAiQuestionIndex, setCurrentAiQuestionIndex,
    // isAiQuestioning, setIsAiQuestioning,
    // aiQuestionAnswers, setAiQuestionAnswers,
    interviewData, setInterviewData,
    // aiQuestionMap, setAiQuestionMap,
    // isCodeDone, setIsCodeDone,
    // isAiQuestionAnswered, setIsAiQuestionAnswered,
    personDetectionWarning, setPersonDetectionWarning,
    resetInterviewState
  } = interviewState;

  // Load interview data
  const loadInterviewData = useCallback(async () => {
    try {
      console.log('🔄 Loading interview data for interviewId:', interviewId);
      
      let result;
      
      // Check if this is an Electronics interview by ID pattern
      if (interviewId.startsWith('electronics_interview_')) {
        console.log('Detected Electronics interview, using Electronics service...');
        const { default: electronicsInterviewService } = await import('../services/electronicsInterviewService');
        result = await electronicsInterviewService.getElectronicsInterview(interviewId);
        result = { success: true, data: result };
      } else {
        console.log('Using regular interview API...');
        result = await apiService.getInterview(interviewId);
      }
      
      if (result.success) {
        setInterviewData(result.data);
        console.log('✅ Interview data loaded:', result.data);
        console.log('🔍 Interview type:', result.data.interviewType);
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

  // Refresh user progress - commented out unused function
  // const refreshUserProgress = useCallback(async () => {
  //   try {
  //     const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
  //     if (!isAuthenticated) {
  //       console.log('🔒 User not authenticated, skipping progress refresh');
  //       return;
  //     }

  //     const result = await apiService.getUserProgress();
      
  //     if (result.success && result.data.interviewProgress) {
  //       // Find progress for current interview
  //       const interviewProgress = result.data.interviewProgress.find(
  //         progress => progress.interviewId === interviewId
  //       );
  //       if (interviewProgress) {
  //         setUserProgress(interviewProgress);
  //         console.log('✅ User progress refreshed:', interviewProgress);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('❌ Failed to refresh user progress:', error);
  //   }
  // }, [interviewId, setUserProgress]);

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
        // For anonymous users, just update local state
        setCompletedRounds(prev => new Set([...prev, roundId]));
        return;
      }

      // Mark all questions in the round as answered to trigger round completion
      const currentRound = allRounds.find(r => (r._id || r.id || r.roundId) === roundId);
      if (currentRound && currentRound.questions) {
        // Mark each question as answered
        for (const question of currentRound.questions) {
          await apiService.updateInterviewProgress(interviewId, {
            roundId,
            questionId: question._id || question.id,
            status: 'answered',
            timeSpent: 0
          });
        }
      }
      
      // Update local state immediately
      setCompletedRounds(prev => new Set([...prev, roundId]));
      
      // Also store in localStorage as backup
      const storageKey = `completedRounds_${interviewId}`;
      const storedRounds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!storedRounds.includes(roundId)) {
        storedRounds.push(roundId);
        localStorage.setItem(storageKey, JSON.stringify(storedRounds));
      }
      
      console.log('✅ Round marked as completed');
    } catch (error) {
      console.error('❌ Failed to mark round as completed:', error);
      // Even if backend fails, update local state to prevent UI issues
      setCompletedRounds(prev => new Set([...prev, roundId]));
    }
  }, [interviewId, allRounds, setCompletedRounds]);

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
        
        // Check if this is a PCB round (only for electronics interviews)
        const isElectronicsInterview = interviewData?.interviewType === 'electronics';
        console.log('🔍 PCB Detection Debug:', {
          interviewType: interviewData?.interviewType,
          isElectronicsInterview,
          roundNumber: currentRound.roundNumber,
          roundTitle: currentRound.title,
          hasPCBQuestions: currentRound.questions?.some(q => q.type === 'pcb-design' || q.pcbDesign?.enabled)
        });
        
        const isCurrentRoundPCB = isElectronicsInterview && (
                                 currentRound.roundNumber === 3 || 
                                 currentRound.roundNumber === 4 ||
                                 currentRound.title?.toLowerCase().includes('pcb') || 
                                 currentRound.title?.toLowerCase().includes('design') ||
                                 currentRound.questions?.some(q => q.type === 'pcb-design' || q.pcbDesign?.enabled)
                                 );
        
        console.log('🔍 PCB Round Detection Result:', isCurrentRoundPCB);
        
        if (isCurrentRoundPCB) {
          setStep('pcb-round');
          setIsPCBRound(true);
        } else {
          setStep('interview');
          setIsPCBRound(false);
        }
        
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
        const roundId = currentRound._id || currentRound.id || currentRound.roundId;
        await markRoundCompleted(roundId);
        setStep('round-selection');
      }
    } catch (error) {
      console.error('❌ Failed to move to next question:', error);
    }
  }, [currentRound, questionIndex, setQuestionIndex, setCurrentQuestion, setStep, setIsPCBRound, speakQuestion, voiceRecording, setCodeAnswer, markRoundCompleted]);

  // Submit current answer
  const submitCurrentAnswer = useCallback(async (answerData = null) => {
    try {
      console.log('🔍 [SUBMIT] submitCurrentAnswer called');
      console.log('🔍 [SUBMIT] currentQuestion:', currentQuestion?.question);
      console.log('🔍 [SUBMIT] currentRound:', currentRound?.title);
      
      if (!currentQuestion || !currentRound) {
        console.log('⚠️ [SUBMIT] Missing currentQuestion or currentRound, skipping submission');
        return;
      }

      // CRITICAL: Use roundId (like "round_1") not MongoDB _id
      const roundId = currentRound.roundId || currentRound.id || currentRound._id;
      const questionId = currentQuestion.id || currentQuestion._id;
      
      console.log('🔍 [SUBMIT] Using roundId:', roundId);
      console.log('🔍 [SUBMIT] Using questionId:', questionId);
      
      let answerContent = '';
      let answerType = 'text';
      let additionalData = {};

      console.log('🔍 [SUBMIT] Checking answer sources...');
      console.log('🔍 [SUBMIT] isLiveCodingRound:', isLiveCodingRound);
      console.log('🔍 [SUBMIT] codeAnswer length:', codeAnswer?.length || 0);
      console.log('🔍 [SUBMIT] voiceRecording.transcription length:', voiceRecording.transcription?.length || 0);

      if (answerData && (answerData.pcbDesignData || answerData.designNotes)) {
        // PCB Round submission - always submit even if no JSON uploaded
        answerContent = answerData.designNotes || 'PCB Design submitted (no explanation provided)';
        answerType = 'pcb_design';
        console.log('✅ [SUBMIT] Using PCB design answer');
        console.log('📋 [SUBMIT] PCB Design Notes:', answerData.designNotes);
        console.log('📋 [SUBMIT] PCB Design Data:', answerData.pcbDesignData ? 'Present' : 'Not uploaded');
        
        additionalData = {
          pcbDesignData: answerData.pcbDesignData || null,
          designNotes: answerData.designNotes || '',
          timeSpent: answerData.timeSpent || 0,
          submittedAt: answerData.submittedAt || new Date().toISOString()
        };
      } else if (isLiveCodingRound && codeAnswer.trim()) {
        answerContent = codeAnswer;
        answerType = 'code';
        console.log('✅ [SUBMIT] Using code answer');
        
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
        console.log('✅ [SUBMIT] Using voice transcription');
      } else {
        console.log('⚠️ [SUBMIT] No answer content found! Not submitting.');
      }

      console.log('🔍 [SUBMIT] Final answerContent length:', answerContent.length);

      if (answerContent) {
        // Get candidate info - CRITICAL: Use same ID throughout interview
        let candidateId = candidateInfo?.id || localStorage.getItem('candidateId');
        
        // Only generate new ID if none exists
        if (!candidateId) {
          candidateId = `candidate_${Date.now()}`;
          localStorage.setItem('candidateId', candidateId);
          console.log('🆔 Generated new candidate ID:', candidateId);
        }
        
        const candidateName = candidateInfo?.name || localStorage.getItem('candidateName') || 'Anonymous';
        const candidateEmail = candidateInfo?.email || localStorage.getItem('candidateEmail') || 'anonymous@example.com';
        
        console.log('🔍 [SUBMIT] Using candidate ID:', candidateId);

        // Submit answer to backend
        console.log('📤 Submitting answer to backend...');
        const submitResult = await apiService.submitAnswer(interviewId, {
          candidateId,
          candidateName,
          candidateEmail,
          roundId,
          questionId,
          question: currentQuestion.question,
          answer: answerContent,
          answerType,
          timeTaken: 0, // You can track this if needed
          ...additionalData
        });

        if (submitResult.success) {
          console.log('✅ Answer submitted successfully to backend');
        } else {
          console.error('❌ Failed to submit answer to backend:', submitResult.error);
        }

        // Update progress
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
  }, [currentQuestion, currentRound, isLiveCodingRound, codeAnswer, voiceRecording.transcription, candidateInfo, interviewId, updateProgress, moveToNextQuestion]);

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
      const isSales = round.title?.toLowerCase().includes('sales') && 
                     (round.title?.toLowerCase().includes('role-play') || 
                      round.title?.toLowerCase().includes('roleplay') ||
                      round.roundNumber === 3); // Specifically Round 3 for sales role-play
      const isFileUpload = round.type === 'file_upload';
      const isFormSubmission = round.type === 'form_submission';
      const isSystemDesign = round.type === 'system_design';
      
      // Check if this is a PCB round (only for electronics interviews)
      const isElectronicsInterview = interviewData?.interviewType === 'electronics';
      console.log('🔍 Round Selection PCB Detection Debug:', {
        interviewType: interviewData?.interviewType,
        isElectronicsInterview,
        roundNumber: round.roundNumber,
        roundTitle: round.title,
        hasPCBQuestions: round.questions?.some(q => q.type === 'pcb-design' || q.pcbDesign?.enabled)
      });
      
      const isPCB = isElectronicsInterview && (
                   round.roundNumber === 3 || 
                   round.roundNumber === 4 ||
                   round.title?.toLowerCase().includes('pcb') || 
                   round.title?.toLowerCase().includes('design') ||
                   round.questions?.some(q => q.type === 'pcb-design' || q.pcbDesign?.enabled)
                   );
      
      console.log('🔍 Round Selection PCB Detection Result:', isPCB);
      
      setIsLiveCodingRound(isCoding);
      setIsSalesRound(isSales);
      setIsPCBRound(isPCB);
      
      // AI Language Detection for coding rounds
      if (isCoding) {
        try {
          console.log('🤖 Detecting language from round prompt...');
          const promptText = `${round.title || ''} ${round.description || ''} ${round.questions?.[0]?.question || ''}`;
          
          const detectionResult = await aiLanguageDetectionService.detectLanguageFromJobDescription(
            promptText,
            round.title || 'Coding Interview'
          );
          
          if (detectionResult && detectionResult.language) {
            console.log('🤖 Language detected and suggested:', detectionResult.language);
            setSelectedLanguage(detectionResult.language);
            setIsLanguageLocked(false); // Allow user to change language
            setAiDeterminedLanguage(detectionResult.language);
          }
        } catch (error) {
          console.error('❌ Language detection failed:', error);
          // Fallback to default language
          setSelectedLanguage('javascript');
          setIsLanguageLocked(false); // Allow user to change language
        }
      }
      
      // If this round is already completed and retake not allowed, auto-advance to next available round
      const roundId = round._id || round.id || round.roundId;
      const isAlreadyCompleted = completedRounds.has(roundId);
      const allowRetake = !!round.allowRetake;
      if (isAlreadyCompleted && !allowRetake) {
        const currentIndex = allRounds.findIndex(r => (r._id || r.id || r.roundId) === roundId);
        const nextRound = currentIndex >= 0 ? allRounds[currentIndex + 1] : null;
        if (nextRound) {
          console.log('⏭️ Current round already completed; moving to next round.');
          // Recurse to select the next round
          return handleSelectRound(nextRound);
        }
        // No next round available; mark complete
        setStep('complete');
        return;
      }

      // Handle different round types
      if (isSystemDesign) {
        // System Design rounds work like regular interview rounds with TTS + Canvas button
        console.log('🎨 [SYSTEM DESIGN] Detected system_design round with', round.questions?.length || 0, 'questions');
        setStep('interview'); // Use regular interview flow
        setIsSystemDesignRound(true); // Flag to show canvas button instead of answer input
        
        if (round.questions && round.questions.length > 0) {
          const firstQuestion = round.questions[0];
          setCurrentQuestion(firstQuestion);
        }
      } else if (isFileUpload) {
        setStep('file-upload');
      } else if (isFormSubmission) {
        setStep('form-submission');
      } else {
        // Set first question for interview rounds
        if (round.questions && round.questions.length > 0) {
          const firstQuestion = round.questions[0];
          setCurrentQuestion(firstQuestion);
          
          // Check if this is a PCB round (Round 3 is completely PCB)
          if (isPCB) {
            setStep('pcb-round');
            setIsPCBRound(true);
          } else {
            setStep('interview');
            setIsPCBRound(false);
          }
        } else {
          setStep('interview');
        }
        
        // Speak the question after setting the step
        if (round.questions && round.questions.length > 0 && round.questions[0].question) {
          speakQuestion(round.questions[0].question);
        }
      }
    } catch (error) {
      console.error('❌ Failed to select round:', error);
      setError(`Failed to start round: ${error.message}`);
    }
  }, [setCurrentRound, setQuestionIndex, setIsLiveCodingRound, setIsSalesRound, setIsPCBRound, setCurrentQuestion, setStep, setError, speakQuestion, setSelectedLanguage, setIsLanguageLocked, setAiDeterminedLanguage, allRounds, completedRounds]);

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if camera is available and person is detected
      if (camera.cameraStatus === 'connected' || camera.cameraStatus === 'playing') {
        if (!eyeTracking.faceDetected) {
          console.log('⚠️ Cannot start interview - no person detected in camera');
          setError('Please position yourself in front of the camera. Person detection is required to start the interview.');
          setLoading(false);
          return;
        }
      } else {
        console.log('⚠️ Camera not available, but allowing interview to proceed for testing');
      }
      
      await startInterviewTracking();
      await loadInterviewRounds();
      
      // Start recording when interview begins
      if (interviewRecording.isSupported && !interviewRecording.isRecording) {
        console.log('🎥 [MODERN INTERVIEW] Starting interview recording...');
        await interviewRecording.startRecording();
      }
      
      setStep('round-selection');
    } catch (error) {
      console.error('❌ Failed to start interview:', error);
      setError(`Failed to start interview: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [startInterviewTracking, loadInterviewRounds, setStep, setError, setLoading, camera.cameraStatus, eyeTracking.faceDetected, interviewRecording]);

  // Handle restart interview
  const handleRestartInterview = useCallback(() => {
    resetInterviewState();
    eyeTracking.stopAllTracking();
    eyeTracking.resetViolations();
    setStep('setup');
  }, [resetInterviewState, setStep, eyeTracking]);

  // Handle retake specific round
  const handleRetakeRound = useCallback((round) => {
    // Remove the specific round from completed rounds
    const roundId = round._id || round.id || round.roundId;
    setCompletedRounds(prev => {
      const newSet = new Set(prev);
      newSet.delete(roundId);
      return newSet;
    });
    
    // Update user progress to mark this round as not completed
    setUserProgress(prev => {
      if (!prev) return prev;
      
      const updatedRounds = prev.rounds.map(r => 
        r.roundId === roundId 
          ? { ...r, status: 'pending', completedAt: null }
          : r
      );
      
      return {
        ...prev,
        rounds: updatedRounds,
        progress: {
          ...prev.progress,
          completedRounds: Math.max(0, prev.progress.completedRounds - 1)
        }
      };
    });
    
    // Clear localStorage for this specific round
    const storageKey = `completedRounds_${interviewId}`;
    const storedRounds = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedStoredRounds = storedRounds.filter(id => id !== roundId);
    localStorage.setItem(storageKey, JSON.stringify(updatedStoredRounds));
    
    // Go back to round selection
    setStep('round-selection');
  }, [interviewId, setCompletedRounds, setStep, setUserProgress]);

  // Handle user removal due to violations
  const handleRemoveUser = useCallback(() => {
    console.log('🚨 Removing user from interview due to violations');
    setError('Interview terminated due to multiple violations. Please contact support if you believe this is an error.');
    eyeTracking.stopAllTracking();
    eyeTracking.resetViolations(); // Reset violations when removing user
  }, [setError, eyeTracking]);


  // Initialize camera on mount
  useEffect(() => {
    if (cameraInitialized.current) return;
    
    const initCamera = async () => {
      try {
        console.log('🎥 Starting camera initialization...');
        cameraInitialized.current = true;
        await camera.initializeCamera();
        console.log('✅ Camera initialization completed');
        
        // Start face detection once camera is ready
        if (camera.videoRef.current) {
          console.log('📹 Starting face detection after camera init...');
          console.log('📹 Video ref:', camera.videoRef.current);
          eyeTracking.startFaceDetection(camera.videoRef.current);
        }
      } catch (error) {
        console.error('❌ Camera initialization failed:', error);
        cameraInitialized.current = false; // Reset on error
        // Don't set error - allow interview to continue without camera
        console.log('⚠️ Camera unavailable, continuing interview without camera monitoring');
      }
    };

    initCamera();
  }, [camera, setError, eyeTracking]);

  // Try to reconnect camera periodically if it's offline
  useEffect(() => {
    if (step !== 'interview') return;

    const reconnectCamera = async () => {
      if (camera.cameraStatus === 'error' || camera.cameraStatus === 'stopped') {
        try {
          console.log('🔄 Attempting to reconnect camera...');
          await camera.restartCamera();
          console.log('✅ Camera reconnected successfully');
          
          // Restart face detection after reconnection
          if (camera.videoRef.current) {
            eyeTracking.startFaceDetection(camera.videoRef.current);
          }
        } catch (error) {
          console.log('⚠️ Camera reconnection failed, continuing without camera');
        }
      }
    };

    // Try to reconnect every 30 seconds if camera is offline
    const reconnectInterval = setInterval(reconnectCamera, 30000);

    return () => clearInterval(reconnectInterval);
  }, [step, camera, eyeTracking]);

  // Start eye tracking when interview is active AND face is detected
  useEffect(() => {
    if (step === 'interview' && !eyeTracking.isTracking && !error && eyeTracking.faceDetected) {
      console.log('🎯 Starting eye tracking - person detected');
      eyeTracking.startTracking();
    } else if (step === 'interview' && !eyeTracking.faceDetected) {
      console.log('⚠️ Cannot start eye tracking - no person detected in camera');
    }
  }, [step, eyeTracking.isTracking, eyeTracking.faceDetected, eyeTracking, error]);

  // Ensure face detection continues during interview
  useEffect(() => {
    console.log('🔍 Face detection restart effect triggered:', { 
      step, 
      hasVideoRef: !!camera.videoRef.current, 
      isFaceDetectionRunning: eyeTracking.isFaceDetectionRunning() 
    });
    
    if (step === 'interview' && camera.videoRef.current && !eyeTracking.isFaceDetectionRunning()) {
      console.log('🔄 Restarting face detection for interview');
      console.log('📹 Video ref:', camera.videoRef.current);
      eyeTracking.startFaceDetection(camera.videoRef.current);
    }
  }, [step, camera.videoRef, eyeTracking]);

  // Continuous person detection monitoring during interview - every 5 seconds
  useEffect(() => {
    console.log('🔍 Monitoring effect triggered:', { step, faceDetected: eyeTracking.faceDetected, cameraStatus: camera.cameraStatus });
    
    if (step !== 'interview') {
      console.log('❌ Not in interview step, clearing warning');
      setPersonDetectionWarning(false);
      return;
    }

    console.log('👤 Starting continuous person detection monitoring during interview...');
    
    // Initial check
    const checkPersonDetection = () => {
      console.log('🔄 Checking person detection during interview...');
      console.log('📊 Current state:', {
        cameraStatus: camera.cameraStatus,
        faceDetected: eyeTracking.faceDetected,
        isFaceDetectionRunning: eyeTracking.isFaceDetectionRunning()
      });
      
      if (camera.cameraStatus === 'connected' || camera.cameraStatus === 'playing') {
        if (!eyeTracking.faceDetected) {
          console.log('⚠️ No person detected during interview - showing warning');
          setPersonDetectionWarning(true);
        } else {
          console.log('✅ Person detected during interview');
          setPersonDetectionWarning(false);
        }
      } else {
        console.log('⚠️ Camera not available during interview');
        setPersonDetectionWarning(true);
      }
    };

    // Run initial check
    console.log('🚀 Running initial person detection check...');
    checkPersonDetection();

    // Set up 5-second monitoring interval
    console.log('⏰ Setting up 5-second monitoring interval...');
    const monitoringInterval = setInterval(() => {
      console.log('⏰ 5-second interval triggered - checking person detection...');
      checkPersonDetection();
    }, 5000);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up person detection monitoring...');
      clearInterval(monitoringInterval);
      setPersonDetectionWarning(false);
    };
  }, [step, eyeTracking.faceDetected, camera.cameraStatus, setPersonDetectionWarning, eyeTracking]);

  // Test function to manually trigger warning (temporary)
  const testWarning = () => {
    console.log('🚨 Test warning triggered manually');
    setPersonDetectionWarning(true);
    setTimeout(() => {
      console.log('🚨 Test warning cleared after 3 seconds');
      setPersonDetectionWarning(false);
    }, 3000);
  };

  // Debug effect to track warning state changes
  useEffect(() => {
    console.log('🚨 Person detection warning state changed:', personDetectionWarning);
  }, [personDetectionWarning]);

  // Load interview data on mount
  useEffect(() => {
    if (interviewId) {
      loadInterviewData();
    }
  }, [interviewId, loadInterviewData]);

  // Set language based on interview data
  useEffect(() => {
    if (interviewData) {
      console.log('🔍 Interview data loaded:', interviewData);
      
      // Check if interview has a specific language set
      if (interviewData.language) {
        setSelectedLanguage(interviewData.language);
        setIsLanguageLocked(true);
        console.log('🔒 Language locked to (interview level):', interviewData.language);
      } else {
        // Check if any coding questions specify a language
        const codingQuestions = interviewData.rounds?.flatMap(round => 
          round.questions?.filter(q => q.codeEditor?.enabled) || []
        ) || [];
        
        console.log('🔍 Found coding questions:', codingQuestions.length);
        
        if (codingQuestions.length > 0) {
          const firstCodingQuestion = codingQuestions[0];
          console.log('🔍 First coding question:', firstCodingQuestion);
          
          if (firstCodingQuestion.codeEditor?.language) {
            setSelectedLanguage(firstCodingQuestion.codeEditor.language);
            setIsLanguageLocked(true);
            console.log('🔒 Language locked to (question level):', firstCodingQuestion.codeEditor.language);
          }
        }
      }
    }
  }, [interviewData, setSelectedLanguage, setIsLanguageLocked]);

  // Also check current question for language
  useEffect(() => {
    if (currentQuestion && currentQuestion.codeEditor?.language) {
      setSelectedLanguage(currentQuestion.codeEditor.language);
      setIsLanguageLocked(true);
      console.log('🔒 Language locked to (current question):', currentQuestion.codeEditor.language);
    }
  }, [currentQuestion, setSelectedLanguage, setIsLanguageLocked]);

  // Load rounds when interview data is available
  useEffect(() => {
    if (interviewData && interviewData.rounds) {
      loadInterviewRounds();
    }
  }, [interviewData, loadInterviewRounds]);

  // Sync completed rounds with user progress
  useEffect(() => {
    if (allRounds.length > 0) {
      const completedRoundIds = new Set();
      
      // Check user progress first
      if (userProgress && userProgress.rounds) {
        userProgress.rounds.forEach(progressRound => {
          if (progressRound.status === 'completed') {
            completedRoundIds.add(progressRound.roundId);
          }
        });
      }
      
      // Also check localStorage as fallback
      const storageKey = `completedRounds_${interviewId}`;
      const storedRounds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      storedRounds.forEach(roundId => completedRoundIds.add(roundId));
      
      console.log('🔄 Syncing completed rounds:', Array.from(completedRoundIds));
      if (userProgress && userProgress.rounds) {
        console.log('🔄 User progress rounds:', userProgress.rounds.map(r => ({ roundId: r.roundId, status: r.status })));
      }
      console.log('🔄 All rounds:', allRounds.map(r => ({ id: r._id || r.id || r.roundId, title: r.title })));
      console.log('🔄 Stored rounds from localStorage:', storedRounds);
      setCompletedRounds(completedRoundIds);
    }
  }, [userProgress, allRounds, setCompletedRounds, interviewId]);

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
          faceDetected={eyeTracking.faceDetected}
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
          onFinishInterview={() => {
            console.log('🎉 [MODERN INTERVIEW] Finishing interview, moving to complete step');
            setStep('complete');
          }}
          loading={loading}
        />
      );

    case 'interview':
      // Check if this is a sales round and render accordingly
      if (isSalesRound) {
        return (
          <>
            <ConversationalSalesRound
              round={currentRound}
              currentQuestion={currentQuestion}
              questionIndex={questionIndex}
              timeRemaining={timeRemaining}
              isAISpeaking={isAISpeaking}
              isRecording={voiceRecording.isRecording}
              transcription={voiceRecording.transcription}
              interimTranscription={voiceRecording.interimTranscription}
              onStartRecording={voiceRecording.startRecording}
              onStopRecording={voiceRecording.stopRecording}
              onClearTranscription={voiceRecording.clearTranscription}
              onNextQuestion={moveToNextQuestion}
              onSubmitAnswer={submitCurrentAnswer}
              onToggleAISpeaking={() => setIsAISpeaking(!isAISpeaking)}
              onSpeakText={speakQuestion}
              candidateInfo={candidateInfo}
              isDarkMode={isDarkMode}
            />
            
            {/* Eye Tracking Monitor */}
            <EyeTrackingMonitor
              gazeDirection={eyeTracking.gazeDirection}
              violationCount={eyeTracking.violationCount}
              maxViolations={eyeTracking.MAX_VIOLATIONS}
              isLookingAway={eyeTracking.isLookingAway}
              onRemoveUser={handleRemoveUser}
            />
          </>
        );
      }
      
      return (
        <>
          <InterviewMain
            interviewId={interviewId}
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
            aiDeterminedLanguage={aiDeterminedLanguage}
            showCodeEditor={showCodeEditor}
            isCodeEditorFullscreen={isCodeEditorFullscreen}
            isLiveCodingRound={isLiveCodingRound}
            isSalesRound={isSalesRound}
            isSystemDesignRound={isSystemDesignRound}
            isAiQuestioning={false}
            aiQuestions={[]}
            currentAiQuestionIndex={0}
            cameraStream={camera.cameraStream}
            personDetectionWarning={personDetectionWarning}
            testWarning={testWarning}
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
            candidateInfo={candidateInfo}
          />
          
          {/* Eye Tracking Monitor */}
          <EyeTrackingMonitor
            gazeDirection={eyeTracking.gazeDirection}
            violationCount={eyeTracking.violationCount}
            maxViolations={eyeTracking.MAX_VIOLATIONS}
            isLookingAway={eyeTracking.isLookingAway}
            onRemoveUser={handleRemoveUser}
          />

        </>
      );

    case 'file-upload':
      return (
        <FileUploadRound
          interview={interviewData}
          round={currentRound}
          candidateInfo={candidateInfo}
          onComplete={() => {
            // Mark round as completed
            const roundId = currentRound._id || currentRound.id || currentRound.roundId;
            setCompletedRounds(prev => new Set([...prev, roundId]));

            // Persist completion in localStorage
            try {
              const storageKey = `completedRounds_${interviewId}`;
              const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
              if (!stored.includes(roundId)) {
                stored.push(roundId);
                localStorage.setItem(storageKey, JSON.stringify(stored));
              }
            } catch (_) {}

            // Update user progress
            setUserProgress(prev => {
              if (!prev) return prev;

              const updatedRounds = prev.rounds.map(r =>
                r.roundId === roundId
                  ? { ...r, status: 'completed', completedAt: new Date() }
                  : r
              );

              return {
                ...prev,
                rounds: updatedRounds,
                progress: {
                  ...prev.progress,
                  completedRounds: prev.progress.completedRounds + 1
                }
              };
            });

            // Auto-advance to next round if available, else complete
            const currentIndex = allRounds.findIndex(r => (r._id || r.id || r.roundId) === roundId);
            const nextRound = currentIndex >= 0 ? allRounds[currentIndex + 1] : null;
            if (nextRound) {
              console.log('⏭️ Auto-advancing to next round after file upload');
              handleSelectRound(nextRound);
            } else {
              setStep('complete');
            }
          }}
        />
      );

    case 'form-submission':
      return (
        <FormSubmissionRound
          round={currentRound}
          onComplete={(submissionData) => {
            console.log('Form submission completed:', submissionData);
            
            // Mark round as completed
            const roundId = currentRound._id || currentRound.id || currentRound.roundId;
            setCompletedRounds(prev => new Set([...prev, roundId]));

            // Persist completion in localStorage
            try {
              const storageKey = `completedRounds_${interviewId}`;
              const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
              if (!stored.includes(roundId)) {
                stored.push(roundId);
                localStorage.setItem(storageKey, JSON.stringify(stored));
              }
            } catch (_) {}
            
            // Update user progress
            setUserProgress(prev => {
              if (!prev) return prev;
              
              const updatedRounds = prev.rounds.map(r => 
                r.roundId === roundId 
                  ? { ...r, status: 'completed', completedAt: new Date() }
                  : r
              );
              
              return {
                ...prev,
                rounds: updatedRounds,
                progress: {
                  ...prev.progress,
                  completedRounds: prev.progress.completedRounds + 1
                }
              };
            });
            
            // Auto-advance to next round if available, else complete
            const currentIndex = allRounds.findIndex(r => (r._id || r.id || r.roundId) === roundId);
            const nextRound = currentIndex >= 0 ? allRounds[currentIndex + 1] : null;
            if (nextRound) {
              console.log('⏭️ Auto-advancing to next round after form submission');
              handleSelectRound(nextRound);
            } else {
              setStep('complete');
            }
          }}
          candidateInfo={candidateInfo}
          isDarkMode={isDarkMode}
        />
      );

    case 'pcb-round':
      console.log('🔧 [PCB ROUND] Passing props:', {
        interviewId,
        roundId: currentRound?.roundId || currentRound?._id,
        candidateInfo,
        questionId: currentQuestion?.id || currentQuestion?._id
      });
      return (
        <PCBInterviewInterface
          question={currentQuestion}
          interviewId={interviewId}
          roundId={currentRound?.roundId || currentRound?._id}
          candidateInfo={candidateInfo}
          onNextQuestion={moveToNextQuestion}
          onAnswerSubmit={async (pcbDesignData) => {
            console.log('PCB design submitted:', pcbDesignData);
            
            // Submit the current question answer
            try {
              await submitCurrentAnswer(pcbDesignData);
            } catch (error) {
              console.error('❌ Failed to submit PCB design answer:', error);
            }
          }}
          isDarkMode={isDarkMode}
          timeLimit={currentQuestion?.timeLimit || 6}
        />
      );

    case 'complete':
      // Stop recording when interview completes
      if (interviewRecording.isRecording) {
        console.log('🛑 [MODERN INTERVIEW] Stopping interview recording...');
        interviewRecording.stopRecording();
      }
      
      return (
        <InterviewComplete
          interviewData={interviewData}
          interviewId={interviewId}
          userProgress={userProgress}
          completedRounds={completedRounds}
          allRounds={allRounds}
          onRestartInterview={handleRestartInterview}
          onRetakeRound={handleRetakeRound}
        />
      );

    default:
      return null;
  }
};

export default ModernInterview;
