import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.eventHandlers = {};
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('🔌 [SOCKET] Already connected');
      return;
    }

    // Get Socket.IO server URL (without /api path)
    let serverUrl = process.env.REACT_APP_SOCKET_URL;
    
    if (!serverUrl) {
      const envUrl = process.env.REACT_APP_API_URL;
      const isProd = process.env.NODE_ENV === 'production';
      const { protocol, hostname } = typeof window !== 'undefined' ? window.location : {};

      serverUrl =
        envUrl?.replace(/\/api$/, '') ||
        (isProd
          ? hostname?.includes('eval8.ai')
            ? 'https://aihire.eval8.xyz'
            : `${protocol}//${hostname}:5000`
          : 'http://localhost:5000');
    }

    console.log('🔌 [SOCKET] Connecting to:', serverUrl);


    this.socket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ [SOCKET] Connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ [SOCKET] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [SOCKET] Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 [SOCKET] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers = {};
    }
  }

  joinInterview(interviewId, role) {
    if (!this.socket?.connected) {
      console.error('❌ [SOCKET] Not connected');
      return;
    }

    console.log(`📥 [SOCKET] Joining interview ${interviewId} as ${role}`);
    this.socket.emit('join-interview', { interviewId, role });
  }

  leaveInterview(interviewId) {
    if (!this.socket?.connected) return;
    
    console.log(`📤 [SOCKET] Leaving interview ${interviewId}`);
    this.socket.emit('unsubscribe-interview', { interviewId });
  }

  sendOffer(interviewId, offer, targetUserId) {
    if (!this.socket?.connected) return;
    
    console.log(`📤 [SOCKET] Sending offer to ${targetUserId}`);
    this.socket.emit('offer', { interviewId, offer, targetUserId });
  }

  sendAnswer(interviewId, answer, targetUserId) {
    if (!this.socket?.connected) return;
    
    console.log(`📤 [SOCKET] Sending answer to ${targetUserId}`);
    this.socket.emit('answer', { interviewId, answer, targetUserId });
  }

  sendIceCandidate(interviewId, candidate, targetUserId) {
    if (!this.socket?.connected) return;
    
    this.socket.emit('ice-candidate', { interviewId, candidate, targetUserId });
  }

  notifyScreenShareStarted(interviewId) {
    if (!this.socket?.connected) return;
    
    console.log(`📤 [SOCKET] Notifying screen share started`);
    this.socket.emit('screen-share-started', { interviewId });
  }

  notifyScreenShareStopped(interviewId) {
    if (!this.socket?.connected) return;
    
    console.log(`📤 [SOCKET] Notifying screen share stopped`);
    this.socket.emit('screen-share-stopped', { interviewId });
  }

  requestScreenShare(interviewId, candidateId) {
    if (!this.socket?.connected) return;
    
    console.log(`📤 [SOCKET] Requesting screen share from ${candidateId}`);
    this.socket.emit('request-screen-share', { interviewId, candidateId });
  }

  on(event, handler) {
    if (!this.socket) return;
    
    this.socket.on(event, handler);
    this.eventHandlers[event] = handler;
  }

  off(event) {
    if (!this.socket || !this.eventHandlers[event]) return;
    
    this.socket.off(event, this.eventHandlers[event]);
    delete this.eventHandlers[event];
  }

  emit(event, data) {
    if (!this.socket?.connected) return;
    
    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();

