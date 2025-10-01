import React, { useState } from 'react';
import ModernInterview from './ModernInterview';

const ModernInterviewDemo = () => {
  const [showInterview, setShowInterview] = useState(false);

  // Mock interview data
  const mockInterviewId = 'demo-interview-123';
  const mockCandidateInfo = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    position: 'Software Engineer'
  };

  const handleComplete = (results) => {
    console.log('Interview completed:', results);
    setShowInterview(false);
    alert('Interview completed successfully!');
  };

  const handleError = (error) => {
    console.error('Interview error:', error);
    alert(`Interview error: ${error}`);
  };

  if (showInterview) {
    return (
      <ModernInterview
        interviewId={mockInterviewId}
        candidateInfo={mockCandidateInfo}
        onComplete={handleComplete}
        onError={handleError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Modern Interview Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Click the button below to start the redesigned interview interface.
        </p>
        <button
          onClick={() => setShowInterview(true)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
};

export default ModernInterviewDemo;
