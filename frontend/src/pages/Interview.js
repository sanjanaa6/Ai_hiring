import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ModernInterview from '../components/ModernInterview';
import apiService from '../services/apiService';
import { Bot, AlertCircle, ArrowLeft, User, Camera, Mic, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Interview = () => {
  const { interviewId } = useParams();
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCandidateForm, setShowCandidateForm] = useState(false);

  const loadInterviewData = useCallback(async () => {
    try {
      const result = await apiService.getInterview(interviewId);
      
      if (result.success) {
        setInterviewData(result.data);
      } else {
        setError(result.error || 'Interview not found. Please check the interview link.');
        return;
      }

      // Get candidate info from localStorage or show form
    const storedInfo = localStorage.getItem('candidateInfo');
    if (storedInfo) {
      setCandidateInfo(JSON.parse(storedInfo));
    } else {
        setShowCandidateForm(true);
      }
    } catch (err) {
      setError('Failed to load interview data');
      console.error('Error loading interview:', err);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    loadInterviewData();
  }, [interviewId, loadInterviewData]);

  const handleCandidateSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const info = {
      name: formData.get('name'),
      phone: formData.get('phone')
    };
      setCandidateInfo(info);
      localStorage.setItem('candidateInfo', JSON.stringify(info));
    setShowCandidateForm(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!interviewId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
        <div className="text-center max-w-md mx-auto px-4">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Interview Link</h1>
          <p className="text-gray-600 mb-6">
            The interview link you provided is not valid. Please check the link and try again.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (showCandidateForm) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Voice AI Interview</h1>
            <p className="text-gray-600">This interview uses voice responses and camera monitoring</p>
          </div>

          <form onSubmit={handleCandidateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your phone number (optional)"
              />
            </div>

            {/* Interview Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-medium text-blue-900 mb-2">Interview Requirements:</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Camera access for identity verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mic className="h-4 w-4" />
                  <span>Microphone for voice responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Environment monitoring (no electronic devices)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Start Voice Interview
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!interviewData || !candidateInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing interview...</p>
        </div>
      </div>
    );
  }

  return (
    <ModernInterview 
      interviewId={interviewId}
      candidateInfo={candidateInfo}
      onComplete={(result) => {
        console.log('Voice interview completed:', result);
        // Redirect to completion page or show success message
      }}
      onError={(error) => {
        console.error('Voice interview error:', error);
        setError(error);
      }}
    />
  );
};

export default Interview;
