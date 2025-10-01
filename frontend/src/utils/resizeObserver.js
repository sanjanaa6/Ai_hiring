// ResizeObserver utility to handle resize events properly
// This helps prevent the "ResizeObserver loop completed with undelivered notifications" warning

import React, { useState, useEffect } from 'react';

class ResizeObserverManager {
  constructor() {
    this.observers = new Map();
    this.debounceTime = 16; // ~60fps
    this.timeouts = new Map();
  }

  // Create a debounced resize observer
  createObserver(callback, element, options = {}) {
    const key = this.getElementKey(element);
    
    // Clean up existing observer for this element
    this.disconnectObserver(key);

    const debouncedCallback = this.debounce((entries) => {
      try {
        callback(entries);
      } catch (error) {
        // Suppress ResizeObserver errors
        if (error.message && error.message.includes('ResizeObserver')) {
          console.warn('ResizeObserver warning suppressed:', error.message);
          return;
        }
        throw error;
      }
    }, this.debounceTime);

    const observer = new ResizeObserver(debouncedCallback);
    observer.observe(element, options);
    
    this.observers.set(key, observer);
    return observer;
  }

  // Disconnect observer for specific element
  disconnectObserver(element) {
    const key = typeof element === 'string' ? element : this.getElementKey(element);
    
    if (this.observers.has(key)) {
      this.observers.get(key).disconnect();
      this.observers.delete(key);
    }

    // Clear any pending timeouts
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  // Disconnect all observers
  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  // Get unique key for element
  getElementKey(element) {
    if (typeof element === 'string') return element;
    return element.id || element.className || `element-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Debounce function
  debounce(func, wait) {
    return (...args) => {
      const key = this.getElementKey(args[0]?.target || 'default');
      
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key));
      }

      const timeout = setTimeout(() => {
        func.apply(this, args);
        this.timeouts.delete(key);
      }, wait);

      this.timeouts.set(key, timeout);
    };
  }
}

// Global instance
const resizeObserverManager = new ResizeObserverManager();

// Suppress ResizeObserver errors globally
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('ResizeObserver loop completed with undelivered notifications')) {
    // Suppress this specific error
    return;
  }
  originalConsoleError.apply(console, args);
};

// React hook for ResizeObserver
export const useResizeObserver = (callback, element, options = {}) => {
  const [observer, setObserver] = useState(null);

  useEffect(() => {
    if (!element) return;

    const obs = resizeObserverManager.createObserver(callback, element, options);
    setObserver(obs);

    return () => {
      resizeObserverManager.disconnectObserver(element);
    };
  }, [element, callback, options]);

  return observer;
};

// Utility function to safely observe element resize
export const observeElementResize = (element, callback, options = {}) => {
  if (!element) return null;
  return resizeObserverManager.createObserver(callback, element, options);
};

// Utility function to stop observing element resize
export const unobserveElementResize = (element) => {
  if (!element) return;
  resizeObserverManager.disconnectObserver(element);
};

// Cleanup function for component unmount
export const cleanupResizeObservers = () => {
  resizeObserverManager.disconnectAll();
};

export default resizeObserverManager;
