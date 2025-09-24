import React, { useState } from 'react';
import LiveCodingRound from './LiveCodingRound';

const CodingRoundTest = () => {
  const [testComplete, setTestComplete] = useState(false);
  const [testData, setTestData] = useState(null);

  const handleComplete = (data) => {
    console.log('✅ Coding round completed with data:', data);
    setTestData(data);
    setTestComplete(true);
  };

  const handleError = (error) => {
    console.error('❌ Coding round error:', error);
  };

  if (testComplete) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Coding Round Test - Completed</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success!</strong> The coding round completed successfully.
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Test Data:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
        <button
          onClick={() => {
            setTestComplete(false);
            setTestData(null);
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Another Test
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Coding Round Test</h1>
        <p className="text-sm">Testing Submit and Next buttons functionality</p>
      </div>
      <div className="w-full">
        <LiveCodingRound
          interviewId="test-interview-123"
          question="Write a function that takes an array of numbers and returns the sum of all even numbers."
          language="javascript"
          starterCode="function sumEvenNumbers(numbers) {\n  // Your code here\n  return 0;\n}"
          onComplete={handleComplete}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default CodingRoundTest;
