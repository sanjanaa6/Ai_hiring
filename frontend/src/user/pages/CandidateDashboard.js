import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserLayout from '../components/UserLayout';
import AIInterviewConductor from '../../components/AIInterviewConductor';
import { 
  Bot, 
  Link, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Briefcase
} from 'lucide-react';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [interviewLink, setInterviewLink] = useState('');
  const [showInterview, setShowInterview] = useState(false);
  const [interviewId, setInterviewId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if there's an interview link in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const link = urlParams.get('link');
    if (link) {
      setInterviewLink(link);
    }
  }, []);

  const handleJoinInterview = () => {
    if (!interviewLink.trim()) {
      setError('Please enter a valid interview link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract interview ID from link
      const url = new URL(interviewLink);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      
      if (id && id.startsWith('interview_')) {
        setInterviewId(id);
        setShowInterview(true);
      } else {
        setError('Invalid interview link format');
      }
    } catch (error) {
      setError('Invalid interview link');
    } finally {
      setLoading(false);
    }
  };

  const candidateInfo = {
    name: user?.name || 'Candidate',
    email: user?.email || 'candidate@example.com',
    skills: user?.profile?.skills || [],
    experience: user?.candidateProfile?.experience || 'Not specified'
  };

  if (showInterview) {
    return (
      <AIInterviewConductor 
        interviewId={interviewId} 
        candidateInfo={candidateInfo}
      />
    );
  }

  return (
    <UserLayout>
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <Bot className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Interview Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your interview link to start your AI-powered interview and showcase your skills
            </p>
          </div>

          {/* Interview Link Input */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
                <Link className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Join Your Interview
              </h2>
              <p className="text-gray-600 text-lg">
                Enter the interview link provided by the recruiter to begin your AI-powered interview
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Link
                </label>
                <input
                  type="url"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  placeholder="https://yourapp.com/interview/interview_123456789"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleJoinInterview}
                disabled={loading || !interviewLink.trim()}
                className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Joining Interview...</span>
                  </>
                ) : (
                  <>
                    <Link className="h-5 w-5" />
                    <span>Join Interview</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
              <div className="p-2 bg-blue-100 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Advanced AI conducts your interview with intelligent questions
              </p>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
              <div className="p-2 bg-green-100 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Timing</h3>
              <p className="text-sm text-gray-600">
                Take your interview at your convenience, anytime, anywhere
              </p>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
              <div className="p-2 bg-purple-100 rounded-lg w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant Feedback</h3>
              <p className="text-sm text-gray-600">
                Get immediate evaluation and feedback on your performance
              </p>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{candidateInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{candidateInfo.experience}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {candidateInfo.skills.length > 0 ? (
                    candidateInfo.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No skills listed</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Join Your Interview</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Make sure you have a stable internet connection</li>
              <li>Find a quiet environment with good lighting</li>
              <li>Have your interview link ready (provided by the recruiter)</li>
              <li>Click "Join Interview" and follow the on-screen instructions</li>
              <li>Answer each question thoughtfully within the time limit</li>
              <li>Review your answers before submitting</li>
            </ol>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default CandidateDashboard;
