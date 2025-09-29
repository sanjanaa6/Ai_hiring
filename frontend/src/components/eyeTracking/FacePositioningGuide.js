import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Camera, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const FacePositioningGuide = ({ 
  onPositioningComplete, 
  onPositioningFailed,
  isVisible = true,
  className = ""
}) => {
  const [positioningStep, setPositioningStep] = useState('instructions'); // instructions, positioning, complete
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInCircle, setFaceInCircle] = useState(false);
  const [shouldersVisible, setShouldersVisible] = useState(false);
  const [positioningScore, setPositioningScore] = useState(0);
  const [instructions, setInstructions] = useState([
    "Position your laptop so your shoulders are visible",
    "Center your face in the white circle",
    "Ensure good lighting on your face",
    "Keep your hands visible if needed for coding"
  ]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const instructionTimeoutRef = useRef(null);

  // Initialize camera for positioning
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      videoRef.current.onloadedmetadata = () => {
        startFaceDetection();
      };
      
    } catch (err) {
      console.error('Camera access error:', err);
      onPositioningFailed && onPositioningFailed('Camera access denied');
    }
  }, [onPositioningFailed]);

  // Start face detection for positioning
  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    detectionIntervalRef.current = setInterval(() => {
      detectFacePosition(video, canvas, ctx);
    }, 200); // Check every 200ms
  }, []);

  // Detect face position and check if it's properly positioned
  const detectFacePosition = useCallback((video, canvas, ctx) => {
    if (!video.videoWidth || !video.videoHeight) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Detect face using skin tone detection
    let facePixels = 0;
    let totalPixels = 0;
    let faceBounds = { minX: canvas.width, maxX: 0, minY: canvas.height, maxY: 0 };
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // Enhanced skin tone detection
        if (r > 95 && g > 40 && b > 20 && 
            r > g && r > b && 
            Math.abs(r - g) > 15 &&
            r < 255 && g < 255 && b < 255) {
          facePixels++;
          faceBounds.minX = Math.min(faceBounds.minX, x);
          faceBounds.maxX = Math.max(faceBounds.maxX, x);
          faceBounds.minY = Math.min(faceBounds.minY, y);
          faceBounds.maxY = Math.max(faceBounds.maxY, y);
        }
        totalPixels++;
      }
    }
    
    const faceRatio = facePixels / totalPixels;
    const faceDetected = faceRatio > 0.05; // Adjust threshold
    setFaceDetected(faceDetected);
    
    if (faceDetected) {
      // Check if face is in the center circle
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const circleRadius = Math.min(canvas.width, canvas.height) * 0.15;
      
      const faceCenterX = (faceBounds.minX + faceBounds.maxX) / 2;
      const faceCenterY = (faceBounds.minY + faceBounds.maxY) / 2;
      const faceSize = Math.max(faceBounds.maxX - faceBounds.minX, faceBounds.maxY - faceBounds.minY);
      
      const distanceFromCenter = Math.sqrt(
        Math.pow(faceCenterX - centerX, 2) + Math.pow(faceCenterY - centerY, 2)
      );
      
      const inCircle = distanceFromCenter < circleRadius * 0.7 && 
                      faceSize > circleRadius * 0.8 && 
                      faceSize < circleRadius * 1.5;
      setFaceInCircle(inCircle);
      
      // Check if shoulders are visible (look for skin tone in lower part of image)
      let shoulderPixels = 0;
      const shoulderRegionHeight = Math.floor(canvas.height * 0.3);
      const shoulderStartY = canvas.height - shoulderRegionHeight;
      
      for (let y = shoulderStartY; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          
          if (r > 95 && g > 40 && b > 20 && 
              r > g && r > b && 
              Math.abs(r - g) > 15) {
            shoulderPixels++;
          }
        }
      }
      
      const shoulderRatio = shoulderPixels / (shoulderRegionHeight * canvas.width);
      setShouldersVisible(shoulderRatio > 0.02);
      
      // Calculate positioning score
      let score = 0;
      if (faceDetected) score += 25;
      if (inCircle) score += 50;
      if (shoulderRatio > 0.02) score += 25;
      setPositioningScore(score);
      
      // Auto-advance if positioning is good
      if (score >= 75 && positioningStep === 'positioning') {
        setPositioningStep('complete');
        setTimeout(() => {
          onPositioningComplete && onPositioningComplete({
            score,
            faceDetected,
            faceInCircle,
            shouldersVisible
          });
        }, 1000);
      }
    }
  }, [positioningStep, onPositioningComplete]);

  // Start positioning process
  const startPositioning = useCallback(() => {
    setPositioningStep('positioning');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Reset positioning
  const resetPositioning = useCallback(() => {
    setPositioningStep('instructions');
    setCurrentInstructionIndex(0);
    setPositioningScore(0);
    setFaceDetected(false);
    setFaceInCircle(false);
    setShouldersVisible(false);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (instructionTimeoutRef.current) {
      clearTimeout(instructionTimeoutRef.current);
      instructionTimeoutRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    if (isVisible) {
      initializeCamera();
    }
    
    return cleanup;
  }, [isVisible, initializeCamera, cleanup]);

  // Auto-advance instructions
  useEffect(() => {
    if (positioningStep === 'instructions' && currentInstructionIndex < instructions.length - 1) {
      instructionTimeoutRef.current = setTimeout(() => {
        setCurrentInstructionIndex(prev => prev + 1);
      }, 3000);
    }
    
    return () => {
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
    };
  }, [positioningStep, currentInstructionIndex, instructions.length]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`face-positioning-guide fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 ${className}`}>
      <div className="relative w-full h-full max-w-4xl max-h-3xl">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover rounded-lg"
        />
        
        {/* Hidden canvas for processing */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        
        {/* Positioning overlay */}
        {positioningStep === 'positioning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* White circle guide */}
            <div 
              className="border-4 border-white rounded-full opacity-80"
              style={{
                width: Math.min(window.innerWidth, window.innerHeight) * 0.3,
                height: Math.min(window.innerWidth, window.innerHeight) * 0.3,
                borderWidth: '4px'
              }}
            />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white rounded-full opacity-60" />
            </div>
          </div>
        )}
        
        {/* Instructions overlay */}
        {positioningStep === 'instructions' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white bg-opacity-95 rounded-lg p-8 max-w-md text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-4">Camera Setup</h3>
              
              <div className="space-y-3 mb-6">
                {instructions.map((instruction, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-2 text-left ${
                      index <= currentInstructionIndex ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      index < currentInstructionIndex ? 'bg-green-500' : 
                      index === currentInstructionIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm">{instruction}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={startPositioning}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Positioning
              </button>
            </div>
          </div>
        )}
        
        {/* Positioning feedback */}
        {positioningStep === 'positioning' && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Positioning Status</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                {faceDetected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Face Detected</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {faceInCircle ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Face in Circle</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {shouldersVisible ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Shoulders Visible</span>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Positioning Score</span>
                  <span>{positioningScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      positioningScore >= 75 ? 'bg-green-500' : 
                      positioningScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${positioningScore}%` }}
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={resetPositioning}
              className="mt-3 flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}
        
        {/* Countdown */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-white bg-black bg-opacity-50 rounded-full w-20 h-20 flex items-center justify-center">
              {countdown}
            </div>
          </div>
        )}
        
        {/* Completion overlay */}
        {positioningStep === 'complete' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-green-500 text-white rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Perfect!</h3>
              <p className="text-lg">Your camera is positioned correctly</p>
              <p className="text-sm opacity-80 mt-2">Starting interview...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacePositioningGuide;
