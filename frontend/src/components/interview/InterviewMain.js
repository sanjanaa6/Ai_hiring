import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  Code, 
  Clock,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SuperCoolCodeEditor from '../SuperCoolCodeEditor';
import SmallCamera from './SmallCamera';
import CodingRound from './CodingRound';
import SystemDesignRound from './SystemDesignRound';
import aiTestCaseService from '../../services/aiTestCaseService';

const InterviewMain = ({
  interviewId,
  currentRound,
  currentQuestion,
  questionIndex,
  timeRemaining,
  isAISpeaking,
  isRecording,
  transcription,
  interimTranscription,
  codeAnswer,
  selectedLanguage,
  isLanguageLocked,
  aiDeterminedLanguage,
  showCodeEditor,
  isCodeEditorFullscreen,
  isLiveCodingRound,
  isSalesRound,
  isSystemDesignRound,
  isAiQuestioning,
  aiQuestions,
  currentAiQuestionIndex,
  cameraStream,
  personDetectionWarning,
  testWarning,
  onStartRecording,
  onStopRecording,
  onSkipQuestion,
  onNextQuestion,
  onSubmitAnswer,
  onCodeChange,
  onLanguageChange,
  onToggleCodeEditor,
  onToggleFullscreen,
  onToggleAISpeaking,
  onAnswerAIQuestion,
  interviewData, // Add interview data to check if it's a developer interview
  candidateInfo,
}) => {
  const { isDarkMode } = useTheme();
  const [showSystemDesignCanvas, setShowSystemDesignCanvas] = useState(false); // Add state to show SystemDesignRound inline
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);

  // Check if this is a developer interview with coding rounds
  const isDeveloperInterview = aiTestCaseService.isDeveloperInterview(interviewData);
  const isCodingRoundForDeveloper = isDeveloperInterview && aiTestCaseService.isCodingRound(currentRound);
  const shouldShowCodingRound = isLiveCodingRound && isCodingRoundForDeveloper;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Debug effect to track warning prop
  useEffect(() => {
    console.log('🚨 InterviewMain received personDetectionWarning:', personDetectionWarning);
  }, [personDetectionWarning]);

  const getQuestionTypeIcon = () => {
    if (isLiveCodingRound) return <Code className="h-5 w-5" />;
    if (isSalesRound) return <Volume2 className="h-5 w-5" />;
    return <Mic className="h-5 w-5" />;
  };

  const getQuestionTypeColor = () => {
    if (isLiveCodingRound) return 'text-blue-500';
    if (isSalesRound) return 'text-green-500';
    if (isSystemDesignRound) return 'text-green-500';
    return 'text-purple-500';
  };
  
  // Handle opening canvas for system design
  const handleOpenCanvas = () => {
    console.log('🎨 [SYSTEM DESIGN] Opening canvas inline');
    setShowSystemDesignCanvas(true);
  };
  
  // Handle closing canvas
  const handleCloseCanvas = () => {
    console.log('🎨 [SYSTEM DESIGN] Closing canvas');
    setShowSystemDesignCanvas(false);
  };

  // Render enhanced coding round only for developer interviews with coding rounds
  if (shouldShowCodingRound) {
    return (
      <CodingRound
        interviewId={interviewId}
        currentRound={currentRound}
        currentQuestion={currentQuestion}
        questionIndex={questionIndex}
        timeRemaining={timeRemaining}
        isAISpeaking={isAISpeaking}
        isRecording={isRecording}
        transcription={transcription}
        codeAnswer={codeAnswer}
        selectedLanguage={selectedLanguage}
        isLanguageLocked={isLanguageLocked}
        aiDeterminedLanguage={aiDeterminedLanguage}
        cameraStream={cameraStream}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onSkipQuestion={onSkipQuestion}
        onNextQuestion={onNextQuestion}
        onCodeChange={onCodeChange}
        onLanguageChange={onLanguageChange}
        onToggleAISpeaking={onToggleAISpeaking}
        onSubmitAnswer={onSubmitAnswer}
      />
    );
  }
  
  // Render System Design Round when canvas is opened
  if (showSystemDesignCanvas && isSystemDesignRound) {
    return (
      <SystemDesignRound
        round={currentRound}
        interviewId={interviewId}
        candidateInfo={candidateInfo}
        onComplete={(roundId) => {
          console.log('✅ System Design completed for round:', roundId);
          handleCloseCanvas();
          onNextQuestion();
        }}
        onBack={handleCloseCanvas}
      />
    );
  }

  return (
    <div className={`h-screen flex flex-col ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      
      {/* Top Status Bar */}
      <div className={`flex-shrink-0 backdrop-blur-md border-b px-6 py-4 ${
        isDarkMode 
          ? 'bg-black/30 border-white/10' 
          : 'bg-white/90 border-blue-200 shadow-lg'
      }`}>
        <div className="flex justify-between items-center">
          
          {/* Left: Round & Question Info */}
          <div className="flex items-center space-x-6">
            <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <h2 className="text-xl font-bold">
                {currentRound?.title || 'Interview Round'}
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Question {questionIndex + 1} of {currentRound?.questions?.length || 1}
              </p>
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-blue-100'
            }`}>
              {getQuestionTypeIcon()}
              <span className={`text-sm font-medium ${getQuestionTypeColor()}`}>
                {isLiveCodingRound ? 'Coding' : isSalesRound ? 'Sales' : 'Voice'}
              </span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'hover:bg-slate-700/50' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {isMinimized ? (
                <Play className="h-5 w-5 text-blue-500" />
              ) : (
                <Pause className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
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

      {/* Person Detection Warning */}
      {personDetectionWarning && (
        <div className={`flex-shrink-0 px-6 py-3 border-b ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-500/30' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isDarkMode ? 'bg-red-400' : 'bg-red-500'
            } animate-pulse`}></div>
            <div className="flex-1">
              <p className={`font-medium ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>
                ⚠️ Person Detection Alert
              </p>
              <p className={`text-sm ${
                isDarkMode ? 'text-red-400' : 'text-red-700'
              }`}>
                No person detected in camera. Please position yourself in front of the camera to continue the interview.
              </p>
            </div>
            <button 
              onClick={() => console.log('Test button clicked - warning should be visible')}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
            >
              Test
            </button>
          </div>
        </div>
      )}

      {/* Test Warning Button (temporary) */}
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={() => {
            console.log('🚨 Test warning button clicked');
            testWarning();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded shadow-lg"
        >
          Test Warning
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Question & Controls */}
        <div className={`flex-1 flex flex-col ${
          isMinimized ? 'hidden' : ''
        }`}>
          
          {/* Question Display */}
          <div className={`flex-1 p-8 overflow-y-auto ${
            isDarkMode ? 'bg-slate-800/30' : 'bg-white/50'
          }`}>
            <div className="max-w-4xl mx-auto">
              
              {/* Current Question */}
              {currentQuestion && (
                <div className={`mb-8 p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-slate-800/50 border border-white/10' 
                    : 'bg-white/80 border border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      {getQuestionTypeIcon()}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-semibold mb-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentQuestion.question}
                      </h3>
                      
                      {currentQuestion.description && (
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {currentQuestion.description}
                        </p>
                      )}
                      
                      {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                        <div className="mt-4">
                          <p className={`text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          }`}>
                            Hints:
                          </p>
                          <ul className={`text-sm space-y-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {currentQuestion.hints.map((hint, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                <span>{hint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Questions */}
              {isAiQuestioning && aiQuestions.length > 0 && (
                <div className={`mb-8 p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-purple-800/30 border border-purple-500/30' 
                    : 'bg-purple-50 border border-purple-200'
                } shadow-lg`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <h4 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      AI Follow-up Question
                    </h4>
                  </div>
                  <p className={`text-base ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {aiQuestions[currentAiQuestionIndex]?.question}
                  </p>
                </div>
              )}

              {/* Transcription Display */}
              {showTranscription && (transcription || interimTranscription) && (
                <div className={`mb-8 p-6 rounded-2xl ${
                  isDarkMode 
                    ? 'bg-green-800/20 border border-green-500/30' 
                    : 'bg-green-50 border border-green-200'
                } shadow-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Your Response
                    </h4>
                    <button
                      onClick={() => setShowTranscription(!showTranscription)}
                      className={`text-sm ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Hide
                    </button>
                  </div>
                  <div className={`text-base ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {transcription && (
                      <p className="mb-2">{transcription}</p>
                    )}
                    {interimTranscription && (
                      <p className="italic opacity-70">
                        {interimTranscription}
                        <span className="animate-pulse">|</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Code Editor Toggle */}
              {isLiveCodingRound && (
                <div className="mb-6">
                  <button
                    onClick={onToggleCodeEditor}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      showCodeEditor
                        ? isDarkMode
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Code className="h-5 w-5" />
                    <span>{showCodeEditor ? 'Hide Code Editor' : 'Show Code Editor'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className={`flex-shrink-0 p-6 border-t ${
            isDarkMode 
              ? 'bg-slate-800/50 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-4">
                
                {/* Recording Button */}
                <button
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all transform ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-6 w-6" />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-6 w-6" />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>

                {/* Open Canvas Button for System Design OR Submit Answer Button */}
                {isSystemDesignRound ? (
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={handleOpenCanvas}
                      className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
                          : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg'
                      }`}
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Open Design Canvas</span>
                    </button>
                    
                    <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Design your system, download the diagram, then click Next to continue
                    </div>
                  </div>
                ) : (transcription || codeAnswer) && (
                  <button
                    onClick={onSubmitAnswer}
                    className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-medium transition-all ${
                      isDarkMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Submit Answer</span>
                  </button>
                )}

                {/* Skip Button */}
                <button
                  onClick={onSkipQuestion}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-medium transition-all ${
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <SkipForward className="h-5 w-5" />
                  <span>Skip</span>
                </button>

                {/* Next Question Button - Now submits answer first */}
                <button
                  onClick={async () => {
                    console.log('🔵 [NEXT BUTTON] Clicked - submitting answer first');
                    // Submit answer before moving to next question
                    if (onSubmitAnswer) {
                      await onSubmitAnswer();
                    }
                    // Then move to next question
                    if (onNextQuestion) {
                      onNextQuestion();
                    }
                  }}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-medium transition-all ${
                    isDarkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Submit & Next</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Small Camera */}
        <div className={`w-80 flex-shrink-0 border-l ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className={`h-full flex flex-col ${
            isDarkMode ? 'bg-slate-800/30' : 'bg-white/50'
          }`}>
            
            {/* Camera Header */}
            <div className={`flex-shrink-0 p-4 border-b ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Camera Feed
              </h3>
            </div>

            {/* Camera Video */}
            <div className="flex-1 p-4">
              <SmallCamera
                cameraStream={cameraStream}
                isRecording={isRecording}
                className="h-full"
                showControls={false}
                showStatus={true}
              />
            </div>

            {/* Camera Controls */}
            <div className={`flex-shrink-0 p-4 border-t ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}></div>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {isRecording ? 'Recording' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor Modal */}
      {showCodeEditor && isLiveCodingRound && (
        <div className={`fixed inset-0 z-50 ${
          isCodeEditorFullscreen ? 'bg-black' : 'bg-black/50'
        } flex items-center justify-center p-4`}>
          <div className={`w-full h-full ${
            isCodeEditorFullscreen ? 'max-w-none max-h-none' : 'max-w-4xl max-h-[80vh]'
          } rounded-2xl overflow-hidden ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          } shadow-2xl`}>
            
            {/* Code Editor Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Code Editor
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onToggleFullscreen}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode 
                      ? 'hover:bg-slate-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isCodeEditorFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                <button
                  onClick={onToggleCodeEditor}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode 
                      ? 'hover:bg-slate-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Code Editor Content */}
            <div className="flex-1 h-full">
              <SuperCoolCodeEditor
                value={codeAnswer}
                onChange={onCodeChange}
                language={selectedLanguage}
                onLanguageChange={onLanguageChange}
                languageLocked={isLanguageLocked}
                aiDeterminedLanguage={aiDeterminedLanguage}
                isFullscreen={isCodeEditorFullscreen}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewMain;
