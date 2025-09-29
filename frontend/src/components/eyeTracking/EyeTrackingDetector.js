import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

const EyeTrackingDetector = ({ 
  onLookAway, 
  onLookBack, 
  isEnabled = true, 
  sensitivity = 0.5, // More sensitive
  warningThreshold = 1, // seconds - AGGRESSIVE
  flagThreshold = 3, // seconds - AGGRESSIVE
  className = ""
}) => {
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [lookAwayStartTime, setLookAwayStartTime] = useState(null);
  const [totalLookAwayTime, setTotalLookAwayTime] = useState(0);
  
  // Enhanced monitoring: Track total look away time for analytics
  const updateTotalLookAwayTime = useCallback((duration) => {
    setTotalLookAwayTime(prev => prev + duration);
  }, []);
  const [warningCount, setWarningCount] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Detect eye movement and suspicious behaviors using enhanced computer vision
  const detectEyeMovementEnhanced = useCallback((video, canvas, ctx) => {
    if (!video.videoWidth || !video.videoHeight) return;
    
    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Enhanced detection for multiple violations
    let faceDetected = false;
    let eyeRegionDetected = false;
    let mobilePhoneDetected = false;
    let earphonesDetected = false;
    let suspiciousHandMovement = false;
    
    // Count pixels that might be skin tone (simplified)
    let skinPixels = 0;
    let totalPixels = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // Simple skin tone detection
      if (r > 95 && g > 40 && b > 20 && 
          r > g && r > b && 
          Math.abs(r - g) > 15) {
        skinPixels++;
      }
      
      // Detect dark objects (potential mobile phones, earphones)
      if (brightness < 50) {
        darkPixels++;
      }
      
      // Detect bright objects (phone screens, reflections)
      if (brightness > 200) {
        brightPixels++;
      }
      
      totalPixels++;
    }
    
    const skinRatio = skinPixels / totalPixels;
    const darkRatio = darkPixels / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    
    faceDetected = skinRatio > 0.1;
    
    // AGGRESSIVE: Detect mobile phone usage
    mobilePhoneDetected = darkRatio > 0.15 || brightRatio > 0.1;
    
    // AGGRESSIVE: Detect earphones/headphones (dark objects near ears)
    const earRegionLeft = Math.floor(canvas.width * 0.1);
    const earRegionRight = Math.floor(canvas.width * 0.9);
    const earRegionTop = Math.floor(canvas.height * 0.2);
    const earRegionBottom = Math.floor(canvas.height * 0.4);
    
    let earRegionDarkPixels = 0;
    let earRegionPixels = 0;
    
    for (let y = earRegionTop; y < earRegionBottom; y++) {
      for (let x = 0; x < earRegionLeft; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < 60) {
          earRegionDarkPixels++;
        }
        earRegionPixels++;
      }
      
      for (let x = earRegionRight; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < 60) {
          earRegionDarkPixels++;
        }
        earRegionPixels++;
      }
    }
    
    const earRegionDarkRatio = earRegionDarkPixels / earRegionPixels;
    earphonesDetected = earRegionDarkRatio > 0.3;
    
    // Check for eye region (simplified - look for darker regions in upper face area)
    if (faceDetected) {
      const eyeRegionHeight = Math.floor(canvas.height * 0.3);
      let eyeDarkPixels = 0;
      let eyeRegionPixels = 0;
      
      for (let y = 0; y < eyeRegionHeight; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          
          const brightness = (r + g + b) / 3;
          if (brightness < 80) { // Dark pixels (potential eyes)
            eyeDarkPixels++;
          }
          eyeRegionPixels++;
        }
      }
      
      const eyeDarkRatio = eyeDarkPixels / eyeRegionPixels;
      eyeRegionDetected = eyeDarkRatio > 0.05;
    }
    
    // AGGRESSIVE: Detect suspicious hand movements (rapid changes in hand region)
    const handRegionTop = Math.floor(canvas.height * 0.6);
    let handRegionChanges = 0;
    let handRegionPixels = 0;
    
    for (let y = handRegionTop; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Detect skin tone in hand region
        if (r > 95 && g > 40 && b > 20 && 
            r > g && r > b && 
            Math.abs(r - g) > 15) {
          handRegionChanges++;
        }
        handRegionPixels++;
      }
    }
    
    const handRegionRatio = handRegionChanges / handRegionPixels;
    suspiciousHandMovement = handRegionRatio > 0.2;
    
    // AGGRESSIVE: Multiple violation detection
    const violations = [];
    if (!faceDetected) violations.push('face_not_visible');
    if (!eyeRegionDetected && faceDetected) violations.push('looking_away');
    if (mobilePhoneDetected) violations.push('mobile_phone_detected');
    if (earphonesDetected) violations.push('earphones_detected');
    if (suspiciousHandMovement) violations.push('suspicious_hand_movement');
    
    // AGGRESSIVE: Flag for ANY violation
    const isCurrentlyLookingAway = violations.length > 0;
    
    if (isCurrentlyLookingAway !== isLookingAway) {
      setIsLookingAway(isCurrentlyLookingAway);
      
      if (isCurrentlyLookingAway) {
        // User started suspicious behavior
        setLookAwayStartTime(Date.now());
        onLookAway && onLookAway({ 
          violations: violations,
          mobilePhoneDetected,
          earphonesDetected,
          suspiciousHandMovement
        });
      } else {
        // User stopped suspicious behavior
        if (lookAwayStartTime) {
          const violationDuration = (Date.now() - lookAwayStartTime) / 1000;
          updateTotalLookAwayTime(violationDuration);
          
          // AGGRESSIVE: Any violation duration triggers warning
          if (violationDuration > 0.5) { // Even 0.5 seconds
            setWarningCount(prev => prev + 1);
          }
        }
        setLookAwayStartTime(null);
        onLookBack && onLookBack();
      }
    }
    
    // AGGRESSIVE: Check for immediate flagging
    if (isCurrentlyLookingAway && lookAwayStartTime) {
      const currentViolationDuration = (Date.now() - lookAwayStartTime) / 1000;
      
      // ULTRA AGGRESSIVE: Flag immediately for mobile phone or earphones
      if ((mobilePhoneDetected || earphonesDetected) && currentViolationDuration > 0.3 && !isFlagged) {
        setIsFlagged(true);
        onLookAway && onLookAway({ 
          flagged: true, 
          duration: currentViolationDuration,
          violations: violations,
          mobilePhoneDetected,
          earphonesDetected,
          suspiciousHandMovement,
          immediateTermination: true
        });
      }
      // ULTRA AGGRESSIVE: Flag for any other violation after 0.5 seconds
      else if (currentViolationDuration > 0.5 && !isFlagged) {
        setIsFlagged(true);
        onLookAway && onLookAway({ 
          flagged: true, 
          duration: currentViolationDuration,
          violations: violations,
          mobilePhoneDetected,
          earphonesDetected,
          suspiciousHandMovement,
          immediateTermination: true
        });
      }
    }
  }, [isLookingAway, lookAwayStartTime, isFlagged, onLookAway, onLookBack, updateTotalLookAwayTime]);

  // Start eye tracking detection
  const startEyeTracking = useCallback(() => {
    if (!isEnabled || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Start detection loop
    detectionIntervalRef.current = setInterval(() => {
      detectEyeMovementEnhanced(video, canvas, ctx);
    }, 100); // Check every 100ms
  }, [isEnabled, detectEyeMovementEnhanced]);

  // Initialize camera and start detection
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setIsDetecting(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Start detection after video is loaded
      videoRef.current.onloadedmetadata = () => {
        startEyeTracking();
      };
      
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied or not available');
      setIsDetecting(false);
    }
  }, [startEyeTracking]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsDetecting(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (isEnabled) {
      initializeCamera();
    }
    
    return cleanup;
  }, [isEnabled, initializeCamera, cleanup]);

  // Handle component unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={`eye-tracking-detector ${className}`}>
      {/* Hidden video element for processing */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }}
      />
      
      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Status indicator */}
      <div className="flex items-center space-x-2">
        {error ? (
          <div className="flex items-center space-x-1 text-red-500">
            <EyeOff className="w-4 h-4" />
            <span className="text-sm">Camera Error</span>
          </div>
        ) : isDetecting ? (
          <div className="flex items-center space-x-1">
            {isLookingAway ? (
              <div className="flex items-center space-x-1 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">SUSPICIOUS BEHAVIOR</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-green-500">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Monitoring</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-gray-500">
            <EyeOff className="w-4 h-4" />
            <span className="text-sm">Inactive</span>
          </div>
        )}
      </div>
      
      {/* Warning/Flag indicators */}
      {warningCount > 0 && (
        <div className="mt-1 text-xs text-yellow-600">
          Warnings: {warningCount}
        </div>
      )}
      
      {isFlagged && (
        <div className="mt-1 text-xs text-red-600 font-semibold">
          FLAGGED: Excessive looking away
        </div>
      )}
      
      {/* Total Look Away Time Display */}
      {totalLookAwayTime > 0 && (
        <div className="mt-1 text-xs text-blue-600">
          Total Look Away: {totalLookAwayTime.toFixed(1)}s
        </div>
      )}
      
      {error && (
        <div className="mt-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default EyeTrackingDetector;
