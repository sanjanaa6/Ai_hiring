import React from 'react';
import ModernInterview from './ModernInterview';

const InterviewTest = () => {
  const mockInterviewId = 'test-interview-123';
  const mockCandidateInfo = {
    name: 'Test User',
    email: 'test@example.com',
    position: 'Software Engineer'
  };

  const handleComplete = (result) => {
    console.log('Interview completed:', result);
    alert('Interview completed successfully!');
  };

  const handleError = (error) => {
    console.error('Interview error:', error);
    alert(`Interview error: ${error}`);
  };

  return (
    <div className="h-screen">
      <ModernInterview
        interviewId={mockInterviewId}
        candidateInfo={mockCandidateInfo}
        onComplete={handleComplete}
        onError={handleError}
      />
    </div>
  );
};

export default InterviewTest;