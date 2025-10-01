import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const SmallCamera = ({ 
  cameraStream, 
  isRecording = false, 
  className = '',
  showControls = true,
  showStatus = true 
}) => {
  const { isDarkMode } = useTheme();
  const videoRef = useRef(null);

  // Connect video element to camera stream
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
    }
  }, [cameraStream]);

  return (
    <div className={`relative ${className}`}>
      {/* Camera Container */}
      <div className={`relative rounded-xl overflow-hidden ${
        isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
      } shadow-lg`}>
        
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium bg-black/70 px-2 py-1 rounded">
              Recording
            </span>
          </div>
        )}

        {/* Status Overlay */}
        {showStatus && (
          <div className="absolute bottom-3 right-3">
            <div className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${
              isDarkMode ? 'bg-black/50' : 'bg-white/80'
            } backdrop-blur-sm`}>
              <div className={`w-2 h-2 rounded-full ${
                cameraStream ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-xs font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {cameraStream ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className={`mt-3 flex items-center justify-center space-x-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          }`}></div>
          <span className="text-sm">
            {isRecording ? 'Recording' : 'Ready'}
          </span>
        </div>
      )}
    </div>
  );
};

export default SmallCamera;
