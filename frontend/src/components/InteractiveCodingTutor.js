import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const InteractiveCodingTutor = () => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState('// Write your code here\nfunction solution() {\n    // Your implementation\n}');
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  const chatEndRef = useRef(null);
  const editorRef = useRef(null);

  // Initialize with first coding question
  useEffect(() => {
    if (!isInitialized) {
      initializeCodingSession();
    }
  }, [isInitialized]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const initializeCodingSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/coding-tutor/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionType: 'coding-interview'
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize coding session');
      }

      setCurrentQuestion(result.data.question);
      setChatMessages([{
        id: Date.now(),
        role: 'ai',
        content: result.data.question,
        timestamp: new Date()
      }]);
      setIsInitialized(true);
      
    } catch (err) {
      console.error('❌ Failed to initialize coding session:', err);
      setError(err.message || 'Failed to initialize coding session');
    } finally {
      setIsLoading(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add user's code to chat
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: code,
        type: 'code',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/coding-tutor/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          code: code,
          chatHistory: chatMessages
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI feedback');
      }

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        role: 'ai',
        content: result.data.feedback,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);

      // Update current question if AI provided a new one
      if (result.data.newQuestion) {
        setCurrentQuestion(result.data.newQuestion);
      }

    } catch (err) {
      console.error('❌ Failed to submit code:', err);
      setError(err.message || 'Failed to submit code');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        role: 'ai',
        content: `❌ Error: ${err.message}`,
        type: 'error',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = async () => {
    setCode('// Write your code here\nfunction solution() {\n    // Your implementation\n}');
    setChatMessages([]);
    setCurrentQuestion('');
    setIsInitialized(false);
    setError(null);
    await initializeCodingSession();
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    const isError = message.type === 'error';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-3xl px-4 py-3 rounded-2xl ${
            isUser
              ? isDarkMode 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              : isError
              ? 'bg-red-100 border border-red-300 text-red-800'
              : isDarkMode 
                ? 'bg-slate-800 border border-slate-700 text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
          } shadow-lg`}
        >
          {message.type === 'code' ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium opacity-80">
                <Code className="h-4 w-4" />
                <span>Your Code:</span>
              </div>
              <pre className={`text-sm overflow-x-auto p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-900 text-green-400' : 'bg-gray-100 text-gray-800'
              }`}>
                <code>{message.content}</code>
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium opacity-80">
                {isUser ? (
                  <Code className="h-4 w-4" />
                ) : isError ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span>{isUser ? 'You' : isError ? 'Error' : 'AI Tutor'}</span>
                <span className="text-xs opacity-60">{formatTimestamp(message.timestamp)}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isInitialized && isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Initializing Coding Tutor...
          </h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Setting up your interactive coding session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className={`border-b px-6 py-4 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}>
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Interactive Coding Tutor
                </h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  AI-powered coding interview practice
                </p>
              </div>
            </div>
            
            <button
              onClick={resetSession}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              New Session
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Section */}
          <div className={`w-1/2 border-r ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div className={`h-full flex flex-col ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}>
              {/* Editor Header */}
              <div className={`px-4 py-3 border-b ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Code Editor
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isDarkMode ? 'bg-green-400' : 'bg-green-500'
                    }`}></div>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      JavaScript
                    </span>
                  </div>
                </div>
              </div>

              {/* Monaco Editor Placeholder */}
              <div className="flex-1 p-4">
                <div className={`h-full border-2 border-dashed rounded-lg ${
                  isDarkMode 
                    ? 'border-slate-600 bg-slate-900' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <textarea
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`w-full h-full p-4 resize-none border-0 rounded-lg font-mono text-sm ${
                      isDarkMode 
                        ? 'bg-slate-900 text-green-400 placeholder-slate-500' 
                        : 'bg-gray-50 text-gray-800 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="// Write your code here&#10;function solution() {&#10;    // Your implementation&#10;}"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className={`px-4 py-3 border-t ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={submitCode}
                  disabled={!code.trim() || isLoading}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    !code.trim() || isLoading
                      ? isDarkMode
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className={`w-1/2 flex flex-col ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            {/* Chat Header */}
            <div className={`px-4 py-3 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-2">
                <MessageSquare className={`h-5 w-5 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-500'
                }`} />
                <h3 className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  AI Tutor Chat
                </h3>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className={`h-12 w-12 mx-auto mb-4 ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Start coding to begin your conversation with the AI tutor!
                  </p>
                </div>
              ) : (
                chatMessages.map(renderMessage)
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className={`mx-4 mb-4 p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-700 text-red-300' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCodingTutor;
