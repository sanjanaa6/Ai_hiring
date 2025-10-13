import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  CheckCircle, 
  Clock, 
  Target,
  Brain,
  Volume2,
  VolumeX,
  SkipForward,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CodePenEditor from '../CodePenEditor';
import SuperCoolCodeEditor from '../SuperCoolCodeEditor';
import SmallCamera from './SmallCamera';
import { cleanupResizeObservers } from '../../utils/resizeObserver';

const CodingRound = ({
  interviewId,
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
  aiDeterminedLanguage,
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
  const [showTestCases, setShowTestCases] = useState(false); // Start hidden
  const [showHints, setShowHints] = useState(false);
  const [codeQuality, setCodeQuality] = useState(0);
  const [linesOfCode, setLinesOfCode] = useState(0);
  const [conversationState, setConversationState] = useState({
    conversationStep: 0,
    isCodeDone: false,
    isConversationComplete: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset conversation state when question changes
  useEffect(() => {
    setConversationState({
      conversationStep: 0,
      isCodeDone: false,
      isConversationComplete: false
    });
  }, [currentQuestion]);

  const hints = currentQuestion?.codeEditor?.hints || [];
  const timeLimit = currentQuestion?.timeLimit || 15;
  const difficulty = currentQuestion?.difficulty || 'Medium';

  // Strict gate: only coding round may show code editors / design prompts
  const isCodingRound = (() => {
    const type = String(currentRound?.type || '').toLowerCase();
    const title = String(currentRound?.title || '').toLowerCase();
    // Treat common variants as coding rounds
    return /(cod|code|coding|challenge|technical)/i.test(type) || /(cod|code|coding|challenge|technical)/i.test(title);
  })();

  const isFrontendToken = (val) => {
    if (!val) return false;
    const s = String(val).toLowerCase();
    return (
      /(^|\b)(front[- ]?end|frontend|web|html|css|javascript|js)($|\b)/i.test(val) ||
      s === 'html' || s === 'css' || s === 'javascript' || s === 'js'
    );
  };

  const gatherTokens = () => {
    const tokens = [];
    tokens.push(currentRound?.stack);
    tokens.push(currentRound?.title);
    if (Array.isArray(currentRound?.tags)) tokens.push(currentRound.tags.join(' '));
    tokens.push(currentQuestion?.codeEditor?.mode);
    tokens.push(currentQuestion?.codeEditor?.language);
    if (Array.isArray(currentQuestion?.tags)) tokens.push(currentQuestion.tags.join(' '));
    tokens.push(currentQuestion?.question);
    tokens.push(selectedLanguage);
    return tokens.filter(Boolean);
  };

  const isFrontendRound = isCodingRound && gatherTokens().some(isFrontendToken);

  // For frontend rounds, prefer practical, editor-solvable prompts.
  const isTheoryQuestion = (text) => {
    if (!text) return false;
    const s = String(text).toLowerCase();
    return (
      s.includes('difference between') ||
      s.includes('what is') ||
      s.includes('explain') ||
      s.includes('define') ||
      s.includes('advantages') ||
      s.includes('disadvantages') ||
      s.includes('compare') ||
      s.includes('vs ')
    );
  };

  const defaultPractical = {
    question: 'Build a responsive card grid with hover effects',
    description: 'Create a 3-card layout that wraps on small screens. Each card should have a title, description, and a button with a hover transition.',
    codeEditor: {
      mode: 'html',
      starterCode: '<div class="grid">\n  <div class="card">\n    <h3>Card 1</h3>\n    <p>Description goes here.</p>\n    <button>Learn more</button>\n  </div>\n  <div class="card">\n    <h3>Card 2</h3>\n    <p>Description goes here.</p>\n    <button>Learn more</button>\n  </div>\n  <div class="card">\n    <h3>Card 3</h3>\n    <p>Description goes here.</p>\n    <button>Learn more</button>\n  </div>\n</div>\n\n<style>\n  *{box-sizing:border-box} body{font-family:sans-serif;margin:0;padding:16px;}\n  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}\n  @media (max-width: 800px){.grid{grid-template-columns:repeat(2,1fr)}}\n  @media (max-width: 520px){.grid{grid-template-columns:1fr}}\n  .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 6px 16px rgba(0,0,0,.06);transition:transform .2s, box-shadow .2s;}\n  .card:hover{transform:translateY(-4px);box-shadow:0 10px 24px rgba(0,0,0,.12)}\n  button{background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;transition:background .2s} button:hover{background:#1e40af}\n</style>'
    }
  };

  const displayQuestion = (isCodingRound && isFrontendRound && isTheoryQuestion(currentQuestion?.question))
    ? defaultPractical
    : currentQuestion;

  // If prompt asks to debug/fix a snippet and no starter is provided, seed a buggy snippet
  const mentionsSnippet = (txt) => {
    if (!txt) return false;
    const s = String(txt).toLowerCase();
    return s.includes('debug') || s.includes('fix') || s.includes('code snippet') || s.includes('bug');
  };

  const needsDebugSeed = isCodingRound && isFrontendRound && mentionsSnippet(displayQuestion?.question) && !displayQuestion?.codeEditor?.starterCode;

  const seededHtml = needsDebugSeed
    ? '<div class="wrap">\n  <button id="btn">Increment</button>\n  <span id="count">0</span>\n</div>'
    : (displayQuestion?.codeEditor?.starterCode || '<div id="app">Hello</div>');

  const seededCss = needsDebugSeed
    ? '.wrap{display:flex;gap:12px;align-items:center;font-family:sans-serif} #btn{background:#2563eb;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer}'
    : 'body{font-family:sans-serif;} #app{color:#2563eb;font-weight:600;}';

  // Intentional bug: querySelector uses wrong id so count never updates
  const seededJs = needsDebugSeed
    ? 'let count = 0;\nconst btn = document.getElementById("btn");\nconst out = document.getElementById("cnut"); // BUG: typo id should be count\nbtn.addEventListener("click", () => {\n  count++;\n  if(out) out.textContent = String(count);\n});\n// Task: fix the bug so clicking updates the number, and disable button at 10.'
    : 'document.getElementById("app")?.addEventListener("click",()=>console.log("clicked"))';

  // If this is a frontend round, normalize the language to HTML for downstream logic
  useEffect(() => {
    if (isFrontendRound && typeof onLanguageChange === 'function') {
      onLanguageChange('html');
    }
  }, [isFrontendRound, onLanguageChange]);

  // Show test cases toggle
  const handleShowTestCases = () => {
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


  // Handle conversation state changes from SuperCoolCodeEditor
  const handleConversationStateChange = (newState) => {
    setConversationState(newState);
  };

  // Handle code submission
  const handleSubmitCode = () => {
    if (onSubmitAnswer && !isSubmitting) {
      setIsSubmitting(true);
      
      onSubmitAnswer({
        code: codeAnswer,
        timestamp: new Date()
      });
      
      // Move to next question after submission
      setTimeout(() => {
        if (onNextQuestion) {
          onNextQuestion();
        }
        setIsSubmitting(false);
      }, 2000); // Show success message for 2 seconds
    }
  };

  // Check if submit button should be enabled
  const isSubmitEnabled = isFrontendRound
    ? Boolean(codeAnswer && codeAnswer.trim())
    : Boolean(codeAnswer && codeAnswer.trim() && conversationState.isConversationComplete);

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
    <div className={`min-h-screen flex flex-col relative ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      {/* Success Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center">
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Submitted Successfully!</h3>
            <p className="text-gray-600">Moving to next question...</p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent mx-auto"></div>
            </div>
          </div>
        </div>
      )}
      
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

          {/* Center: Language Lock & Live Stats */}
          <div className="flex items-center space-x-4">
            {/* AI Suggested Language Display */}
            {aiDeterminedLanguage && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' 
                  : 'bg-blue-100 border-blue-300 text-blue-700'
              }`}>
                <Brain className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  AI Suggested: {selectedLanguage}
                </span>
              </div>
            )}

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

            {/* Conversation Status */}
            {conversationState.isCodeDone && (
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className={`text-sm font-medium ${
                  conversationState.isConversationComplete 
                    ? 'text-green-500' 
                    : 'text-blue-500'
                }`}>
                  {conversationState.isConversationComplete 
                    ? 'AI Discussion Complete' 
                    : `AI Discussion (${conversationState.conversationStep}/2)`
                  }
                </span>
              </div>
            )}

            {/* Test Cases Status */}
            {!isFrontendRound && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-500">
                  Test Cases Available
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
      <div className="flex-1 flex overflow-y-auto">
        
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
                        {displayQuestion?.question || currentQuestion?.question}
                      </h3>
                      
                      {(displayQuestion?.description || currentQuestion?.description) && (
                        <p className={`text-sm mb-4 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {displayQuestion?.description || currentQuestion?.description}
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

          {/* Editor */}
          <div className="flex-1">
            {isFrontendRound ? (
              <CodePenEditor 
                onCodeChange={(val)=> onCodeChange && onCodeChange(val.combined)} 
                initialHtml={displayQuestion?.codeEditor?.starterCode || '<div id="app">Hello</div>'}
                initialCss={'body{font-family:sans-serif;} #app{color:#2563eb;font-weight:600;}'}
                initialJs={'document.getElementById("app")?.addEventListener("click",()=>console.log("clicked"))'}
              />
            ) : (
              <SuperCoolCodeEditor
                language={selectedLanguage}
                starterCode={currentQuestion?.codeEditor?.starterCode || ''}
                question={currentQuestion?.question || ''}
                onCodeChange={onCodeChange}
                disabled={false}
                sessionId={interviewId}
                languageLocked={isLanguageLocked}
                aiDeterminedLanguage={aiDeterminedLanguage}
                onConversationStateChange={handleConversationStateChange}
              />
            )}
          </div>

          {/* Bottom Controls */}
          <div className={`flex-shrink-0 p-6 border-t ${
            isDarkMode 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                
                {/* Test cases: show only for non-frontend rounds */}
                {!isFrontendRound && (
                  <button
                    onClick={handleShowTestCases}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      showTestCases
                        ? isDarkMode
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {showTestCases ? (
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
                )}

                {/* Center: Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSubmitCode}
                    disabled={!isSubmitEnabled || isSubmitting}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
                      !isSubmitEnabled || isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>
                      {isSubmitting
                        ? 'Submitting...'
                        : isFrontendRound
                          ? 'Submit Code'
                          : (!codeAnswer || !codeAnswer.trim())
                            ? 'Submit Code'
                            : (!conversationState.isConversationComplete
                                ? 'Complete AI Discussion'
                                : 'Submit Code')}
                    </span>
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
                    onClick={async () => {
                      console.log('🔵 [CODING NEXT] Clicked - submitting answer first');
                      // Submit answer before moving to next question
                      if (onSubmitAnswer) {
                        await onSubmitAnswer();
                      }
                      // Then move to next question
                      if (onNextQuestion) {
                        onNextQuestion();
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <span>Submit & Next</span>
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

            {/* Test Cases Section (non-frontend) */}
            {!isFrontendRound && showTestCases && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className={`text-center py-8 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Test cases placeholder</p>
                  <p className="text-xs mt-1">Integrate judge/execution as needed</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingRound;


