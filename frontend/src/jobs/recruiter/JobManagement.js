import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  Archive,
  MessageCircle,
  UserCheck,
  Clock,
  Star,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Building
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import MessagingSystem from '../../components/MessagingSystem';
import InterviewScheduler from '../../components/InterviewScheduler';

const JobManagement = () => {
  const queryClient = useQueryClient();
  const { isDarkMode, toggleTheme } = useTheme();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState(new Set());
  const [applicationFilters, setApplicationFilters] = useState({
    status: '',
    experience: '',
    skills: ''
  });
  const [showMessaging, setShowMessaging] = useState(false);
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [currentUser] = useState({
    _id: '68ccf762d6b907fb61a2689a', // Use a valid ObjectId format
    name: 'Recruiter Name',
    email: 'recruiter@example.com'
  });

  // Fetch recruiter's jobs
  const { data: jobsData, isLoading, error } = useQuery(
    ['recruiter-jobs', filters],
    async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/jobs/my/jobs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    }
  );

  // Fetch applications for selected job
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery(
    ['job-applications', selectedJob?._id, applicationFilters],
    async () => {
      if (!selectedJob?._id) return null;
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      Object.entries(applicationFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/applications/job/${selectedJob._id}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      enabled: !!selectedJob?._id
    }
  );

  // Update job status mutation
  const updateStatusMutation = useMutation(
    async ({ jobId, status }) => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/jobs/${jobId}/status`, { status }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Job status updated successfully!');
        queryClient.invalidateQueries('recruiter-jobs');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update job status');
      }
    }
  );

  // Delete job mutation
  const deleteJobMutation = useMutation(
    async (jobId) => {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Job deleted successfully!');
        queryClient.invalidateQueries('recruiter-jobs');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete job');
      }
    }
  );

  // Update application status mutation
  const updateApplicationStatusMutation = useMutation(
    async ({ applicationId, status }) => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/applications/${applicationId}/status`, { status }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Application status updated successfully!');
        queryClient.invalidateQueries(['job-applications', selectedJob?._id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update application status');
      }
    }
  );

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation(
    async ({ applicationId, interviewData }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/applications/${applicationId}/schedule-interview`, interviewData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Interview scheduled successfully!');
        queryClient.invalidateQueries(['job-applications', selectedJob?._id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to schedule interview');
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusChange = (jobId, newStatus) => {
    updateStatusMutation.mutate({ jobId, status: newStatus });
  };

  const handleDeleteJob = (jobId) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const handleEditJob = (jobId) => {
    // Navigate to edit job page
    window.location.href = `/jobs/edit/${jobId}`;
  };

  const handleViewApplications = (job) => {
    setSelectedJob(job);
    setShowApplications(true);
  };

  const handleCloseApplications = () => {
    setShowApplications(false);
    setSelectedJob(null);
  };

  const handleToggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleApplicationStatusChange = (applicationId, status) => {
    updateApplicationStatusMutation.mutate({ applicationId, status });
  };


  const handleApplicationFilterChange = (key, value) => {
    setApplicationFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStartMessaging = (application) => {
    setSelectedApplication(application);
    setShowMessaging(true);
  };

  const handleCloseMessaging = () => {
    setShowMessaging(false);
    setSelectedApplication(null);
  };

  const handleScheduleInterview = (application) => {
    setSelectedApplication(application);
    setShowInterviewScheduler(true);
  };

  const handleCloseInterviewScheduler = () => {
    setShowInterviewScheduler(false);
    setSelectedApplication(null);
  };

  const handleInterviewScheduled = () => {
    // Refresh applications data
    queryClient.invalidateQueries(['job-applications', selectedJob?._id]);
  };

  const jobs = jobsData?.jobs || [];
  const stats = jobsData?.stats || {
    total: 0,
    active: 0,
    paused: 0,
    applications: 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Jobs</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen pt-24 pb-8 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30'
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2`}>
                Job Management
              </h1>
              <p className={`text-lg transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Manage your job postings and track applications with powerful analytics.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400 border border-gray-700' 
                    : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </motion.button>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
            <Link
              to="/jobs/create"
                  className="btn btn-primary flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
                  <Sparkles className="h-5 w-5" />
              <span>Post New Job</span>
            </Link>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div 
              className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-100'
              }`}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Jobs</p>
                  <p className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+12% from last month</span>
            </div>
            </motion.div>

            <motion.div 
              className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-100'
              }`}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Jobs</p>
                  <p className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.active}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Live and accepting applications</span>
            </div>
            </motion.div>

            <motion.div 
              className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-100'
              }`}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Paused Jobs</p>
                  <p className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.paused}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                  <Pause className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-yellow-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Temporarily paused</span>
            </div>
            </motion.div>

            <motion.div 
              className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-100'
              }`}
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Applications</p>
                  <p className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.applications}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-600">
                <Target className="h-4 w-4 mr-1" />
                <span>Across all positions</span>
              </div>
            </motion.div>
            </div>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div 
          className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Filter className={`h-5 w-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
          </div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Filter & Search</h3>
        </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Zap className={`h-4 w-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{jobs.length} jobs found</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`form-label mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Search Jobs</label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search by title, company..."
                  className={`form-input pl-10 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={`form-label mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Job Status</label>
              <select
                className={`form-select transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">🟢 Active</option>
                <option value="paused">🟡 Paused</option>
                <option value="draft">⚪ Draft</option>
                <option value="closed">🔴 Closed</option>
              </select>
            </div>

            <div>
              <label className={`form-label mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Sort By</label>
              <select
                className={`form-select transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
              >
                <option value="createdAt-desc">📅 Newest First</option>
                <option value="createdAt-asc">📅 Oldest First</option>
                <option value="title-asc">🔤 Title A-Z</option>
                <option value="title-desc">🔤 Title Z-A</option>
                <option value="applications-desc">👥 Most Applications</option>
                <option value="applications-asc">👥 Least Applications</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Jobs List */}
        <div className="space-y-6">
          <AnimatePresence>
          {jobs.length > 0 ? (
              jobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">
                            {job.company?.charAt(0) || 'C'}
                          </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                              <h2 className={`text-xl font-bold mr-3 transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                        {job.title}
                      </h2>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                        job.status === 'active' 
                                  ? isDarkMode 
                                    ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : job.status === 'paused'
                                  ? isDarkMode
                                    ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : job.status === 'draft'
                                  ? isDarkMode
                                    ? 'bg-gray-700 text-gray-300 border-gray-600'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                  : isDarkMode
                                    ? 'bg-red-900/50 text-red-300 border-red-700'
                                    : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </div>
                    
                            <div className={`flex items-center mb-3 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <Building className="h-4 w-4 mr-2" />
                      <span className="font-medium">{job.company}</span>
                      <span className="mx-2">•</span>
                              <MapPin className="h-4 w-4 mr-1" />
                      <span>{job.location}</span>
                    </div>

                            <div className={`flex flex-wrap items-center gap-4 text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {job.applications?.length || 0} applications
                              </div>
                              <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-1" />
                                {job.applications?.filter(app => app.status === 'shortlisted').length || 0} shortlisted
                              </div>
                            </div>
                      </div>
                    </div>
                  </div>

                      {/* Enhanced Actions */}
                  <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => handleViewApplications(job)}
                          className="btn btn-primary btn-sm flex items-center space-x-1"
                          title="View Applications"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Users className="h-4 w-4" />
                          <span>Applications</span>
                        </motion.button>
                        
                    <Link
                      to={`/jobs/${job._id}`}
                      className="btn btn-outline btn-sm"
                      title="View Job"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleEditJob(job._id)}
                      className="btn btn-outline btn-sm"
                      title="Edit Job"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <div className="relative group">
                      <button className="btn btn-outline btn-sm">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                        {job.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(job._id, 'paused')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 flex items-center space-x-2"
                          >
                            <Pause className="h-4 w-4" />
                            <span>Pause Job</span>
                          </button>
                        ) : job.status === 'paused' ? (
                          <button
                            onClick={() => handleStatusChange(job._id, 'active')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 flex items-center space-x-2"
                          >
                            <Play className="h-4 w-4" />
                            <span>Activate Job</span>
                          </button>
                        ) : null}
                        
                        <button
                          onClick={() => handleStatusChange(job._id, 'closed')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Archive className="h-4 w-4" />
                          <span>Close Job</span>
                        </button>
                        
                        <div className="border-t my-1"></div>
                        
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Job</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                    {/* Enhanced Job Preview */}
                    <div className={`pt-4 border-t transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <p className={`line-clamp-2 mb-4 leading-relaxed transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                    {job.description}
                  </p>
                  
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.slice(0, 5).map((skill, index) => (
                            <motion.span
                          key={index}
                              className={`px-2 py-1 text-xs rounded-md font-medium border transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'bg-blue-900/50 text-blue-300 border-blue-700' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                              whileHover={{ scale: 1.05 }}
                        >
                          {skill}
                            </motion.span>
                      ))}
                      {job.skills.length > 5 && (
                            <span className={`px-2 py-1 text-xs rounded-md transition-colors duration-300 ${
                              isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                            }`}>
                          +{job.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
                </motion.div>
            ))
          ) : (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50' 
                    : 'bg-gradient-to-br from-blue-100 to-purple-100'
                }`}>
                  <TrendingUp className={`h-12 w-12 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                </div>
                <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>No jobs found</h3>
                <p className={`mb-8 max-w-md mx-auto transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {filters.search || filters.status 
                  ? 'No jobs match your current filters. Try adjusting your search criteria.'
                  : 'You haven\'t posted any jobs yet. Create your first job posting to get started.'
                }
              </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
              <Link
                to="/jobs/create"
                    className="btn btn-primary inline-flex items-center space-x-2"
              >
                    <Sparkles className="h-5 w-5" />
                    <span>Post Your First Job</span>
              </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Applications Modal */}
      {showApplications && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Applications for {selectedJob.title}</h2>
                <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              <button
                onClick={handleCloseApplications}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Application Filters */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={applicationFilters.status}
                    onChange={(e) => handleApplicationFilterChange('status', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Experience Level</label>
                  <select
                    className="form-select"
                    value={applicationFilters.experience}
                    onChange={(e) => handleApplicationFilterChange('experience', e.target.value)}
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Skills</label>
                  <input
                    type="text"
                    placeholder="Filter by skills..."
                    className="form-input"
                    value={applicationFilters.skills}
                    onChange={(e) => handleApplicationFilterChange('skills', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {applicationsLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : applicationsData?.applications?.length > 0 ? (
                <div className="space-y-4">
                  {applicationsData.applications.map((application) => (
                    <div key={application._id} className="card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.candidate?.name || 'Anonymous Candidate'}
                              </h3>
                              <p className="text-gray-600">{application.candidate?.email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {application.candidate?.location || 'Not specified'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Briefcase className="h-4 w-4 mr-2" />
                              {application.candidate?.experience || 'Not specified'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              Applied {new Date(application.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {application.candidate?.skills && application.candidate.skills.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {application.candidate.skills.slice(0, 6).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {application.candidate.skills.length > 6 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                    +{application.candidate.skills.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {application.coverLetter && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Cover Letter</h4>
                              <p className="text-sm text-gray-700 line-clamp-3">{application.coverLetter}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            application.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : application.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-800'
                              : application.status === 'shortlisted'
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'interviewed'
                              ? 'bg-purple-100 text-purple-800'
                              : application.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {application.status.toUpperCase()}
                          </span>

                          <div className="flex flex-col space-y-1">
                            <select
                              value={application.status}
                              onChange={(e) => handleApplicationStatusChange(application._id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interviewed">Interviewed</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Hired</option>
                            </select>

                            {application.status === 'shortlisted' && (
                              <button
                                onClick={() => handleScheduleInterview(application)}
                                className="btn btn-primary btn-sm text-xs"
                              >
                                Schedule Interview
                              </button>
                            )}

                            <button 
                              onClick={() => handleStartMessaging(application)}
                              className="btn btn-outline btn-sm text-xs"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </button>

                            {application.resume && (
                              <a
                                href={application.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Resume
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600">
                    {applicationFilters.status || applicationFilters.experience || applicationFilters.skills
                      ? 'No applications match your current filters.'
                      : 'No one has applied to this job yet.'
                    }
                  </p>
            </div>
          )}
        </div>
      </div>
        </div>
      )}

      {/* Messaging System Modal */}
      {showMessaging && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full h-[80vh] overflow-hidden">
            <MessagingSystem
              currentUser={currentUser}
              recipient={selectedApplication.candidate}
              jobId={selectedJob._id}
              applicationId={selectedApplication._id}
              onClose={handleCloseMessaging}
            />
          </div>
        </div>
      )}

      {/* Interview Scheduler Modal */}
      {showInterviewScheduler && selectedApplication && selectedJob && (
        <InterviewScheduler
          applicationId={selectedApplication._id}
          candidate={selectedApplication.candidate}
          job={selectedJob}
          onClose={handleCloseInterviewScheduler}
          onSuccess={handleInterviewScheduled}
        />
      )}
    </div>
  );
};

export default JobManagement;