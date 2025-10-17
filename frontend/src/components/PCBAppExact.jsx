import React, { useState, useEffect } from 'react';
import './PCBApp.css';
import './PCBIndex.css';
import Sidebar from './pcb-components/Sidebar.jsx';
import Toolbar from './pcb-components/Toolbar.jsx';
import CanvasWithCode from './pcb-components/CanvasWithCode.jsx';
import { TooltipProvider } from './pcb-components/ui/tooltip';

/**
 * PCBAppExact - EXACT copy of standalone PCB app
 * Uses copied components from pcb folder
 */
const PCBAppExact = ({
  question,
  interviewId,
  roundId,
  candidateInfo,
  onComplete,
  onBack,
  isDarkMode: propIsDarkMode = true,
  timeLimit = 30
}) => {
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode);
  const [isInterviewMode] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [startTime] = useState(Date.now());
  
  // Initialize canvas state - EXACT same as PCB app
  const initialCanvasState = {
    components: [],
    wires: [],
    wireGroups: {}
  };
  
  const [canvasState, setCanvasState] = React.useState(initialCanvasState);
  
  // Simple state update function - EXACT same as PCB app
  const addToHistory = React.useCallback((newState) => {
    if (newState?.components?.length >= 0) {
      setCanvasState(newState);
    }
  }, []);
  
  // Disabled undo/redo - EXACT same as PCB app
  const undo = () => console.log('Undo temporarily disabled');
  const redo = () => console.log('Redo temporarily disabled');
  const canUndo = false;
  const canRedo = false;

  // Interview data - EXACT same structure as PCB app
  const interviewData = {
    interviewId,
    roundId,
    questionId: question?.id || question?._id,
    candidateId: candidateInfo?.id,
    candidateName: candidateInfo?.name,
    candidateEmail: candidateInfo?.email,
    duration: timeLimit
  };

  // Timer Effect - EXACT same as PCB app
  useEffect(() => {
    if (!isInterviewMode || timeRemaining === null) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInterviewMode, timeRemaining]);

  // Apply theme - EXACT same as PCB app
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Submit function - EXACT same as PCB app
  const handleSubmit = async () => {
    if (!isInterviewMode || !interviewData) return;
    
    if (canvasState.components.length === 0) {
      if (!window.confirm('Your PCB design is empty. Are you sure you want to submit?')) {
        return;
      }
    }

    console.log('📤 [PCB] Submitting design:', canvasState);
    
    if (onComplete) {
      onComplete();
    }
  };

  // Auto-submit - EXACT same as PCB app
  const handleAutoSubmit = async () => {
    console.log('⏰ [PCB] Time expired - Auto-submitting...');
    await handleSubmit();
  };

  // Format time - EXACT same as PCB app
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`flex h-screen w-screen font-sans overflow-hidden ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        {/* Back Button - Added for interview flow */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-[9999] px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Question
          </button>
        )}

        {/* Fixed width sidebar on the left - EXACT same as PCB app */}
        <Sidebar 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme}
          canvasState={canvasState}
          setCanvasState={addToHistory}
          isInterviewMode={isInterviewMode}
          interviewData={interviewData}
        />
        
        {/* Main content area with toolbar and canvas - EXACT same as PCB app */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Toolbar 
            isDarkMode={isDarkMode} 
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            isInterviewMode={isInterviewMode}
            timeRemaining={timeRemaining}
            formatTime={formatTime}
            onSubmit={handleSubmit}
            canvasState={canvasState}
            interviewData={interviewData}
            startTime={startTime}
          />
          <div className="flex-1 overflow-hidden">
            <CanvasWithCode 
              isDarkMode={isDarkMode}
              canvasState={canvasState}
              onCanvasStateChange={addToHistory}
              setCanvasState={addToHistory}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              isInterviewMode={isInterviewMode}
              interviewData={interviewData}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PCBAppExact;
