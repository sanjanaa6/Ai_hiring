import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User, 
  Bot,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Mic,
  MicOff,
  Send
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

  const currentRoundData = interviewData?.rounds?.[currentRound];
  const currentQuestionData = currentRoundData?.questions?.[currentQuestion];
  const totalRounds = interviewData?.rounds?.length || 0;
  const totalQuestions = currentRoundData?.questions?.length || 0;

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
      // Move to next round
      setCurrentRound(prev => prev + 1);
      setCurrentQuestion(0);
      setTimeRemaining(interviewData?.rounds?.[currentRound + 1]?.questions?.[0]?.timeLimit * 60 || 300);
        } else {
          // Interview completed
          setInterviewStatus('completed');
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
