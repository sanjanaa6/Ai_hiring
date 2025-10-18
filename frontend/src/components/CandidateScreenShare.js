import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Video, VideoOff, Mic, MicOff, X, AlertCircle, Minus } from 'lucide-react';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';

// Get Socket.IO server URL (without /api path)
const getSocketUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
  }
  
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.includes('eval8.ai')) {
      return 'https://aihire.eval8.xyz';  // Backend domain
    }
    return `${protocol}//${hostname}:5000`;
  }
  
  return 'http://localhost:5000';
};

const API_URL = getSocketUrl();

/**
 * Candidate Screen Share Component
 * - Forces FULL SCREEN sharing (guardrail)
 * - Two-way audio communication
 * - Real-time connection status
 */
const CandidateScreenShare = ({ interviewId, candidateId, candidateName, candidateEmail, onMinimize, onMaximize, onEndInterview, isMinimized, token }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to share');
  const [recruiterConnected, setRecruiterConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioStreamRef = useRef(null);
  const localStreamRef = useRef(null); // Store local stream reference
  const sessionStartedRef = useRef(false); // Prevent duplicate session creation
  const screenShareStartedRef = useRef(false); // Prevent duplicate screen share prompts

  useEffect(() => {
    console.log('🔌 [CANDIDATE] Initializing Socket.IO connection...');
    
    // Connect to Socket.IO
    socketService.connect(token);

    // Listen for Socket.IO connection success
    socketService.on('connect', () => {
      console.log('✅ [CANDIDATE] Socket.IO connected!');
      setIsConnected(true);
      setStatusMessage('Connected - Joining interview...');
      
      // Join interview room after connection
      setTimeout(() => {
        socketService.joinInterview(interviewId, 'candidate');
        setStatusMessage('Connected - Ready to share');
      }, 500);
    });

    // Listen for Socket.IO connection errors
    socketService.on('connect_error', (error) => {
      console.error('❌ [CANDIDATE] Connection error:', error);
      setIsConnected(false);
      setStatusMessage('Connection failed');
      setError(`Connection error: ${error.message}`);
    });

    // Listen for Socket.IO disconnection
    socketService.on('disconnect', (reason) => {
      console.log('❌ [CANDIDATE] Disconnected:', reason);
      setIsConnected(false);
      setStatusMessage('Disconnected');
    });

    // AUTO-START screen sharing when component mounts
    setTimeout(() => {
      startScreenShare();
    }, 1000);

    // Listen for recruiter join
    socketService.on('user-joined', (data) => {
      if (data.role === 'recruiter') {
        console.log('📥 Recruiter joined');
        setRecruiterConnected(true);
        setStatusMessage('Recruiter connected');
      }
    });

    // Listen for recruiter leave
    socketService.on('user-left', (data) => {
      if (data.role === 'recruiter') {
        console.log('📤 Recruiter left');
        setRecruiterConnected(false);
        setStatusMessage('Recruiter disconnected');
      }
    });

    // Listen for WebRTC offer from recruiter
    socketService.on('offer', handleOffer);

    // Listen for ICE candidates
    socketService.on('ice-candidate', handleIceCandidate);

    // Listen for screen share request
    socketService.on('screen-share-requested', () => {
      console.log('📥 Screen share requested by recruiter');
      if (!isSharing) {
        startScreenShare();
      }
    });

    return () => {
      cleanup();
    };
  }, [interviewId, token]);

  const handleOffer = async (data) => {
    try {
      console.log('📥📥📥 [CANDIDATE] ===== RECEIVED OFFER FROM RECRUITER =====');
      console.log('📥 [CANDIDATE] Offer data:', data);
      
      // Close any existing peer connection
      if (webrtcService.peerConnection) {
        console.log('🔄 [CANDIDATE] Closing existing peer connection');
        webrtcService.closePeerConnection();
      }
      
      // Create new peer connection
      createPeerConnection();
      
      // CRITICAL: Add the local stream (screen + audio) to the peer connection
      const localStream = localStreamRef.current || (localVideoRef.current?.srcObject);
      if (localStream) {
        const tracks = localStream.getTracks();
        console.log('📤 [CANDIDATE] Adding local stream tracks to peer connection:', {
          trackCount: tracks.length,
          trackTypes: tracks.map(t => t.kind)
        });
        webrtcService.addLocalTracks(localStream);
        console.log('✅ [CANDIDATE] Local stream tracks added successfully');
      } else {
        console.error('❌ [CANDIDATE] No local stream available to add!');
        console.log('🔍 [CANDIDATE] Debug info:', {
          localStreamRef: !!localStreamRef.current,
          localVideoSrcObject: !!localVideoRef.current?.srcObject
        });
      }

      // Set remote description (recruiter's offer)
      await webrtcService.setRemoteDescription(data.offer);
      console.log('✅ [CANDIDATE] Remote description set');
      
      // Small delay to ensure tracks are negotiated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create and send answer
      const answer = await webrtcService.createAnswer();
      console.log('📤 [CANDIDATE] Sending answer to recruiter');
      console.log('📤 [CANDIDATE] Answer details:', {
        interviewId,
        to: data.from,
        answerType: answer.type
      });
      socketService.sendAnswer(interviewId, answer, data.from);

      setIsConnected(true);
      setStatusMessage('Connected - Recruiter viewing your screen');
    } catch (error) {
      console.error('❌ [CANDIDATE] Error handling offer:', error);
      setError('Failed to establish connection: ' + error.message);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      await webrtcService.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  };

  const createPeerConnection = () => {
    webrtcService.createPeerConnection(
      (candidate) => {
        // Send ICE candidate to recruiter
        socketService.sendIceCandidate(interviewId, candidate, null);
      },
      (event) => {
        // Receive recruiter's audio
        console.log('📥 Received recruiter audio track');
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      }
    );
  };

  const startScreenShare = async () => {
    // Prevent duplicate screen share prompts
    if (screenShareStartedRef.current) {
      console.log('⚠️ [SCREEN SHARE] Already started, skipping...');
      return;
    }
    
    screenShareStartedRef.current = true;
    
    try {
      setError(null);
      setStatusMessage('Requesting screen share...');

      // Get screen share (FULL SCREEN ENFORCED)
      const screenStream = await webrtcService.getDisplayMedia();

      // Get microphone for audio
      const audioStream = await webrtcService.getUserAudio();
      if (audioStream) {
        audioStreamRef.current = audioStream;
        // Combine screen + audio
        const combinedStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
        
        // Store stream reference for later use
        localStreamRef.current = combinedStream;
        
        // Set local preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = combinedStream;
        }

        // Create peer connection
        createPeerConnection();
        webrtcService.addLocalTracks(combinedStream);
      } else {
        // Screen only (no audio)
        localStreamRef.current = screenStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        createPeerConnection();
        webrtcService.addLocalTracks(screenStream);
      }

      // Handle screen share stop (user clicks "Stop sharing" in browser)
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('🛑 Screen sharing stopped by user');
        stopScreenShare();
      });

      setIsSharing(true);
      setStatusMessage('Screen sharing started - Waiting for recruiter');
      
      console.log('✅ [CANDIDATE] Screen sharing fully initialized');
      
      // Wait a moment to ensure everything is set up, then notify recruiter
      setTimeout(() => {
        console.log('📤 [CANDIDATE] Notifying recruiter that screen share is ready');
        socketService.notifyScreenShareStarted(interviewId);
      }, 500);

      // Start session in database
      await startSession();
      
      // Auto-minimize after successful screen sharing (like Google Meet)
      setTimeout(() => {
        console.log('📱 [CANDIDATE] Auto-minimizing screen share window for better UX');
        setStatusMessage('Screen sharing active - Interview in progress');
        if (onMinimize) {
          onMinimize();
        }
      }, 2000); // Give user 2 seconds to see it's working, then minimize

    } catch (error) {
      console.error('❌ Screen share error:', error);
      setError(error.message);
      setStatusMessage('Failed to start screen share');
      screenShareStartedRef.current = false; // Reset on error so user can try again
    }
  };

  const stopScreenShare = async () => {
    try {
      webrtcService.closePeerConnection();
      
      // Stop all tracks in local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      setIsSharing(false);
      setIsConnected(false);
      setIsMuted(false);
      setStatusMessage('Screen sharing stopped');

      // Notify recruiter
      socketService.notifyScreenShareStopped(interviewId);

      // End session in database
      await endSession();

    } catch (error) {
      console.error('❌ Stop share error:', error);
    }
  };

  const toggleMute = () => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const startSession = async () => {
    // Prevent duplicate session creation
    if (sessionStartedRef.current) {
      console.log('⚠️ [SCREEN SHARE] Session already started, skipping...');
      return;
    }
    
    sessionStartedRef.current = true;
    
    try {
      console.log('📤 [SCREEN SHARE] Starting session in backend...', { 
        interviewId, 
        candidateId,
        candidateName,
        candidateEmail 
      });
      
      const response = await apiService.post('/screen-share/start', {
        interviewId,
        candidateId: candidateId || `guest_${Date.now()}`,
        candidateName: candidateName || 'Anonymous Candidate',
        candidateEmail: candidateEmail || 'no-email@provided.com'
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ [CANDIDATE API] Session created in backend:', response.data);
      } else {
        console.error('❌ [CANDIDATE API] Failed to start session in database');
        sessionStartedRef.current = false; // Reset on failure
      }
    } catch (error) {
      console.error('❌ [CANDIDATE API] Error starting session:', {
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });
      sessionStartedRef.current = false; // Reset on error
    }
  };

  const endSession = async () => {
    try {
      console.log('📤 [CANDIDATE API] Ending session in backend...', { interviewId, candidateId });
      const response = await apiService.post('/screen-share/end', {
        interviewId,
        candidateId: candidateId || `guest_${Date.now()}`
      });
      console.log('✅ [CANDIDATE API] Session ended successfully:', response.data);
    } catch (error) {
      console.error('❌ [CANDIDATE API] Error ending session:', {
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });
    }
  };

  const cleanup = () => {
    if (isSharing) {
      stopScreenShare();
    }
    socketService.leaveInterview(interviewId);
    socketService.disconnect();
  };

  // Render minimized floating indicator
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-2xl p-4 flex items-center space-x-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <div>
              <p className="text-white font-semibold text-sm">Screen Sharing Active</p>
              <p className="text-blue-100 text-xs">{statusMessage}</p>
            </div>
          </div>
          <button
            onClick={onMaximize}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white text-sm font-medium transition"
          >
            Expand
          </button>
          <button
            onClick={() => {
              if (window.confirm('⚠️ Stop screen sharing?\n\nThis will stop sharing your screen but keep the interview active.')) {
                stopScreenShare();
              }
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white text-sm font-medium transition"
          >
            Stop Share
          </button>
        </div>
      </div>
    );
  }

  // Render full screen share modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Screen Sharing Interview</h2>
              <p className="text-sm text-blue-100">{statusMessage}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Close button (minimizes like Google Meet) */}
            <button
              onClick={onMinimize}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-all duration-200 hover:scale-105"
              title="Close window (screen sharing continues in background)"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Minimize button (alternative option) */}
            <button
              onClick={onMinimize}
              className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white text-sm font-medium transition"
              title="Minimize to floating indicator"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 flex items-center justify-between border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Not Connected'}</span>
            </div>
            {recruiterConnected && (
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Recruiter viewing</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Preview */}
        <div className="p-6">
          <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-200">Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            {!isSharing ? (
              <button
                onClick={startScreenShare}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <Video className="w-5 h-5" />
                <span>Start Screen Sharing</span>
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    isMuted
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('⚠️ Stop screen sharing?\n\nThis will stop sharing your screen but keep the interview active.\n\nYou can restart sharing anytime.')) {
                      stopScreenShare();
                    }
                  }}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <VideoOff className="w-5 h-5" />
                  <span>Stop Sharing</span>
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          {!isSharing && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Important Instructions:</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• You MUST share your <strong>ENTIRE SCREEN</strong>, not a tab or window</li>
                <li>• The system will reject tab/window sharing</li>
                <li>• Make sure your microphone is working for audio communication</li>
                <li>• The recruiter will be able to see your screen in real-time</li>
              </ul>
            </div>
          )}
        </div>

        {/* Hidden audio element for recruiter's voice */}
        <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default CandidateScreenShare;

