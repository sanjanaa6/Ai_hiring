import React, { useState, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CameraDebug from '../CameraDebug';
import BrowserCameraGuide from '../BrowserCameraGuide';

const InterviewSetup = ({ 
  cameraStatus, 
  videoRef, 
  onStartInterview, 
  onRetryCamera,
  isCameraRestarting,
  cameraStream,
  faceDetected = false
}) => {
  const { isDarkMode } = useTheme();

  const getCameraStatusIcon = () => {
    switch (cameraStatus) {
      case 'connected':
      case 'playing':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default:
        return <Camera className="h-8 w-8 text-blue-500 animate-pulse" />;
    }
  };

  const getCameraStatusText = () => {
    switch (cameraStatus) {
      case 'connected':
      case 'playing':
        return 'Camera Ready';
      case 'error':
        return 'Camera Error';
      case 'initializing':
        return 'Initializing Camera...';
      default:
        return 'Setting up camera...';
    }
  };


  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      <div className={`max-w-4xl w-full ${
        isDarkMode 
          ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
          : 'bg-white/80 backdrop-blur-md border border-gray-200'
      } rounded-2xl shadow-2xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`p-8 text-center border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            AI Interview Setup
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Let's get your camera ready for the interview
          </p>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            {/* Camera Preview */}
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Camera Preview
              </h3>
              
              <div className={`relative rounded-xl overflow-hidden ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
              }`}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 object-cover"
                />
                
                {/* Camera Status Overlay */}
                <div className={`absolute top-4 left-4 flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isDarkMode ? 'bg-black/50' : 'bg-white/80'
                } backdrop-blur-sm`}>
                  {getCameraStatusIcon()}
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getCameraStatusText()}
                  </span>
                </div>

                {/* Face Detection Status */}
                {cameraStatus === 'connected' || cameraStatus === 'playing' ? (
                  <div className={`absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    isDarkMode ? 'bg-black/50' : 'bg-white/80'
                  } backdrop-blur-sm`}>
                    <div className={`w-3 h-3 rounded-full ${
                      faceDetected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {faceDetected ? 'Person Detected' : 'Detecting Person...'}
                    </span>
                  </div>
                ) : null}
              </div>

              {cameraStatus === 'error' && (
                <button
                  onClick={onRetryCamera}
                  disabled={isCameraRestarting}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    isCameraRestarting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isCameraRestarting ? 'Retrying...' : 'Retry Camera'}
                </button>
              )}

              {/* Person Detection Warning */}
              {(cameraStatus === 'connected' || cameraStatus === 'playing') && !faceDetected && (
                <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${
                  isDarkMode ? 'bg-yellow-900/20 border-yellow-400' : 'bg-yellow-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`h-5 w-5 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                      }`}>
                        Person Detection Required
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                      }`}>
                        Please position yourself in front of the camera. The interview cannot start until a person is detected.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Information */}
              <CameraDebug
                cameraStream={cameraStream}
                cameraStatus={cameraStatus}
                onRetryCamera={onRetryCamera}
                isCameraRestarting={isCameraRestarting}
              />

              {/* Browser Configuration Guide */}
              {cameraStatus === 'error' && (
                <BrowserCameraGuide />
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Interview Guidelines
                </h3>
                
                <div className="space-y-4">
                  <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-blue-50'
                  }`}>
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Camera Position
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Ensure your face is clearly visible and well-lit
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-green-50'
                  }`}>
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Audio Setup
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Use a quiet environment with good microphone quality
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-purple-50'
                  }`}>
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Internet Connection
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Ensure stable internet for smooth video and audio
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={onStartInterview}
                disabled={cameraStatus === 'error' || (cameraStatus === 'connected' && !faceDetected)}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform ${
                  !(cameraStatus === 'error' || (cameraStatus === 'connected' && !faceDetected))
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                    : 'bg-gray-400 cursor-not-allowed text-gray-600'
                }`}
              >
                {cameraStatus === 'error' 
                  ? 'Camera Error - Cannot Start'
                  : cameraStatus === 'connected' && !faceDetected
                    ? 'Waiting for Person Detection...'
                    : cameraStatus === 'connected' && faceDetected
                      ? 'Start Interview'
                      : cameraStatus === 'playing'
                        ? 'Start Interview'
                        : 'Start Interview (No Camera)'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
