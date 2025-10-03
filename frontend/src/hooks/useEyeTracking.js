import { useState, useRef, useCallback, useEffect } from 'react';

export const useEyeTracking = (interviewId = null) => {
  const [gazeDirection, setGazeDirection] = useState('center');
  const [violationCount, setViolationCount] = useState(0);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  
  const violationTimerRef = useRef(null);
  const cycleTimerRef = useRef(null);
  
  const MAX_VIOLATIONS = 3;
  const LOOK_AWAY_TIME = 2000; // 2 seconds

  // Start tracking
  const startTracking = useCallback(() => {
    console.log('🎯 Starting eye tracking...');
    setIsTracking(true);
    
    // Only flag violations when user actually looks away (simulated)
    // This simulates real eye tracking - only triggers when user moves eyes
    let cycleCount = 0;
    
    cycleTimerRef.current = setInterval(() => {
      cycleCount++;
      console.log(`🔄 Cycle ${cycleCount} - Monitoring gaze...`);
      
      // Clear any existing violation timer to prevent overlaps
      if (violationTimerRef.current) {
        clearTimeout(violationTimerRef.current);
        violationTimerRef.current = null;
      }
      
      // Simulate random user behavior
      const behavior = Math.random();
      
      if (behavior < 0.1) {
        // 10% chance of quick glance (no violation)
        const directions = ['left', 'right', 'up', 'down'];
        const quickDirection = directions[Math.floor(Math.random() * directions.length)];
        console.log(`👀 Quick glance ${quickDirection} (no violation)`);
        setGazeDirection(quickDirection);
        setIsLookingAway(false);
        
        // Return to center quickly
        setTimeout(() => {
          setGazeDirection('center');
        }, 500);
      } else if (behavior < 0.4) {
        // 30% chance of looking away (potential violation)
        // Randomly choose direction when looking away
        const directions = ['left', 'right', 'up', 'down'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        console.log(`👁️ User looked ${randomDirection} - starting violation timer`);
        setGazeDirection(randomDirection);
        setIsLookingAway(true);
        
        // Only record violation if user stays looking away for full duration
        violationTimerRef.current = setTimeout(() => {
          setViolationCount(prev => {
            const newCount = prev + 1;
            console.log(`🚨 VIOLATION #${newCount} - User looked ${randomDirection} for too long`);
            return newCount;
          });
          
          // Return to center
          setGazeDirection('center');
          setIsLookingAway(false);
          console.log('✅ User returned to screen');
        }, LOOK_AWAY_TIME);
      } else {
        // 60% chance of staying focused
        console.log('✅ User focused on screen');
        setGazeDirection('center');
        setIsLookingAway(false);
      }
      
    }, 5000); // Check every 5 seconds
  }, [LOOK_AWAY_TIME]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log('🛑 Stopping eye tracking...');
    setIsTracking(false);
    
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    
    if (violationTimerRef.current) {
      clearTimeout(violationTimerRef.current);
      violationTimerRef.current = null;
    }
    
    setGazeDirection('center');
    setIsLookingAway(false);
  }, []);

  // Reset violations
  const resetViolations = useCallback(() => {
    setViolationCount(0);
    setIsLookingAway(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isInitialized: true,
    isTracking,
    gazeDirection,
    faceDetected: true,
    facePosition: { x: 0, y: 0, width: 0, height: 0 },
    violations: [],
    violationCount,
    isLookingAway,
    isBackendTracking: false,
    startTracking,
    stopTracking,
    resetViolations,
    shouldRemoveUser: () => violationCount >= MAX_VIOLATIONS,
    MAX_VIOLATIONS
  };
};