import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Award, 
  Target, 
  BarChart3, 
  UserCheck, 
  Star,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/apiService';

const InterviewPerformanceDashboard = ({ interviewId, onClose }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCandidate, setExpandedCandidate] = useState(null);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getInterviewPerformance(interviewId);
      
      if (response.success) {
        setPerformanceData(response.data);
      } else {
        setError(response.error || 'Failed to fetch performance data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Performance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const getScoreColor = (score) => {
    if (score >= 3.5) return 'text-green-600 bg-green-100';
    if (score >= 2.5) return 'text-blue-600 bg-blue-100';
    if (score >= 1.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 3.5) return 'Excellent';
    if (score >= 2.5) return 'Good';
    if (score >= 1.5) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex items-center space-x-3">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg">Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <span className="text-lg font-medium">Error</span>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={fetchPerformanceData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  const { interview, analytics, candidateSummaries, rounds } = performanceData;
  
  // Safety checks for data structure
  if (!analytics || !analytics.overview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <span className="text-lg font-medium">Data Error</span>
          </div>
          <p className="text-gray-600 mb-6">Invalid performance data received from server.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Interview Performance Dashboard</h1>
              <h2 className="text-lg opacity-90">{interview.title}</h2>
              <p className="text-sm opacity-75">{interview.jobTitle} • {interview.jobLevel}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalCandidates}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Interviews</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.overview.completedInterviews}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{(analytics.overview.averageScore || 0).toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{(analytics.overview.completionRate || 0).toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Score Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.scoreDistribution?.excellent || 0}</div>
                <div className="text-sm text-gray-600">Excellent (3.5+)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.scoreDistribution?.good || 0}</div>
                <div className="text-sm text-gray-600">Good (2.5-3.4)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{analytics.scoreDistribution?.satisfactory || 0}</div>
                <div className="text-sm text-gray-600">Satisfactory (1.5-2.4)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.scoreDistribution?.needsImprovement || 0}</div>
                <div className="text-sm text-gray-600">Needs Improvement</div>
              </div>
            </div>
          </div>

          {/* Round Analytics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Round Performance
            </h3>
            <div className="space-y-4">
              {(analytics.roundAnalytics || []).map((round) => (
                <div key={round.roundId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">Round {round.roundNumber}: {round.title}</h4>
                      <p className="text-sm text-gray-600">{round.questionCount} questions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{(round.averageScore || 0).toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Avg Score</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{round.totalAnswers} answers</span>
                    <span>{(round.completionRate || 0).toFixed(1)}% completion</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Analytics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Time Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatTime(analytics.timeAnalytics?.averageTimePerQuestion || 0)}</div>
                <div className="text-sm text-gray-600">Average Time per Question</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatTime(analytics.timeAnalytics?.fastestAnswer || 0)}</div>
                <div className="text-sm text-gray-600">Fastest Answer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatTime(analytics.timeAnalytics?.slowestAnswer || 0)}</div>
                <div className="text-sm text-gray-600">Slowest Answer</div>
              </div>
            </div>
          </div>

          {/* Candidate Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Candidate Performance
            </h3>
            <div className="space-y-4">
              {(candidateSummaries || []).map((candidate) => (
                <div key={candidate.candidateId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{candidate.candidateName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.averageScore)}`}>
                          {getScoreLabel(candidate.averageScore)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {candidate.candidateEmail}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(candidate.lastActivity).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <span>Score: <span className="font-medium">{(candidate.averageScore || 0).toFixed(1)}/4.0</span></span>
                        <span>Answers: <span className="font-medium">{candidate.totalAnswers}</span></span>
                        <span>Rounds: <span className="font-medium">{candidate.completionRate}/{rounds.length}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedCandidate(expandedCandidate === candidate.candidateId ? null : candidate.candidateId)}
                      className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedCandidate === candidate.candidateId ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {expandedCandidate === candidate.candidateId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Strengths */}
                      {candidate.strengths.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-green-700 mb-2 flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            Strengths
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {candidate.strengths.map((strength, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {candidate.improvements.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-orange-700 mb-2 flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            Areas for Improvement
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {candidate.improvements.map((improvement, index) => (
                              <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                {improvement}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Answers */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Detailed Answers</h5>
                        <div className="space-y-3">
                          {(candidate.answers || []).map((answer, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-gray-900 text-sm">{answer.question}</h6>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(answer.score)}`}>
                                    {(answer.score || 0).toFixed(1)}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatTime(answer.timeTaken)}</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{answer.answer}</p>
                              {answer.feedback && (
                                <p className="text-xs text-gray-600 italic">"{answer.feedback}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPerformanceDashboard;
