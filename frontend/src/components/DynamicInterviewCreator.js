import React, { useState } from 'react';
import { useMutation } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw,
  X,
  Code,
  Lock,
  Globe,
  CheckCircle
} from 'lucide-react';
import dynamicInterviewService from '../services/dynamicInterviewService';

const DynamicInterviewCreator = ({ onClose, onInterviewCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedInterview, setGeneratedInterview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [roleConfig, setRoleConfig] = useState(null);

  const generateInterviewMutation = useMutation(
    async (data) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/interviews/generate-dynamic', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setGeneratedInterview(data.data);
        setDetectedLanguage(data.data.language);
        setRoleConfig(data.data.roleConfig);
        toast.success(`Dynamic ${data.data.language.toUpperCase()} interview generated successfully!`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to generate dynamic interview');
      },
      onSettled: () => {
        setIsGenerating(false);
      }
    }
  );

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a job description prompt');
      return;
    }

    setIsGenerating(true);
    generateInterviewMutation.mutate({ prompt: prompt.trim() });
  };

  const quickPrompts = [
    "React Developer for SaaS company, Next.js/TypeScript skills, San Francisco, full-time, modern frontend development",
    "Frontend Developer with React/JSX experience, component-based architecture, modern web development",
    "TypeScript Developer with React/Angular experience, Node.js backend, $85k-125k, 2+ years experience",
    "Senior Python Developer at a fintech startup, Django/Flask experience, $90k-130k, 3+ years experience",
    "Java Developer at enterprise company, Spring Boot/Microservices, $80k-120k, 2+ years experience"
  ];

  const applyQuickPrompt = (quickPrompt) => {
    setPrompt(quickPrompt);
  };

  const getLanguageIcon = (language) => {
    const icons = {
      jsx: '⚛️',
      typescript: '🔷',
      python: '🐍',
      javascript: '🟨',
      java: '☕',
      csharp: '🔷',
      cpp: '⚡',
      php: '🐘',
      ruby: '💎',
      go: '🐹',
      rust: '🦀',
      swift: '🦉',
      kotlin: '🟣',
      scala: '🔴'
    };
    return icons[language] || '💻';
  };

  const getLanguageColor = (language) => {
    const colors = {
      jsx: 'bg-blue-100 text-blue-800 border-blue-300',
      typescript: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      python: 'bg-green-100 text-green-800 border-green-300',
      javascript: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      java: 'bg-orange-100 text-orange-800 border-orange-300',
      csharp: 'bg-blue-100 text-blue-800 border-blue-300',
      cpp: 'bg-purple-100 text-purple-800 border-purple-300',
      php: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ruby: 'bg-red-100 text-red-800 border-red-300',
      go: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      rust: 'bg-gray-100 text-gray-800 border-gray-300',
      swift: 'bg-orange-100 text-orange-800 border-orange-300',
      kotlin: 'bg-purple-100 text-purple-800 border-purple-300',
      scala: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[language] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Dynamic Interview Creator</h2>
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
                  Describe Your Role
                </h3>
                
                {/* Quick start templates */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Language-specific examples:</p>
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
                    placeholder="Describe the programming role you want to create an interview for. Include the programming language, frameworks, experience level, etc. The AI will automatically detect the language and create a specialized interview."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Example: "Senior Python Developer with Django/Flask experience, 3+ years, data science background"
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
                  <span>{isGenerating ? 'Generating Dynamic Interview...' : 'Generate Dynamic Interview'}</span>
                </button>
              </div>
            </div>

            {/* Right Section: Generated Interview Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Dynamic Interview Preview
              </h3>

              {generatedInterview ? (
                <div className="space-y-4">
                  {/* Language Detection */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="form-label flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Detected Language
                      </h4>
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getLanguageColor(detectedLanguage)}`}>
                        <span className="mr-2">{getLanguageIcon(detectedLanguage)}</span>
                        {detectedLanguage?.toUpperCase()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI automatically detected <strong>{detectedLanguage}</strong> from your prompt and will create a specialized interview.
                    </p>
                  </div>

                  {/* Interview Title */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Interview Title</h4>
                    <p className="text-gray-700 font-medium">{generatedInterview.title}</p>
                  </div>

                  {/* Language Lock Status */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Code Editor Locked</h4>
                        <p className="text-sm text-gray-600">
                          The code editor will be locked to <strong>{detectedLanguage?.toUpperCase()}</strong> syntax only.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role Configuration */}
                  {roleConfig && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="form-label">Role Configuration</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Frameworks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {roleConfig.frameworks.map((framework, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {framework}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Tools:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {roleConfig.tools.map((tool, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Concepts:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {roleConfig.concepts.map((concept, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interview Rounds */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="form-label">Interview Rounds</h4>
                    <div className="space-y-2">
                      {generatedInterview.rounds?.map((round, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium text-gray-900">{round.title}</span>
                            <p className="text-sm text-gray-600">{round.description}</p>
                          </div>
                          <span className="text-sm text-gray-500">{round.duration} min</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        if (onInterviewCreated) {
                          onInterviewCreated(generatedInterview);
                        }
                        onClose();
                      }}
                      className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Use This Interview</span>
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedInterview(null);
                        setDetectedLanguage(null);
                        setRoleConfig(null);
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
                    Enter a job description prompt and click "Generate Dynamic Interview" to create a language-specific interview.
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

export default DynamicInterviewCreator;
