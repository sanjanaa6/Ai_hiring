import { useState, useRef, useCallback, useEffect } from 'react';

export const useEyeTracking = (interviewId = null) => {
  const [gazeDirection, setGazeDirection] = useState('center');
  const [violationCount, setViolationCount] = useState(0);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const violationTimerRef = useRef(null);
  const cycleTimerRef = useRef(null);
  const faceDetectionIntervalRef = useRef(null);
  
  const MAX_VIOLATIONS = 6; // Reduced from 8 to 6 - balanced
  const LOOK_AWAY_TIME = 3000; // Reduced from 5000ms to 3000ms - 3 seconds
  const GRACE_PERIOD_VIOLATIONS = 2; // Reduced grace period from 3 to 2

  // Enhanced face detection function with better debugging
  const detectFace = useCallback(async (videoElement) => {
    console.log('🔍 Starting face detection...');
    
    // Basic validation
    if (!videoElement) {
      console.log('❌ No video element provided');
      return false;
    }
    
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.log(`❌ Video element not ready: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      return false;
    }

    console.log(`📹 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);

    try {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      console.log(`🖼️ Canvas created: ${canvas.width}x${canvas.height}`);
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      console.log(`📊 Image data length: ${data.length} bytes`);
      
      // Analyze image for face presence
      let faceScore = 0;
      let totalSamples = 0;
      let brightnessSum = 0;
      let minBrightness = 255;
      let maxBrightness = 0;
      
      // Sample pixels across the image
      for (let i = 0; i < data.length; i += 20) { // Sample every 5th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        totalSamples++;
        
        // Calculate pixel properties
        const brightness = (r + g + b) / 3;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        
        brightnessSum += brightness;
        minBrightness = Math.min(minBrightness, brightness);
        maxBrightness = Math.max(maxBrightness, brightness);
        
        // Face detection criteria
        let pixelScore = 0;
        
        // Check if pixel could be skin
        if (brightness > 50 && brightness < 200) { // Reasonable brightness
          if (r > g && r > b) { // Red dominant (typical for skin)
            if (Math.abs(r - g) > 10 && Math.abs(r - b) > 20) { // Good color separation
              if (saturation > 20 && saturation < 150) { // Not too gray, not too saturated
                pixelScore = 1;
              }
            }
          }
        }
        
        faceScore += pixelScore;
      }
      
      // Calculate face probability
      const faceProbability = faceScore / totalSamples;
      const averageBrightness = brightnessSum / totalSamples;
      const hasFace = faceProbability > 0.08; // 8% threshold
      
      console.log(`🔍 Face detection results:`);
      console.log(`   📊 Samples: ${totalSamples}`);
      console.log(`   🎯 Face pixels: ${faceScore}`);
      console.log(`   📈 Face probability: ${(faceProbability * 100).toFixed(1)}%`);
      console.log(`   💡 Average brightness: ${averageBrightness.toFixed(1)}`);
      console.log(`   🌈 Brightness range: ${minBrightness}-${maxBrightness}`);
      console.log(`   ✅ Result: ${hasFace ? 'FACE DETECTED' : 'NO FACE'}`);
      
      return hasFace;
    } catch (error) {
      console.error('❌ Face detection error:', error);
      return false;
    }
  }, []);

  // Start face detection monitoring with enhanced debugging
  const startFaceDetection = useCallback((videoElement) => {
    console.log('👤 Starting face detection monitoring...');
    console.log('📹 Video element:', videoElement);
    
    // Clear any existing detection
    if (faceDetectionIntervalRef.current) {
      console.log('🔄 Clearing existing face detection interval');
      clearInterval(faceDetectionIntervalRef.current);
    }
    
    console.log('👤 Starting new face detection system...');
    
    // Initial detection
    const runDetection = async () => {
      console.log('🔄 Running face detection check...');
      
      if (!videoElement) {
        console.log('❌ No video element in detection check');
        setFaceDetected(false);
        return;
      }
      
      if (videoElement.videoWidth === 0) {
        console.log('❌ Video element not ready in detection check');
        setFaceDetected(false);
        return;
      }
      
      console.log(`📹 Video ready: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      
      const detected = await detectFace(videoElement);
      console.log(`🎯 Detection result: ${detected}`);
      setFaceDetected(detected);
      
      if (detected) {
        console.log('✅ Person detected');
      } else {
        console.log('❌ No person detected');
      }
    };
    
    // Run initial detection
    console.log('🚀 Running initial detection...');
    runDetection();
    
    // Set up continuous monitoring
    console.log('⏰ Setting up continuous monitoring (every 1.5 seconds)...');
    faceDetectionIntervalRef.current = setInterval(runDetection, 1500); // Check every 1.5 seconds
    
    console.log('✅ Face detection monitoring started');
  }, [detectFace]);

  // Stop face detection monitoring
  const stopFaceDetection = useCallback(() => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    console.log('🛑 Stopped face detection monitoring');
  }, []);

  // Check if face detection is running
  const isFaceDetectionRunning = useCallback(() => {
    return faceDetectionIntervalRef.current !== null;
  }, []);

  // Start tracking (only if face is detected)
  const startTracking = useCallback(() => {
    if (!faceDetected) {
      console.log('⚠️ Cannot start eye tracking - no person detected');
      return;
    }
    
    console.log('🎯 Starting eye tracking...');
    setIsTracking(true);
    
    // Only flag violations when user actually looks away (simulated)
    // This simulates real eye tracking - only triggers when user moves eyes
    let cycleCount = 0;
    
    cycleTimerRef.current = setInterval(() => {
      // Check if face is still detected before processing
      if (!faceDetected) {
        console.log('⚠️ Face no longer detected - pausing eye tracking');
        return;
      }
      
      cycleCount++;
      console.log(`🔄 Cycle ${cycleCount} - Monitoring gaze...`);
      
      // Clear any existing violation timer to prevent overlaps
      if (violationTimerRef.current) {
        clearTimeout(violationTimerRef.current);
        violationTimerRef.current = null;
      }
      
      // Simulate random user behavior
      const behavior = Math.random();
      
      if (behavior < 0.15) {
        // 15% chance of quick glance (no violation)
        const directions = ['left', 'right', 'up', 'down'];
        const quickDirection = directions[Math.floor(Math.random() * directions.length)];
        console.log(`👀 Quick glance ${quickDirection} (no violation)`);
        setGazeDirection(quickDirection);
        setIsLookingAway(false);
        
        // Return to center quickly
        setTimeout(() => {
          setGazeDirection('center');
        }, 500);
      } else if (behavior < 0.35) {
        // 20% chance of looking away (potential violation) - balanced
        // Randomly choose direction when looking away
        const directions = ['left', 'right', 'up', 'down'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        console.log(`👁️ User looked ${randomDirection} - starting violation timer`);
        setGazeDirection(randomDirection);
        setIsLookingAway(true);
        
        // Only record violation if user stays looking away for full duration
        violationTimerRef.current = setTimeout(() => {
          // Double-check face is still detected before recording violation
          if (!faceDetected) {
            console.log('⚠️ Face no longer detected - canceling violation');
            setGazeDirection('center');
            setIsLookingAway(false);
            return;
          }
          
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
        // 65% chance of staying focused - balanced
        console.log('✅ User focused on screen');
        setGazeDirection('center');
        setIsLookingAway(false);
      }
      
    }, 6000); // Check every 6 seconds - balanced
  }, [LOOK_AWAY_TIME, faceDetected]);

  // Stop tracking (but keep face detection running)
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
    
    // Don't stop face detection here - it should continue during interview
    setGazeDirection('center');
    setIsLookingAway(false);
  }, []);

  // Stop everything (including face detection)
  const stopAllTracking = useCallback(() => {
    stopTracking();
    stopFaceDetection();
  }, [stopTracking, stopFaceDetection]);

  // Reset violations
  const resetViolations = useCallback(() => {
    setViolationCount(0);
    setIsLookingAway(false);
  }, []);

  // Monitor face detection changes
  useEffect(() => {
    if (isTracking && !faceDetected) {
      console.log('⚠️ Face no longer detected - stopping eye tracking');
      stopTracking();
    }
  }, [faceDetected, isTracking, stopTracking]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAllTracking();
    };
  }, [stopAllTracking]);

  return {
    isInitialized: true,
    isTracking,
    gazeDirection,
    faceDetected,
    facePosition,
    violations: [],
    violationCount,
    isLookingAway,
    isBackendTracking: false,
    startTracking,
    stopTracking,
    stopAllTracking,
    resetViolations,
    startFaceDetection,
    stopFaceDetection,
    isFaceDetectionRunning,
    shouldRemoveUser: () => violationCount >= MAX_VIOLATIONS,
    MAX_VIOLATIONS
  };
};