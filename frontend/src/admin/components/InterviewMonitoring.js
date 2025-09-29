import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import monitoringService from '../../services/monitoringService';

const InterviewMonitoring = () => {
  const [flaggedInterviews, setFlaggedInterviews] = useState([]);
  const [autoRemovedInterviews, setAutoRemovedInterviews] = useState([]);
  const [monitoringStats, setMonitoringStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('flagged'); // 'flagged' or 'auto-removed'

  // Load flagged interviews
  const loadFlaggedInterviews = async () => {
    try {
      setLoading(true);
      const response = await monitoringService.getFlaggedInterviews({
        page: currentPage,
        limit: 10,
        status: 'all'
      });
      
      setFlaggedInterviews(response.data.interviews);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to load flagged interviews');
      console.error('Error loading flagged interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load auto-removed interviews
  const loadAutoRemovedInterviews = async () => {
    try {
      setLoading(true);
      const response = await monitoringService.getAutoRemovedInterviews({
        page: currentPage,
        limit: 10
      });
      
      setAutoRemovedInterviews(response.data.interviews);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to load auto-removed interviews');
      console.error('Error loading auto-removed interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load monitoring statistics
  const loadMonitoringStats = async () => {
    try {
      const response = await monitoringService.getMonitoringStats(selectedTimeRange);
      setMonitoringStats(response.data);
    } catch (err) {
      console.error('Error loading monitoring stats:', err);
    }
  };

  // Clear interview flag
  const clearFlag = async (interviewId, reason) => {
    try {
      const adminId = localStorage.getItem('userId'); // Get from auth context in real app
      await monitoringService.clearInterviewFlag(interviewId, reason, adminId);
      await loadFlaggedInterviews();
      await loadMonitoringStats();
    } catch (err) {
      setError('Failed to clear flag');
      console.error('Error clearing flag:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'flagged') {
      loadFlaggedInterviews();
    } else if (activeTab === 'auto-removed') {
      loadAutoRemovedInterviews();
    }
    loadMonitoringStats();
  }, [currentPage, selectedTimeRange, activeTab]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && flaggedInterviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Monitoring</h1>
        <p className="text-gray-600">Monitor and manage flagged interviews for suspicious behavior</p>
      </div>

      {/* Statistics Cards */}
      {monitoringStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Flagged Interviews</p>
                <p className="text-2xl font-semibold text-gray-900">{monitoringStats.flaggedInterviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Violations</p>
                <p className="text-2xl font-semibold text-gray-900">{monitoringStats.totalViolations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Violation Time</p>
                <p className="text-2xl font-semibold text-gray-900">{formatDuration(monitoringStats.totalViolationTime)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Flag Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{monitoringStats.flagRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('flagged')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flagged'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Flagged Interviews</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                  {flaggedInterviews.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('auto-removed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'auto-removed'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>Auto-Removed</span>
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">
                  {autoRemovedInterviews.length}
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {/* Interviews Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'flagged' ? 'Flagged Interviews' : 'Auto-Removed Interviews'}
          </h3>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'flagged' ? 'Flag Reason' : 'Removal Reason'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Violations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'flagged' ? 'Flagged At' : 'Removed At'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'flagged' ? flaggedInterviews : autoRemovedInterviews).map((interview) => (
                <tr key={interview._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {interview.candidate?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {interview.candidate?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{interview.job?.title || 'Unknown Job'}</div>
                    <div className="text-sm text-gray-500">{interview.job?.company || 'Unknown Company'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {activeTab === 'flagged' 
                        ? (interview.monitoring?.flagReason || 'No reason provided')
                        : (interview.monitoring?.autoRemovalReason || 'No reason provided')
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {interview.monitoringData?.violations?.length || 0} violations
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDuration(interview.monitoringData?.totalViolationTime || 0)} total
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(activeTab === 'flagged' 
                      ? interview.monitoring?.flaggedAt 
                      : interview.monitoring?.autoRemovedAt
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {activeTab === 'flagged' ? (
                      <>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for clearing flag:');
                            if (reason) {
                              clearFlag(interview._id, reason);
                            }
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Clear Flag
                        </button>
                        <button
                          onClick={() => {
                            // View details - could open a modal
                            alert(`Interview ID: ${interview._id}\nFlag Reason: ${interview.monitoring?.flagReason}`);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          // View auto-removal details
                          alert(`Interview ID: ${interview._id}\nRemoval Reason: ${interview.monitoring?.autoRemovalReason}\nRemoved At: ${formatDate(interview.monitoring?.autoRemovedAt)}`);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewMonitoring;
