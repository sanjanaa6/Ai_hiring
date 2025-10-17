/**
 * WebRTC Service for Screen Sharing + Audio
 * Enforces FULL SCREEN sharing only (guardrail)
 * Supports two-way audio communication
 */

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  /**
   * Get display media with FULL SCREEN enforcement
   * GUARDRAIL: Only allows entire screen, blocks tab/window share
   */
  async getDisplayMedia() {
    try {
      console.log('📹 [WEBRTC] Requesting screen/tab share...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false // Screen audio separate
      });

      // Log what was shared
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      console.log('🔍 [WEBRTC] Screen share settings:', {
        displaySurface: settings.displaySurface,
        width: settings.width,
        height: settings.height
      });

      this.localStream = stream;
      console.log('✅ [WEBRTC] Screen share started');
      return stream;
    } catch (error) {
      console.error('❌ [WEBRTC] Screen share error:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No screen found to share.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get user microphone for audio communication
   */
  async getUserAudio() {
    try {
      console.log('🎤 [WEBRTC] Requesting microphone access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      console.log('✅ [WEBRTC] Microphone access granted');
      return stream;
    } catch (error) {
      console.error('❌ [WEBRTC] Microphone error:', error);
      
      if (error.name === 'NotAllowedError') {
        console.warn('⚠️ [WEBRTC] Microphone permission denied - continuing without audio');
      }
      
      return null;
    }
  }

  /**
   * Create RTCPeerConnection
   */
  createPeerConnection(onIceCandidate, onTrack) {
    if (this.peerConnection) {
      console.warn('⚠️ [WEBRTC] Peer connection already exists');
      return;
    }

    console.log('🔗 [WEBRTC] Creating peer connection...');

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // ICE candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 [WEBRTC] ICE candidate generated');
        onIceCandidate(event.candidate);
      }
    };

    // Remote track handler
    this.peerConnection.ontrack = (event) => {
      console.log('📥 [WEBRTC] Remote track received:', event.track.kind);
      onTrack(event);
    };

    // Connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      console.log(`🔄 [WEBRTC] Connection state: ${this.peerConnection.connectionState}`);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 [WEBRTC] ICE state: ${this.peerConnection.iceConnectionState}`);
    };

    console.log('✅ [WEBRTC] Peer connection created');
  }

  /**
   * Add local stream tracks to peer connection
   */
  addLocalTracks(stream) {
    if (!this.peerConnection) {
      console.error('❌ [WEBRTC] No peer connection');
      return;
    }

    stream.getTracks().forEach((track) => {
      console.log(`📤 [WEBRTC] Adding ${track.kind} track`);
      this.peerConnection.addTrack(track, stream);
    });
  }

  /**
   * Create offer (recruiter side)
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    console.log('📤 [WEBRTC] Creating offer...');

    const offer = await this.peerConnection.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true
    });

    await this.peerConnection.setLocalDescription(offer);
    console.log('✅ [WEBRTC] Offer created');

    return offer;
  }

  /**
   * Create answer (candidate side)
   */
  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    console.log('📤 [WEBRTC] Creating answer...');

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log('✅ [WEBRTC] Answer created');

    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    console.log('📥 [WEBRTC] Setting remote description:', description.type);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    console.log('✅ [WEBRTC] Remote description set');
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      console.error('❌ [WEBRTC] No peer connection for ICE candidate');
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ [WEBRTC] ICE candidate added');
    } catch (error) {
      console.error('❌ [WEBRTC] Failed to add ICE candidate:', error);
    }
  }

  /**
   * Close peer connection and stop all tracks
   */
  closePeerConnection() {
    if (this.peerConnection) {
      console.log('🔌 [WEBRTC] Closing peer connection...');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      console.log('🛑 [WEBRTC] Stopping local stream...');
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    console.log('✅ [WEBRTC] Cleanup complete');
  }

  /**
   * Mute/unmute audio track
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        console.log(`🎤 [WEBRTC] Audio ${enabled ? 'enabled' : 'disabled'}`);
      }
    }
  }

  /**
   * Get connection stats
   */
  async getStats() {
    if (!this.peerConnection) return null;

    const stats = await this.peerConnection.getStats();
    return stats;
  }
}

export default new WebRTCService();

