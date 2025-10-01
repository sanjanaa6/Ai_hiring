import React, { useState } from 'react';
import { Brain, Lock, Code2, Play } from 'lucide-react';
import aiLanguageDetectionService from '../services/aiLanguageDetectionService';

const LanguageDetectionDemo = () => {
  const [prompt, setPrompt] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);

  const samplePrompts = [
    {
      title: 'Python Developer',
      prompt: 'We are looking for a Python Developer with experience in Django, Flask, and data science libraries like pandas and numpy. The role involves building backend APIs and working with machine learning models.',
      expected: 'python'
    },
    {
      title: 'React Frontend Developer',
      prompt: 'Join our team as a React Developer! You will work with JSX, TypeScript, and modern frontend frameworks. Experience with Redux, hooks, and component-based architecture is required.',
      expected: 'jsx'
    },
    {
      title: 'Java Backend Engineer',
      prompt: 'We need a Java Developer with Spring Boot experience. The role involves building microservices, working with Maven/Gradle, and enterprise application development.',
      expected: 'java'
    },
    {
      title: 'Full Stack JavaScript',
      prompt: 'Looking for a JavaScript Developer who can work with Node.js, Express, and modern web technologies. Full-stack development experience preferred.',
      expected: 'javascript'
    }
  ];

  const detectLanguage = async () => {
    if (!prompt.trim()) return;
    
    setIsDetecting(true);
    try {
      const result = await aiLanguageDetectionService.detectLanguageFromJobDescription(
        prompt,
        'Developer Role'
      );
      
      setDetectionResult(result);
      setDetectedLanguage(result.language);
      console.log('🤖 Language Detection Result:', result);
    } catch (error) {
      console.error('❌ Detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const loadSamplePrompt = (sample) => {
    setPrompt(sample.prompt);
    setDetectedLanguage(null);
    setDetectionResult(null);
  };

  const getLanguageInfo = (language) => {
    const languageMap = {
      python: { label: 'Python', icon: '🐍', color: 'bg-green-500' },
      jsx: { label: 'React (JSX)', icon: '⚛️', color: 'bg-blue-500' },
      typescript: { label: 'TypeScript', icon: '🔷', color: 'bg-blue-600' },
      javascript: { label: 'JavaScript', icon: '🟨', color: 'bg-yellow-500' },
      java: { label: 'Java', icon: '☕', color: 'bg-orange-500' },
      csharp: { label: 'C#', icon: '💜', color: 'bg-purple-600' },
      cpp: { label: 'C++', icon: '⚡', color: 'bg-purple-500' }
    };
    return languageMap[language] || { label: 'Unknown', icon: '💻', color: 'bg-gray-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Brain className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">AI Language Detection Demo</h1>
          </div>
          <p className="text-gray-300 text-lg">
            See how AI detects the programming language from developer role descriptions
          </p>
        </div>

        {/* Sample Prompts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Sample Developer Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samplePrompts.map((sample, index) => (
              <button
                key={index}
                onClick={() => loadSamplePrompt(sample)}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-left hover:bg-slate-700/50 transition-all"
              >
                <h3 className="text-white font-medium mb-2">{sample.title}</h3>
                <p className="text-gray-300 text-sm line-clamp-3">{sample.prompt}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-blue-400">Expected:</span>
                  <span className={`text-xs px-2 py-1 rounded ${getLanguageInfo(sample.expected).color} text-white`}>
                    {getLanguageInfo(sample.expected).label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Try Your Own Prompt</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a developer role description or interview prompt..."
            className="w-full h-32 p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={detectLanguage}
            disabled={!prompt.trim() || isDetecting}
            className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            {isDetecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                <span>Detect Language</span>
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {detectionResult && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Detection Results</h2>
            
            {/* Primary Result */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-white">Detected Language</h3>
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-blue-400" />
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                    AI SUGGESTED
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${getLanguageInfo(detectedLanguage).color} rounded-lg flex items-center justify-center`}>
                  <span className="text-2xl">{getLanguageInfo(detectedLanguage).icon}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{getLanguageInfo(detectedLanguage).label}</h4>
                  <p className="text-gray-300">Confidence: {detectionResult.confidence}%</p>
                </div>
              </div>
              
              {detectionResult.reasoning && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Reasoning:</strong> {detectionResult.reasoning}
                  </p>
                </div>
              )}
            </div>

            {/* Alternatives */}
            {detectionResult.alternatives && detectionResult.alternatives.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Alternative Languages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detectionResult.alternatives.map((alt, index) => (
                    <div key={index} className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${getLanguageInfo(alt.language).color} rounded-lg flex items-center justify-center`}>
                          <span className="text-lg">{getLanguageInfo(alt.language).icon}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{getLanguageInfo(alt.language).label}</h4>
                          <p className="text-gray-400 text-sm">Confidence: {alt.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Editor Preview */}
        {detectedLanguage && (
          <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Code Editor Preview</h2>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getLanguageInfo(detectedLanguage).icon}</span>
                  <span className="text-white font-semibold">{getLanguageInfo(detectedLanguage).label}</span>
                  <div className="flex items-center space-x-1.5">
                    <Brain className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full border border-green-500/30">
                      AI MATCHED
                    </span>
                  </div>
                </div>
                <select
                  value={detectedLanguage}
                  onChange={(e) => setDetectedLanguage(e.target.value)}
                  className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="python">🐍 Python</option>
                  <option value="javascript">🟨 JavaScript</option>
                  <option value="jsx">⚛️ React (JSX)</option>
                  <option value="typescript">🔷 TypeScript</option>
                  <option value="java">☕ Java</option>
                  <option value="csharp">💜 C#</option>
                  <option value="cpp">⚡ C++</option>
                </select>
              </div>
              <div className="bg-slate-800 border border-slate-600 rounded p-3">
                <pre className="text-green-400 text-sm">
{aiLanguageDetectionService.getStarterCodeForLanguage(detectedLanguage)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageDetectionDemo;
