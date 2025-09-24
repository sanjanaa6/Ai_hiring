import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

const SimpleCodingTest = () => {
  const [code, setCode] = useState('function sumEvenNumbers(numbers) {\n  // Your code here\n  return 0;\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNext, setIsNext] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      alert('Please write some code before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Code submitted:', code);
      setSubmitted(true);
      alert('Code submitted successfully!');
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('Failed to submit code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setIsNext(true);
    console.log('Moving to next question...');
    alert('Moving to next question!');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Simple Coding Test</h1>
        <p className="text-sm">Testing Submit and Next buttons</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Code Editor */}
        <div className="w-1/2 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-2">Question</h3>
            <p className="text-gray-700 text-sm mb-4">
              Write a function that takes an array of numbers and returns the sum of all even numbers.
            </p>
            
            <div className="flex-1 overflow-hidden">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-3 border border-gray-300 rounded font-mono text-sm resize-none"
                placeholder="Write your code here..."
              />
            </div>
          </div>
        </div>

        {/* Right Side - AI Interviewer */}
        <div className="w-1/2 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-4">AI Interviewer</h3>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">
                  I'm watching your code and will ask questions about your approach.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  Why did you choose to use this approach for solving the problem?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Status: {submitted ? 'Submitted' : 'In Progress'}
            </div>
            {isNext && (
              <div className="text-sm text-green-600">
                Ready for Next Question
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSubmitCode}
              disabled={isSubmitting || !code.trim()}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting || !code.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Code'}</span>
            </button>
            
            <button
              onClick={handleNextQuestion}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next Question</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCodingTest;
