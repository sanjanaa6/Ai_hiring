import { useState, useCallback } from 'react';

export const useInterviewState = () => {
  const [step, setStep] = useState('setup'); // setup, face-positioning, interview, round-selection, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [allRounds, setAllRounds] = useState([]);
  const [completedRounds, setCompletedRounds] = useState(new Set());
  const [networkRetryCount, setNetworkRetryCount] = useState(0);
  const [questionStartCountdown, setQuestionStartCountdown] = useState(0);
  const [isLiveCodingRound, setIsLiveCodingRound] = useState(false);
  const [isSalesRound, setIsSalesRound] = useState(false);
  const [isPCBRound, setIsPCBRound] = useState(false);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isLanguageLocked, setIsLanguageLocked] = useState(false);
  const [aiDeterminedLanguage, setAiDeterminedLanguage] = useState(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [isCodeEditorFullscreen, setIsCodeEditorFullscreen] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [currentAiQuestionIndex, setCurrentAiQuestionIndex] = useState(0);
  const [isAiQuestioning, setIsAiQuestioning] = useState(false);
  const [aiQuestionAnswers, setAiQuestionAnswers] = useState([]);
  const [interviewData, setInterviewData] = useState(null);
  const [aiQuestionMap, setAiQuestionMap] = useState(new Map());
  const [isCodeDone, setIsCodeDone] = useState(false);
  const [isAiQuestionAnswered, setIsAiQuestionAnswered] = useState(false);

  const resetInterviewState = useCallback(() => {
    setStep('setup');
    setLoading(false);
    setError(null);
    setUserProgress(null);
    setCurrentQuestion(null);
    setCurrentRound(null);
    setTimeRemaining(0);
    setIsAISpeaking(false);
    setQuestionIndex(0);
    setRoundIndex(0);
    setAllRounds([]);
    setCompletedRounds(new Set());
    setNetworkRetryCount(0);
    setQuestionStartCountdown(0);
    setIsLiveCodingRound(false);
    setIsSalesRound(false);
    setIsPCBRound(false);
    setCodeAnswer('');
    setSelectedLanguage('javascript');
    setIsLanguageLocked(false);
    setAiDeterminedLanguage(null);
    setShowCodeEditor(false);
    setIsCodeEditorFullscreen(false);
    setAiQuestions([]);
    setCurrentAiQuestionIndex(0);
    setIsAiQuestioning(false);
    setAiQuestionAnswers([]);
    setInterviewData(null);
    setAiQuestionMap(new Map());
    setIsCodeDone(false);
    setIsAiQuestionAnswered(false);
  }, []);

  return {
    // State
    step,
    loading,
    error,
    userProgress,
    currentQuestion,
    currentRound,
    timeRemaining,
    isAISpeaking,
    questionIndex,
    roundIndex,
    allRounds,
    completedRounds,
    networkRetryCount,
    questionStartCountdown,
    isLiveCodingRound,
    isSalesRound,
    isPCBRound,
    codeAnswer,
    selectedLanguage,
    isLanguageLocked,
    aiDeterminedLanguage,
    showCodeEditor,
    isCodeEditorFullscreen,
    aiQuestions,
    currentAiQuestionIndex,
    isAiQuestioning,
    aiQuestionAnswers,
    interviewData,
    aiQuestionMap,
    isCodeDone,
    isAiQuestionAnswered,
    
    // Setters
    setStep,
    setLoading,
    setError,
    setUserProgress,
    setCurrentQuestion,
    setCurrentRound,
    setTimeRemaining,
    setIsAISpeaking,
    setQuestionIndex,
    setRoundIndex,
    setAllRounds,
    setCompletedRounds,
    setNetworkRetryCount,
    setQuestionStartCountdown,
    setIsLiveCodingRound,
    setIsSalesRound,
    setIsPCBRound,
    setCodeAnswer,
    setSelectedLanguage,
    setIsLanguageLocked,
    setAiDeterminedLanguage,
    setShowCodeEditor,
    setIsCodeEditorFullscreen,
    setAiQuestions,
    setCurrentAiQuestionIndex,
    setIsAiQuestioning,
    setAiQuestionAnswers,
    setInterviewData,
    setAiQuestionMap,
    setIsCodeDone,
    setIsAiQuestionAnswered,
    
    // Actions
    resetInterviewState
  };
};
