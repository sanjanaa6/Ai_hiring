import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw,
  X,
  Save,
  Eye,
  Plus
} from 'lucide-react';

const OnePromptJobCreator = ({ onClose, onJobCreated }) => {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [generatedJob, setGeneratedJob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [editableJob, setEditableJob] = useState(null);

  const generateJobMutation = useMutation(
    async (data) => {
      const response = await apiService.generateJob(data);
      return response;
    },
    {
      onSuccess: (data) => {
        setGeneratedJob(data);
        setEditableJob(data);
        toast.success('Job details generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate job details');
      },
      onSettled: () => {
        setIsGenerating(false);
      }
    }
  );

  const createJobMutation = useMutation(
    async (jobData) => {
      const response = await apiService.createJob(jobData);
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Job posted successfully!');
        queryClient.invalidateQueries('recruiter-jobs');
        if (onJobCreated) onJobCreated();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to post job');
      },
      onSettled: () => {
        setIsPosting(false);
      }
    }
  );

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a job description prompt');
      return;
    }

    setIsGenerating(true);
    generateJobMutation.mutate({ prompt: prompt.trim() });
  };

  const handlePostJob = () => {
    if (!editableJob) return;

    setIsPosting(true);
    
    // Clean up the editable data for posting
    const jobData = {
      title: editableJob.title || '',
      description: editableJob.description || '',
      company: editableJob.company || '',
      location: editableJob.location || 'Remote',
      type: editableJob.type || 'full-time',
      experienceLevel: editableJob.experienceLevel || 'mid',
      salary: {
        min: editableJob.salary?.min || '',
        max: editableJob.salary?.max || '',
        currency: editableJob.salary?.currency || 'USD'
      },
      requirements: editableJob.requirements || [],
      skills: editableJob.skills || [],
      benefits: editableJob.benefits || [],
      status: 'active'
    };

    createJobMutation.mutate(jobData);
  };

  const handleEditableJobChange = (field, value) => {
    setEditableJob(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setEditableJob(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setEditableJob(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setEditableJob(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const quickPrompts = [
    "Senior React Developer at a tech startup, remote work, $80k-120k, 3+ years experience",
    "Marketing Manager for SaaS company, San Francisco, full-time, growth marketing experience",
    "Data Scientist at fintech startup, Python/ML skills, $90k-130k, 2+ years experience"
  ];

  const applyQuickPrompt = (quickPrompt) => {
    setPrompt(quickPrompt);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">One-Prompt Job Creator</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Section: Prompt Input */}
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Wand2 className="h-5 w-5 mr-2" />
                  Describe Your Job
                </h3>
                
                {/* Quick start templates */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Quick examples:</p>
                  <div className="space-y-2">
                    {quickPrompts.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => applyQuickPrompt(example)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors text-sm"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Job Description Prompt *</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="form-textarea"
                    rows="6"
                    placeholder="Describe the job you want to post. Include role, company, location, salary, requirements, etc. The more details you provide, the better the AI can generate a complete job posting."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Example: "Senior Software Engineer at TechCorp, San Francisco, $100k-150k, React/Node.js experience, remote work, health insurance"
                  </p>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full btn btn-primary flex items-center justify-center space-x-2"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Wand2 className="h-5 w-5" />
                  )}
                  <span>{isGenerating ? 'Generating...' : 'Generate Job Details'}</span>
                </button>
              </div>
            </div>

            {/* Right Section: Generated Job Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Generated Job Preview
              </h3>

              {editableJob ? (
                <div className="space-y-4">
                  {/* Job Title */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Job Title</h4>
                    <input
                      type="text"
                      value={editableJob.title || ''}
                      onChange={(e) => handleEditableJobChange('title', e.target.value)}
                      className="form-input"
                      placeholder="Enter job title"
                    />
                  </div>

                  {/* Company & Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="form-label">Company</h4>
                      <input
                        type="text"
                        value={editableJob.company || ''}
                        onChange={(e) => handleEditableJobChange('company', e.target.value)}
                        className="form-input"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="form-label">Location</h4>
                      <input
                        type="text"
                        value={editableJob.location || ''}
                        onChange={(e) => handleEditableJobChange('location', e.target.value)}
                        className="form-input"
                        placeholder="Enter location"
                      />
                    </div>
                  </div>

                  {/* Job Type & Experience */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="form-label">Job Type</h4>
                      <select
                        value={editableJob.type || 'full-time'}
                        onChange={(e) => handleEditableJobChange('type', e.target.value)}
                        className="form-select"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="form-label">Experience Level</h4>
                      <select
                        value={editableJob.experienceLevel || 'mid'}
                        onChange={(e) => handleEditableJobChange('experienceLevel', e.target.value)}
                        className="form-select"
                      >
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                        <option value="executive">Executive</option>
                      </select>
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Salary Range</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="number"
                        value={editableJob.salary?.min || ''}
                        onChange={(e) => handleEditableJobChange('salary', { ...editableJob.salary, min: e.target.value })}
                        className="form-input"
                        placeholder="Min salary"
                      />
                      <input
                        type="number"
                        value={editableJob.salary?.max || ''}
                        onChange={(e) => handleEditableJobChange('salary', { ...editableJob.salary, max: e.target.value })}
                        className="form-input"
                        placeholder="Max salary"
                      />
                      <select
                        value={editableJob.salary?.currency || 'USD'}
                        onChange={(e) => handleEditableJobChange('salary', { ...editableJob.salary, currency: e.target.value })}
                        className="form-select"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Job Description</h4>
                    <textarea
                      value={editableJob.description || ''}
                      onChange={(e) => handleEditableJobChange('description', e.target.value)}
                      className="form-textarea"
                      rows="6"
                      placeholder="Enter job description"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Requirements</h4>
                    <div className="space-y-2">
                      {editableJob.requirements?.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                            className="form-input flex-1"
                            placeholder="Enter requirement"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('requirements', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('requirements')}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Requirement
                      </button>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Required Skills</h4>
                    <div className="space-y-2">
                      {editableJob.skills?.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                            className="form-input flex-1"
                            placeholder="Enter skill"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('skills', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('skills')}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Skill
                      </button>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Benefits & Perks</h4>
                    <div className="space-y-2">
                      {editableJob.benefits?.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                            className="form-input flex-1"
                            placeholder="Enter benefit"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('benefits', index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('benefits')}
                        className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Benefit
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handlePostJob}
                      disabled={isPosting}
                      className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>{isPosting ? 'Posting Job...' : 'Post This Job'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedJob(null);
                        setEditableJob(null);
                      }}
                      className="btn btn-secondary"
                    >
                      Generate New
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Wand2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h4>
                  <p className="text-gray-600">
                    Enter a job description prompt and click "Generate Job Details" to create a complete job posting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnePromptJobCreator;
