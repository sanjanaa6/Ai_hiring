import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import UserLayout from '../components/UserLayout';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bot, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Briefcase,
  Search,
  FileText
} from 'lucide-react';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [interviewLink, setInterviewLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if there's an interview link in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const link = urlParams.get('link');
    if (link) {
      setInterviewLink(link);
    }
  }, []);

  const handleJoinInterview = () => {
    if (!interviewLink.trim()) {
      setError('Please enter a valid interview link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract interview ID from link
      const url = new URL(interviewLink);
      const pathParts = url.pathname.split('/');
      const idWithMaybeQuery = pathParts[pathParts.length - 1];
      const id = idWithMaybeQuery.split('?')[0];
      
      if (id && id.startsWith('interview_')) {
        // Redirect to the canonical interview route so the page fetches full data
        navigate(`/interview/${id}`);
      } else {
        setError('Invalid interview link format');
      }
    } catch (error) {
      setError('Invalid interview link');
    } finally {
      setLoading(false);
    }
  };

  const candidateInfo = {
    name: user?.name || 'Candidate',
    email: user?.email || 'candidate@example.com',
    skills: user?.profile?.skills || [],
    experience: user?.candidateProfile?.experience || 'Not specified'
  };

  return (
    <UserLayout>
      <div className={`h-full flex flex-col ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col overflow-y-auto">
          {/* Compact Header */}
          <div className="flex-shrink-0 mb-4">
            <motion.div className={`text-center p-4 rounded-xl border backdrop-blur-md ${
              isDarkMode 
                ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
                : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
            }`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-700 rounded-full mb-3 shadow-2xl">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              AI Interview Portal
            </h1>
            <p className={`text-sm max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Enter your interview link to start your AI-powered interview
            </p>
          </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Interview Link Input */}
          <motion.div className={`backdrop-blur-md border-2 rounded-2xl p-6 flex flex-col transition-all duration-500 transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
              : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
          }`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-700 rounded-full mb-3 shadow-2xl">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Join Your Interview
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter the interview link provided by the recruiter
              </p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Interview Link
                </label>
                <input
                  type="url"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  placeholder="https://yourapp.com/interview/interview_123456789"
                  className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                      : 'border border-gray-300 bg-white'
                  }`}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              <button
                onClick={handleJoinInterview}
                disabled={loading || !interviewLink.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 hover:from-slate-700 hover:via-blue-500 hover:to-indigo-500 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm mt-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    <span>Join Interview</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Job Search Card */}
          <motion.div className={`backdrop-blur-md border-2 rounded-2xl p-6 flex flex-col transition-all duration-500 transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
              : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
          }`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 rounded-full mb-3 shadow-2xl">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h2 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Find Jobs
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Browse and apply to available job opportunities
              </p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                <p>• Search by skills, location, and experience</p>
                <p>• Apply to jobs with one click</p>
                <p>• Save jobs for later</p>
                <p>• Track your applications</p>
              </div>

              <Link
                to="/user/jobs"
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm mt-auto"
              >
                <Search className="h-4 w-4" />
                <span>Browse Jobs</span>
              </Link>
            </div>
          </motion.div>

          {/* Applications Card */}
          <motion.div className={`backdrop-blur-md border-2 rounded-2xl p-6 flex flex-col transition-all duration-500 transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
              : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
          }`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 rounded-full mb-3 shadow-2xl">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                My Applications
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Track your job applications and status
              </p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                <p>• View application status</p>
                <p>• Track interview progress</p>
                <p>• See recruiter feedback</p>
                <p>• Manage your applications</p>
              </div>

              <Link
                to="/user/applications"
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm mt-auto"
              >
                <FileText className="h-4 w-4" />
                <span>View Applications</span>
              </Link>
            </div>
          </motion.div>

          {/* Profile Card */}
          <motion.div className={`backdrop-blur-md border-2 rounded-2xl p-6 flex flex-col transition-all duration-500 transform hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/60 via-gray-900/40 to-black/30 border-slate-600/40 shadow-2xl shadow-slate-500/30' 
              : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-300 shadow-2xl shadow-blue-200/50'
          }`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-700 rounded-full mb-3 shadow-2xl">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your Profile</h3>
            </div>
            
            <div className="space-y-3 flex-1">
              <div>
                <h4 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-gray-500" />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{candidateInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{candidateInfo.experience}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {candidateInfo.skills.length > 0 ? (
                    candidateInfo.skills.slice(0, 6).map((skill, index) => (
                      <span key={index} className={`px-2 py-1 text-xs rounded-full ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-slate-700/60 to-blue-600/60 text-white border border-slate-600/40' 
                          : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
                      }`}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No skills listed</span>
                  )}
                </div>
                {candidateInfo.skills.length > 6 && (
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    +{candidateInfo.skills.length - 6} more
                  </span>
                )}
              </div>

              <Link
                to="/user/profile"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 hover:from-slate-600 hover:via-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm mt-auto"
              >
                <User className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default CandidateDashboard;
