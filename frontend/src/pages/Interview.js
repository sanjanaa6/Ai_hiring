import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ModernInterview from '../components/ModernInterview';
import WorkingScreenShare from '../components/WorkingScreenShare';
import apiService from '../services/apiService';
import { Bot, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Interview = () => {
  const { interviewId } = useParams();
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScreenShare, setShowScreenShare] = useState(true); // Auto-enable screen sharing

  const loadInterviewData = useCallback(async () => {
    try {
      let result;
      
      // Check if this is an Electronics interview by ID pattern
      if (interviewId.startsWith('electronics_interview_')) {
        console.log('Detected Electronics interview, using Electronics service...');
        const { default: electronicsInterviewService } = await import('../services/electronicsInterviewService');
        result = await electronicsInterviewService.getElectronicsInterview(interviewId);
        result = { success: true, data: result };
      } else {
        console.log('Using regular interview API...');
        result = await apiService.getInterview(interviewId);
      }
      
      if (result.success) {
        setInterviewData(result.data);
      } else {
        setError(result.error || 'Interview not found. Please check the interview link.');
        return;
      }

      // Auto-generate anonymous candidate info
      const storedInfo = localStorage.getItem('candidateInfo');
      if (storedInfo) {
        const parsedInfo = JSON.parse(storedInfo);
        console.log('Loaded candidate info from localStorage:', parsedInfo);
        setCandidateInfo(parsedInfo);
      } else {
        // Generate anonymous candidate info
        const anonymousInfo = {
          id: `candidate_${Date.now()}`,
          name: `Anonymous_${Date.now()}`,
          email: `anonymous_${Date.now()}@interview.com`,
          phone: ''
        };
        console.log('Generated anonymous candidate info:', anonymousInfo);
        setCandidateInfo(anonymousInfo);
        localStorage.setItem('candidateInfo', JSON.stringify(anonymousInfo));
        localStorage.setItem('candidateId', anonymousInfo.id);
        localStorage.setItem('candidateName', anonymousInfo.name);
        localStorage.setItem('candidateEmail', anonymousInfo.email);
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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-y-auto p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-y-auto p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-y-auto p-4">
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


  if (!interviewData || !candidateInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-y-auto p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing interview...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
      
      {/* Screen Share Overlay - Auto-starts when interview begins */}
      {showScreenShare && candidateInfo && (
        <WorkingScreenShare
          interviewId={interviewId}
          role="candidate"
          candidateInfo={candidateInfo}
          onClose={() => setShowScreenShare(false)}
        />
      )}
    </>
  );
};

export default Interview;
