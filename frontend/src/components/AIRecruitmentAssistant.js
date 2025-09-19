import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Loader, 
  X, 
  Sparkles, 
  FileText, 
  Users, 
  TrendingUp, 
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import aiService from '../services/aiService';

const AIRecruitmentAssistant = ({ userRole = 'recruiter', context = {} }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const recruitmentTools = [
    {
      id: 'job-optimizer',
      title: 'Job Description Optimizer',
      description: 'Improve job descriptions for better candidate attraction',
      icon: <FileText className="h-5 w-5" />,
      color: 'blue'
    },
    {
      id: 'interview-questions',
      title: 'Interview Questions Generator',
      description: 'Generate comprehensive interview questions',
      icon: <Target className="h-5 w-5" />,
      color: 'green'
    },
    {
      id: 'candidate-analyzer',
      title: 'Candidate Analyzer',
      description: 'Analyze candidate profiles against job requirements',
      icon: <Users className="h-5 w-5" />,
      color: 'purple'
    },
    {
      id: 'market-insights',
      title: 'Market Insights',
      description: 'Get salary and market trend information',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'orange'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { role: 'user', content: prompt };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await aiService.generateResponse(prompt, { userRole, ...context });
      
      if (result.success) {
        const aiMessage = { role: 'assistant', content: result.data };
        setChatHistory([...newHistory, aiMessage]);
        setResponse(result.data);
      } else {
        setError(result.error || 'Failed to get AI response');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('AI Assistant Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = async (tool) => {
    setActiveTab('chat');
    let toolPrompt = '';
    
    switch (tool.id) {
      case 'job-optimizer':
        toolPrompt = 'Help me optimize a job description. Please provide a template and best practices for writing compelling job descriptions that attract top talent.';
        break;
      case 'interview-questions':
        toolPrompt = 'Generate a comprehensive set of interview questions for a position. Include technical, behavioral, and situational questions with evaluation criteria.';
        break;
      case 'candidate-analyzer':
        toolPrompt = 'Help me analyze candidate profiles. Provide a framework for evaluating candidates against job requirements, including scoring criteria and red flags to watch for.';
        break;
      case 'market-insights':
        toolPrompt = 'Provide market insights for recruitment. Include salary benchmarks, skill demand trends, and competitive landscape analysis.';
        break;
      default:
        toolPrompt = 'Help me with recruitment tasks.';
    }
    
    setPrompt(toolPrompt);
  };

  const clearChat = () => {
    setChatHistory([]);
    setResponse('');
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Recruitment Assistant</h3>
              <p className="text-sm text-gray-600">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tools'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lightbulb className="h-4 w-4 inline mr-2" />
          Tools
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bot className="h-4 w-4 inline mr-2" />
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'tools' ? (
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Recruitment Tools</h4>
            <div className="grid grid-cols-1 gap-4">
              {recruitmentTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className={`p-4 text-left border rounded-lg hover:shadow-md transition-all group ${
                    tool.color === 'blue' ? 'border-blue-200 hover:border-blue-300' :
                    tool.color === 'green' ? 'border-green-200 hover:border-green-300' :
                    tool.color === 'purple' ? 'border-purple-200 hover:border-purple-300' :
                    'border-orange-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      tool.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      tool.color === 'green' ? 'bg-green-100 text-green-600' :
                      tool.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 group-hover:text-gray-700">
                        {tool.title}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Chat History */}
            <div className="flex-1 p-6 overflow-y-auto max-h-96">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Start a conversation with your AI assistant</p>
                  <p className="text-sm text-gray-400">Ask about job descriptions, interviews, or candidate analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask your AI assistant about recruitment, job descriptions, interviews..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={loading}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4" />
                    <span>Powered by Gemini AI</span>
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
                    <span>{loading ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecruitmentAssistant;
