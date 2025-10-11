import React, { useState, useEffect, useCallback } from 'react';

const PCBInterviewInterface = ({
  question,
  onAnswerSubmit,
  onNextQuestion,
  isDarkMode = true,
  timeLimit = 6
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert minutes to seconds
  const [answer, setAnswer] = useState('');
  const [pcbDesignData, setPcbDesignData] = useState(null);

  // Reset state when question changes
  useEffect(() => {
    setIsSubmitted(false);
    setTimeLeft(timeLimit * 60);
    setAnswer('');
    setPcbDesignData(null);
  }, [question, timeLimit]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    
    const designData = {
      designNotes: answer,
      timeSpent: (timeLimit * 60) - timeLeft,
      submittedAt: new Date().toISOString(),
      pcbDesignData: pcbDesignData
    };
    
    if (onAnswerSubmit) {
      onAnswerSubmit(designData);
    }
  }, [isSubmitted, answer, timeLimit, timeLeft, pcbDesignData, onAnswerSubmit]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      // Auto-submit when time runs out
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, handleSubmit]);

  // Handle next question
  const handleNextQuestion = () => {
    if (onNextQuestion) {
      onNextQuestion();
    }
  };

  // Handle PCB app navigation
  const handleOpenPCBApp = () => {
    // Open PCB app in new tab
    const pcbUrl = '/pcb';
    window.open(pcbUrl, '_blank');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PCB Design Challenge
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time: {formatTime(timeLeft)} | Status: {isSubmitted ? 'Submitted' : 'In Progress'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isSubmitted ? 'Design submitted successfully' : 'Use the PCB design tool to complete your design'}
              </div>
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Design
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Question {question?.questionNumber || ''}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {question?.question || 'Design a functional PCB layout with proper component placement and routing.'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                <strong>Requirements:</strong><br />
                {question?.expectedAnswer || 'Create a working circuit with proper component placement, routing, and design for manufacturability.'}
              </div>
            </div>

            {/* PCB App Access */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                PCB Design Tool
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click the button below to open the professional PCB design interface in a new tab. 
                Use the tool to create your circuit design, then return here to submit your explanation.
              </div>
              <button
                onClick={handleOpenPCBApp}
                className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors"
              >
                🛠️ Open PCB Design Tool
              </button>
            </div>
          </div>

          {/* Design Notes Panel */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Design Explanation
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              After completing your PCB design in the tool above, explain your design choices, 
              component selection rationale, and any design considerations here.
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain your PCB design choices, component selection rationale, and any design considerations..."
              className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={12}
              disabled={isSubmitted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCBInterviewInterface;
