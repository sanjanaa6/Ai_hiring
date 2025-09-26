import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';
import { Plus, X, Save, ArrowLeft, Sparkles } from 'lucide-react';
import AIJobPrompt from '../components/AIJobPrompt';
import QuickJobCreator from '../components/QuickJobCreator';
import OnePromptJobCreator from '../components/OnePromptJobCreator';

const JobCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showQuickCreator, setShowQuickCreator] = useState(false);
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

  const handleAIJobGenerated = (aiJobData) => {
    setFormData(prev => ({
      ...prev,
      title: aiJobData.title || prev.title,
      description: aiJobData.description || prev.description,
      requirements: aiJobData.requirements || prev.requirements,
      skills: aiJobData.skills || prev.skills,
      benefits: aiJobData.benefits || prev.benefits
    }));
    setShowAIPrompt(false);
    toast.success('AI-generated content has been applied to your job posting!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate('/jobs/manage')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Jobs
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOnePromptCreator(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>One-Prompt Create</span>
                </button>
                <button
                  onClick={() => setShowQuickCreator(true)}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Step-by-Step</span>
                </button>
                <button
                  onClick={() => setShowAIPrompt(true)}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>AI Assistant</span>
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
            <p className="text-gray-600">
              Create a job posting to attract the best candidates for your open position. Choose your preferred method:
            </p>
            <div className="mt-3 text-sm text-gray-500">
              <p><strong>One-Prompt Create:</strong> Describe your job in one sentence, AI fills all details and posts it</p>
              <p><strong>Step-by-Step:</strong> AI generates content, then you review and customize before posting</p>
              <p><strong>AI Assistant:</strong> Generate content to copy and paste into the manual form below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Company *</label>
                  <input
                    type="text"
                    name="company"
                    className="form-input"
                    placeholder="e.g., Tech Corp"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    name="location"
                    className="form-input"
                    placeholder="e.g., San Francisco, CA or Remote"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Job Type *</label>
                  <select
                    name="type"
                    className="form-select"
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
                  <label className="form-label">Experience Level *</label>
                  <select
                    name="experienceLevel"
                    className="form-select"
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
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-select"
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
                <label className="form-label">Job Description *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  rows="6"
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Salary Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Salary Information</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="form-label">Minimum Salary</label>
                  <input
                    type="number"
                    name="salary.min"
                    className="form-input"
                    placeholder="e.g., 80000"
                    value={formData.salary.min}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">Maximum Salary</label>
                  <input
                    type="number"
                    name="salary.max"
                    className="form-input"
                    placeholder="e.g., 120000"
                    value={formData.salary.max}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">Currency</label>
                  <select
                    name="salary.currency"
                    className="form-select"
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
            </div>

            {/* Requirements */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Requirements</h2>
              
              <div className="space-y-4">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="form-input flex-1"
                      placeholder="e.g., 3+ years of experience with React"
                      value={requirement}
                      onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('requirements')}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Requirement
                </button>
              </div>
            </div>

            {/* Skills */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Required Skills</h2>
              
              <div className="space-y-4">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="form-input flex-1"
                      placeholder="e.g., JavaScript, React, Node.js"
                      value={skill}
                      onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('skills', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('skills')}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Skill
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Benefits & Perks</h2>
              
              <div className="space-y-4">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="form-input flex-1"
                      placeholder="e.g., Health insurance, 401k matching, Flexible hours"
                      value={benefit}
                      onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('benefits', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('benefits')}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Benefit
                </button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/jobs/manage')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createJobMutation.isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>{createJobMutation.isLoading ? 'Creating Job...' : 'Post Job'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Job Prompt Modal */}
      {showAIPrompt && (
        <AIJobPrompt
          onJobGenerated={handleAIJobGenerated}
          onClose={() => setShowAIPrompt(false)}
        />
      )}

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

      {/* Quick Job Creator Modal */}
      {showQuickCreator && (
        <QuickJobCreator
          onJobCreated={() => {
            setShowQuickCreator(false);
            navigate('/jobs/manage');
          }}
          onClose={() => setShowQuickCreator(false)}
        />
      )}
    </div>
  );
};

export default JobCreate;
