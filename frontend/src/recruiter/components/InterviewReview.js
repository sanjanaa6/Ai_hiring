import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';
import { 
  CheckCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock, 
  Users, 
  FileText,
  Check,
  X
} from 'lucide-react';

const InterviewReview = () => {
  const { isDarkMode } = useTheme();
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [editingRound, setEditingRound] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    fetchPendingInterviews();
  }, []);

  const fetchPendingInterviews = async () => {
    try {
      const result = await apiService.getPendingInterviews();
      
      if (result.success) {
        setInterviews(result.data);
      } else {
        console.error('Error fetching pending interviews:', result.error);
      }
    } catch (error) {
      console.error('Error fetching pending interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewDetails = async (interviewId) => {
    try {
      const result = await apiService.getInterviewReview(interviewId);
      
      if (result.success) {
        setSelectedInterview(result.data);
        setReviewNotes(result.data.reviewInfo?.reviewNotes || '');
      } else {
        console.error('Error fetching interview details:', result.error);
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
    }
  };

  const updateInterview = async (updatedData) => {
    if (!selectedInterview) return;
    
    setSaving(true);
    try {
      const result = await apiService.updateInterview(selectedInterview.interviewId, updatedData);
      
      if (result.success) {
        setSelectedInterview(result.data);
        setEditingRound(null);
        setEditingQuestion(null);
      } else {
        console.error('Failed to update interview:', result.error);
      }
    } catch (error) {
      console.error('Error updating interview:', error);
    } finally {
      setSaving(false);
    }
  };

  const approveInterview = async () => {
    if (!selectedInterview) return;
    
    setSaving(true);
    try {
      const result = await apiService.approveInterview(selectedInterview.interviewId);
      
      if (result.success) {
        setInterviews(prev => prev.filter(i => i.interviewId !== selectedInterview.interviewId));
        setSelectedInterview(null);
        setReviewNotes('');
      } else {
        console.error('Failed to approve interview:', result.error);
      }
    } catch (error) {
      console.error('Error approving interview:', error);
    } finally {
      setSaving(false);
    }
  };

  const rejectInterview = async () => {
    if (!selectedInterview) return;
    
    setSaving(true);
    try {
      const result = await apiService.rejectInterview(selectedInterview.interviewId, reviewNotes);
      
      if (result.success) {
        setInterviews(prev => prev.filter(i => i.interviewId !== selectedInterview.interviewId));
        setSelectedInterview(null);
        setReviewNotes('');
      } else {
        console.error('Failed to reject interview:', result.error);
      }
    } catch (error) {
      console.error('Error rejecting interview:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteInterview = async () => {
    if (!selectedInterview) return;
    
    if (!window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    try {
      const result = await apiService.deleteInterview(selectedInterview.interviewId);
      
      if (result.success) {
        setInterviews(prev => prev.filter(i => i.interviewId !== selectedInterview.interviewId));
        setSelectedInterview(null);
        setReviewNotes('');
      } else {
        console.error('Failed to delete interview:', result.error);
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (roundIndex, questionIndex, updatedQuestion) => {
    const updatedRounds = [...selectedInterview.rounds];
    updatedRounds[roundIndex].questions[questionIndex] = updatedQuestion;
    updateInterview({ rounds: updatedRounds });
  };

  const deleteQuestion = (roundIndex, questionIndex) => {
    const updatedRounds = [...selectedInterview.rounds];
    updatedRounds[roundIndex].questions.splice(questionIndex, 1);
    updateInterview({ rounds: updatedRounds });
  };

  const addQuestion = (roundIndex) => {
    const updatedRounds = [...selectedInterview.rounds];
    const newQuestion = {
      id: `q${roundIndex + 1}_${updatedRounds[roundIndex].questions.length + 1}`,
      type: 'technical',
      question: 'New question - please edit',
      expectedAnswer: 'Expected answer - please edit',
      timeLimit: 3,
      difficulty: 'medium',
      followUpQuestions: []
    };
    updatedRounds[roundIndex].questions.push(newQuestion);
    updateInterview({ rounds: updatedRounds });
  };

  const deleteRound = (roundIndex) => {
    if (!window.confirm('Are you sure you want to delete this round? This action cannot be undone.')) {
      return;
    }
    
    const updatedRounds = [...selectedInterview.rounds];
    updatedRounds.splice(roundIndex, 1);
    updateInterview({ rounds: updatedRounds });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Interview Review
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Review and approve AI-generated interviews before they go live
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Interviews List */}
          <div className={`lg:col-span-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pending Review ({interviews.length})
            </h2>
            
            {interviews.length === 0 ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No interviews pending review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <motion.div
                    key={interview.interviewId}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedInterview?.interviewId === interview.interviewId
                        ? isDarkMode
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-50 border-blue-300 text-blue-900'
                        : isDarkMode
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                    }`}
                    onClick={() => fetchInterviewDetails(interview.interviewId)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h3 className="font-medium truncate">{interview.title}</h3>
                    <p className={`text-sm mt-1 ${
                      selectedInterview?.interviewId === interview.interviewId
                        ? 'text-blue-100'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {interview.jobTitle}
                    </p>
                    <div className="flex items-center mt-2 space-x-4 text-xs">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {interview.totalDuration}min
                      </span>
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {interview.rounds.length} rounds
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Interview Details */}
          <div className="lg:col-span-2">
            {selectedInterview ? (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedInterview.title}
                    </h2>
                    <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedInterview.jobTitle} • {selectedInterview.totalDuration} minutes
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={deleteInterview}
                      disabled={saving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Job Details */}
                <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Job Details
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedInterview.jobDescription}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedInterview.jobLevel}
                    </span>
                  </div>
                </div>

                {/* Rounds */}
                <div className="space-y-4 mb-6">
                  {selectedInterview.rounds.map((round, roundIndex) => (
                    <div key={round.roundId} className={`border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {round.title}
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => addQuestion(roundIndex)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRound(roundIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {round.description} • {round.duration} minutes
                      </p>
                      
                      <div className="space-y-2">
                        {round.questions.map((question, questionIndex) => (
                          <div key={question.id} className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {question.question}
                                </p>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Expected: {question.expectedAnswer}
                                </p>
                                <div className="flex items-center mt-2 space-x-4 text-xs">
                                  <span className={`px-2 py-1 rounded ${
                                    isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                  <span className={`px-2 py-1 rounded ${
                                    isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {question.timeLimit}min
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => setEditingQuestion({ roundIndex, questionIndex })}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteQuestion(roundIndex, questionIndex)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Review Notes */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className={`w-full p-3 border rounded-lg resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                    placeholder="Add any notes about this interview..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={approveInterview}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="h-5 w-5" />
                    <span>Approve & Activate</span>
                  </button>
                  <button
                    onClick={rejectInterview}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
                <Eye className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select an Interview
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Choose an interview from the list to review and approve
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReview;


