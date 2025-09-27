import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  CheckCircle, 
  Link as LinkIcon,
  Clock,
  Users,
  Target,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitcher from '../../components/common/ThemeSwitcher';

// Use apiService instead of custom axios instance

const InterviewReviewer = () => {
  console.log('InterviewReviewer component rendered');
  const { interviewId } = useParams();
  const { isDarkMode } = useTheme();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRound, setEditingRound] = useState(null);
  const [shareableLink, setShareableLink] = useState(null);
  const [saving, setSaving] = useState(false);
  const [token] = useState(localStorage.getItem('token'));
  const [copied, setCopied] = useState(false);
  const [showLinkPreview, setShowLinkPreview] = useState(false);

  const fetchInterview = useCallback(async () => {
    console.log('Fetching interview with ID:', interviewId);
    console.log('API Base URL:', apiService.client.defaults.baseURL);
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getInterview(interviewId);
      
      console.log('API Response:', response);
      console.log('Interview data:', response);
      
      // Handle different response structures
      let interviewData = response;
      if (response.data) {
        interviewData = response.data;
      } else if (response.success !== false) {
        interviewData = response;
      }
      
      console.log('Processed interview data:', interviewData);
      setInterview(interviewData);
    } catch (err) {
      console.error('Error fetching interview:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load interview details';
      setError(errorMessage);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        setError('You do not have permission to access this interview. Please contact the recruiter.');
      } else if (err.response?.status === 404) {
        setError('Interview not found. Please check the URL and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  const handleRoundEdit = (roundIndex) => {
    setEditingRound(roundIndex);
  };

  const handleQuestionEdit = (roundIndex, questionIndex, updatedQuestion) => {
    const updatedInterview = { ...interview };
    updatedInterview.rounds[roundIndex].questions[questionIndex] = updatedQuestion;
    setInterview(updatedInterview);
  };

  const handleRoundDelete = (roundIndex) => {
    if (window.confirm('Are you sure you want to delete this round?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds.splice(roundIndex, 1);
      setInterview(updatedInterview);
    }
  };

  const handleQuestionDelete = (roundIndex, questionIndex) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].questions.splice(questionIndex, 1);
      setInterview(updatedInterview);
    }
  };

  const handleAddQuestion = (roundIndex) => {
    const newQuestion = {
      id: `q${roundIndex + 1}_${(interview?.rounds?.[roundIndex]?.questions || []).length + 1}`,
      type: "technical",
      question: prompt('Enter the new question:') || 'New question',
      expectedAnswer: prompt('Enter the expected answer:') || 'Expected answer',
      timeLimit: 3,
      difficulty: "medium",
      followUpQuestions: []
    };
    
    if (newQuestion.question !== 'New question') {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].questions.push(newQuestion);
      setInterview(updatedInterview);
    }
  };

  const handleAddRound = () => {
    const newRound = {
      roundId: `round_${(interview?.rounds || []).length + 1}`,
      roundNumber: (interview?.rounds || []).length + 1,
      title: prompt('Enter round title:') || 'New Round',
      description: prompt('Enter round description:') || 'New round description',
      duration: parseInt(prompt('Enter duration in minutes:') || '10'),
      questions: [],
      evaluationCriteria: {
        technical: '',
        communication: '',
        problemSolving: '',
        culturalFit: '',
        leadership: '',
        motivation: ''
      }
    };
    
    if (newRound.title !== 'New Round') {
      const updatedInterview = { ...interview };
      updatedInterview.rounds.push(newRound);
      setInterview(updatedInterview);
    }
  };

  const handleSave = async () => {
    try {
      const result = await apiService.updateInterview(interviewId, {
        rounds: interview?.rounds || [],
        title: interview?.title || '',
        totalDuration: interview?.totalDuration || 0
      });
      
      if (result.success) {
        setEditingRound(null);
        alert('Changes saved successfully!');
      } else {
        setError('Failed to save changes: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    }
  };

  const handleApprove = async () => {
    try {
      console.log('🔄 [APPROVE] Attempting to approve interview:', interviewId);
      setSaving(true);
      
      const response = await apiService.client.post(`/interviews/${interviewId}/approve`);
      
      if (response.data.success) {
        console.log('✅ [APPROVE] Interview approved successfully:', response.data);
        // Update local state to reflect approval
        setInterview(prev => ({
          ...prev,
          approvalStatus: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: localStorage.getItem('userId')
        }));
        
        // Generate shareable link
        const shareableUrl = `${window.location.origin}/interviews/${interviewId}`;
        setShareableLink(shareableUrl);
        
        // Show success message
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to approve interview');
      }
    } catch (err) {
      console.error('❌ [APPROVE] Error:', err);
      setError(err.message || 'Failed to approve interview. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Interview Link',
          text: 'Check out this interview',
          url: shareableLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="text-center">
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Authentication Required
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Please log in to access this interview review page.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/login'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full mx-auto mb-4`}
        />
        <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Loading interview details...
        </p>
      </motion.div>
    </div>
  );
  
  if (error) return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="text-center">
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Error Loading Interview
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {error}
          </p>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  if (!interview) return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="text-center">
          <Target className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Interview Not Found
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            The interview you're looking for could not be found. Please check the URL and try again.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with theme toggle */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDarkMode 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.history.back()}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {interview?.title || 'Interview Review'}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Interview Review & Management
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ThemeSwitcher />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Interview Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                interview.approvalStatus === 'approved' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {interview.approvalStatus === 'approved' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {interview.approvalStatus === 'approved' ? 'Interview Approved' : 'Pending Approval'}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {interview.approvalStatus === 'approved' 
                    ? 'This interview is ready to be shared with candidates'
                    : 'Review and approve this interview to generate shareable link'
                  }
                </p>
              </div>
            </div>
            {interview.approvalStatus !== 'approved' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleApprove}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve & Generate Link
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Shareable Link Card */}
        <AnimatePresence>
          {shareableLink && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-8 p-6 rounded-2xl shadow-xl border-2 border-green-200 ${
                isDarkMode 
                  ? 'bg-green-900/20 border-green-800' 
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <LinkIcon className="w-5 h-5 text-green-600" />
                </div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Interview Approved! 🎉
                </h2>
              </div>
              
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Your interview is now ready to be shared with candidates. Use the link below:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex-1 p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-300' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                      <span className="font-mono text-sm break-all">{shareableLink}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className={`p-3 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShareLink}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLinkPreview(!showLinkPreview)}
                    className={`px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {showLinkPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showLinkPreview ? 'Hide Preview' : 'Show Preview'}
                  </motion.button>
                </div>
                
                {showLinkPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Link Preview
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      When candidates click this link, they'll be taken to the interview page where they can start the interview process.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interview Rounds Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Interview Rounds
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage and review interview rounds and questions
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddRound}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Round
            </motion.button>
          </div>

          <div className="grid gap-6" key={interview?.interviewId || 'no-interview'}>
            {(interview?.rounds || []).map((round, roundIndex) => (
              <motion.div
                key={round.roundId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: roundIndex * 0.1 }}
                className={`p-6 rounded-2xl shadow-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {round.title}
                      </h3>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {round.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className={`flex items-center gap-2 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Clock className="w-4 h-4" />
                        {round.duration} minutes
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Target className="w-4 h-4" />
                        {round.questions.length} questions
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRoundEdit(roundIndex)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRoundDelete(roundIndex)}
                      className="p-2 rounded-lg transition-colors duration-200 bg-red-100 hover:bg-red-200 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {editingRound === roundIndex && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddQuestion(roundIndex)}
                      className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </motion.button>
                  )}
                  
                  {(round?.questions || []).map((question, questionIndex) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: questionIndex * 0.05 }}
                      className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              Question {questionIndex + 1}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              question.difficulty === 'easy' 
                                ? 'bg-green-100 text-green-700' 
                                : question.difficulty === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
                          <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {question.question}
                          </p>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <strong>Expected Answer:</strong> {question.expectedAnswer}
                          </div>
                        </div>
                        {editingRound === roundIndex && (
                          <div className="flex gap-2 ml-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleQuestionEdit(roundIndex, questionIndex, {
                                ...question,
                                question: prompt('Edit question:', question.question)
                              })}
                              className="p-1 text-blue-500 hover:text-blue-600 transition-colors duration-200"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleQuestionDelete(roundIndex, questionIndex)}
                              className="p-1 text-red-500 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex gap-4 justify-end"
        >
          {editingRound !== null && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Make sure component is exported properly
export default InterviewReviewer;
export { InterviewReviewer };