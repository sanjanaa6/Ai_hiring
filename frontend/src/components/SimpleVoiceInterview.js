import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Mic, MicOff, AlertTriangle, CheckCircle, Clock, Volume2, SkipForward, Code } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import CodeEditor from './CodeEditor';
import EnhancedCodeEditor from './EnhancedCodeEditor';
import apiService from '../services/apiService';

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

const SimpleVoiceInterview = ({ interviewId, candidateInfo, onComplete, onError }) => {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState('setup'); // setup, interview, round-selection, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [autoProgressEnabled] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [allRounds, setAllRounds] = useState([]);
  const [completedRounds, setCompletedRounds] = useState(new Set());
  const [networkRetryCount, setNetworkRetryCount] = useState(0);
  const [shouldAutoRecord, setShouldAutoRecord] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [questionStartCountdown, setQuestionStartCountdown] = useState(0);
  const [isLiveCodingRound, setIsLiveCodingRound] = useState(false);
  const [isSalesRound, setIsSalesRound] = useState(false);
  const [isCameraRestarting, setIsCameraRestarting] = useState(false);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isLanguageLocked, setIsLanguageLocked] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isCodeEditorFullscreen, setIsCodeEditorFullscreen] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [currentAiQuestionIndex, setCurrentAiQuestionIndex] = useState(0);
  const [isAiQuestioning, setIsAiQuestioning] = useState(false);
  const [aiQuestionAnswers, setAiQuestionAnswers] = useState([]);
  
  // AI Question Tracking System
  const [aiQuestionMap, setAiQuestionMap] = useState(new Map()); // Map to store question details
  const [aiQuestionTranscriptions, setAiQuestionTranscriptions] = useState(new Map()); // Map to store transcriptions for each question
  const [aiQuestionProgress, setAiQuestionProgress] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    currentQuestionNumber: 0
  });
  
  const [aiResponses, setAiResponses] = useState([]);
  const [isCodeDone, setIsCodeDone] = useState(false);
  const [isAiQuestionAnswered, setIsAiQuestionAnswered] = useState(false);


  // Auto-detect if current question is a coding question and reset showCodeEditor accordingly
  useEffect(() => {
    // Check if current round is a coding round
    const isCurrentRoundCoding = isCodingRound(currentRound?.title);
    
    const isCodingQuestion = currentQuestion?.codeEditor?.enabled || 
      (currentQuestion?.question && (
        currentQuestion.question.toLowerCase().includes('code editor') ||
        currentQuestion.question.toLowerCase().includes('write a function') ||
        currentQuestion.question.toLowerCase().includes('implement a function') ||
        currentQuestion.question.toLowerCase().includes('implement a class') ||
        currentQuestion.question.toLowerCase().includes('implement an algorithm') ||
        currentQuestion.question.toLowerCase().includes('implement a data structure') ||
        currentQuestion.question.toLowerCase().includes('coding') ||
        currentQuestion.question.toLowerCase().includes('programming') ||
        currentQuestion.question.toLowerCase().includes('write code') ||
        currentQuestion.question.toLowerCase().includes('write a program') ||
        currentQuestion.question.toLowerCase().includes('algorithm') ||
        currentQuestion.question.toLowerCase().includes('debug') ||
        currentQuestion.question.toLowerCase().includes('reverse') ||
        currentQuestion.question.toLowerCase().includes('palindrome') ||
        currentQuestion.question.toLowerCase().includes('factorial') ||
        currentQuestion.question.toLowerCase().includes('binary search') ||
        currentQuestion.question.toLowerCase().includes('sorting') ||
        currentQuestion.question.toLowerCase().includes('recursion') ||
        currentQuestion.question.toLowerCase().includes('data structure')
      ));
    
    // Check if this is an interactive coding round
    const isInteractiveCoding = currentQuestion?.type === 'interactive-coding' ||
      (currentRound?.title && currentRound.title.toLowerCase().includes('interactive coding')) ||
      (currentQuestion?.question && currentQuestion.question.toLowerCase().includes('interactive'));
    
    // Check if this is a sales round
    const isSalesRound = currentRound?.title?.toLowerCase().includes('sales') ||
      currentRound?.title?.toLowerCase().includes('selling') ||
      currentRound?.title?.toLowerCase().includes('business development') ||
      currentRound?.title?.toLowerCase().includes('client acquisition');
    
    console.log('🔍 Round detection:', {
      isCodingRound: isCurrentRoundCoding,
      isCodingQuestion,
      isInteractiveCoding,
      isSalesRound,
      currentQuestion: currentQuestion?.question,
      currentRound: currentRound?.title
    });
    
    setIsLiveCodingRound(isInteractiveCoding);
    setIsSalesRound(isSalesRound);
    
    // Detect and lock language based on round title or question content
    const detectedLanguage = detectLanguageFromRound(currentRound?.title, currentQuestion?.question);
    if (detectedLanguage) {
      setSelectedLanguage(detectedLanguage);
      setIsLanguageLocked(true);
      console.log('🔒 Language locked to:', detectedLanguage, 'for round:', currentRound?.title);
    } else {
      setIsLanguageLocked(false);
    }
    
    // Reset states when question changes
    setIsCodeDone(false);
    setIsAiQuestionAnswered(false);
    setIsAiQuestioning(false);
    setAiQuestions([]);
    setAiQuestionAnswers([]);
    setAiResponses([]);
    
    // Reset showCodeEditor to false when question changes, but keep it available for coding questions
    // In coding rounds, the code editor will be available for all questions
    setShowCodeEditor(false);
  }, [currentQuestion?.questionId, currentQuestion?.codeEditor?.enabled, currentQuestion?.question, currentQuestion?.type, currentRound?.title]);

  // Detect language from round title or question content
  const detectLanguageFromRound = (roundTitle, question) => {
    if (!roundTitle && !question) return null;
    
    const text = `${roundTitle || ''} ${question || ''}`.toLowerCase();
    
    // Python Developer
    if (text.includes('python developer') || text.includes('python dev') || 
        text.includes('python programming') || text.includes('python coding') ||
        text.includes('django') || text.includes('flask') || text.includes('pandas') ||
        text.includes('numpy') || text.includes('python script')) {
      return 'python';
    }
    
    // JavaScript Developer
    if (text.includes('javascript developer') || text.includes('js developer') ||
        text.includes('node.js') || text.includes('react developer') ||
        text.includes('angular developer') || text.includes('vue developer') ||
        text.includes('frontend developer') || text.includes('fullstack developer')) {
      return 'javascript';
    }
    
    // Java Developer
    if (text.includes('java developer') || text.includes('java programming') ||
        text.includes('spring boot') || text.includes('java coding') ||
        text.includes('maven') || text.includes('gradle')) {
      return 'java';
    }
    
    // C# Developer
    if (text.includes('c# developer') || text.includes('csharp developer') ||
        text.includes('.net developer') || text.includes('dotnet developer') ||
        text.includes('asp.net') || text.includes('c# programming')) {
      return 'csharp';
    }
    
    // C++ Developer
    if (text.includes('c++ developer') || text.includes('cpp developer') ||
        text.includes('c++ programming') || text.includes('cpp programming') ||
        text.includes('c plus plus')) {
      return 'cpp';
    }
    
    // Go Developer
    if (text.includes('go developer') || text.includes('golang developer') ||
        text.includes('go programming') || text.includes('golang programming')) {
      return 'go';
    }
    
    // Rust Developer
    if (text.includes('rust developer') || text.includes('rust programming') ||
        text.includes('rust coding')) {
      return 'rust';
    }
    
    // PHP Developer
    if (text.includes('php developer') || text.includes('php programming') ||
        text.includes('laravel') || text.includes('symfony')) {
      return 'php';
    }
    
    // Ruby Developer
    if (text.includes('ruby developer') || text.includes('ruby programming') ||
        text.includes('rails') || text.includes('ruby on rails')) {
      return 'ruby';
    }
    
    // Swift Developer
    if (text.includes('swift developer') || text.includes('swift programming') ||
        text.includes('ios developer') || text.includes('swift coding')) {
      return 'swift';
    }
    
    // Kotlin Developer
    if (text.includes('kotlin developer') || text.includes('kotlin programming') ||
        text.includes('android developer') || text.includes('kotlin coding')) {
      return 'kotlin';
    }
    
    // TypeScript Developer
    if (text.includes('typescript developer') || text.includes('ts developer') ||
        text.includes('typescript programming') || text.includes('ts programming')) {
      return 'typescript';
    }
    
    return null; // No specific language detected
  };

  // Get default starter code based on language
  const getDefaultStarterCode = (language) => {
    switch (language) {
      case 'python':
        return '# Write your Python code here\ndef solution():\n    # Your implementation\n    pass';
      case 'java':
        return 'public class Solution {\n    public static void main(String[] args) {\n        // Your implementation\n    }\n}';
      case 'csharp':
        return 'using System;\n\npublic class Solution {\n    public static void Main() {\n        // Your implementation\n    }\n}';
      case 'cpp':
        return '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your implementation\n    return 0;\n}';
      case 'go':
        return 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Your implementation\n}';
      case 'rust':
        return 'fn main() {\n    // Your implementation\n}';
      case 'php':
        return '<?php\n// Your implementation\n?>';
      case 'ruby':
        return '# Your Ruby implementation\ndef solution\n    # Your code here\nend';
      case 'swift':
        return 'import Foundation\n\n// Your Swift implementation\nfunc solution() {\n    // Your code here\n}';
      case 'kotlin':
        return 'fun main() {\n    // Your implementation\n}';
      case 'typescript':
        return '// Write your TypeScript code here\nfunction solution(): void {\n    // Your implementation\n}';
      default:
        return '// Write your code here\nfunction solution() {\n    // Your implementation\n}';
    }
  };

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const cameraMonitorInterval = useRef(null);
  const moveToNextQuestionRef = useRef(null);
  const speakQuestionRef = useRef(null);
  const handleAIQuestionAnswerRef = useRef(null);
  const startVoiceRecordingForAIRef = useRef(null);

  // Step 1: Initialize camera and microphone
  const startSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎬 Requesting camera and microphone access...');
      
      // Start interview tracking first
      if (interviewId && !userProgress) {
        console.log('🚀 Starting interview tracking during setup...');
        await startInterviewTracking();
      }
      
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
      
      console.log('✅ Media access granted');
      setStep('round-selection');
      await loadInterviewRounds();
    } catch (err) {
      console.error('❌ Media access failed:', err);
      setError('Camera and microphone access required. Please grant permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load interview rounds from the backend
  const loadInterviewRounds = async () => {
    try {
      console.log('🔄 Loading interview rounds for interviewId:', interviewId);
      
      if (!interviewId) {
        console.log('⚠️ No interviewId provided, creating default rounds');
        const defaultRounds = [
          {
            roundId: 'round_1',
            title: 'Technical Assessment',
            description: 'Basic technical knowledge and problem-solving skills',
            questions: [
              {
                questionId: 'q1',
                question: 'Tell me about yourself and your technical background.',
                type: 'behavioral',
                timeLimit: 300
              },
              {
                questionId: 'q2', 
                question: 'Explain the difference between let, const, and var in JavaScript.',
                type: 'technical',
                timeLimit: 180
              }
            ]
          },
          {
            roundId: 'round_2',
            title: 'Coding Challenge',
            description: 'Live coding session with real-time problem solving',
            questions: [
              {
                questionId: 'q3',
                question: 'Write a function to reverse a string in JavaScript.',
                type: 'coding',
                timeLimit: 600,
                codeEditor: { enabled: true, language: 'javascript' }
              }
            ]
          },
          {
            roundId: 'round_3',
            title: 'System Design',
            description: 'Architecture and system design discussion',
            questions: [
              {
                questionId: 'q4',
                question: 'How would you design a URL shortener service like bit.ly?',
                type: 'system-design',
                timeLimit: 900
              }
            ]
          }
        ];
        
        setAllRounds(defaultRounds);
        console.log('✅ Default rounds loaded:', defaultRounds.length);
        return;
      }

      // Fetch actual interview data from the backend using apiService
      console.log('🌐 Fetching interview data from backend...');
      
      const result = await apiService.getInterview(interviewId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch interview data');
      }

      const interviewData = result.data;
      console.log('📋 Interview data received:', {
        id: interviewData.interviewId,
        title: interviewData.title,
        roundsCount: interviewData.rounds?.length || 0,
        approvalStatus: interviewData.approvalStatus
      });

      // Check if interview is approved or pending (for testing)
      if (interviewData.approvalStatus !== 'approved' && interviewData.approvalStatus !== 'pending') {
        throw new Error(`This interview is not available yet. Status: ${interviewData.approvalStatus}`);
      }

      // Set the rounds from the interview data
      if (interviewData.rounds && interviewData.rounds.length > 0) {
        setAllRounds(interviewData.rounds);
        console.log('✅ Interview rounds loaded successfully:', interviewData.rounds.length);
        
        // Sync completed rounds with user progress
        syncCompletedRoundsWithProgress();
      } else {
        console.log('⚠️ No rounds found in interview data');
        setAllRounds([]);
      }
      
    } catch (error) {
      console.error('❌ Failed to load interview rounds:', error);
      setError('Failed to load interview rounds: ' + error.message);
    }
  };

  // Sync completed rounds with user progress
  const syncCompletedRoundsWithProgress = useCallback(() => {
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
  }, [userProgress, allRounds]);

  // Refresh user progress from backend
  const refreshUserProgress = useCallback(async () => {
    try {
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (isAuthenticated && interviewId) {
        console.log('🔄 Refreshing user progress from backend...');
        const result = await apiService.getUserProgress();
        
        if (result.success && result.data.interviewProgress) {
          // Find progress for current interview
          const currentInterviewProgress = result.data.interviewProgress.find(
            progress => progress.interviewId === interviewId
          );
          
          if (currentInterviewProgress) {
            setUserProgress(currentInterviewProgress);
            console.log('✅ User progress refreshed from backend');
          }
        }
      }
    } catch (err) {
      console.error('❌ Error refreshing user progress:', err);
    }
  }, [interviewId]);

  // Update completed rounds when user progress changes
  useEffect(() => {
    syncCompletedRoundsWithProgress();
  }, [syncCompletedRoundsWithProgress]);

  // Refresh user progress when component loads and rounds are available
  useEffect(() => {
    if (allRounds.length > 0 && interviewId) {
      refreshUserProgress();
    }
  }, [allRounds.length, interviewId, refreshUserProgress]);

  // Stop recording function
  const stopRecording = useCallback(() => {
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
  }, []);

  // Update progress when question is answered
  const updateProgress = useCallback(async (roundId, questionId, status, timeSpent) => {
    try {
      console.log('📊 Updating progress:', { roundId, questionId, status, timeSpent });
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (isAuthenticated) {
        // Use authenticated progress tracking
        const result = await apiService.updateInterviewProgress(interviewId, {
          roundId,
          questionId,
          status,
          timeSpent
        });
        
        if (result.success) {
          setUserProgress(result.data.progress);
          console.log('✅ Progress updated successfully');
          
          // Check if round is completed and update local state
          if (result.data.progress && result.data.progress.rounds) {
            const progressRound = result.data.progress.rounds.find(pr => pr.roundId === roundId);
            if (progressRound && progressRound.status === 'completed') {
              setCompletedRounds(prev => new Set([...prev, roundId]));
              console.log('🎉 Round completed:', roundId);
            }
          }
        } else {
          console.warn('⚠️ Failed to update progress:', result.error);
        }
      } else {
        // For anonymous users, we'll track progress in the interview answers
        // This will be handled when they submit answers
        console.log('📊 Anonymous user progress tracked locally');
      }
    } catch (err) {
      console.error('❌ Error updating progress:', err);
    }
  }, [interviewId]);

  // Mark round as completed in backend
  const markRoundCompleted = useCallback(async (roundId) => {
    try {
      console.log('🏁 Marking round as completed in backend:', roundId);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (isAuthenticated) {
        // Get the current round data to mark all questions as answered
        const currentRound = allRounds.find(round => round.roundId === roundId);
        if (currentRound && currentRound.questions) {
          // Mark all questions in the round as answered
          for (const question of currentRound.questions) {
            try {
              await apiService.updateInterviewProgress(interviewId, {
                roundId,
                questionId: question.id,
                status: 'answered',
                timeSpent: question.timeLimit * 60 // Use full time limit as time spent
              });
            } catch (questionErr) {
              console.warn(`⚠️ Failed to mark question ${question.id} as answered:`, questionErr);
            }
          }
          console.log('✅ All questions marked as answered for round:', roundId);
          
          // Refresh user progress to get updated status
          setTimeout(() => {
            refreshUserProgress();
          }, 1000);
        }
      } else {
        console.log('📊 Anonymous user - round completion tracked locally');
      }
    } catch (err) {
      console.error('❌ Error marking round as completed:', err);
    }
  }, [interviewId, allRounds, refreshUserProgress]);

  // Submit current answer (used internally for auto-progression)
  const submitCurrentAnswer = useCallback(async () => {
    try {
      // Determine answer type and content
      // Check if current round is a coding round
      const isCurrentRoundCoding = isCodingRound(currentRound?.title);
      
      const isCodingQuestion = currentQuestion?.codeEditor?.enabled || isCurrentRoundCoding;
      const answerContent = isCodingQuestion ? codeAnswer : transcription;
      const answerType = isCodingQuestion ? 'code' : 'voice';
      
      if (!answerContent.trim()) {
        console.log('⚠️ No answer content to submit');
        return;
      }

      // For coding questions, check if AI question is answered
      if (isCodingQuestion && isCodeDone && !isAiQuestionAnswered) {
        console.log('⚠️ AI question must be answered before submission');
        setError('Please answer the AI question before submitting');
        return;
      }
      
      console.log('📤 Submitting current answer...', { answerType, isCodingQuestion });
      
      const result = await apiService.submitAnswer(interviewId, {
          candidateId: candidateInfo.email,
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email,
          roundId: currentRound.roundId,
          questionId: currentQuestion.questionId,
          question: currentQuestion.question,
          answer: answerContent,
          answerType: answerType,
          transcription: isCodingQuestion ? '' : transcription,
          codeAnswer: isCodingQuestion ? codeAnswer : '',
          timeTaken: (currentQuestion.timeLimit * 60) - timeRemaining
      });
      console.log('✅ Answer submitted:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }
      
      // Update progress tracking
      const timeSpent = (currentQuestion.timeLimit * 60) - timeRemaining;
      await updateProgress(currentRound.roundId, currentQuestion.questionId, 'answered', timeSpent);
      
      return result.data;
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err.message || 'Failed to submit answer');
      throw err;
    }
  }, [currentRound, currentQuestion, codeAnswer, transcription, isCodeDone, isAiQuestionAnswered, interviewId, candidateInfo, timeRemaining, updateProgress]);

  // AI Text-to-Speech function
  const speakQuestion = useCallback(async (questionText) => {
    return new Promise((resolve) => {
      setIsAISpeaking(true);
      
      // Validate questionText input
      if (!questionText || typeof questionText !== 'string') {
        console.warn('⚠️ Invalid questionText provided to speakQuestion:', questionText);
        setIsAISpeaking(false);
        resolve();
        return;
      }
      
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
          // Start timer directly here to avoid circular dependency
          const timeLimit = currentQuestion?.timeLimit * 60 || 300;
          setTimeRemaining(timeLimit);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                if (autoProgressEnabled && moveToNextQuestionRef.current) {
                  moveToNextQuestionRef.current();
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          // Set flag to trigger auto-recording via useEffect
          console.log('🎙️ Setting auto-record flag after AI speech...');
          setShouldAutoRecord(true);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsAISpeaking(false);
          // Start timer directly here to avoid circular dependency
          const timeLimit = currentQuestion?.timeLimit * 60 || 300;
          setTimeRemaining(timeLimit);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                if (autoProgressEnabled && moveToNextQuestionRef.current) {
                  moveToNextQuestionRef.current();
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          // Set flag to trigger auto-recording via useEffect
          console.log('🎙️ Setting auto-record flag after speech error...');
          setShouldAutoRecord(true);
          resolve();
        };
        
        console.log('🗣️ AI speaking question:', questionText && questionText.length > 50 ? questionText.substring(0, 50) + '...' : questionText || 'No question text');
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('⚠️ Speech synthesis not supported');
        setIsAISpeaking(false);
        // Start timer directly here to avoid circular dependency
        const timeLimit = currentQuestion?.timeLimit * 60 || 300;
        setTimeRemaining(timeLimit);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              if (autoProgressEnabled && moveToNextQuestionRef.current) {
                moveToNextQuestionRef.current();
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Set flag to trigger auto-recording via useEffect
        console.log('🎙️ Setting auto-record flag (no speech synthesis)...');
        setShouldAutoRecord(true);
        resolve();
      }
    });
  }, [currentQuestion, autoProgressEnabled]);

  // Store the function in ref to avoid circular dependency
  speakQuestionRef.current = speakQuestion;


  // Move to next question automatically
  const moveToNextQuestion = useCallback(async () => {
    try {
      console.log('⏭️ Moving to next question...');
      
      // Stop current recording if active
      if (isRecording) {
        console.log('🛑 Stopping current recording...');
        stopRecording();
      }
      
      // Submit current answer if there's transcription or code answer
      if (transcription.trim() || codeAnswer.trim()) {
        console.log('📤 Submitting current answer before moving to next question...');
        try {
        await submitCurrentAnswer();
          console.log('✅ Answer submitted successfully');
        } catch (submitErr) {
          console.error('❌ Failed to submit answer:', submitErr);
          // Continue anyway to not block progression
        }
      } else {
        console.log('⚠️ No answer content to submit, moving to next question');
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
         setCodeAnswer(''); // Reset code answer
         setSelectedLanguage('javascript'); // Reset language selection
         setIsCodeDone(false); // Reset code done state
         setIsAiQuestionAnswered(false); // Reset AI question answered state
         // Don't reset showCodeEditor here - let it be determined by the next question
        setShouldAutoRecord(false); // Reset auto-record flag
         
        // Wait a moment for state to update, then start next question
        setTimeout(async () => {
          try {
         await speakQuestionRef.current(nextQuestion.question);
            console.log('✅ Next question started successfully');
            
            // Device detection will continue automatically via useEffect
            console.log('🔄 Device detection will continue automatically for next question');
          } catch (speakErr) {
            console.error('❌ Failed to start next question:', speakErr);
            setError('Failed to start next question');
          }
        }, 500);
        
       } else {
         // Current round complete - move to next round or complete interview
         console.log('🏁 Round complete, moving to next round...');
         const currentRoundId = allRounds[roundIndex]?.roundId;
         if (currentRoundId) {
           setCompletedRounds(prev => new Set([...prev, currentRoundId]));
           console.log('✅ Round marked as completed locally:', currentRoundId);
           
           // Mark round as completed in backend
           try {
             await markRoundCompleted(currentRoundId);
             console.log('📊 Backend updated with round completion');
           } catch (err) {
             console.error('❌ Failed to update backend:', err);
           }
         }
         setStep('round-selection');
       }
      
    } catch (err) {
      console.error('❌ Error moving to next question:', err);
      setError('Failed to progress to next question: ' + err.message);
    }
  }, [isRecording, stopRecording, transcription, codeAnswer, submitCurrentAnswer, allRounds, roundIndex, questionIndex, markRoundCompleted]);

  // Store the function in ref to avoid circular dependency
  moveToNextQuestionRef.current = moveToNextQuestion;

  // Move to next question automatically
  // Generate AI questions for sales answers
  const generateSalesAIQuestions = async (answer, question, questionNumber = 1, previousQuestions = []) => {
    try {
      console.log(`🤖 Generating sales AI question ${questionNumber}/3...`);
      console.log('📝 Answer:', answer);
      console.log('📝 Question:', question);
      console.log('📝 Previous Questions:', previousQuestions);
      
      // Use the coding hints endpoint to generate sales AI questions with timeout
      const result = await Promise.race([
        apiService.getCodingHints(interviewId, {
          question: question,
          currentCode: answer, // Use the sales answer as "current code"
          language: 'sales', // Use 'sales' as the language
          difficulty: 'medium',
          isLiveComment: true,
          isInterviewer: true,
          questionNumber: questionNumber,
          previousQuestions: previousQuestions
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI generation timeout')), 15000) // 15 second timeout
        )
      ]);

      console.log(`📡 Sales AI response for question ${questionNumber}:`, result);
      
      if (result.success && result.data && result.data.aiResponse) {
        const aiQuestion = result.data.aiResponse.aiQuestion;
        console.log(`✅ Sales AI question ${questionNumber} generated:`, aiQuestion);
        return aiQuestion; // Return single question
      } else {
        console.log(`⚠️ API failed for question ${questionNumber}, using fallback`);
        // Show fallback message to user
        setError(`⚠️ Using fallback question ${questionNumber}/3. AI service temporarily unavailable.`);
        setTimeout(() => setError(''), 3000); // Clear message after 3 seconds
        
        // Return fallback sales questions based on question number
        const fallbackQuestions = [
          "Can you elaborate more on your sales approach?",
          "What would you do differently in this situation?",
          "How would you handle objections from the customer?"
        ];
        return fallbackQuestions[questionNumber - 1] || fallbackQuestions[0];
      }
    } catch (error) {
      console.error(`❌ Error generating sales AI question ${questionNumber}:`, error);
      // Show fallback message to user
      setError(`⚠️ Using fallback question ${questionNumber}/3. AI service error occurred.`);
      setTimeout(() => setError(''), 3000); // Clear message after 3 seconds
      
      // Return fallback questions instead of throwing error
      const fallbackQuestions = [
        "Can you tell me more about your sales experience?",
        "What sales techniques do you typically use?",
        "How do you build rapport with potential customers?"
      ];
      return fallbackQuestions[questionNumber - 1] || fallbackQuestions[0];
    }
  };


  // Generate 3 AI questions for coding solution
  const generateMultipleAIQuestions = async (code, question) => {
    try {
      console.log('🤖 Generating 3 AI questions for coding solution...');
      console.log('📝 Code:', code);
      console.log('❓ Question:', question);
      
      const questions = [];
      
      // Generate 3 different AI questions
      for (let i = 0; i < 3; i++) {
        console.log(`🔄 Generating question ${i + 1}/3...`);
        
        const result = await apiService.getCodingHints(interviewId, {
            question: question,
            currentCode: code,
            language: selectedLanguage,
            difficulty: 'medium',
            isLiveComment: true,
            isInterviewer: true,
            questionNumber: i + 1, // Add question number for variety
            previousQuestions: questions // Include previous questions to avoid repetition
        });

        console.log(`📡 Response for question ${i + 1}:`, result);
        console.log(`📋 Response data for question ${i + 1}:`, result);
        
        if (result.success && result.data && result.data.aiResponse) {
          console.log(`✅ AI question ${i + 1} generated:`, result.data.aiResponse.aiQuestion);
          questions.push(result.data.aiResponse.aiQuestion);
        } else {
          console.log(`⚠️ API failed for question ${i + 1}, using fallback`);
          // Add fallback question
          const fallbackQuestions = [
            "Can you explain your approach to solving this problem?",
            "What is the time complexity of your solution?",
            "How would you handle edge cases in your code?"
          ];
          questions.push(fallbackQuestions[i] || "Can you explain your code?");
        }
        
        // Add small delay between requests to avoid rate limiting
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('✅ All 3 AI questions generated:', questions);
      return questions;
      
    } catch (error) {
      console.error('❌ Error generating multiple AI questions:', error);
      // Fallback questions
      return [
        "Can you explain your approach to solving this problem?",
        "What is the time complexity of your solution?",
        "How would you handle edge cases in your code?"
      ];
    }
  };

  // Handle when user clicks "Done" on their code
  const handleCodeDone = async () => {
    console.log('🎯 handleCodeDone called');
    console.log('📝 codeAnswer:', codeAnswer);
    console.log('❓ currentQuestion:', currentQuestion);
    
    if (!codeAnswer.trim()) {
      console.log('❌ No code written');
      setError('Please write some code before marking as done');
      return;
    }
    
    console.log('✅ Code marked as done, generating 3 AI questions...');
    setIsCodeDone(true);
    
    try {
      // Generate 3 AI questions for the code
      console.log('🤖 Generating 3 AI questions...');
      const questions = await generateMultipleAIQuestions(codeAnswer, currentQuestion?.question);
      console.log('📋 Generated 3 questions:', questions);
      
      setAiQuestions(questions);
      setCurrentAiQuestionIndex(0);
      setIsAiQuestioning(true);
      setAiQuestionAnswers([]);
      setIsAiQuestionAnswered(false);
      
      // Start with the first AI question
      console.log('🗣️ Speaking first question:', questions[0]);
      await speakQuestion(questions[0]);
      // Start listening for the answer after AI finishes speaking
      setTimeout(() => {
        console.log('🎙️ Starting voice recording for AI...');
        startVoiceRecordingForAI();
      }, 2000); // Wait 2 seconds after AI finishes speaking
    } catch (error) {
      console.error('❌ Error in handleCodeDone:', error);
      setError('Failed to generate AI questions: ' + error.message);
    }
  };


  // Handle sales round AI questioning - generates first question
  const handleSalesAIQuestioning = async (answer) => {
    try {
      console.log('🎯 Starting sales AI questioning for answer:', answer);
      
      // Show waiting message while AI generates first question
      setError('🤖 AI is analyzing your sales answer and generating the first follow-up question... This may take up to 15 seconds.');
      setLoading(true);
      setIsAiQuestioning(true);
      
      // Generate first AI question for the sales answer
      const firstQuestion = await generateSalesAIQuestions(answer, currentQuestion?.question, 1, []);
      console.log('📋 Generated first sales AI question:', firstQuestion);
      
      // Clear the waiting message and loading
      setError('');
      setLoading(false);
      
      if (firstQuestion) {
        // Initialize AI question tracking system
        const questionId = `ai_q_1_${Date.now()}`;
        const questionMap = new Map();
        questionMap.set(questionId, {
          id: questionId,
          questionNumber: 1,
          question: firstQuestion,
          answer: '',
          transcription: '',
          timestamp: new Date(),
          isAnswered: false
        });
        
        setAiQuestionMap(questionMap);
        setAiQuestionTranscriptions(new Map());
        setAiQuestionProgress({
          totalQuestions: 3,
          answeredQuestions: 0,
          currentQuestionNumber: 1
        });
        
        // Store the original answer and question for subsequent questions
        setAiQuestions([firstQuestion]);
        setCurrentAiQuestionIndex(0);
        setAiQuestionAnswers([]);
        setIsAiQuestionAnswered(false);
        
        // Start with the first AI question
        console.log('🗣️ Speaking first sales AI question:', firstQuestion);
        await speakQuestion(firstQuestion);
        
        // Start listening for the answer after AI finishes speaking
        setTimeout(() => {
          console.log('🎙️ Starting voice recording for sales AI...');
          startVoiceRecordingForAI();
        }, 2000); // Wait 2 seconds after AI finishes speaking
      } else {
        setError('No AI questions were generated. Please try again.');
        setLoading(false);
        setIsAiQuestioning(false);
      }
    } catch (error) {
      console.error('❌ Error in handleSalesAIQuestioning:', error);
      setError('Failed to generate sales AI questions: ' + error.message);
      setLoading(false);
      setIsAiQuestioning(false);
    }
  };

  // Handle next AI question generation (for questions 2 and 3)
  const handleNextAIQuestion = async (answer, questionNumber) => {
    try {
      console.log(`🎯 Generating AI question ${questionNumber}/3 for answer:`, answer);
      
      // Show waiting message while AI generates next question
      setError(`🤖 AI is analyzing your sales answer and generating question ${questionNumber}/3... This may take up to 15 seconds.`);
      setLoading(true);
      
      // Get previous questions to avoid repetition
      const previousQuestions = aiQuestions.slice(0, questionNumber - 1);
      
      // Generate next AI question
      const nextQuestion = await generateSalesAIQuestions(answer, currentQuestion?.question, questionNumber, previousQuestions);
      console.log(`📋 Generated AI question ${questionNumber}:`, nextQuestion);
      
      // Clear the waiting message and loading
      setError('');
      setLoading(false);
      
      if (nextQuestion) {
        // Add the new question to the tracking system
        const questionId = `ai_q_${questionNumber}_${Date.now()}`;
        setAiQuestionMap(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(questionId, {
            id: questionId,
            questionNumber: questionNumber,
            question: nextQuestion,
            answer: '',
            transcription: '',
            timestamp: new Date(),
            isAnswered: false
          });
          return newMap;
        });
        
        // Update progress
        setAiQuestionProgress(prev => ({
          ...prev,
          currentQuestionNumber: questionNumber
        }));
        
        // Add the new question to the list
        const updatedQuestions = [...aiQuestions, nextQuestion];
        setAiQuestions(updatedQuestions);
        setCurrentAiQuestionIndex(questionNumber - 1);
        setIsAiQuestionAnswered(false);
        
        // Speak the new question
        console.log(`🗣️ Speaking AI question ${questionNumber}:`, nextQuestion);
        await speakQuestion(nextQuestion);
        
        // Start listening for the answer after AI finishes speaking
        setTimeout(() => {
          console.log(`🎙️ Starting voice recording for AI question ${questionNumber}...`);
          startVoiceRecordingForAI();
        }, 2000); // Wait 2 seconds after AI finishes speaking
      } else {
        setError(`Failed to generate AI question ${questionNumber}. Please try again.`);
        setLoading(false);
      }
    } catch (error) {
      console.error(`❌ Error generating AI question ${questionNumber}:`, error);
      setError(`Failed to generate AI question ${questionNumber}: ` + error.message);
      setLoading(false);
    }
  };

  // Handle AI question generated by code editor
  const handleAIQuestionFromEditor = async (question) => {
    console.log('🤖 AI question generated by code editor:', question);
    console.log('🔍 Setting AI questioning state...');
    
    // Set up AI questioning state
    setAiQuestions([question]);
    setCurrentAiQuestionIndex(0);
    setIsAiQuestioning(true);
    setAiQuestionAnswers([]);
    setIsAiQuestionAnswered(false);
    
    console.log('✅ AI questioning state set - isAiQuestioning: true, isAiQuestionAnswered: false');
    
    // Speak the question and start voice recording
    await speakQuestion(question);
    setTimeout(() => {
      startVoiceRecordingForAI();
    }, 2000);
  };

  // Start voice recording for AI question answer
  const startVoiceRecordingForAI = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      setTranscription('');
      setError('');
      
      // Initialize speech recognition if not already done
      if (!recognitionRef.current) {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          // Make speech recognition more tolerant
          recognitionRef.current.maxAlternatives = 1;
          
          recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              }
            }
            
            if (finalTranscript) {
              setTranscription(finalTranscript);
              console.log('🎤 AI question answer received:', finalTranscript);
              // Call handleAIQuestionAnswer via ref to avoid circular dependency
              if (handleAIQuestionAnswerRef.current) {
                handleAIQuestionAnswerRef.current(finalTranscript);
              }
            }
          };
          
          recognitionRef.current.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
              setError('Microphone access denied. Please allow microphone access and try again.');
            } else if (event.error === 'no-speech') {
              console.log('⚠️ No speech detected, restarting speech recognition...');
              // Show user-friendly message
              setTranscription('🎤 No speech detected. Please speak clearly into your microphone...');
              // Clear the message after 3 seconds
              setTimeout(() => {
                setTranscription('');
              }, 3000);
              // Restart speech recognition after a brief delay
              setTimeout(() => {
                if (isRecording && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (err) {
                    console.log('Speech recognition already started or not available');
                  }
                }
              }, 1000);
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
            console.log('✅ Speech recognition started for AI question');
            setIsRecording(true);
            setNetworkRetryCount(0); // Reset retry counter on successful start
          };
        } else {
          setError('Speech recognition not supported in this browser');
          return;
        }
      }
      
      setIsRecording(true);
      recognitionRef.current.start();
      console.log('🎤 Voice recording started for AI question');
    } catch (error) {
      console.error('❌ Error starting voice recording:', error);
      setError('Failed to start voice recording');
      setIsRecording(false);
    }
  }, [isRecording, stopRecording]);

  // Store the function in ref to avoid circular dependency
  startVoiceRecordingForAIRef.current = startVoiceRecordingForAI;

  // Update AI question transcription in real-time
  const updateAIQuestionTranscription = useCallback((transcription) => {
    const currentQuestionId = Array.from(aiQuestionMap.keys())[currentAiQuestionIndex];
    if (currentQuestionId) {
      setAiQuestionTranscriptions(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(currentQuestionId, transcription);
        return newMap;
      });
    }
  }, [aiQuestionMap, currentAiQuestionIndex]);

  // Handle AI question answer
  const handleAIQuestionAnswer = useCallback(async (answer) => {
    try {
      console.log('🎤 AI question answered:', answer);
      
      // Update the question map with the answer
      const currentQuestionId = Array.from(aiQuestionMap.keys())[currentAiQuestionIndex];
      if (currentQuestionId) {
        setAiQuestionMap(prevMap => {
          const newMap = new Map(prevMap);
          const questionData = newMap.get(currentQuestionId);
          if (questionData) {
            newMap.set(currentQuestionId, {
              ...questionData,
              answer: answer,
              isAnswered: true,
              answeredAt: new Date()
            });
          }
          return newMap;
        });
        
        // Update progress
        setAiQuestionProgress(prev => ({
          ...prev,
          answeredQuestions: prev.answeredQuestions + 1
        }));
      }
      
      // Store the answer
      const newAnswers = [...aiQuestionAnswers, {
        question: aiQuestions[currentAiQuestionIndex],
        answer: answer,
        timestamp: new Date()
      }];
      setAiQuestionAnswers(newAnswers);
      setIsAiQuestionAnswered(true);
      console.log('✅ AI question marked as answered - isAiQuestionAnswered: true');
      
      // Generate AI response to the answer
      try {
        const result = await apiService.getCodingHints(interviewId, {
            question: aiQuestions[currentAiQuestionIndex],
            currentCode: codeAnswer,
            language: selectedLanguage,
            difficulty: 'medium',
            isLiveComment: true,
            isInterviewer: true
        });
        if (result.success && result.data && result.data.aiResponse) {
          const newResponse = {
            id: Date.now(),
            question: aiQuestions[currentAiQuestionIndex],
            answer: answer,
            aiResponse: result.data.aiResponse.aiQuestion,
            timestamp: new Date()
          };
          setAiResponses(prev => [...prev, newResponse]);
          
          // Speak the AI response (use voiceText if available, otherwise use aiQuestion)
          const voiceText = result.data.voiceText || result.data.aiResponse.aiQuestion;
          await speakQuestion(voiceText);
        }
      } catch (responseError) {
        console.error('❌ Error generating AI response:', responseError);
        // Continue with the flow even if AI response fails
      }
      
      // Check if we need to generate more AI questions (up to 3 total)
      const totalQuestionsAsked = currentAiQuestionIndex + 1;
      console.log(`📊 Total AI questions asked so far: ${totalQuestionsAsked}/3`);
      
      if (totalQuestionsAsked < 3) {
        // Generate next AI question dynamically
        console.log(`🔄 Generating AI question ${totalQuestionsAsked + 1}/3...`);
        setTimeout(async () => {
          try {
            await handleNextAIQuestion(answer, totalQuestionsAsked + 1);
          } catch (error) {
            console.error('❌ Error generating next AI question:', error);
            setError('Failed to generate next AI question. Moving to next interview question.');
            // Move to next main question if AI question generation fails
            setTimeout(() => {
              setIsAiQuestioning(false);
              setIsAiQuestionAnswered(false);
              if (moveToNextQuestionRef.current) {
                moveToNextQuestionRef.current();
              }
            }, 2000);
          }
        }, 3000); // Wait 3 seconds after AI response
      } else {
        // All 3 AI questions completed, move to next question in the round
        console.log('✅ All 3 AI questions completed, moving to next question...');
        setTimeout(() => {
          setIsAiQuestioning(false);
          setIsAiQuestionAnswered(false);
          if (moveToNextQuestionRef.current) {
            moveToNextQuestionRef.current();
          }
        }, 3000); // Wait 3 seconds after AI response
      }
    } catch (error) {
      console.error('❌ Error handling AI question answer:', error);
      setError(error.message || 'Failed to process AI question answer');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiQuestionAnswers, aiQuestions, currentAiQuestionIndex, interviewId, codeAnswer, selectedLanguage, setAiQuestionAnswers, setIsAiQuestionAnswered, setAiResponses, setError]);

  // Store the function in ref to avoid circular dependency
  handleAIQuestionAnswerRef.current = handleAIQuestionAnswer;

  // Handle voice recording completion for AI questions
  const handleVoiceRecordingCompleteForAI = useCallback(async (transcript) => {
    if (transcript.trim() && handleAIQuestionAnswerRef.current) {
      await handleAIQuestionAnswerRef.current(transcript.trim());
    }
  }, []);





  // Ensure camera stream is active during interview
  const ensureCameraActive = async () => {
    try {
      console.log('📹 Ensuring camera is active for interview...');
      setIsCameraRestarting(true);
      
      
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
      console.log('⏳ Waiting for camera to stabilize...');
      setTimeout(() => {
        setIsCameraRestarting(false);
      }, 2000); // Reduced to 2-second grace period
      
    } catch (err) {
      console.error('❌ Failed to ensure camera active:', err);
      setCameraStatus('error');
      setIsCameraRestarting(false);
    }
  };

  // Start interview and track progress
  const startInterviewTracking = useCallback(async () => {
    try {
      console.log('🚀 Starting interview tracking for:', interviewId);
      
      // Check if user is authenticated by trying to get user info
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
        if (result.data.progress) {
          setUserProgress(result.data.progress);
        }
        console.log('✅ Interview tracking started successfully');
        return true;
      } else {
        console.warn('⚠️ Failed to start interview tracking:', result.error);
        return false;
      }
    } catch (err) {
      console.error('❌ Error starting interview tracking:', err);
      return false;
    }
  }, [interviewId, candidateInfo]);


  // Start a specific round from round selection
  const startSpecificRound = async (roundId) => {
    try {
      setLoading(true);
      console.log('🎭 Starting specific round:', roundId);
      
      // Always ensure interview tracking is started
      if (!userProgress) {
        await startInterviewTracking();
      }
      
      const roundIndex = allRounds.findIndex(round => round.roundId === roundId);
      if (roundIndex === -1) {
        throw new Error('Round not found');
      }
      
      const round = allRounds[roundIndex];
      
      // Check if round has questions
      if (!round.questions || round.questions.length === 0) {
        throw new Error('This round has no questions available');
      }
      
      // Find user progress for this round to determine where to resume
      let startQuestionIndex = 0;
      let startQuestionNumber = 1;
      
      if (userProgress && userProgress.rounds) {
        const progressRound = userProgress.rounds.find(pr => pr.roundId === roundId);
        if (progressRound) {
          // Find the first unanswered question
          const unansweredQuestionIndex = progressRound.questions.findIndex(q => q.status === 'not_answered');
          if (unansweredQuestionIndex !== -1) {
            startQuestionIndex = unansweredQuestionIndex;
            startQuestionNumber = unansweredQuestionIndex + 1;
            console.log(`🔄 Resuming from question ${startQuestionNumber} in round ${roundId}`);
          } else {
            // All questions answered, start from beginning for retake
            console.log(`🔄 All questions answered, starting from beginning for retake`);
          }
        }
      }
      
      setRoundIndex(roundIndex);
      setQuestionIndex(startQuestionIndex);
      setCurrentRound(round);
      setCurrentQuestion({
        ...round.questions[startQuestionIndex],
        questionId: round.questions[startQuestionIndex].id,
        question: round.questions[startQuestionIndex].question,
        timeLimit: round.questions[startQuestionIndex].timeLimit,
        questionNumber: startQuestionNumber,
        totalQuestions: round.questions.length
      });
      setTranscription('');
      setCodeAnswer(''); // Reset code answer
      setSelectedLanguage('javascript'); // Reset language selection
      setShowCodeEditor(false); // Reset code editor visibility for new round
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
  const startRecording = useCallback(async () => {
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
        // Make speech recognition more tolerant
        recognitionRef.current.maxAlternatives = 1;
        
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
            
            // If we're in AI questioning mode, update AI question transcription and handle the answer
            if (isAiQuestioning) {
              updateAIQuestionTranscription(transcription + finalTranscript);
              handleVoiceRecordingCompleteForAI(finalTranscript);
            }
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          // Handle various speech recognition error types:
          // - not-allowed: Microphone access denied
          // - no-speech: No speech detected (auto-retry)
          // - aborted: Recognition was aborted (normal)
          // - service-not-allowed: Service unavailable due to restrictions
          // - network: Network communication failure (auto-retry with limit)
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access and try again.');
          } else if (event.error === 'no-speech') {
            console.log('⚠️ No speech detected, restarting speech recognition...');
            // Show user-friendly message
            setTranscription('🎤 No speech detected. Please speak clearly into your microphone...');
            // Clear the message after 3 seconds
            setTimeout(() => {
              setTranscription('');
            }, 3000);
            // Restart speech recognition after a brief delay
            setTimeout(() => {
              if (isRecording && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (err) {
                  console.log('Speech recognition already started or not available');
                }
              }
            }, 1000);
          } else if (event.error === 'aborted') {
            console.log('⚠️ Speech recognition aborted, this is normal');
          } else if (event.error === 'service-not-allowed') {
            console.error('🚫 Speech recognition service not allowed');
            setError('Speech recognition service is not available. This might be due to browser restrictions or network policies.');
            setTranscription('🚫 Speech service unavailable - Please try refreshing the page or using a different browser...');
            setTimeout(() => {
              setTranscription('');
            }, 5000);
          } else if (event.error === 'network') {
            console.error('🌐 Network error in speech recognition');
            const maxRetries = 3;
            
            if (networkRetryCount < maxRetries) {
              setNetworkRetryCount(prev => prev + 1);
              setError(`Network connection issue detected (attempt ${networkRetryCount + 1}/${maxRetries}). Retrying...`);
              // Show user-friendly message
              setTranscription(`🌐 Network error - Retrying... (${networkRetryCount + 1}/${maxRetries})`);
              // Clear the message after 3 seconds
              setTimeout(() => {
                setTranscription('');
              }, 3000);
              // Attempt to restart speech recognition after network error
              setTimeout(() => {
                if (isRecording && recognitionRef.current) {
                  try {
                    console.log(`🔄 Attempting to restart speech recognition after network error (attempt ${networkRetryCount + 1})...`);
                    recognitionRef.current.start();
                  } catch (err) {
                    console.log('Speech recognition restart failed:', err);
                    setError('Unable to restart speech recognition. Please refresh the page and try again.');
                  }
                }
              }, 2000);
            } else {
              setError('Network connection failed after multiple attempts. Please check your internet connection and refresh the page.');
              setTranscription('🌐 Network connection failed. Please check your internet and refresh the page.');
              // Clear the message after 10 seconds
              setTimeout(() => {
                setTranscription('');
              }, 10000);
              // Reset retry counter after max attempts
              setNetworkRetryCount(0);
            }
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
          setNetworkRetryCount(0); // Reset retry counter on successful start
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
  }, [isRecording, cameraStream, isAiQuestioning, handleVoiceRecordingCompleteForAI, setTranscription, setError, setIsRecording]);


  // Manual submit (for when user clicks submit button)
  const submitAnswer = async () => {
    try {
      console.log('🎯 submitAnswer called');
      console.log('🔍 Debug - isLiveCodingRound:', isLiveCodingRound, 'codeAnswer:', codeAnswer.trim(), 'isCodeDone:', isCodeDone, 'isAiQuestionAnswered:', isAiQuestionAnswered);
      
      setLoading(true);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // For coding questions, check if AI question is answered
      if (isLiveCodingRound && codeAnswer.trim()) {
        if (isAiQuestioning && !isAiQuestionAnswered) {
          setError('Please answer the AI question before submitting');
          return;
        }
        // Proceed with submission
        await submitCurrentAnswer();
        await moveToNextQuestion();
      } else if (isSalesRound && transcription.trim()) {
        // For sales rounds, check if AI question is answered
        if (isAiQuestioning && !isAiQuestionAnswered) {
          setError('Please answer the AI question before submitting');
          return;
        }
        // If no AI questioning is active, start it
        if (!isAiQuestioning) {
          await handleSalesAIQuestioning(transcription.trim());
          return; // Don't submit yet, wait for AI question to be answered
        }
        // Proceed with submission after AI question is answered
        await submitCurrentAnswer();
        await moveToNextQuestion();
      } else {
        // Regular submission for non-coding, non-sales questions
      await submitCurrentAnswer();
      await moveToNextQuestion();
      }
      
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
      setCodeAnswer(''); // Reset code answer
      setSelectedLanguage('javascript'); // Reset language selection
      setIsCodeDone(false); // Reset code done state
      setIsAiQuestionAnswered(false); // Reset AI question answered state
      // Don't reset showCodeEditor here - let it be determined by the next question
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
  const cleanup = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (cameraMonitorInterval.current) {
      clearInterval(cameraMonitorInterval.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Start interview tracking when component loads
  useEffect(() => {
    if (interviewId && !userProgress) {
      console.log('🎯 Auto-starting interview tracking on component load');
      startInterviewTracking();
    }
  }, [interviewId, userProgress, startInterviewTracking]);

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
  }, [shouldAutoRecord, isRecording, isAISpeaking, step, startRecording]);

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

  if (step === 'round-selection') {
    return (
      <div className={`fixed inset-0 overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`backdrop-blur-md border-b px-6 py-4 ${
            isDarkMode 
              ? 'bg-black/20 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="text-center">
              <h1 className={`text-2xl font-bold mb-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Choose Interview Round</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Complete rounds in sequence to unlock the next ones</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRounds.map((round, index) => {
              const roundId = round.roundId;
              const isCompleted = completedRounds.has(roundId);
              const isAvailable = index === 0 || completedRounds.has(allRounds[index - 1]?.roundId);
              
              // Check if round is in progress (has some answered questions but not completed)
              const isInProgress = userProgress && userProgress.rounds ? 
                userProgress.rounds.some(pr => 
                  pr.roundId === roundId && 
                  pr.status === 'in_progress'
                ) : false;
              
              return (
                <div
                  key={roundId}
                  className={`group relative rounded-3xl p-8 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 ${
                    isCompleted
                      ? isDarkMode 
                        ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/10 border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/30' 
                        : 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 shadow-2xl shadow-emerald-200/60'
                      : isAvailable
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-slate-900/80 via-gray-900/60 to-black/40 border-2 border-blue-400/40 hover:border-blue-400/80 hover:shadow-2xl hover:shadow-blue-500/40 cursor-pointer backdrop-blur-md'
                        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200/60 cursor-pointer'
                      : isDarkMode
                        ? 'bg-gradient-to-br from-gray-900/40 via-slate-900/30 to-black/20 border-2 border-gray-700/40 opacity-60'
                        : 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 border-2 border-gray-400 opacity-60'
                  }`}
                >
                  {/* Animated Background Glow */}
                  {isAvailable && (
                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-indigo-500/10 animate-pulse' 
                        : 'bg-gradient-to-br from-blue-100/60 via-cyan-100/40 to-indigo-100/50'
                    }`}></div>
                  )}
                  
                  {/* Floating Particles Effect */}
                  {isAvailable && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                      <div className="absolute top-2 left-4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                      <div className="absolute top-6 right-6 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40 delay-300"></div>
                      <div className="absolute bottom-4 left-8 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-50 delay-700"></div>
                      <div className="absolute bottom-8 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-30 delay-1000"></div>
                    </div>
                  )}
                  
                  <div className="relative z-10 text-center">
                    {/* Round Number with Enhanced Design */}
                    <div className="relative mb-8">
                      <div
                        className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-all duration-500 group-hover:scale-110 ${
                        isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-emerald-500/40'
                          : isAvailable
                            ? 'bg-gradient-to-br from-slate-800 via-blue-600 to-indigo-700 shadow-blue-500/50'
                            : 'bg-gradient-to-br from-gray-600 to-slate-700 shadow-gray-500/30'
                      }`}
                    >
                      {isCompleted ? (
                          <CheckCircle className="h-10 w-10 text-white drop-shadow-lg animate-bounce" />
                      ) : (
                          <span className="text-white text-2xl font-black drop-shadow-lg">{index + 1}</span>
                      )}
                    </div>

                      {/* Animated Decorative Rings */}
                      {isAvailable && (
                        <>
                          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl border-2 border-blue-400/40 animate-ping"></div>
                          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl border border-cyan-400/60 animate-pulse"></div>
                          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl border border-indigo-400/30 animate-pulse delay-300"></div>
                        </>
                      )}
                      
                      {/* Glowing Orb Effect */}
                      {isAvailable && (
                        <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-xl animate-pulse"></div>
                      )}
                    </div>

                    {/* Round Title with Better Typography */}
                    <h3
                      className={`text-2xl font-black mb-4 leading-tight transition-all duration-300 group-hover:scale-105 ${
                        isCompleted
                          ? isDarkMode ? 'text-emerald-200' : 'text-emerald-800'
                          : isAvailable
                          ? isDarkMode ? 'text-white' : 'text-slate-900'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {round.title}
                    </h3>

                    {/* Round Description with Better Spacing */}
                    <p
                      className={`text-sm mb-6 leading-relaxed transition-all duration-300 ${
                        isCompleted
                          ? isDarkMode ? 'text-emerald-300/90' : 'text-emerald-700'
                          : isAvailable
                          ? isDarkMode ? 'text-gray-200/95' : 'text-slate-600'
                          : isDarkMode ? 'text-gray-500/70' : 'text-gray-400'
                      }`}
                    >
                      {round.description}
                    </p>

                    {/* Enhanced Round Info with Black/Blue Theme */}
                    <div className={`flex justify-center space-x-4 mb-8 ${
                      isDarkMode ? 'text-gray-300' : 'text-slate-600'
                    }`}>
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 group-hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-slate-800/60 border border-blue-400/30' 
                          : 'bg-blue-100/80 border border-blue-200'
                      }`}>
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-xs font-bold">{round.duration}m</span>
                      </div>
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 group-hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-slate-800/60 border border-cyan-400/30' 
                          : 'bg-cyan-100/80 border border-cyan-200'
                      }`}>
                        <span className="text-xs font-bold">{round.questions?.length || 0} Q</span>
                      </div>
                    </div>

                    {/* Enhanced Action Button with Black/Blue Theme */}
                    {isCompleted ? (
                      <div className="space-y-4">
                        <div className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/20' 
                            : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-lg shadow-emerald-200/40'
                        }`}>
                          ✅ Completed
                        </div>
                        <button
                          onClick={() => startSpecificRound(roundId)}
                          disabled={loading}
                          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
                        >
                          Retake Round
                        </button>
                      </div>
                    ) : isAvailable ? (
                      <button
                        onClick={() => startSpecificRound(roundId)}
                        disabled={loading}
                        className={`w-full py-5 px-8 rounded-2xl font-black text-base transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 disabled:transform-none shadow-2xl relative overflow-hidden ${
                          isInProgress 
                            ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 shadow-orange-500/40 hover:shadow-orange-500/60'
                            : 'bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-800 hover:from-slate-700 hover:via-blue-600 hover:to-indigo-700 shadow-blue-500/40 hover:shadow-blue-500/60'
                        } text-white disabled:from-gray-600 disabled:to-gray-600`}
                      >
                        {/* Animated Background */}
                        <div className={`absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 ${
                          isInProgress 
                            ? 'bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-yellow-400/20'
                            : 'bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20'
                        }`}></div>
                        
                        {/* Button Content */}
                        <div className="relative z-10 flex items-center justify-center space-x-3">
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Starting...</span>
                            </>
                          ) : (
                            <>
                              <span>{isInProgress ? 'Continue Interview' : 'Start Round'}</span>
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            </>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className={`w-full py-5 px-8 rounded-2xl font-bold text-sm transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-slate-800/40 text-gray-400 border-2 border-gray-600/40' 
                          : 'bg-gray-200 text-gray-500 border-2 border-gray-400'
                      }`}>
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-lg">🔒</span>
                          <span>Complete Previous Rounds First</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Overall Progress with Black/Blue Theme */}
          <div className="mt-10 text-center">
            <div className={`border-2 rounded-3xl p-8 shadow-2xl transition-all duration-500 hover:scale-105 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-900/80 via-gray-900/60 to-black/40 border-blue-400/40 shadow-blue-500/30' 
                : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-blue-300 shadow-blue-200/40'
            }`}>
              <h3 className={`font-black text-2xl mb-4 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>Interview Progress</h3>
              <div className={`text-lg mb-6 ${
                isDarkMode ? 'text-gray-200' : 'text-slate-600'
              }`}>
                Completed: <span className="font-black text-blue-500 text-2xl">{completedRounds.size}</span> / <span className="font-black text-xl">{allRounds.length}</span> rounds
              </div>
              <div className={`w-full rounded-full h-4 mt-4 ${
                isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
              }`}>
                <div
                  className="bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 h-4 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden"
                  style={{ width: `${allRounds.length > 0 ? (completedRounds.size / allRounds.length) * 100 : 0}%` }}
                >
                  {/* Animated Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className={`text-sm mt-4 font-bold ${
                isDarkMode ? 'text-blue-300' : 'text-blue-600'
              }`}>
                {allRounds.length > 0 ? Math.round((completedRounds.size / allRounds.length) * 100) : 0}% Complete
              </div>
            </div>
          </div>

          {/* Complete Interview Button */}
          {allRounds.length > 0 && completedRounds.size === allRounds.length && (
            <div className="mt-6 text-center">
              <button
                onClick={async () => {
                  setStep('complete');
                  stopCameraMonitoring();
                  
                  // Mark interview as completed in user progress
                  try {
                    console.log('🎉 Marking interview as completed:', interviewId);
                    
                    // Check if user is authenticated
                    const isAuthenticated = localStorage.getItem('token') || sessionStorage.getItem('token');
                    
                    if (isAuthenticated) {
                      const result = await apiService.completeInterview(interviewId);
                      if (result.success) {
                        console.log('✅ Interview marked as completed successfully');
                      } else {
                        console.warn('⚠️ Failed to mark interview as completed:', result.error);
                      }
                    } else {
                      console.log('📊 Anonymous user interview completion tracked locally');
                    }
                  } catch (err) {
                    console.error('❌ Error marking interview as completed:', err);
                  }
                  
                  if (onComplete) {
                    onComplete({ 
                      message: 'All interview rounds completed successfully!',
                      completedRounds: Array.from(completedRounds),
                      totalRounds: allRounds.length
                    });
                  }
                }}
                className="px-10 py-6 bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 hover:from-emerald-700 hover:via-blue-700 hover:to-indigo-700 text-white text-xl font-black rounded-2xl shadow-2xl transform hover:scale-110 hover:-translate-y-2 transition-all duration-500"
              >
                🎉 Complete Interview
              </button>
            </div>
          )}

          {error && (
            <div className={`border rounded-xl p-4 mt-6 ${
              isDarkMode 
                ? 'bg-red-500/20 border-red-400/30' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                isDarkMode ? 'text-red-200' : 'text-red-800'
              }`}>{error}</p>
              <button
                onClick={() => setError(null)}
                className={`text-sm underline mt-2 ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}
              >
                Dismiss
              </button>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className={`fixed inset-0 overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className={`backdrop-blur-md border-b px-6 py-4 ${
            isDarkMode 
              ? 'bg-black/20 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className={`text-2xl font-bold mb-1 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>AI Interview Setup</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Prepare your camera and microphone for the interview</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Interview Requirements */}
                <div className={`backdrop-blur-md border rounded-2xl p-6 flex flex-col ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <h2 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Interview Requirements</h2>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                      <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</div>
                        <div>
                        <p className={`font-semibold text-lg mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Camera Access</p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>We need camera access to monitor the interview environment and detect any electronic devices</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</div>
                        <div>
                        <p className={`font-semibold text-lg mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Microphone Access</p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Voice recording is required for answering interview questions</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</div>
                        <div>
                        <p className={`font-semibold text-lg mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Clean Environment</p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Ensure no electronic devices are visible during the interview</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">4</div>
                        <div>
                        <p className={`font-semibold text-lg mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Good Lighting</p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>Position yourself in a well-lit area for clear video</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Camera Preview */}
                <div className={`backdrop-blur-md border rounded-2xl p-6 flex flex-col ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center mb-6">
                    <Camera className={`w-6 h-6 mr-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`} />
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Camera Preview</h3>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className={`flex-1 rounded-xl flex items-center justify-center border-2 border-dashed mb-4 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600' 
                        : 'bg-gray-100 border-gray-300'
                    }`}>
                      <div className={`text-center ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Camera will appear here</p>
                        <p className="text-xs">Click 'Start Camera Setup' to begin</p>
                      </div>
                    </div>
                    
                    <div className={`space-y-2 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Camera will be activated</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Microphone will be enabled</span>
                      </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
              <div className="mt-6 text-center">
          {error && (
                  <div className={`backdrop-blur-md border rounded-xl p-4 mb-4 ${
                    isDarkMode 
                      ? 'bg-red-500/20 border-red-400/30' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-center ${
                      isDarkMode ? 'text-red-200' : 'text-red-800'
                    }`}>{error}</p>
            </div>
          )}
          
          <button
            onClick={startSetup}
            disabled={loading}
                  className="bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 hover:from-slate-700 hover:via-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Setting up camera and microphone...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                      <Camera className="w-5 h-5" />
                          <span>Start Camera Setup</span>
                        </div>
                      )}
          </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  if (step === 'interview') {
    return (
      <div className={`fixed inset-0 overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        {/* Full-screen immersive interview interface */}
        <div className="h-full flex flex-col">
          {/* Top Status Bar */}
          <div className={`backdrop-blur-md border-b px-6 py-4 ${
            isDarkMode 
              ? 'bg-black/30 border-white/10' 
              : 'bg-white/90 border-blue-200 shadow-lg'
          }`}>
              <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <h1 className="text-xl font-bold">{currentRound?.title || 'Interview'}</h1>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Question {questionIndex + 1} of {currentRound?.questions?.length || 1} • Round {roundIndex + 1} of {allRounds.length}
                  </p>
                </div>
                  </div>
              
              <div className="flex items-center space-x-6">
                {/* Time Display */}
                <div className="text-center">
                  <div className={`flex items-center space-x-2 text-2xl font-mono font-bold ${
                    timeRemaining < 60 
                      ? 'text-red-400 animate-pulse' 
                      : isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Clock className="h-6 w-6" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Time Remaining</p>
                </div>
                
                {/* Recording Status */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isRecording ? 'bg-red-500 animate-pulse' : isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isRecording ? 'Recording' : 'Ready'}
                  </span>
                </div>
                </div>
              </div>
              
              {/* Progress Bar */}
            <div className={`mt-4 rounded-full h-2 ${
              isDarkMode ? 'bg-white/10' : 'bg-blue-100'
            }`}>
                <div 
                className={`h-2 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600' 
                    : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600'
                }`}
                  style={{ 
                    width: `${((roundIndex * 5 + questionIndex + 1) / (allRounds.length * 5)) * 100}%` 
                  }}
                >
                  {/* Animated Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Live Coding Round */}
            {isLiveCodingRound ? (
              <div className="w-full h-full flex flex-col">
                {/* Top Section - Question and Camera */}
                <div className="h-1/4 flex flex-col lg:flex-row overflow-hidden">
                  {/* Left Side - Question */}
                  <div className="w-full lg:w-1/2 flex flex-col px-6 py-4 overflow-y-auto">
                    {/* Question Display */}
                    <div className="mb-3">
                      <div className={`backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-500 transform hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
                          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
                      }`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl ${
                              isDarkMode 
                                ? 'bg-gradient-to-br from-slate-700 via-blue-600 to-indigo-700' 
                                : 'bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-300'
                            }`}>
                              <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{questionIndex + 1}</span>
                            </div>
                          </div>
                          <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Coding Question</h2>
                        </div>
                        <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{currentQuestion?.question}</p>
                      </div>
                    </div>

                    {/* Action Buttons for Coding Round */}
                    <div className="space-y-4">
                      {/* Step 1: Code Writing Phase */}
                      {!isCodeDone && (
                        <div className="text-center">
                          <div className="mb-3">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Step 1: Write your code solution
                            </span>
                          </div>
                    <div className="flex justify-center space-x-4">
                      {/* Skip Button */}
                      <button
                        onClick={skipQuestion}
                        disabled={loading || isAISpeaking}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none backdrop-blur-md border-2 ${
                          isDarkMode 
                            ? 'bg-slate-800/60 hover:bg-slate-700/70 disabled:bg-gray-800/50 text-white border-slate-600/40' 
                                  : 'bg-gray-100/80 hover:bg-gray-200/90 disabled:bg-gray-200/50 text-slate-900 border-gray-300 shadow-lg'
                        }`}
                      >
                        <SkipForward className="h-4 w-4" />
                        <span>Skip Question</span>
                      </button>
                      
                            {/* Done Button - Show when code is written */}
                            {(() => {
                              console.log('🔍 Done button check:', {
                                codeAnswer: codeAnswer.trim(),
                                isCodeDone,
                                shouldShow: codeAnswer.trim() && !isCodeDone
                              });
                              return codeAnswer.trim() && !isCodeDone;
                            })() && (
                      <button
                                onClick={handleCodeDone}
                                disabled={loading || isAISpeaking}
                                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Done</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 2: AI Question Phase */}
                      {isCodeDone && !isAiQuestionAnswered && (
                        <div className="text-center">
                          <div className="mb-3">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Step 2: Answer the AI question
                            </span>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={skipQuestion}
                              disabled={loading || isAISpeaking}
                              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none backdrop-blur-md border-2 ${
                          isDarkMode 
                                  ? 'bg-slate-800/60 hover:bg-slate-700/70 disabled:bg-gray-800/50 text-white border-slate-600/40' 
                                  : 'bg-gray-100/80 hover:bg-gray-200/90 disabled:bg-gray-200/50 text-slate-900 border-gray-300 shadow-lg'
                              }`}
                            >
                              <SkipForward className="h-4 w-4" />
                              <span>Skip Question</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Submit Phase */}
                      {isCodeDone && isAiQuestionAnswered && (
                        <div className="text-center">
                          <div className="mb-3">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Step 3: Submit your complete answer
                            </span>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <button
                              onClick={skipQuestion}
                              disabled={loading || isAISpeaking}
                              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none backdrop-blur-md border-2 ${
                                isDarkMode 
                                  ? 'bg-slate-800/60 hover:bg-slate-700/70 disabled:bg-gray-800/50 text-white border-slate-600/40' 
                                  : 'bg-gray-100/80 hover:bg-gray-200/90 disabled:bg-gray-200/50 text-slate-900 border-gray-300 shadow-lg'
                              }`}
                            >
                              <SkipForward className="h-4 w-4" />
                              <span>Skip Question</span>
                            </button>
                            
                            {/* Submit Button - Only enabled after AI question is answered */}
                            <button
                              onClick={submitAnswer}
                              disabled={(() => {
                                const isDisabled = loading || isAISpeaking || 
                                  (isLiveCodingRound && isAiQuestioning && !isAiQuestionAnswered) ||
                                  (isSalesRound && isAiQuestioning && !isAiQuestionAnswered);
                                console.log('🔍 Step-by-step Submit button disabled check:', {
                                  loading,
                                  isAISpeaking,
                                  isLiveCodingRound,
                                  isSalesRound,
                                  isAiQuestioning,
                                  isAiQuestionAnswered,
                                  isDisabled
                                });
                                return isDisabled;
                              })()}
                              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg"
                            >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                                  <span>Submit Answer</span>
                            </>
                          )}
                      </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-6 text-center">
                      <div className="flex justify-center items-center space-x-4">
                        {/* Step 1 */}
                        <div className={`flex items-center space-x-2 ${isCodeDone ? 'text-green-500' : 'text-gray-400'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCodeDone ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            1
                        </div>
                          <span className="text-sm font-medium">Write Code</span>
                      </div>
                        
                        <div className={`w-8 h-0.5 ${isCodeDone ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        
                        {/* Step 2 */}
                        <div className={`flex items-center space-x-2 ${isAiQuestionAnswered ? 'text-green-500' : isCodeDone ? 'text-blue-500' : 'text-gray-400'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isAiQuestionAnswered ? 'bg-green-500 text-white' : isCodeDone ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            2
                          </div>
                          <span className="text-sm font-medium">AI Question</span>
                        </div>
                        
                        <div className={`w-8 h-0.5 ${isAiQuestionAnswered ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        
                        {/* Step 3 */}
                        <div className={`flex items-center space-x-2 ${isAiQuestionAnswered ? 'text-blue-500' : 'text-gray-400'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isAiQuestionAnswered ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            3
                          </div>
                          <span className="text-sm font-medium">Submit</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Camera */}
                  <div className="w-full lg:w-1/2 flex flex-col items-center px-4 py-4">
                    <div className="relative w-full max-w-2xl">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-64 lg:h-[300px] bg-black rounded-2xl object-cover shadow-2xl border-4 ${
                          isDarkMode ? 'border-white/20' : 'border-blue-200'
                        }`}
                      />
                      
                      {/* Status Overlay */}
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        <div className="flex items-center space-x-2 bg-green-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>Live</span>
                        </div>
                        
                        {isRecording && (
                          <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span>Recording</span>
                          </div>
                        )}
                        
                        {isAISpeaking && (
                          <div className="flex items-center space-x-2 bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                            <Volume2 className="w-3 h-3 animate-pulse" />
                            <span>AI Speaking</span>
                          </div>
                        )}

                          </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Code Editor and AI Questions */}
                <div className="h-3/4 flex flex-col">
                  {/* AI Questioning Section */}
                  {isAiQuestioning && (
                    <div className={`backdrop-blur-md border-2 rounded-2xl p-4 m-4 mb-2 transition-all duration-500 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-blue-900/60 via-indigo-900/40 to-purple-900/30 border-blue-600/40 shadow-2xl shadow-blue-500/30'
                        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 border-blue-300 shadow-2xl shadow-blue-200/50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                          }`}></div>
                          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            AI Interviewer
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-green-400' : 'bg-green-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            Question {aiQuestionProgress.currentQuestionNumber} of {aiQuestionProgress.totalQuestions}
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isDarkMode 
                              ? 'bg-blue-800/50 text-blue-200' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {aiQuestionProgress.answeredQuestions}/{aiQuestionProgress.totalQuestions} answered
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex space-x-1 mb-4">
                        {aiQuestions.map((_, index) => (
                          <div
                            key={index}
                            className={`h-2 flex-1 rounded-full ${
                              index <= currentAiQuestionIndex
                                ? (isDarkMode ? 'bg-blue-500' : 'bg-blue-600')
                                : (isDarkMode ? 'bg-slate-600' : 'bg-gray-300')
                            }`}
                          />
                        ))}
                      </div>

                      {/* AI Questions Roadmap */}
                      <div className="mb-4 space-y-2">
                        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          AI Questions Roadmap:
                        </h4>
                        {[1, 2, 3].map((questionNum) => {
                          const questionId = Array.from(aiQuestionMap.keys()).find(id => 
                            aiQuestionMap.get(id)?.questionNumber === questionNum
                          );
                          const questionData = questionId ? aiQuestionMap.get(questionId) : null;
                          const isCurrent = aiQuestionProgress.currentQuestionNumber === questionNum;
                          const isCompleted = questionData?.isAnswered || false;
                          const isUpcoming = questionNum > aiQuestionProgress.currentQuestionNumber;
                          const isGenerated = questionData !== null;
                          
                          return (
                            <div
                              key={questionNum}
                              className={`flex items-center space-x-3 p-2 rounded-lg border ${
                                isCurrent
                                  ? (isDarkMode 
                                      ? 'bg-blue-900/40 border-blue-500/50' 
                                      : 'bg-blue-100 border-blue-400')
                                  : isCompleted
                                    ? (isDarkMode 
                                        ? 'bg-green-900/30 border-green-600/40' 
                                        : 'bg-green-50 border-green-300')
                                    : (isDarkMode 
                                        ? 'bg-gray-800/30 border-gray-600/40' 
                                        : 'bg-gray-50 border-gray-300')
                              }`}
                            >
                              {/* Question Number Badge */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isCurrent
                                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                  : isCompleted
                                    ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                                    : (isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-400 text-white')
                              }`}>
                                {questionNum}
                              </div>
                              
                              {/* Question Content */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    Question {questionNum}:
                                  </span>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isCurrent
                                      ? (isDarkMode ? 'bg-blue-800/50 text-blue-200' : 'bg-blue-200 text-blue-800')
                                      : isCompleted
                                        ? (isDarkMode ? 'bg-green-800/50 text-green-200' : 'bg-green-200 text-green-800')
                                        : (isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-200 text-gray-600')
                                  }`}>
                                    {isCurrent ? (isGenerated ? 'Current' : 'Generating') : 
                                     isCompleted ? 'Completed' : 
                                     isGenerated ? 'Ready' : 'Waiting'}
                                  </div>
                                </div>
                                
                                {/* Question Text */}
                                <p className={`text-xs mt-1 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {isGenerated ? questionData.question :
                                   isCurrent ? '🤖 AI is generating this question...' :
                                   questionNum === 1 ? 'First AI follow-up question (will be generated after your answer)' :
                                   questionNum === 2 ? 'Second AI follow-up question (will be generated after Question 1)' :
                                   'Third AI follow-up question (will be generated after Question 2)'}
                                </p>
                                
                                {/* Answer Status */}
                                {isCompleted && questionData?.answer && (
                                  <p className={`text-xs mt-1 italic ${
                                    isDarkMode ? 'text-green-300' : 'text-green-600'
                                  }`}>
                                    ✓ Answered: "{questionData.answer.substring(0, 50)}..."
                                  </p>
                                )}
                              </div>
                              
                              {/* Status Icon */}
                              <div className="text-lg">
                                {isCurrent && isGenerated && (
                                  <span className={isDarkMode ? 'text-blue-400' : 'text-blue-500'}>
                                    🎯
                                  </span>
                                )}
                                {isCurrent && !isGenerated && (
                                  <span className={isDarkMode ? 'text-blue-400' : 'text-blue-500'}>
                                    🤖
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className={isDarkMode ? 'text-green-400' : 'text-green-500'}>
                                    ✅
                                  </span>
                                )}
                                {isUpcoming && isGenerated && (
                                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                                    ⏳
                                  </span>
                                )}
                                {isUpcoming && !isGenerated && (
                                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                                    ⏸️
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Current AI Question Display */}
                      {isAiQuestioning && aiQuestionProgress.currentQuestionNumber > 0 && (
                        <div className={`mb-3 p-4 rounded-lg border-2 ${
                          isDarkMode 
                            ? 'bg-blue-900/40 border-blue-500/50 text-blue-100' 
                            : 'bg-blue-50 border-blue-400 text-blue-900'
                        }`}>
                          <div className="flex items-start space-x-3">
                            {/* Question Number Badge */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                            }`}>
                              {aiQuestionProgress.currentQuestionNumber}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-medium">Question {aiQuestionProgress.currentQuestionNumber}:</p>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDarkMode ? 'bg-blue-800/50 text-blue-200' : 'bg-blue-200 text-blue-800'
                                }`}>
                                  Current
                                </div>
                              </div>
                              
                              <p className="text-sm leading-relaxed mb-2">
                                "{aiQuestions[currentAiQuestionIndex] || 'Generating question...'}"
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs opacity-75">
                                <span>🎤 AI Speaking</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Completed Questions Display */}
                      {isAiQuestioning && aiQuestionProgress.answeredQuestions > 0 && (
                        <div className="mb-3 space-y-2">
                          <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Completed Questions:
                          </h4>
                          {Array.from(aiQuestionMap.values())
                            .filter(q => q.isAnswered)
                            .sort((a, b) => a.questionNumber - b.questionNumber)
                            .map((questionData) => (
                              <div
                                key={questionData.id}
                                className={`p-3 rounded-lg border ${
                                  isDarkMode 
                                    ? 'bg-green-900/30 border-green-600/40 text-green-100' 
                                    : 'bg-green-50 border-green-300 text-green-900'
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                                  }`}>
                                    {questionData.questionNumber}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium">Question {questionData.questionNumber}:</span>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isDarkMode ? 'bg-green-800/50 text-green-200' : 'bg-green-200 text-green-800'
                                      }`}>
                                        ✅ Completed
                                      </div>
                                    </div>
                                    
                                    <p className="text-xs mb-2 opacity-75">
                                      "{questionData.question}"
                                    </p>
                                    
                                    <p className="text-sm">
                                      <span className="font-medium">Your Answer:</span> "{questionData.answer}"
                                    </p>
                                    
                                    <p className="text-xs mt-1 opacity-75">
                                      Answered at: {questionData.answeredAt?.toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Live Transcription Display */}
                      {isAiQuestioning && !isAiQuestionAnswered && (
                        <div className={`mb-3 p-4 rounded-lg border-2 ${
                          isDarkMode 
                            ? 'bg-red-900/30 border-red-600/50 text-red-100' 
                            : 'bg-red-50 border-red-300 text-red-900'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                            }`}>
                              🎤
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-medium">Live Transcription:</p>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDarkMode ? 'bg-red-800/50 text-red-200' : 'bg-red-200 text-red-800'
                                }`}>
                                  Question {aiQuestionProgress.currentQuestionNumber}
                                </div>
                              </div>
                              
                              <p className="text-sm leading-relaxed mb-2">
                                {transcription || "Listening for your response..."}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs opacity-75">
                                <span>{isRecording ? "🔴 Recording..." : "⏸️ Ready to record"}</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Responses Display */}
                      {aiResponses.length > 0 && (
                        <div className="mb-3 space-y-2 max-h-32 overflow-y-auto">
                          {aiResponses.slice(-2).map((response) => (
                            <div key={response.id} className={`p-3 rounded-lg border-2 ${
                              isDarkMode 
                                ? 'bg-blue-900/30 border-blue-600/50 text-blue-100' 
                                : 'bg-blue-50 border-blue-300 text-blue-900'
                            }`}>
                              <div className="flex items-start space-x-2">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                                }`}></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-1">AI Response:</p>
                                  <p className="text-sm leading-relaxed">
                                    "{response.aiResponse}"
                                  </p>
                                  <p className="text-xs mt-2 opacity-75">
                                    {response.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Voice Status */}
                      <div className="flex items-center justify-center space-x-2">
                        {isRecording ? (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className={`text-xs font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Recording...
                            </span>
                          </>
                        ) : (
                            <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            🎤 Listen to AI question, then speak your answer
                          </span>
                              <button
                                onClick={startVoiceRecordingForAI}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  isDarkMode 
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                                {isRecording ? 'Stop' : 'Start'} Recording
                              </button>
                            </div>
                        )}
                      </div>
                      
                      {transcription && (
                        <div className={`mt-2 p-2 rounded-lg ${
                          isDarkMode ? 'bg-slate-700/50' : 'bg-white/70'
                        }`}>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            "{transcription}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Code Editor Section */}
                  <div className={`backdrop-blur-md border-2 rounded-2xl p-4 m-4 transition-all duration-500 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30'
                      : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                        }`}></div>
                        <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Code Editor</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-green-400' : 'bg-green-500'
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {currentQuestion?.codeEditor?.language || 'JavaScript'}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsCodeEditorFullscreen(!isCodeEditorFullscreen)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {isCodeEditorFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                      </div>
                    </div>
                    
                    <div className={`bg-white rounded-lg p-2 ${
                      isCodeEditorFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 
                      isAiQuestioning ? 'h-[600px]' : 'h-[700px]'
                    }`}>
                      {isCodeEditorFullscreen && (
                        <div className="flex justify-between items-center mb-4 p-4 bg-gray-100 rounded-lg">
                          <h3 className="text-lg font-bold text-gray-800">Code Editor - Fullscreen Mode</h3>
                          <button
                            onClick={() => setIsCodeEditorFullscreen(false)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                          >
                            Exit Fullscreen
                          </button>
                        </div>
                      )}
                      <EnhancedCodeEditor
                language={currentQuestion?.codeEditor?.language || selectedLanguage}
                        starterCode={currentQuestion?.codeEditor?.starterCode || getDefaultStarterCode(selectedLanguage)}
                        testCases={currentQuestion?.codeEditor?.testCases || []}
                        question={currentQuestion?.question || ''}
                        onCodeChange={(code) => {
                          console.log('📝 Code changed:', code);
                          setCodeAnswer(code);
                        }}
                        onAIQuestionGenerated={handleAIQuestionFromEditor}
                        disabled={false}
                        isFullScreen={isCodeEditorFullscreen}
                        onToggleFullScreen={() => setIsCodeEditorFullscreen(!isCodeEditorFullscreen)}
                        sessionId={interviewId}
                        languageLocked={isLanguageLocked}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side - Question and Controls */}
            <div className="w-full lg:w-1/2 flex flex-col px-6 py-4 overflow-y-auto">
                   {/* Question Start Countdown */}
                   {questionStartCountdown > 0 && (
                 <div className={`mb-3 backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-500 transform hover:scale-105 ${
                   isDarkMode 
                     ? 'bg-gradient-to-br from-slate-800/60 via-blue-600/20 to-indigo-600/10 border-blue-400/40 shadow-2xl shadow-blue-500/30' 
                     : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-400 shadow-2xl shadow-blue-300/50'
                 }`}>
                   <div className="flex items-center space-x-4">
                     <div className="relative">
                       <div className={`p-3 rounded-2xl shadow-2xl ${
                         isDarkMode 
                           ? 'bg-gradient-to-br from-slate-700 via-blue-600 to-indigo-700' 
                           : 'bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-300'
                       }`}>
                         <div className={`h-10 w-10 text-2xl font-black flex items-center justify-center animate-bounce ${
                           isDarkMode ? 'text-white' : 'text-slate-900'
                         }`}>
                         {questionStartCountdown}
                       </div>
                       </div>
                       {/* Animated Rings */}
                       <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/40 animate-ping"></div>
                       <div className="absolute inset-0 rounded-2xl border border-cyan-400/60 animate-pulse"></div>
                     </div>
                         <div>
                       <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Get Ready!</h3>
                       <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>First question starting in {questionStartCountdown} seconds...</p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* AI Speaking Indicator */}
                   {isAISpeaking && (
                 <div className={`mb-3 backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-500 transform hover:scale-105 ${
                   isDarkMode 
                     ? 'bg-gradient-to-br from-blue-600/20 via-cyan-500/15 to-indigo-600/10 border-cyan-400/40 shadow-2xl shadow-cyan-500/30' 
                     : 'bg-gradient-to-br from-white via-cyan-50 to-indigo-100 border-cyan-400 shadow-2xl shadow-cyan-300/50'
                 }`}>
                   <div className="flex items-center space-x-4">
                     <div className="relative">
                       <div className={`p-3 rounded-2xl shadow-2xl ${
                         isDarkMode 
                           ? 'bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600' 
                           : 'bg-gradient-to-br from-cyan-100 via-cyan-200 to-indigo-300'
                       }`}>
                         <Volume2 className={`h-8 w-8 animate-pulse ${
                           isDarkMode ? 'text-white' : 'text-slate-900'
                         }`} />
                       </div>
                       {/* Animated Rings */}
                       <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 animate-ping"></div>
                       <div className="absolute inset-0 rounded-2xl border border-indigo-400/60 animate-pulse"></div>
                     </div>
                         <div>
                       <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI is speaking...</h3>
                       <p className={`text-sm ${isDarkMode ? 'text-cyan-200' : 'text-cyan-700'}`}>Please listen to the question carefully</p>
                         </div>
                       </div>
                     </div>
                   )}

                  {/* Question Display */}
              <div className="mb-3">
                <div className={`backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-500 transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
                    : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
                }`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-slate-700 via-blue-600 to-indigo-700' 
                          : 'bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-300'
                      }`}>
                        <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{questionIndex + 1}</span>
                    </div>
                      {/* Animated Rings */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/40 animate-ping"></div>
                      <div className="absolute inset-0 rounded-2xl border border-indigo-400/60 animate-pulse"></div>
                  </div>
                    <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Question</h2>
                    {isAISpeaking && <Volume2 className={`h-5 w-5 animate-pulse ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                  </div>
                  <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{currentQuestion?.question}</p>
                </div>
                  </div>

              {/* Code Editor for Coding Questions - Show for all questions in coding rounds */}
              {(() => {
                // Check if current round is a coding round
                const isCurrentRoundCoding = isCodingRound(currentRound?.title);
                
                // Also check if question has explicit code editor enabled
                const hasExplicitCodeEditor = currentQuestion?.codeEditor?.enabled;
                
                // Check if question content suggests coding
                const isCodingQuestion = currentQuestion?.question && (
                  currentQuestion.question.toLowerCase().includes('code editor') ||
                  currentQuestion.question.toLowerCase().includes('write a function') ||
                  currentQuestion.question.toLowerCase().includes('implement a function') ||
                  currentQuestion.question.toLowerCase().includes('implement a class') ||
                  currentQuestion.question.toLowerCase().includes('implement an algorithm') ||
                  currentQuestion.question.toLowerCase().includes('implement a data structure') ||
                  currentQuestion.question.toLowerCase().includes('coding') ||
                  currentQuestion.question.toLowerCase().includes('programming') ||
                  currentQuestion.question.toLowerCase().includes('write code') ||
                  currentQuestion.question.toLowerCase().includes('write a program') ||
                  currentQuestion.question.toLowerCase().includes('algorithm') ||
                  currentQuestion.question.toLowerCase().includes('debug') ||
                  currentQuestion.question.toLowerCase().includes('reverse') ||
                  currentQuestion.question.toLowerCase().includes('palindrome') ||
                  currentQuestion.question.toLowerCase().includes('factorial') ||
                  currentQuestion.question.toLowerCase().includes('binary search') ||
                  currentQuestion.question.toLowerCase().includes('sorting') ||
                  currentQuestion.question.toLowerCase().includes('recursion') ||
                  currentQuestion.question.toLowerCase().includes('data structure')
                );
                
                // Show code editor if: it's a coding round OR question has explicit code editor OR question content suggests coding
                return isCurrentRoundCoding || hasExplicitCodeEditor || isCodingQuestion;
              })() && (
                <div className="mb-3">
                  <div className={`backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-500 transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
                      : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                        }`}></div>
                        <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Code Editor</h3>
                      </div>
                      {!showCodeEditor && (
                        <button
                          onClick={() => setShowCodeEditor(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 hover:from-slate-600 hover:via-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Code className="h-4 w-4" />
                          <span>
                            {(isCodingRound(currentRound?.title) || currentQuestion?.codeEditor?.enabled)
                              ? 'Open Enhanced Code Editor' 
                              : 'Open Code Editor'}
                          </span>
                        </button>
                      )}
                    </div>
                    
                    {showCodeEditor && (
                      <div className={`${isCodeEditorFullscreen ? 'fixed inset-0 z-50 bg-white' : 'bg-white rounded-lg p-2 h-96'}`}>
                        {!isCodeEditorFullscreen && (
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-800">Code Editor</h4>
                            <button
                              onClick={() => setShowCodeEditor(false)}
                              className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                              Hide Editor
                            </button>
                          </div>
                        )}
                        
                        {/* Check if this is a coding round to use enhanced editor */}
                        {(isCodingRound(currentRound?.title) || currentQuestion?.codeEditor?.enabled) ? (
                          <EnhancedCodeEditor
                            language={currentQuestion.codeEditor?.language || selectedLanguage}
                            starterCode={currentQuestion.codeEditor?.starterCode || getDefaultStarterCode(selectedLanguage)}
                            testCases={currentQuestion.codeEditor?.testCases || []}
                            question={currentQuestion?.question || ''}
                            onCodeChange={(code) => {
                              console.log('📝 Code changed (editor 2):', code);
                              setCodeAnswer(code);
                            }}
                            onAIQuestionGenerated={handleAIQuestionFromEditor}
                            disabled={false}
                            isFullScreen={isCodeEditorFullscreen}
                            onToggleFullScreen={() => setIsCodeEditorFullscreen(!isCodeEditorFullscreen)}
                            sessionId={interviewId}
                            languageLocked={isLanguageLocked}
                          />
                        ) : (
                          <CodeEditor
                            language={currentQuestion.codeEditor?.language || selectedLanguage}
                            starterCode={currentQuestion.codeEditor?.starterCode || getDefaultStarterCode(selectedLanguage)}
                            testCases={currentQuestion.codeEditor?.testCases || []}
                            onCodeChange={(code) => {
                              console.log('📝 Code changed (editor 2):', code);
                              setCodeAnswer(code);
                            }}
                            disabled={false}
                          />
                        )}
                      </div>
                    )}
                    
                    {!showCodeEditor && (
                      <div className="text-center py-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-slate-700 via-blue-600 to-indigo-700' 
                            : 'bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-300'
                        }`}>
                          <Code className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                        </div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {isCodingRound(currentRound?.title) ? (
                            <>
                              This is a coding round - all questions include a code editor for hands-on coding.
                              <span className="block mt-1 text-blue-400 font-medium">
                                Enhanced with AI interviewer questions and large code editor!
                              </span>
                            </>
                          ) : (
                            <>
                              This question includes a code editor for hands-on coding.
                              {currentQuestion?.codeEditor?.enabled && (
                                <span className="block mt-1 text-blue-400 font-medium">
                                  Enhanced with AI interviewer questions and large code editor!
                                </span>
                              )}
                            </>
                          )}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Click "Open Code Editor" above to start coding, or continue with voice answers.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Live Transcription */}
              <div className="mb-3">
                <div className={`backdrop-blur-md border-2 rounded-2xl p-4 transition-all duration-500 transform hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
                    : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
                }`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isRecording ? 'bg-red-500 animate-pulse' : isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                    }`}></div>
                    <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live Transcription</h3>
                  </div>
                  <div className="min-h-[80px] max-h-32 overflow-y-auto">
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {transcription || (
                        <span className={`italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {isRecording ? 'Start speaking...' : 'Recording will start automatically when you begin speaking'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                {/* Skip Button */}
                      <button
                  onClick={skipQuestion}
                        disabled={loading || isAISpeaking}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:transform-none backdrop-blur-md border-2 ${
                    isDarkMode 
                      ? 'bg-slate-800/60 hover:bg-slate-700/70 disabled:bg-gray-800/50 text-white border-slate-600/40' 
                      : 'bg-blue-100/80 hover:bg-blue-200/90 disabled:bg-gray-200/50 text-slate-900 border-blue-300 shadow-lg'
                  }`}
                >
                  <SkipForward className="h-4 w-4" />
                  <span>Skip Question</span>
                      </button>
                      
                {/* Done Button for Coding Round */}
                {codeAnswer.trim() && !isCodeDone && (isLiveCodingRound || isCodingRound(currentRound?.title)) && (
                  <div className="mb-4 text-center">
                    <button
                      onClick={handleCodeDone}
                      className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-full px-6 py-3 hover:bg-green-500/30 transition-all duration-300 transform hover:scale-105"
                    >
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-200 text-sm font-medium">
                        Code answer ready - Click to generate AI questions
                      </span>
                    </button>
                  </div>
                )}

                {/* Answer Status Indicator */}
                {(transcription.trim() || codeAnswer.trim()) && (
                  <div className="mb-4 text-center">
                     {(isLiveCodingRound || isSalesRound) && isAiQuestioning && !isAiQuestionAnswered ? (
                       <div className="inline-flex items-center space-x-2 bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-full px-4 py-2">
                         <AlertTriangle className="h-4 w-4 text-yellow-400" />
                         <span className="text-yellow-200 text-sm font-medium">
                           Please answer the AI question before submitting
                         </span>
                       </div>
                     ) : (
                    <div className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-full px-4 py-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-200 text-sm font-medium">
                        {codeAnswer.trim() ? 'Code answer ready' : 'Voice answer ready'}
                      </span>
                    </div>
                     )}
                  </div>
                )}
                      
                {/* Submit Button */}
                      <button
                  onClick={submitAnswer}
                   disabled={(() => {
                     const isDisabled = loading || (!transcription.trim() && !codeAnswer.trim()) || isAISpeaking || 
                       (isLiveCodingRound && isAiQuestioning && !isAiQuestionAnswered) ||
                       (isSalesRound && isAiQuestioning && !isAiQuestionAnswered);
                     console.log('🔍 Submit button disabled check:', {
                       loading,
                       noContent: (!transcription.trim() && !codeAnswer.trim()),
                       isAISpeaking,
                       codingBlock: (isLiveCodingRound && isAiQuestioning && !isAiQuestionAnswered),
                       salesBlock: (isSalesRound && isAiQuestioning && !isAiQuestionAnswered),
                       isAiQuestioning,
                       isAiQuestionAnswered,
                       isDisabled
                     });
                     return isDisabled;
                   })()}
                  className={`flex items-center space-x-2 px-8 py-3 text-white rounded-xl font-black text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 disabled:transform-none shadow-2xl relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 hover:from-slate-700 hover:via-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600' 
                      : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500 disabled:from-gray-400 disabled:to-gray-500'
                  }`}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Button Content */}
                  <div className="relative z-10 flex items-center space-x-2">
                  {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                        <CheckCircle className="h-4 w-4" />
                      <span>Submit Answer</span>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </>
                  )}
                  </div>
                      </button>
                    </div>

              {/* Auto Progress Indicator */}
              <div className="mt-3 text-center">
                <div className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-full px-3 py-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-xs font-medium">
                    Auto-progress enabled
                  </span>
                </div>
                    </div>

              {/* Debug Info */}
              <div className="mt-2 text-center">
                <div className="inline-flex items-center space-x-2 text-xs text-gray-400">
                  <span>Rec: {isRecording ? 'ON' : 'OFF'}</span>
                  <span>AI: {isAISpeaking ? 'ON' : 'OFF'}</span>
                  <span>Cam: {cameraStatus}</span>
                </div>
                    </div>

              {/* Debug Buttons */}
              <div className="mt-2 text-center space-x-2">
                
                <button
                  onClick={async () => {
                    console.log('📹 Manual camera restart triggered');
                    await ensureCameraActive();
                  }}
                  disabled={isCameraRestarting}
                  className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 disabled:cursor-not-allowed border border-blue-400/30 rounded-lg text-blue-200 text-xs transition-all duration-200"
                >
                  {isCameraRestarting ? '🔄 Restarting...' : '📹 Restart Camera'}
                </button>
                  </div>

                  {error && (
                <div className="mt-3 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-3">
                  <p className="text-red-200 text-center text-sm">{error}</p>
                      <button
                        onClick={() => setError(null)}
                    className="text-red-300 text-xs underline mt-1 block mx-auto"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

            {/* Right Side - Video Feed */}
            <div className="w-full lg:w-1/2 flex flex-col items-center px-4 py-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                  playsInline
                  className={`w-full h-64 lg:h-[400px] bg-black rounded-2xl object-cover shadow-2xl border-4 ${
                    isDarkMode ? 'border-white/20' : 'border-blue-200'
                  }`}
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
                  <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center">
                    <div className="text-center text-white">
                      {cameraStatus === 'error' ? (
                        <>
                          <Camera className="h-12 w-12 mx-auto mb-3 text-red-400" />
                          <h3 className="text-lg font-semibold mb-1">Camera Error</h3>
                          <p className="text-gray-300 text-sm">Camera not available</p>
                        </>
                      ) : (
                        <>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
                          <h3 className="text-lg font-semibold mb-1">Connecting Camera...</h3>
                          <p className="text-gray-300 text-sm">Setting up video feed</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                
                
                {/* Status Overlay */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 bg-green-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                      
                      {isRecording && (
                    <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>Recording</span>
                        </div>
                      )}
                      
                      {isAISpeaking && (
                    <div className="flex items-center space-x-2 bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                      <Volume2 className="w-3 h-3 animate-pulse" />
                          <span>AI Speaking</span>
                        </div>
                      )}

                    </div>

          </div>

              {/* Interview Stats */}
              <div className={`mt-4 backdrop-blur-md border-2 rounded-2xl p-4 w-full max-w-4xl transition-all duration-500 transform hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
                  : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
              }`}>
                <h3 className={`text-xl font-black mb-4 text-center ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>Interview Progress</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`text-lg font-black mb-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>{currentRound?.title}</div>
                    <div className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Current Round</div>
        </div>
                  <div className="text-center">
                    <div className={`text-lg font-black mb-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>{questionIndex + 1}/{currentRound?.questions?.length}</div>
                    <div className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Questions</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-black mb-1 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>{allRounds.length}</div>
                    <div className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Total Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black mb-1 text-green-500">ON</div>
                    <div className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Auto-progress</div>
                  </div>
                </div>
              </div>

          </div>
            </div>
            )}
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
