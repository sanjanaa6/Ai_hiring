import React from 'react';
import { Play, Clock, AlertCircle } from 'lucide-react';

const QuestionDisplay = ({ question, duration, onStartDesign, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-4xl w-full rounded-2xl shadow-2xl p-8 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
            isDark ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-green-100 text-green-800 border border-green-300'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-semibold">System Design Challenge</span>
          </div>
          
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Design Problem
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{duration} minutes</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className={`mb-8 p-6 rounded-xl ${
          isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {question?.question || 'Design a scalable system architecture'}
          </h2>
          
          {question?.expectedAnswer && (
            <div className={`mt-4 p-4 rounded-lg ${
              isDark ? 'bg-blue-500/10 border border-blue-400/30' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <h3 className={`font-semibold mb-1 ${
                    isDark ? 'text-blue-300' : 'text-blue-900'
                  }`}>
                    Requirements:
                  </h3>
                  <p className={`text-sm ${
                    isDark ? 'text-blue-200' : 'text-blue-800'
                  }`}>
                    {question.expectedAnswer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className={`mb-8 p-6 rounded-xl ${
          isDark ? 'bg-purple-500/10 border border-purple-400/30' : 'bg-purple-50 border border-purple-200'
        }`}>
          <h3 className={`font-semibold mb-3 ${
            isDark ? 'text-purple-300' : 'text-purple-900'
          }`}>
            Instructions:
          </h3>
          <ul className={`space-y-2 text-sm ${
            isDark ? 'text-purple-200' : 'text-purple-800'
          }`}>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Use the diagramming tool to design your system architecture</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Include all major components (databases, servers, caches, load balancers, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Show data flow and connections between components</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Add labels and notes to explain your design decisions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>Your work will be auto-saved every 30 seconds</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={onStartDesign}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50' 
                : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg shadow-green-600/50'
            }`}
          >
            <Play className="w-6 h-6" />
            <span>Open Design Canvas</span>
          </button>
          
          <p className={`mt-4 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Timer will start when you open the canvas
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
