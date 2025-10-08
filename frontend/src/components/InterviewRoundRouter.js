import React from 'react';
import FormSubmissionRound from './FormSubmissionRound';

const InterviewRoundRouter = ({ round, onComplete, candidateInfo, isDarkMode }) => {
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
