import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  Brain,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  SkipForward,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SuperCoolCodeEditor from '../SuperCoolCodeEditor';
import TestCaseManager from '../TestCaseManager';
import SmallCamera from './SmallCamera';
import codeExecutionService from '../../services/codeExecutionService';
import aiTestCaseService from '../../services/aiTestCaseService';
import { cleanupResizeObservers } from '../../utils/resizeObserver';

const CodingRound = ({
  currentRound,
  currentQuestion,
  questionIndex,
  timeRemaining,
  isAISpeaking,
  isRecording,
  transcription,
  codeAnswer,
  selectedLanguage,
  isLanguageLocked,
  cameraStream,
  onStartRecording,
  onStopRecording,
  onSkipQuestion,
  onNextQuestion,
  onCodeChange,
  onLanguageChange,
  onToggleAISpeaking,
  onSubmitAnswer
}) => {
  const { isDarkMode } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [showTestCases, setShowTestCases] = useState(false); // Start hidden
  const [showHints, setShowHints] = useState(false);
  const [codeQuality, setCodeQuality] = useState(0);
  const [linesOfCode, setLinesOfCode] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState(null);
  const [aiGeneratedTestCases, setAiGeneratedTestCases] = useState([]);
  const [isGeneratingTestCases, setIsGeneratingTestCases] = useState(false);
  const [testCasesGenerated, setTestCasesGenerated] = useState(false);

  // Get test cases from question or AI generation
  const originalTestCases = currentQuestion?.codeEditor?.testCases || [];
  const testCases = testCasesGenerated ? aiGeneratedTestCases : originalTestCases;
  const hints = currentQuestion?.codeEditor?.hints || [];
  const timeLimit = currentQuestion?.timeLimit || 15;
  const difficulty = currentQuestion?.difficulty || 'Medium';

  // Calculate test statistics
  const getTestStats = () => {
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { passed, total, percentage };
  };

  const stats = getTestStats();

  // Generate AI test cases when code editor is first opened
  const generateAITestCases = async () => {
    if (testCasesGenerated || isGeneratingTestCases || !currentQuestion) return;

    setIsGeneratingTestCases(true);
    try {
      console.log('🤖 Generating AI test cases for coding problem...');
      const generatedCases = await aiTestCaseService.generateTestCases(
        currentQuestion, 
        selectedLanguage
      );
      
      if (generatedCases.length > 0) {
        setAiGeneratedTestCases(generatedCases);
        setTestCasesGenerated(true);
        console.log('✅ AI generated', generatedCases.length, 'test cases');
      }
    } catch (error) {
      console.error('❌ Failed to generate AI test cases:', error);
    } finally {
      setIsGeneratingTestCases(false);
    }
  };

  // Show test cases and generate them with AI when code editor is opened
  const handleShowTestCases = () => {
    if (!showTestCases && !testCasesGenerated) {
      generateAITestCases();
    }
    setShowTestCases(!showTestCases);
  };

  // Update code metrics
  useEffect(() => {
    if (codeAnswer) {
      const lines = codeAnswer.split('\n').length;
      setLinesOfCode(lines);
      
      // Simple code quality calculation
      const quality = Math.min(100, Math.max(0, 
        (lines > 0 ? 20 : 0) + 
        (codeAnswer.includes('function') ? 20 : 0) +
        (codeAnswer.includes('return') ? 20 : 0) +
        (codeAnswer.includes('//') ? 10 : 0) +
        (codeAnswer.length > 50 ? 10 : 0) +
        (codeAnswer.includes('const') || codeAnswer.includes('let') ? 10 : 0) +
        (codeAnswer.includes('if') || codeAnswer.includes('for') || codeAnswer.includes('while') ? 10 : 0)
      ));
      setCodeQuality(quality);
    }
  }, [codeAnswer]);

  // Cleanup ResizeObserver on unmount
  useEffect(() => {
    return () => {
      cleanupResizeObservers();
    };
  }, []);

  // Auto-run tests when code changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (codeAnswer && codeAnswer.trim() && testCases.length > 0) {
        runTests();
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [codeAnswer, testCases]);

  // Run tests
  const runTests = async () => {
    if (!codeAnswer.trim()) {
      setTestResults([]);
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const result = await codeExecutionService.executeCodeWithTests(
        codeAnswer, 
        testCases, 
        selectedLanguage
      );
      
      if (result.success) {
        setTestResults(result.testResults || []);
        setExecutionTime(result.executionTime || 0);
        setLastExecutionTime(new Date());
      } else {
        setTestResults([]);
        setExecutionTime(0);
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults([]);
      setExecutionTime(0);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle code submission
  const handleSubmitCode = () => {
    if (onSubmitAnswer) {
      onSubmitAnswer({
        code: codeAnswer,
        testResults: testResults,
        executionTime: executionTime,
        stats: stats,
        timestamp: new Date()
      });
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'hard': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`h-screen flex flex-col ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      
      {/* Enhanced Header for Coding Round */}
      <div className={`flex-shrink-0 backdrop-blur-md border-b px-6 py-4 ${
        isDarkMode 
          ? 'bg-black/30 border-white/10' 
          : 'bg-white/90 border-blue-200 shadow-lg'
      }`}>
        <div className="flex justify-between items-center">
          
          {/* Left: Challenge Info */}
          <div className="flex items-center space-x-6">
            <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold">
                  {currentRound?.title || 'Coding Challenge'}
                </h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(difficulty)}`}>
                  {difficulty}
                </span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Question {questionIndex + 1} of {currentRound?.questions?.length || 1} • {timeLimit} min limit
              </p>
            </div>
          </div>

          {/* Center: Live Stats */}
          <div className="flex items-center space-x-4">
            {/* Code Quality */}
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-300 transition-all duration-700"
                    style={{ width: `${codeQuality}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                  {codeQuality}%
                </span>
              </div>
            </div>

            {/* Lines of Code */}
            <div className="flex items-center space-x-2">
              <Code2 className="h-4 w-4 text-green-500" />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                {linesOfCode} lines
              </span>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
                stats.percentage === 100 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : stats.percentage > 0
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {stats.percentage === 100 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold">
                  {stats.passed}/{stats.total}
                </span>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-3">
            {/* Timer */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'
            }`}>
              <Clock className="h-4 w-4 text-blue-500" />
              <span className={`text-sm font-mono font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* AI Speaking Toggle */}
            <button
              onClick={onToggleAISpeaking}
              className={`p-2 rounded-lg transition-all ${
                isAISpeaking 
                  ? 'bg-red-500 text-white' 
                  : isDarkMode 
                    ? 'hover:bg-slate-700/50 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {isAISpeaking ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Question & Code Editor */}
        <div className="flex-1 flex flex-col">
          
          {/* Question Display */}
          <div className={`flex-shrink-0 p-6 border-b ${
            isDarkMode ? 'bg-slate-800/30 border-white/10' : 'bg-white/50 border-gray-200'
          }`}>
            <div className="max-w-4xl mx-auto">
              
              {/* Current Question */}
              {currentQuestion && (
                <div className={`p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-slate-800/50 border border-white/10' 
                    : 'bg-white/80 border border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <Code2 className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-semibold mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentQuestion.question}
                      </h3>
                      
                      {currentQuestion.description && (
                        <p className={`text-sm mb-4 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {currentQuestion.description}
                        </p>
                      )}

                      {/* Hints Toggle */}
                      {hints.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => setShowHints(!showHints)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                              showHints
                                ? isDarkMode
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                : isDarkMode
                                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <Brain className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {showHints ? 'Hide' : 'Show'} Hints ({hints.length})
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Hints Display */}
                      {showHints && hints.length > 0 && (
                        <div className={`p-4 rounded-lg ${
                          isDarkMode ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                          <h4 className={`text-sm font-medium mb-3 ${
                            isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                          }`}>
                            💡 Hints:
                          </h4>
                          <ul className="space-y-2">
                            {hints.map((hint, index) => (
                              <li key={index} className={`text-sm ${
                                isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                              }`}>
                                {index + 1}. {hint}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
            <SuperCoolCodeEditor
              language={selectedLanguage}
              starterCode={currentQuestion?.codeEditor?.starterCode || ''}
              testCases={testCases}
              question={currentQuestion?.question || ''}
              onCodeChange={onCodeChange}
              disabled={false}
              sessionId={`coding-round-${currentRound?._id}`}
              languageLocked={isLanguageLocked}
            />
          </div>

          {/* Bottom Controls */}
          <div className={`flex-shrink-0 p-6 border-t ${
            isDarkMode 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                
                {/* Left: Test Case Toggle */}
                <button
                  onClick={handleShowTestCases}
                  disabled={isGeneratingTestCases}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isGeneratingTestCases
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : showTestCases
                        ? isDarkMode
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isGeneratingTestCases ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : showTestCases ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hide Test Cases</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Show Test Cases</span>
                    </>
                  )}
                </button>

                {/* Center: Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={runTests}
                    disabled={isExecuting || !codeAnswer.trim()}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isExecuting || !codeAnswer.trim()
                        ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isExecuting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Run Tests</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSubmitCode}
                    disabled={!codeAnswer.trim()}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
                      !codeAnswer.trim()
                        ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Code</span>
                  </button>
                </div>

                {/* Right: Navigation */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onSkipQuestion}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <SkipForward className="h-4 w-4" />
                    <span>Skip</span>
                  </button>

                  <button
                    onClick={onNextQuestion}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <span>Next Question</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Camera & Test Cases */}
        <div className={`w-80 flex-shrink-0 border-l ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className={`h-full flex flex-col ${
            isDarkMode ? 'bg-slate-800/30' : 'bg-white/50'
          }`}>
            
            {/* Camera Section */}
            <div className="flex-shrink-0">
              <div className={`p-4 border-b ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Camera Feed
                </h3>
                <SmallCamera
                  cameraStream={cameraStream}
                  isRecording={isRecording}
                  className="h-48"
                  showControls={false}
                  showStatus={true}
                />
              </div>
            </div>

            {/* Test Cases Section */}
            {showTestCases && (
              <div className="flex-1 overflow-y-auto">
                <TestCaseManager
                  code={codeAnswer}
                  testCases={testCases}
                  language={selectedLanguage}
                  onTestResults={setTestResults}
                  isRunning={isExecuting}
                  disabled={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingRound;
