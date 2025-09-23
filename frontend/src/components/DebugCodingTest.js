import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const DebugCodingTest = () => {
  const [codeAnswer, setCodeAnswer] = useState('');
  const [isCodeDone, setIsCodeDone] = useState(false);
  const [isAiQuestionAnswered, setIsAiQuestionAnswered] = useState(false);

  const handleCodeDone = () => {
    console.log('🎯 Debug: handleCodeDone called');
    console.log('📝 Debug: codeAnswer:', codeAnswer);
    setIsCodeDone(true);
  };

  const handleSubmit = () => {
    console.log('🎯 Debug: handleSubmit called');
    console.log('📝 Debug: isCodeDone:', isCodeDone);
    console.log('📝 Debug: isAiQuestionAnswered:', isAiQuestionAnswered);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Coding Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Code Editor</h2>
        <textarea
          value={codeAnswer}
          onChange={(e) => {
            console.log('📝 Debug: Code changed:', e.target.value);
            setCodeAnswer(e.target.value);
          }}
          className="w-full h-32 p-4 border border-gray-300 rounded-lg"
          placeholder="Write your code here..."
        />
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>codeAnswer:</strong> "{codeAnswer}"</p>
          <p><strong>codeAnswer.trim():</strong> "{codeAnswer.trim()}"</p>
          <p><strong>isCodeDone:</strong> {isCodeDone.toString()}</p>
          <p><strong>isAiQuestionAnswered:</strong> {isAiQuestionAnswered.toString()}</p>
          <p><strong>Should show Done button:</strong> {(!isCodeDone && codeAnswer.trim()).toString()}</p>
          <p><strong>Should disable Submit:</strong> {(isCodeDone && !isAiQuestionAnswered).toString()}</p>
        </div>
      </div>

      <div className="flex space-x-4">
        {/* Done Button */}
        {!isCodeDone && codeAnswer.trim() && (
          <button
            onClick={handleCodeDone}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Done</span>
          </button>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!codeAnswer.trim() || (isCodeDone && !isAiQuestionAnswered)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${
            !codeAnswer.trim() || (isCodeDone && !isAiQuestionAnswered)
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Submit</span>
        </button>
      </div>

      {isCodeDone && !isAiQuestionAnswered && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800">
            <strong>AI Question:</strong> "Why did you choose to use apply() method instead of call() method when invoking the function?"
          </p>
          <button
            onClick={() => setIsAiQuestionAnswered(true)}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Answer AI Question
          </button>
        </div>
      )}

      {isCodeDone && isAiQuestionAnswered && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800">
            <strong>AI Response:</strong> "That's a great explanation! Apply() is indeed perfect for this use case..."
          </p>
        </div>
      )}
    </div>
  );
};

export default DebugCodingTest;
