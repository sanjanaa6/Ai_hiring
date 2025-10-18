import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Monitor, Video, AlertCircle } from 'lucide-react';
import CandidateScreenShare from '../../components/CandidateScreenShare';

/**
 * User Interview Page - Candidate Side
 * Allows candidates to start screen sharing for their interview
 */
const UserInterview = () => {
  const { user } = useAuth();
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [interviewId, setInterviewId] = useState('');

  const handleStartInterview = () => {
    if (!interviewId.trim()) {
      alert('Please enter an Interview ID');
      return;
    }
    setShowScreenShare(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end the interview? This will stop screen sharing.')) {
      setShowScreenShare(false);
      setIsMinimized(false);
    }
  };

  // For testing: Generate a random interview ID
  const generateTestId = () => {
    const testId = 'interview_' + Math.random().toString(36).substring(7);
    setInterviewId(testId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome, {user?.name || 'Candidate'}
                </h1>
                <p className="text-blue-100">Ready to start your interview?</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Interview ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={interviewId}
                  onChange={(e) => setInterviewId(e.target.value)}
                  placeholder="Enter your interview ID..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={generateTestId}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
                >
                  Test ID
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter the interview ID provided by your recruiter
              </p>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important Requirements
                  </h3>
                  <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                    <li>You MUST share your <strong>ENTIRE SCREEN</strong></li>
                    <li>Tab or window sharing will be rejected</li>
                    <li>Ensure your microphone is working</li>
                    <li>Close any confidential applications before sharing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Screen Sharing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Full screen sharing enforced for security
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                    <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Two-Way Audio</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Communicate with recruiter in real-time
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={!interviewId.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>Start Interview</span>
            </button>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Having issues?{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 Your privacy is important. Screen sharing stops automatically when you close the browser.
          </p>
        </div>
      </div>

      {/* Screen Share Modal */}
      {showScreenShare && (
        <CandidateScreenShare
          interviewId={interviewId}
          candidateId={user?.id || user?._id}
          candidateName={user?.name || user?.fullName}
          candidateEmail={user?.email}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onEndInterview={handleEndInterview}
          isMinimized={isMinimized}
          token={user?.token}
        />
      )}
    </div>
  );
};

export default UserInterview;

