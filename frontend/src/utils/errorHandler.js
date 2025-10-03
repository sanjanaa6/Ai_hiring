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

// Global error handler for unhandled promise rejections
const handleUnhandledRejection = (event) => {
  // Handle video play interruptions
  if (handleVideoPlayInterruption(event)) {
    return;
  }
  
  // Handle other unhandled promise rejections
  console.error('Unhandled promise rejection:', event.reason);
};

// Add global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

export { handleVideoPlayInterruption, handleUnhandledRejection };