import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';
import { Calendar, Clock, Users, Plus, Edit3, Trash2, X, CheckCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

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
      
      // Fetch existing round schedules - we need to add this method to apiService
      // For now, let's use a direct axios call
      try {
        const token = localStorage.getItem('token');
        const apiBaseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://aihire.eval8.xyz/api' 
          : 'http://localhost:5000/api';
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
        // Set empty array if schedules endpoint doesn't exist yet
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
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
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
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
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
                Schedule AI-generated interview rounds
              </p>
            </div>
          </div>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Loading State */}
          {loading && (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Loading interview data...</p>
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
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, startDate: e.target.value }))}
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
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
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
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, endDate: e.target.value }))}
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
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
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
                      disabled={!selectedRound || !newSchedule.startDate || !newSchedule.startTime || !newSchedule.endDate || !newSchedule.endTime}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !selectedRound || !newSchedule.startDate || !newSchedule.startTime || !newSchedule.endDate || !newSchedule.endTime
                          ? isDarkMode
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                        </div>
                        
                        {schedule.description && (
                          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {schedule.description}
                          </p>
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
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewScheduler;