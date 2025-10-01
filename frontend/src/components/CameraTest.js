import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, Play, Square } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CameraTest = () => {
  const { isDarkMode } = useTheme();
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('initializing');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const initializeCamera = async () => {
    try {
      setError(null);
      setCameraStatus('initializing');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setCameraStream(stream);
      setCameraStatus('connected');
    } catch (error) {
      setError(error.message);
      setCameraStatus('error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraStatus('stopped');
    }
  };

  const startRecording = () => {
    if (cameraStream && MediaRecorder.isTypeSupported('video/webm')) {
      const mediaRecorder = new MediaRecorder(cameraStream, {
        mimeType: 'video/webm'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'camera-test-recording.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Connect video element to camera stream
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
    }
  }, [cameraStream]);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const getStatusIcon = () => {
    switch (cameraStatus) {
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Camera className="h-6 w-6 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (cameraStatus) {
      case 'connected':
        return 'Camera Working';
      case 'error':
        return 'Camera Error';
      case 'initializing':
        return 'Initializing...';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className={`min-h-screen p-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      <div className={`max-w-4xl mx-auto ${
        isDarkMode 
          ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
          : 'bg-white/80 backdrop-blur-md border border-gray-200'
      } rounded-2xl shadow-2xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`p-6 text-center border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Camera Test
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Test your camera and microphone before starting the interview
          </p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            
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
                
                {/* Status Overlay */}
                <div className={`absolute top-4 left-4 flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isDarkMode ? 'bg-black/50' : 'bg-white/80'
                } backdrop-blur-sm`}>
                  {getStatusIcon()}
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getStatusText()}
                  </span>
                </div>

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/80 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">Recording</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={cameraStatus === 'connected' ? stopCamera : initializeCamera}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    cameraStatus === 'connected'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{cameraStatus === 'connected' ? 'Stop Camera' : 'Start Camera'}</span>
                </button>

                {cameraStatus === 'connected' && (
                  <>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-4 w-4" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Start Recording</span>
                        </>
                      )}
                    </button>

                    {recordedChunks.length > 0 && (
                      <button
                        onClick={downloadRecording}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        <span>Download Recording</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-red-900/30 border border-red-500/30' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className={`font-medium ${
                      isDarkMode ? 'text-red-400' : 'text-red-700'
                    }`}>
                      Error
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`}>
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Test Instructions
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
                        Camera Access
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Allow camera access when prompted by your browser
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
                        Video Quality
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Ensure your face is clearly visible and well-lit
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
                        Recording Test
                      </p>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Test recording to verify both video and audio work
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Requirements */}
              <div>
                <h4 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  System Requirements
                </h4>
                <div className={`space-y-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <div>• Modern web browser (Chrome, Firefox, Safari, Edge)</div>
                  <div>• HTTPS connection or localhost</div>
                  <div>• Camera and microphone permissions</div>
                  <div>• Stable internet connection</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;
