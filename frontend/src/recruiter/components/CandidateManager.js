import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import apiService from '../../services/apiService';
import {
  Users,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Pause,
  Play,
  Calendar,
  Star,
  Search,
  MoreVertical,
  X
} from 'lucide-react';

const CandidateManager = ({ interviewId, onClose }) => {
  const { isDarkMode } = useTheme();
  const [, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [interview, setInterview] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      // Use direct fetch for now since we don't have this method in apiService
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/candidates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setCandidates(result.data);
      } else {
        console.error('Failed to fetch candidates:', result.error);
        // Set empty array if candidates endpoint doesn't exist yet
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  const fetchInterviewAndSchedules = useCallback(async () => {
    try {
      // Fetch interview details with AI-generated rounds
      const interviewResult = await apiService.getInterview(interviewId);
      if (interviewResult.success) {
        setInterview(interviewResult.data);
      }
      
      // Fetch schedules - use direct fetch for now
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
          setSchedules(schedulesResult.data);
        } else {
          console.error('Failed to fetch schedules:', schedulesResult.error);
          setSchedules([]);
        }
      } catch (scheduleError) {
        console.error('Failed to fetch schedules:', scheduleError);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching interview and schedules:', error);
    }
  }, [interviewId]);

  useEffect(() => {
    if (interviewId) {
      fetchCandidates();
      fetchInterviewAndSchedules();
    }
  }, [interviewId, fetchCandidates, fetchInterviewAndSchedules]);

  const updateCandidateStatus = async (candidateId, newStatus, roundId = null) => {
    try {
      setLoading(true);
      // Use direct fetch for now since we don't have this method in apiService
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          roundId,
          updatedAt: new Date()
        })
      });
      const result = await response.json();

      if (result.success) {
        setCandidates(prev => prev.map(c => 
          c._id === candidateId 
            ? { ...c, status: newStatus, currentRound: roundId || c.currentRound, updatedAt: new Date() }
            : c
        ));
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (newStatus, roundId = null) => {
    try {
      setLoading(true);
      // Use direct fetch for now since we don't have this method in apiService
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/interviews/${interviewId}/candidates/bulk-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          status: newStatus,
          roundId,
          updatedAt: new Date()
        })
      });
      const result = await response.json();

      if (result.success) {
        setCandidates(prev => prev.map(c => 
          selectedCandidates.includes(c._id)
            ? { ...c, status: newStatus, currentRound: roundId || c.currentRound, updatedAt: new Date() }
            : c
        ));
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error('Error bulk updating candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      case 'rejected': return <UserX className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Helper function to get round information
  const getRoundInfo = (roundId) => {
    if (!interview || !interview.rounds) return null;
    return interview.rounds.find(round => round.roundId === roundId);
  };

  // Helper function to get schedule information
  const getScheduleInfo = (roundId) => {
    return schedules.find(schedule => schedule.roundId === roundId);
  };

  const getActionButtons = (candidate) => {
    const currentRoundIndex = schedules.findIndex(s => s._id === candidate.currentRound);
    const nextRound = schedules[currentRoundIndex + 1];
    const prevRound = schedules[currentRoundIndex - 1];

    return (
      <div className="flex items-center space-x-2">
        {/* Promote to Next Round */}
        {nextRound && candidate.status === 'passed' && (
          <button
            onClick={() => updateCandidateStatus(candidate._id, 'scheduled', nextRound._id)}
            className="flex items-center space-x-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            <span>Promote</span>
          </button>
        )}

        {/* Move to Previous Round */}
        {prevRound && (
          <button
            onClick={() => updateCandidateStatus(candidate._id, 'scheduled', prevRound._id)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Demote</span>
          </button>
        )}

        {/* Pass */}
        <button
          onClick={() => updateCandidateStatus(candidate._id, 'passed')}
          className="flex items-center space-x-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition-colors"
        >
          <CheckCircle className="w-3 h-3" />
          <span>Pass</span>
        </button>

        {/* Fail */}
        <button
          onClick={() => updateCandidateStatus(candidate._id, 'failed')}
          className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
        >
          <XCircle className="w-3 h-3" />
          <span>Fail</span>
        </button>

        {/* Hold */}
        <button
          onClick={() => updateCandidateStatus(candidate._id, 'on_hold')}
          className="flex items-center space-x-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-medium transition-colors"
        >
          <Pause className="w-3 h-3" />
          <span>Hold</span>
        </button>

        {/* Reject */}
        <button
          onClick={() => updateCandidateStatus(candidate._id, 'rejected')}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
        >
          <UserX className="w-3 h-3" />
          <span>Reject</span>
        </button>
      </div>
    );
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    const matchesRound = roundFilter === 'all' || candidate.currentRound === roundFilter;
    
    return matchesSearch && matchesStatus && matchesRound;
  });

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c._id));
    }
  };

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm z-50 flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
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
              <Users className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Candidate Management
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage candidate progression and status
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
          {/* Interview Info */}
          {interview && (
            <div className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {interview.title}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {interview.jobTitle} • {interview.rounds?.length || 0} AI-generated rounds • {candidates.length} candidates
              </p>
              {interview.rounds && interview.rounds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {interview.rounds.map((round) => {
                    const schedule = getScheduleInfo(round.roundId);
                    return (
                      <div
                        key={round.roundId}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule
                            ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {round.title} {schedule ? '✓' : '⏳'}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Rounds</option>
                  {interview && interview.rounds && interview.rounds.map(round => {
                    const schedule = getScheduleInfo(round.roundId);
                    return (
                      <option key={round.roundId} value={round.roundId}>
                        {round.title} {schedule ? '(Scheduled)' : '(Not Scheduled)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCandidates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {selectedCandidates.length} candidate(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => bulkUpdateStatus('passed')}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Pass All</span>
                    </button>
                    <button
                      onClick={() => bulkUpdateStatus('failed')}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Fail All</span>
                    </button>
                    <button
                      onClick={() => bulkUpdateStatus('on_hold')}
                      className="flex items-center space-x-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Hold All</span>
                    </button>
                    <button
                      onClick={() => bulkUpdateStatus('rejected')}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Reject All</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Candidates Table */}
          <div className={`rounded-xl border overflow-hidden ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`overflow-x-auto ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Candidate
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Current Round
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Score
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate._id} className={`hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate._id)}
                          onChange={() => handleSelectCandidate(candidate._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}>
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {candidate.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {candidate.name || 'Unknown'}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {candidate.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {(() => {
                            const roundInfo = getRoundInfo(candidate.currentRound);
                            const scheduleInfo = getScheduleInfo(candidate.currentRound);
                            if (roundInfo) {
                              return (
                                <>
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {roundInfo.title}
                                  </span>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Round {roundInfo.roundNumber} • {roundInfo.duration}min
                                    {scheduleInfo ? ' • Scheduled' : ' • Not Scheduled'}
                                  </span>
                                </>
                              );
                            }
                            return (
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Not Assigned
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(candidate.status)}`}>
                          {getStatusIcon(candidate.status)}
                          <span>{candidate.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Star className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {candidate.score || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getActionButtons(candidate)}
                          <button className={`p-1 rounded transition-colors ${
                            isDarkMode
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          }`}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredCandidates.length === 0 && (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No candidates found.</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CandidateManager;
