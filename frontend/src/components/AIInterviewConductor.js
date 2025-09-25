import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import aiInterviewService from '../services/aiInterviewService';
import InterviewEvaluationResults from './InterviewEvaluationResults';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Bot,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

const AIInterviewConductor = ({ 
  interviewData, 
  candidateInfo, 
  onComplete, 
  onAnswer 
}) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('ready'); // ready, active, paused, completed
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [roundEvaluations, setRoundEvaluations] = useState({});
  const [isEvaluatingRound, setIsEvaluatingRound] = useState(false);
  const [showRoundResults, setShowRoundResults] = useState(false);
  const [currentRoundEvaluation, setCurrentRoundEvaluation] = useState(null);

  const currentRoundData = interviewData?.rounds?.[currentRound];
  const currentQuestionData = currentRoundData?.questions?.[currentQuestion];
  const totalRounds = interviewData?.rounds?.length || 0;
  const totalQuestions = currentRoundData?.questions?.length || 0;

  // Initialize interview session
  useEffect(() => {
    if (interviewData && candidateInfo && !sessionId) {
      const newSessionId = aiInterviewService.startInterview(interviewData, candidateInfo);
      setSessionId(newSessionId);
    }
  }, [interviewData, candidateInfo, sessionId]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (interviewStatus === 'active' && timeRemaining > 0 && !isPaused) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            handleTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStatus, timeRemaining, isPaused]);

  const handleTimeUp = () => {
    if (currentAnswer.trim()) {
      saveAnswer();
    }
    nextQuestion();
  };

  const startInterview = () => {
    setInterviewStatus('active');
    setTimeRemaining(currentQuestionData?.timeLimit * 60 || 300); // Convert minutes to seconds
  };

  const pauseInterview = () => {
    setIsPaused(!isPaused);
  };

  const saveAnswer = () => {
    // Always record and submit, even if empty, to capture participation and timing
    const normalizedAnswer = (currentAnswer ?? '').toString();

    const answerData = {
      roundId: currentRoundData.roundId,
      questionId: currentQuestionData.id,
      answer: normalizedAnswer,
      timestamp: new Date(),
      timeSpent: (currentQuestionData?.timeLimit * 60) - timeRemaining
    };

    setAnswers(prev => ({
      ...prev,
      [currentQuestionData.id]: answerData
    }));

    // Submit answer to AI interview service
    if (sessionId) {
      const result = aiInterviewService.submitAnswer(sessionId, normalizedAnswer);
      if (!result.success) {
        console.error('Failed to submit answer to AI service:', result.error);
      }
    }

    // Submit answer to backend
    if (candidateInfo && interviewData) {
      const answerPayload = {
        candidateId: candidateInfo.email, // Use email as candidate ID
        candidateName: candidateInfo.name,
        candidateEmail: candidateInfo.email,
        roundId: currentRoundData?.roundId || 'round_1',
        questionId: currentQuestionData.id,
        question: currentQuestionData.question,
        answer: normalizedAnswer,
        timeTaken: (currentQuestionData?.timeLimit * 60) - timeRemaining
      };

      apiService.submitAnswer(interviewData.interviewId, answerPayload)
        .then(result => {
          if (result.success) {
            console.log('Answer submitted successfully:', result.data);
          } else {
            console.error('Failed to submit answer:', result.error);
          }
        })
        .catch(error => {
          console.error('Error submitting answer:', error);
        });
    }

    if (onAnswer) {
      onAnswer(answerData);
    }

    setCurrentAnswer('');
  };

  const nextQuestion = () => {
    saveAnswer();
    
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeRemaining(currentRoundData?.questions?.[currentQuestion + 1]?.timeLimit * 60 || 300);
    } else if (currentRound < totalRounds - 1) {
      // Round completed - evaluate current round
      evaluateCurrentRound();
    } else {
      // Interview completed
      setInterviewStatus('completed');
      triggerEvaluation();
      if (onComplete) {
        onComplete(answers);
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setTimeRemaining(currentRoundData?.questions?.[currentQuestion - 1]?.timeLimit * 60 || 300);
    } else if (currentRound > 0) {
      setCurrentRound(prev => prev - 1);
      setCurrentQuestion(interviewData?.rounds?.[currentRound - 1]?.questions?.length - 1);
      setTimeRemaining(interviewData?.rounds?.[currentRound - 1]?.questions?.[interviewData?.rounds?.[currentRound - 1]?.questions?.length - 1]?.timeLimit * 60 || 300);
    }
  };

  const evaluateCurrentRound = async () => {
    if (!sessionId || !currentRoundData) return;
    
    setIsEvaluatingRound(true);
    try {
      const result = await aiInterviewService.evaluateRound(sessionId, currentRoundData.roundId);
      if (result.success) {
        const roundEval = result.data;
        setRoundEvaluations(prev => ({
          ...prev,
          [currentRoundData.roundId]: roundEval
        }));
        setCurrentRoundEvaluation(roundEval);
        setShowRoundResults(true);
      } else {
        console.error('Round evaluation failed:', result.error);
        // Set fallback round evaluation
        const fallbackEval = {
          roundScore: 60,
          scores: {
            technical: 6,
            communication: 6,
            problemSolving: 6,
            engagement: 5,
            responseQuality: 5
          },
          feedback: "Round completed with basic responses",
          strengths: ["Participated in round"],
          improvements: ["Provide more detailed answers"],
          nextRoundAdvice: "Continue with detailed responses",
          participationMetrics: {
            questionsAnswered: currentQuestion + 1,
            participationRate: 100,
            avgResponseTime: 0,
            completenessRate: 50
          },
          roundSummary: "Round completed with basic participation"
        };
        setRoundEvaluations(prev => ({
          ...prev,
          [currentRoundData.roundId]: fallbackEval
        }));
        setCurrentRoundEvaluation(fallbackEval);
        setShowRoundResults(true);
      }
    } catch (error) {
      console.error('Round evaluation error:', error);
    } finally {
      setIsEvaluatingRound(false);
    }
  };

  const continueToNextRound = () => {
    setShowRoundResults(false);
    setCurrentRoundEvaluation(null);
    setCurrentRound(prev => prev + 1);
    setCurrentQuestion(0);
    setTimeRemaining(interviewData?.rounds?.[currentRound + 1]?.questions?.[0]?.timeLimit * 60 || 300);
  };

  const triggerEvaluation = async () => {
    if (!sessionId) return;
    
    setIsEvaluating(true);
    try {
      const result = await aiInterviewService.evaluateInterview(sessionId);
      if (result.success) {
        setEvaluation(result.data);
      } else {
        console.error('Evaluation failed:', result.error);
        // Set a fallback evaluation
        setEvaluation({
          overallScore: 50,
          scores: {
            technical: 5,
            communication: 5,
            problemSolving: 5,
            engagement: 5,
            culturalFit: 5,
            responseQuality: 5
          },
          detailedFeedback: {
            technical: "Unable to evaluate due to system error",
            communication: "Unable to evaluate due to system error",
            problemSolving: "Unable to evaluate due to system error",
            engagement: "Unable to evaluate due to system error",
            culturalFit: "Unable to evaluate due to system error",
            responseQuality: "Unable to evaluate due to system error"
          },
          strengths: ["Completed interview"],
          areasForImprovement: ["System evaluation error"],
          recommendation: "Maybe",
          confidenceLevel: "Low",
          nextSteps: "Manual review required"
        });
      }
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'technical': return 'text-blue-600 bg-blue-100';
      case 'behavioral': return 'text-purple-600 bg-purple-100';
      case 'situational': return 'text-orange-600 bg-orange-100';
      case 'culture': return 'text-green-600 bg-green-100';
      case 'general': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Show round evaluation loading
  if (isEvaluatingRound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Evaluating Round Performance
          </h1>
          
          <p className="text-gray-600 mb-6">
            Our AI is analyzing your responses for this round and generating detailed feedback...
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Round Summary:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Round: {currentRoundData?.title}</p>
              <p>• Questions Answered: {currentQuestion + 1}</p>
              <p>• Duration: {currentRoundData?.duration} minutes</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show round evaluation results
  if (showRoundResults && currentRoundEvaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentRoundData?.title} Completed!
            </h1>
            <p className="text-gray-600">
              Great job! Here's your performance evaluation for this round.
            </p>
          </div>

          {/* Round Score */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentRoundEvaluation.roundScore}%
            </div>
            <div className="text-sm text-blue-700">Round Score</div>
            <div className="text-xs text-blue-600 mt-1">
              {currentRoundEvaluation.roundScore >= 80 ? 'Excellent performance!' : 
               currentRoundEvaluation.roundScore >= 60 ? 'Good performance' : 
               'Room for improvement'}
            </div>
          </div>

          {/* Detailed Scores */}
          {currentRoundEvaluation.scores && (
            <div className="bg-white border rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Detailed Performance Breakdown:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(currentRoundEvaluation.scores).map(([category, score]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-bold text-gray-900">{score}/10</div>
                    <div className="text-xs text-gray-500 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-orange-500" />
              Feedback
            </h3>
            <p className="text-gray-700">{currentRoundEvaluation.feedback}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Strengths */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Strengths
              </h3>
              <div className="space-y-2">
                {currentRoundEvaluation.strengths?.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                Areas for Improvement
              </h3>
              <div className="space-y-2">
                {currentRoundEvaluation.improvements?.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Participation Metrics */}
          {currentRoundEvaluation.participationMetrics && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Participation Metrics:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{currentRoundEvaluation.participationMetrics.questionsAnswered}</div>
                  <div className="text-gray-500">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{currentRoundEvaluation.participationMetrics.participationRate}%</div>
                  <div className="text-gray-500">Participation Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{currentRoundEvaluation.participationMetrics.completenessRate}%</div>
                  <div className="text-gray-500">Completeness Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{currentRoundEvaluation.participationMetrics.avgResponseTime}s</div>
                  <div className="text-gray-500">Avg Response Time</div>
                </div>
              </div>
            </div>
          )}

          {/* Next Round Advice */}
          {currentRoundEvaluation.nextRoundAdvice && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                Advice for Next Round
              </h3>
              <p className="text-purple-700 text-sm">{currentRoundEvaluation.nextRoundAdvice}</p>
            </div>
          )}

          {/* Progress */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Interview Progress</span>
              <span className="text-sm text-gray-500">Round {currentRound + 1} of {totalRounds}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <button
              onClick={continueToNextRound}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <span>Continue to Next Round</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStatus === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              AI Interview Ready
            </h1>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {interviewData?.title}
              </h2>
              <p className="text-gray-600">
                {totalRounds} rounds • {interviewData?.totalDuration} minutes total
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Interview Structure:</h3>
              <div className="space-y-2">
                {interviewData?.rounds?.map((round, index) => (
                  <div key={round.roundId} className="flex justify-between items-center text-sm">
                    <span className="font-medium">Round {round.roundNumber}: {round.title}</span>
                    <span className="text-gray-500">{round.duration} min</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Answer each question thoughtfully and completely</li>
                <li>• You can pause and resume the interview anytime</li>
                <li>• Use the timer to pace your responses</li>
                <li>• Be honest and authentic in your answers</li>
                <li>• Take your time to think before responding</li>
              </ul>
            </div>

            <button
              onClick={startInterview}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start Interview</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStatus === 'completed') {
    if (isEvaluating) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Evaluating Your Performance
            </h1>
            
            <p className="text-gray-600 mb-6">
              Our AI is analyzing your responses and generating detailed feedback. This may take a few moments...
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Interview Summary:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Total Rounds: {totalRounds}</p>
                <p>• Questions Answered: {Object.keys(answers).length}</p>
                <p>• Duration: {interviewData?.totalDuration} minutes</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (evaluation) {
      return (
        <InterviewEvaluationResults 
          evaluation={evaluation}
          candidateInfo={candidateInfo}
          interviewData={interviewData}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Interview Completed!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for completing the interview. Your responses have been recorded and will be reviewed by our team.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Interview Summary:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Total Rounds: {totalRounds}</p>
              <p>• Questions Answered: {Object.keys(answers).length}</p>
              <p>• Duration: {interviewData?.totalDuration} minutes</p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            You will be contacted with next steps within 2-3 business days.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {interviewData?.title}
              </h1>
              <p className="text-gray-600">
                Round {currentRound + 1} of {totalRounds}: {currentRoundData?.title}
              </p>
              </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div className={`text-2xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
              </div>
            </div>
            
              <button
                onClick={pauseInterview}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
                </div>
              </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: `${((currentRound * totalQuestions + currentQuestion + 1) / (totalRounds * totalQuestions)) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuestionTypeColor(currentQuestionData?.type)}`}>
                  {currentQuestionData?.type?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestionData?.difficulty)}`}>
                  {currentQuestionData?.difficulty?.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQuestionData?.question}
              </h2>
            </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={6}
                disabled={isPaused}
                />
              </div>

            {/* Follow-up Questions */}
            {currentQuestionData?.followUpQuestions?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Follow-up Questions:</h3>
                <div className="space-y-2">
                  {currentQuestionData.followUpQuestions.map((followUp, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {followUp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
                <button
            onClick={previousQuestion}
            disabled={currentRound === 0 && currentQuestion === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
                </button>
                
          <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
              Round {currentRound + 1} of {totalRounds}
                </span>
              </div>

                <button
            onClick={nextQuestion}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors"
          >
            <span>
              {currentRound === totalRounds - 1 && currentQuestion === totalQuestions - 1 
                ? 'Complete Interview' 
                : 'Next Question'
              }
            </span>
            <ArrowRight className="h-4 w-4" />
                </button>
              </div>
      </div>
    </div>
  );
};

export default AIInterviewConductor;
