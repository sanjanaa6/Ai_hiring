import React, { useState, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CameraDebug = ({ cameraStream, cameraStatus, onRetryCamera, isCameraRestarting }) => {
  const { isDarkMode } = useTheme();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        hasStream: !!cameraStream,
        streamTracks: cameraStream ? cameraStream.getTracks().length : 0,
        cameraStatus,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        protocol: window.location.protocol
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [cameraStream, cameraStatus]);

  const getStatusIcon = () => {
    switch (cameraStatus) {
      case 'connected':
      case 'playing':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Camera className="h-6 w-6 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (cameraStatus) {
      case 'connected':
      case 'playing':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-slate-800/50 border-white/10' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Camera Debug Info
        </h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {cameraStatus}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Has Stream:
            </span>
            <span className={`ml-2 ${debugInfo.hasStream ? 'text-green-500' : 'text-red-500'}`}>
              {debugInfo.hasStream ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div>
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Track Count:
            </span>
            <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {debugInfo.streamTracks}
            </span>
          </div>

          <div>
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              getUserMedia:
            </span>
            <span className={`ml-2 ${debugInfo.hasGetUserMedia ? 'text-green-500' : 'text-red-500'}`}>
              {debugInfo.hasGetUserMedia ? 'Supported' : 'Not Supported'}
            </span>
          </div>

          <div>
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Protocol:
            </span>
            <span className={`ml-2 ${debugInfo.protocol === 'https:' ? 'text-green-500' : 'text-yellow-500'}`}>
              {debugInfo.protocol}
            </span>
          </div>
        </div>


        {cameraStatus === 'error' && (
          <div className="mt-4 space-y-3">
            <button
              onClick={onRetryCamera}
              disabled={isCameraRestarting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isCameraRestarting
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isCameraRestarting ? 'animate-spin' : ''}`} />
              <span>{isCameraRestarting ? 'Retrying...' : 'Retry Camera'}</span>
            </button>
            
            {/* HTTP Protocol Warning */}
            {debugInfo.protocol === 'http:' && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                  }`}>
                    HTTP Protocol Detected
                  </span>
                </div>
                <div className={`text-xs space-y-1 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  <div>• Some browsers block camera access on HTTP</div>
                  <div>• Try using localhost or enable camera permissions</div>
                  <div>• For production, use HTTPS</div>
                </div>
              </div>
            )}
            
            {/* Browser Configuration Help */}
            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  Browser Configuration
                </span>
              </div>
              <div className={`text-xs space-y-1 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-600'
              }`}>
                <div>• Click the camera icon in address bar</div>
                <div>• Allow camera access when prompted</div>
                <div>• Refresh the page after granting permissions</div>
                <div>• Try incognito/private mode if issues persist</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDebug;
