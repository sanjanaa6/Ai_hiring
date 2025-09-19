import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import UserLayout from '../components/UserLayout';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Link, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Briefcase
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
      <div className="py-8" style={{
        background: isDarkMode
          ? 'radial-gradient(1200px 700px at -10% 0%, rgba(59,130,246,.08), transparent), radial-gradient(1000px 600px at 110% -10%, rgba(6,182,212,.08), transparent)'
          : undefined
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div className={`mb-8 text-center p-8 rounded-2xl border ${isDarkMode ? 'bg-white/10 border-white/10 backdrop-blur' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <Bot className="h-10 w-10 text-white" />
            </div>
            <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              AI Interview Portal
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Enter your interview link to start your AI-powered interview and showcase your skills
            </p>
          </motion.div>

          {/* Interview Link Input */}
          <motion.div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-xl p-8 mb-8`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
                <Link className="h-8 w-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Join Your Interview
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter the interview link provided by the recruiter to begin your AI-powered interview
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  Interview Link
                </label>
                <input
                  type="url"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  placeholder="https://yourapp.com/interview/interview_123456789"
                  className={`w-full px-6 py-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg ${isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' : 'border-2 border-gray-300'}`}
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleJoinInterview}
                disabled={loading || !interviewLink.trim()}
                className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Joining Interview...</span>
                  </>
                ) : (
                  <>
                    <Link className="h-5 w-5" />
                    <span>Join Interview</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Candidate Info (optional) */}
          <motion.div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-lg shadow p-6`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{candidateInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{candidateInfo.experience}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {candidateInfo.skills.length > 0 ? (
                    candidateInfo.skills.map((skill, index) => (
                      <span key={index} className={`px-3 py-1 text-sm rounded-full ${isDarkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-blue-100 text-blue-800'}`}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No skills listed</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </UserLayout>
  );
};

export default CandidateDashboard;
