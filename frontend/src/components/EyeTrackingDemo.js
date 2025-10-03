import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useEyeTracking } from '../hooks/useEyeTracking';
import { useCamera } from '../hooks/useCamera';
import FacePositioningGuide from './FacePositioningGuide';
import GazeMonitoring from './GazeMonitoring';
import ViolationTracker from './ViolationTracker';

const EyeTrackingDemo = () => {
  const { isDarkMode } = useTheme();
  const [demoStep, setDemoStep] = useState('setup'); // setup, positioning, monitoring, complete
  const [showPositioningGuide, setShowPositioningGuide] = useState(false);
  
  // Initialize hooks
  const camera = useCamera();
  const eyeTracking = useEyeTracking('demo-interview-id');

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        await camera.initializeCamera();
        console.log('✅ Demo camera initialized');
      } catch (error) {
        console.error('❌ Demo camera failed:', error);
      }
    };

    initCamera();
  }, []);

  // Start eye tracking when camera is ready
  useEffect(() => {
    if (camera.cameraStatus === 'playing' && eyeTracking.isInitialized && !eyeTracking.isTracking) {
      eyeTracking.startTracking(camera.videoRef.current);
    }
  }, [camera.cameraStatus, eyeTracking.isInitialized, eyeTracking.isTracking]);

  const handleStartDemo = () => {
    setShowPositioningGuide(true);
    setDemoStep('positioning');
  };

  const handlePositioningComplete = () => {
    setShowPositioningGuide(false);
    setDemoStep('monitoring');
  };

  const handleRemoveUser = () => {
    console.log('🚨 Demo user removed due to violations');
    setDemoStep('complete');
  };

  const handleViolationThreshold = (count, max) => {
    console.log(`⚠️ Demo violation threshold: ${count}/${max}`);
  };

  const resetDemo = () => {
    eyeTracking.resetViolations();
    setDemoStep('setup');
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      
      {/* Header */}
      <div className={`p-6 text-center border-b ${
        isDarkMode ? 'border-white/10' : 'border-gray-200'
      }`}>
        <h1 className={`text-3xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Eye Tracking Demo
        </h1>
        <p className={`text-lg ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Demonstration of the eye tracking and violation monitoring system
        </p>
      </div>

      <div className="p-6">
        {demoStep === 'setup' && (
          <div className="max-w-2xl mx-auto">
            <div className={`p-8 rounded-2xl ${
              isDarkMode 
                ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
                : 'bg-white/80 backdrop-blur-md border border-gray-200'
            } shadow-2xl`}>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">👁️</span>
                </div>
                <h2 className={`text-2xl font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Eye Tracking System Demo
                </h2>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  This demo shows how the eye tracking system monitors user behavior during interviews.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-blue-50'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎯 Features Demonstrated:
                  </h3>
                  <ul className={`space-y-2 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <li>• Real-time gaze direction monitoring</li>
                    <li>• Face positioning guide with visual feedback</li>
                    <li>• Violation tracking and warning system</li>
                    <li>• Automatic interview termination on max violations</li>
                    <li>• Backend integration for violation logging</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-yellow-50'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ⚠️ Demo Warnings:
                  </h3>
                  <ul className={`space-y-2 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <li>• Look away from the screen for 2+ seconds to trigger violations</li>
                    <li>• After 3 violations, the demo will simulate interview termination</li>
                    <li>• This is a demonstration - no real data is stored</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleStartDemo}
                  disabled={camera.cameraStatus !== 'playing'}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all transform ${
                    camera.cameraStatus === 'playing'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-gray-400 cursor-not-allowed text-gray-600'
                  }`}
                >
                  {camera.cameraStatus === 'playing' 
                    ? 'Start Eye Tracking Demo' 
                    : 'Initializing Camera...'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {demoStep === 'positioning' && (
          <div className="max-w-4xl mx-auto">
            <div className={`p-6 rounded-2xl ${
              isDarkMode 
                ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
                : 'bg-white/80 backdrop-blur-md border border-gray-200'
            } shadow-2xl`}>
              
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Face Positioning Guide
                </h2>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Position your face within the circle and ensure your shoulders are visible
                </p>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <video
                  ref={camera.videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 object-cover"
                />
                
                <div className={`absolute top-4 left-4 flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isDarkMode ? 'bg-black/50' : 'bg-white/80'
                } backdrop-blur-sm`}>
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Camera Status: {camera.cameraStatus}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handlePositioningComplete}
                  className="px-6 py-3 rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white transition-all"
                >
                  Skip to Monitoring Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {demoStep === 'monitoring' && (
          <div className="max-w-6xl mx-auto">
            <div className={`p-6 rounded-2xl ${
              isDarkMode 
                ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
                : 'bg-white/80 backdrop-blur-md border border-gray-200'
            } shadow-2xl`}>
              
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Eye Tracking Monitoring
                </h2>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Try looking away from the screen to see the violation system in action
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Video Feed */}
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <video
                    ref={camera.videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  
                  <div className={`absolute top-4 left-4 flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    isDarkMode ? 'bg-black/50' : 'bg-white/80'
                  } backdrop-blur-sm`}>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Eye Tracking: {eyeTracking.isTracking ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Status Information */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-blue-50'
                  }`}>
                    <h3 className={`font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Current Status
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className={`flex justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <span>Gaze Direction:</span>
                        <span className="font-medium">{eyeTracking.gazeDirection}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <span>Face Detected:</span>
                        <span className="font-medium">{eyeTracking.faceDetected ? 'Yes' : 'No'}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <span>Violations:</span>
                        <span className="font-medium">{eyeTracking.violationCount}/3</span>
                      </div>
                      <div className={`flex justify-between ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <span>Looking Away:</span>
                        <span className="font-medium">{eyeTracking.isLookingAway ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-yellow-50'
                  }`}>
                    <h3 className={`font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Demo Instructions
                    </h3>
                    <ul className={`space-y-1 text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <li>• Look away from the screen for 2+ seconds</li>
                      <li>• Watch the violation counter increase</li>
                      <li>• See warning modals appear</li>
                      <li>• Experience automatic termination at 3 violations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={resetDemo}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all mr-4"
                >
                  Reset Demo
                </button>
                <button
                  onClick={() => setDemoStep('complete')}
                  className="px-6 py-3 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all"
                >
                  End Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {demoStep === 'complete' && (
          <div className="max-w-2xl mx-auto">
            <div className={`p-8 rounded-2xl ${
              isDarkMode 
                ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
                : 'bg-white/80 backdrop-blur-md border border-gray-200'
            } shadow-2xl text-center`}>
              
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✅</span>
              </div>
              
              <h2 className={`text-2xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Demo Complete
              </h2>
              
              <p className={`text-lg mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                You've experienced the eye tracking and violation monitoring system. 
                This system ensures interview integrity through strict monitoring.
              </p>

              <div className="space-y-4 mb-8">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-green-50'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Key Features Demonstrated:
                  </h3>
                  <ul className={`space-y-1 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <li>✅ Real-time gaze direction detection</li>
                    <li>✅ Face positioning guidance</li>
                    <li>✅ Violation tracking and warnings</li>
                    <li>✅ Automatic interview termination</li>
                    <li>✅ Backend integration and logging</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={resetDemo}
                className="px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all transform"
              >
                Run Demo Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Eye Tracking Components */}
      {demoStep === 'monitoring' && (
        <>
          <GazeMonitoring
            gazeDirection={eyeTracking.gazeDirection}
            isLookingAway={eyeTracking.isLookingAway}
            violationCount={eyeTracking.violationCount}
            maxViolations={eyeTracking.MAX_VIOLATIONS}
            onViolationThreshold={handleViolationThreshold}
            onRemoveUser={handleRemoveUser}
            isActive={true}
          />
          
          <ViolationTracker
            violations={eyeTracking.violations}
            violationCount={eyeTracking.violationCount}
            maxViolations={eyeTracking.MAX_VIOLATIONS}
            onRemoveUser={handleRemoveUser}
            onViolationThreshold={handleViolationThreshold}
            isActive={true}
          />
        </>
      )}

      {/* Face Positioning Guide */}
      {showPositioningGuide && (
        <FacePositioningGuide
          videoRef={camera.videoRef}
          onPositioningComplete={handlePositioningComplete}
          isActive={showPositioningGuide}
          facePosition={eyeTracking.facePosition}
          faceDetected={eyeTracking.faceDetected}
        />
      )}
    </div>
  );
};

export default EyeTrackingDemo;
