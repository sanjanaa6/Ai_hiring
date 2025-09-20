import React, { useState } from 'react';
import aiInterviewService from '../services/aiInterviewService';

const AIEvaluationTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    candidateName: 'John Doe',
    candidateEmail: 'john@example.com',
    jobTitle: 'Frontend Developer',
    answers: [
      {
        question: 'What is React and how does it work?',
        answer: 'React is a JavaScript library for building user interfaces. It uses a virtual DOM to efficiently update the UI when data changes. React components are reusable pieces of UI that can be composed together.'
      },
      {
        question: 'Explain the difference between state and props in React.',
        answer: 'State is internal data that belongs to a component and can be changed over time. Props are external data passed down from parent components and are read-only. State changes trigger re-renders, while props changes come from parent components.'
      },
      {
        question: 'How would you handle errors in a React application?',
        answer: 'I would use error boundaries to catch JavaScript errors anywhere in the component tree. I would also implement try-catch blocks for async operations and use proper error handling in API calls. For user feedback, I would show error messages and provide fallback UI.'
      }
    ]
  });

  const runTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      // Create a test interview session
      const sessionId = 'test-session-' + Date.now();
      
      // Start interview
      const startResult = aiInterviewService.startInterview(
        sessionId,
        {
          title: 'Test Interview',
          description: 'Testing AI evaluation',
          rounds: [
            {
              roundId: 'round1',
              title: 'Technical Round',
              questions: testData.answers.map((_, index) => ({
                questionId: `q${index + 1}`,
                question: testData.answers[index].question,
                timeLimit: 5
              }))
            }
          ]
        },
        {
          name: testData.candidateName,
          email: testData.candidateEmail
        }
      );

      if (!startResult.success) {
        throw new Error('Failed to start interview: ' + startResult.error);
      }

      // Submit answers
      for (let i = 0; i < testData.answers.length; i++) {
        const answerResult = aiInterviewService.submitAnswer(
          sessionId,
          testData.answers[i].answer
        );
        
        if (!answerResult.success) {
          throw new Error('Failed to submit answer: ' + answerResult.error);
        }
      }

      // Evaluate interview
      console.log('🧪 Starting AI evaluation test...');
      const evaluationResult = await aiInterviewService.evaluateInterview(sessionId);
      
      console.log('🧪 AI evaluation result:', evaluationResult);
      
      setTestResults({
        success: evaluationResult.success,
        data: evaluationResult.data,
        error: evaluationResult.error
      });

    } catch (error) {
      console.error('🧪 Test failed:', error);
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">AI Evaluation Test</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Test Data:</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p><strong>Candidate:</strong> {testData.candidateName}</p>
          <p><strong>Email:</strong> {testData.candidateEmail}</p>
          <p><strong>Job:</strong> {testData.jobTitle}</p>
          <p><strong>Answers:</strong> {testData.answers.length} questions</p>
        </div>
      </div>

      <button
        onClick={runTest}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {isLoading ? 'Testing AI Evaluation...' : 'Run AI Evaluation Test'}
      </button>

      {testResults && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Test Results:</h3>
          
          {testResults.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ AI Evaluation Successful!</h4>
              
              <div className="space-y-4">
                <div>
                  <strong>Overall Score:</strong> {testResults.data.overallScore}%
                </div>
                
                <div>
                  <strong>Detailed Feedback:</strong>
                  <div className="mt-2 space-y-2">
                    {Object.entries(testResults.data.detailedFeedback || {}).map(([category, feedback]) => (
                      <div key={category} className="bg-white p-2 rounded border">
                        <strong className="capitalize">{category}:</strong> {feedback}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <strong>Strengths:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {(testResults.data.strengths || []).map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <strong>Areas for Improvement:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {(testResults.data.areasForImprovement || []).map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <strong>Recommendation:</strong> {testResults.data.recommendation}
                </div>
                
                <div>
                  <strong>Confidence Level:</strong> {testResults.data.confidenceLevel}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">❌ AI Evaluation Failed</h4>
              <p className="text-red-700">{testResults.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> This test will help debug the AI evaluation process. Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default AIEvaluationTest;
