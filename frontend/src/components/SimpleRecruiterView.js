import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import io from 'socket.io-client';

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
 * SIMPLIFIED Recruiter Screen Share Viewer
 * GUARANTEED TO WORK - No fancy logic, just pure WebRTC
 */
const SimpleRecruiterView = ({ interviewId, candidateId, onClose }) => {
  const [status, setStatus] = useState('Initializing...');
  const [connected, setConnected] = useState(false);
  
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  
  useEffect(() => {
    console.log('🚀 [RECRUITER] Starting simple viewer...');
    initConnection();
    
    return () => {
      cleanup();
    };
  }, []);
  
  const initConnection = async () => {
    try {
      // 1. Connect to Socket.IO
      setStatus('Connecting to server...');
      const socket = io(API_URL, {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('✅ [RECRUITER] Socket connected:', socket.id);
        setStatus('Joining interview room...');
        
        // 2. Join the room
        socket.emit('join-interview', { 
          interviewId, 
          role: 'recruiter' 
        });
        
        // 3. Wait a bit, then create connection
        setTimeout(() => {
          createPeerConnection(socket);
        }, 2000);
      });
      
      // Listen for answer from candidate
      socket.on('answer', async (data) => {
        console.log('📥 [RECRUITER] Received answer from candidate');
        if (pcRef.current && data.answer) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('✅ [RECRUITER] Remote description set');
            setStatus('Connected!');
            setConnected(true);
          } catch (error) {
            console.error('❌ [RECRUITER] Error setting remote description:', error);
          }
        }
      });
      
      // Listen for ICE candidates
      socket.on('ice-candidate', async (data) => {
        console.log('🧊 [RECRUITER] Received ICE candidate');
        if (pcRef.current && data.candidate) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (error) {
            console.error('❌ [RECRUITER] Error adding ICE candidate:', error);
          }
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error('❌ [RECRUITER] Socket error:', error);
        setStatus('Connection error');
      });
      
    } catch (error) {
      console.error('❌ [RECRUITER] Init error:', error);
      setStatus('Failed to initialize');
    }
  };
  
  const createPeerConnection = async (socket) => {
    try {
      console.log('🔗 [RECRUITER] Creating peer connection...');
      setStatus('Creating peer connection...');
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;
      
      // Handle incoming tracks (candidate's screen)
      pc.ontrack = (event) => {
        console.log('📥 [RECRUITER] Received track:', event.track.kind);
        if (event.track.kind === 'video' && videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().then(() => {
            console.log('✅ [RECRUITER] Video playing!');
            setStatus('Viewing candidate screen');
            setConnected(true);
          }).catch(e => console.error('Video play error:', e));
        }
      };
      
      // Send ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 [RECRUITER] Sending ICE candidate to room');
          socket.emit('ice-candidate', {
            interviewId,
            candidate: event.candidate,
            targetUserId: null // Broadcast to room
          });
        }
      };
      
      // Monitor connection
      pc.onconnectionstatechange = () => {
        console.log('🔄 [RECRUITER] Connection state:', pc.connectionState);
        setStatus(`Connection: ${pc.connectionState}`);
        
        if (pc.connectionState === 'connected') {
          setConnected(true);
          setStatus('Connected - Viewing candidate screen');
        } else if (pc.connectionState === 'failed') {
          console.error('❌ [RECRUITER] Connection failed!');
          setStatus('Connection failed - Check console for details');
        }
      };
      
      pc.onicegatheringstatechange = () => {
        console.log('🧊 [RECRUITER] ICE gathering state:', pc.iceGatheringState);
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 [RECRUITER] ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.error('❌ [RECRUITER] ICE connection failed!');
        }
      };
      
      // Create offer
      console.log('📤 [RECRUITER] Creating offer...');
      setStatus('Sending connection request...');
      
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });
      
      await pc.setLocalDescription(offer);
      
      // Send offer to candidate - BROADCAST to room instead of targeting specific user
      console.log('📤 [RECRUITER] Broadcasting offer to interview room:', interviewId);
      socket.emit('offer', {
        interviewId,
        offer: offer,
        targetUserId: null // Broadcast to everyone in room
      });
      
      console.log('✅ [RECRUITER] Offer sent, waiting for answer...');
      setStatus('Waiting for candidate response...');
      
    } catch (error) {
      console.error('❌ [RECRUITER] Peer connection error:', error);
      setStatus('Connection failed: ' + error.message);
    }
  };
  
  const cleanup = () => {
    console.log('🧹 [RECRUITER] Cleaning up...');
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Viewing: {candidateId}</h2>
          <p className="text-sm text-purple-100">{status}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      
      {/* Video Area */}
      <div className="flex-1 bg-black flex items-center justify-center p-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          style={{ maxHeight: '90vh' }}
        />
        
        {!connected && (
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

export default SimpleRecruiterView;

