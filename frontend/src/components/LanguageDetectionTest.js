import React, { useState } from 'react';
import dynamicInterviewService from '../services/dynamicInterviewService';

const LanguageDetectionTest = () => {
  const [testPrompts, setTestPrompts] = useState([
    "React Developer for SaaS company, Next.js/TypeScript skills, modern frontend development",
    "Frontend Developer with React/JSX experience, component-based architecture, modern web development",
    "TypeScript Developer with React/Angular experience, Node.js backend, $85k-125k, 2+ years experience",
    "Senior Python Developer at a fintech startup, Django/Flask experience, data science background",
    "Java Developer at enterprise company, Spring Boot/Microservices, cloud deployment",
    "C# Developer for .NET applications, Azure/Entity Framework, enterprise development",
    "C++ Developer for embedded systems, Qt/Boost libraries, performance optimization",
    "PHP Developer with Laravel/Symfony experience, web application development",
    "Ruby Developer with Rails experience, full-stack web development",
    "Go Developer for microservices, Gin/Echo frameworks, cloud-native applications"
  ]);

  const [results, setResults] = useState([]);

  const testLanguageDetection = () => {
    const newResults = testPrompts.map(prompt => {
      const detectedLanguage = dynamicInterviewService.detectProgrammingLanguage(prompt);
      const roleConfig = dynamicInterviewService.getRoleSpecificConfig(
        dynamicInterviewService.extractJobTitle(prompt), 
        detectedLanguage
      );
      
      return {
        prompt,
        detectedLanguage,
        roleConfig,
        starterCode: roleConfig.starterCode
      };
    });
    
    setResults(newResults);
  };

  const getLanguageIcon = (language) => {
    const icons = {
      jsx: '⚛️',
      typescript: '🔷',
      python: '🐍',
      javascript: '🟨',
      java: '☕',
      csharp: '🔷',
      cpp: '⚡',
      php: '🐘',
      ruby: '💎',
      go: '🐹',
      rust: '🦀',
      swift: '🦉',
      kotlin: '🟣',
      scala: '🔴'
    };
    return icons[language] || '💻';
  };

  const getLanguageColor = (language) => {
    const colors = {
      jsx: 'bg-blue-100 text-blue-800 border-blue-300',
      typescript: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      python: 'bg-green-100 text-green-800 border-green-300',
      javascript: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      java: 'bg-orange-100 text-orange-800 border-orange-300',
      csharp: 'bg-blue-100 text-blue-800 border-blue-300',
      cpp: 'bg-purple-100 text-purple-800 border-purple-300',
      php: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ruby: 'bg-red-100 text-red-800 border-red-300',
      go: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      rust: 'bg-gray-100 text-gray-800 border-gray-300',
      swift: 'bg-orange-100 text-orange-800 border-orange-300',
      kotlin: 'bg-purple-100 text-purple-800 border-purple-300',
      scala: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[language] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Language Detection Test</h1>
            <p className="text-gray-600 mb-6">
              Test the AI's ability to detect programming languages from job descriptions
            </p>
            <button
              onClick={testLanguageDetection}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Language Detection Test
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Prompt and Detection */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Job Description:</h3>
                      <p className="text-gray-700 mb-4 italic">"{result.prompt}"</p>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Detected Language:</h4>
                        <div className={`inline-flex items-center px-3 py-2 rounded-full border ${getLanguageColor(result.detectedLanguage)}`}>
                          <span className="mr-2">{getLanguageIcon(result.detectedLanguage)}</span>
                          <span className="font-medium">{result.detectedLanguage.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Role Config */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Role Configuration:</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Frameworks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.roleConfig.frameworks.map((framework, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {framework}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700">Tools:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.roleConfig.tools.map((tool, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700">Concepts:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.roleConfig.concepts.map((concept, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Starter Code */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Starter Code Template:</h4>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{result.starterCode}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-600">
                Click "Run Language Detection Test" to see how the AI detects programming languages from job descriptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageDetectionTest;
