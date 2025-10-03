import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import apiService from '../services/apiService';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileText,
  Image,
  Archive
} from 'lucide-react';

const FileUploadRound = ({ 
  interview, 
  round, 
  onComplete, 
  onNext,
  candidateInfo 
}) => {
  const { isDarkMode } = useTheme();
  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const [existingUploads, setExistingUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExistingUploads = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiService.getCandidateUploads(interview.interviewId, round.roundId);
      if (result.success) {
        setExistingUploads(result.data);
      }
    } catch (error) {
      console.error('Error loading existing uploads:', error);
    } finally {
      setLoading(false);
    }
  }, [interview.interviewId, round.roundId]);

  useEffect(() => {
    loadExistingUploads();
  }, [interview.interviewId, round.roundId, loadExistingUploads]);

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

  const handleFileSelect = (requirementId, file) => {
    const requirement = round.fileUploadRequirements.find(req => req.id === requirementId);
    
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (requirement.fileTypes.length > 0 && !requirement.fileTypes.includes(fileExtension)) {
      setErrors(prev => ({
        ...prev,
        [requirementId]: `File type .${fileExtension} not allowed. Allowed types: ${requirement.fileTypes.join(', ')}`
      }));
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > requirement.maxFileSize) {
      setErrors(prev => ({
        ...prev,
        [requirementId]: `File size ${fileSizeMB.toFixed(2)}MB exceeds maximum allowed size of ${requirement.maxFileSize}MB`
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      [requirementId]: null
    }));

    // Set the file for upload
    setUploads(prev => ({
      ...prev,
      [requirementId]: file
    }));
  };

  const handleUpload = async (requirementId) => {
    const file = uploads[requirementId];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, [requirementId]: true }));
      setErrors(prev => ({ ...prev, [requirementId]: null }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('roundId', round.roundId);
      formData.append('requirementId', requirementId);

      const result = await apiService.uploadInterviewFile(interview.interviewId, formData);
      
      if (result.success) {
        // Remove from uploads and reload existing uploads
        setUploads(prev => {
          const newUploads = { ...prev };
          delete newUploads[requirementId];
          return newUploads;
        });
        
        await loadExistingUploads();
      } else {
        setErrors(prev => ({
          ...prev,
          [requirementId]: result.error || 'Upload failed'
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => ({
        ...prev,
        [requirementId]: 'Upload failed. Please try again.'
      }));
    } finally {
      setUploading(prev => ({ ...prev, [requirementId]: false }));
    }
  };

  const removeFile = (requirementId) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[requirementId];
      return newUploads;
    });
    setErrors(prev => ({
      ...prev,
      [requirementId]: null
    }));
  };

  const getUploadForRequirement = (requirementId) => {
    return existingUploads.find(upload => upload.requirementId === requirementId);
  };

  const isRoundComplete = () => {
    const requiredRequirements = round.fileUploadRequirements.filter(req => req.required);
    return requiredRequirements.every(req => getUploadForRequirement(req.id));
  };

  const handleComplete = () => {
    if (isRoundComplete()) {
      onComplete();
      if (onNext) onNext();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className={`p-6 rounded-lg mb-6 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {round.title}
            </h1>
            <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {round.description}
            </p>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}>
                File Upload Round
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {round.fileUploadRequirements.length} requirements
              </div>
            </div>
          </div>

          {/* File Upload Requirements */}
          <div className="space-y-6">
            {round.fileUploadRequirements.map((requirement, index) => {
              const existingUpload = getUploadForRequirement(requirement.id);
              const selectedFile = uploads[requirement.id];
              const isUploading = uploading[requirement.id];
              const error = errors[requirement.id];

              return (
                <motion.div
                  key={requirement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-lg border-l-4 ${
                    existingUpload 
                      ? 'border-green-500' 
                      : requirement.required 
                        ? 'border-red-500' 
                        : 'border-blue-500'
                  } ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {requirement.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          requirement.required 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {requirement.required ? 'Required' : 'Optional'}
                        </span>
                        {existingUpload && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {requirement.description}
                      </p>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <strong>Allowed types:</strong> {requirement.fileTypes.join(', ')} | 
                        <strong> Max size:</strong> {requirement.maxFileSize}MB
                      </div>
                    </div>
                  </div>

                  {/* Existing Upload */}
                  {existingUpload && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        {getFileIcon(existingUpload.fileType)}
                        <div className="flex-1">
                          <p className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                            {existingUpload.originalFileName}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {formatFileSize(existingUpload.fileSize)} • Uploaded {new Date(existingUpload.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          existingUpload.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                          existingUpload.status === 'approved' ? 'bg-green-100 text-green-700' :
                          existingUpload.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {existingUpload.status}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Upload Area */}
                  {!existingUpload && (
                    <div>
                      {!selectedFile ? (
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                          isDarkMode 
                            ? 'border-gray-600 hover:border-gray-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        } transition-colors cursor-pointer`}>
                          <input
                            type="file"
                            id={`file-${requirement.id}`}
                            className="hidden"
                            accept={requirement.fileTypes.map(type => `.${type}`).join(',')}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleFileSelect(requirement.id, file);
                            }}
                          />
                          <label 
                            htmlFor={`file-${requirement.id}`}
                            className="cursor-pointer"
                          >
                            <Upload className={`w-12 h-12 mx-auto mb-4 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <p className={`text-lg font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Click to upload or drag and drop
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {requirement.fileTypes.join(', ')} up to {requirement.maxFileSize}MB
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-lg border ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getFileIcon(selectedFile.type)}
                              <div>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {selectedFile.name}
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatFileSize(selectedFile.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpload(requirement.id)}
                                disabled={isUploading}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                  isUploading
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {isUploading ? 'Uploading...' : 'Upload'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeFile(requirement.id)}
                                className="p-2 text-red-500 hover:text-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3 rounded-lg bg-red-100 border border-red-200 flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Complete Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              disabled={!isRoundComplete()}
              className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                isRoundComplete()
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-400 text-gray-700 cursor-not-allowed'
              }`}
            >
              {isRoundComplete() ? 'Complete Round' : 'Upload Required Files to Continue'}
            </motion.button>
            
            {!isRoundComplete() && (
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please upload all required files before proceeding
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FileUploadRound;

