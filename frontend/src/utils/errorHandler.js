// Global error handler for video play interruptions
const handleVideoPlayInterruption = (event) => {
  if (event.reason && 
      event.reason.name === 'AbortError' && 
      event.reason.message && 
      event.reason.message.includes('play() request was interrupted')) {
    console.log('🔄 Caught and handled video play interruption globally');
    event.preventDefault(); // Prevent the error from being logged
    return true;
  }
  return false;
};

// Silence noisy ResizeObserver loop errors coming from 3rd-party editors/layouts
const handleResizeObserverLoop = (event) => {
  const msg = event?.message || event?.reason?.message || String(event?.reason || '');
  if (msg && msg.includes('ResizeObserver loop completed with undelivered notifications')) {
    // Prevent React error overlay from breaking the UI
    event.preventDefault && event.preventDefault();
    event.stopImmediatePropagation && event.stopImmediatePropagation();
    // Optional: log once for diagnostics
    if (!window.__ignoredResizeObserverOnce) {
      console.warn('Ignored ResizeObserver loop error');
      window.__ignoredResizeObserverOnce = true;
    }
    return true;
  }
  return false;
};

// Global error handler for unhandled promise rejections
const handleUnhandledRejection = (event) => {
  // Handle video play interruptions
  if (handleVideoPlayInterruption(event)) {
    return;
  }
  // Handle ResizeObserver loop noise
  if (handleResizeObserverLoop(event)) {
    return;
  }
  
  // Handle other unhandled promise rejections
  console.error('Unhandled promise rejection:', event.reason);
};

// Add global error handler
if (typeof window !== 'undefined') {
  // Catch normal errors (capture phase) to preempt React overlay
  window.addEventListener('error', (e) => {
    if (handleResizeObserverLoop(e)) return;
  }, true);

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

  // Filter console.error spam for ResizeObserver messages only
  const originalConsoleError = console.error;
  console.error = function filteredConsoleError(...args) {
    try {
      const joined = args.map(a => (a && a.message) ? a.message : String(a)).join(' ');
      if (joined && joined.includes('ResizeObserver loop')) {
        // swallow noisy ResizeObserver errors
        return;
      }
    } catch (_) {
      // fall through
    }
    return originalConsoleError.apply(console, args);
  };

  // As a last resort, guard ResizeObserver callback exceptions
  try {
    const RO = window.ResizeObserver;
    if (RO && !window.__patchedRO) {
      window.ResizeObserver = class PatchedRO extends RO {
        constructor(cb) {
          const safeCb = (...args) => {
            try { cb(...args); } catch (err) {
              // ignore ResizeObserver internal loop errors
              if (!String(err || '').includes('ResizeObserver')) throw err;
            }
          };
          super(safeCb);
        }
      };
      window.__patchedRO = true;
    }
  } catch (_) {
    // ignore
  }
}

export { handleVideoPlayInterruption, handleUnhandledRejection };