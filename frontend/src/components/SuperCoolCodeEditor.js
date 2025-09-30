import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Maximize2, 
  Minimize2,
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

const SuperCoolCodeEditor = ({ 
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
  languageLocked = false,
  aiDeterminedLanguage = null
}) => {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [liveComments, setLiveComments] = useState([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(true);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [showSettings, setShowSettings] = useState(false);
  const [linesOfCode, setLinesOfCode] = useState(0);
  const [codeQuality, setCodeQuality] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  // Update selected language when language prop changes
  React.useEffect(() => {
    if (aiDeterminedLanguage) {
      setSelectedLanguage(aiDeterminedLanguage);
    } else {
      setSelectedLanguage(language);
    }
  }, [language, aiDeterminedLanguage]);
  
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


  const addLiveComment = useCallback((comment) => {
    const liveComment = {
      id: Date.now(),
      content: comment,
      timestamp: new Date(),
      type: 'live'
    };
    setLiveComments(prev => [...prev, liveComment]);
  }, [setLiveComments]);

  const generateLiveComment = useCallback(async () => {
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
        
        if (onAIQuestionGenerated) {
          onAIQuestionGenerated(comment);
        }
      }
    } catch (error) {
      console.error('Live Comment Error', error);
    } finally {
      setIsAiLoading(false);
    }
  }, [isAiLoading, question, code, selectedLanguage, testCases, sessionId, addLiveComment, onAIQuestionGenerated]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveComments]);

  // Live AI monitoring of code changes
  useEffect(() => {
    if (codeUpdateTimeoutRef.current) {
      clearTimeout(codeUpdateTimeoutRef.current);
    }
    
    if (isLiveMonitoring && code.trim() && code !== starterCode) {
      codeUpdateTimeoutRef.current = setTimeout(() => {
        generateLiveComment();
      }, 2000);
    }

    return () => {
      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }
    };
  }, [code, isLiveMonitoring, generateLiveComment, starterCode]);

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
    if (testResults.some(result => result.passed)) quality += 25;
    
    setCodeQuality(Math.min(quality, 100));
  }, [code, testResults]);

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
      if (['javascript', 'typescript', 'jsx', 'tsx'].includes(selectedLanguage)) {
        const wrappedCode = `
          (function() {
            try {
              ${code}
              
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

        // eslint-disable-next-line no-eval
        const result = eval(wrappedCode);
        
        if (result.success) {
          setTestResults(result.testResults || []);
          setOutput('🎉 Code executed successfully!');
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
    <div className={`w-full h-full flex ${isFullScreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>

      {/* Full Width Code Editor */}
      <div className="w-full flex flex-col bg-gray-50">
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
                {languageLocked && (
                  <div className="flex items-center space-x-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs bg-slate-600/80 text-slate-200 px-2.5 py-1 rounded-full font-medium">
                      LOCKED
                    </span>
                  </div>
                )}
                {aiDeterminedLanguage && (
                  <div className="flex items-center space-x-1.5">
                    <Brain className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs bg-slate-600/80 text-slate-200 px-2.5 py-1 rounded-full font-medium">
                      AI CHOSEN
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
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/30 rounded-lg animate-pulse">
                    <Zap className="h-4 w-4 text-slate-300" />
                    <span className="text-slate-200 font-medium">Typing...</span>
                  </div>
                )}
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Settings className="h-4 w-4 text-slate-300" />
              </button>

              {/* Fullscreen Toggle */}
              {onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4 text-slate-300" /> : <Maximize2 className="h-4 w-4 text-slate-300" />}
                </button>
              )}
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
              disabled={disabled || isRunning}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm border border-slate-300/50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="font-medium">Reset</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
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
          </div>
        </div>

        {/* Enhanced Code Editor */}
        <div className="flex-1 min-h-0 relative" style={{ minHeight: '500px' }}>
          <Editor
            height="100%"
            language={getLanguageForMonaco(selectedLanguage)}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={editorTheme}
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
              }
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
              <div className="flex items-center space-x-2 animate-pulse">
                <Zap className="h-3.5 w-3.5 text-slate-300" />
                <span className="font-medium">Typing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Output Section */}
        {(output || testResults.length > 0) && (
          <div className="border-t border-slate-200 bg-slate-900 text-slate-200 p-6 max-h-64 overflow-y-auto shadow-inner">
            <div className="space-y-4">
              {/* Console Output */}
              {output && (
                <div className="bg-slate-800/80 p-4 rounded-xl font-mono text-sm border border-slate-700/50 shadow-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-slate-400 font-semibold">💻 Console Output:</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed">{output}</pre>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-100 text-sm flex items-center space-x-3">
                    <span>🧪 Test Results:</span>
                    <span className="text-xs bg-slate-700/80 px-3 py-1.5 rounded-full border border-slate-600/50">
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </span>
                  </h4>
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border text-xs shadow-lg ${
                        result.passed
                          ? 'bg-slate-800/60 border-slate-600/50 text-slate-200'
                          : 'bg-slate-800/60 border-slate-600/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-slate-300" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-300" />
                        )}
                        <span className="font-semibold">
                          Test {result.testCase} {result.passed ? '✅ PASSED' : '❌ FAILED'}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Input:</span> 
                          <code className="ml-2 bg-slate-700/80 px-2 py-1 rounded text-slate-200 border border-slate-600/30">
                            {result.input}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Expected:</span> 
                          <code className="ml-2 bg-slate-700/80 px-2 py-1 rounded text-slate-200 border border-slate-600/30">
                            {JSON.stringify(result.expected)}
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Actual:</span> 
                          <code className="ml-2 bg-slate-700/80 px-2 py-1 rounded text-slate-200 border border-slate-600/30">
                            {result.error ? result.error : JSON.stringify(result.actual)}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SuperCoolCodeEditor;
