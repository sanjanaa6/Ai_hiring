import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Get Socket.IO server URL (without /api path)
const getSocketUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    // Remove /api suffix if present
    return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
  }
  
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.includes('eval8.ai')) {
      return 'https://aihiring.eval8.ai';
    }
    return `${protocol}//${hostname}:5000`;
  }
  
  return 'http://localhost:5000';
};

const API_URL = getSocketUrl();

/**
 * WORKING SCREEN SHARE - SIMPLE & BULLETPROOF
 * Candidate: Shares screen
 * Recruiter: Views screen
 */
const WorkingScreenShare = ({ interviewId, role, candidateInfo, candidateId, onClose }) => {
  const [status, setStatus] = useState('Initializing...');
  const [hasVideo, setHasVideo] = useState(false);
  
  // Use the REAL candidate ID - no random generation
  // This prevents duplicate sessions from the same user
  const candidateIdRef = useRef(
    role === 'candidate' 
      ? (candidateInfo?.id || candidateInfo?._id || `guest_${Date.now()}`)
      : candidateId
  );
  const myCandidateId = candidateIdRef.current;
  
  const uniqueRoomId = `${interviewId}_${myCandidateId}`;
  
  console.log(`\n========================================`);
  console.log(`🎯 [${role.toUpperCase()}] INITIALIZATION`);
  console.log(`Interview ID:`, interviewId);
  console.log(`Candidate ID (prop):`, candidateId);
  console.log(`Candidate Info:`, candidateInfo);
  console.log(`My Candidate ID:`, myCandidateId);
  console.log(`Unique Room ID:`, uniqueRoomId);
  console.log(`========================================\n`);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const iceCandidateQueueRef = useRef([]); // Queue ICE candidates until answer received
  const remoteDescriptionSetRef = useRef(false);
  
  useEffect(() => {
    console.log(`🚀 [${role.toUpperCase()}] Starting...`);
    init();
    return () => cleanup();
  }, []);
  
  const init = async () => {
    try {
      // Connect Socket.IO
      const socket = io(API_URL, {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log(`✅ [${role.toUpperCase()}] Socket connected:`, socket.id);
        console.log(`🚪 [${role.toUpperCase()}] Joining unique room:`, uniqueRoomId);
        
        // Join room - each candidate gets their own room
        socket.emit('join-interview', { interviewId: uniqueRoomId, role });
        roomJoinedRef.current = true;
        
        // Start based on role
        if (role === 'candidate') {
          setTimeout(() => startSharing(), 1000);
        } else {
          setTimeout(() => startViewing(), 2000);
        }
      });
      
      // WebRTC signaling
      if (role === 'candidate') {
        socket.on('offer', handleOffer);
        socket.on('ice-candidate', handleIceCandidate);
      } else if (role === 'recruiter') {
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
      }
      
      socket.on('connect_error', (err) => {
        console.error(`❌ [${role.toUpperCase()}] Socket error:`, err);
      });
      
    } catch (error) {
      console.error(`❌ [${role.toUpperCase()}] Init error:`, error);
      setStatus('Failed to initialize');
    }
  };
  
  // ==================== CANDIDATE: SHARE SCREEN ====================
  const startSharing = async () => {
    try {
      console.log('📹 [CANDIDATE] Getting screen...');
      setStatus('Requesting screen share...');
      
      // Get screen
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Handle screen share stop (user clicks "Stop sharing" in browser)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('⚠️ [CANDIDATE] Screen share stopped by user');
        cleanup();
      });
      
      console.log('✅ [CANDIDATE] Screen captured, waiting for recruiter...');
      setStatus('Screen shared - Waiting for recruiter to join');
      setHasVideo(true);
      
      // Save session to database with REAL candidate info
      // Store ORIGINAL interview ID and candidate ID separately
      try {
        const candidateData = {
          interviewId: interviewId, // Store ORIGINAL interview ID
          candidateId: myCandidateId,
          candidateName: candidateInfo?.name || candidateInfo?.fullName || candidateInfo?.email || 'Anonymous',
          candidateEmail: candidateInfo?.email || 'unknown@interview.com'
        };
        
        console.log('💾 [CANDIDATE] Saving session with real data:', candidateData);
        
        const response = await fetch(`${API_URL}/api/screen-share/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(candidateData)
        });
        const data = await response.json();
        console.log('✅ [CANDIDATE] Session saved to database:', data);
      } catch (error) {
        console.error('❌ [CANDIDATE] Failed to save session:', error);
      }
      
    } catch (error) {
      console.error('❌ [CANDIDATE] Screen share error:', error);
      setStatus('Failed to share screen');
    }
  };
  
  // ==================== RECRUITER: VIEW SCREEN ====================
  const startViewing = async () => {
    try {
      console.log('📺 [RECRUITER] Creating connection...');
      setStatus('Connecting to candidate...');
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;
      
      // Receive video
      pc.ontrack = (event) => {
        console.log('📥📥📥 [RECRUITER] ===== RECEIVED TRACK! =====');
        console.log('📥 [RECRUITER] Track details:', {
          kind: event.track.kind,
          id: event.track.id,
          enabled: event.track.enabled,
          muted: event.track.muted,
          readyState: event.track.readyState,
          streams: event.streams.length
        });
        
        if (event.streams && event.streams[0]) {
          console.log('✅ [RECRUITER] Attaching stream to video element');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().then(() => {
              console.log('✅ [RECRUITER] Video playing!');
              setHasVideo(true);
              setStatus('Viewing candidate screen');
            }).catch(err => {
              console.error('❌ [RECRUITER] Video play error:', err);
            });
          } else {
            console.error('❌ [RECRUITER] No video ref!');
          }
        } else {
          console.error('❌ [RECRUITER] No streams in event!');
        }
      };
      
      // Send ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            interviewId: uniqueRoomId,
            candidate: event.candidate
          });
        }
      };
      
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });
      await pc.setLocalDescription(offer);
      
      // Send offer
      socketRef.current.emit('offer', {
        interviewId: uniqueRoomId,
        offer: offer
      });
      
      console.log('✅ [RECRUITER] Offer sent');
      setStatus('Waiting for candidate response...');
      
    } catch (error) {
      console.error('❌ [RECRUITER] Viewing error:', error);
      setStatus('Failed to connect');
    }
  };
  
  // ==================== HANDLE OFFER (CANDIDATE) ====================
  const handleOffer = async (data) => {
    if (role !== 'candidate') return;
    
    try {
      console.log('📥 [CANDIDATE] Received offer from recruiter');
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;
      
      // Add local stream (screen)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
          console.log('📤 [CANDIDATE] Added track:', track.kind);
        });
      }
      
      // Send ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            interviewId: uniqueRoomId,
            candidate: event.candidate
          });
        }
      };
      
      // Set offer and create answer
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      // Send answer
      console.log('📤 [CANDIDATE] Sending answer to recruiter via Socket.IO');
      console.log('📤 [CANDIDATE] Answer SDP:', answer);
      socketRef.current.emit('answer', {
        interviewId: uniqueRoomId,
        answer: answer
      });
      
      console.log('✅ [CANDIDATE] Answer sent to room:', uniqueRoomId);
      setStatus('Connected - Recruiter is viewing');
      
    } catch (error) {
      console.error('❌ [CANDIDATE] Handle offer error:', error);
    }
  };
  
  // ==================== HANDLE ANSWER (RECRUITER) ====================
  const handleAnswer = async (data) => {
    if (role !== 'recruiter') return;
    
    try {
      console.log('📥📥📥 [RECRUITER] ===== RECEIVED ANSWER FROM CANDIDATE =====');
      console.log('📥 [RECRUITER] Answer data:', data);
      
      if (!pcRef.current) {
        console.error('❌ [RECRUITER] No peer connection exists!');
        return;
      }
      
      if (!data.answer) {
        console.error('❌ [RECRUITER] No answer in data!');
        return;
      }
      
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      remoteDescriptionSetRef.current = true;
      console.log('✅ [RECRUITER] Remote description set!');
      
      // Process queued ICE candidates
      if (iceCandidateQueueRef.current.length > 0) {
        console.log(`📦 [RECRUITER] Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
        for (const candidate of iceCandidateQueueRef.current) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ [RECRUITER] Added queued ICE candidate');
          } catch (err) {
            console.error('❌ [RECRUITER] Error adding queued ICE:', err);
          }
        }
        iceCandidateQueueRef.current = [];
      }
      
      setStatus('Connected - Waiting for video...');
      
    } catch (error) {
      console.error('❌ [RECRUITER] Handle answer error:', error);
      setStatus('Error: ' + error.message);
    }
  };
  
  // ==================== HANDLE ICE ====================
  const handleIceCandidate = async (data) => {
    try {
      if (!data.candidate) return;
      
      if (role === 'recruiter' && !remoteDescriptionSetRef.current) {
        // Queue ICE candidates until answer is received
        console.log('📦 [RECRUITER] Queueing ICE candidate (remote description not set yet)');
        iceCandidateQueueRef.current.push(data.candidate);
        return;
      }
      
      if (pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log(`✅ [${role.toUpperCase()}] ICE candidate added`);
      }
    } catch (error) {
      console.error(`❌ [${role.toUpperCase()}] ICE error:`, error);
    }
  };
  
  // ==================== CLEANUP ====================
  const cleanup = async () => {
    console.log(`🧹 [${role.toUpperCase()}] Cleaning up`);
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (pcRef.current) {
      pcRef.current.close();
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // End session in database if candidate
    if (role === 'candidate') {
      try {
        await fetch(`${API_URL}/api/screen-share/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            interviewId: interviewId, // Use ORIGINAL interview ID
            candidateId: myCandidateId
          })
        });
        console.log('✅ [CANDIDATE] Session ended in database for:', myCandidateId);
      } catch (error) {
        console.error('❌ [CANDIDATE] Failed to end session:', error);
      }
    }
  };
  
  // ==================== RENDER ====================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {role === 'candidate' ? 'Sharing Your Screen' : 'Viewing Candidate'}
          </h2>
          <p className="text-sm text-blue-100">{status}</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
        >
          ✕ Close
        </button>
      </div>
      
      {/* Video Area */}
      <div className="flex-1 bg-black p-4 relative">
        {role === 'candidate' ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        )}
        
        {/* DEBUG INFO - REMOVE LATER */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded text-xs font-mono max-w-md">
          <div><strong>Role:</strong> {role}</div>
          <div><strong>Room:</strong> {uniqueRoomId}</div>
          <div><strong>Candidate ID:</strong> {myCandidateId}</div>
          <div><strong>Interview ID:</strong> {interviewId}</div>
        </div>
        
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">{status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingScreenShare;

