import React, { useState } from 'react';
import aiService from '../services/aiService';
import { Bot, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const OpenRouterTest = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');

  React.useEffect(() => {
    // Check if API key is configured
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
    if (apiKey && apiKey !== 'your_openrouter_api_key_here') {
      setApiKeyStatus('configured');
    } else {
      setApiKeyStatus('missing');
    }
  }, []);

  const testOpenRouter = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await aiService.generateResponse(
        prompt,
        { userRole: 'recruiter' }
      );
      
      if (result.success) {
        setResponse(result.data);
      } else {
        setError(result.error || 'Failed to get AI response');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err.message);
      console.error('OpenRouter Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickTests = [
    {
      title: 'Generate Interview Questions',
      prompt: 'Generate 3 interview questions for a React Developer position'
    },
    {
      title: 'Job Description Help',
      prompt: 'Help me write a job description for a Senior Frontend Developer'
    },
    {
      title: 'Candidate Evaluation',
      prompt: 'How should I evaluate a candidate for a Full Stack Developer role?'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OpenRouter + DeepSeek Test
          </h1>
          <p className="text-lg text-gray-600">
            Test your OpenRouter API integration with DeepSeek
          </p>
        </div>

        {/* API Key Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Configuration Status</h2>
          
          {apiKeyStatus === 'checking' && (
            <div className="flex items-center space-x-3 text-gray-600">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Checking API key configuration...</span>
            </div>
          )}

          {apiKeyStatus === 'configured' && (
            <div className="flex items-center space-x-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">✅ OpenRouter API key is configured</span>
            </div>
          )}

          {apiKeyStatus === 'missing' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">❌ OpenRouter API key is missing</span>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Go to <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter.ai</a></li>
                  <li>Sign up and create an API key</li>
                  <li>Edit the <code className="bg-yellow-100 px-1 rounded">.env</code> file in the frontend directory</li>
                  <li>Replace <code className="bg-yellow-100 px-1 rounded">your_openrouter_api_key_here</code> with your actual API key</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Test Interface */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Test AI Integration</h2>
          
          {/* Quick Tests */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickTests.map((test, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(test.prompt)}
                  className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="font-medium text-gray-900 text-sm">{test.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a test prompt for the AI..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                rows={4}
                disabled={loading || apiKeyStatus !== 'configured'}
              />
            </div>
            
            <button
              onClick={testOpenRouter}
              disabled={loading || !prompt.trim() || apiKeyStatus !== 'configured'}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg transition-all font-medium"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Test DeepSeek API</span>
                </>
              )}
            </button>
          </div>

          {/* Response Area */}
          {(response || error) && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">AI Response</h3>
              
              <div className={`p-4 rounded-lg ${
                error ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                {error ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
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

        {/* Model Information */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Current Model</h3>
              <p className="text-gray-600">DeepSeek Chat v3.1 (Free)</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">API Endpoint</h3>
              <p className="text-gray-600">https://openrouter.ai/api/v1/chat/completions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenRouterTest;
