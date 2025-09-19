import React, { useState } from 'react';
import { Send, Bot, Loader, X, Sparkles, Lightbulb, Target, TrendingUp } from 'lucide-react';
import aiService from '../services/aiService';

const AIPromptBox = ({ userRole = 'recruiter', context = {} }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const quickPrompts = [
    {
      icon: <Lightbulb className="h-4 w-4" />,
      text: "Optimize job description",
      prompt: "Help me optimize this job description to attract better candidates"
    },
    {
      icon: <Target className="h-4 w-4" />,
      text: "Generate interview questions",
      prompt: "Create interview questions for this position"
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      text: "Market insights",
      prompt: "Provide market insights for this role and location"
    },
    {
      icon: <Bot className="h-4 w-4" />,
      text: "Analyze candidate",
      prompt: "Analyze this candidate's profile against job requirements"
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await aiService.generateResponse(prompt, { userRole, ...context });
      
      if (result.success) {
        setResponse(result.data);
      } else {
        setError(result.error || 'Failed to get AI response');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('AI Prompt Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (quickPrompt) => {
    setPrompt(quickPrompt);
    setIsExpanded(true);
  };

  const clearResponse = () => {
    setResponse('');
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600">Get help with recruitment tasks</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      {!isExpanded && (
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            {quickPrompts.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(item.prompt)}
                className="flex items-center space-x-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="text-gray-500 group-hover:text-purple-600 transition-colors">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Form */}
      {isExpanded && (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Ask AI Assistant
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything about recruitment, job descriptions, candidate analysis, market insights..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {quickPrompts.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPrompt(item.prompt)}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
              
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{loading ? 'Thinking...' : 'Ask AI'}</span>
              </button>
            </div>
          </form>

          {/* Response Area */}
          {(response || error) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">AI Response</h4>
                <button
                  onClick={clearResponse}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className={`p-4 rounded-lg ${
                error ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                {error ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <X className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {response}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIPromptBox;
