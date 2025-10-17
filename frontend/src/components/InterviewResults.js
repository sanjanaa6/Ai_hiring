import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import ModernInterviewAnalytics from './ModernInterviewAnalytics';
import { 
  Trophy, 
  Clock, 
  Users, 
  BarChart3, 
  Play, 
  Pause, 
  Volume2, 
  FileText, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  ExternalLink,
  Code,
  Settings
} from 'lucide-react';

const InterviewResults = ({ interviewId, onClose }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [candidateReport, setCandidateReport] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'candidates', 'recordings', 'reports'
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'score', 'time', 'completion'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'excellent', 'good', 'satisfactory', 'needsImprovement'
  const [expandedCandidates, setExpandedCandidates] = useState({});
  const [playingRecording, setPlayingRecording] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const loadInterviewResults = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [DEBUG] Calling API with interviewId:', interviewId);
      const result = await apiService.getInterviewResults(interviewId);
      if (result.success) {
        setResults(result.data);
      } else {
        console.error('Failed to load interview results:', result.error);
      }
    } catch (error) {
      console.error('Error loading interview results:', error);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    console.log('🔍 [DEBUG] InterviewResults received interviewId:', interviewId);
    if (interviewId) {
      loadInterviewResults();
    }
  }, [interviewId, loadInterviewResults]);

  const loadCandidateReport = async (candidateId) => {
    try {
      const result = await apiService.getCandidateReport(interviewId, candidateId);
      if (result.success) {
        setCandidateReport(result.data);
      } else {
        console.error('Failed to load candidate report:', result.error);
      }
    } catch (error) {
      console.error('Error loading candidate report:', error);
    }
  };

  const loadRecordings = async () => {
    try {
      const result = await apiService.getInterviewRecordings(interviewId);
      if (result.success) {
        setRecordings(result.data.recordings || []);
      } else {
        console.error('Failed to load recordings:', result.error);
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const toggleCandidateExpansion = (candidateId) => {
    setExpandedCandidates(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortedCandidates = () => {
    if (!results?.rankedCandidates) return [];
    
    let sorted = [...results.rankedCandidates];
    
    // Apply filter
    if (filterBy !== 'all') {
      sorted = sorted.filter(candidate => {
        switch (filterBy) {
          case 'excellent':
            return candidate.averageScore >= 3.5;
          case 'good':
            return candidate.averageScore >= 2.5 && candidate.averageScore < 3.5;
          case 'satisfactory':
            return candidate.averageScore >= 1.5 && candidate.averageScore < 2.5;
          case 'needsImprovement':
            return candidate.averageScore < 1.5;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'score':
          aValue = a.averageScore;
          bValue = b.averageScore;
          break;
        case 'time':
          aValue = a.totalTimeSpent;
          bValue = b.totalTimeSpent;
          break;
        case 'completion':
          aValue = a.completionPercentage;
          bValue = b.completionPercentage;
          break;
        default:
          aValue = a.rank;
          bValue = b.rank;
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
    
    return sorted;
  };


  const getScoreIcon = (score) => {
    if (score >= 3.5) return <Trophy className="w-4 h-4" />;
    if (score >= 2.5) return <Star className="w-4 h-4" />;
    if (score >= 1.5) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };


  if (loading) {
    return (
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm z-50 flex items-center justify-center`}>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading interview results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm z-50 flex items-center justify-center`}>
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 text-center`}>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Failed to Load Results
          </h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Unable to load interview results. Please try again.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-sm z-50 overflow-y-auto`}>
      <div className="min-h-screen p-4">
        <div className={`max-w-7xl mx-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl`}>
          {/* Header */}
          <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-slate-900/50 border-b border-blue-500/30' : 'bg-gradient-to-r from-blue-600 to-slate-700'} rounded-t-2xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                  📊 Interview Results
                </h1>
                <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-100'} text-lg`}>
                  {results.interview.title} - {results.interview.jobTitle}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/recruiter/review/${interviewId}`)}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'} text-white transition-colors flex items-center space-x-2`}
                  title="Manage Interview & View Submissions"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage Interview</span>
                </button>
                <button
                  onClick={() => setShowAnalytics(true)}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors flex items-center space-x-2`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-white/20 hover:bg-white/30'} transition-colors`}
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'} p-4`}>
            <div className="flex space-x-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'candidates', label: 'Candidates', icon: Users },
                { id: 'recordings', label: 'Recordings', icon: Volume2 },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'formSubmissions', label: 'Form Submissions', icon: FileText },
                { id: 'fileUploads', label: 'File Upload Rounds', icon: Download },
                { id: 'systemDesign', label: 'System Design', icon: Code },
                { id: 'pcbSubmissions', label: 'PCB Submissions', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'recordings') {
                      loadRecordings();
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-600 text-white'
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Analytics Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Candidates</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {results.analytics.overview.totalCandidates}
                          </p>
                        </div>
                        <Users className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Score</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {results.analytics.overview.averageScore.toFixed(1)}/4
                          </p>
                        </div>
                        <BarChart3 className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completion Rate</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {results.analytics.overview.completionRate.toFixed(1)}%
                          </p>
                        </div>
                        <CheckCircle className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                    </div>

                    <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Time</p>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatTime(results.analytics.timeAnalytics.totalInterviewTime)}
                          </p>
                        </div>
                        <Clock className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      📈 Score Distribution
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Excellent (3.5+)', count: results.analytics.scoreDistribution.excellent, color: 'bg-green-500' },
                        { label: 'Good (2.5-3.4)', count: results.analytics.scoreDistribution.good, color: 'bg-blue-500' },
                        { label: 'Satisfactory (1.5-2.4)', count: results.analytics.scoreDistribution.satisfactory, color: 'bg-yellow-500' },
                        { label: 'Needs Improvement (&lt;1.5)', count: results.analytics.scoreDistribution.needsImprovement, color: 'bg-red-500' }
                      ].map((item, index) => (
                        <div key={index} className="text-center">
                          <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                            <span className="text-white font-bold text-lg">{item.count}</span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Performer */}
                  {results.summary.topPerformer && (
                    <div className={`${isDarkMode ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'} rounded-xl p-6`}>
                      <div className="flex items-center space-x-4">
                        <Trophy className="w-12 h-12 text-yellow-500" />
                        <div>
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            🏆 Top Performer
                          </h3>
                          <p className={`text-lg ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            {results.summary.topPerformer.candidateName} - {results.summary.topPerformer.averageScore.toFixed(1)}/4
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {results.summary.recommendations && results.summary.recommendations.length > 0 && (
                    <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                        💡 Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {results.summary.recommendations.map((rec, index) => (
                          <li key={index} className={`flex items-start space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'candidates' && (
                <motion.div
                  key="candidates"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Filters and Sorting */}
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-4`}>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                          value={filterBy}
                          onChange={(e) => setFilterBy(e.target.value)}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="all">All Candidates</option>
                          <option value="excellent">Excellent (3.5+)</option>
                          <option value="good">Good (2.5-3.4)</option>
                          <option value="satisfactory">Satisfactory (1.5-2.4)</option>
                          <option value="needsImprovement">Needs Improvement (&lt;1.5)</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sort by:</span>
                        {[
                          { key: 'rank', label: 'Rank' },
                          { key: 'score', label: 'Score' },
                          { key: 'time', label: 'Time' },
                          { key: 'completion', label: 'Completion' }
                        ].map(sort => (
                          <button
                            key={sort.key}
                            onClick={() => handleSort(sort.key)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              sortBy === sort.key
                                ? isDarkMode 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-600 text-white'
                                : isDarkMode 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span>{sort.label}</span>
                            {sortBy === sort.key && (
                              sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Candidates Table */}
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Rank
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Candidate
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Score
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Time
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Completion
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                          {getSortedCandidates().map((candidate) => (
                            <tr key={candidate.candidateId} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {candidate.rank <= 3 ? (
                                    <Trophy className={`w-5 h-5 ${
                                      candidate.rank === 1 ? 'text-yellow-500' :
                                      candidate.rank === 2 ? 'text-gray-400' :
                                      'text-orange-600'
                                    }`} />
                                  ) : (
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      #{candidate.rank}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                    candidate.averageScore >= 3.5 ? 'bg-green-500' :
                                    candidate.averageScore >= 2.5 ? 'bg-blue-500' :
                                    candidate.averageScore >= 1.5 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}>
                                    {candidate.candidateName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-4">
                                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {candidate.candidateName}
                                    </div>
                                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {candidate.candidateEmail}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getScoreIcon(candidate.averageScore)}
                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {candidate.averageScore.toFixed(1)}/4
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {formatTime(candidate.totalTimeSpent)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                                    <div 
                                      className={`h-2 rounded-full ${
                                        candidate.completionPercentage >= 100 ? 'bg-green-500' :
                                        candidate.completionPercentage >= 75 ? 'bg-blue-500' :
                                        candidate.completionPercentage >= 50 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(candidate.completionPercentage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {candidate.completionPercentage.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => loadCandidateReport(candidate.candidateId)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      isDarkMode 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                  >
                                    <Eye className="w-3 h-3 inline mr-1" />
                                    Report
                                  </button>
                                  {candidate.feedbackReport?.pdfUrl && (
                                    <a
                                      href={`${window.location.protocol}//${window.location.hostname}:5000${candidate.feedbackReport.pdfUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`px-3 py-1 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                      title="Download AI-generated feedback PDF"
                                    >
                                      <FileText className="w-3 h-3 inline mr-1" />
                                      Feedback PDF
                                    </a>
                                  )}
                                  <button
                                    onClick={() => toggleCandidateExpansion(candidate.candidateId)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      expandedCandidates[candidate.candidateId]
                                        ? isDarkMode 
                                          ? 'bg-gray-600 text-white' 
                                          : 'bg-gray-600 text-white'
                                        : isDarkMode 
                                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {expandedCandidates[candidate.candidateId] ? (
                                      <ChevronUp className="w-3 h-3 inline mr-1" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 inline mr-1" />
                                    )}
                                    Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'recordings' && (
                <motion.div
                  key="recordings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      🎤 Interview Recordings
                    </h3>
                    {recordings.length > 0 ? (
                      <div className="space-y-4">
                        {recordings.map((recording, index) => (
                          <div key={index} className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-blue-500`}>
                                  {recording.candidateName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {recording.candidateName}
                                  </h4>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {recording.question}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {formatTime(Math.round(recording.duration / 1000 / 60))}
                                </span>
                                <button
                                  onClick={() => setPlayingRecording(playingRecording === index ? null : index)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isDarkMode 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {playingRecording === index ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No recordings available for this interview
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      📋 Detailed Reports
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                      Click on a candidate to view their detailed interview report with comprehensive analysis.
                    </p>
                    
                    {candidateReport ? (
                      <div className="space-y-6">
                        {/* Candidate Report Content */}
                        <div className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-6`}>
                          <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                            📊 {candidateReport.candidate.candidateName} - Detailed Report
                          </h4>
                          
                          {/* Performance Summary */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidateReport.performance.overall.averageScore.toFixed(1)}/4
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Score</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidateReport.performance.overall.completionPercentage.toFixed(0)}%
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completion</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatTime(candidateReport.performance.overall.totalTimeSpent)}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Time</div>
                            </div>
                          </div>

                          {/* Round Performance */}
                          <div className="space-y-4">
                            <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Round Performance</h5>
                            {candidateReport.performance.byRound.map((round, index) => (
                              <div key={index} className={`${isDarkMode ? 'bg-gray-600 border border-gray-500' : 'bg-white border border-gray-200'} rounded-lg p-4`}>
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {round.title}
                                  </h6>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    round.averageScore >= 3.5 ? 'bg-green-100 text-green-800' :
                                    round.averageScore >= 2.5 ? 'bg-blue-100 text-blue-800' :
                                    round.averageScore >= 1.5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {round.averageScore.toFixed(1)}/4
                                  </span>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                                  {round.answeredQuestions}/{round.questionCount} questions answered
                                </p>
                                <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                                  <div 
                                    className={`h-2 rounded-full ${
                                      round.completionRate >= 100 ? 'bg-green-500' :
                                      round.completionRate >= 75 ? 'bg-blue-500' :
                                      round.completionRate >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${round.completionRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Detailed Questions & Answers */}
                          <div className="mt-6">
                            <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Questions & Answers</h5>
                            <div className="space-y-4">
                              {candidateReport.performance.byRound.map((round, roundIndex) => (
                                <div key={roundIndex} className="space-y-3">
                                  <h6 className={`font-medium text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {round.title}
                                  </h6>
                                  {round.questions && round.questions.map((q, qIndex) => (
                                    <div key={qIndex} className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                                      <div className="mb-2">
                                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Q{qIndex + 1}:
                                        </span>
                                        <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                          {q.question}
                                        </p>
                                      </div>
                                      {q.answer ? (
                                        <>
                                          <div className="mt-3">
                                            <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                              Answer:
                                            </span>
                                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                              {q.answer.text}
                                            </p>
                                          </div>
                                          {q.answer.aiEvaluation && (
                                            <div className="mt-3 flex items-center justify-between">
                                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Score: <span className="font-semibold">{q.answer.aiEvaluation.score}/4</span>
                                              </span>
                                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Time: {Math.round(q.answer.timeTaken / 1000)}s
                                              </span>
                                            </div>
                                          )}
                                          
                                          {/* PCB Design Data for this answer */}
                                          {q.answer.pcbDesignData && (
                                            <div className="mt-3">
                                              <div className={`${isDarkMode ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border rounded-lg p-3`}>
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Code className="w-4 h-4 text-emerald-600" />
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                                                      PCB Design JSON Submitted
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      onClick={() => {
                                                        const dataStr = JSON.stringify(q.answer.pcbDesignData, null, 2);
                                                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                                        const url = URL.createObjectURL(dataBlob);
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.download = `pcb_design_q${qIndex + 1}.json`;
                                                        link.click();
                                                        URL.revokeObjectURL(url);
                                                      }}
                                                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                                        isDarkMode 
                                                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                      }`}
                                                    >
                                                      <Download className="w-3 h-3" />
                                                      JSON
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        window.open('https://pcb1.eval8.xyz/', '_blank');
                                                      }}
                                                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                                        isDarkMode 
                                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                      }`}
                                                    >
                                                      <ExternalLink className="w-3 h-3" />
                                                      View
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <p className={`text-sm italic mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                          Not answered
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recommendations */}
                          {candidateReport.performance.recommendations && candidateReport.performance.recommendations.length > 0 && (
                            <div className="mt-6">
                              <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Recommendations</h5>
                              <ul className="space-y-2">
                                {candidateReport.performance.recommendations.map((rec, index) => (
                                  <li key={index} className={`flex items-start space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Select a candidate to view their detailed report
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'formSubmissions' && (
                <motion.div
                  key="formSubmissions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      📝 Form Submissions
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                      View all candidate form submissions and responses.
                    </p>
                    
                    {results?.candidates && results.candidates.length > 0 ? (
                      <div className="space-y-4">
                        {results.candidates.map((candidate, index) => (
                          <div key={index} className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidate.candidateName || 'Candidate ' + (index + 1)}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                              }`}>
                                View Submissions
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Email: {candidate.email || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No form submissions yet
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'fileUploads' && (
                <motion.div
                  key="fileUploads"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      📁 File Upload Rounds
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                      View all candidate file uploads and documents.
                    </p>
                    
                    {results?.candidates && results.candidates.length > 0 ? (
                      <div className="space-y-4">
                        {results.candidates.map((candidate, index) => (
                          <div key={index} className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidate.candidateName || 'Candidate ' + (index + 1)}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                              }`}>
                                View Files
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Email: {candidate.email || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No file uploads yet
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'systemDesign' && (
                <motion.div
                  key="systemDesign"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      🎨 System Design Submissions
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                      View all candidate system design diagrams and submissions.
                    </p>
                    
                    {results?.candidates && results.candidates.length > 0 ? (
                      <div className="space-y-4">
                        {results.candidates.map((candidate, index) => (
                          <div key={index} className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidate.candidateName || 'Candidate ' + (index + 1)}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                              }`}>
                                View Design
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Email: {candidate.email || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No system design submissions yet
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'pcbSubmissions' && (
                <motion.div
                  key="pcbSubmissions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      🔌 PCB Submissions
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                      View all candidate PCB designs and electronic circuit submissions.
                    </p>
                    
                    {results?.candidates && results.candidates.length > 0 ? (
                      <div className="space-y-4">
                        {results.candidates.map((candidate, index) => (
                          <div key={index} className={`${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidate.candidateName || 'Candidate ' + (index + 1)}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800'
                              }`}>
                                View PCB
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Email: {candidate.email || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          No PCB submissions yet
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <ModernInterviewAnalytics
          interviewId={interviewId}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
};

export default InterviewResults;
