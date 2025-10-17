import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing undo/redo functionality
 * @param {*} initialState - The initial state to track
 * @param {number} maxHistorySize - Maximum number of history entries (default: 50)
 * @returns {Object} - Object containing current state, undo/redo functions, and history info
 */
export const useUndoRedo = (initialState, maxHistorySize = 50) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Get current state
  const currentState = history[currentIndex];

  // Check if undo is possible
  const canUndo = currentIndex > 0;

  // Check if redo is possible
  const canRedo = currentIndex < history.length - 1;

  // Add new state to history
  const addToHistory = useCallback((newState) => {
    // Don't add to history if this is an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setHistory(prevHistory => {
      // Remove any history after current index (when user makes new changes after undo)
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });

    setCurrentIndex(prevIndex => {
      const newIndex = prevIndex + 1;
      return newIndex >= maxHistorySize ? maxHistorySize - 1 : newIndex;
    });
  }, [currentIndex, maxHistorySize]);

  // Undo to previous state
  const undo = useCallback(() => {
    if (canUndo) {
      isUndoRedoAction.current = true;
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [canUndo]);

  // Redo to next state
  const redo = useCallback(() => {
    if (canRedo) {
      isUndoRedoAction.current = true;
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [canRedo]);

  // Reset history
  const resetHistory = useCallback((newInitialState) => {
    setHistory([newInitialState]);
    setCurrentIndex(0);
  }, []);

  return {
    currentState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    historyLength: history.length,
    currentIndex
  };
};

export default useUndoRedo;
