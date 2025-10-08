import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';
import { Calendar, Clock, Users, Plus, Edit3, Trash2, X, CheckCircle, Play, Timer, AlertCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentRoundStatus, formatTimeRemaining, getTimeUntilStart, getTimeUntilEnd } from '../../utils/timeValidation';
import CandidateAccessValidator from '../../components/CandidateAccessValidator';
import RoundNotificationSystem from '../../components/RoundNotificationSystem';

const InterviewScheduler = ({ interviewId, onClose }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  const [roundSchedules, setRoundSchedules] = useState([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    maxCandidates: 10,
    status: 'scheduled'
  });
  const [autoStatusUpdates, setAutoStatusUpdates] = useState(true);
  const [showCandidateView, setShowCandidateView] = useState(false);

  const fetchInterviewAndSchedules = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch interview details with AI-generated rounds
      const interviewResult = await apiService.getInterview(interviewId);
      
      if (interviewResult.success) {
        setInterview(interviewResult.data);
      } else {
        console.error('Failed to fetch interview:', interviewResult.error);
      }
      
      // Fetch existing round schedules
      try {
        const token = localStorage.getItem('token');
        const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
          ? `${window.location.origin.replace(/\/$/, '')}/api` 
          : 'http://localhost:5000/api');
        const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/schedules`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const schedulesResult = await response.json();
        
        if (schedulesResult.success) {
          setRoundSchedules(schedulesResult.data);
        } else {
          console.error('Failed to fetch schedules:', schedulesResult.error);
        }
      } catch (scheduleError) {
        console.error('Failed to fetch schedules:', scheduleError);
        setRoundSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching interview and schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    if (interviewId) {
      fetchInterviewAndSchedules();
    }
  }, [interviewId, fetchInterviewAndSchedules]);

  // Auto-update round statuses based on current time
  useEffect(() => {
    if (!autoStatusUpdates || roundSchedules.length === 0) return;

    const updateStatuses = () => {
      setRoundSchedules(prevSchedules => 
        prevSchedules.map(schedule => {
          const currentStatus = getCurrentRoundStatus(
            schedule.startDateTime, 
            schedule.endDateTime, 
            schedule.status
          );
          
          // Only update if status has changed
          if (currentStatus !== schedule.status) {
            return { ...schedule, status: currentStatus };
          }
          return schedule;
        })
      );
    };

    // Update immediately
    updateStatuses();

    // Update every minute
    const interval = setInterval(updateStatuses, 60000);

    return () => clearInterval(interval);
  }, [autoStatusUpdates, roundSchedules.length]);

  const handleAddSchedule = async () => {
    if (!selectedRound) return;
    
    try {
      setLoading(true);
      const scheduleData = {
        roundId: selectedRound.roundId,
        roundName: selectedRound.title,
        roundNumber: selectedRound.roundNumber,
        startDateTime: new Date(`${newSchedule.startDate}T${newSchedule.startTime}`),
        endDateTime: new Date(`${newSchedule.endDate}T${newSchedule.endTime}`),
        duration: selectedRound.duration,
        maxCandidates: newSchedule.maxCandidates,
        description: selectedRound.description,
        requirements: selectedRound.evaluationCriteria ? 
          Object.values(selectedRound.evaluationCriteria).join(', ') : '',
        status: newSchedule.status
      };

      // Use direct fetch for now since we don't have this method in apiService
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
        ? `${window.location.origin.replace(/\/$/, '')}/api` 
        : 'http://localhost:5000/api');
      console.log('🔍 [SCHEDULER] Creating schedule:', scheduleData);
      console.log('🔍 [SCHEDULER] Interview ID:', interviewId);
      
      const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      console.log('📊 [SCHEDULER] Response status:', response.status);
      const result = await response.json();
      console.log('📊 [SCHEDULER] Response data:', result);
      if (result.success) {
        setRoundSchedules(prev => [...prev, result.data]);
        setNewSchedule({
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          maxCandidates: 10,
          status: 'scheduled'
        });
        setSelectedRound(null);
        setShowAddSchedule(false);
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      setLoading(true);
      // Use direct fetch for now since we don't have this method in apiService
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
        ? `${window.location.origin.replace(/\/$/, '')}/api` 
        : 'http://localhost:5000/api');
      const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setRoundSchedules(prev => prev.filter(s => s._id !== scheduleId));
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccessLink = (accessLink) => {
    const fullUrl = `${window.location.origin}/round/${accessLink}`;
    navigator.clipboard.writeText(fullUrl);
    // You could add a toast notification here
    alert('Access link copied to clipboard!');
  };

  const handleRegenerateAccessLink = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to regenerate the access link? The old link will no longer work.')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/schedules/${scheduleId}/regenerate-link`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        // Update the schedule in the list
        setRoundSchedules(prev => prev.map(s => 
          s._id === scheduleId 
            ? { ...s, accessLink: result.data.schedule.accessLink, accessCode: result.data.schedule.accessCode }
            : s
        ));
        alert('Access link regenerated successfully!');
      }
    } catch (error) {
      console.error('Error regenerating access link:', error);
      alert('Failed to regenerate access link');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'ended': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm z-50 flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-100'
            }`}>
              <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                AI Interview Round Scheduler
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Schedule AI-generated interview rounds with time-based access control
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Auto Status Updates Toggle */}
            <div className="flex items-center space-x-2">
              <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Auto Updates
              </label>
              <button
                onClick={() => setAutoStatusUpdates(!autoStatusUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoStatusUpdates 
                    ? 'bg-blue-600' 
                    : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoStatusUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Candidate View Toggle */}
            <button
              onClick={() => setShowCandidateView(!showCandidateView)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                showCandidateView
                  ? isDarkMode
                    ? 'bg-green-600 text-white'
                    : 'bg-green-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {showCandidateView ? 'Recruiter View' : 'Candidate View'}
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Notification System */}
          <RoundNotificationSystem 
            schedules={roundSchedules}
            onStatusChange={(notifications) => {
              console.log('Round status notifications:', notifications);
            }}
            enableNotifications={true}
            autoRefresh={autoStatusUpdates}
          />

          {/* Loading State */}
          {loading && (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Loading interview data...</p>
            </div>
          )}

          {/* Candidate View */}
          {showCandidateView && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Candidate Access View
              </h3>
              {roundSchedules.length > 0 ? (
                <div className="space-y-4">
                  {roundSchedules.map((schedule) => (
                    <CandidateAccessValidator
                      key={schedule._id}
                      schedule={schedule}
                      onAccessGranted={(validation) => {
                        console.log('Access granted for:', schedule.roundName, validation);
                      }}
                      onAccessDenied={(validation) => {
                        console.log('Access denied for:', schedule.roundName, validation);
                      }}
                      showCountdown={true}
                      autoRefresh={autoStatusUpdates}
                    />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled rounds available for candidates.</p>
                </div>
              )}
            </div>
          )}

          {/* Interview Info */}
          {interview && (
            <div className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {interview.title}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {interview.jobTitle} • {interview.rounds?.length || 0} AI-generated rounds
              </p>
              
              {/* Access Links Section */}
              {interview.accessLinks && interview.accessLinks.length > 0 && (
                <div className="mt-4">
                  <h4 className={`text-md font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Round Access Links
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interview.accessLinks.map((accessLink) => {
                      const isScheduled = roundSchedules.some(schedule => schedule.roundNumber === accessLink.roundNumber);
                      const round = interview.rounds?.find(r => r.roundNumber === accessLink.roundNumber);
                      
                      return (
                        <div
                          key={accessLink.accessLink}
                          className={`p-3 rounded-lg border ${
                            isScheduled
                              ? isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                              : isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {round?.title || `Round ${accessLink.roundNumber}`}
                              </h5>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {isScheduled ? 'Scheduled' : 'Not Scheduled'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCopyAccessLink(accessLink.accessLink)}
                                className={`p-1 rounded transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                                title="Copy access link"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => window.open(`/round/${accessLink.accessLink}`, '_blank')}
                                className={`p-1 rounded transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <code className={`text-xs px-2 py-1 rounded ${
                              isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'
                            }`}>
                              {`${window.location.origin}/round/${accessLink.accessLink}`}
                            </code>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Interview Found */}
          {!loading && !interview && (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No interview found with ID: {interviewId}</p>
              <p className="text-sm mt-1">Please check if the interview exists and you have access to it.</p>
            </div>
          )}

          {/* Add Schedule Button */}
          {interview && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddSchedule(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Schedule AI Round</span>
              </button>
            </div>
          )}

          {/* AI-Generated Rounds Selection */}
          {showAddSchedule && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Select AI-Generated Round to Schedule
              </h3>
              
              {interview && interview.rounds && interview.rounds.length > 0 ? (
                <div className="space-y-4">
                  {/* Round Selection */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {interview.rounds.map((round) => {
                        const isScheduled = roundSchedules.some(schedule => schedule.roundId === round.roundId);
                        return (
                          <div
                            key={round.roundId}
                            onClick={() => !isScheduled && setSelectedRound(round)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedRound?.roundId === round.roundId
                                ? isDarkMode 
                                  ? 'border-blue-500 bg-blue-900/20' 
                                  : 'border-blue-500 bg-blue-50'
                                : isScheduled
                                  ? isDarkMode
                                    ? 'border-gray-600 bg-gray-700/50 cursor-not-allowed opacity-50'
                                    : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                                  : isDarkMode
                                    ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {round.title}
                                </h4>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Round {round.roundNumber} • {round.duration} minutes
                                </p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {round.questions?.length || 0} questions
                                </p>
                              </div>
                              {isScheduled && (
                                <div className={`px-2 py-1 rounded-full text-xs ${
                                  isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                                }`}>
                                  Scheduled
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Schedule Form - Only show when round is selected */}
                  {selectedRound && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newSchedule.startDate}
                          onChange={(e) => {
                            console.log('Start date changed:', e.target.value);
                            setNewSchedule(prev => ({ ...prev, startDate: e.target.value }));
                          }}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={newSchedule.startTime}
                          onChange={(e) => {
                            console.log('Start time changed:', e.target.value);
                            setNewSchedule(prev => ({ ...prev, startTime: e.target.value }));
                          }}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newSchedule.endDate}
                          onChange={(e) => {
                            console.log('End date changed:', e.target.value);
                            setNewSchedule(prev => ({ ...prev, endDate: e.target.value }));
                          }}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          End Time
                        </label>
                        <input
                          type="time"
                          value={newSchedule.endTime}
                          onChange={(e) => {
                            console.log('End time changed:', e.target.value);
                            setNewSchedule(prev => ({ ...prev, endTime: e.target.value }));
                          }}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Max Candidates
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newSchedule.maxCandidates}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, maxCandidates: parseInt(e.target.value) }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Status
                        </label>
                        <select
                          value={newSchedule.status}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, status: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Debug Info */}
                  <div className={`p-3 rounded-lg text-xs ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <strong>Debug Info:</strong><br/>
                    selectedRound: {selectedRound ? 'Selected' : 'Not Selected'}<br/>
                    startDate: "{newSchedule.startDate}"<br/>
                    startTime: "{newSchedule.startTime}"<br/>
                    endDate: "{newSchedule.endDate}"<br/>
                    endTime: "{newSchedule.endTime}"<br/>
                    Button enabled: {(!selectedRound || !newSchedule.startDate || !newSchedule.startTime || !newSchedule.endDate || !newSchedule.endTime) ? 'NO' : 'YES'}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowAddSchedule(false);
                        setSelectedRound(null);
                        setNewSchedule({
                          startDate: '',
                          startTime: '',
                          endDate: '',
                          endTime: '',
                          maxCandidates: 10,
                          status: 'scheduled'
                        });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSchedule}
                      disabled={false}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !selectedRound || !newSchedule.startDate || !newSchedule.startTime || !newSchedule.endDate || !newSchedule.endTime
                          ? isDarkMode
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      title={`Debug: selectedRound=${!!selectedRound}, startDate=${!!newSchedule.startDate}, startTime=${!!newSchedule.startTime}, endDate=${!!newSchedule.endDate}, endTime=${!!newSchedule.endTime}`}
                    >
                      Schedule Round
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No AI-generated rounds found for this interview.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Scheduled Rounds List */}
          {!showCandidateView && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Scheduled Rounds
              </h3>
            
            {loading ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading schedules...</p>
              </div>
            ) : roundSchedules.length > 0 ? (
              <div className="space-y-4">
                {roundSchedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {schedule.roundName}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(schedule.status)}
                              <span className="capitalize">{schedule.status}</span>
                            </div>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                              {formatDateTime(schedule.startDateTime)} - {formatDateTime(schedule.endDateTime)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                              {schedule.duration} minutes
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                              Max {schedule.maxCandidates} candidates
                            </span>
                          </div>

                          {/* Real-time Countdown Timer */}
                          {autoStatusUpdates && (
                            <div className="flex items-center space-x-2">
                              <Timer className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                {(() => {
                                  const now = new Date();
                                  const start = new Date(schedule.startDateTime);
                                  const end = new Date(schedule.endDateTime);
                                  
                                  if (now < start) {
                                    const timeUntil = getTimeUntilStart(schedule.startDateTime);
                                    return `Starts in ${formatTimeRemaining(timeUntil)}`;
                                  } else if (now >= start && now <= end) {
                                    const timeUntil = getTimeUntilEnd(schedule.endDateTime);
                                    return `Ends in ${formatTimeRemaining(timeUntil)}`;
                                  } else {
                                    return 'Round ended';
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {schedule.description && (
                          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {schedule.description}
                          </p>
                        )}

                        {/* Access Link Section */}
                        {schedule.accessLink && (
                          <div className={`mt-4 p-3 rounded-lg ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium mb-1 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Candidate Access Link:
                                </p>
                                <div className="flex items-center space-x-2">
                                  <code className={`text-xs px-2 py-1 rounded ${
                                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'
                                  }`}>
                                    {`${window.location.origin}/round/${schedule.accessLink}`}
                                  </code>
                                  <button
                                    onClick={() => handleCopyAccessLink(schedule.accessLink)}
                                    className={`p-1 rounded transition-colors ${
                                      isDarkMode
                                        ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                    }`}
                                    title="Copy access link"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => window.open(`/round/${schedule.accessLink}`, '_blank')}
                                    className={`p-1 rounded transition-colors ${
                                      isDarkMode
                                        ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                    }`}
                                    title="Open in new tab"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRegenerateAccessLink(schedule._id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                                title="Regenerate access link"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {/* TODO: Implement edit functionality */}}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                              : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No rounds scheduled yet.</p>
                <p className="text-sm mt-1">Click "Schedule AI Round" to get started.</p>
              </div>
            )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewScheduler;