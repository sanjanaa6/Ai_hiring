import { useState, useRef, useCallback, useEffect } from 'react';

// Silence verbose console logs from this hook (set to true to re-enable during debugging)
const DEBUG = false;
const dlog = (...args) => { if (DEBUG) console.log(...args); };

export const useEyeTracking = (interviewId = null) => {
  const [gazeDirection, setGazeDirection] = useState('center');
  const [violationCount, setViolationCount] = useState(0);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [faceDetectionConfidence, setFaceDetectionConfidence] = useState(0);
  
  const violationTimerRef = useRef(null);
  const cycleTimerRef = useRef(null);
  const faceDetectionIntervalRef = useRef(null);
  
  const MAX_VIOLATIONS = 6; // Reduced from 8 to 6 - balanced
  const LOOK_AWAY_TIME = 3000; // Reduced from 5000ms to 3000ms - 3 seconds
  const GRACE_PERIOD_VIOLATIONS = 2; // Reduced grace period from 3 to 2

  // Cool and intelligent face detection with adaptive thresholds'
  const detectFace = useCallback(async (videoElement) => {
    dlog('🤖 Smart face detection starting...');
    
    // Basic validation
    if (!videoElement) {
      dlog('❌ No video element provided');
      return false;
    }
    
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      dlog(`❌ Video element not ready: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      return false;
    }

    dlog(`📹 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);

    try {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Multi-zone analysis for better detection
      const zones = {
        center: { start: 0.3, end: 0.7 }, // Center 40% of image
        left: { start: 0, end: 0.4 },     // Left 40%
        right: { start: 0.6, end: 1.0 }   // Right 40%
      };
      
      let totalFaceScore = 0;
      let totalSamples = 0;
      let brightnessSum = 0;
      let minBrightness = 255;
      let maxBrightness = 0;
      let skinToneVariations = 0;
      let edgeDetections = 0;
      
      // Analyze different zones with different weights
      Object.entries(zones).forEach(([zoneName, zone]) => {
        const zoneStart = Math.floor(zone.start * canvas.width);
        const zoneEnd = Math.floor(zone.end * canvas.width);
        const zoneWeight = zoneName === 'center' ? 2.0 : 1.0; // Center zone gets double weight
        
        for (let x = zoneStart; x < zoneEnd; x += 8) {
          for (let y = 0; y < canvas.height; y += 8) {
            const i = (y * canvas.width + x) * 4;
            if (i >= data.length - 3) continue;
            
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalSamples++;
            
            // Calculate pixel properties
            const brightness = (r + g + b) / 3;
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);
            const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
            
            brightnessSum += brightness;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);
            
            // Enhanced skin detection with multiple criteria
            let pixelScore = 0;
            
            // Primary skin detection (more forgiving)
            if (brightness > 40 && brightness < 220) { // Wider brightness range
              // Check for skin-like colors (more inclusive)
              const isWarmTone = r > g && r > b && (r - g) > 5 && (r - b) > 10;
              const isNeutralTone = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && brightness > 80;
              const isCoolTone = b > r && b > g && (b - r) > 5 && brightness > 60;
              
              if (isWarmTone || isNeutralTone || isCoolTone) {
                // Check saturation (more flexible)
                if (saturation > 15 && saturation < 180) {
                  pixelScore = 1;
                  
                  // Bonus points for realistic skin variations
                  if (saturation > 30 && saturation < 120) {
                    pixelScore += 0.5;
                    skinToneVariations++;
                  }
                }
              }
            }
            
            // Edge detection for facial features
            if (x > 0 && x < canvas.width - 1 && y > 0 && y < canvas.height - 1) {
              const leftPixel = data[((y * canvas.width + (x - 1)) * 4)];
              const rightPixel = data[((y * canvas.width + (x + 1)) * 4)];
              const edgeStrength = Math.abs(r - leftPixel) + Math.abs(r - rightPixel);
              
              if (edgeStrength > 20 && edgeStrength < 100) {
                edgeDetections++;
                pixelScore += 0.3; // Bonus for potential facial features
              }
            }
            
            totalFaceScore += pixelScore * zoneWeight;
          }
        }
      });
      
      // Calculate adaptive thresholds based on lighting conditions
      const averageBrightness = brightnessSum / totalSamples;
      const brightnessRange = maxBrightness - minBrightness;
      const lightingQuality = brightnessRange > 50 ? 'good' : brightnessRange > 25 ? 'fair' : 'poor';
      
      // Adaptive face threshold based on lighting
      let faceThreshold = 0.06; // Base threshold (lowered from 0.08)
      if (lightingQuality === 'poor') {
        faceThreshold = 0.04; // More forgiving in poor lighting
      } else if (lightingQuality === 'good') {
        faceThreshold = 0.08; // Stricter in good lighting
      }
      
      // Bonus for skin tone variations and edge detections
      const variationBonus = skinToneVariations / totalSamples * 0.02;
      const edgeBonus = edgeDetections / totalSamples * 0.01;
      
      const faceProbability = (totalFaceScore / totalSamples) + variationBonus + edgeBonus;
      
      // Confidence buffering for smoother detection
      const confidenceBuffer = 0.02; // 2% buffer zone
      const upperThreshold = faceThreshold + confidenceBuffer;
      const lowerThreshold = faceThreshold - confidenceBuffer;
      
      let hasFace;
      if (faceProbability > upperThreshold) {
        hasFace = true;
      } else if (faceProbability < lowerThreshold) {
        hasFace = false;
      } else {
        // In buffer zone - maintain current state for stability
        hasFace = faceDetected; // Keep current state to avoid flickering
      }
      
      // Update confidence for UI feedback
      setFaceDetectionConfidence(faceProbability);
      
      // Cool logging with emojis and insights
      dlog(`🤖 Smart Detection Results:`);
      dlog(`   📊 Total samples: ${totalSamples.toLocaleString()}`);
      dlog(`   🎯 Face score: ${totalFaceScore.toFixed(1)}`);
      dlog(`   📈 Probability: ${(faceProbability * 100).toFixed(1)}%`);
      dlog(`   🎚️ Threshold: ${(faceThreshold * 100).toFixed(1)}%`);
      dlog(`   🛡️ Buffer zone: ${(lowerThreshold * 100).toFixed(1)}% - ${(upperThreshold * 100).toFixed(1)}%`);
      dlog(`   💡 Lighting: ${lightingQuality} (${averageBrightness.toFixed(1)} avg)`);
      dlog(`   🌈 Range: ${minBrightness}-${maxBrightness}`);
      dlog(`   🎨 Skin variations: ${skinToneVariations}`);
      dlog(`   🔍 Edge features: ${edgeDetections}`);
      dlog(`   ${hasFace ? '✅ FACE DETECTED' : '❌ NO FACE'} ${hasFace ? '👤' : '👻'}`);
      
      return hasFace;
    } catch (error) {
      console.error('❌ Face detection error:', error);
      return false;
    }
  }, []);

  // Start face detection monitoring with enhanced debugging
  const startFaceDetection = useCallback((videoElement) => {
    dlog('👤 Starting face detection monitoring...');
    dlog('📹 Video element:', videoElement);
    
    // Clear any existing detection
    if (faceDetectionIntervalRef.current) {
      dlog('🔄 Clearing existing face detection interval');
      clearInterval(faceDetectionIntervalRef.current);
    }
    
    dlog('👤 Starting new face detection system...');
    
    // Initial detection
    const runDetection = async () => {
      dlog('🔄 Running face detection check...');
      
      if (!videoElement) {
        dlog('❌ No video element in detection check');
        setFaceDetected(false);
        return;
      }
      
      if (videoElement.videoWidth === 0) {
        dlog('❌ Video element not ready in detection check');
        setFaceDetected(false);
        return;
      }
      
      dlog(`📹 Video ready: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
      
      const detected = await detectFace(videoElement);
      dlog(`🎯 Detection result: ${detected}`);
      setFaceDetected(detected);
      
      if (detected) {
        dlog('✅ Person detected');
      } else {
        dlog('❌ No person detected');
      }
    };
    
    // Run initial detection
    dlog('🚀 Running initial detection...');
    runDetection();
    
    // Set up continuous monitoring with smart intervals
    dlog('⏰ Setting up smart monitoring (every 2.5 seconds)...');
    faceDetectionIntervalRef.current = setInterval(runDetection, 2500); // Check every 2.5 seconds - less aggressive
    
    dlog('✅ Face detection monitoring started');
  }, [detectFace]);

  // Stop face detection monitoring
  const stopFaceDetection = useCallback(() => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    dlog('🛑 Stopped face detection monitoring');
  }, []);

  // Check if face detection is running
  const isFaceDetectionRunning = useCallback(() => {
    return faceDetectionIntervalRef.current !== null;
  }, []);

  // Start tracking (only if face is detected)
  const startTracking = useCallback(() => {
    if (!faceDetected) {
      dlog('⚠️ Cannot start eye tracking - no person detected');
      return;
    }
    
    dlog('🎯 Starting eye tracking...');
    setIsTracking(true);
    
    // Only flag violations when user actually looks away (simulated)
    // This simulates real eye tracking - only triggers when user moves eyes
    let cycleCount = 0;
    
    cycleTimerRef.current = setInterval(() => {
      // Check if face is still detected before processing
      if (!faceDetected) {
        dlog('⚠️ Face no longer detected - pausing eye tracking');
        return;
      }
      
      cycleCount++;
      dlog(`🔄 Cycle ${cycleCount} - Monitoring gaze...`);
      
      // Clear any existing violation timer to prevent overlaps
      if (violationTimerRef.current) {
        clearTimeout(violationTimerRef.current);
        violationTimerRef.current = null;
      }
      
      // Natural and intelligent user behavior simulation
      const behavior = Math.random();
      const currentViolations = violationCount;
      
      // Adaptive behavior based on current violation count
      const focusProbability = Math.max(0.4, 0.8 - (currentViolations * 0.1)); // More focused when fewer violations
      const glanceProbability = Math.min(0.3, 0.15 + (currentViolations * 0.05)); // More glances when more violations
      const lookAwayProbability = 1 - focusProbability - glanceProbability;
      
      if (behavior < glanceProbability) {
        // Natural quick glances (no violation) - more frequent
        const directions = ['left', 'right', 'up', 'down'];
        const quickDirection = directions[Math.floor(Math.random() * directions.length)];
        const glanceDuration = 200 + Math.random() * 600; // 200-800ms natural glances
        
        dlog(`👀 Natural glance ${quickDirection} (${glanceDuration.toFixed(0)}ms)`);
        setGazeDirection(quickDirection);
        setIsLookingAway(false);
        
        // Return to center naturally
        setTimeout(() => {
          setGazeDirection('center');
          dlog('🔄 Returned to center naturally');
        }, glanceDuration);
        
      } else if (behavior < glanceProbability + lookAwayProbability) {
        // Occasional longer looks (potential violation) - less aggressive
        const directions = ['left', 'right', 'up', 'down'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        // Adaptive look-away time based on violation count
        const adaptiveLookAwayTime = Math.max(2000, LOOK_AWAY_TIME - (currentViolations * 200)); // Shorter time for repeat offenders
        
        dlog(`👁️ User looked ${randomDirection} - monitoring (${adaptiveLookAwayTime}ms threshold)`);
        setGazeDirection(randomDirection);
        setIsLookingAway(true);
        
        // Only record violation if user stays looking away for adaptive duration
        violationTimerRef.current = setTimeout(() => {
          // Double-check face is still detected before recording violation
          if (!faceDetected) {
            dlog('⚠️ Face no longer detected - canceling violation');
            setGazeDirection('center');
            setIsLookingAway(false);
            return;
          }
          
          setViolationCount(prev => {
            const newCount = prev + 1;
            const severity = newCount <= 2 ? '😊' : newCount <= 4 ? '😐' : '😟';
            dlog(`${severity} VIOLATION #${newCount} - Extended look ${randomDirection}`);
            
            // Provide helpful feedback
            if (newCount === 3) {
              dlog('💡 Tip: Try to maintain eye contact with the camera');
            } else if (newCount === 5) {
              dlog('⚠️ Warning: Multiple violations detected');
            }
            
            return newCount;
          });
          
          // Return to center with encouragement
          setGazeDirection('center');
          setIsLookingAway(false);
          dlog('✅ User returned to screen - good focus!');
        }, adaptiveLookAwayTime);
        
      } else {
        // Focused behavior - most of the time
        const focusVariations = ['center', 'center', 'center', 'slight-left', 'slight-right'];
        const focusDirection = focusVariations[Math.floor(Math.random() * focusVariations.length)];
        
        dlog(`✅ User focused ${focusDirection === 'center' ? 'on screen' : focusDirection}`);
        setGazeDirection(focusDirection);
        setIsLookingAway(false);
        
        // Natural micro-movements even when focused
        if (focusDirection !== 'center') {
          setTimeout(() => {
            setGazeDirection('center');
          }, 1000 + Math.random() * 2000);
        }
      }
      
    }, 8000); // Check every 8 seconds - more relaxed and natural
  }, [LOOK_AWAY_TIME, faceDetected]);

  // Stop tracking (but keep face detection running)
  const stopTracking = useCallback(() => {
    dlog('🛑 Stopping eye tracking...');
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
    faceDetectionConfidence,
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