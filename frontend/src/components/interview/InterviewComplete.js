import React, { useState } from 'react';
import { CheckCircle, Trophy, Clock, Users, Award, Download, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';

const InterviewComplete = ({ 
  interviewData, 
  interviewId: interviewIdProp,
  userProgress, 
  completedRounds, 
  allRounds,
  onRestartInterview,
  onRetakeRound
}) => {
  const { isDarkMode } = useTheme();
  const interviewId = interviewIdProp || interviewData?.interviewId || interviewData?.interview?.interviewId;
  
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [feedbackGenerated, setFeedbackGenerated] = useState(false);
  const [feedbackPdfUrl, setFeedbackPdfUrl] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);

  // Debug logging
  console.log('🎉 InterviewComplete component rendered');
  console.log('📊 Interview ID:', interviewId);
  console.log('📊 All Rounds:', allRounds);
  console.log('📊 Completed Rounds:', completedRounds);
  console.log('📊 User Progress:', userProgress);

  const getCompletionStats = () => {
    const totalRounds = allRounds.length;
    const completedCount = completedRounds.size;
    const completionPercentage = totalRounds > 0 ? Math.round((completedCount / totalRounds) * 100) : 0;
    
    return {
      totalRounds,
      completedCount,
      completionPercentage
    };
  };

  const getTotalTimeSpent = () => {
    if (!userProgress?.rounds) return 0;
    
    return userProgress.rounds.reduce((total, round) => {
      return total + (round.timeSpent || 0);
    }, 0);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = getCompletionStats();
  const totalTime = getTotalTimeSpent();

  const handleGenerateFeedback = async () => {
    try {
      setGeneratingFeedback(true);
      setFeedbackError(null);

      // Get candidate info from userProgress or localStorage
      const candidateId = userProgress?.candidateId || localStorage.getItem('candidateId') || `anon_${Date.now()}`;
      const candidateName = userProgress?.candidateName || localStorage.getItem('candidateName') || 'Anonymous Candidate';
      const candidateEmail = userProgress?.candidateEmail || localStorage.getItem('candidateEmail') || 'anonymous@example.com';

      console.log('🎯 Generating feedback for:', { candidateId, candidateName, candidateEmail });

      const result = await apiService.generateFeedback(interviewId, {
        candidateId,
        candidateName,
        candidateEmail
      });

      if (result.success) {
        setFeedbackGenerated(true);
        setFeedbackPdfUrl(result.data.pdfUrl);
        console.log('✅ Feedback generated successfully:', result.data.pdfUrl);
      } else {
        setFeedbackError(result.error || 'Failed to generate feedback');
        console.error('❌ Feedback generation failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      setFeedbackError(error.message || 'Failed to generate feedback');
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const handleDownloadFeedback = () => {
    if (feedbackPdfUrl) {
      const baseUrl = apiService.client.defaults.baseURL.replace('/api', '');
      const fullUrl = `${baseUrl}${feedbackPdfUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <div className={`min-h-screen p-4 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      <div className={`max-w-4xl w-full mx-auto my-8 ${
        isDarkMode 
          ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
          : 'bg-white/80 backdrop-blur-md border border-gray-200'
      } rounded-2xl shadow-2xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`p-8 text-center border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className={`text-4xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Interview Complete!
          </h1>
          <p className={`text-xl ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Congratulations on completing your AI interview
          </p>
        </div>

        <div className="p-8">
          
          {/* Feedback Section - PROMINENTLY PLACED AT TOP */}
          {console.log('✅ Rendering Feedback Section')}
          <div 
            className={`mb-8 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500' 
                : 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-500'
            } rounded-2xl p-6`}
            style={{ minHeight: '200px' }}
          >
            <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-purple-300' : 'text-purple-700'
            }`}>
              <FileText className="w-8 h-8" />
              🎯 Performance Feedback
            </h3>
            <p className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Get AI-generated feedback on your interview performance. Download a detailed PDF report with insights and recommendations.
            </p>
            
            {feedbackError && (
              <div className={`mb-4 p-4 rounded-lg ${
                isDarkMode ? 'bg-red-900/30 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {feedbackError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {!feedbackGenerated ? (
                <button
                  onClick={handleGenerateFeedback}
                  disabled={generatingFeedback}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all transform flex items-center justify-center gap-2 ${
                    generatingFeedback
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {generatingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating Feedback...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate Feedback
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownloadFeedback}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all transform flex items-center justify-center gap-2 ${
                    isDarkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  Download Feedback PDF
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            
            {/* Completion Rate */}
            <div className={`p-6 rounded-2xl text-center ${
              isDarkMode 
                ? 'bg-blue-500/20 border border-blue-500/30' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.completionPercentage}%
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Completion Rate
              </p>
            </div>

            {/* Rounds Completed */}
            <div className={`p-6 rounded-2xl text-center ${
              isDarkMode 
                ? 'bg-green-500/20 border border-green-500/30' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.completedCount}/{stats.totalRounds}
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Rounds Completed
              </p>
            </div>

            {/* Time Spent */}
            <div className={`p-6 rounded-2xl text-center ${
              isDarkMode 
                ? 'bg-purple-500/20 border border-purple-500/30' 
                : 'bg-purple-50 border border-purple-200'
            }`}>
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatTime(totalTime)}
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Time
              </p>
            </div>
          </div>

          {/* Round Details */}
          {allRounds.length > 0 && (
            <div className={`mb-8 ${
              isDarkMode 
                ? 'bg-slate-700/30 border border-white/10' 
                : 'bg-gray-50 border border-gray-200'
            } rounded-2xl p-6`}>
              <h3 className={`text-xl font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Round Summary
              </h3>
              <div className="space-y-3">
                {allRounds.map((round, index) => {
                  const isCompleted = completedRounds.has(round._id || round.id);
                  const progressRound = userProgress?.rounds?.find(r => r.roundId === (round._id || round.id));
                  
                  return (
                    <div key={round._id || round.id} className={`flex items-center justify-between p-4 rounded-lg ${
                      isCompleted
                        ? isDarkMode
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-green-50 border border-green-200'
                        : isDarkMode
                          ? 'bg-slate-600/30 border border-slate-500/30'
                          : 'bg-gray-100 border border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {round.title || `Round ${index + 1}`}
                          </h4>
                          {progressRound?.timeSpent && (
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              Completed in {formatTime(progressRound.timeSpent)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isCompleted
                          ? isDarkMode
                            ? 'bg-green-500/30 text-green-400'
                            : 'bg-green-100 text-green-700'
                          : isDarkMode
                            ? 'bg-gray-500/30 text-gray-400'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? 'Completed' : 'Not Started'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className={`mb-8 ${
            isDarkMode 
              ? 'bg-blue-500/20 border border-blue-500/30' 
              : 'bg-blue-50 border border-blue-200'
          } rounded-2xl p-6`}>
            <h3 className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              What's Next?
            </h3>
            <div className="space-y-3">
              <div className={`flex items-start space-x-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Your responses have been recorded and will be evaluated by our AI system</p>
              </div>
              <div className={`flex items-start space-x-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>You will receive feedback and results within 24-48 hours</p>
              </div>
              <div className={`flex items-start space-x-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Check your email for updates on the next steps in the hiring process</p>
              </div>
            </div>
          </div>

          {/* Retake Options */}
          {allRounds.some(round => round.allowRetake) && (
            <div className={`mt-8 p-6 rounded-2xl ${
              isDarkMode 
                ? 'bg-gray-800/50 border border-gray-700' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                🔄 Retake Options
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                You can retake the following rounds:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allRounds
                  .filter(round => round.allowRetake)
                  .map((round, index) => (
                    <button
                      key={round.roundId}
                      onClick={() => onRetakeRound && onRetakeRound(round)}
                      className={`p-4 rounded-lg text-left transition-all transform hover:scale-105 ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                          : 'bg-white hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {round.title}
                          </h4>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {round.type === 'form_submission' ? '📝 Form Submission' : 
                             round.type === 'file_upload' ? '📁 File Upload' : '💬 Interview'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDarkMode 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Retake
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={() => window.close()}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all transform ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              Close Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewComplete;
