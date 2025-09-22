import React, { useState } from 'react';
import { useMutation } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  Check, 
  RefreshCw,
  Lightbulb,
  Eye,
  X
} from 'lucide-react';

const AIJobPrompt = ({ onJobGenerated, onClose }) => {
  const [promptData, setPromptData] = useState({
    role: '',
    company: '',
    industry: ''
  });

  const [generatedJob, setGeneratedJob] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const generateJobMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/ai/generate-job', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setGeneratedJob(data);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPromptData(prev => ({
      ...prev,
      [name]: value
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

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleUseJob = () => {
    if (generatedJob) {
      onJobGenerated(generatedJob);
    }
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
              <h2 className="text-2xl font-bold text-gray-900">AI Job Description Generator</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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

            {/* Right Section: Generated Content */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Generated Content
              </h3>

              {generatedJob ? (
                <div className="space-y-4">
                  {/* Job Title */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Job Title</h4>
                      <button
                        onClick={() => copyToClipboard(generatedJob.title, 'title')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedField === 'title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-gray-700">{generatedJob.title}</p>
                  </div>

                  {/* Job Description */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Job Description</h4>
                      <button
                        onClick={() => copyToClipboard(generatedJob.description, 'description')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedField === 'description' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{generatedJob.description}</p>
                  </div>

                  {/* Requirements */}
                  {generatedJob.requirements && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Requirements</h4>
                        <button
                          onClick={() => copyToClipboard(generatedJob.requirements.join('\n'), 'requirements')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === 'requirements' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {generatedJob.requirements.map((req, index) => (
                          <li key={index} className="text-gray-700 text-sm">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  {generatedJob.skills && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Required Skills</h4>
                        <button
                          onClick={() => copyToClipboard(generatedJob.skills.join(', '), 'skills')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === 'skills' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedJob.skills.map((skill, index) => (
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

                  {/* Benefits */}
                  {generatedJob.benefits && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Benefits</h4>
                        <button
                          onClick={() => copyToClipboard(generatedJob.benefits.join('\n'), 'benefits')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === 'benefits' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {generatedJob.benefits.map((benefit, index) => (
                          <li key={index} className="text-gray-700 text-sm">• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleUseJob}
                      className="flex-1 btn btn-primary"
                    >
                      Use This Job Description
                    </button>
                    <button
                      onClick={() => setGeneratedJob(null)}
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
                    Fill in the job requirements and click "Generate Job Description" to create an AI-powered job posting.
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

export default AIJobPrompt;
