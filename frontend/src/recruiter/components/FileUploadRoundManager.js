import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';
import { 
  Upload, 
  File, 
  Plus, 
  Edit3, 
  Trash2, 
  // Save, 
  X,
  FileText,
  Image,
  Archive,
  Download,
  // Eye,
  CheckCircle,
  // AlertCircle,
  Clock
} from 'lucide-react';

const FileUploadRoundManager = ({ interview, onUpdate }) => {
  const { isDarkMode } = useTheme();
  const [editingRound, setEditingRound] = useState(null);
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    fileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10,
    required: true
  });
  const [fileUploads, setFileUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  // const [saving, setSaving] = useState(false);

  const loadFileUploads = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiService.getInterviewFileUploads(interview.interviewId);
      if (result.success) {
        setFileUploads(result.data);
      }
    } catch (error) {
      console.error('Error loading file uploads:', error);
    } finally {
      setLoading(false);
    }
  }, [interview.interviewId]);

  useEffect(() => {
    if (interview?.interviewId) {
      loadFileUploads();
    }
  }, [interview?.interviewId, loadFileUploads]);

  const handleAddFileUploadRound = () => {
    const title = prompt('Enter round title (e.g., "Document Submission"):');
    if (!title) return;
    
    const description = prompt('Enter round description:');
    if (!description) return;
    
    const duration = parseInt(prompt('Enter duration in minutes (default: 30):') || '30');
    
    const newRound = {
      roundId: `round_${Date.now()}`,
      roundNumber: (interview?.rounds || []).length + 1,
      title: title,
      description: description,
      duration: duration,
      type: 'file_upload',
      fileUploadRequirements: [],
      evaluationCriteria: {
        technical: '',
        communication: '',
        problemSolving: '',
        culturalFit: '',
        leadership: '',
        motivation: ''
      }
    };
    
    const updatedInterview = { ...interview };
    updatedInterview.rounds = [...(updatedInterview.rounds || []), newRound];
    onUpdate(updatedInterview);
  };

  const handleAddFileRequirement = async (roundIndex) => {
    if (!newRequirement.title.trim()) {
      alert('Please enter a requirement title');
      return;
    }
    
    if (!newRequirement.description.trim()) {
      alert('Please enter a requirement description');
      return;
    }

    const requirement = {
      id: `req_${Date.now()}`,
      title: newRequirement.title,
      description: newRequirement.description,
      fileTypes: newRequirement.fileTypes,
      maxFileSize: newRequirement.maxFileSize,
      required: newRequirement.required
    };

    const updatedInterview = { ...interview };
    if (!updatedInterview.rounds[roundIndex].fileUploadRequirements) {
      updatedInterview.rounds[roundIndex].fileUploadRequirements = [];
    }
    updatedInterview.rounds[roundIndex].fileUploadRequirements.push(requirement);
    
    onUpdate(updatedInterview);
    
    // Reset form
    setNewRequirement({
      title: '',
      description: '',
      fileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10,
      required: true
    });
    setShowAddRequirement(false);
  };

  const handleRemoveFileRequirement = (roundIndex, requirementIndex) => {
    if (window.confirm('Are you sure you want to remove this file requirement?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].fileUploadRequirements.splice(requirementIndex, 1);
      onUpdate(updatedInterview);
    }
  };

  const handleRemoveRound = (roundIndex) => {
    if (window.confirm('Are you sure you want to remove this file upload round?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds.splice(roundIndex, 1);
      onUpdate(updatedInterview);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return <Image className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadsForRound = (roundId) => {
    return fileUploads.filter(upload => upload.roundId === roundId);
  };

  const getUploadsForRequirement = (roundId, requirementId) => {
    return fileUploads.filter(upload => 
      upload.roundId === roundId && upload.requirementId === requirementId
    );
  };

  const handleDownloadFile = async (fileName, originalFileName) => {
    try {
      console.log('Downloading file:', fileName, 'Original name:', originalFileName);
      console.log('Interview ID:', interview.interviewId);
      
      // Try the API download first
      const response = await apiService.downloadInterviewFile(interview.interviewId, fileName);
      console.log('Download response:', response);
      console.log('Response headers:', response.headers);
      console.log('Response data type:', typeof response.data);
      
      // Create a blob from the response
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      console.log('Created blob:', blob);
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      console.log('Created URL:', url);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName || fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('File download initiated successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      console.error('Error response:', error.response);
      
      // Fallback: try direct URL download
      try {
        const downloadUrl = `${apiService.client.defaults.baseURL}/files/interviews/${interview.interviewId}/files/${fileName}/download`;
        console.log('Trying fallback download URL:', downloadUrl);
        
        // Open in new tab as fallback
        window.open(downloadUrl, '_blank');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Failed to download file: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleReviewFile = async (fileName, status, reviewNotes) => {
    try {
      // setSaving(true);
      const result = await apiService.reviewInterviewFile(
        interview.interviewId, 
        fileName, 
        status, 
        reviewNotes
      );
      
      if (result.success) {
        await loadFileUploads(); // Reload to get updated status
      } else {
        alert('Failed to update file review: ' + result.error);
      }
    } catch (error) {
      console.error('Error reviewing file:', error);
      alert('Failed to review file');
    } finally {
      // setSaving(false);
    }
  };

  const fileUploadRounds = (interview?.rounds || []).filter(round => round.type === 'file_upload');

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            File Upload Rounds
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage document submission requirements for candidates
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddFileUploadRound}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add File Upload Round
        </motion.button>
      </div>

      {/* File Upload Rounds */}
      <div className="space-y-6">
        {fileUploadRounds.map((round, roundIndex) => {
          const roundUploads = getUploadsForRound(round.roundId);
          
          return (
            <motion.div
              key={round.roundId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl shadow-xl ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Round Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Upload className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {round.title}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      'bg-purple-100 text-purple-700'
                    }`}>
                      File Upload Round
                    </div>
                  </div>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {round.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {round.duration} minutes
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <File className="w-4 h-4" />
                      {roundUploads.length} submissions
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingRound(editingRound === roundIndex ? null : roundIndex)}
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
                    onClick={() => handleRemoveRound(roundIndex)}
                    className="p-2 rounded-lg transition-colors duration-200 bg-red-100 hover:bg-red-200 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* File Requirements */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    File Requirements
                  </h4>
                  {editingRound === roundIndex && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddRequirement(true)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Requirement
                    </motion.button>
                  )}
                </div>

                {/* Add Requirement Form */}
                <AnimatePresence>
                  {showAddRequirement && editingRound === roundIndex && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <h5 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Add File Requirement
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Title *
                          </label>
                          <input
                            type="text"
                            value={newRequirement.title}
                            onChange={(e) => setNewRequirement(prev => ({ ...prev, title: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="e.g., Resume, Portfolio, Presentation"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Description *
                          </label>
                          <textarea
                            value={newRequirement.description}
                            onChange={(e) => setNewRequirement(prev => ({ ...prev, description: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            rows="2"
                            placeholder="Describe what the candidate should upload"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Allowed File Types
                            </label>
                            <input
                              type="text"
                              value={newRequirement.fileTypes.join(', ')}
                              onChange={(e) => setNewRequirement(prev => ({ 
                                ...prev, 
                                fileTypes: e.target.value.split(',').map(type => type.trim().toLowerCase())
                              }))}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDarkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              placeholder="pdf, doc, docx, ppt, pptx"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Max File Size (MB)
                            </label>
                            <input
                              type="number"
                              value={newRequirement.maxFileSize}
                              onChange={(e) => setNewRequirement(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDarkMode 
                                  ? 'bg-gray-800 border-gray-600 text-white' 
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
                            checked={newRequirement.required}
                            onChange={(e) => setNewRequirement(prev => ({ ...prev, required: e.target.checked }))}
                            className="rounded"
                          />
                          <label htmlFor="required" className={`text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Required submission
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddFileRequirement(roundIndex)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                          >
                            Add Requirement
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddRequirement(false)}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Requirements List */}
                {(round.fileUploadRequirements || []).map((requirement, reqIndex) => {
                  const requirementUploads = getUploadsForRequirement(round.roundId, requirement.id);
                  
                  return (
                    <motion.div
                      key={requirement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border-l-4 border-purple-500 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600' 
                          : 'bg-purple-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {requirement.title}
                            </h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${
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
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            <strong>Allowed types:</strong> {requirement.fileTypes.join(', ')} | 
                            <strong> Max size:</strong> {requirement.maxFileSize}MB
                          </div>
                        </div>
                        {editingRound === roundIndex && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRemoveFileRequirement(roundIndex, reqIndex)}
                            className="p-1 text-red-500 hover:text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>

                      {/* Submissions */}
                      {requirementUploads.length > 0 && (
                        <div className="mt-4">
                          <h6 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Candidate Submissions ({requirementUploads.length})
                          </h6>
                          <div className="space-y-2">
                            {requirementUploads.map((upload, uploadIndex) => (
                              <div
                                key={uploadIndex}
                                className={`p-3 rounded-lg border ${
                                  isDarkMode 
                                    ? 'bg-gray-800 border-gray-600' 
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getFileIcon(upload.fileType)}
                                    <div>
                                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {upload.originalFileName}
                                      </p>
                                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {formatFileSize(upload.fileSize)} • {upload.candidateName} • {new Date(upload.uploadedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                      upload.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                                      upload.status === 'approved' ? 'bg-green-100 text-green-700' :
                                      upload.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {upload.status}
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDownloadFile(upload.fileName, upload.originalFileName)}
                                      className="p-2 text-blue-500 hover:text-blue-600 transition-colors duration-200"
                                      title={`Download ${upload.originalFileName}`}
                                    >
                                      <Download className="w-4 h-4" />
                                    </motion.button>
                                    {upload.status === 'uploaded' && (
                                      <div className="flex gap-1">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleReviewFile(upload.fileName, 'approved', '')}
                                          className="p-1 text-green-500 hover:text-green-600 transition-colors duration-200"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            const notes = prompt('Enter rejection reason:');
                                            if (notes) {
                                              handleReviewFile(upload.fileName, 'rejected', notes);
                                            }
                                          }}
                                          className="p-1 text-red-500 hover:text-red-600 transition-colors duration-200"
                                        >
                                          <X className="w-4 h-4" />
                                        </motion.button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {upload.reviewNotes && (
                                  <div className={`mt-2 p-2 rounded text-sm ${
                                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    <strong>Review Notes:</strong> {upload.reviewNotes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {fileUploadRounds.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No File Upload Rounds</h3>
          <p className="mb-4">Add file upload rounds to allow candidates to submit documents, presentations, or portfolios.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddFileUploadRound}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add File Upload Round
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default FileUploadRoundManager;
