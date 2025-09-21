import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import RecruiterLayout from '../components/RecruiterLayout';
import CandidateComparison from '../../components/CandidateComparison';
import apiService from '../../services/apiService';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Bot, 
  Link, 
  Copy, 
  CheckCircle, 
  Clock, 
  Users, 
  Briefcase,
  Sparkles,
  FileText,
  MapPin,
  DollarSign,
  Calendar,
  BarChart3,
  UserCheck
} from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedInterview, setGeneratedInterview] = useState(null);
  const [interviewLink, setInterviewLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'candidates', 'analytics', 'answers'
  const [interviewStats, setInterviewStats] = useState(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);

  // Answers state
  const [answersLoading, setAnswersLoading] = useState(false);
  const [answers, setAnswers] = useState([]); // flat list from API
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [expandedCandidates, setExpandedCandidates] = useState({});

  // Load interviews on component mount
  useEffect(() => {
    loadInterviews();
  }, []);

  // Auto-select the single interview when switching to Answers
  useEffect(() => {
    if (activeTab === 'answers' && !selectedInterviewId && jobs.length === 1) {
      setSelectedInterviewId(jobs[0].interviewId);
    }
  }, [activeTab, jobs, selectedInterviewId]);

  // Load interview stats when interview is selected
  useEffect(() => {
    if (selectedInterviewId) {
      loadInterviewStats(selectedInterviewId);
    }
  }, [selectedInterviewId]);

  // Load answers when switching to Answers tab or changing filters/selected interview
  useEffect(() => {
    if (activeTab === 'answers' && selectedInterviewId) {
      loadAnswers(selectedInterviewId, selectedCandidateId);
    }
  }, [activeTab, selectedInterviewId, selectedCandidateId]);

  // Auto-refresh answers every 7s while on Answers tab
  useEffect(() => {
    if (activeTab !== 'answers' || !selectedInterviewId) return;
    const id = setInterval(() => {
      loadAnswers(selectedInterviewId, selectedCandidateId);
    }, 7000);
    return () => clearInterval(id);
  }, [activeTab, selectedInterviewId, selectedCandidateId]);

  const loadInterviews = async () => {
    try {
      const result = await apiService.getAllInterviews();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    }
  };

  const loadInterviewStats = async (interviewId) => {
    try {
      const result = await apiService.getInterviewStats(interviewId);
      if (result.success) {
        setInterviewStats(result.data);
      }
    } catch (error) {
      console.error('Error loading interview stats:', error);
    }
  };

  const loadAnswers = async (interviewId, candidateId) => {
    try {
      setAnswersLoading(true);
      const result = await apiService.getInterviewAnswers(interviewId, candidateId || undefined);
      if (result.success) {
        setAnswers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading answers:', error);
    } finally {
      setAnswersLoading(false);
    }
  };

  const groupAnswersByCandidate = () => {
    const map = new Map();
    for (const a of answers) {
      if (!map.has(a.candidateId)) {
        map.set(a.candidateId, {
          candidateId: a.candidateId,
          candidateName: a.candidateName,
          candidateEmail: a.candidateEmail,
          items: []
        });
      }
      map.get(a.candidateId).items.push(a);
    }
    // compute summaries
    const list = Array.from(map.values()).map(c => {
      const scores = c.items.map(i => i.aiEvaluation?.score).filter(s => typeof s === 'number');
      const avg = scores.length ? (scores.reduce((p, v) => p + v, 0) / scores.length) : 0;
      const lastAnswered = c.items.reduce((p, v) => {
        const t = new Date(v.timestamp).getTime();
        return t > p ? t : p;
      }, 0);
      return { ...c, averageScore: avg, lastAnswered };
    });
    // sort by averageScore desc
    return list.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  };

  const toggleExpand = (candidateId) => {
    setExpandedCandidates(prev => ({ ...prev, [candidateId]: !prev[candidateId] }));
  };

  const [jobPrompt, setJobPrompt] = useState('');

  const generateAIInterview = async () => {
    if (!jobPrompt || jobPrompt.trim().length < 10) {
      alert('Please provide a detailed job description (minimum 10 characters)');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.generateInterview({ prompt: jobPrompt });
      
      if (result.success) {
        setGeneratedInterview(result.data);
        setInterviewLink(result.data.link);
        
        // Add to jobs list
        const newJob = {
          id: 'job_' + Date.now(),
          title: result.data.title || 'AI Generated Job',
          company: 'Company',
          location: 'Remote',
          salary: 'Competitive',
          description: jobPrompt,
          interviewId: result.data.interviewId,
          interviewLink: result.data.link,
          status: 'active',
          createdAt: new Date()
        };
        setJobs(prev => [newJob, ...prev]);
        
        // Reset form
        setJobPrompt('');
        setShowCreateJob(false);
      } else {
        // Check if it's a rate limit error and show helpful message
        if (result.error?.includes('429') || result.error?.includes('rate') || result.error?.includes('Provider returned error')) {
          alert('AI service temporarily at capacity. Your interview was generated using our fallback system with high-quality questions tailored to your job description.');
        } else {
          alert('Failed to generate interview: ' + result.error);
        }
      }
    } catch (error) {
      // Check if it's a rate limit error 
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        alert('AI service temporarily at capacity. Your interview was generated using our fallback system with high-quality questions tailored to your job description.');
      } else {
        alert('Error generating interview: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <RecruiterLayout>
      <div className="h-full flex flex-col" style={{
        background: isDarkMode
          ? 'radial-gradient(1200px 700px at -10% 0%, rgba(59,130,246,.08), transparent), radial-gradient(1000px 600px at 110% -10%, rgba(6,182,212,.08), transparent)'
          : undefined
      }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        {/* Enhanced Header with Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`mb-6 p-8 rounded-2xl border backdrop-blur-xl ${isDarkMode 
              ? 'bg-black/30 border-blue-500/40 shadow-2xl shadow-blue-500/10' 
              : 'bg-white/80 border-blue-200/50 shadow-2xl shadow-blue-500/5'
            }`}
          >
            <div className="flex items-center space-x-4 mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}
              >
                <Bot className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className={`text-3xl font-bold bg-gradient-to-r ${isDarkMode 
                    ? 'from-white to-blue-200 bg-clip-text text-transparent' 
                    : 'from-gray-900 to-blue-600 bg-clip-text text-transparent'
                  }`}
                >
                  AI Hiring Platform
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Create jobs with AI-powered multi-round interviews and manage candidates
                </motion.p>
              </div>
            </div>
          </motion.div>

        {/* Enhanced Tab Navigation with Animations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-6"
        >
          <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} backdrop-blur-sm`}>
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'jobs', label: 'Jobs & Interviews', icon: Briefcase },
                { id: 'candidates', label: 'Candidates', icon: UserCheck },
                { id: 'answers', label: 'Answers', icon: FileText },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative py-3 px-4 font-medium text-sm rounded-t-xl transition-all duration-300 ${
                      isActive
                        ? `${isDarkMode ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'} shadow-lg`
                        : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: isActive ? 360 : 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      <span>{tab.label}</span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'} rounded-full`}
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
        {activeTab === 'jobs' && (
          <>
            {/* Enhanced Stats Cards with Animations */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { 
                  icon: Briefcase, 
                  label: 'Active Jobs', 
                  value: jobs.length, 
                  color: 'blue',
                  bgColor: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
                  iconColor: 'text-blue-600',
                  gradient: 'from-blue-500 to-blue-600'
                },
                { 
                  icon: Bot, 
                  label: 'AI Interviews', 
                  value: jobs.length, 
                  color: 'green',
                  bgColor: isDarkMode ? 'bg-green-500/20' : 'bg-green-100',
                  iconColor: 'text-green-600',
                  gradient: 'from-green-500 to-green-600'
                },
                { 
                  icon: Users, 
                  label: 'Candidates', 
                  value: 0, 
                  color: 'purple',
                  bgColor: isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100',
                  iconColor: 'text-purple-600',
                  gradient: 'from-purple-500 to-purple-600'
                },
                { 
                  icon: Clock, 
                  label: 'Completed', 
                  value: 0, 
                  color: 'yellow',
                  bgColor: isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100',
                  iconColor: 'text-yellow-600',
                  gradient: 'from-yellow-500 to-yellow-600'
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.8 + index * 0.1, 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-black/30 border-blue-500/30 shadow-2xl shadow-blue-500/10' 
                        : 'bg-white/80 border-gray-200/50 shadow-xl shadow-gray-500/5'
                    }`}
                  >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + index * 0.1, type: "spring", stiffness: 200 }}
                          className={`w-3 h-3 rounded-full bg-gradient-to-r ${stat.gradient} animate-pulse`}
                        ></motion.div>
                      </div>
                      
                      <div>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.1 + index * 0.1 }}
                          className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                          {stat.label}
                        </motion.p>
                        <motion.p 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 200 }}
                          className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          {/* Enhanced Create Job Button */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mb-8 text-center"
          >
            <motion.button
              onClick={() => setShowCreateJob(true)}
              whileHover={{ 
                scale: 1.05,
                y: -5,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 hover:from-blue-700 hover:via-blue-800 hover:to-slate-900 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-lg overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{ 
                    x: [0, 100, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                ></motion.div>
                <motion.div
                  animate={{ 
                    x: [0, -100, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                ></motion.div>
              </div>
              
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <Plus className="h-6 w-6" />
              </motion.div>
              <span className="relative z-10">Create Job with AI Interview</span>
              
              {/* Shine effect */}
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              ></motion.div>
            </motion.button>
          </motion.div>

          {/* Enhanced Create Job Modal - Fixed Width */}
          {showCreateJob && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 overflow-hidden"
            >
              {/* Enhanced Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 ${isDarkMode ? 'bg-black/90 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}`} 
              />
              
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}
                ></motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.05, 0.15, 0.05]
                  }}
                  transition={{ 
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full ${isDarkMode ? 'bg-purple-500' : 'bg-purple-300'}`}
                ></motion.div>
              </div>
              
              {/* Main Content Container */}
              <div className="relative h-full flex items-center justify-center p-4">
                <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
                  {/* Enhanced Header - Always Visible */}
                  <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className={`${isDarkMode ? 'bg-black/40 border-blue-500/30' : 'bg-white/80 border-gray-200/50'} border-b backdrop-blur-2xl shadow-2xl rounded-t-3xl`}
                  >
                    <div className="px-8 py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            className={`p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/40' : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'}`}
                          >
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-white'}`} />
                            </motion.div>
                          </motion.div>
                          <div>
                            <motion.h1 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5, duration: 0.6 }}
                              className={`text-3xl font-bold bg-gradient-to-r ${isDarkMode 
                                ? 'from-white via-blue-200 to-purple-200 bg-clip-text text-transparent' 
                                : 'from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent'
                              }`}
                            >
                              Create AI-Powered Interview
                            </motion.h1>
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6, duration: 0.6 }}
                              className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 text-base`}
                            >
                              Describe your ideal candidate and let AI generate everything
                            </motion.p>
                          </div>
                        </div>
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowCreateJob(false)}
                          className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-600/50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Enhanced Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-8 py-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Enhanced Main Form */}
                      <div className="lg:col-span-2">
                        <motion.div
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-black/40 border-blue-500/30' : 'bg-white/90 border-gray-200/50'} rounded-2xl border backdrop-blur-2xl shadow-2xl p-6`}
                        >
                          <div className="mb-6">
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9, duration: 0.6 }}
                              className="flex items-center space-x-3 mb-3"
                            >
                              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                <FileText className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                              </div>
                              <label className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Job Description Prompt *
                              </label>
                            </motion.div>
                            
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.0, duration: 0.6 }}
                              className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 leading-relaxed text-sm`}
                            >
                              Describe the job you want to hire for. Be as detailed as possible - include job title, level, requirements, responsibilities, company info, etc. AI will extract all details and create tailored interview questions.
                            </motion.p>
                            
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.1, duration: 0.6 }}
                              className="relative group"
                            >
                              <textarea
                                value={jobPrompt}
                                onChange={(e) => setJobPrompt(e.target.value)}
                                rows={12}
                                className={`w-full px-6 py-4 rounded-xl border-2 transition-all duration-300 resize-none focus:outline-none text-base ${
                                  isDarkMode 
                                    ? 'bg-black/30 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-blue-400' 
                                    : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-blue-400'
                                }`}
                                placeholder="Example: I need to hire a Senior React Developer for our fintech startup. The role involves building modern web applications using React, TypeScript, and Node.js. Requirements include 5+ years of React experience, strong knowledge of JavaScript/TypeScript, experience with Redux, REST APIs, and Git. The person will work remotely, salary range $100k-$140k. They'll be responsible for developing new features, maintaining existing code, and mentoring junior developers..."
                              />
                              
                              {/* Animated character counter */}
                              <motion.div 
                                animate={{ scale: jobPrompt.length > 0 ? [1, 1.1, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                                className={`absolute bottom-6 right-6 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  jobPrompt.length >= 10 
                                    ? isDarkMode 
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                      : 'bg-green-100 text-green-700 border border-green-200'
                                    : isDarkMode 
                                      ? 'bg-gray-700/50 text-gray-400' 
                                      : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {jobPrompt.length} characters (minimum 10 required)
                              </motion.div>
                              
                              {/* Floating label effect */}
                              {jobPrompt.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`absolute -top-2 left-6 px-2 text-xs font-medium ${isDarkMode ? 'bg-black text-blue-400' : 'bg-white text-blue-600'}`}
                                >
                                  Job Description
                                </motion.div>
                              )}
                            </motion.div>
                          </div>

                          {/* Enhanced Action Buttons */}
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="flex justify-end space-x-4 mt-4"
                          >
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowCreateJob(false)}
                              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-600/50' 
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              Cancel
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ 
                                scale: loading || jobPrompt.trim().length < 10 ? 1 : 1.05,
                                y: loading || jobPrompt.trim().length < 10 ? 0 : -3
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={generateAIInterview}
                              disabled={loading || jobPrompt.trim().length < 10}
                              className="group relative flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-2xl transition-all duration-300 font-semibold shadow-2xl hover:shadow-blue-500/25 disabled:shadow-none overflow-hidden"
                            >
                              {/* Animated background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                              
                              {/* Floating particles */}
                              {!loading && jobPrompt.trim().length >= 10 && (
                                <div className="absolute inset-0 overflow-hidden">
                                  <motion.div
                                    animate={{ 
                                      x: [0, 100, 0],
                                      opacity: [0, 1, 0]
                                    }}
                                    transition={{ 
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                    className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                                  ></motion.div>
                                  <motion.div
                                    animate={{ 
                                      x: [0, -100, 0],
                                      opacity: [0, 1, 0]
                                    }}
                                    transition={{ 
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                      delay: 1
                                    }}
                                    className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                                  ></motion.div>
                                </div>
                              )}
                              
                              <div className="relative z-10 flex items-center space-x-3">
                                {loading ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    ></motion.div>
                                    <span>Creating AI Interview...</span>
                                  </>
                                ) : (
                                  <>
                                    <motion.div
                                      whileHover={{ rotate: 180 }}
                                      transition={{ duration: 0.5 }}
                                    >
                                      <Sparkles className="h-5 w-5" />
                                    </motion.div>
                                    <span>Generate AI Interview</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Shine effect */}
                              {!loading && jobPrompt.trim().length >= 10 && (
                                <motion.div
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                ></motion.div>
                              )}
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      </div>

                      {/* Enhanced Sidebar */}
                      <div className="space-y-6">
                        {/* Enhanced AI Features */}
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.3, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/40' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} rounded-2xl border backdrop-blur-xl shadow-2xl p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div 
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-100'}`}
                            >
                              <Bot className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </motion.div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              AI Magic ✨
                            </h3>
                          </div>
                          <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {[
                              "Extract job title & level automatically",
                              "Generate 5 tailored interview rounds", 
                              "Create role-specific questions",
                              "Optimize interview duration",
                              "Include company context"
                            ].map((feature, index) => (
                              <motion.li 
                                key={feature}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.4 + index * 0.1, duration: 0.4 }}
                                className="flex items-start space-x-3 group"
                              >
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 360 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <CheckCircle className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                </motion.div>
                                <span className="text-xs group-hover:text-blue-400 transition-colors duration-200">{feature}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>

                        {/* Enhanced Pro Tips */}
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.8, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'} rounded-2xl border backdrop-blur-xl shadow-2xl p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div 
                              animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ 
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-100'}`}
                            >
                              <svg className={`h-6 w-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </motion.div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Pro Tips 💡
                            </h3>
                          </div>
                          <ul className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {[
                              "Include specific technologies and frameworks",
                              "Mention years of experience required",
                              "Describe company culture and values",
                              "Include salary range and benefits",
                              "Specify remote/hybrid/onsite work"
                            ].map((tip, index) => (
                              <motion.li 
                                key={tip}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.9 + index * 0.1, duration: 0.4 }}
                                className="flex items-start space-x-3 group"
                              >
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.2
                                  }}
                                  className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}
                                ></motion.div>
                                <span className="text-xs group-hover:text-yellow-400 transition-colors duration-200">{tip}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>

                        {/* Enhanced Example Output */}
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 2.3, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'} rounded-2xl border backdrop-blur-xl shadow-2xl p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div 
                              animate={{ 
                                y: [0, -5, 0],
                                rotate: [0, 10, -10, 0]
                              }}
                              transition={{ 
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/30' : 'bg-green-100'}`}
                            >
                              <FileText className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            </motion.div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Example Output 📄
                            </h3>
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                            {[
                              { label: "Job Title", value: "Senior React Developer" },
                              { label: "Duration", value: "25-30 minutes" },
                              { label: "Rounds", value: "5 interview rounds" },
                              { label: "Questions", value: "15+ tailored questions" },
                              { label: "Focus", value: "Technical skills, problem-solving, culture fit" }
                            ].map((item, index) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2.4 + index * 0.1, duration: 0.4 }}
                                className="flex justify-between items-center p-2 rounded-lg bg-black/10 border border-gray-600/20"
                              >
                                <span className="font-medium text-blue-400 text-xs">{item.label}:</span>
                                <span className="text-right text-xs">{item.value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          )}

          {/* Generated Interview Success */}
          {generatedInterview && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">AI Interview Generated Successfully!</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Interview Details</h4>
                  <p className="text-sm text-gray-600"><strong>Title:</strong> {generatedInterview.title}</p>
                  <p className="text-sm text-gray-600"><strong>Duration:</strong> {generatedInterview.totalDuration || generatedInterview.duration} minutes</p>
                  <p className="text-sm text-gray-600"><strong>Rounds:</strong> {generatedInterview.rounds?.length || generatedInterview.questions?.length} rounds</p>
                  <p className="text-sm text-gray-600"><strong>Total Questions:</strong> {(generatedInterview.rounds?.length || 0) * 5} questions</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Share Interview Link</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={interviewLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyLink}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
              </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Jobs List */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className={`${isDarkMode ? 'bg-black/30 border border-blue-500/40 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-sm'} rounded-2xl shadow-2xl overflow-hidden`}
          >
            <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-blue-500/30' : 'border-gray-200'} flex items-center justify-between bg-gradient-to-r ${isDarkMode ? 'from-black/20 to-black/10' : 'from-blue-50/50 to-transparent'}`}>
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}
                >
                  <Briefcase className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </motion.div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your AI Interview Jobs</h2>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
                className={`text-sm px-4 py-2 rounded-full font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}
              >
                {jobs.length} total
              </motion.div>
            </div>
            <div className="p-6">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job, idx) => (
                    <motion.div
                      key={job.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.7 + idx * 0.1, duration: 0.5 }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                      className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-blue-500/30 bg-black/20 hover:bg-black/30 shadow-lg shadow-blue-500/10' 
                          : 'border-gray-200 bg-white/80 hover:bg-white shadow-lg shadow-gray-500/5'
                      }`}
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="flex-1">
                          <motion.h3 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 + idx * 0.1 }}
                            className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {job.title}
                          </motion.h3>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.9 + idx * 0.1 }}
                            className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-3`}
                          >
                            {job.company}
                          </motion.p>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.0 + idx * 0.1 }}
                            className="flex items-center mt-2 space-x-6"
                          >
                            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="mr-2"
                              >
                                <MapPin className="h-4 w-4" />
                              </motion.div>
                              {job.location}
                            </div>
                            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="mr-2"
                              >
                                <DollarSign className="h-4 w-4" />
                              </motion.div>
                              {job.salary}
                            </div>
                            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="mr-2"
                              >
                                <Clock className="h-4 w-4" />
                              </motion.div>
                              {job.duration} min
                            </div>
                          </motion.div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.1 + idx * 0.1 }}
                            className="mt-3"
                          >
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 bg-green-500 rounded-full mr-2"
                              ></motion.div>
                              {job.status}
                            </span>
                          </motion.div>
                        </div>
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.2 + idx * 0.1 }}
                          className="flex space-x-3 ml-4"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const computedLink = job.link || job.interviewLink || `${window.location.origin}/interview/${job.interviewId}`;
                              setInterviewLink(computedLink);
                              setLinkCopied(false);
                              try { window.open(computedLink, '_blank'); } catch (_) {}
                            }}
                            className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border border-blue-500/30' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'}`}
                          >
                            <motion.div
                              whileHover={{ rotate: 45 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Link className="h-4 w-4" />
                            </motion.div>
                            <span>Get Link</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedInterviewId(job.interviewId);
                              setActiveTab('answers');
                            }}
                            className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-500/30' : 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'}`}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FileText className="h-4 w-4" />
                            </motion.div>
                            <span>View Performance</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              if (!window.confirm('Delete this interview? This cannot be undone.')) return;
                              try {
                                const res = await apiService.deleteInterview(job.interviewId);
                                if (res?.success) {
                                  setJobs(prev => prev.filter(j => (j.id || j.interviewId) !== (job.id || job.interviewId)));
                                } else {
                                  alert('Failed to delete interview');
                                }
                              } catch (e) {
                                alert('Error deleting interview');
                              }
                            }}
                            className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'}`}
                          >
                            <motion.span
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              Delete
                            </motion.span>
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="mb-6"
                  >
                    <Bot className="h-16 w-16 text-gray-400 mx-auto" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7 }}
                    className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    No AI interview jobs created yet
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Create your first job with AI-powered interviews
                  </motion.p>
                </motion.div>
              )}
            </div>
          </motion.div>
          </>
        )}

        {activeTab === 'candidates' && (
          <CandidateComparison />
        )}

        {activeTab === 'answers' && (
          <div className="space-y-8">
            {/* Modern Performance Dashboard Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-slate-900/50 border border-blue-500/30 backdrop-blur' : 'bg-gradient-to-r from-blue-600 to-slate-700'} rounded-2xl shadow-2xl p-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                    🎯 Performance Analytics
                  </h2>
                  <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-100'} text-lg`}>
                    Comprehensive candidate performance insights and detailed interview analysis
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {selectedInterviewId ? groupAnswersByCandidate().length : 0}
                    </div>
                    <div className="text-sm text-blue-100">Candidates</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {selectedInterviewId ? answers.length : 0}
                    </div>
                    <div className="text-sm text-blue-100">Total Answers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Selection */}
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Select Interview to Analyze
                </h3>
                <button
                  onClick={() => selectedInterviewId && loadAnswers(selectedInterviewId, selectedCandidateId)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  🔄 Refresh Data
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    🎯 Interview Selection
                  </label>
                  <select
                    value={selectedInterviewId || ''}
                    onChange={(e) => setSelectedInterviewId(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="" disabled>Select an interview to analyze</option>
                    {jobs.map(job => (
                      <option key={job.interviewId} value={job.interviewId}>
                        {job.title} - {job.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    🔍 Filter by Candidate (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    placeholder="candidate@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Performance Dashboard Content */}
            {selectedInterviewId && (
              <div className="space-y-6">
                {answersLoading ? (
                  <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading performance data...</p>
                  </div>
                ) : groupAnswersByCandidate().length > 0 ? (
                  <>
                    {/* Performance Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Candidates</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {groupAnswersByCandidate().length}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average Score</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {(groupAnswersByCandidate().reduce((sum, c) => sum + (c.averageScore || 0), 0) / groupAnswersByCandidate().length).toFixed(1)}/4
                            </p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-xl">
                            <BarChart3 className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Answers</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {answers.length}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completion Rate</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {Math.round((answers.length / (groupAnswersByCandidate().length * 5)) * 100)}%
                            </p>
                          </div>
                          <div className="p-3 bg-orange-100 rounded-xl">
                            <CheckCircle className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Performance Cards */}
                    <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                        👥 Candidate Performance Analysis
                      </h3>
                      
                      <div className="space-y-4">
                        {groupAnswersByCandidate().map((candidate, index) => (
                          <div key={candidate.candidateId} className={`${isDarkMode ? 'bg-black/30 border border-blue-500/20' : 'bg-gray-50 border border-gray-200'} rounded-xl p-6 transition-all duration-200 hover:shadow-lg`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                  candidate.averageScore >= 3 ? 'bg-green-500' : 
                                  candidate.averageScore >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}>
                                  {candidate.candidateName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {candidate.candidateName}
                                  </h4>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {candidate.candidateEmail}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-6">
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {(candidate.averageScore || 0).toFixed(1)}/4
                                  </div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Score</div>
                                </div>
                                
                                <button
                                  onClick={() => toggleExpand(candidate.candidateId)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    expandedCandidates[candidate.candidateId]
                                      ? isDarkMode 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-blue-600 text-white'
                                      : isDarkMode 
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {expandedCandidates[candidate.candidateId] ? '📖 Hide Details' : '📖 View Details'}
                                </button>
                              </div>
                            </div>

                            {/* Performance Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Performance</span>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                  {Math.round((candidate.averageScore / 4) * 100)}%
                                </span>
                              </div>
                              <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                                <div 
                                  className={`h-3 rounded-full transition-all duration-1000 ${
                                    candidate.averageScore >= 3 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                                    candidate.averageScore >= 2 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                                    'bg-gradient-to-r from-red-500 to-red-600'
                                  }`}
                                  style={{ width: `${(candidate.averageScore / 4) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedCandidates[candidate.candidateId] && (
                              <div className={`${isDarkMode ? 'bg-black/30 border border-blue-500/20' : 'bg-white border border-gray-200'} rounded-xl p-6 mt-4`}>
                                <h5 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                                  📝 Detailed Interview Responses
                                </h5>
                                
                                <div className="space-y-4">
                                  {answers
                                    .filter(a => a.candidateId === candidate.candidateId)
                                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                    .map((answer, idx) => (
                                      <div key={idx} className={`${isDarkMode ? 'bg-black/20 border border-blue-500/20' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              answer.roundTitle ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {answer.roundTitle || 'Round'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              answer.type === 'voice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                              {answer.type?.toUpperCase() || 'TEXT'}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {new Date(answer.timestamp).toLocaleString()}
                                          </div>
                                        </div>
                                        
                                        <div className="mb-3">
                                          <h6 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                                            Q: {answer.question}
                                          </h6>
                                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                                            A: {answer.answer}
                                          </p>
                                        </div>

                                        {answer.aiEvaluation && (
                                          <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/20' : 'bg-white border border-gray-200'} rounded-lg p-4`}>
                                            <div className="flex items-center justify-between mb-3">
                                              <h6 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                🤖 AI Evaluation
                                              </h6>
                                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                answer.aiEvaluation.score >= 3 ? 'bg-green-100 text-green-800' : 
                                                answer.aiEvaluation.score >= 2 ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {answer.aiEvaluation.score}/4
                                              </div>
                                            </div>
                                            
                                            {answer.aiEvaluation.feedback && (
                                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                                                {answer.aiEvaluation.feedback}
                                              </p>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {answer.aiEvaluation.strengths?.length > 0 && (
                                                <div>
                                                  <h6 className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'} mb-2`}>
                                                    ✅ Strengths
                                                  </h6>
                                                  <ul className="space-y-1">
                                                    {answer.aiEvaluation.strengths.slice(0, 3).map((strength, i) => (
                                                      <li key={i} className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        • {strength}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              
                                              {answer.aiEvaluation.improvements?.length > 0 && (
                                                <div>
                                                  <h6 className={`text-sm font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'} mb-2`}>
                                                    🎯 Improvements
                                                  </h6>
                                                  <ul className="space-y-1">
                                                    {answer.aiEvaluation.improvements.slice(0, 3).map((improvement, i) => (
                                                      <li key={i} className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        • {improvement}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      No Performance Data Yet
                    </h3>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Candidates haven't started this interview yet. Share the interview link to begin collecting performance data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!selectedInterviewId && (
              <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                <div className="text-6xl mb-4">🎯</div>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Select an Interview
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Choose an interview from the dropdown above to view detailed performance analytics and candidate insights.
                </p>
              </div>
            )}
          </div>
        )}

                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      {/* Interview Selection */}
                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Select Interview to View Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {jobs.map((job) => (
                            <button
                              key={job.interviewId}
                              onClick={() => setSelectedInterviewId(job.interviewId)}
                              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                                selectedInterviewId === job.interviewId
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <h3 className="font-medium text-gray-900">{job.title}</h3>
                              <p className="text-sm text-gray-600">{job.jobTitle}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interview Statistics */}
                      {interviewStats && (
                        <>
                          <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Interview Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{interviewStats.statistics.totalCandidates}</div>
                                <div className="text-sm text-gray-600">Total Candidates</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{interviewStats.statistics.completedInterviews}</div>
                                <div className="text-sm text-gray-600">Completed Interviews</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{interviewStats.statistics.averageScore.toFixed(1)}/4</div>
                                <div className="text-sm text-gray-600">Average Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{interviewStats.statistics.completionRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600">Completion Rate</div>
                              </div>
                            </div>
                          </div>

                          {/* Candidate Performance */}
                          <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Candidate Performance</h3>
                            <div className="space-y-4">
                              {interviewStats.candidateSummaries.map((candidate, index) => (
                                <div key={candidate.candidateId} className={`border ${isDarkMode ? 'border-blue-500/30' : 'border-gray-200'} rounded-xl p-4`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{candidate.candidateName}</h4>
                                      <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-blue-600">{candidate.averageScore.toFixed(1)}/4</div>
                                      <div className="text-sm text-gray-600">Average Score</div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div>
                                      <h5 className="text-sm font-medium text-green-700 mb-1">Strengths:</h5>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {candidate.strengths.slice(0, 3).map((strength, i) => (
                                          <li key={i}>• {strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-red-700 mb-1">Areas for Improvement:</h5>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {candidate.improvements.slice(0, 3).map((improvement, i) => (
                                          <li key={i}>• {improvement}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {!selectedInterviewId && (
                        <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-gray-50'} rounded-xl p-8 text-center`}>
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Select an interview above to view detailed analytics</p>
                        </div>
                      )}
                    </div>
                  )}
        </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterDashboard;


