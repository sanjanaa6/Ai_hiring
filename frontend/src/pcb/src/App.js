import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import CanvasWithCode from './components/CanvasWithCode.jsx';
import { TooltipProvider } from './components/ui/tooltip';
import { useUndoRedo } from './hooks/useUndoRedo';

// Create a context for the theme
export const ThemeContext = React.createContext({ isDarkMode: true });

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime] = useState(Date.now());
  
  // Initialize undo/redo system with empty state
  const initialCanvasState = {
    components: [],
    wires: [],
    wireGroups: {}
  };
  
  // TEMPORARY: Use simple state instead of undo/redo to ensure stability
  const [canvasState, setCanvasState] = React.useState(initialCanvasState);
  
  // Simple state update function - no history
  const addToHistory = React.useCallback((newState) => {
    if (newState?.components?.length >= 0) {
      setCanvasState(newState);
    }
  }, []);
  
  // Disabled undo/redo for now - will implement properly later
  const undo = () => console.log('Undo temporarily disabled');
  const redo = () => console.log('Redo temporarily disabled');
  const canUndo = false;
  const canRedo = false;

  // Check URL parameters for interview mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const interviewId = urlParams.get('interviewId');
    const roundId = urlParams.get('roundId');
    const questionId = urlParams.get('questionId');
    const duration = urlParams.get('duration');
    const candidateId = urlParams.get('candidateId');
    const candidateName = urlParams.get('candidateName');
    const candidateEmail = urlParams.get('candidateEmail');
    
    // Check if loaded in iframe (from interview)
    const isInIframe = window.self !== window.top;
    
    console.log('🔧 [PCB] URL Params:', {
      mode,
      interviewId,
      roundId,
      questionId,
      duration,
      candidateId,
      candidateName,
      candidateEmail,
      isInIframe,
      fullUrl: window.location.href
    });
    
    // Activate interview mode if params exist OR if in iframe
    if (mode === 'interview' || (interviewId && roundId) || isInIframe) {
      setIsInterviewMode(true);
      const data = {
        interviewId,
        roundId,
        questionId,
        candidateId,
        candidateName,
        candidateEmail,
        duration: duration ? parseInt(duration) : 6
      };
      setInterviewData(data);
      if (duration) {
        setTimeRemaining(parseInt(duration) * 60); // Convert to seconds
      }
      console.log('🔧 PCB - Interview Mode Activated', data);
    }
  }, []);

  // Timer Effect for interview mode
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

  // Auto-save every 30 seconds in interview mode
  useEffect(() => {
    if (!isInterviewMode) return;
    
    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [canvasState, isInterviewMode]);

  useEffect(() => {
    // Apply theme class to document
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

  // Auto-save function for interview mode
  const handleAutoSave = async () => {
    if (!isInterviewMode || !interviewData) return;
    
    try {
      const pcbData = {
        version: '1.0',
        canvasState: canvasState,
        metadata: {
          createdAt: new Date().toISOString(),
          questionId: interviewData.questionId
        }
      };
      
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await fetch('http://localhost:5000/api/interviews/pcb-design/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: interviewData.interviewId,
          roundId: interviewData.roundId,
          questionId: interviewData.questionId,
          pcbData,
          timeSpent,
          candidateId: interviewData.candidateId,
          candidateName: interviewData.candidateName,
          candidateEmail: interviewData.candidateEmail
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ [PCB] Auto-save successful');
      }
    } catch (error) {
      console.error('❌ [PCB] Auto-save failed:', error);
    }
  };

  // Submit function for interview mode
  const handleSubmit = async () => {
    if (!isInterviewMode || !interviewData) return;
    
    if (canvasState.components.length === 0) {
      if (!window.confirm('Your PCB design is empty. Are you sure you want to submit?')) {
        return;
      }
    }

    try {
      const pcbData = {
        version: '1.0',
        canvasState: canvasState,
        metadata: {
          createdAt: new Date().toISOString(),
          questionId: interviewData.questionId
        }
      };
      
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await fetch('http://localhost:5000/api/interviews/pcb-design/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: interviewData.interviewId,
          roundId: interviewData.roundId,
          questionId: interviewData.questionId,
          pcbData,
          timeSpent,
          candidateId: interviewData.candidateId,
          candidateName: interviewData.candidateName,
          candidateEmail: interviewData.candidateEmail
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('PCB design submitted successfully!');
        // Close window or redirect back
        window.close();
      } else {
        alert('Failed to submit: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ [PCB] Submission failed:', error);
      alert('Failed to submit PCB design. Please try again.');
    }
  };

  // Auto-submit when time runs out
  const handleAutoSubmit = async () => {
    console.log('⏰ [PCB] Time expired - Auto-submitting...');
    await handleSubmit();
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`flex h-screen w-screen font-sans overflow-hidden ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        {/* Fixed width sidebar on the left */}
        <Sidebar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        {/* Main content area with toolbar and canvas */}
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
          />
          <div className="flex-1 overflow-hidden">
            <CanvasWithCode 
              isDarkMode={isDarkMode}
              canvasState={canvasState}
              onCanvasStateChange={addToHistory}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default App;
