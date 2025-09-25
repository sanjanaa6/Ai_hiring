import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Briefcase, 
  Heart, 
  Users,
  Filter,
  Bookmark,
  TrendingUp,
  Award,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Grid3X3,
  List,
  Search,
  Bell
} from 'lucide-react';
import JobFilters from '../components/JobFilters';
import JobApplicationForm from '../components/JobApplicationForm';
import JobCard from '../components/JobCard';
import QuickJobCreator from '../components/QuickJobCreator';
import OnePromptJobCreator from '../components/OnePromptJobCreator';

const JobSearch = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';
  const isCandidate = user?.role === 'candidate' || user?.role === 'user';
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    experience: '',
    salaryRange: '',
    companySize: '',
    posted: '',
    page: 1
  });
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [jobAlerts, setJobAlerts] = useState([]);
  
  // For recruiters - job posting state
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [showOnePromptCreator, setShowOnePromptCreator] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: '',
    salary: '',
    description: '',
    requirements: '',
    benefits: ''
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedJobsData = localStorage.getItem('savedJobs');
    const appliedJobsData = localStorage.getItem('appliedJobs');
    const recentSearchesData = localStorage.getItem('recentSearches');
    
    if (savedJobsData) setSavedJobs(new Set(JSON.parse(savedJobsData)));
    if (appliedJobsData) setAppliedJobs(new Set(JSON.parse(appliedJobsData)));
    if (recentSearchesData) setRecentSearches(JSON.parse(recentSearchesData));
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify([...savedJobs]));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem('appliedJobs', JSON.stringify([...appliedJobs]));
  }, [appliedJobs]);

  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const { data, isLoading, error } = useQuery(
    ['jobs', filters, sortBy],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('sortBy', sortBy);
      
      const response = await axios.get(`/api/jobs?${params.toString()}`);
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));

    // Add to recent searches if it's a search term
    if (key === 'search' && value.trim()) {
      const newSearch = {
        term: value.trim(),
        timestamp: new Date().toISOString(),
        filters: { ...filters, [key]: value }
      };
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.term !== value.trim());
        return [newSearch, ...filtered].slice(0, 10); // Keep only 10 recent searches
      });
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: '',
      location: '',
      experience: '',
      salaryRange: '',
      companySize: '',
      posted: '',
      page: 1
    });
  };


  const handleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const newSavedJobs = new Set(prev);
      if (newSavedJobs.has(jobId)) {
        newSavedJobs.delete(jobId);
      } else {
        newSavedJobs.add(jobId);
      }
      return newSavedJobs;
    });
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    setAppliedJobs(prev => new Set([...prev, selectedJobId]));
    setSelectedJobId(null);
  };

  const handleQuickApply = (jobId) => {
    setSelectedJobId(jobId);
    setShowApplicationForm(true);
  };


  const handleCreateJobAlert = () => {
    const alert = {
      id: Date.now(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
      isActive: true
    };
    setJobAlerts(prev => [...prev, alert]);
  };

  const handleRemoveJobAlert = (alertId) => {
    setJobAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleRecentSearchClick = (search) => {
    setFilters(search.filters);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Job posting handlers for recruiters
  const handleCreateJob = async () => {
    try {
      const response = await axios.post('/api/jobs', {
        ...jobFormData,
        recruiter: user._id
      });
      
      if (response.data.success) {
        // Refresh jobs list
        queryClient.invalidateQueries(['jobs']);
        setShowCreateJob(false);
        setJobFormData({
          title: '',
          company: '',
          location: '',
          type: '',
          salary: '',
          description: '',
          requirements: '',
          benefits: ''
        });
        alert('Job posted successfully!');
      }
    } catch (error) {
      alert('Failed to post job: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleJobFormChange = (field, value) => {
    setJobFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const jobs = data?.jobs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;

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
          ? 'bg-black' 
          : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              {isRecruiter ? (
                <>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Job Management
                  </h1>
                  <p className={`text-lg transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Manage your job postings and find the right candidates for your team.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Find Your Next Job
                  </h1>
                  <p className={`text-lg transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Discover opportunities that match your skills and career goals.
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isRecruiter && (
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => setShowOnePromptCreator(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>One-Prompt Create</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowQuickCreator(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Zap className="h-4 w-4" />
                    <span>Step-by-Step</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCreateJob(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Manual Post</span>
                  </motion.button>
                </div>
              )}
              
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
              
              <div className={`flex items-center space-x-2 rounded-xl p-1 shadow-sm border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <span className={`text-sm px-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>View:</span>
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? isDarkMode
                        ? 'bg-blue-900/50 text-blue-400 shadow-sm'
                        : 'bg-blue-100 text-blue-600 shadow-sm'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Grid3X3 className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? isDarkMode
                        ? 'bg-blue-900/50 text-blue-400 shadow-sm'
                        : 'bg-blue-100 text-blue-600 shadow-sm'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <List className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isRecruiter ? (
              <>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">My Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{jobs.filter(job => job.recruiter === user._id).length}</p>
                    </div>
                    <div className="p-3 bg-black rounded-xl">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>Active postings</span>
                  </div>
                </motion.div>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Applications</p>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="p-3 bg-gray-600 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Target className="h-4 w-4 mr-1" />
                    <span>Across all jobs</span>
                  </div>
                </motion.div>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Active Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{jobs.filter(job => job.recruiter === user._id && job.status === 'active').length}</p>
                    </div>
                    <div className="p-3 bg-gray-700 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Zap className="h-4 w-4 mr-1" />
                    <span>Live and accepting</span>
                  </div>
                </motion.div>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Views This Month</p>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>Job visibility</span>
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{data?.total || 0}</p>
                    </div>
                    <div className="p-3 bg-black rounded-xl">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    <Search className="h-4 w-4 mr-1" />
                    <span>Available positions</span>
                  </div>
                </motion.div>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Saved Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{savedJobs.size}</p>
                    </div>
                    <div className="p-3 bg-gray-600 rounded-xl">
                      <Bookmark className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Heart className="h-4 w-4 mr-1" />
                    <span>Your favorites</span>
                  </div>
                </motion.div>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Applied</p>
                      <p className="text-3xl font-bold text-gray-900">{appliedJobs.size}</p>
                    </div>
                    <div className="p-3 bg-gray-700 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Award className="h-4 w-4 mr-1" />
                    <span>Applications sent</span>
                  </div>
                </motion.div>
                <motion.div 
                  className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-white border-gray-200'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Job Alerts</p>
                      <p className="text-3xl font-bold text-gray-900">{jobAlerts.length}</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-xl">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    <Target className="h-4 w-4 mr-1" />
                    <span>Active notifications</span>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <JobFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
          <p className="text-gray-600">
            Showing {jobs.length} of {data?.total || 0} jobs
          </p>
              {filters.search && (
                <p className="text-sm text-gray-500 mt-1">
                  Results for "{filters.search}"
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date Posted</option>
                  <option value="salary">Salary</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="btn btn-outline btn-sm flex items-center space-x-1"
              >
                <Filter className="h-4 w-4" />
                <span>Advanced</span>
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {search.term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Job Alerts */}
          {jobAlerts.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Active job alerts:</p>
              <div className="flex flex-wrap gap-2">
                {jobAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    <span>{alert.filters.search || 'All jobs'}</span>
                    <button
                      onClick={() => handleRemoveJobAlert(alert.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
                >
                  <JobCard
                    job={job}
                    showActions={true}
                    onApply={handleQuickApply}
                    onSave={handleSaveJob}
                    isSaved={savedJobs.has(job._id)}
                    isRecruiter={isRecruiter}
                    isCandidate={isCandidate}
                    appliedJobs={appliedJobs}
                    savedJobs={savedJobs}
                    user={user}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try adjusting your search criteria or check back later for new opportunities.
                </p>
                <motion.button
                  onClick={handleClearFilters}
                  className="btn btn-primary inline-flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                  <span>Clear Filters</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-md text-sm font-medium ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Job Alert Creation */}
        {jobs.length > 0 && (
          <div className="mt-8">
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Create Job Alert</h3>
                  <p className="text-blue-700 text-sm">
                    Get notified when new jobs match your search criteria
                  </p>
                </div>
                <button
                  onClick={handleCreateJobAlert}
                  className="btn btn-primary"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application Form Modal */}
        {showApplicationForm && selectedJobId && (
          <JobApplicationForm
            jobId={selectedJobId}
            onSuccess={handleApplicationSuccess}
            onCancel={() => setShowApplicationForm(false)}
          />
        )}

        {/* One-Prompt Job Creator Modal */}
        {showOnePromptCreator && (
          <OnePromptJobCreator
            onJobCreated={() => {
              setShowOnePromptCreator(false);
              queryClient.invalidateQueries(['jobs']);
            }}
            onClose={() => setShowOnePromptCreator(false)}
          />
        )}

        {/* Quick Job Creator Modal */}
        {showQuickCreator && (
          <QuickJobCreator
            onJobCreated={() => {
              setShowQuickCreator(false);
              queryClient.invalidateQueries(['jobs']);
            }}
            onClose={() => setShowQuickCreator(false)}
          />
        )}

        {/* Job Creation Modal for Recruiters */}
        {showCreateJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Post a New Job</h2>
                  <button
                    onClick={() => setShowCreateJob(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                      <input
                        type="text"
                        value={jobFormData.title}
                        onChange={(e) => handleJobFormChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Senior React Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                      <input
                        type="text"
                        value={jobFormData.company}
                        onChange={(e) => handleJobFormChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                      <input
                        type="text"
                        value={jobFormData.location}
                        onChange={(e) => handleJobFormChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., San Francisco, CA or Remote"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                      <select
                        value={jobFormData.type}
                        onChange={(e) => handleJobFormChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={jobFormData.salary}
                      onChange={(e) => handleJobFormChange('salary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., $80,000 - $120,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                    <textarea
                      value={jobFormData.description}
                      onChange={(e) => handleJobFormChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the role, responsibilities, and what makes this opportunity special..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                    <textarea
                      value={jobFormData.requirements}
                      onChange={(e) => handleJobFormChange('requirements', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List the required skills, experience, and qualifications..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                    <textarea
                      value={jobFormData.benefits}
                      onChange={(e) => handleJobFormChange('benefits', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List the benefits and perks offered..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateJob(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateJob}
                    disabled={!jobFormData.title || !jobFormData.company || !jobFormData.location || !jobFormData.description}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Post Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;
