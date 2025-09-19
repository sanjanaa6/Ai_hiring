import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Calendar,
  Users,
  CheckCircle,
  ArrowLeft,
  Send
} from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resume: ''
  });

  // Fetch job details
  const { data: job, isLoading, error } = useQuery(
    ['job', id],
    async () => {
      const response = await axios.get(`/api/jobs/${id}`);
      return response.data;
    }
  );

  // Apply for job mutation
  const applyMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/applications', {
        jobId: id,
        ...data
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Application submitted successfully!');
        setShowApplicationForm(false);
        setApplicationData({ coverLetter: '', resume: '' });
        queryClient.invalidateQueries(['job', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit application');
      }
    }
  );

  const handleApplicationSubmit = (e) => {
    e.preventDefault();
    if (!applicationData.coverLetter.trim() || !applicationData.resume.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    applyMutation.mutate(applicationData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/jobs')}
              className="btn btn-primary"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Jobs
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Job Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <Building className="h-5 w-5 mr-2" />
                      <span className="font-medium">{job.company}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="h-5 w-5 mr-1" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    job.type === 'full-time' 
                      ? 'bg-green-100 text-green-800'
                      : job.type === 'part-time'
                      ? 'bg-blue-100 text-blue-800'
                      : job.type === 'contract'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {job.type.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {job.experienceLevel.replace('-', ' ').toUpperCase()}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                  {job.salary && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salary.min && job.salary.max 
                        ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`
                        : 'Salary not specified'
                      }
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {job.applications?.length || 0} applications
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              {isAuthenticated ? (
                user?.role === 'candidate' ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for this job</h3>
                    
                    {!showApplicationForm ? (
                      <button
                        onClick={() => setShowApplicationForm(true)}
                        className="w-full btn btn-primary mb-4"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        Apply Now
                      </button>
                    ) : (
                      <form onSubmit={handleApplicationSubmit} className="space-y-4">
                        <div>
                          <label className="form-label">Cover Letter *</label>
                          <textarea
                            className="form-textarea"
                            rows="4"
                            placeholder="Tell us why you're interested in this position..."
                            value={applicationData.coverLetter}
                            onChange={(e) => setApplicationData({
                              ...applicationData,
                              coverLetter: e.target.value
                            })}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="form-label">Resume URL *</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://example.com/your-resume.pdf"
                            value={applicationData.resume}
                            onChange={(e) => setApplicationData({
                              ...applicationData,
                              resume: e.target.value
                            })}
                            required
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowApplicationForm(false)}
                            className="flex-1 btn btn-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={applyMutation.isLoading}
                            className="flex-1 btn btn-primary"
                          >
                            {applyMutation.isLoading ? 'Submitting...' : 'Submit Application'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Management</h3>
                    <p className="text-gray-600 mb-4">
                      This is your job posting. You can manage applications and edit details.
                    </p>
                    <div className="space-y-2">
                      <button className="w-full btn btn-outline">
                        View Applications
                      </button>
                      <button className="w-full btn btn-secondary">
                        Edit Job
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for this job</h3>
                  <p className="text-gray-600 mb-4">
                    Sign in to apply for this position and track your applications.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full btn btn-primary"
                    >
                      Sign In to Apply
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="w-full btn btn-outline"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}

              {/* Job Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Job Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applications</span>
                    <span className="font-medium">{job.applications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted</span>
                    <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${
                      job.status === 'active' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
