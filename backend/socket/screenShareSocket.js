/**
 * Screen Share Socket.IO Handler
 * Manages WebRTC signaling for screen sharing between candidates and recruiters
 * Supports multi-interview juggling for recruiters
 */

const jwt = require('jsonwebtoken');

// Store active connections
const activeConnections = new Map(); // Map<interviewId, Set<socketId>>
const userSockets = new Map(); // Map<userId, socketId>
const socketUsers = new Map(); // Map<socketId, {userId, role, interviewId}>

module.exports = (io) => {
  // Middleware: Authenticate socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // Allow connection without token for testing
        console.log('⚠️ [SOCKET] No token provided, using test mode');
        socket.isTestMode = true;
        return next();
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.isTestMode = false;
        
        console.log(`✅ [SOCKET] Authenticated: ${decoded.id} (${decoded.role})`);
        return next();
      } catch (jwtError) {
        console.error('❌ [SOCKET] JWT verification failed:', jwtError.message);
        // Allow connection anyway for testing
        socket.isTestMode = true;
        return next();
      }
    } catch (error) {
      console.error('❌ [SOCKET] Authentication error:', error.message);
      // Allow connection anyway for testing
      socket.isTestMode = true;
      next();
    }
  });

  io.on('connection', (socket) => {
    // Set userId to socket.id if in test mode
    if (socket.isTestMode && !socket.userId) {
      socket.userId = socket.id;
      socket.userRole = 'test';
      console.log(`⚠️ [SOCKET] Test mode: Using socket ID as user ID`);
    }
    
    console.log(`🔌 [SOCKET] Client connected: ${socket.id} (User: ${socket.userId})`);

    // Store user socket mapping
    userSockets.set(socket.userId, socket.id);

    // ==================== JOIN INTERVIEW ROOM ====================
    socket.on('join-interview', ({ interviewId, role }) => {
      try {
        console.log(`\n========================================`);
        console.log(`📥📥📥 [JOIN] User joining interview`);
        console.log(`User: ${socket.userId} (${socket.id})`);
        console.log(`Role: ${role}`);
        console.log(`Interview: ${interviewId}`);

        // Join the interview room
        socket.join(interviewId);

        // Track connection
        if (!activeConnections.has(interviewId)) {
          activeConnections.set(interviewId, new Set());
        }
        activeConnections.get(interviewId).add(socket.id);

        // Store socket metadata
        socketUsers.set(socket.id, {
          userId: socket.userId,
          role: role,
          interviewId: interviewId
        });

        // Check room membership
        const room = io.sockets.adapter.rooms.get(interviewId);
        console.log(`Room ${interviewId} now has ${room ? room.size : 0} members:`, room ? Array.from(room) : []);

        // Notify others in the room
        socket.to(interviewId).emit('user-joined', {
          userId: socket.userId,
          role: role,
          socketId: socket.id
        });

        // Send current participants to the new joiner
        const participants = Array.from(activeConnections.get(interviewId))
          .map(sid => socketUsers.get(sid))
          .filter(user => user && user.userId !== socket.userId);

        socket.emit('room-participants', {
          interviewId,
          participants
        });

        console.log(`✅ [JOIN] ${socket.userId} successfully joined. Total: ${activeConnections.get(interviewId).size}`);
        console.log(`========================================\n`);
      } catch (error) {
        console.error('❌ [JOIN] Error:', error);
        socket.emit('error', { message: 'Failed to join interview' });
      }
    });

    // ==================== WEBRTC SIGNALING ====================

    // Candidate sends offer to recruiter
    socket.on('offer', ({ interviewId, offer, targetUserId }) => {
      try {
        console.log(`📤 [OFFER] From ${socket.userId} to ${targetUserId || 'all'} in ${interviewId}`);

        const payload = {
          offer,
          from: socket.userId,
          fromSocketId: socket.id
        };

        if (targetUserId) {
          // Send to specific recruiter
          const targetSocketId = userSockets.get(targetUserId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('offer', payload);
            console.log(`✅ [OFFER] Sent to ${targetUserId}`);
          } else {
            console.log(`⚠️ [OFFER] Target user ${targetUserId} not connected`);
          }
        } else {
          // Broadcast to all recruiters in the room
          socket.to(interviewId).emit('offer', payload);
          console.log(`✅ [OFFER] Broadcast to room ${interviewId}`);
        }
      } catch (error) {
        console.error('❌ [OFFER] Error:', error);
      }
    });

    // Candidate sends answer to recruiter
    socket.on('answer', ({ interviewId, answer, targetUserId }) => {
      try {
        console.log(`\n========================================`);
        console.log(`📤📤📤 [ANSWER] RECEIVED FROM CANDIDATE`);
        console.log(`Interview ID: ${interviewId}`);
        console.log(`From: ${socket.userId} (${socket.id})`);
        console.log(`Has answer: ${!!answer}`);
        
        // Get everyone in the room
        const room = io.sockets.adapter.rooms.get(interviewId);
        console.log(`Room ${interviewId} has ${room ? room.size : 0} members:`, room ? Array.from(room) : []);

        const payload = {
          answer,
          from: socket.userId,
          fromSocketId: socket.id
        };

        // ALWAYS broadcast to entire room (simple and works)
        io.to(interviewId).emit('answer', payload);
        console.log(`✅ [ANSWER] Broadcast to ENTIRE room ${interviewId}`);
        console.log(`========================================\n`);
        
      } catch (error) {
        console.error('❌ [ANSWER] Error:', error);
      }
    });

    // ICE candidate exchange
    socket.on('ice-candidate', ({ interviewId, candidate, targetUserId }) => {
      try {
        console.log(`🧊 [ICE] From ${socket.userId} to ${targetUserId || 'all'}`);

        const payload = {
          candidate,
          from: socket.userId,
          fromSocketId: socket.id
        };

        if (targetUserId) {
          const targetSocketId = userSockets.get(targetUserId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('ice-candidate', payload);
          }
        } else {
          socket.to(interviewId).emit('ice-candidate', payload);
        }
      } catch (error) {
        console.error('❌ [ICE] Error:', error);
      }
    });

    // ==================== SCREEN SHARING CONTROL ====================

    // Candidate starts screen sharing
    socket.on('screen-share-started', ({ interviewId }) => {
      try {
        console.log(`🖥️ [SCREEN SHARE] Started by ${socket.userId} in ${interviewId}`);

        // Notify all recruiters in the room
        socket.to(interviewId).emit('screen-share-started', {
          candidateId: socket.userId,
          interviewId
        });
      } catch (error) {
        console.error('❌ [SCREEN SHARE START] Error:', error);
      }
    });

    // Candidate stops screen sharing
    socket.on('screen-share-stopped', ({ interviewId }) => {
      try {
        console.log(`🛑 [SCREEN SHARE] Stopped by ${socket.userId} in ${interviewId}`);

        // Notify all recruiters
        socket.to(interviewId).emit('screen-share-stopped', {
          candidateId: socket.userId,
          interviewId
        });
      } catch (error) {
        console.error('❌ [SCREEN SHARE STOP] Error:', error);
      }
    });

    // Recruiter requests screen share
    socket.on('request-screen-share', ({ interviewId, candidateId }) => {
      try {
        console.log(`📞 [REQUEST] Recruiter ${socket.userId} requesting screen from ${candidateId} in room ${interviewId}`);

        // Try to find candidate by ID first
        const candidateSocketId = userSockets.get(candidateId);
        if (candidateSocketId) {
          console.log(`✅ [REQUEST] Found candidate socket: ${candidateSocketId}`);
          io.to(candidateSocketId).emit('screen-share-requested', {
            recruiterId: socket.userId,
            interviewId
          });
        } else {
          // If not found, broadcast to entire room (for test mode)
          console.log(`⚠️ [REQUEST] Candidate not found, broadcasting to room ${interviewId}`);
          socket.to(interviewId).emit('screen-share-requested', {
            recruiterId: socket.userId,
            interviewId
          });
        }
      } catch (error) {
        console.error('❌ [REQUEST] Error:', error);
      }
    });

    // ==================== MULTI-INTERVIEW JUGGLING ====================

    // Recruiter subscribes to multiple interviews
    socket.on('subscribe-interviews', ({ interviewIds }) => {
      try {
        console.log(`📋 [SUBSCRIBE] ${socket.userId} subscribing to ${interviewIds.length} interviews`);

        interviewIds.forEach(interviewId => {
          socket.join(interviewId);
          
          if (!activeConnections.has(interviewId)) {
            activeConnections.set(interviewId, new Set());
          }
          activeConnections.get(interviewId).add(socket.id);
        });

        console.log(`✅ [SUBSCRIBE] Subscribed to ${interviewIds.length} interviews`);
      } catch (error) {
        console.error('❌ [SUBSCRIBE] Error:', error);
      }
    });

    // Recruiter unsubscribes from interview
    socket.on('unsubscribe-interview', ({ interviewId }) => {
      try {
        console.log(`📤 [UNSUBSCRIBE] ${socket.userId} unsubscribing from ${interviewId}`);

        socket.leave(interviewId);
        
        if (activeConnections.has(interviewId)) {
          activeConnections.get(interviewId).delete(socket.id);
        }
      } catch (error) {
        console.error('❌ [UNSUBSCRIBE] Error:', error);
      }
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', async () => {
      try {
        console.log(`🔌 [DISCONNECT] ${socket.id} (User: ${socket.userId})`);

        const userData = socketUsers.get(socket.id);
        
        if (userData) {
          const { interviewId, role } = userData;

          // If CANDIDATE disconnected, end their screen share session in database
          if (role === 'candidate' && interviewId) {
            try {
              const ScreenShareSession = require('../models/ScreenShareSession');
              
              // Extract base interview ID and candidate ID from the unique room ID
              // Format: interview_XXX_yrt5pgjvx_candidate_YYY
              const parts = interviewId.split('_');
              const baseInterviewId = parts.slice(0, 3).join('_'); // interview_XXX_yrt5pgjvx
              const candidateId = parts.slice(3).join('_'); // candidate_YYY
              
              console.log(`🔍 [DISCONNECT] Looking for session - Interview: ${baseInterviewId}, Candidate: ${candidateId}`);
              
              // Find session by base interview ID and candidate ID
              const session = await ScreenShareSession.findOne({
                interviewId: baseInterviewId,
                candidateId: candidateId,
                status: 'active'
              });
              
              if (session) {
                session.status = 'ended';
                session.endedAt = new Date();
                session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
                await session.save();
                
                console.log(`✅ [DISCONNECT] Ended session ${session._id} for candidate ${session.candidateId}`);
                
                // Notify dashboard to refresh immediately
                io.emit('session-ended', {
                  sessionId: session._id,
                  interviewId: session.interviewId,
                  candidateId: session.candidateId
                });
              } else {
                console.log(`⚠️ [DISCONNECT] No active session found for ${baseInterviewId} / ${candidateId}`);
              }
            } catch (error) {
              console.error('❌ [DISCONNECT] Error ending session:', error);
            }
          }

          // Notify others in the room
          if (interviewId) {
            socket.to(interviewId).emit('user-left', {
              userId: socket.userId,
              role
            });

            // Clean up connection tracking
            if (activeConnections.has(interviewId)) {
              activeConnections.get(interviewId).delete(socket.id);
              
              // Remove empty interview rooms
              if (activeConnections.get(interviewId).size === 0) {
                activeConnections.delete(interviewId);
              }
            }
          }
        }

        // Clean up mappings
        userSockets.delete(socket.userId);
        socketUsers.delete(socket.id);

        console.log(`✅ [DISCONNECT] Cleaned up ${socket.id}`);
      } catch (error) {
        console.error('❌ [DISCONNECT] Error:', error);
      }
    });

    // ==================== ERROR HANDLING ====================
    socket.on('error', (error) => {
      console.error(`❌ [SOCKET ERROR] ${socket.id}:`, error);
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    activeConnections.forEach((sockets, interviewId) => {
      if (sockets.size === 0) {
        activeConnections.delete(interviewId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 [CLEANUP] Removed ${cleaned} empty interview rooms`);
    }
  }, 60000); // Every minute

  console.log('✅ [SOCKET.IO] Screen share socket handlers initialized');
};
