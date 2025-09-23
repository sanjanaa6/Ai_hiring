import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Bot, 
  MessageSquare, 
  Code2, 
  Maximize2, 
  Minimize2,
  Send,
  Loader2,
  Mic,
  MicOff
} from 'lucide-react';
import aiService from '../services/aiService';

const EnhancedCodeEditor = ({ 
  language = 'javascript', 
  starterCode = '', 
  testCases = [],
  question = '',
  onCodeChange,
  disabled = false,
  isFullScreen = false,
  onToggleFullScreen,
  sessionId = null,
  onAIQuestionGenerated = null,
  languageLocked = false
}) => {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [liveComments, setLiveComments] = useState([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);
  
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);
  const codeUpdateTimeoutRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChat, liveComments]);

  // Live AI monitoring of code changes
  useEffect(() => {
    if (codeUpdateTimeoutRef.current) {
      clearTimeout(codeUpdateTimeoutRef.current);
    }
    
    if (isLiveMonitoring && code.trim() && code !== starterCode) {
      codeUpdateTimeoutRef.current = setTimeout(() => {
        generateLiveComment();
      }, 2000); // Generate comment 2 seconds after user stops typing
    }

    return () => {
      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }
    };
  }, [code, isLiveMonitoring]);

  // Supported programming languages
  const supportedLanguages = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'cpp', label: 'C++', extension: 'cpp' },
    { value: 'c', label: 'C', extension: 'c' },
    { value: 'csharp', label: 'C#', extension: 'cs' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' },
    { value: 'jsx', label: 'React (JSX)', extension: 'jsx' },
    { value: 'tsx', label: 'React (TSX)', extension: 'tsx' }
  ];

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });
    
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true
    });
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
    if (onCodeChange) {
      onCodeChange(value || '');
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('No code to run');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setTestResults([]);

    try {
      // For JavaScript/TypeScript/React, we can execute directly
      if (['javascript', 'typescript', 'jsx', 'tsx'].includes(selectedLanguage)) {
        const wrappedCode = `
          (function() {
            try {
              ${code}
              
              // Run test cases if available
              const testResults = [];
              ${testCases.map((testCase, index) => `
                try {
                  const result = eval('(' + \`${testCase.input}\`)');
                  const expected = ${testCase.expected};
                  testResults.push({
                    testCase: ${index + 1},
                    input: \`${testCase.input}\`,
                    expected: expected,
                    actual: result,
                    passed: result === expected,
                    error: null
                  });
                } catch (error) {
                  testResults.push({
                    testCase: ${index + 1},
                    input: \`${testCase.input}\`,
                    expected: ${testCase.expected},
                    actual: null,
                    passed: false,
                    error: error.message
                  });
                }
              `).join('\n')}
              
              return { success: true, testResults: testResults };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })()
        `;

        const result = eval(wrappedCode);
        
        if (result.success) {
          setTestResults(result.testResults || []);
          setOutput('Code executed successfully!');
        } else {
          setOutput(`Error: ${result.error}`);
        }
      } else {
        setOutput(`Code execution is currently only supported for JavaScript/TypeScript/React. Your ${supportedLanguages.find(lang => lang.value === selectedLanguage)?.label} code has been saved.`);
      }
    } catch (error) {
      setOutput(`Execution Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(starterCode);
    setOutput('');
    setTestResults([]);
    if (onCodeChange) {
      onCodeChange(starterCode);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'python':
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'csharp':
      case 'c#':
        return 'csharp';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      default:
        return 'javascript';
    }
  };

  // AI Interaction Functions
  const addAiMessage = (message, type = 'assistant') => {
    const aiMessage = {
      id: Date.now(),
      role: type,
      content: message,
      timestamp: new Date()
    };
    setAiChat(prev => [...prev, aiMessage]);
  };

  const addLiveComment = (comment) => {
    const liveComment = {
      id: Date.now(),
      content: comment,
      timestamp: new Date(),
      type: 'live'
    };
    setLiveComments(prev => [...prev, liveComment]);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setAiChat(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const data = {
        question: question,
        currentCode: code,
        language: selectedLanguage,
        testCases: testCases,
        testResults: testResults,
        userMessage: chatInput,
        sessionId: sessionId,
        isInterviewer: true
      };

      const result = await aiService.getCodingAssistant(sessionId, data);
      
      if (result.success) {
        addAiMessage(result.data.response);
      } else {
        addAiMessage("I'm sorry, I'm having trouble processing your request right now. Please try again.");
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      addAiMessage("I'm experiencing some technical difficulties. Please try again in a moment.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateLiveComment = async () => {
    if (isAiLoading) return;

    setIsAiLoading(true);

    try {
      const data = {
        question: question,
        currentCode: code,
        language: selectedLanguage,
        testCases: testCases,
        isLiveComment: true,
        isInterviewer: true
      };

      const result = await aiService.getCodingHints(sessionId, data);
      
      if (result.success && result.data.hints && result.data.hints.length > 0) {
        const comment = result.data.hints[0].content;
        addLiveComment(comment);
        
        // Notify parent component about the AI question
        if (onAIQuestionGenerated) {
          onAIQuestionGenerated(comment);
        }
      }
    } catch (error) {
      console.error('Live Comment Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`w-full h-full flex ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Left Half - Code Editor */}
      <div className="w-1/2 flex flex-col border-r border-gray-300">
        {/* Code Editor Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Language Display */}
            <div className={`flex items-center space-x-2 px-3 py-1 text-sm rounded ${
              languageLocked 
                ? 'bg-red-100 border border-red-300' 
                : 'bg-blue-100 border border-blue-300'
            }`}>
              <span className={`font-medium ${
                languageLocked ? 'text-red-800' : 'text-blue-800'
              }`}>
                {supportedLanguages.find(lang => lang.value === selectedLanguage)?.label || 'JavaScript'}
              </span>
              {languageLocked && (
                <span className="text-xs text-red-600 bg-red-200 px-2 py-1 rounded">
                  LOCKED
                </span>
              )}
            </div>
            
            {disabled && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Read Only
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Live Monitoring Toggle */}
            <button
              onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
              className={`flex items-center space-x-1 px-3 py-1 text-sm rounded transition-colors ${
                isLiveMonitoring 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isLiveMonitoring ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{isLiveMonitoring ? 'Live AI' : 'AI Off'}</span>
            </button>

            {/* Fullscreen Toggle */}
            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}

            {/* Action Buttons */}
            <button
              onClick={resetCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={runCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Run Code</span>
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={getLanguageForMonaco(selectedLanguage)}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              readOnly: disabled,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 16,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
              },
              automaticLayout: true,
              theme: 'vs-light',
              wordWrap: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              padding: { top: 20, bottom: 20 }
            }}
          />
        </div>

        {/* Output Section */}
        {(output || testResults.length > 0) && (
          <div className="border-t border-gray-300 bg-gray-50 p-4 max-h-32 overflow-y-auto">
            <div className="space-y-2">
              {/* Console Output */}
              {output && (
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-sm">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400">Output:</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs">{output}</pre>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-700 text-sm">Test Results:</h4>
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border text-xs ${
                        result.passed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {result.passed ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-medium">
                          Test {result.testCase} {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Half - AI Interviewer */}
      <div className="w-1/2 flex flex-col bg-white">
        {/* AI Interviewer Header */}
        <div className="p-4 border-b border-gray-300 bg-blue-50">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Interviewer</h3>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
              Live Monitoring
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            I'm watching your code and will ask questions about your approach
          </p>
        </div>

        {/* Live Comments Section */}
        {liveComments.length > 0 && (
          <div className="border-b border-gray-300 bg-yellow-50 p-4 max-h-32 overflow-y-auto">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800 text-sm">Live Comments</h4>
            </div>
            <div className="space-y-2">
              {liveComments.slice(-3).map((comment) => (
                <div key={comment.id} className="bg-white p-2 rounded border border-yellow-200">
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comment.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {aiChat.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>AI Interviewer is observing your code</p>
              <p className="text-sm mt-1">Ask questions about your approach or explain your thinking.</p>
            </div>
          )}
          
          {aiChat.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isAiLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-300">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Ask about your approach or explain your thinking..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAiLoading}
            />
            <button
              onClick={sendChatMessage}
              disabled={!chatInput.trim() || isAiLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCodeEditor;

