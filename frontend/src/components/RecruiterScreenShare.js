import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Video, Mic, MicOff, X, Play, Pause, Flag, FileText, AlertCircle, Check } from 'lucide-react';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';
import apiService from '../services/apiService';

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
 * Recruiter Screen Share Viewer Component
 * - Views candidate's screen in real-time
 * - Two-way audio communication
 * - Pause/resume interview controls
 * - Add notes and flags
 */
const RecruiterScreenShare = ({ interviewId, candidateId, candidateName, onClose, token }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting...');
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioStreamRef = useRef(null);
  const sessionIdRef = useRef(null);
  const peerConnectionCreatedRef = useRef(false); // Prevent duplicate peer connections

  useEffect(() => {
    init();
    return () => cleanup();
  }, [interviewId, candidateId, token]);

  const init = async () => {
    try {
      // Get microphone for recruiter
      const audioStream = await webrtcService.getUserAudio();
      if (audioStream) {
        audioStreamRef.current = audioStream;
      }

      // Connect to Socket.IO
      socketService.connect(token);
      
      // Wait for connection before joining
      socketService.on('connect', () => {
        console.log('✅ [RECRUITER] Socket connected, joining interview...');
        socketService.joinInterview(interviewId, 'recruiter');
        
        // AUTO-START: Request screen share immediately after joining
        setTimeout(() => {
          console.log('📤 [RECRUITER] Auto-requesting screen share after join');
          requestScreenShare();
        }, 2000);
      });

      // Listen for candidate join (if they join after us)
      socketService.on('user-joined', (data) => {
        if (data.role === 'candidate') {
          console.log('📥 [RECRUITER] Candidate joined after us');
          setStatusMessage('Candidate connected');
          // Request screen share again
          setTimeout(() => {
            if (!peerConnectionCreatedRef.current) {
              requestScreenShare();
            }
          }, 1000);
        }
      });

      // Listen for screen share started
      socketService.on('screen-share-started', (data) => {
        console.log('📥 [RECRUITER] Candidate started screen sharing', data);
        setStatusMessage('Candidate is sharing...');
        // Initiate connection if not already done
        setTimeout(() => {
          if (!peerConnectionCreatedRef.current) {
            console.log('📤 [RECRUITER] Initiating connection after screen share started');
            requestScreenShare();
          }
        }, 1000);
      });

      // Listen for screen share stopped
      socketService.on('screen-share-stopped', () => {
        console.log('📥 [RECRUITER] Candidate stopped screen sharing');
        setShowVideo(false);
        setIsConnected(false);
        setStatusMessage('Candidate stopped sharing');
      });

      // Listen for answer from candidate
      socketService.on('answer', handleAnswer);

      // Listen for ICE candidates
      socketService.on('ice-candidate', handleIceCandidate);

      // Check if candidate is already in room
      socketService.on('room-participants', (data) => {
        console.log('📥 [RECRUITER] Room participants:', data.participants);
        const candidate = data.participants.find(p => p.role === 'candidate');
        if (candidate) {
          console.log('✅ [RECRUITER] Candidate already in room');
          setStatusMessage('Candidate detected, connecting...');
        }
      });

    } catch (error) {
      console.error('❌ [RECRUITER] Initialization error:', error);
      setError('Failed to initialize: ' + error.message);
    }
  };

  const requestScreenShare = async () => {
    // Prevent duplicate peer connection creation
    if (peerConnectionCreatedRef.current) {
      console.log('⚠️ [RECRUITER] Peer connection already exists, skipping...');
      return;
    }
    
    try {
      console.log('📤 [RECRUITER] Requesting screen share from candidate');
      
      peerConnectionCreatedRef.current = true;
      
      // Close any existing peer connection first
      webrtcService.closePeerConnection();
      
      // Create peer connection
      webrtcService.createPeerConnection(
        (candidate) => {
          // Send ICE candidate to candidate
          socketService.sendIceCandidate(interviewId, candidate, candidateId);
        },
        (event) => {
          // Receive candidate's video/audio
          console.log('📥 [RECRUITER] Received remote track:', {
            kind: event.track.kind,
            id: event.track.id,
            enabled: event.track.enabled,
            muted: event.track.muted,
            readyState: event.track.readyState,
            hasStreams: event.streams.length > 0
          });
          
          if (event.track.kind === 'video') {
            console.log('📺 [RECRUITER] Processing video track...');
            if (remoteVideoRef.current && event.streams[0]) {
              remoteVideoRef.current.srcObject = event.streams[0];
              
              // Force video to play
              remoteVideoRef.current.play().then(() => {
                console.log('✅ [RECRUITER] Video playing successfully');
                setShowVideo(true);
                setIsConnected(true);
                setStatusMessage('Connected - Viewing candidate screen');
              }).catch(e => {
                console.warn('⚠️ [RECRUITER] Video autoplay prevented:', e);
                // Still show video element, user might need to click
                setShowVideo(true);
                setIsConnected(true);
                setStatusMessage('Connected - Click video to play');
              });
              
              console.log('✅ [RECRUITER] Video stream attached to video element');
            } else {
              console.error('❌ [RECRUITER] No video ref or streams!');
            }
          } else if (event.track.kind === 'audio') {
            console.log('🎧 [RECRUITER] Processing audio track...');
            if (remoteAudioRef.current && event.streams[0]) {
              remoteAudioRef.current.srcObject = event.streams[0];
              console.log('✅ [RECRUITER] Audio stream attached to audio element');
            }
          }
        }
      );

      // Add recruiter's audio track
      if (audioStreamRef.current) {
        webrtcService.addLocalTracks(audioStreamRef.current);
      }

      // Create and send offer
      const offer = await webrtcService.createOffer();
      console.log('📤 [RECRUITER] Sending offer to candidate');
      socketService.sendOffer(interviewId, offer, candidateId);

      // Notify candidate
      socketService.requestScreenShare(interviewId, candidateId);

    } catch (error) {
      console.error('❌ [RECRUITER] Request screen share error:', error);
      setError('Failed to request screen share: ' + error.message);
      peerConnectionCreatedRef.current = false; // Reset on error
    }
  };

  const handleAnswer = async (data) => {
    try {
      console.log('📥 [RECRUITER] Received answer from candidate');
      
      // Check if peer connection exists and is in correct state
      if (!webrtcService.peerConnection) {
        console.error('❌ [RECRUITER] No peer connection exists');
        return;
      }
      
      const currentState = webrtcService.peerConnection.signalingState;
      console.log(`🔍 [RECRUITER] Current signaling state: ${currentState}`);
      
      // Only set remote description if we're in the correct state
      if (currentState === 'have-local-offer') {
        await webrtcService.setRemoteDescription(data.answer);
        console.log('✅ [RECRUITER] Successfully set remote description (answer)');
      } else {
        console.warn(`⚠️ [RECRUITER] Cannot set remote description, wrong state: ${currentState}`);
      }
    } catch (error) {
      console.error('❌ [RECRUITER] Error handling answer:', error);
      setError('Connection error: ' + error.message);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      await webrtcService.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
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

  const togglePause = async () => {
    try {
      console.log('⏸️ [RECRUITER API] Toggling interview pause status...');
      const newStatus = isPaused ? 'active' : 'paused';
      
      const response = await apiService.put('/screen-share/status', {
        sessionId: sessionIdRef.current,
        status: newStatus
      });

      if (response.status === 200) {
        setIsPaused(!isPaused);
        setStatusMessage(isPaused ? 'Interview resumed' : 'Interview paused');
        console.log('✅ [RECRUITER API] Interview status updated:', newStatus);
      }
    } catch (error) {
      console.error('❌ [RECRUITER API] Toggle pause error:', {
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });
    }
  };

  const addNote = async () => {
    if (!note.trim() || !sessionIdRef.current) return;

    try {
      console.log('📝 [RECRUITER API] Adding interview note...');
      
      const response = await apiService.post('/screen-share/note', {
        sessionId: sessionIdRef.current,
        note: note.trim()
      });

      if (response.status === 200 || response.status === 201) {
        const newNote = { text: note.trim(), timestamp: new Date() };
        setNotes([...notes, newNote]);
        setNote('');
        setShowNoteInput(false);
        console.log('✅ [RECRUITER API] Note added successfully:', newNote.text);
      }
    } catch (error) {
      console.error('❌ [RECRUITER API] Add note error:', {
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });
    }
  };

  const flagSession = async () => {
    const reason = prompt('Reason for flagging this session:');
    if (!reason || !sessionIdRef.current) return;

    try {
      console.log('🚩 [RECRUITER API] Flagging session...', { reason });
      
      const response = await apiService.post('/screen-share/flag', {
        sessionId: sessionIdRef.current,
        reason
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ [RECRUITER API] Session flagged successfully');
        // Show success feedback to user
        setStatusMessage('Session flagged successfully');
        setTimeout(() => {
          setStatusMessage(isConnected ? 'Connected - Viewing candidate screen' : 'Waiting for candidate...');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ [RECRUITER API] Flag session error:', {
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });
    }
  };

  const cleanup = () => {
    console.log('🧹 [RECRUITER] Cleaning up...');
    
    webrtcService.closePeerConnection();
    peerConnectionCreatedRef.current = false; // Reset flag
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    socketService.leaveInterview(interviewId);
    socketService.disconnect();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <Video className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">Viewing: {candidateName}</h2>
            <p className="text-sm text-purple-100">{statusMessage}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isConnected 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-500 text-white'
          }`}>
            {isConnected ? '🔴 LIVE' : '● Waiting'}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="flex-1 flex items-center justify-center p-4">
            {showVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Waiting for candidate to share screen...</p>
                {error && (
                  <div className="mt-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 max-w-md mx-auto">
                    <AlertCircle className="w-5 h-5 text-red-400 inline-block mr-2" />
                    <span className="text-red-200">{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-lg transition ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={togglePause}
                className={`px-4 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
                  isPaused
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>Pause Interview</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNoteInput(true)}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Add Note</span>
              </button>

              <button
                onClick={flagSession}
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
              >
                <Flag className="w-5 h-5" />
                <span>Flag</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notes Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
            <h3 className="text-white font-semibold">Interview Notes</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No notes yet</p>
            ) : (
              notes.map((n, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-3">
                  <p className="text-white text-sm">{n.text}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {n.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {showNoteInput && (
            <div className="p-4 bg-gray-900 border-t border-gray-700">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 mb-2"
                rows="3"
              />
              <div className="flex space-x-2">
                <button
                  onClick={addNote}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setShowNoteInput(false);
                    setNote('');
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden audio elements */}
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
};

export default RecruiterScreenShare;

