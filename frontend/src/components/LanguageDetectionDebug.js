import React, { useState } from 'react';
import dynamicInterviewService from '../services/dynamicInterviewService';

const LanguageDetectionDebug = () => {
  const [testPrompt, setTestPrompt] = useState('');
  const [result, setResult] = useState(null);

  const testLanguageDetection = () => {
    if (!testPrompt.trim()) return;

    const detectedLanguage = dynamicInterviewService.detectProgrammingLanguage(testPrompt);
    const jobDetails = dynamicInterviewService.extractJobDetailsFromPrompt(testPrompt);
    const roleConfig = dynamicInterviewService.getRoleSpecificConfig(jobDetails.title, detectedLanguage);

    setResult({
      prompt: testPrompt,
      detectedLanguage,
      jobDetails,
      roleConfig
    });
  };

  const examplePrompts = [
    "Senior Python Developer at a fintech startup, Django/Flask experience, data science background, $90k-130k, 3+ years experience",
    "React Developer for SaaS company, Next.js/TypeScript skills, San Francisco, full-time, modern frontend development",
    "Java Developer at enterprise company, Spring Boot/Microservices, $80k-120k, 2+ years experience, cloud deployment",
    "Python Developer with machine learning experience, TensorFlow/PyTorch, data analysis, $85k-125k",
    "Frontend Developer with React/JSX experience, component-based architecture, modern web development"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              🔍 Language Detection Debug Tool
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
                placeholder="Enter a job description to test language detection..."
              />
            </div>

            <div className="mb-6">
              <button
                onClick={testLanguageDetection}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Test Language Detection
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Test Examples:</h3>
              <div className="space-y-2">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setTestPrompt(prompt)}
                    className="block w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {result && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Results:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Detected Language:</h4>
                    <div className="bg-white p-3 rounded border">
                      <span className="text-2xl mr-2">
                        {result.detectedLanguage === 'python' ? '🐍' : 
                         result.detectedLanguage === 'jsx' ? '⚛️' :
                         result.detectedLanguage === 'typescript' ? '🔷' :
                         result.detectedLanguage === 'javascript' ? '🟨' :
                         result.detectedLanguage === 'java' ? '☕' : '💻'}
                      </span>
                      <span className="font-mono text-lg font-bold">
                        {result.detectedLanguage.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Job Title:</h4>
                    <div className="bg-white p-3 rounded border">
                      {result.jobDetails.title}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Role Configuration:</h4>
                  <div className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Language:</strong> {result.roleConfig.language}
                      </div>
                      <div>
                        <strong>Frameworks:</strong> {result.roleConfig.frameworks.join(', ')}
                      </div>
                      <div>
                        <strong>Tools:</strong> {result.roleConfig.tools.join(', ')}
                      </div>
                      <div>
                        <strong>Concepts:</strong> {result.roleConfig.concepts.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Starter Code:</h4>
                  <div className="bg-gray-900 text-green-400 p-3 rounded border font-mono text-sm overflow-x-auto">
                    <pre>{result.roleConfig.starterCode}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageDetectionDebug;
