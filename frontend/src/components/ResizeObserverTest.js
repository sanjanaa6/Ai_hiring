import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// Simple component to test ResizeObserver fixes
const ResizeObserverTest = () => {
  const { isDarkMode } = useTheme();
  const [resizeCount, setResizeCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Monitor for ResizeObserver errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('ResizeObserver')) {
        setErrorCount(prev => prev + 1);
        return; // Suppress the error
      }
      originalError.apply(console, args);
    };

    // Monitor resize events
    const handleResize = () => {
      setResizeCount(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.error = originalError;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`p-6 rounded-lg ${
      isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
    }`}>
      <h3 className="text-lg font-semibold mb-4">ResizeObserver Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Resize Events:</span>
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
          }`}>
            {resizeCount}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm">ResizeObserver Errors:</span>
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            errorCount === 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {errorCount}
          </span>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Try resizing the browser window. ResizeObserver errors should be suppressed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResizeObserverTest;
