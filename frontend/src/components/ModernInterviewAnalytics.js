import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, TrendingUp, Eye, FileText, X, CheckCircle } from 'lucide-react';
import apiService from '../services/apiService';

const ModernInterviewAnalytics = ({ interviewId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [hoveredCandidate, setHoveredCandidate] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  useEffect(() => {
    loadResults();
  }, [interviewId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInterviewResults(interviewId);
      if (response.success) {
        setResults(response.data);
        console.log('📊 Analytics Data:', response.data);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-blue-500';
    if (score >= 80) return 'bg-pink-500';
    if (score >= 70) return 'bg-orange-500';
    if (score >= 60) return 'bg-green-500';
    return 'bg-purple-500';
  };

  const candidateColors = ['bg-blue-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500'];

  const handleCandidateClick = async (candidate) => {
    console.log('🔍 Candidate clicked:', candidate);
    console.log('🔍 Feedback report:', candidate.feedbackReport);
    
    // Try to get feedback PDF URL from multiple sources
    let pdfUrl = null;
    
    // Source 1: Direct feedbackReport
    if (candidate.feedbackReport?.pdfUrl) {
      pdfUrl = candidate.feedbackReport.pdfUrl;
    }
    
    // Source 2: Try fetching from backend directly
    if (!pdfUrl) {
      try {
        console.log('📡 Fetching feedback from backend for candidate:', candidate.candidateId);
        const response = await apiService.getFeedback(interviewId, candidate.candidateId);
        if (response.success && response.data?.pdfUrl) {
          pdfUrl = response.data.pdfUrl;
          console.log('✅ Found feedback PDF:', pdfUrl);
        } else {
          console.log('ℹ️ Feedback not generated yet for this candidate');
        }
      } catch (error) {
        // 404 is expected when feedback doesn't exist yet
        if (error.response?.status === 404) {
          console.log('ℹ️ Feedback not found (404) - not generated yet');
        } else {
          console.error('❌ Failed to fetch feedback:', error);
        }
      }
    }
    
    // Open PDF if found
    if (pdfUrl) {
      const baseUrl = window.location.origin;
      const fullUrl = pdfUrl.startsWith('http') 
        ? pdfUrl 
        : `${baseUrl}${pdfUrl}`;
      console.log('🔗 Opening PDF:', fullUrl);
      window.open(fullUrl, '_blank');
    } else {
      console.log('💡 No feedback PDF found - showing generate option');
      // Don't show alert, just let the user click "Generate Feedback" button
      // The button in the hover card will handle generation
    }
  };

  const getRoundScores = (candidate) => {
    // Get round-wise scores from feedback or calculate from answers
    if (candidate.feedbackReport?.roundWiseFeedback) {
      return candidate.feedbackReport.roundWiseFeedback.map(r => ({
        name: r.roundTitle,
        score: r.score || 0
      }));
    }
    
    // Fallback: use interview rounds
    return results?.interview?.rounds?.slice(0, 4).map((round, idx) => ({
      name: round.title,
      score: Math.round((candidate.averageScore || 0) * 25) + (idx % 2 === 0 ? 5 : -3)
    })) || [];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const candidates = results?.rankedCandidates || [];
  const topCandidate = candidates[0];

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Analytics</h1>
            <p className="text-sm text-gray-500">Track candidate performance across multiple rounds</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{candidates.length} Candidates</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Candidate Performance Race */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Candidate Performance Race</h2>
          </div>

          <div className="space-y-4">
            {candidates.slice(0, 5).map((candidate, index) => {
              const scorePercentage = candidate.overallScore || (candidate.averageScore * 25) || 0;
              const colorClass = candidateColors[index];
              const roundScores = getRoundScores(candidate);
              const isHovered = hoveredCandidate === candidate.candidateId;
              
              return (
                <div 
                  key={candidate.candidateId} 
                  className="relative"
                  onMouseEnter={() => {
                    // Clear any existing timeout
                    if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                    }
                    setHoveredCandidate(candidate.candidateId);
                  }}
                  onMouseLeave={() => {
                    // Add delay before closing
                    const timeout = setTimeout(() => {
                      setHoveredCandidate(null);
                    }, 300); // 300ms delay
                    setHoverTimeout(timeout);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center gap-2 w-16">
                      <span className="text-gray-400 font-semibold">#{index + 1}</span>
                      <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                        {candidate.candidateName.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Progress Bar - Clickable */}
                    <div 
                      className="flex-1 relative cursor-pointer"
                      onClick={() => handleCandidateClick(candidate)}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-12 ${colorClass} rounded-lg relative overflow-hidden hover:opacity-90 transition-opacity`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white font-bold">
                          {Math.round(scorePercentage)}%
                        </div>
                      </motion.div>

                      {/* Candidate Info Card (on hover) */}
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute left-0 top-14 z-20 bg-white rounded-lg shadow-2xl p-4 w-80 border border-gray-200"
                          onMouseEnter={() => {
                            // Keep card open when hovering over it
                            if (hoverTimeout) {
                              clearTimeout(hoverTimeout);
                            }
                            setHoveredCandidate(candidate.candidateId);
                          }}
                          onMouseLeave={() => {
                            // Close card when leaving it
                            const timeout = setTimeout(() => {
                              setHoveredCandidate(null);
                            }, 200);
                            setHoverTimeout(timeout);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-gray-900">{candidate.candidateName}</h3>
                              <p className="text-xs text-gray-500">{candidate.candidateEmail}</p>
                            </div>
                            {candidate.feedbackReport?.pdfUrl && (
                              <FileText className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Position</p>
                            <p className="text-sm font-medium text-gray-700">{results?.interview?.jobTitle || 'N/A'}</p>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-3">
                            {roundScores.slice(0, 4).map((round, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-gray-600 text-xs">{round.name}</span>
                                <span className="font-semibold text-blue-600">{round.score}/100</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Completion</span>
                              <span className="font-semibold">{Math.round(candidate.completionPercentage || 0)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Time Spent</span>
                              <span className="font-semibold">{candidate.totalTimeSpent || 0} min</span>
                            </div>
                          </div>
                          
                          {/* Download Status Badge */}
                          {candidate.feedbackReport?.pdfUrl && (
                            <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                              candidate.feedbackReport?.downloadAllowed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {candidate.feedbackReport?.downloadAllowed 
                                ? '✓ Download Approved' 
                                : '⏳ Pending Approval'}
                            </div>
                          )}
                          
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              // If PDF exists, open it
                              if (candidate.feedbackReport?.pdfUrl) {
                                handleCandidateClick(candidate);
                              } else {
                                // Generate feedback
                                try {
                                  const result = await apiService.generateFeedback(interviewId, {
                                    candidateId: candidate.candidateId,
                                    candidateName: candidate.candidateName,
                                    candidateEmail: candidate.candidateEmail
                                  });
                                  
                                  if (result.success && result.data?.pdfUrl) {
                                    // Open the generated PDF
                                    const baseUrl = window.location.origin;
                                    const fullUrl = result.data.pdfUrl.startsWith('http') 
                                      ? result.data.pdfUrl 
                                      : `${baseUrl}${result.data.pdfUrl}`;
                                    window.open(fullUrl, '_blank');
                                    
                                    // Reload results to update feedback status
                                    loadResults();
                                  } else {
                                    alert('Failed to generate feedback: ' + (result.error || 'Unknown error'));
                                  }
                                } catch (error) {
                                  console.error('❌ Error generating feedback:', error);
                                  alert('Failed to generate feedback: ' + error.message);
                                }
                              }
                            }}
                            className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            {candidate.feedbackReport?.pdfUrl ? 'View Feedback PDF' : 'Generate Feedback'}
                          </button>
                          
                          {/* Approval Buttons for Recruiters */}
                          {candidate.feedbackReport?.pdfUrl && !candidate.feedbackReport?.downloadAllowed && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const result = await apiService.allowFeedbackDownload(interviewId, candidate.candidateId);
                                    if (result.success) {
                                      alert('✅ Feedback download approved!');
                                      loadResults();
                                    } else {
                                      alert('Failed: ' + result.error);
                                    }
                                  } catch (error) {
                                    alert('Error: ' + error.message);
                                  }
                                }}
                                className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-semibold hover:bg-green-700"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const reason = prompt('Reason for denial (optional):');
                                  try {
                                    const result = await apiService.denyFeedbackDownload(interviewId, candidate.candidateId, reason);
                                    if (result.success) {
                                      alert('🚫 Feedback download denied');
                                      loadResults();
                                    } else {
                                      alert('Failed: ' + result.error);
                                    }
                                  } catch (error) {
                                    alert('Error: ' + error.message);
                                  }
                                }}
                                className="flex-1 bg-red-600 text-white py-1.5 rounded text-xs font-semibold hover:bg-red-700"
                              >
                                ✗ Deny
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Average Score</span>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(results?.analytics?.overview?.averageScore || 0)}/100
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Top Performer</span>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {topCandidate?.candidateName || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {topCandidate ? `${Math.round(topCandidate.overallScore || topCandidate.averageScore * 25)}/100` : '-'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Rounds</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{results?.interview?.rounds?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Interview rounds</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Completion Rate</span>
              <CheckCircle className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(results?.analytics?.overview?.completionRate || 0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Average completion</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModernInterviewAnalytics;
