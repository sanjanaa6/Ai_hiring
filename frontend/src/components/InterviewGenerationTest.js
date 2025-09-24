import React, { useState } from 'react';
import dynamicInterviewService from '../services/dynamicInterviewService';

const InterviewGenerationTest = () => {
  const [testPrompt, setTestPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateInterview = async () => {
    if (!testPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Testing interview generation with prompt:', testPrompt);
      const response = await dynamicInterviewService.generateDynamicInterview(testPrompt);
      console.log('✅ Interview generation response:', response);
      setResult(response);
    } catch (err) {
      console.error('❌ Interview generation error:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const testPrompts = [
    "Senior Python Developer at a fintech startup, Django/Flask experience, data science background, $90k-130k, 3+ years experience",
    "React Developer for SaaS company, Next.js/TypeScript skills, San Francisco, full-time, modern frontend development",
    "Java Developer at enterprise company, Spring Boot/Microservices, $80k-120k, 2+ years experience, cloud deployment"
  ];

  const extractFirstQuestions = (interview) => {
    if (!interview?.data?.rounds?.length) return [];
    
    return interview.data.rounds.slice(0, 2).map(round => ({
      roundTitle: round.title,
      firstQuestion: round.questions?.[0]?.question || 'No questions found',
      language: interview.data.language
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              🧪 Interview Generation Test
            </h1>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Prompt:
              </label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter a job description to test interview generation..."
              />
            </div>

            <div className="mb-6 flex gap-4">
              <button
                onClick={generateInterview}
                disabled={isGenerating || !testPrompt.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Interview'}
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Test Examples:</h3>
              <div className="space-y-2">
                {testPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setTestPrompt(prompt)}
                    className="block w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  >
                    <span className="font-medium">
                      {prompt.includes('Python') ? '🐍 Python Test:' : 
                       prompt.includes('React') ? '⚛️ React Test:' :
                       prompt.includes('Java') ? '☕ Java Test:' : '💻 Test:'}
                    </span>
                    <br />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error:</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Interview Generated Successfully!</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Detected Language:</h4>
                    <div className="bg-white p-3 rounded border">
                      <span className="text-2xl mr-2">
                        {result.data?.language === 'python' ? '🐍' : 
                         result.data?.language === 'jsx' ? '⚛️' :
                         result.data?.language === 'typescript' ? '🔷' :
                         result.data?.language === 'javascript' ? '🟨' :
                         result.data?.language === 'java' ? '☕' : '💻'}
                      </span>
                      <span className="font-mono text-lg font-bold">
                        {result.data?.language?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Language Locked:</h4>
                    <div className="bg-white p-3 rounded border">
                      <span className="text-2xl mr-2">
                        {result.data?.languageLocked ? '🔒' : '🔓'}
                      </span>
                      <span className="font-medium">
                        {result.data?.languageLocked ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Interview Title:</h4>
                  <div className="bg-white p-3 rounded border">
                    {result.data?.title}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Sample Questions:</h4>
                  <div className="bg-white p-3 rounded border space-y-3">
                    {extractFirstQuestions(result).map((item, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-3">
                        <div className="font-medium text-gray-800">{item.roundTitle}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.firstQuestion}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Total Rounds: {result.data?.rounds?.length || 0} | 
                  Total Questions: {result.data?.rounds?.reduce((acc, round) => acc + (round.questions?.length || 0), 0) || 0}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGenerationTest;
