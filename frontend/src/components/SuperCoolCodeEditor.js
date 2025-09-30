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
  Trophy,
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
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
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
  const achievementTimeoutRef = useRef(null);

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

  // Achievement system
  const checkAchievements = useCallback((newCode) => {
    const newAchievements = [];
    
    // First Code Achievement
    if (newCode.trim().length > 10 && !achievements.includes('first_code')) {
      newAchievements.push({
        id: 'first_code',
        title: '🚀 First Code!',
        description: 'You wrote your first line of code!',
        icon: '🚀'
      });
    }
    
    // Function Master
    if (newCode.includes('function') && !achievements.includes('function_master')) {
      newAchievements.push({
        id: 'function_master',
        title: '⚡ Function Master',
        description: 'You created your first function!',
        icon: '⚡'
      });
    }
    
    // Loop Master
    if ((newCode.includes('for') || newCode.includes('while')) && !achievements.includes('loop_master')) {
      newAchievements.push({
        id: 'loop_master',
        title: '🔄 Loop Master',
        description: 'You mastered loops!',
        icon: '🔄'
      });
    }
    
    // 50 Lines Achievement
    const lines = newCode.split('\n').length;
    if (lines >= 50 && !achievements.includes('fifty_lines')) {
      newAchievements.push({
        id: 'fifty_lines',
        title: '📝 Code Writer',
        description: 'You wrote 50+ lines of code!',
        icon: '📝'
      });
    }
    
    // Test Passer
    if (testResults.some(result => result.passed) && !achievements.includes('test_passer')) {
      newAchievements.push({
        id: 'test_passer',
        title: '✅ Test Master',
        description: 'You passed your first test!',
        icon: '✅'
      });
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
      setShowAchievements(true);
      
      // Auto-hide achievements after 3 seconds
      achievementTimeoutRef.current = setTimeout(() => {
        setShowAchievements(false);
      }, 3000);
    }
  }, [achievements, testResults]);

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
    
    // Check achievements
    checkAchievements(code);
  }, [code, testResults, checkAchievements]);

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
      {/* Achievement Notifications */}
      {showAchievements && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {achievements.slice(-3).map((achievementId) => {
            const achievement = [
              { id: 'first_code', title: '🚀 First Code!', description: 'You wrote your first line of code!' },
              { id: 'function_master', title: '⚡ Function Master', description: 'You created your first function!' },
              { id: 'loop_master', title: '🔄 Loop Master', description: 'You mastered loops!' },
              { id: 'fifty_lines', title: '📝 Code Writer', description: 'You wrote 50+ lines of code!' },
              { id: 'test_passer', title: '✅ Test Master', description: 'You passed your first test!' }
            ].find(a => a.id === achievementId);
            
            return (
              <div key={achievementId} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg animate-bounce">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6" />
                  <div>
                    <div className="font-bold">{achievement.title}</div>
                    <div className="text-sm opacity-90">{achievement.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Width Code Editor */}
      <div className="w-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-3 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Language Display */}
              <div className="flex items-center space-x-2 px-3 py-1 text-sm rounded-lg bg-white/20 border border-white/30">
                <span className="text-2xl">{currentLanguage?.icon}</span>
                <span className="font-bold">
                  {currentLanguage?.label || 'JavaScript'}
                </span>
                {languageLocked && (
                  <div className="flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                      LOCKED
                    </span>
                  </div>
                )}
                {aiDeterminedLanguage && (
                  <div className="flex items-center space-x-1">
                    <Brain className="h-3 w-3" />
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                      AI CHOSEN
                    </span>
                  </div>
                )}
              </div>
              
              {/* Code Quality Indicator */}
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <div className="flex items-center space-x-1">
                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-400 transition-all duration-500"
                      style={{ width: `${codeQuality}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold">{codeQuality}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Live Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Code2 className="h-4 w-4" />
                  <span>{linesOfCode} lines</span>
                </div>
                {isTyping && (
                  <div className="flex items-center space-x-1 animate-pulse">
                    <Zap className="h-4 w-4" />
                    <span>Typing...</span>
                  </div>
                )}
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Fullscreen Toggle */}
              {onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Editor Theme</label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full px-3 py-1 bg-white/20 border border-white/30 rounded text-white text-sm"
                  >
                    {themes.map(theme => (
                      <option key={theme.value} value={theme.value} className="text-gray-900">
                        {theme.icon} {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Live AI Monitoring</label>
                  <button
                    onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
                    className={`w-full px-3 py-1 rounded text-sm font-medium transition-colors ${
                      isLiveMonitoring 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {isLiveMonitoring ? <Mic className="h-4 w-4 inline mr-1" /> : <MicOff className="h-4 w-4 inline mr-1" />}
                    {isLiveMonitoring ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white px-4 py-2 border-b border-gray-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={resetCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={runCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        {/* Enhanced Code Editor */}
        <div className="flex-1 min-h-0 relative">
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
              padding: { top: 20, bottom: 20 },
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
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white p-2 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1">
              <Code2 className="h-3 w-3" />
              <span>{linesOfCode} lines</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>{codeQuality}% quality</span>
            </div>
            {isTyping && (
              <div className="flex items-center space-x-1 animate-pulse">
                <Zap className="h-3 w-3" />
                <span>Typing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Output Section */}
        {(output || testResults.length > 0) && (
          <div className="border-t border-gray-300 bg-gray-900 text-green-400 p-4 max-h-40 overflow-y-auto">
            <div className="space-y-2">
              {/* Console Output */}
              {output && (
                <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-400">💻 Console Output:</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-green-400">{output}</pre>
                </div>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white text-sm flex items-center space-x-2">
                    <span>🧪 Test Results:</span>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </span>
                  </h4>
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-xs ${
                        result.passed
                          ? 'bg-green-900/50 border-green-500/50 text-green-300'
                          : 'bg-red-900/50 border-red-500/50 text-red-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className="font-medium">
                          Test {result.testCase} {result.passed ? '✅ PASSED' : '❌ FAILED'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-gray-400">Input:</span> 
                          <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-green-300">
                            {result.input}
                          </code>
                        </div>
                        <div>
                          <span className="text-gray-400">Expected:</span> 
                          <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-blue-300">
                            {JSON.stringify(result.expected)}
                          </code>
                        </div>
                        <div>
                          <span className="text-gray-400">Actual:</span> 
                          <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-yellow-300">
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
