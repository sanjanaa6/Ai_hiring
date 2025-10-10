import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ElectronicsInterviewFlow from './ElectronicsInterviewFlow';
import electronicsInterviewService from '../services/electronicsInterviewService';
import { useTheme } from '../context/ThemeContext';

const ElectronicsInterviewHandler = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInterview();
  }, [interviewId]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 [ELECTRONICS HANDLER] Loading interview:', interviewId);
      
      const interviewData = await electronicsInterviewService.getElectronicsInterview(interviewId);
      setInterview(interviewData);
      
      console.log('✅ [ELECTRONICS HANDLER] Interview loaded:', {
        id: interviewData.interviewId,
        title: interviewData.title,
        rounds: interviewData.rounds?.length || 0,
        hasPCB: electronicsInterviewService.hasPCBRound(interviewData)
      });
      
    } catch (error) {
      console.error('❌ [ELECTRONICS HANDLER] Error loading interview:', error);
      setError(error.message || 'Failed to load electronics interview');
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewComplete = (answers) => {
    console.log('✅ [ELECTRONICS HANDLER] Interview completed:', answers);
    
    // Show completion message
    alert('Electronics interview completed successfully! Your responses have been submitted.');
    
    // Navigate back to dashboard or interview list
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">
            Loading Electronics Interview...
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Preparing PCB design interface and interview questions
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Interview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="space-x-4">
            <button
              onClick={loadInterview}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Interview Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            The requested electronics interview could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Check if this is an electronics interview
  if (interview.interviewType !== 'electronics') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Electronics Interview Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This interview is not configured for electronics. Please use the electronics interview generator.
          </p>
          <button
            onClick={() => navigate('/electronics/generate')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Generate Electronics Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <ElectronicsInterviewFlow
      interview={interview}
      onInterviewComplete={handleInterviewComplete}
      isDarkMode={isDarkMode}
    />
  );
};

export default ElectronicsInterviewHandler;
