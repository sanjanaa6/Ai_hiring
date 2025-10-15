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
  Upload,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitcher from '../../components/common/ThemeSwitcher';
import FileUploadRoundManager from './FileUploadRoundManager';
import FormFieldManager from './FormFieldManager';
import FormSubmissionViewer from './FormSubmissionViewer';
import SystemDesignViewer from './SystemDesignViewer';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('rounds');
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [showAddFileRequirementModal, setShowAddFileRequirementModal] = useState(false);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(null);
  const [selectedFormRound, setSelectedFormRound] = useState(null);
  const [systemDesignSubmissions, setSystemDesignSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [newRoundData, setNewRoundData] = useState({
    type: 'interview',
    title: '',
    description: '',
    duration: 10
  });
  const [newFileRequirement, setNewFileRequirement] = useState({
    title: '',
    description: '',
    fileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10,
    required: true
  });

  const fetchInterview = useCallback(async () => {
    console.log('Fetching interview with ID:', interviewId);
    console.log('API Base URL:', apiService.client.defaults.baseURL);
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Check if this is an Electronics interview by ID pattern
      if (interviewId.startsWith('electronics_interview_')) {
        console.log('Detected Electronics interview, using Electronics service...');
        const { default: electronicsInterviewService } = await import('../../services/electronicsInterviewService');
        response = await electronicsInterviewService.getElectronicsInterview(interviewId);
        response = { success: true, data: response };
      } else {
        console.log('Using regular interview API...');
        response = await apiService.getInterview(interviewId);
      }
      
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
      console.log('Interview rounds:', interviewData.rounds);
      if (interviewData.rounds) {
        // Ensure allowRetake is always a boolean for all rounds
        interviewData.rounds.forEach((round, index) => {
          if (round.allowRetake === undefined) {
            round.allowRetake = false;
            console.log(`🔧 Fixed undefined allowRetake for round ${index + 1}, set to false`);
          }
          console.log(`Round ${index}:`, round);
          console.log(`Round ${index} type:`, round.type);
          console.log(`Round ${index} allowRetake:`, round.allowRetake, typeof round.allowRetake);
          console.log(`Round ${index} fileUploadRequirements:`, round.fileUploadRequirements);
          console.log(`Round ${index} formFields:`, round.formFields);
        });
      }
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

  // Fetch system design submissions
  const fetchSystemDesignSubmissions = useCallback(async () => {
    if (!interviewId) return;
    
    setLoadingSubmissions(true);
    try {
      const response = await apiService.get(`/interviews/system-design/${interviewId}/all`);
      if (response.data.success) {
        setSystemDesignSubmissions(response.data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch system design submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [interviewId]);

  // Fetch submissions when system-design tab is active
  useEffect(() => {
    if (activeTab === 'system-design') {
      fetchSystemDesignSubmissions();
    }
  }, [activeTab, fetchSystemDesignSubmissions]);

  const handleRoundEdit = (roundIndex) => {
    setEditingRound(roundIndex);
  };

  const handleQuestionEdit = (roundIndex, questionIndex, updatedQuestion) => {
    const updatedInterview = { ...interview };
    updatedInterview.rounds[roundIndex].questions[questionIndex] = updatedQuestion;
    setInterview(updatedInterview);
    markAsChanged();
  };

  const handleRoundDelete = (roundIndex) => {
    if (window.confirm('Are you sure you want to delete this round?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds.splice(roundIndex, 1);
      setInterview(updatedInterview);
      markAsChanged();
    }
  };

  const handleQuestionDelete = (roundIndex, questionIndex) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].questions.splice(questionIndex, 1);
      setInterview(updatedInterview);
      markAsChanged();
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
      markAsChanged();
    }
  };

  const handleAddRound = () => {
    setNewRoundData({
      type: 'interview',
      title: '',
      description: '',
      duration: 10
    });
    setShowAddRoundModal(true);
  };

  const handleSaveRound = async () => {
    if (!newRoundData.title.trim() || !newRoundData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const newRound = {
      roundId: `round_${Date.now()}`,
      roundNumber: (interview?.rounds || []).length + 1,
      title: newRoundData.title,
      description: newRoundData.description,
      duration: newRoundData.duration,
      type: newRoundData.type,
      allowRetake: false, // Default to false for new rounds
      questions: newRoundData.type === 'interview' ? [] : undefined,
      fileUploadRequirements: newRoundData.type === 'file_upload' ? [] : undefined,
      formFields: newRoundData.type === 'form_submission' ? [] : undefined,
      evaluationCriteria: {
        technical: '',
        communication: '',
        problemSolving: '',
        culturalFit: '',
        leadership: '',
        motivation: ''
      }
    };

    console.log('Creating new round:', newRound);
    console.log('Round type being saved:', newRound.type);
    console.log('File upload requirements being saved:', newRound.fileUploadRequirements);
    
    const updatedInterview = { ...interview };
    updatedInterview.rounds.push(newRound);
    setInterview(updatedInterview);
    markAsChanged();
    setShowAddRoundModal(false);

    // Save to backend immediately
    try {
      console.log('Saving new round to backend:', newRound);
      console.log('Full interview data being sent:', JSON.stringify(updatedInterview, null, 2));
      await apiService.updateInterview(interviewId, updatedInterview);
      console.log('Round saved successfully to backend');
    } catch (error) {
      console.error('Error saving round to backend:', error);
    }
  };

  // Function to add file upload requirement to a round
  const handleAddFileRequirement = (roundIndex) => {
    setSelectedRoundIndex(roundIndex);
    setNewFileRequirement({
      title: '',
      description: '',
      fileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10,
      required: true
    });
    setShowAddFileRequirementModal(true);
  };

  const handleSaveFileRequirement = async () => {
    if (!newFileRequirement.title.trim() || !newFileRequirement.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const requirement = {
      id: `req_${Date.now()}`,
      title: newFileRequirement.title,
      description: newFileRequirement.description,
      fileTypes: newFileRequirement.fileTypes,
      maxFileSize: newFileRequirement.maxFileSize,
      required: newFileRequirement.required
    };

    const updatedInterview = { ...interview };
    if (!updatedInterview.rounds[selectedRoundIndex].fileUploadRequirements) {
      updatedInterview.rounds[selectedRoundIndex].fileUploadRequirements = [];
    }
    updatedInterview.rounds[selectedRoundIndex].fileUploadRequirements.push(requirement);
    
    console.log('Adding file requirement:', requirement);
    console.log('Updated round:', updatedInterview.rounds[selectedRoundIndex]);
    console.log('All requirements:', updatedInterview.rounds[selectedRoundIndex].fileUploadRequirements);
    
    setInterview(updatedInterview);
    markAsChanged();
    setShowAddFileRequirementModal(false);
    
    // Also save to backend immediately
    try {
      console.log('Saving interview to backend with data:', updatedInterview);
      console.log('Round being saved:', updatedInterview.rounds[selectedRoundIndex]);
      await apiService.updateInterview(interviewId, updatedInterview);
      console.log('Interview updated successfully with new file requirement');
      // Force a re-render by updating the state again
      setInterview({...updatedInterview});
    } catch (error) {
      console.error('Error saving interview:', error);
    }
  };

  // Function to remove file upload requirement
  const handleRemoveFileRequirement = (roundIndex, requirementIndex) => {
    if (window.confirm('Are you sure you want to remove this file requirement?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].fileUploadRequirements.splice(requirementIndex, 1);
      setInterview(updatedInterview);
      markAsChanged();
    }
  };

  // Function to mark that changes have been made
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const saveData = {
        rounds: interview?.rounds || [],
        title: interview?.title || '',
        totalDuration: interview?.totalDuration || 0,
        description: interview?.description || ''
      };
      
      console.log('InterviewReviewer: Saving interview data:', saveData);
      console.log('InterviewReviewer: Rounds being saved:', saveData.rounds);
      saveData.rounds.forEach((round, index) => {
        console.log(`InterviewReviewer: Round ${index + 1} type:`, round.type);
        console.log(`InterviewReviewer: Round ${index + 1} allowRetake:`, round.allowRetake);
        console.log(`InterviewReviewer: Round ${index + 1} formFields:`, round.formFields?.length || 0);
      });
      
      const result = await apiService.updateInterview(interviewId, saveData);
      
      if (result.success) {
        setEditingRound(null);
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
        
        console.log('✅ [SAVE] Interview saved successfully');
      } else {
        setError('Failed to save changes: ' + result.error);
      }
    } catch (err) {
      console.error('❌ [SAVE] Error saving changes:', err);
      setError('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
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

        {/* Interview Management Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('rounds')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'rounds'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Interview Rounds
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('file-uploads')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'file-uploads'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              File Upload Rounds
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('form-submissions')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'form-submissions'
                  ? 'bg-white text-green-600 shadow-sm'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Form Submissions
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('system-design')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'system-design'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              System Design
            </motion.button>
          </div>

          {/* Tab Content */}
          {activeTab === 'rounds' && (
            <div className="space-y-6">
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
            {/* Check if there are any file upload rounds */}
            {(interview?.rounds || []).filter(round => round.type === 'file_upload').length === 0 && (
              <div className={`p-6 rounded-lg border-2 border-dashed mb-6 ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700/30' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="text-center">
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    No File Upload Rounds Yet
                  </h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    To add file upload requirements, first create a "File Upload Round" by clicking "Add Round" and selecting "File Upload Round (Documents)".
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddRound}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add File Upload Round
                  </motion.button>
                </div>
              </div>
            )}

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
                        {round.type === 'file_upload' 
                          ? `${(round.fileUploadRequirements || []).length} file requirements`
                          : round.type === 'form_submission'
                          ? `${(round.formFields || []).length} form fields`
                          : `${(round.questions || []).length} questions`
                        }
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        round.type === 'file_upload'
                          ? 'bg-purple-100 text-purple-700' 
                          : round.type === 'form_submission'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {round.type === 'file_upload' ? '📁 File Upload' : 
                         round.type === 'form_submission' ? '📝 Form Submission' : '💬 Interview'}
                      </div>
                    </div>
                    
                    {/* Retake Toggle */}
                    <div className="flex items-center justify-between mt-4 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          Boolean(round.allowRetake)
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Allow Retake
                          </h4>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {Boolean(round.allowRetake)
                              ? 'Candidates can retake this round' 
                              : 'Candidates cannot retake this round'
                            }
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(round.allowRetake)}
                          onChange={(e) => {
                            console.log(`🔄 Toggle changed for round ${roundIndex + 1}:`, e.target.checked);
                            console.log(`🔄 Current round allowRetake:`, round.allowRetake, typeof round.allowRetake);
                            const updatedInterview = { ...interview };
                            updatedInterview.rounds[roundIndex].allowRetake = Boolean(e.target.checked);
                            console.log(`🔄 Updated round allowRetake:`, updatedInterview.rounds[roundIndex].allowRetake, typeof updatedInterview.rounds[roundIndex].allowRetake);
                            setInterview(updatedInterview);
                            markAsChanged();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
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

                {/* Questions or File Requirements */}
                <div className="space-y-4">
                  {editingRound === roundIndex && round.type !== 'form_submission' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => round.type === 'file_upload' 
                        ? handleAddFileRequirement(roundIndex) 
                        : handleAddQuestion(roundIndex)
                      }
                      className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {round.type === 'file_upload' ? 'Add File Requirement' : 'Add Question'}
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
                  
                  {/* Form Fields for Form Submission Rounds */}
                  {round.type === 'form_submission' && (
                    <div className="mb-4">
                      <FormFieldManager 
                        round={round}
                        onUpdate={(updatedRound) => {
                          console.log('InterviewReviewer: Received updated round from FormFieldManager:', updatedRound);
                          console.log('InterviewReviewer: Round type:', updatedRound.type);
                          console.log('InterviewReviewer: Form fields count:', updatedRound.formFields?.length || 0);
                          const updatedInterview = { ...interview };
                          const roundIndex = updatedInterview.rounds.findIndex(r => r.roundId === round.roundId);
                          if (roundIndex !== -1) {
                            updatedInterview.rounds[roundIndex] = updatedRound;
                            console.log('InterviewReviewer: Updated interview with new round data:', updatedInterview);
                            setInterview(updatedInterview);
                            markAsChanged();
                          }
                        }}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}

                  {/* File Upload Requirements */}
                  {round.type === 'file_upload' && (
                    <div className="mb-4">
                      <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        File Upload Requirements ({round?.fileUploadRequirements?.length || 0})
                      </div>
                      {console.log('Rendering file upload requirements for round:', roundIndex, 'Round type:', round.type, 'Requirements:', round?.fileUploadRequirements, 'Requirements length:', round?.fileUploadRequirements?.length)}
                      {(round?.fileUploadRequirements || []).length === 0 ? (
                        <div className={`p-4 rounded-lg border-2 border-dashed ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700/30' 
                            : 'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="text-center">
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              No file requirements added yet. Click "Add File Requirement" to get started.
                            </p>
                            <button
                              onClick={() => {
                                const testRequirement = {
                                  id: `test_${Date.now()}`,
                                  title: 'Test Resume',
                                  description: 'Please upload your resume',
                                  fileTypes: ['pdf', 'doc'],
                                  maxFileSize: 5,
                                  required: true
                                };
                                const updatedInterview = { ...interview };
                                if (!updatedInterview.rounds[roundIndex].fileUploadRequirements) {
                                  updatedInterview.rounds[roundIndex].fileUploadRequirements = [];
                                }
                                updatedInterview.rounds[roundIndex].fileUploadRequirements.push(testRequirement);
                                setInterview(updatedInterview);
                                console.log('Added test requirement:', testRequirement);
                              }}
                              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Add Test Requirement
                            </button>
                          </div>
                        </div>
                      ) : (
                        (round?.fileUploadRequirements || []).map((requirement, reqIndex) => (
                    <motion.div
                      key={requirement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reqIndex * 0.05 }}
                      className={`p-4 rounded-lg border-l-4 border-purple-500 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600' 
                          : 'bg-purple-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              File Requirement {reqIndex + 1}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              requirement.required 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {requirement.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {requirement.title}
                          </p>
                          <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {requirement.description}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            <strong>Allowed types:</strong> {requirement.fileTypes.join(', ')} | 
                            <strong> Max size:</strong> {requirement.maxFileSize}MB
                          </div>
                        </div>
                        {editingRound === roundIndex && (
                          <div className="flex gap-2 ml-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRemoveFileRequirement(roundIndex, reqIndex)}
                              className="p-1 text-red-500 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            </div>
            </div>
          )}

          {activeTab === 'file-uploads' && (
            <FileUploadRoundManager 
              interview={interview} 
              onUpdate={(updatedInterview) => {
                setInterview(updatedInterview);
                markAsChanged();
              }} 
            />
          )}

          {activeTab === 'form-submissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Form Submissions
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View and manage candidate form submissions
                  </p>
                </div>
              </div>

              {/* Form Submission Rounds */}
              {interview?.rounds?.filter(round => round.type === 'form_submission').length === 0 ? (
                <div className={`p-6 rounded-lg border-2 border-dashed ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700/30' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      No Form Submission Rounds
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Add a form submission round to collect structured data from candidates
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddRound}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      Add Form Round
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {interview?.rounds
                    ?.filter(round => round.type === 'form_submission')
                    .map((round, index) => (
                      <motion.div
                        key={round.roundId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-6 rounded-2xl shadow-xl ${
                          isDarkMode 
                            ? 'bg-gray-800 border border-gray-700' 
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 rounded-full">
                                <span className="text-green-600 text-lg">📝</span>
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
                                <span className="text-lg">📝</span>
                                {round.formFields?.length || 0} form fields
                              </div>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedFormRound(round);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Submissions
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'system-design' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    System Design Submissions
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View candidate system design diagrams ({systemDesignSubmissions.length} submissions)
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchSystemDesignSubmissions}
                  disabled={loadingSubmissions}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } disabled:opacity-50`}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              </div>

              {loadingSubmissions ? (
                <div className={`p-8 rounded-lg border ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mr-3" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Loading submissions...
                    </span>
                  </div>
                </div>
              ) : systemDesignSubmissions.length === 0 ? (
                <div className={`p-6 rounded-lg border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800' 
                    : 'border-gray-200 bg-white'
                }`}>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎨</div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      No Submissions Yet
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      System design submissions will appear here once candidates complete their diagrams.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {systemDesignSubmissions.map((submission, index) => {
                    // Find the round information for this submission
                    const round = interview?.rounds?.find(r => r.roundId === submission.roundId);
                    const roundInfo = round ? {
                      title: round.title,
                      description: round.description,
                      question: round.questions?.[0]?.question || null
                    } : null;

                    return (
                      <motion.div
                        key={submission.candidateId + submission.roundId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SystemDesignViewer
                          diagramData={submission.diagramData}
                          candidateInfo={{
                            name: submission.candidateName,
                            email: submission.candidateEmail,
                            id: submission.candidateId
                          }}
                          submissionTime={submission.submittedAt}
                          timeSpent={submission.timeSpent}
                          roundInfo={roundInfo}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Form Submission Viewer Modal */}
          {selectedFormRound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedFormRound(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Form Submissions - {selectedFormRound.title}
                    </h2>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      View candidate responses for this form round
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFormRound(null)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <FormSubmissionViewer
                    round={selectedFormRound}
                    interviewId={interviewId}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col gap-4"
        >
          {/* Success/Error Messages */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Changes saved successfully!</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}
          
          {/* Save Button - Always Visible */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasUnsavedChanges && (
                <span className="text-orange-600 font-medium">⚠️ You have unsaved changes</span>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className={`font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                saving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : hasUnsavedChanges
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Add Round Modal */}
      <AnimatePresence>
        {showAddRoundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 rounded-lg max-w-md w-full mx-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New Round
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Round Type
                  </label>
                  <select
                    value={newRoundData.type}
                    onChange={(e) => setNewRoundData(prev => ({ ...prev, type: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="interview">Interview Round (Questions)</option>
                    <option value="file_upload">File Upload Round (Documents)</option>
                    <option value="form_submission">Form Submission Round (Custom Forms)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Round Title *
                  </label>
                  <input
                    type="text"
                    value={newRoundData.title}
                    onChange={(e) => setNewRoundData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., Technical Assessment, Document Review"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description *
                  </label>
                  <textarea
                    value={newRoundData.description}
                    onChange={(e) => setNewRoundData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="3"
                    placeholder="Describe what this round will cover..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newRoundData.duration}
                    onChange={(e) => setNewRoundData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    min="5"
                    max="60"
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveRound}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Add Round
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddRoundModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add File Requirement Modal */}
      <AnimatePresence>
        {showAddFileRequirementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 rounded-lg max-w-md w-full mx-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add File Requirement
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newFileRequirement.title}
                    onChange={(e) => setNewFileRequirement(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., Resume, Portfolio, Presentation"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description *
                  </label>
                  <textarea
                    value={newFileRequirement.description}
                    onChange={(e) => setNewFileRequirement(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="2"
                    placeholder="Describe what the candidate should upload..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      File Types
                    </label>
                    <input
                      type="text"
                      value={newFileRequirement.fileTypes.join(', ')}
                      onChange={(e) => setNewFileRequirement(prev => ({ 
                        ...prev, 
                        fileTypes: e.target.value.split(',').map(type => type.trim().toLowerCase())
                      }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="pdf, doc, docx, ppt, pptx"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Max Size (MB)
                    </label>
                    <input
                      type="number"
                      value={newFileRequirement.maxFileSize}
                      onChange={(e) => setNewFileRequirement(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newFileRequirement.required}
                    onChange={(e) => setNewFileRequirement(prev => ({ ...prev, required: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="required" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Required submission
                  </label>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveFileRequirement}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Add Requirement
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddFileRequirementModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Make sure component is exported properly
export default InterviewReviewer;
export { InterviewReviewer };