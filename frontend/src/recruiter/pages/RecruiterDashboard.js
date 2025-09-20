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
      <div className="py-8" style={{
        background: isDarkMode
          ? 'radial-gradient(1200px 700px at -10% 0%, rgba(59,130,246,.08), transparent), radial-gradient(1000px 600px at 110% -10%, rgba(6,182,212,.08), transparent)'
          : undefined
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className={`mb-8 p-6 rounded-lg border ${isDarkMode ? 'bg-white/10 border-white/10 backdrop-blur text-white' : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'}`}>
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              AI Hiring Platform
          </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Create jobs with AI-powered multi-round interviews and manage candidates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Jobs & Interviews</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidates'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Candidates</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('answers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'answers'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Answers</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6 transition-transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active Jobs</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{jobs.length}</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6 transition-transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bot className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>AI Interviews</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{jobs.length}</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6 transition-transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Candidates</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>0</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6 transition-transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>0</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Create Job Button */}
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowCreateJob(true)}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg"
            >
              <Plus className="h-6 w-6" />
              <span>Create Job with AI Interview</span>
            </button>
          </div>

          {/* Create Job Modal - Full Page */}
          {showCreateJob && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-hidden"
            >
              {/* Backdrop */}
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'}`} />
              
              {/* Main Content */}
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'} border-b backdrop-blur-md`}>
                  <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-500/20' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
                          <Sparkles className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-white'}`} />
                        </div>
                        <div>
                          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Create AI-Powered Interview
                          </h1>
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                            Describe your ideal candidate and let AI generate everything
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateJob(false)}
                        className={`p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Main Form */}
                      <div className="lg:col-span-2">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'} rounded-2xl border backdrop-blur-md p-8`}
                        >
                          <div className="mb-6">
                            <label className={`block text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                              Job Description Prompt *
                            </label>
                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 leading-relaxed`}>
                              Describe the job you want to hire for. Be as detailed as possible - include job title, level, requirements, responsibilities, company info, etc. AI will extract all details and create tailored interview questions.
                            </p>
                            <div className="relative">
                              <textarea
                                value={jobPrompt}
                                onChange={(e) => setJobPrompt(e.target.value)}
                                rows={16}
                                className={`w-full px-6 py-4 rounded-xl border-2 transition-all duration-200 resize-none focus:outline-none ${
                                  isDarkMode 
                                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20'
                                }`}
                                placeholder="Example: I need to hire a Senior React Developer for our fintech startup. The role involves building modern web applications using React, TypeScript, and Node.js. Requirements include 5+ years of React experience, strong knowledge of JavaScript/TypeScript, experience with Redux, REST APIs, and Git. The person will work remotely, salary range $100k-$140k. They'll be responsible for developing new features, maintaining existing code, and mentoring junior developers..."
                              />
                              <div className={`absolute bottom-4 right-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {jobPrompt.length} characters (minimum 10 required)
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => setShowCreateJob(false)}
                              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={generateAIInterview}
                              disabled={loading || jobPrompt.trim().length < 10}
                              className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl transition-all duration-200 font-semibold transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  <span>Creating AI Interview...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-5 w-5" />
                                  <span>Generate AI Interview</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* AI Features */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} rounded-2xl border backdrop-blur-md p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-100'}`}>
                              <Bot className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              AI Magic ✨
                            </h3>
                          </div>
                          <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <li className="flex items-start space-x-3">
                              <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                              <span className="text-sm">Extract job title & level automatically</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                              <span className="text-sm">Generate 5 tailored interview rounds</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                              <span className="text-sm">Create role-specific questions</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                              <span className="text-sm">Optimize interview duration</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                              <span className="text-sm">Include company context</span>
                            </li>
                          </ul>
                        </motion.div>

                        {/* Tips */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'} rounded-2xl border backdrop-blur-md p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-100'}`}>
                              <svg className={`h-6 w-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Pro Tips
                            </h3>
                          </div>
                          <ul className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <li className="flex items-start space-x-3">
                              <span className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
                              <span>Include specific technologies and frameworks</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <span className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
                              <span>Mention years of experience required</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <span className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
                              <span>Describe company culture and values</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <span className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
                              <span>Include salary range and benefits</span>
                            </li>
                            <li className="flex items-start space-x-3">
                              <span className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
                              <span>Specify remote/hybrid/onsite work</span>
                            </li>
                          </ul>
                        </motion.div>

                        {/* Example */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'} rounded-2xl border backdrop-blur-md p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/30' : 'bg-green-100'}`}>
                              <FileText className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            </div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Example Output
                            </h3>
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                            <p><strong>Job Title:</strong> Senior React Developer</p>
                            <p><strong>Duration:</strong> 25-30 minutes</p>
                            <p><strong>Rounds:</strong> 5 interview rounds</p>
                            <p><strong>Questions:</strong> 15+ tailored questions</p>
                            <p><strong>Focus:</strong> Technical skills, problem-solving, culture fit</p>
                          </div>
                        </motion.div>
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
                  <p className="text-sm text-gray-600"><strong>Total Questions:</strong> {generatedInterview.rounds?.reduce((total, round) => total + round.questions.length, 0) || generatedInterview.questions?.length} questions</p>
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

          {/* Jobs List */}
          <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow`}>
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your AI Interview Jobs</h2>
              <span className={`text-sm px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{jobs.length} total</span>
            </div>
            <div className="p-6">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job, idx) => (
                    <motion.div
                      key={job.id || idx}
                      className={`rounded-lg p-4 ${isDarkMode ? 'border border-white/10 bg-white/5' : 'border border-gray-200 bg-white'} transition-transform`}
                      whileHover={{ y: -3 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{job.title}</h3>
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{job.company}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <p className={`text-sm flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </p>
                            <p className={`text-sm flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <DollarSign className="h-4 w-4 mr-1" />
                              {job.salary}
                            </p>
                            <p className={`text-sm flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <Clock className="h-4 w-4 mr-1" />
                              {job.duration} min
                            </p>
                          </div>
                          <div className="mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'}`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              const computedLink = job.link || job.interviewLink || `${window.location.origin}/interview/${job.interviewId}`;
                              setInterviewLink(computedLink);
                              setLinkCopied(false);
                              try { window.open(computedLink, '_blank'); } catch (_) {}
                            }}
                            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${isDarkMode ? 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                          >
                            <Link className="h-4 w-4" />
                            <span>Get Link</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInterviewId(job.interviewId);
                              setActiveTab('answers');
                            }}
                            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${isDarkMode ? 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}`}
                          >
                            <FileText className="h-4 w-4" />
                            <span>View Performance</span>
                          </button>
                          <button
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
                            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${isDarkMode ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                          >
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No AI interview jobs created yet</p>
                  <p className="text-sm text-gray-400">Create your first job with AI-powered interviews</p>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {activeTab === 'candidates' && (
          <CandidateComparison />
        )}

        {activeTab === 'answers' && (
          <div className="space-y-6">
            {/* Select interview for answers */}
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Interview Answers</h2>
                <button
                  onClick={() => selectedInterviewId && loadAnswers(selectedInterviewId, selectedCandidateId)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Interview</label>
                  <select
                    value={selectedInterviewId || ''}
                    onChange={(e) => setSelectedInterviewId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="" disabled>Select an interview</option>
                    {jobs.map(job => (
                      <option key={job.interviewId} value={job.interviewId}>{job.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Candidate ID (email)</label>
                  <input
                    type="text"
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Candidates list */}
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Candidates</h3>
                {answersLoading && <div className="text-sm text-gray-500">Loading...</div>}
              </div>

              {selectedInterviewId ? (
                groupAnswersByCandidate().length ? (
                  <div className="space-y-3">
                    {groupAnswersByCandidate().map((c) => (
                      <div key={c.candidateId} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleExpand(c.candidateId)}
                          className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{c.candidateName}</div>
                            <div className="text-sm text-gray-600">{c.candidateEmail}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Avg Score</div>
                            <div className="text-lg font-semibold text-purple-600">{(c.averageScore || 0).toFixed(1)}/4</div>
                          </div>
                        </button>

                        {expandedCandidates[c.candidateId] && (
                          <div className="p-4 border-t border-gray-200">
                            {/* Transcript */}
                            <div className="space-y-3">
                              {answers
                                .filter(a => a.candidateId === c.candidateId)
                                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                .map((a, idx) => (
                                  <div key={idx} className="bg-gray-50 rounded-md p-3">
                                    <div className="text-xs text-gray-500 mb-1">
                                      {a.roundTitle ? `${a.roundTitle} • ` : ''}{a.type?.toUpperCase()} • {new Date(a.timestamp).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-900 font-medium">Q: {a.question}</div>
                                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">A: {a.answer}</div>
                                    {a.aiEvaluation && (
                                      <div className="mt-2 bg-white rounded border border-gray-200 p-2">
                                        <div className="text-xs text-gray-500">AI Feedback</div>
                                        <div className="text-sm text-gray-900">Score: {a.aiEvaluation.score}/4</div>
                                        {a.aiEvaluation.feedback && (
                                          <div className="text-sm text-gray-700 mt-1">{a.aiEvaluation.feedback}</div>
                                        )}
                                        {(a.aiEvaluation.strengths?.length || 0) > 0 && (
                                          <div className="text-xs text-gray-600 mt-2">
                                            <span className="font-medium text-gray-700">Strengths:</span> {a.aiEvaluation.strengths.slice(0,3).join(', ')}
                                          </div>
                                        )}
                                        {(a.aiEvaluation.improvements?.length || 0) > 0 && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            <span className="font-medium text-gray-700">Improvements:</span> {a.aiEvaluation.improvements.slice(0,3).join(', ')}
                                          </div>
                                        )}
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
                ) : (
                  <div className="text-sm text-gray-500">No candidate answers yet.</div>
                )
              ) : (
                <div className="text-sm text-gray-500">Select an interview to view answers.</div>
              )}
            </div>
          </div>
        )}

                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      {/* Interview Selection */}
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Interview to View Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {jobs.map((job) => (
                            <button
                              key={job.interviewId}
                              onClick={() => setSelectedInterviewId(job.interviewId)}
                              className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                                selectedInterviewId === job.interviewId
                                  ? 'border-purple-500 bg-purple-50 shadow-md'
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
                          <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Analytics</h2>
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
                                <div className="text-3xl font-bold text-purple-600">{interviewStats.statistics.averageScore.toFixed(1)}/4</div>
                                <div className="text-sm text-gray-600">Average Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{interviewStats.statistics.completionRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600">Completion Rate</div>
                              </div>
                            </div>
                          </div>

                          {/* Candidate Performance */}
                          <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Performance</h3>
                            <div className="space-y-4">
                              {interviewStats.candidateSummaries.map((candidate, index) => (
                                <div key={candidate.candidateId} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{candidate.candidateName}</h4>
                                      <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-purple-600">{candidate.averageScore.toFixed(1)}/4</div>
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
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Select an interview above to view detailed analytics</p>
                        </div>
                      )}
                    </div>
                  )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterDashboard;


