import React, { useState } from 'react';
import apiService from '../services/apiService';

const InterviewTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testInterviewGeneration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.generateDynamicInterview({
        prompt: 'Senior Python Developer with Django/Flask experience, 5+ years, full-stack development'
      });

      console.log('✅ Test response:', response);
      setResult(response);
    } catch (err) {
      console.error('❌ Test error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Interview Generation Test</h1>
      
      <button
        onClick={testInterviewGeneration}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Interview Generation'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Success!</h3>
          <div className="mt-2">
            <p><strong>Title:</strong> {result.data.title}</p>
            <p><strong>Language:</strong> {result.data.language}</p>
            <p><strong>Total Rounds:</strong> {result.data.rounds.length}</p>
            <div className="mt-2">
              <strong>Round Titles:</strong>
              <ul className="list-disc list-inside">
                {result.data.rounds.map((round, index) => (
                  <li key={index}>
                    Round {round.roundNumber}: {round.title}
                    {round.roundNumber === 4 && (
                      <span className="text-blue-600 font-bold"> ← CODING ROUND</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {result.data.rounds[3] && (
              <div className="mt-2">
                <strong>Round 4 Details:</strong>
                <ul className="list-disc list-inside">
                  <li>Title: {result.data.rounds[3].title}</li>
                  <li>Questions: {result.data.rounds[3].questions.length}</li>
                  <li>First Question Type: {result.data.rounds[3].questions[0]?.type}</li>
                  <li>Code Editor Enabled: {result.data.rounds[3].questions[0]?.codeEditor?.enabled ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewTest;
