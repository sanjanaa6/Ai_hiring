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
