import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';
import { 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  File, 
  Users, 
  Clock,
  FileText,
  Image,
  Archive,
  X
} from 'lucide-react';

const AdvancedInterviewCreator = ({ onInterviewCreated, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [interviewData, setInterviewData] = useState({
    title: '',
    jobTitle: '',
    jobDescription: '',
    jobRequirements: '',
    jobLevel: 'Mid-level',
    totalDuration: 60,
    rounds: []
  });

  const [showAddRound, setShowAddRound] = useState(false);
  const [newRound, setNewRound] = useState({
    type: 'interview', // 'interview' or 'file_upload'
    title: '',
    description: '',
    duration: 10,
    questions: [],
    fileUploadRequirements: []
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    type: 'technical',
    question: '',
    expectedAnswer: '',
    timeLimit: 3,
    difficulty: 'medium'
  });

  const [showAddFileRequirement, setShowAddFileRequirement] = useState(false);
  const [newFileRequirement, setNewFileRequirement] = useState({
    title: '',
    description: '',
    fileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10,
    required: true
  });

  const handleAddRound = () => {
    const round = {
      roundId: `round_${Date.now()}`,
      roundNumber: interviewData.rounds.length + 1,
      ...newRound,
      questions: newRound.type === 'interview' ? [] : undefined,
      fileUploadRequirements: newRound.type === 'file_upload' ? [] : undefined,
      evaluationCriteria: {
        technical: '',
        communication: '',
        problemSolving: '',
        culturalFit: '',
        leadership: '',
        motivation: ''
      }
    };

    setInterviewData(prev => ({
      ...prev,
      rounds: [...prev.rounds, round]
    }));

    setNewRound({
      type: 'interview',
      title: '',
      description: '',
      duration: 10,
      questions: [],
      fileUploadRequirements: []
    });
    setShowAddRound(false);
  };

  const handleAddQuestion = (roundIndex) => {
    const question = {
      id: `q${roundIndex + 1}_${interviewData.rounds[roundIndex].questions.length + 1}`,
      ...newQuestion
    };

    setInterviewData(prev => ({
      ...prev,
      rounds: prev.rounds.map((round, index) => 
        index === roundIndex 
          ? { ...round, questions: [...(round.questions || []), question] }
          : round
      )
    }));

    setNewQuestion({
      type: 'technical',
      question: '',
      expectedAnswer: '',
      timeLimit: 3,
      difficulty: 'medium'
    });
    setShowAddQuestion(false);
  };

  const handleAddFileRequirement = (roundIndex) => {
    const requirement = {
      id: `req_${Date.now()}`,
      ...newFileRequirement
    };

    setInterviewData(prev => ({
      ...prev,
      rounds: prev.rounds.map((round, index) => 
        index === roundIndex 
          ? { 
              ...round, 
              fileUploadRequirements: [...(round.fileUploadRequirements || []), requirement] 
            }
          : round
      )
    }));

    setNewFileRequirement({
      title: '',
      description: '',
      fileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10,
      required: true
    });
    setShowAddFileRequirement(false);
  };

  const handleRemoveRound = (roundIndex) => {
    if (window.confirm('Are you sure you want to remove this round?')) {
      setInterviewData(prev => ({
        ...prev,
        rounds: prev.rounds.filter((_, index) => index !== roundIndex)
      }));
    }
  };

  const handleRemoveQuestion = (roundIndex, questionIndex) => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      setInterviewData(prev => ({
        ...prev,
        rounds: prev.rounds.map((round, index) => 
          index === roundIndex 
            ? { 
                ...round, 
                questions: round.questions.filter((_, qIndex) => qIndex !== questionIndex) 
              }
            : round
        )
      }));
    }
  };

  const handleRemoveFileRequirement = (roundIndex, requirementIndex) => {
    if (window.confirm('Are you sure you want to remove this file requirement?')) {
      setInterviewData(prev => ({
        ...prev,
        rounds: prev.rounds.map((round, index) => 
          index === roundIndex 
            ? { 
                ...round, 
                fileUploadRequirements: round.fileUploadRequirements.filter((_, rIndex) => rIndex !== requirementIndex) 
              }
            : round
        )
      }));
    }
  };

  const handleCreateInterview = async () => {
    if (!interviewData.title.trim()) {
      alert('Please enter an interview title');
      return;
    }

    if (!interviewData.jobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }

    if (!interviewData.jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }

    if (interviewData.rounds.length === 0) {
      alert('Please add at least one round');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.createInterview(interviewData);
      
      if (result.success) {
        onInterviewCreated(result.data);
      } else {
        alert('Failed to create interview: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      alert('Failed to create interview: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return <Image className="w-4 h-4" />;
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className={`p-6 rounded-lg mb-6 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Create Custom Interview
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Design a comprehensive interview with both question rounds and file upload requirements
            </p>
          </div>

          {/* Basic Information */}
          <div className={`p-6 rounded-lg mb-6 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Interview Title *
                </label>
                <input
                  type="text"
                  value={interviewData.title}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Senior Developer Interview"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Job Title *
                </label>
                <input
                  type="text"
                  value={interviewData.jobTitle}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Job Level
                </label>
                <select
                  value={interviewData.jobLevel}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, jobLevel: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior-level">Senior-level</option>
                  <option value="Lead/Principal">Lead/Principal</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total Duration (minutes)
                </label>
                <input
                  type="number"
                  value={interviewData.totalDuration}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, totalDuration: parseInt(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  min="10"
                  max="300"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Job Description *
              </label>
              <textarea
                value={interviewData.jobDescription}
                onChange={(e) => setInterviewData(prev => ({ ...prev, jobDescription: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows="4"
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Job Requirements
              </label>
              <textarea
                value={interviewData.jobRequirements}
                onChange={(e) => setInterviewData(prev => ({ ...prev, jobRequirements: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows="3"
                placeholder="List specific skills, experience, and qualifications required..."
              />
            </div>
          </div>

          {/* Rounds Section */}
          <div className={`p-6 rounded-lg mb-6 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Interview Rounds ({interviewData.rounds.length})
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddRound(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Round
              </motion.button>
            </div>

            {/* Add Round Form */}
            <AnimatePresence>
              {showAddRound && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-lg border mb-4 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Add New Round
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Round Type
                        </label>
                        <select
                          value={newRound.type}
                          onChange={(e) => setNewRound(prev => ({ ...prev, type: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="interview">Interview Round (Questions)</option>
                          <option value="file_upload">File Upload Round (Documents)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={newRound.duration}
                          onChange={(e) => setNewRound(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          min="5"
                          max="60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Round Title
                      </label>
                      <input
                        type="text"
                        value={newRound.title}
                        onChange={(e) => setNewRound(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., Technical Assessment, Document Review"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        value={newRound.description}
                        onChange={(e) => setNewRound(prev => ({ ...prev, description: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        rows="2"
                        placeholder="Describe what this round will cover..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddRound}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Add Round
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddRound(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rounds List */}
            <div className="space-y-4">
              {interviewData.rounds.map((round, roundIndex) => (
                <motion.div
                  key={round.roundId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Round {round.roundNumber}: {round.title}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          round.type === 'file_upload'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {round.type === 'file_upload' ? 'File Upload' : 'Interview'}
                        </div>
                      </div>
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {round.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-4 h-4" />
                          {round.duration} minutes
                        </div>
                        {round.type === 'interview' && (
                          <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Users className="w-4 h-4" />
                            {round.questions?.length || 0} questions
                          </div>
                        )}
                        {round.type === 'file_upload' && (
                          <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Upload className="w-4 h-4" />
                            {round.fileUploadRequirements?.length || 0} requirements
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {round.type === 'interview' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddQuestion(true)}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                        >
                          Add Question
                        </motion.button>
                      )}
                      {round.type === 'file_upload' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddFileRequirement(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                        >
                          Add Requirement
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveRound(roundIndex)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Questions */}
                  {round.type === 'interview' && round.questions && round.questions.length > 0 && (
                    <div className="mt-3">
                      <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Questions:
                      </h4>
                      <div className="space-y-2">
                        {round.questions.map((question, questionIndex) => (
                          <div
                            key={question.id}
                            className={`p-3 rounded border ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {question.question}
                                </p>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Expected: {question.expectedAnswer}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {question.timeLimit} min
                                  </span>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRemoveQuestion(roundIndex, questionIndex)}
                                className="p-1 text-red-500 hover:text-red-600 transition-colors duration-200"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Requirements */}
                  {round.type === 'file_upload' && round.fileUploadRequirements && round.fileUploadRequirements.length > 0 && (
                    <div className="mt-3">
                      <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        File Requirements:
                      </h4>
                      <div className="space-y-2">
                        {round.fileUploadRequirements.map((requirement, requirementIndex) => (
                          <div
                            key={requirement.id}
                            className={`p-3 rounded border ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {requirement.title}
                                  </h5>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    requirement.required 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {requirement.required ? 'Required' : 'Optional'}
                                  </span>
                                </div>
                                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {requirement.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {requirement.fileTypes.map((type, index) => (
                                      <div key={index} className="flex items-center gap-1">
                                        {getFileIcon(type)}
                                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                          {type}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Max {requirement.maxFileSize}MB
                                  </span>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRemoveFileRequirement(roundIndex, requirementIndex)}
                                className="p-1 text-red-500 hover:text-red-600 transition-colors duration-200"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateInterview}
              disabled={loading}
              className={`font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                loading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Interview
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddQuestion && (
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
                Add Question
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Question *
                  </label>
                  <textarea
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="3"
                    placeholder="Enter the question..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected Answer *
                  </label>
                  <textarea
                    value={newQuestion.expectedAnswer}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, expectedAnswer: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="2"
                    placeholder="Enter the expected answer..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Difficulty
                    </label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Time Limit (min)
                    </label>
                    <input
                      type="number"
                      value={newQuestion.timeLimit}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Find the first interview round to add the question to
                      const interviewRoundIndex = interviewData.rounds.findIndex(round => round.type === 'interview');
                      if (interviewRoundIndex !== -1) {
                        handleAddQuestion(interviewRoundIndex);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Add Question
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddQuestion(false)}
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
        {showAddFileRequirement && (
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
                    onClick={() => {
                      // Find the first file upload round to add the requirement to
                      const fileUploadRoundIndex = interviewData.rounds.findIndex(round => round.type === 'file_upload');
                      if (fileUploadRoundIndex !== -1) {
                        handleAddFileRequirement(fileUploadRoundIndex);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Add Requirement
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddFileRequirement(false)}
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

export default AdvancedInterviewCreator;
