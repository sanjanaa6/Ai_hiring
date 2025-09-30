import React, { useState, useEffect } from 'react';
import { Code2, Brain, Lock, Zap, Star, Trophy } from 'lucide-react';

const CodeEditorWelcome = ({ 
  language, 
  onStart, 
  isVisible
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 1000);
      
      const timer2 = setTimeout(() => {
        setCurrentStep(2);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const languageInfo = {
    python: { icon: '🐍', name: 'Python', description: 'Perfect for data science and backend development' },
    javascript: { icon: '🟨', name: 'JavaScript', description: 'The language of the web' },
    jsx: { icon: '⚛️', name: 'React (JSX)', description: 'Modern component-based UI development' },
    typescript: { icon: '🔷', name: 'TypeScript', description: 'Type-safe JavaScript for large applications' },
    java: { icon: '☕', name: 'Java', description: 'Enterprise-grade backend development' },
    cpp: { icon: '⚡', name: 'C++', description: 'High-performance system programming' },
    csharp: { icon: '💜', name: 'C#', description: 'Microsoft ecosystem development' },
    go: { icon: '🐹', name: 'Go', description: 'Modern backend and microservices' },
    php: { icon: '🐘', name: 'PHP', description: 'Web development and content management' },
    ruby: { icon: '💎', name: 'Ruby', description: 'Elegant web development' },
    swift: { icon: '🦉', name: 'Swift', description: 'iOS and Apple ecosystem development' },
    kotlin: { icon: '🟣', name: 'Kotlin', description: 'Android and modern mobile development' },
    rust: { icon: '🦀', name: 'Rust', description: 'Memory-safe system programming' },
    scala: { icon: '🔺', name: 'Scala', description: 'Functional programming and big data' }
  };

  const currentLang = languageInfo[language] || languageInfo.javascript;

  const features = [
    { icon: Brain, title: 'AI-Powered', description: 'Smart language detection and live assistance' },
    { icon: Lock, title: 'Language Locked', description: 'Consistent coding environment' },
    { icon: Zap, title: 'Real-time Execution', description: 'Test your code instantly' },
    { icon: Star, title: 'Achievement System', description: 'Unlock badges as you code' },
    { icon: Trophy, title: 'Live AI Interviewer', description: 'Interactive coding guidance' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full mx-4">
        <div className={`transform transition-all duration-500 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {/* Main Welcome Card */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Code2 className="h-8 w-8 text-gray-700" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Code Editor Ready
              </h1>
              <p className="text-gray-600">
                Your coding environment is prepared
              </p>
            </div>

            {/* Language Selection Display */}
            <div className="mb-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{currentLang.icon}</div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{currentLang.name}</h2>
                      <p className="text-gray-600">{currentLang.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">AI Selected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all duration-300 ${
                    currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <feature.icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>


            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={onStart}
                className={`bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-medium transition-colors ${
                  currentStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="h-4 w-4" />
                  <span>Start Coding</span>
                </div>
              </button>
              <p className="text-gray-500 text-sm mt-3">
                Language is locked for interview consistency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorWelcome;
