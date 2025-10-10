import React, { useState, useEffect } from 'react';
import PCBRoundInterface from './PCBRoundInterface';
import electronicsInterviewService from '../services/electronicsInterviewService';

const ElectronicsInterviewFlow = ({
  interview,
  onInterviewComplete,
  isDarkMode = true
}) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isPCBRound, setIsPCBRound] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  useEffect(() => {
    if (interview && interview.rounds) {
      const hasPCB = electronicsInterviewService.hasPCBRound(interview);
      setIsPCBRound(hasPCB);
    }
  }, [interview]);

  const handleAnswerSubmit = (answer) => {
    const questionId = interview.rounds[currentRound].questions[currentQuestion].id;
    const roundId = interview.rounds[currentRound].roundId;
    
    setAnswers(prev => ({
      ...prev,
      [roundId]: {
        ...prev[roundId],
        [questionId]: answer
      }
    }));

    // Move to next question or round
    moveToNext();
  };

  const handlePCBDesignSubmit = async (pcbDesignData) => {
    const question = interview.rounds[currentRound].questions[currentQuestion];
    const roundId = interview.rounds[currentRound].roundId;
    
    try {
      // Validate PCB design
      const validation = electronicsInterviewService.validatePCBDesign(pcbDesignData);
      if (!validation.isValid) {
        alert('Please address the following issues:\n' + validation.errors.join('\n'));
        return;
      }

      // Submit PCB design answer
      await electronicsInterviewService.submitPCBDesignAnswer(
        interview.interviewId,
        roundId,
        question.id,
        pcbDesignData
      );

      handleAnswerSubmit(pcbDesignData);
    } catch (error) {
      console.error('Error submitting PCB design:', error);
      alert('Failed to submit PCB design. Please try again.');
    }
  };

  const moveToNext = () => {
    const currentRoundData = interview.rounds[currentRound];
    const nextQuestion = currentQuestion + 1;
    
    if (nextQuestion < currentRoundData.questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      // Move to next round
      const nextRound = currentRound + 1;
      if (nextRound < interview.rounds.length) {
        setCurrentRound(nextRound);
        setCurrentQuestion(0);
      } else {
        // Interview complete
        setInterviewComplete(true);
        if (onInterviewComplete) {
          onInterviewComplete(answers);
        }
      }
    }
  };

  const getCurrentQuestion = () => {
    if (!interview || !interview.rounds || !interview.rounds[currentRound]) {
      return null;
    }
    return interview.rounds[currentRound].questions[currentQuestion];
  };

  const getCurrentRound = () => {
    if (!interview || !interview.rounds || !interview.rounds[currentRound]) {
      return null;
    }
    return interview.rounds[currentRound];
  };

  const isPCBQuestion = (question) => {
    return question.type === 'pcb-design' || question.pcbDesign?.enabled;
  };

  const getProgress = () => {
    if (!interview || !interview.rounds) return 0;
    
    const totalQuestions = interview.rounds.reduce((total, round) => 
      total + round.questions.length, 0
    );
    
    const completedQuestions = interview.rounds.slice(0, currentRound).reduce((total, round) => 
      total + round.questions.length, 0
    ) + currentQuestion;
    
    return Math.round((completedQuestions / totalQuestions) * 100);
  };

  if (interviewComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Interview Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for completing the electronics interview. Your responses have been submitted.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestionData = getCurrentQuestion();
  const currentRoundData = getCurrentRound();

  if (!currentQuestionData || !currentRoundData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Interview not found
          </h2>
        </div>
      </div>
    );
  }

  // Render PCB Design Interface for PCB questions
  if (isPCBQuestion(currentQuestionData)) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {interview.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Round {currentRound + 1} of {interview.rounds.length} - {currentRoundData.title}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Progress: {getProgress()}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestion + 1} of {currentRoundData.questions.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PCB Design Interface */}
        <PCBRoundInterface
          question={currentQuestionData}
          onAnswerSubmit={handlePCBDesignSubmit}
          isDarkMode={isDarkMode}
          timeLimit={currentQuestionData.timeLimit || 6}
        />
      </div>
    );
  }

  // Render regular interview interface for non-PCB questions
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {interview.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Round {currentRound + 1} of {interview.rounds.length} - {currentRoundData.title}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Progress: {getProgress()}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {currentRoundData.questions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {currentQuestionData.question}
            </h2>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <strong>Expected Answer:</strong> {currentQuestionData.expectedAnswer}
            </div>
            
            <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Time Limit: {currentQuestionData.timeLimit || 3} minutes</span>
              <span>Difficulty: {currentQuestionData.difficulty || 'medium'}</span>
            </div>
          </div>

          {/* Answer Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Answer:
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              placeholder="Enter your answer here..."
              onChange={(e) => {
                const questionId = currentQuestionData.id;
                const roundId = currentRoundData.roundId;
                setAnswers(prev => ({
                  ...prev,
                  [roundId]: {
                    ...prev[roundId],
                    [questionId]: e.target.value
                  }
                }));
              }}
            />
          </div>

          {/* Follow-up Questions */}
          {currentQuestionData.followUpQuestions && currentQuestionData.followUpQuestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Follow-up Questions:
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {currentQuestionData.followUpQuestions.map((followUp, index) => (
                  <li key={index}>{followUp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleAnswerSubmit(answers[currentRoundData.roundId]?.[currentQuestionData.id] || '')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Submit Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectronicsInterviewFlow;
