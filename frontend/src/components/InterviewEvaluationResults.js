import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Brain, 
  Users, 
  Target,
  Clock,
  BarChart3,
  Star,
  ArrowRight,
  User,
  Mail,
  Calendar
} from 'lucide-react';

const InterviewEvaluationResults = ({ evaluation, candidateInfo, interviewData }) => {
  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluation Not Available</h2>
          <p className="text-gray-600">The interview evaluation is still being processed.</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getOverallScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation?.toLowerCase()) {
      case 'hire': return 'text-green-600 bg-green-100';
      case 'maybe': return 'text-yellow-600 bg-yellow-100';
      case 'no hire': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const scoreCategories = [
    { key: 'technical', label: 'Technical Skills', icon: Brain, description: 'Technical knowledge and expertise' },
    { key: 'communication', label: 'Communication', icon: MessageSquare, description: 'Clarity and articulation' },
    { key: 'problemSolving', label: 'Problem Solving', icon: Target, description: 'Analytical and creative thinking' },
    { key: 'engagement', label: 'Engagement', icon: TrendingUp, description: 'Motivation and enthusiasm' },
    { key: 'culturalFit', label: 'Cultural Fit', icon: Users, description: 'Team compatibility' },
    { key: 'responseQuality', label: 'Response Quality', icon: Star, description: 'Answer completeness and relevance' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {interviewData?.title || 'Interview'} Completed!
                </h1>
                <p className="text-gray-600">Great job! Here's your performance evaluation for this round.</p>
              </div>
            </div>
            
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getOverallScoreColor(evaluation.overallScore)}`}>
                {evaluation.overallScore}%
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
              <div className="text-xs text-gray-400 mt-1">
                {evaluation.overallScore >= 80 ? 'Proceed to next round' : 
                 evaluation.overallScore >= 60 ? 'Consider for next round' : 
                 'Review required'}
              </div>
            </div>
          </div>

          {/* Candidate Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Candidate: {candidateInfo?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{candidateInfo?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation and Confidence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(evaluation.recommendation)}`}>
                {evaluation.recommendation || 'Pending'}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(evaluation.confidenceLevel)}`}>
                {evaluation.confidenceLevel || 'Medium'} Confidence
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Next Steps: {evaluation.nextSteps || 'Review and decide'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Scores */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Detailed Performance Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoreCategories.map((category) => {
                  const Icon = category.icon;
                  const score = evaluation.scores?.[category.key] || 0;
                  return (
                    <div key={category.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{category.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreColor(score)}`}>
                          {score}/10
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{category.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            score >= 8 ? 'bg-green-500' : 
                            score >= 6 ? 'bg-yellow-500' : 
                            score >= 4 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(score / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Feedback */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Detailed Feedback
              </h2>
              <div className="space-y-4">
                {scoreCategories.map((category) => {
                  const feedback = evaluation.detailedFeedback?.[category.key];
                  if (!feedback) return null;
                  
                  return (
                    <div key={category.key} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{category.label}</h3>
                      <p className="text-gray-700 text-sm">{feedback}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Strengths */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Strengths
              </h2>
              <div className="space-y-2">
                {evaluation.strengths?.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No specific strengths identified.</p>
                )}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Areas for Improvement
              </h2>
              <div className="space-y-2">
                {evaluation.areasForImprovement?.map((area, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{area}</span>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No specific areas for improvement identified.</p>
                )}
              </div>
            </div>

            {/* Participation Metrics */}
            {evaluation.participationMetrics && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Participation Metrics
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Questions Answered</span>
                    <span className="font-semibold">{evaluation.participationMetrics.questionsAnswered}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Participation Rate</span>
                    <span className="font-semibold">{evaluation.participationMetrics.participationRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completeness Rate</span>
                    <span className="font-semibold">{evaluation.participationMetrics.completenessRate}%</span>
                  </div>
                  {evaluation.participationMetrics.avgResponseTime > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Response Time</span>
                      <span className="font-semibold">{evaluation.participationMetrics.avgResponseTime}s</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interviewer Notes */}
            {evaluation.interviewerNotes && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                  Interviewer Notes
                </h2>
                <p className="text-sm text-gray-700">{evaluation.interviewerNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2 mx-auto">
            <span>Continue to Next Round</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewEvaluationResults;
