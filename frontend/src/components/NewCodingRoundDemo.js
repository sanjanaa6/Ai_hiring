import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import NewCodingRoundTest from './NewCodingRoundTest';

const NewCodingRoundDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">New Coding Round</h1>
                <p className="text-sm text-gray-600">Enhanced AI-powered coding interview experience</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✨ Completely Redesigned
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🚀 Enhanced Features
            </span>
          </div>
        </div>
      </div>

      {/* Feature Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🎉 Introducing the New Coding Round</h2>
            <p className="text-xl text-blue-100 mb-6">A complete redesign with modern features and enhanced user experience</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl mb-2">🎨</div>
                <h3 className="font-semibold mb-2">Modern UI/UX</h3>
                <p className="text-sm text-blue-100">Beautiful split-screen layout with tabbed interface</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl mb-2">🧪</div>
                <h3 className="font-semibold mb-2">Real-time Testing</h3>
                <p className="text-sm text-blue-100">Live test execution with detailed results and analytics</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold mb-2">AI Assistant</h3>
                <p className="text-sm text-blue-100">Smart hints and contextual guidance without spoiling solutions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Demo */}
      <NewCodingRoundTest />
    </div>
  );
};

export default NewCodingRoundDemo;

