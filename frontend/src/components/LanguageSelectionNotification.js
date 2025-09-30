import React, { useState, useEffect } from 'react';
import { Brain, Lock, X } from 'lucide-react';

const LanguageSelectionNotification = ({ 
  languageDetectionResult, 
  isVisible, 
  onClose,
  onAccept 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  if (!isVisible || !languageDetectionResult) {
    return null;
  }

  const languageInfo = {
    python: { icon: '🐍' },
    javascript: { icon: '🟨' },
    jsx: { icon: '⚛️' },
    typescript: { icon: '🔷' },
    java: { icon: '☕' },
    cpp: { icon: '⚡' },
    csharp: { icon: '💜' },
    go: { icon: '🐹' },
    php: { icon: '🐘' },
    ruby: { icon: '💎' },
    swift: { icon: '🦉' },
    kotlin: { icon: '🟣' },
    rust: { icon: '🦀' },
    scala: { icon: '🔺' }
  };

  const currentLang = languageInfo[languageDetectionResult.language] || languageInfo.javascript;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`transform transition-all duration-300 ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Brain className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold text-lg">Language Selected</h3>
                  <p className="text-sm text-gray-300">AI determined best language</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Language Selection */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl">{currentLang.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-lg text-gray-900">
                    {languageDetectionResult.language.toUpperCase()}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <Lock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                      LOCKED
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  AI determined this is the best language for your interview
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            {languageDetectionResult.reasoning && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-2">AI Reasoning:</h5>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                  {languageDetectionResult.reasoning}
                </p>
              </div>
            )}

            {/* Confidence Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">AI Confidence</span>
                <span className="text-sm font-semibold text-gray-900">
                  {languageDetectionResult.confidence}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${languageDetectionResult.confidence}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onAccept}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Accept & Continue
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              Language is locked for interview consistency
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionNotification;