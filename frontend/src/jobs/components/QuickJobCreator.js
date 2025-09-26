import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import apiService from '../../services/apiService';
import { toast } from 'react-toastify';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw,
  Lightbulb,
  Eye,
  X,
  Save,
  Plus
} from 'lucide-react';

const QuickJobCreator = ({ onClose, onJobCreated }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: AI Generation, 2: Job Details, 3: Review & Post
  const [promptData, setPromptData] = useState({
    role: '',
    company: '',
    industry: ''
  });
  const [generatedJob, setGeneratedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState({
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
  const [isGenerating, setIsGenerating] = useState(false);

  const generateJobMutation = useMutation(
    async (data) => {
      const response = await apiService.generateJob(data);
      return response;
    },
    {
      onSuccess: (data) => {
        setGeneratedJob(data);
        // Auto-fill job details with generated content
        setJobDetails(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          requirements: data.requirements || prev.requirements,
          skills: data.skills || prev.skills,
          benefits: data.benefits || prev.benefits
        }));
        setStep(2);
        toast.success('Job description generated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to generate job description');
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
      }
    }
  );

  const handlePromptChange = (e) => {
    const { name, value } = e.target;
    setPromptData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJobDetailsChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setJobDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setJobDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setJobDetails(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setJobDetails(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setJobDetails(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = () => {
    if (!promptData.role || !promptData.company) {
      toast.error('Please fill in at least the role and company fields');
      return;
    }

    setIsGenerating(true);
    generateJobMutation.mutate(promptData);
  };

  const handlePostJob = () => {
    // Clean up empty array items
    const cleanedData = {
      ...jobDetails,
      requirements: jobDetails.requirements.filter(req => req.trim() !== ''),
      skills: jobDetails.skills.filter(skill => skill.trim() !== ''),
      benefits: jobDetails.benefits.filter(benefit => benefit.trim() !== ''),
      salary: {
        ...jobDetails.salary,
        min: jobDetails.salary.min ? parseInt(jobDetails.salary.min) : undefined,
        max: jobDetails.salary.max ? parseInt(jobDetails.salary.max) : undefined
      }
    };

    createJobMutation.mutate(cleanedData);
  };

  const quickPrompts = [
    {
      title: "Software Engineer",
      description: "Senior Software Engineer at a tech startup, looking for someone with React and Node.js experience."
    },
    {
      title: "Marketing Manager", 
      description: "Marketing Manager for a SaaS company, need someone with digital marketing and growth experience."
    },
    {
      title: "Data Scientist",
      description: "Data Scientist at a fintech company, looking for Python and machine learning expertise."
    }
  ];

  const applyQuickPrompt = (prompt) => {
    const parts = prompt.description.split(' at ');
    const role = parts[0];
    const companyPart = parts[1]?.split(',')[0] || '';
    const company = companyPart.replace('a ', '').replace('an ', '');
    
    setPromptData(prev => ({
      ...prev,
      role: role,
      company: company
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Quick Job Creator</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Generate</span>
              </div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Details</span>
              </div>
              <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Post</span>
              </div>
            </div>
          </div>

          {/* Step 1: AI Generation */}
          {step === 1 && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Section: Job Requirements */}
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Job Requirements
                  </h3>
                  
                  {/* Quick start templates */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Quick start templates:</p>
                    <div className="space-y-3">
                      {quickPrompts.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => applyQuickPrompt(item)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                        >
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="form-label">Job Role/Title *</label>
                    <input
                      type="text"
                      name="role"
                      className="form-input"
                      placeholder="e.g., Senior Software Engineer"
                      value={promptData.role}
                      onChange={handlePromptChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      name="company"
                      className="form-input"
                      placeholder="e.g., TechCorp Inc."
                      value={promptData.company}
                      onChange={handlePromptChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      className="form-input"
                      placeholder="e.g., Technology, Healthcare, Finance"
                      value={promptData.industry}
                      onChange={handlePromptChange}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2 mt-6"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Wand2 className="h-5 w-5" />
                    )}
                    <span>{isGenerating ? 'Generating...' : 'Generate Job Description'}</span>
                  </button>
                </form>
              </div>

              {/* Right Section: Generated Content Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Generated Content
                </h3>

                {generatedJob ? (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Job Title</h4>
                      <p className="text-gray-700">{generatedJob.title}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{generatedJob.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Wand2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h4>
                    <p className="text-gray-600">
                      Fill in the job requirements and click "Generate Job Description" to create an AI-powered job posting.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Job Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
                    value={jobDetails.title}
                    onChange={handleJobDetailsChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Company *</label>
                  <input
                    type="text"
                    name="company"
                    className="form-input"
                    value={jobDetails.company}
                    onChange={handleJobDetailsChange}
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
                    value={jobDetails.location}
                    onChange={handleJobDetailsChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Job Type *</label>
                  <select
                    name="type"
                    className="form-select"
                    value={jobDetails.type}
                    onChange={handleJobDetailsChange}
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
                    value={jobDetails.experienceLevel}
                    onChange={handleJobDetailsChange}
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
                    value={jobDetails.status}
                    onChange={handleJobDetailsChange}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Job Description *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  rows="6"
                  value={jobDetails.description}
                  onChange={handleJobDetailsChange}
                  required
                />
              </div>

              {/* Salary Information */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="form-label">Minimum Salary</label>
                  <input
                    type="number"
                    name="salary.min"
                    className="form-input"
                    placeholder="e.g., 80000"
                    value={jobDetails.salary.min}
                    onChange={handleJobDetailsChange}
                  />
                </div>

                <div>
                  <label className="form-label">Maximum Salary</label>
                  <input
                    type="number"
                    name="salary.max"
                    className="form-input"
                    placeholder="e.g., 120000"
                    value={jobDetails.salary.max}
                    onChange={handleJobDetailsChange}
                  />
                </div>

                <div>
                  <label className="form-label">Currency</label>
                  <select
                    name="salary.currency"
                    className="form-select"
                    value={jobDetails.salary.currency}
                    onChange={handleJobDetailsChange}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="form-label">Requirements</label>
                <div className="space-y-2">
                  {jobDetails.requirements.map((requirement, index) => (
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
                        <X className="h-4 w-4" />
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
              <div>
                <label className="form-label">Required Skills</label>
                <div className="space-y-2">
                  {jobDetails.skills.map((skill, index) => (
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
                        <X className="h-4 w-4" />
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
              <div>
                <label className="form-label">Benefits & Perks</label>
                <div className="space-y-2">
                  {jobDetails.benefits.map((benefit, index) => (
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
                        <X className="h-4 w-4" />
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

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                >
                  Back to Generate
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn btn-primary"
                >
                  Review & Post
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Post */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Preview</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">{jobDetails.title}</h4>
                    <p className="text-gray-600">{jobDetails.company} • {jobDetails.location}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                        {jobDetails.type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                        {jobDetails.experienceLevel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-700 whitespace-pre-wrap">{jobDetails.description}</p>
                  </div>

                  {jobDetails.requirements.filter(req => req.trim() !== '').length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Requirements</h5>
                      <ul className="space-y-1">
                        {jobDetails.requirements.filter(req => req.trim() !== '').map((req, index) => (
                          <li key={index} className="text-gray-700">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {jobDetails.skills.filter(skill => skill.trim() !== '').length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Required Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {jobDetails.skills.filter(skill => skill.trim() !== '').map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobDetails.benefits.filter(benefit => benefit.trim() !== '').length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Benefits</h5>
                      <ul className="space-y-1">
                        {jobDetails.benefits.filter(benefit => benefit.trim() !== '').map((benefit, index) => (
                          <li key={index} className="text-gray-700">• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(jobDetails.salary.min || jobDetails.salary.max) && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Salary</h5>
                      <p className="text-gray-700">
                        {jobDetails.salary.min && jobDetails.salary.max 
                          ? `${jobDetails.salary.currency} ${jobDetails.salary.min} - ${jobDetails.salary.max}`
                          : jobDetails.salary.min 
                            ? `${jobDetails.salary.currency} ${jobDetails.salary.min}+`
                            : `Up to ${jobDetails.salary.currency} ${jobDetails.salary.max}`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-secondary"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handlePostJob}
                  disabled={createJobMutation.isLoading}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>{createJobMutation.isLoading ? 'Posting Job...' : 'Post Job'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickJobCreator;
