// Global error handler to suppress common React warnings
// This helps clean up the console and improve user experience

class ErrorHandler {
  constructor() {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.setupErrorSuppression();
  }

  setupErrorSuppression() {
    // Suppress ResizeObserver warnings
    console.error = (...args) => {
      const message = args[0];
      
      // Suppress ResizeObserver loop warnings
      if (typeof message === 'string' && 
          message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return; // Suppress this specific error
      }
      
      // Suppress other common React warnings that are not critical
      if (typeof message === 'string' && 
          (message.includes('Warning: ReactDOM.render is no longer supported') ||
           message.includes('Warning: componentWillReceiveProps has been renamed') ||
           message.includes('Warning: componentWillMount has been renamed'))) {
        return; // Suppress deprecated React warnings
      }
      
      // Call original console.error for other errors
      this.originalConsoleError.apply(console, args);
    };

    // Suppress common warnings
    console.warn = (...args) => {
      const message = args[0];
      
      // Suppress common React warnings
      if (typeof message === 'string' && 
          (message.includes('componentWillReceiveProps') ||
           message.includes('componentWillMount') ||
           message.includes('componentWillUpdate'))) {
        return; // Suppress deprecated lifecycle warnings
      }
      
      // Call original console.warn for other warnings
      this.originalConsoleWarn.apply(console, args);
    };
  }

  // Restore original console methods
  restore() {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }

  // Handle unhandled promise rejections
  handleUnhandledRejection(event) {
    // Suppress ResizeObserver related promise rejections
    if (event.reason && 
        event.reason.message && 
        event.reason.message.includes('ResizeObserver')) {
      event.preventDefault();
      return;
    }
    
    // Log other unhandled rejections
    console.error('Unhandled promise rejection:', event.reason);
  }

  // Handle global errors
  handleGlobalError(event) {
    // Suppress ResizeObserver related errors
    if (event.error && 
        event.error.message && 
        event.error.message.includes('ResizeObserver')) {
      event.preventDefault();
      return;
    }
    
    // Log other global errors
    console.error('Global error:', event.error);
  }

  // Setup global error handlers
  setupGlobalHandlers() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    window.addEventListener('error', this.handleGlobalError.bind(this));
  }

  // Remove global error handlers
  removeGlobalHandlers() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    window.removeEventListener('error', this.handleGlobalError.bind(this));
  }
}

// Create global instance
const errorHandler = new ErrorHandler();

// Setup global handlers
errorHandler.setupGlobalHandlers();

export default errorHandler;
