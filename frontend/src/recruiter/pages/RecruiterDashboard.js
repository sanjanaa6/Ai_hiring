import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RecruiterLayout from '../components/RecruiterLayout';
import CandidateComparison from '../../components/CandidateComparison';
import apiService from '../../services/apiService';
import { 
  Plus, 
  Bot, 
  Link, 
  Copy, 
  CheckCircle, 
  Clock, 
  Users, 
  Briefcase,
  Sparkles,
  FileText,
  MapPin,
  DollarSign,
  Calendar,
  BarChart3,
  UserCheck
} from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedInterview, setGeneratedInterview] = useState(null);
  const [interviewLink, setInterviewLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'candidates', 'analytics'
  const [interviewStats, setInterviewStats] = useState(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);

  // Load interviews on component mount
  useEffect(() => {
    loadInterviews();
  }, []);

  // Load interview stats when interview is selected
  useEffect(() => {
    if (selectedInterviewId) {
      loadInterviewStats(selectedInterviewId);
    }
  }, [selectedInterviewId]);

  const loadInterviews = async () => {
    try {
      const result = await apiService.getAllInterviews();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    }
  };

  const loadInterviewStats = async (interviewId) => {
    try {
      const result = await apiService.getInterviewStats(interviewId);
      if (result.success) {
        setInterviewStats(result.data);
      }
    } catch (error) {
      console.error('Error loading interview stats:', error);
    }
  };

  const [jobForm, setJobForm] = useState({
    title: '',
    company: user?.recruiterProfile?.company || '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    level: 'mid',
    duration: 30
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateAIInterview = async () => {
    if (!jobForm.title || !jobForm.description) {
      alert('Please fill in job title and description');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.generateInterview(jobForm);
      
      if (result.success) {
        setGeneratedInterview(result.data);
        setInterviewLink(result.data.link);
        
        // Add to jobs list
        const newJob = {
          id: 'job_' + Date.now(),
          ...jobForm,
          interviewId: result.data.interviewId,
          interviewLink: result.data.link,
          status: 'active',
          createdAt: new Date()
        };
        setJobs(prev => [newJob, ...prev]);
        
        // Reset form
        setJobForm({
          title: '',
          company: user?.recruiterProfile?.company || '',
          location: '',
          salary: '',
          description: '',
          requirements: '',
          level: 'mid',
          duration: 30
        });
        setShowCreateJob(false);
      } else {
        alert('Failed to generate interview: ' + result.error);
      }
    } catch (error) {
      alert('Error generating interview: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <RecruiterLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Hiring Platform
          </h1>
            <p className="text-gray-600">
              Create jobs with AI-powered multi-round interviews and manage candidates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Jobs & Interviews</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidates'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Candidates</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bot className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">AI Interviews</p>
                    <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Candidates</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Create Job Button */}
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowCreateJob(true)}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg"
            >
              <Plus className="h-6 w-6" />
              <span>Create Job with AI Interview</span>
            </button>
          </div>

          {/* Create Job Modal */}
          {showCreateJob && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Job with AI Interview</h2>
                    <p className="text-gray-600">Fill in the job details and AI will generate interview questions</p>
                  </div>
                  <button
                    onClick={() => setShowCreateJob(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={jobForm.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="e.g., Senior React Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={jobForm.company}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={jobForm.location}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Remote, New York, NY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary
                      </label>
                      <input
                        type="text"
                        name="salary"
                        value={jobForm.salary}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., $80,000 - $120,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level
                      </label>
                      <select
                        name="level"
                        value={jobForm.level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Duration (minutes)
                      </label>
                      <select
                        name="duration"
                        value={jobForm.duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description *
                    </label>
                    <textarea
                      name="description"
                      value={jobForm.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements
                    </label>
                    <textarea
                      name="requirements"
                      value={jobForm.requirements}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="List required skills, experience, and qualifications..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateJob(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateAIInterview}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating AI Interview...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate AI Interview</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generated Interview Success */}
          {generatedInterview && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">AI Interview Generated Successfully!</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Interview Details</h4>
                  <p className="text-sm text-gray-600"><strong>Title:</strong> {generatedInterview.title}</p>
                  <p className="text-sm text-gray-600"><strong>Duration:</strong> {generatedInterview.totalDuration || generatedInterview.duration} minutes</p>
                  <p className="text-sm text-gray-600"><strong>Rounds:</strong> {generatedInterview.rounds?.length || generatedInterview.questions?.length} rounds</p>
                  <p className="text-sm text-gray-600"><strong>Total Questions:</strong> {generatedInterview.rounds?.reduce((total, round) => total + round.questions.length, 0) || generatedInterview.questions?.length} questions</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Share Interview Link</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={interviewLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyLink}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
              </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your AI Interview Jobs</h2>
            </div>
            <div className="p-6">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {job.salary}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {job.duration} min
                            </p>
                          </div>
                          <div className="mt-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {job.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setInterviewLink(job.interviewLink);
                              setLinkCopied(false);
                            }}
                            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                          >
                            <Link className="h-4 w-4" />
                            <span>Get Link</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No AI interview jobs created yet</p>
                  <p className="text-sm text-gray-400">Create your first job with AI-powered interviews</p>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {activeTab === 'candidates' && (
          <CandidateComparison />
        )}

                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      {/* Interview Selection */}
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Interview to View Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {jobs.map((job) => (
                            <button
                              key={job.interviewId}
                              onClick={() => setSelectedInterviewId(job.interviewId)}
                              className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                                selectedInterviewId === job.interviewId
                                  ? 'border-purple-500 bg-purple-50 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <h3 className="font-medium text-gray-900">{job.title}</h3>
                              <p className="text-sm text-gray-600">{job.jobTitle}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interview Statistics */}
                      {interviewStats && (
                        <>
                          <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Analytics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{interviewStats.statistics.totalCandidates}</div>
                                <div className="text-sm text-gray-600">Total Candidates</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{interviewStats.statistics.completedInterviews}</div>
                                <div className="text-sm text-gray-600">Completed Interviews</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">{interviewStats.statistics.averageScore.toFixed(1)}/4</div>
                                <div className="text-sm text-gray-600">Average Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{interviewStats.statistics.completionRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600">Completion Rate</div>
                              </div>
                            </div>
                          </div>

                          {/* Candidate Performance */}
                          <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Performance</h3>
                            <div className="space-y-4">
                              {interviewStats.candidateSummaries.map((candidate, index) => (
                                <div key={candidate.candidateId} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{candidate.candidateName}</h4>
                                      <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-purple-600">{candidate.averageScore.toFixed(1)}/4</div>
                                      <div className="text-sm text-gray-600">Average Score</div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div>
                                      <h5 className="text-sm font-medium text-green-700 mb-1">Strengths:</h5>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {candidate.strengths.slice(0, 3).map((strength, i) => (
                                          <li key={i}>• {strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-red-700 mb-1">Areas for Improvement:</h5>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {candidate.improvements.slice(0, 3).map((improvement, i) => (
                                          <li key={i}>• {improvement}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {!selectedInterviewId && (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Select an interview above to view detailed analytics</p>
                        </div>
                      )}
                    </div>
                  )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterDashboard;
