import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormSubmissionRound from './FormSubmissionRound';

const InterviewRoundRouter = ({ round, onComplete, candidateInfo, isDarkMode, interviewId, accessLink }) => {
  const navigate = useNavigate();
  
  // Route to appropriate component based on round type
  switch (round.type) {
    case 'form_submission':
      return (
        <FormSubmissionRound
          round={round}
          onComplete={onComplete}
          candidateInfo={candidateInfo}
          isDarkMode={isDarkMode}
        />
      );
    
    case 'system_design':
      // Redirect to standalone System Design app (like PCB)
      useEffect(() => {
        const queryParams = new URLSearchParams({
          interviewId: interviewId || '',
          roundId: round.roundId || round._id || '',
          duration: round.duration || '30',
          candidateId: candidateInfo?.id || '',
          candidateName: candidateInfo?.name || '',
          candidateEmail: candidateInfo?.email || ''
        });
        
        // Create access link for system design round
        const systemDesignAccessLink = accessLink || `${interviewId}-${round.roundNumber}-system-design`;
        const redirectUrl = `/system-design-round/${systemDesignAccessLink}?${queryParams.toString()}`;
        
        console.log('🎨 [SYSTEM DESIGN] Redirecting to standalone app:', redirectUrl);
        window.location.href = redirectUrl;
      }, []);
      
      return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 mx-auto mb-6"></div>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Loading System Design Tool...
            </p>
          </div>
        </div>
      );
    
    case 'file_upload':
      // You can add FileUploadRound component here
      return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="text-center">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                File Upload Round
              </h2>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                File upload functionality will be implemented here.
              </p>
            </div>
          </div>
        </div>
      );
    
    case 'interview':
    default:
      // You can add InterviewRound component here
      return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="text-center">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Interview Round
              </h2>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Interview questions functionality will be implemented here.
              </p>
            </div>
          </div>
        </div>
      );
  }
};

export default InterviewRoundRouter;
