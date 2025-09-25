import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Send, Upload, FileText, User, Phone, X, AlertCircle, Sparkles, Zap, Star } from 'lucide-react';

const JobApplicationForm = ({ jobId, onSuccess, onCancel }) => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: '',
    portfolio: '',
    linkedin: '',
    phone: '',
    expectedSalary: '',
    availability: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  const applyMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/applications', {
        jobId,
        ...data
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Application submitted successfully!');
        queryClient.invalidateQueries(['job', jobId]);
        queryClient.invalidateQueries('user-applications');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit application');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Clean up empty fields
    const cleanedData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value.trim() !== '')
    );

    applyMutation.mutate(cleanedData);
  };

  const steps = [
    { id: 1, title: 'Contact Info', icon: User },
    { id: 2, title: 'Application', icon: FileText },
    { id: 3, title: 'Additional', icon: Star }
  ];

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      if (!formData.linkedin.trim()) errors.linkedin = 'LinkedIn profile is required';
    }
    
    if (step === 2) {
      if (!formData.coverLetter.trim()) errors.coverLetter = 'Cover letter is required';
      if (!formData.resume.trim()) errors.resume = 'Resume URL is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        className={`rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header with gradient */}
        <div className={`relative overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-800 to-gray-700' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  isDarkMode 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <Send className="h-8 w-8" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold transition-colors ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Apply for this Position
                  </h2>
                  <p className={`text-sm transition-colors ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Complete your application in 3 simple steps
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onCancel}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <motion.div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        currentStep >= step.id
                          ? isDarkMode
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-blue-600 border-blue-600 text-white'
                          : isDarkMode
                            ? 'border-gray-600 text-gray-400'
                            : 'border-gray-300 text-gray-400'
                      }`}
                      animate={{ 
                        scale: currentStep === step.id ? 1.1 : 1,
                        boxShadow: currentStep === step.id ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none'
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <step.icon className="h-5 w-5" />
                    </motion.div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium transition-colors ${
                        currentStep >= step.id
                          ? isDarkMode ? 'text-white' : 'text-gray-900'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                        currentStep > step.id
                          ? 'bg-blue-600'
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
                    }`}>
                      <User className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Contact Information
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Let us know how to reach you
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className={`block text-sm font-semibold transition-colors ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        <Phone className="h-4 w-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <div className="relative group">
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                        <input
                          type="tel"
                          name="phone"
                          className={`relative w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                            formErrors.phone
                              ? isDarkMode
                                ? 'bg-red-900/20 border-red-500 text-white placeholder-red-300'
                                : 'bg-red-50 border-red-500 text-gray-900 placeholder-red-400'
                              : isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                          }`}
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                        <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                          formErrors.phone 
                            ? 'text-red-500' 
                            : isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`} />
                      </div>
                      {formErrors.phone && (
                        <motion.p 
                          className="text-sm text-red-500 flex items-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.phone}
                        </motion.p>
                      )}
                    </motion.div>

                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className={`block text-sm font-semibold transition-colors ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        <Zap className="h-4 w-4 inline mr-2" />
                        LinkedIn Profile *
                      </label>
                      <div className="relative group">
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                        <input
                          type="url"
                          name="linkedin"
                          className={`relative w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                            formErrors.linkedin
                              ? isDarkMode
                                ? 'bg-red-900/20 border-red-500 text-white placeholder-red-300'
                                : 'bg-red-50 border-red-500 text-gray-900 placeholder-red-400'
                              : isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                          }`}
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={formData.linkedin}
                          onChange={handleChange}
                        />
                      </div>
                      {formErrors.linkedin && (
                        <motion.p 
                          className="text-sm text-red-500 flex items-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.linkedin}
                        </motion.p>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Application Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
                    }`}>
                      <FileText className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Application Details
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Share your professional information
                    </p>
                  </div>

                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      Cover Letter *
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                      <textarea
                        name="coverLetter"
                        className={`relative w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 resize-none ${
                          formErrors.coverLetter
                            ? isDarkMode
                              ? 'bg-red-900/20 border-red-500 text-white placeholder-red-300'
                              : 'bg-red-50 border-red-500 text-gray-900 placeholder-red-400'
                            : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500'
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500'
                        }`}
                        rows="6"
                        placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                        value={formData.coverLetter}
                        onChange={handleChange}
                      />
                    </div>
                    {formErrors.coverLetter && (
                      <motion.p 
                        className="text-sm text-red-500 flex items-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.coverLetter}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      <Upload className="h-4 w-4 inline mr-2" />
                      Resume/CV URL *
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                      <input
                        type="url"
                        name="resume"
                        className={`relative w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                          formErrors.resume
                            ? isDarkMode
                              ? 'bg-red-900/20 border-red-500 text-white placeholder-red-300'
                              : 'bg-red-50 border-red-500 text-gray-900 placeholder-red-400'
                            : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                        }`}
                        placeholder="https://example.com/your-resume.pdf"
                        value={formData.resume}
                        onChange={handleChange}
                      />
                      <Upload className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                        formErrors.resume 
                          ? 'text-red-500' 
                          : isDarkMode ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <p className={`text-sm transition-colors ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Upload your resume to Google Drive, Dropbox, or similar and share the link
                    </p>
                    {formErrors.resume && (
                      <motion.p 
                        className="text-sm text-red-500 flex items-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.resume}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      <Star className="h-4 w-4 inline mr-2" />
                      Portfolio/Work Samples
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                      <input
                        type="url"
                        name="portfolio"
                        className={`relative w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        }`}
                        placeholder="https://yourportfolio.com or GitHub profile"
                        value={formData.portfolio}
                        onChange={handleChange}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 3: Additional Information */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                    }`}>
                      <Star className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Additional Information
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Help us understand your preferences
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className={`block text-sm font-semibold transition-colors ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        💰 Expected Salary
                      </label>
                      <div className="relative group">
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                        <input
                          type="text"
                          name="expectedSalary"
                          className={`relative w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500'
                              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500'
                          }`}
                          placeholder="e.g., $80,000 - $100,000"
                          value={formData.expectedSalary}
                          onChange={handleChange}
                        />
                      </div>
                    </motion.div>

                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className={`block text-sm font-semibold transition-colors ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        📅 Availability
                      </label>
                      <select
                        name="availability"
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                        }`}
                        value={formData.availability}
                        onChange={handleChange}
                      >
                        <option value="">Select availability</option>
                        <option value="immediate">Immediate</option>
                        <option value="2weeks">2 weeks notice</option>
                        <option value="1month">1 month notice</option>
                        <option value="2months">2+ months notice</option>
                      </select>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      💬 Additional Information
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
                      <textarea
                        name="additionalInfo"
                        className={`relative w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 resize-none ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        }`}
                        rows="3"
                        placeholder="Any additional information you'd like to share..."
                        value={formData.additionalInfo}
                        onChange={handleChange}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Footer with Navigation */}
        <div className={`p-6 border-t transition-colors ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <motion.button
                  onClick={prevStep}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
              )}
              <motion.button
                onClick={onCancel}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
            </div>
            
            <div className="flex space-x-3">
              {currentStep < 3 ? (
                <motion.button
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next Step
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                >
                  <Send className="h-5 w-5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JobApplicationForm;
