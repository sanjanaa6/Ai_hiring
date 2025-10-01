import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';
import { Plus, X, Save, ArrowLeft, Sparkles, Briefcase, MapPin, DollarSign, Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import OnePromptJobCreator from '../components/OnePromptJobCreator';

const JobCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isDarkMode } = useTheme();
  const [showOnePromptCreator, setShowOnePromptCreator] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    type: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    },
    requirements: [''],
    skills: [''],
    benefits: [''],
    status: 'active'
  });

  const createJobMutation = useMutation(
    async (jobData) => {
      const response = await apiService.createJob(jobData);
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Job created successfully!');
        queryClient.invalidateQueries('recruiter-jobs');
        navigate('/jobs/manage');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create job');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean up empty array items
    const cleanedData = {
      ...formData,
      requirements: formData.requirements.filter(req => req.trim() !== ''),
      skills: formData.skills.filter(skill => skill.trim() !== ''),
      benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
      salary: {
        ...formData.salary,
        min: formData.salary.min ? parseInt(formData.salary.min) : undefined,
        max: formData.salary.max ? parseInt(formData.salary.max) : undefined
      }
    };

    createJobMutation.mutate(cleanedData);
  };


  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} pt-24 pb-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/jobs/manage')}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Jobs
              </motion.button>
              
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOnePromptCreator(true)}
                  className="group relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 font-semibold"
                >
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span>One-Prompt Create</span>
                </motion.button>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Post a New Job
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
              >
                Create a compelling job posting to attract the best candidates for your open position
              </motion.p>
            </div>

            {/* Quick Options Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center mb-8"
            >
              <div className={`p-6 rounded-2xl border transition-all duration-300 max-w-md ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-blue-500' 
                  : 'bg-white/70 border-gray-200 hover:border-blue-300'
              }`}>
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    One-Prompt Create
                  </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Describe your job in one sentence, AI fills all details and posts it automatically
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSubmit} 
            className="space-y-8"
          >
            {/* Basic Information */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={`p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                  : 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Basic Information
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    placeholder="e.g., Tech Corp"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      name="location"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder="e.g., San Francisco, CA or Remote"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Job Type *
                  </label>
                  <select
                    name="type"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Experience Level *
                  </label>
                  <select
                    name="experienceLevel"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    name="status"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Job Description *
                </label>
                <textarea
                  name="description"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                  rows="6"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </motion.div>

            {/* Salary Information */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                  : 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl mr-4">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Salary Information
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Minimum Salary
                  </label>
                  <input
                    type="number"
                    name="salary.min"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                    }`}
                    placeholder="e.g., 80000"
                    value={formData.salary.min}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Maximum Salary
                  </label>
                  <input
                    type="number"
                    name="salary.max"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                    }`}
                    placeholder="e.g., 120000"
                    value={formData.salary.max}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Currency
                  </label>
                  <select
                    name="salary.currency"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white focus:border-emerald-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    }`}
                    value={formData.salary.currency}
                    onChange={handleChange}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Requirements */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={`p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                  : 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-orange-100 rounded-xl mr-4">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Requirements
                </h2>
              </div>
              
              <div className="space-y-4">
                {formData.requirements.map((requirement, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="text"
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'
                      }`}
                      placeholder="e.g., 3+ years of experience with React"
                      value={requirement}
                      onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300' 
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => addArrayItem('requirements')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                    isDarkMode 
                      ? 'border-orange-500 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400' 
                      : 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Requirement
                </motion.button>
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className={`p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                  : 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Required Skills
                </h2>
              </div>
              
              <div className="space-y-4">
                {formData.skills.map((skill, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="text"
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder="e.g., JavaScript, React, Node.js"
                      value={skill}
                      onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeArrayItem('skills', index)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300' 
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => addArrayItem('skills')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                    isDarkMode 
                      ? 'border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400' 
                      : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Skill
                </motion.button>
              </div>
            </motion.div>

            {/* Benefits */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className={`p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                  : 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl mr-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Benefits & Perks
                </h2>
              </div>
              
              <div className="space-y-4">
                {formData.benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="text"
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                      }`}
                      placeholder="e.g., Health insurance, 401k matching, Flexible hours"
                      value={benefit}
                      onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => removeArrayItem('benefits', index)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300' 
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => addArrayItem('benefits')}
                  className={`flex items-center px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                    isDarkMode 
                      ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400' 
                      : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400'
                  }`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Benefit
                </motion.button>
              </div>
            </motion.div>

            {/* Submit Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex justify-end space-x-4 pt-6"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => navigate('/jobs/manage')}
                className={`px-8 py-4 rounded-xl border-2 transition-all duration-300 font-semibold ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={createJobMutation.isLoading}
                className="group relative inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 hover:from-blue-700 hover:via-blue-800 hover:to-slate-900 text-white rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{
                      x: [0, 100, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                  ></motion.div>
                  <motion.div
                    animate={{
                      x: [0, -100, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                  ></motion.div>
                </div>

                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <Save className="h-6 w-6" />
                </motion.div>
                <span className="relative z-10">
                  {createJobMutation.isLoading ? 'Creating Job...' : 'Post Job'}
                </span>

                {/* Shine effect */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                ></motion.div>
              </motion.button>
            </motion.div>
          </motion.form>
        </div>
      </div>

      {/* One-Prompt Job Creator Modal */}
      {showOnePromptCreator && (
        <OnePromptJobCreator
          onJobCreated={() => {
            setShowOnePromptCreator(false);
            navigate('/jobs/manage');
          }}
          onClose={() => setShowOnePromptCreator(false)}
        />
      )}
    </div>
  );
};

export default JobCreate;
