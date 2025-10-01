import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Zap,
  Code2,
  Settings,
  Lock,
  Target,
  Brain,
  Mic,
  MicOff
} from 'lucide-react';
import aiService from '../services/aiService';
import { useResizeObserver, cleanupResizeObservers } from '../utils/resizeObserver';

const SuperCoolCodeEditor = ({ 
  language = 'javascript', 
  starterCode = '', 
  question = '',
  onCodeChange,
  disabled = false,
  isFullScreen = false,
  onToggleFullScreen,
  sessionId = null,
  onAIQuestionGenerated = null,
  languageLocked = false,
  aiDeterminedLanguage = null,
  onConversationStateChange = null
}) => {
  const [code, setCode] = useState(starterCode || '// Start typing your code here...\n\n');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [liveComments, setLiveComments] = useState([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [showSettings, setShowSettings] = useState(false);
  const [editorLoading, setEditorLoading] = useState(true);
  const [linesOfCode, setLinesOfCode] = useState(0);
  const [codeQuality, setCodeQuality] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showLiveComments, setShowLiveComments] = useState(true); // Show AI assistant by default
  const [showTestCases, setShowTestCases] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [conversationStep, setConversationStep] = useState(0); // 0: not started, 1: first question, 2: second question, 3: completed
  const [isCodeDone, setIsCodeDone] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isGeneratingTestCases, setIsGeneratingTestCases] = useState(false);
  
  // Update selected language when language prop changes
  React.useEffect(() => {
    if (aiDeterminedLanguage) {
      setSelectedLanguage(aiDeterminedLanguage);
    } else {
      setSelectedLanguage(language);
    }
  }, [language, aiDeterminedLanguage]);

  // Handle language changes (allow user to override AI detection)
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    console.log('🔄 Language changed from', selectedLanguage, 'to', newLanguage);
  };
  
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);
  const codeUpdateTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Premium themes for the editor
  const themes = [
    { name: 'Dark Pro', value: 'vs-dark', icon: '🌙' },
    { name: 'Light Pro', value: 'vs-light', icon: '☀️' },
    { name: 'Monokai', value: 'monokai', icon: '🎨' },
    { name: 'GitHub Dark', value: 'github-dark', icon: '🐙' },
    { name: 'GitHub Light', value: 'github-light', icon: '📝' },
    { name: 'Solarized Dark', value: 'solarized-dark', icon: '🌅' },
    { name: 'Solarized Light', value: 'solarized-light', icon: '🌞' }
  ];


  const addLiveComment = useCallback((comment, type = 'ai') => {
    const liveComment = {
      id: Date.now(),
      content: comment,
      timestamp: new Date(),
      type: type // 'ai' or 'user'
    };
    setLiveComments(prev => [...prev, liveComment]);
  }, [setLiveComments]);

  const startConversation = useCallback(async () => {
    if (isAiLoading || conversationStep > 0) return;

    setIsAiLoading(true);
    setIsCodeDone(true);
    setConversationStep(1);

    try {
      const data = {
        question: question,
        currentCode: code,
        language: selectedLanguage,
        isLiveComment: true,
        isInterviewer: true,
        conversationStep: 1,
        isCodeComplete: true
      };

      const result = await aiService.getCodingHints(sessionId, data);
      
      if (result.success && result.data.aiResponse) {
        const aiResponse = result.data.aiResponse;
        let comment = '';
        
        if (aiResponse.aiQuestion) {
          comment = aiResponse.aiQuestion;
          
          if (aiResponse.suggestion) {
            comment += `\n\n💡 ${aiResponse.suggestion}`;
          }
        }
        
        if (comment) {
          addLiveComment(comment, 'ai');
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      addLiveComment("Let's discuss your code! What was your approach to solving this problem?", 'ai');
    } finally {
      setIsAiLoading(false);
    }
  }, [isAiLoading, conversationStep, addLiveComment, question, code, selectedLanguage, sessionId]);

  const handleUserResponse = useCallback(async () => {
    if (!userResponse.trim() || isResponding || conversationStep === 0) return;

    setIsResponding(true);
    
    // Add user response to chat
    addLiveComment(userResponse, 'user');
    
    try {
      const nextStep = conversationStep + 1;
      setConversationStep(nextStep);
      
      if (nextStep === 3) {
        // Final response - thank you and end conversation
        addLiveComment("Thank you for the detailed explanation! Your approach shows good problem-solving skills. Let's move on to the next question.", 'ai');
        // Here you could trigger moving to next question
        setTimeout(() => {
          if (onAIQuestionGenerated) {
            onAIQuestionGenerated("conversation_complete");
          }
        }, 2000);
      } else {
        // Send user response to AI for follow-up
        const data = {
          question: question,
          currentCode: code,
          language: selectedLanguage,
          userResponse: userResponse,
          isFollowUp: true,
          isInterviewer: true,
          conversationStep: nextStep,
          conversationHistory: liveComments.slice(-5).map(comment => comment.content).join('\n')
        };

        const result = await aiService.getCodingHints(sessionId, data);
        
        if (result.success && result.data.aiResponse) {
          const aiResponse = result.data.aiResponse;
          let followUpComment = '';
          
          if (aiResponse.aiQuestion) {
            followUpComment = aiResponse.aiQuestion;
            
            if (aiResponse.suggestion) {
              followUpComment += `\n\n💡 ${aiResponse.suggestion}`;
            }
          }
          
          if (followUpComment) {
            addLiveComment(followUpComment, 'ai');
          }
        }
      }
    } catch (error) {
      console.error('Error getting AI follow-up:', error);
      addLiveComment("I understand your response. Please continue with your explanation.", 'ai');
    } finally {
      setIsResponding(false);
      setUserResponse('');
    }
  }, [userResponse, isResponding, conversationStep, addLiveComment, question, code, selectedLanguage, sessionId, liveComments, onAIQuestionGenerated]);

  // Removed generateLiveComment - now using structured conversation flow

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveComments]);

  // Notify parent component of conversation state changes
  useEffect(() => {
    if (onConversationStateChange) {
      onConversationStateChange({
        conversationStep,
        isCodeDone,
        isConversationComplete: conversationStep === 3
      });
    }
  }, [conversationStep, isCodeDone, onConversationStateChange]);

  // Generate test cases when question changes
  useEffect(() => {
    if (question && selectedLanguage) {
      generateTestCases();
    }
  }, [question, selectedLanguage]);

  // Reset everything when question changes (for next question)
  useEffect(() => {
    if (question) {
      // Reset conversation state
      setConversationStep(0);
      setIsCodeDone(false);
      setUserResponse('');
      setIsResponding(false);
      
      // Clear chat
      setLiveComments([]);
      
      // Clear test results (but keep test cases for new question)
      setTestResults([]);
      setIsRunningTests(false);
      
      // Reset code to starter code
      setCode(starterCode || '// Start typing your code here...\n\n');
      setOutput('');
      
      // Notify parent of reset
      if (onCodeChange) {
        onCodeChange(starterCode || '// Start typing your code here...\n\n');
      }
    }
  }, [question, starterCode, onCodeChange]);

  const generateTestCases = useCallback(async () => {
    if (!question || !selectedLanguage) {
      console.log('⚠️ [FRONTEND] Cannot generate test cases - missing question or language');
      return;
    }
    
    console.log('🧪 [FRONTEND] Generating test cases for question:', question);
    console.log('🧪 [FRONTEND] Language:', selectedLanguage);
    
    setIsGeneratingTestCases(true);
    try {
      const data = {
        question: question,
        language: selectedLanguage,
        generateTestCases: true
      };

      console.log('🧪 [FRONTEND] Sending request to backend:', data);
      const result = await aiService.getCodingHints(sessionId, data);
      console.log('🧪 [FRONTEND] Backend response:', result);
      
      if (result.success && result.data.testCases) {
        setTestCases(result.data.testCases);
        setTestResults([]); // Clear previous results
        console.log(`✅ [FRONTEND] Generated ${result.data.testCases.length} test cases for new question:`, result.data.testCases);
      } else {
        // Fallback to basic test cases
        const fallbackCases = generateBasicTestCases();
        setTestCases(fallbackCases);
        console.log(`⚠️ [FRONTEND] Using fallback test cases:`, fallbackCases);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error generating test cases:', error);
      const fallbackCases = generateBasicTestCases();
      setTestCases(fallbackCases);
      console.log(`🔄 [FRONTEND] Using fallback after error:`, fallbackCases);
    } finally {
      setIsGeneratingTestCases(false);
    }
  }, [question, selectedLanguage, sessionId]);

  const generateBasicTestCases = () => {
    console.log('🔄 [FRONTEND] Generating frontend fallback test cases for:', question);
    
    const lowerQuestion = question.toLowerCase();
    
    // Web scraping questions
    if (lowerQuestion.includes('scrape') || lowerQuestion.includes('web scraping') || lowerQuestion.includes('website')) {
      return [
        {
          id: 1,
          name: "Basic Scraping Test",
          input: "https://example.com",
          expectedOutput: "Successfully scraped data",
          description: "Test basic web scraping functionality"
        },
        {
          id: 2,
          name: "Invalid URL Test",
          input: "invalid-url",
          expectedOutput: "Error: Invalid URL",
          description: "Test error handling for invalid URLs"
        },
        {
          id: 3,
          name: "Empty Page Test",
          input: "https://empty-page.com",
          expectedOutput: "No data found",
          description: "Test handling of empty pages"
        }
      ];
    }
    
    // Array/List manipulation questions
    if (lowerQuestion.includes('array') || lowerQuestion.includes('list') || lowerQuestion.includes('sort')) {
      return [
        {
          id: 1,
          name: "Basic Array Test",
          input: "[3, 1, 4, 1, 5]",
          expectedOutput: "[1, 1, 3, 4, 5]",
          description: "Test basic array processing"
        },
        {
          id: 2,
          name: "Empty Array Test",
          input: "[]",
          expectedOutput: "[]",
          description: "Test empty array handling"
        },
        {
          id: 3,
          name: "Single Element Test",
          input: "[42]",
          expectedOutput: "[42]",
          description: "Test single element array"
        }
      ];
    }
    
    // String manipulation questions
    if (lowerQuestion.includes('string') || lowerQuestion.includes('text') || lowerQuestion.includes('word')) {
      return [
        {
          id: 1,
          name: "Basic String Test",
          input: "Hello World",
          expectedOutput: "dlroW olleH",
          description: "Test basic string manipulation"
        },
        {
          id: 2,
          name: "Empty String Test",
          input: "",
          expectedOutput: "",
          description: "Test empty string handling"
        },
        {
          id: 3,
          name: "Special Characters Test",
          input: "Hello, World! 123",
          expectedOutput: "321 !dlroW ,olleH",
          description: "Test string with special characters"
        }
      ];
    }
    
    // Default generic test cases
    return [
      {
        id: 1,
        name: "Basic Functionality Test",
        input: "test input",
        expectedOutput: "expected output",
        description: "Test basic functionality"
      },
      {
        id: 2,
        name: "Edge Case Test",
        input: "edge case input",
        expectedOutput: "edge case output",
        description: "Test edge case handling"
      },
      {
        id: 3,
        name: "Error Handling Test",
        input: "invalid input",
        expectedOutput: "error message",
        description: "Test error handling"
      }
    ];
  };

  // Removed automatic AI monitoring - now using manual "Done" button approach

  // Typing speed calculation
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setIsTyping(true);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [code]);

  // Calculate code metrics
  useEffect(() => {
    const lines = code.split('\n').length;
    setLinesOfCode(lines);
    
    // Calculate code quality (simple heuristic)
    let quality = 0;
    if (code.includes('function') || code.includes('def') || code.includes('public')) quality += 20;
    if (code.includes('//') || code.includes('#')) quality += 10; // Comments
    if (code.includes('if') || code.includes('for') || code.includes('while')) quality += 15;
    if (code.trim().length > 50) quality += 10;
    
    setCodeQuality(Math.min(quality, 100));
  }, [code]);

  // Cleanup ResizeObserver and editor handlers on unmount
  useEffect(() => {
    return () => {
      cleanupResizeObservers();
      
      // Clean up editor resize handlers
      if (editorRef.current && editorRef.current._resizeCleanup) {
        editorRef.current._resizeCleanup();
      }
    };
  }, []);

  // Supported programming languages with enhanced info
  const supportedLanguages = [
    { value: 'jsx', label: 'React (JSX)', extension: 'jsx', icon: '⚛️', color: 'bg-blue-500' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts', icon: '🔷', color: 'bg-blue-600' },
    { value: 'tsx', label: 'React (TSX)', extension: 'tsx', icon: '⚛️', color: 'bg-blue-500' },
    { value: 'javascript', label: 'JavaScript', extension: 'js', icon: '🟨', color: 'bg-yellow-500' },
    { value: 'python', label: 'Python', extension: 'py', icon: '🐍', color: 'bg-green-500' },
    { value: 'java', label: 'Java', extension: 'java', icon: '☕', color: 'bg-orange-500' },
    { value: 'cpp', label: 'C++', extension: 'cpp', icon: '⚡', color: 'bg-purple-500' },
    { value: 'c', label: 'C', extension: 'c', icon: '🔧', color: 'bg-gray-500' },
    { value: 'csharp', label: 'C#', extension: 'cs', icon: '💜', color: 'bg-purple-600' }
  ];

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor with premium settings
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });
    
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true
    });

    // Add custom themes
    monaco.editor.defineTheme('github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d' },
        { token: 'keyword', foreground: 'd73a49' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9'
      }
    });

    monaco.editor.defineTheme('github-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d' },
        { token: 'keyword', foreground: 'd73a49' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '005cc5' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292e'
      }
    });

    // Manual layout handling to prevent ResizeObserver issues
    const handleResize = () => {
      try {
        editor.layout();
      } catch (error) {
        // Suppress ResizeObserver errors
        if (error.message && error.message.includes('ResizeObserver')) {
          return;
        }
        throw error;
      }
    };

    // Use a debounced resize handler
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    // Add resize listener
    window.addEventListener('resize', debouncedResize);
    
    // Store cleanup function
    editor._resizeCleanup = () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };

    // Set editor as loaded
    setEditorLoading(false);
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
    
    // Show typing indicator when user types
    if (value && value.trim()) {
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to hide typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
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

    try {
      if (['javascript', 'typescript', 'jsx', 'tsx'].includes(selectedLanguage)) {
        // Simple code execution without test cases
        const wrappedCode = `
          (function() {
            try {
              // Capture console.log for output
              const originalConsoleLog = console.log;
              const outputs = [];
              console.log = function(...args) {
                outputs.push(args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '));
                originalConsoleLog.apply(console, args);
              };

              // Execute user code
              ${code}
              
              return {
                success: true,
                output: outputs.join('\\n') || '🎉 Code executed successfully!'
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          })()
        `;
        
        // eslint-disable-next-line no-eval
        const result = eval(wrappedCode);
        
        if (result.success) {
          setOutput(result.output);
        } else {
          setOutput(`❌ Error: ${result.error}`);
        }
      } else {
        setOutput(`💾 Code saved! Execution available for JavaScript/TypeScript/React. Your ${supportedLanguages.find(lang => lang.value === selectedLanguage)?.label} code is ready.`);
      }
    } catch (error) {
      setOutput(`💥 Execution Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runTestCases = async () => {
    if (!code.trim() || isRunningTests || testCases.length === 0) return;

    setIsRunningTests(true);
    setTestResults([]);

    try {
      // Simulate running test cases
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = testCases.map((testCase, index) => {
        // Mock test results - in real implementation, this would execute the code
        const isPassed = Math.random() > 0.3; // 70% pass rate for demo
        return {
          id: testCase.id,
          name: testCase.name,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: isPassed ? testCase.expectedOutput : "Error or wrong output",
          passed: isPassed,
          executionTime: Math.random() * 100 + 10 // 10-110ms
        };
      });

      setTestResults(results);
    } catch (error) {
      console.error('Error running test cases:', error);
      setTestResults([]);
    } finally {
      setIsRunningTests(false);
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
      case 'jsx': return 'javascript';
      case 'typescript': case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'javascript': case 'js': return 'javascript';
      case 'python': case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': case 'c++': return 'cpp';
      case 'c': return 'c';
      case 'csharp': case 'c#': return 'csharp';
      default: return 'javascript';
    }
  };



  const currentLanguage = supportedLanguages.find(lang => lang.value === selectedLanguage);

  return (
    <div className="w-full min-h-full flex">
      {/* Left Side - Code Editor */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-4 border-b border-slate-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Language Display */}
              <div className="flex items-center space-x-3 px-4 py-2 text-sm rounded-xl bg-slate-700/50 border border-slate-600/50 backdrop-blur-sm shadow-md">
                <span className="text-2xl">{currentLanguage?.icon}</span>
                <span className="font-semibold text-slate-100">
                  {currentLanguage?.label || 'JavaScript'}
                </span>
                {aiDeterminedLanguage && aiDeterminedLanguage !== selectedLanguage && (
                  <div className="flex items-center space-x-1.5">
                    <Brain className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-medium border border-blue-500/30">
                      AI SUGGESTED: {supportedLanguages.find(lang => lang.value === aiDeterminedLanguage)?.label}
                    </span>
                  </div>
                )}
                {aiDeterminedLanguage && aiDeterminedLanguage === selectedLanguage && (
                  <div className="flex items-center space-x-1.5">
                    <Brain className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full font-medium border border-green-500/30">
                      AI MATCHED
                    </span>
                  </div>
                )}
              </div>
              
              {/* Code Quality Indicator */}
              <div className="flex items-center space-x-3">
                <Target className="h-4 w-4 text-slate-300" />
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2.5 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-slate-400 to-slate-300 transition-all duration-700 ease-out"
                      style={{ width: `${codeQuality}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{codeQuality}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Live Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/30 rounded-lg">
                  <Code2 className="h-4 w-4 text-slate-300" />
                  <span className="text-slate-200 font-medium">{linesOfCode} lines</span>
                </div>
                {isTyping && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg animate-pulse">
                    <Zap className="h-4 w-4 text-blue-400 animate-spin" />
                    <span className="text-blue-300 font-medium">Typing...</span>
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.value} value={lang.value} className="text-slate-900">
                      {lang.icon} {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Settings className="h-4 w-4 text-slate-300" />
              </button>

            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-600/50 shadow-xl">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3">Editor Theme</label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  >
                    {themes.map(theme => (
                      <option key={theme.value} value={theme.value} className="text-slate-900">
                        {theme.icon} {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3">Live AI Monitoring</label>
                  <button
                    onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isLiveMonitoring 
                        ? 'bg-slate-600 text-slate-100 border border-slate-500' 
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-600/50'
                    }`}
                  >
                    {isLiveMonitoring ? <Mic className="h-4 w-4 inline mr-2" /> : <MicOff className="h-4 w-4 inline mr-2" />}
                    {isLiveMonitoring ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={resetCode}
              disabled={disabled || isRunning || isCodeDone}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm border border-slate-300/50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="font-medium">Reset</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isCodeDone ? (
              <button
                onClick={startConversation}
                disabled={disabled || isRunning || isAiLoading || code.trim() === starterCode}
                className="flex items-center space-x-2 px-6 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg border border-green-600/50"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">Done</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 px-4 py-2.5 text-sm bg-green-100 text-green-700 rounded-xl border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Code Complete</span>
              </div>
            )}
            
            <button
              onClick={runCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-2 px-6 py-2.5 text-sm bg-slate-700 hover:bg-slate-800 text-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg border border-slate-600/50"
            >
              {isRunning ? (
                <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="font-semibold">Run Code</span>
            </button>

            {testCases.length > 0 && (
              <button
                onClick={runTestCases}
                disabled={disabled || isRunningTests || !code.trim()}
                className="flex items-center space-x-2 px-6 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg border border-green-600/50"
              >
                {isRunningTests ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span className="font-semibold">Run Tests ({testCases.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Code Editor */}
        <div className="flex-1 relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg" style={{ minHeight: '400px', height: '500px' }}>
          {editorLoading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading code editor...</p>
              </div>
            </div>
          )}
          <Editor
            height="100%"
            width="100%"
            language={getLanguageForMonaco(selectedLanguage)}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={editorTheme}
            options={{
              readOnly: disabled,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
              },
              automaticLayout: true, // Re-enable for proper rendering
              wordWrap: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              padding: { top: 24, bottom: 24 },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: true,
              smoothScrolling: true,
              contextmenu: true,
              mouseWheelZoom: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              wordBasedSuggestions: true,
              parameterHints: { enabled: true },
              hover: { enabled: true },
              links: true,
              colorDecorators: true,
              lightbulb: { enabled: true },
              codeLens: true,
              renderWhitespace: 'selection',
              renderControlCharacters: true,
              renderIndentGuides: true,
              highlightActiveIndentGuide: true,
              matchBrackets: 'always',
              renderLineHighlight: 'all',
              occurrencesHighlight: 'multiFile',
              selectionHighlight: true,
              find: {
                seedSearchStringFromSelection: 'always',
                autoFindInSelection: 'multiline'
              },
              placeholder: 'Start typing your code here...'
            }}
          />
          
          {/* Floating Code Stats */}
          <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-md text-slate-100 p-3 rounded-xl text-xs space-y-2 shadow-xl border border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Code2 className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-medium">{linesOfCode} lines</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-medium">{codeQuality}% quality</span>
            </div>
              {isTyping && (
                <div className="flex items-center space-x-2 animate-pulse bg-blue-500/20 border border-blue-500/30 rounded-lg px-2 py-1">
                  <Zap className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                  <span className="font-medium text-blue-300">Typing...</span>
                </div>
              )}
          </div>
        </div>

      </div>

      {/* Right Side - Output Panel */}
      <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
        {/* Tabs */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
          <div className="flex space-x-1">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !showLiveComments && !showTestCases
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setShowLiveComments(false);
                setShowTestCases(false);
              }}
            >
              💻 Console
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                showLiveComments 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setShowLiveComments(true);
                setShowTestCases(false);
              }}
            >
              🤖 AI Assistant
              {liveComments.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {liveComments.length}
                </span>
              )}
            </button>
            {(testCases.length > 0 || isGeneratingTestCases) && (
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showTestCases 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => {
                  setShowLiveComments(false);
                  setShowTestCases(true);
                }}
              >
                🧪 Test Cases
                {isGeneratingTestCases ? (
                  <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    ...
                  </span>
                ) : testResults.length > 0 ? (
                  <span className={`ml-1 text-white text-xs px-1.5 py-0.5 rounded-full ${
                    testResults.every(r => r.passed) ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {testResults.filter(r => r.passed).length}/{testResults.length}
                  </span>
                ) : testCases.length > 0 ? (
                  <span className="ml-1 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {testCases.length}
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showTestCases ? (
            /* Test Cases Section */
            <div className="flex-1 flex flex-col overflow-hidden">
              {testCases.length > 0 ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {testCases.map((testCase) => {
                    const result = testResults.find(r => r.id === testCase.id);
                    return (
                      <div key={testCase.id} className={`border rounded-lg p-3 ${
                        result 
                          ? result.passed 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900">
                            {testCase.name}
                          </h4>
                          {result && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.passed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.passed ? '✅ Pass' : '❌ Fail'}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-gray-600">Input:</span>
                            <code className="ml-1 px-2 py-1 bg-gray-100 rounded text-gray-800">
                              {testCase.input}
                            </code>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Expected:</span>
                            <code className="ml-1 px-2 py-1 bg-gray-100 rounded text-gray-800">
                              {testCase.expectedOutput}
                            </code>
                          </div>
                          {result && (
                            <div>
                              <span className="font-medium text-gray-600">Actual:</span>
                              <code className={`ml-1 px-2 py-1 rounded ${
                                result.passed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.actualOutput}
                              </code>
                            </div>
                          )}
                          {result && (
                            <div className="text-gray-500">
                              ⏱️ {result.executionTime.toFixed(1)}ms
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  <div className="text-center">
                    {isGeneratingTestCases ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                        <p>Generating test cases...</p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🧪</div>
                        <p>No test cases available</p>
                        <button
                          onClick={generateTestCases}
                          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Generate Test Cases
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Test Loading Indicator */}
              {isRunningTests && (
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-green-50">
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Running tests...</span>
                  </div>
                </div>
              )}
            </div>
          ) : showLiveComments ? (
            /* Live Comments Section */
            <div className="flex-1 flex flex-col overflow-hidden">
              {liveComments.length > 0 ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {liveComments.map((comment) => (
                    <div key={comment.id} className={`rounded-lg p-3 shadow-sm ${
                      comment.type === 'user' 
                        ? 'bg-green-50 border border-green-200 ml-8' 
                        : 'bg-blue-50 border border-blue-200 mr-8'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          comment.type === 'user' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          {comment.type === 'user' ? (
                            <span className="text-white text-xs font-bold">U</span>
                          ) : (
                            <Brain className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {comment.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🤖</div>
                    <p>AI assistant will provide live feedback as you code</p>
                  </div>
                </div>
              )}
              
              {/* User Response Input */}
              {conversationStep > 0 && conversationStep < 3 && (
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        Question {conversationStep} of 2
                      </span>
                      <div className="flex space-x-1">
                        <div className={`w-2 h-2 rounded-full ${conversationStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${conversationStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUserResponse()}
                      placeholder={`Answer question ${conversationStep}...`}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isResponding}
                    />
                    <button
                      onClick={handleUserResponse}
                      disabled={!userResponse.trim() || isResponding}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isResponding ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Conversation Complete Message */}
              {conversationStep === 3 && (
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-green-50">
                  <div className="text-center">
                    <div className="text-green-600 text-sm font-medium mb-1">
                      ✅ Conversation Complete
                    </div>
                    <div className="text-xs text-green-600">
                      Moving to next question...
                    </div>
                  </div>
                </div>
              )}

              {/* AI Loading Indicator */}
              {isAiLoading && (
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-blue-50">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Console Output Section */
            <div className="p-4">
          {output ? (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm border border-gray-300">
              <pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
            </div>
          ) : isTyping ? (
            <div className="flex items-center justify-center h-full text-blue-500 text-sm">
              <div className="text-center">
                <div className="text-4xl mb-2 animate-pulse">⌨️</div>
                <p className="animate-pulse">Typing code...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <div className="text-center">
                <div className="text-4xl mb-2">🚀</div>
                <p>Run your code to see output here</p>
              </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SuperCoolCodeEditor;
