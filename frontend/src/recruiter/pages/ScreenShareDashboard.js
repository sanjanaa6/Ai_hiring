import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Monitor, Users, Video, Clock, TrendingUp } from 'lucide-react';
import WorkingScreenShare from '../../components/WorkingScreenShare';
import axios from 'axios';
import io from 'socket.io-client';

// Get Socket.IO server URL (without /api path)
const getSocketUrl = () => {
  if (process.env.REACT_APP_API_URL) {
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
 * Screen Share Dashboard for Recruiters
 * Shows all active and scheduled interviews with "Join Meet" functionality
 */
const ScreenShareDashboard = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showScreenShare, setShowScreenShare] = useState(false);

  useEffect(() => {
    loadActiveSessions();
    const interval = setInterval(loadActiveSessions, 5000); // Refresh every 5s
    
    // Listen for real-time session-ended events from Socket.IO
    const socket = io(API_URL);
    
    socket.on('connect', () => {
      console.log('🔌 [DASHBOARD] Connected to Socket.IO for real-time updates');
    });
    
    socket.on('session-ended', (data) => {
      console.log('📥 [DASHBOARD] Session ended notification:', data);
      // Immediately refresh the list
      loadActiveSessions();
    });
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const loadActiveSessions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/screen-share/active`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (response.data.success) {
        // Filter out any sessions that aren't truly active
        const activeSessions = response.data.sessions.filter(s => s.status === 'active');
        setActiveSessions(activeSessions);
        console.log(`📊 [DASHBOARD] Loaded ${activeSessions.length} active sessions`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setLoading(false);
    }
  };

  const handleJoinMeet = (session) => {
    console.log('\n========================================');
    console.log('🎬 RECRUITER JOINING MEET');
    console.log('Session details:', session);
    console.log('Interview ID:', session.interviewId);
    console.log('Candidate ID:', session.candidateId);
    console.log('Candidate Name:', session.candidateName);
    console.log('========================================\n');
    setSelectedSession(session);
    setShowScreenShare(true);
  };

  const handleClose = () => {
    setShowScreenShare(false);
    setSelectedSession(null);
    loadActiveSessions(); // Refresh after closing
  };

  const getSessionDuration = (startedAt) => {
    const seconds = Math.floor((new Date() - new Date(startedAt)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Screen Share Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor and join candidate interviews in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                🟢 {activeSessions.length} Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Now</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeSessions.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Today</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeSessions.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {activeSessions.length > 0 
                    ? Math.floor(activeSessions.reduce((acc, s) => acc + s.duration, 0) / activeSessions.length) 
                    : 0}m
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  100%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Interview Sessions
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sessions...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="p-12 text-center">
              <Monitor className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Active Sessions
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                When candidates start their interviews, they'll appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Interview ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {session.candidateName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.candidateName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {session.candidateEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-mono">
                          {session.interviewId.substring(0, 12)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : session.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getSessionDuration(session.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.quality ? (
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Math.min(100, (session.quality.averageBitrate || 0) / 10)}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">Good</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleJoinMeet(session)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Meet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Screen Share Modal */}
      {showScreenShare && selectedSession && (
        <WorkingScreenShare
          interviewId={selectedSession.interviewId}
          candidateId={selectedSession.candidateId}
          role="recruiter"
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default ScreenShareDashboard;

