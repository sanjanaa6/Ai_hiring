import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/apiService';
import {
  Users,
  Trophy,
  TrendingUp,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Play,
  Code,
  FileText,
  CheckCircle,
  Award,
  XCircle,
  BarChart3,
  MessageSquare,
  Target,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

// Simple chart components (you can replace with Chart.js or Recharts later)
const CustomBarChart = ({ data, title, color = '#3b82f6', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="flex items-end justify-between h-48 px-4 border-b border-l">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full rounded-t transition-all duration-500 hover:opacity-80"
              style={{ 
                height: `${(item.value / maxValue) * 180}px`,
                backgroundColor: color,
                minHeight: '4px'
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs mt-2 text-center transform -rotate-45 origin-top-left">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomPieChart = ({ data, title, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = cumulativePercentage * 3.6;
            const endAngle = (cumulativePercentage + percentage) * 3.6;
            cumulativePercentage += percentage;

            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = percentage > 50 ? 1 : 0;

            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="0.5"
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span>{item.label}</span>
            </div>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const InterviewAnalyticsDashboard = ({ interviewId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedSections, setExpandedSections] = useState({
    communication: true,
    performance: true,
    trends: true,
    comparison: true
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/interviews/${interviewId}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, selectedTimeframe]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Communication Skills Analysis
  const communicationAnalysis = useMemo(() => {
    if (!analytics?.candidates) return null;

    const communicationScores = analytics.candidates.map(candidate => {
      // Extract communication-related scores from AI evaluation
      const communicationScore = candidate.answers?.reduce((sum, answer) => {
        const feedback = answer.aiEvaluation?.feedback || '';
        const score = answer.aiEvaluation?.score || 0;
        
        // Analyze communication keywords in feedback
        const communicationKeywords = [
          'clear', 'articulate', 'confident', 'professional', 'concise',
          'detailed', 'well-structured', 'logical', 'persuasive', 'engaging'
        ];
        
        const keywordCount = communicationKeywords.filter(keyword => 
          feedback.toLowerCase().includes(keyword)
        ).length;
        
        return sum + (score * 0.7 + keywordCount * 0.3);
      }, 0) / (candidate.answers?.length || 1);

      return {
        ...candidate,
        communicationScore: Math.round(communicationScore * 100) / 100
      };
    });

    const excellent = communicationScores.filter(c => c.communicationScore >= 3.5).length;
    const good = communicationScores.filter(c => c.communicationScore >= 2.5 && c.communicationScore < 3.5).length;
    const average = communicationScores.filter(c => c.communicationScore >= 1.5 && c.communicationScore < 2.5).length;
    const poor = communicationScores.filter(c => c.communicationScore < 1.5).length;

    return {
      scores: communicationScores,
      distribution: [
        { label: 'Excellent (3.5+)', value: excellent, color: '#10b981' },
        { label: 'Good (2.5-3.4)', value: good, color: '#3b82f6' },
        { label: 'Average (1.5-2.4)', value: average, color: '#f59e0b' },
        { label: 'Poor (<1.5)', value: poor, color: '#ef4444' }
      ],
      averageScore: communicationScores.reduce((sum, c) => sum + c.communicationScore, 0) / communicationScores.length,
      topPerformers: communicationScores
        .sort((a, b) => b.communicationScore - a.communicationScore)
        .slice(0, 5)
    };
  }, [analytics]);

  // Performance Trends
  const performanceTrends = useMemo(() => {
    if (!analytics?.candidates) return null;

    const trends = analytics.candidates.map(candidate => ({
      name: candidate.candidateName,
      score: candidate.averageScore,
      communication: candidate.communicationScore || 0,
      completion: candidate.completionPercentage,
      timeSpent: candidate.totalTimeSpent
    }));

    return {
      scoreDistribution: [
        { label: '90-100%', value: trends.filter(t => t.score >= 3.5).length },
        { label: '80-89%', value: trends.filter(t => t.score >= 3.0 && t.score < 3.5).length },
        { label: '70-79%', value: trends.filter(t => t.score >= 2.5 && t.score < 3.0).length },
        { label: '60-69%', value: trends.filter(t => t.score >= 2.0 && t.score < 2.5).length },
        { label: '<60%', value: trends.filter(t => t.score < 2.0).length }
      ],
      completionRates: [
        { label: '100%', value: trends.filter(t => t.completion === 100).length },
        { label: '80-99%', value: trends.filter(t => t.completion >= 80 && t.completion < 100).length },
        { label: '60-79%', value: trends.filter(t => t.completion >= 60 && t.completion < 80).length },
        { label: '40-59%', value: trends.filter(t => t.completion >= 40 && t.completion < 60).length },
        { label: '<40%', value: trends.filter(t => t.completion < 40).length }
      ]
    };
  }, [analytics]);

  // Candidate Comparison Data
  const comparisonData = useMemo(() => {
    if (!analytics?.candidates) return null;

    return analytics.candidates
      .map(candidate => ({
        name: candidate.candidateName,
        email: candidate.candidateEmail,
        score: candidate.averageScore,
        communication: candidate.communicationScore || 0,
        completion: candidate.completionPercentage,
        timeSpent: candidate.totalTimeSpent,
        answers: candidate.totalAnswers,
        status: candidate.status
      }))
      .sort((a, b) => {
        if (sortBy === 'score') return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
        if (sortBy === 'communication') return sortOrder === 'desc' ? b.communication - a.communication : a.communication - b.communication;
        if (sortBy === 'completion') return sortOrder === 'desc' ? b.completion - a.completion : a.completion - b.completion;
        return 0;
      });
  }, [analytics, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Analytics Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No interview data available for analytics.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Interview Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {analytics.interview?.title} - {analytics.overview?.totalCandidates} candidates
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={() => {/* Export functionality */}}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'communication', label: 'Communication', icon: MessageSquare },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'comparison', label: 'Comparison', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          <AnimatePresence mode="wait">
            {selectedTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Candidates</p>
                        <p className="text-3xl font-bold">{analytics.overview?.totalCandidates || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Average Score</p>
                        <p className="text-3xl font-bold">
                          {analytics.overview?.averageScore ? Math.round(analytics.overview.averageScore * 100) / 100 : 0}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Completion Rate</p>
                        <p className="text-3xl font-bold">
                          {analytics.overview?.completionRate ? Math.round(analytics.overview.completionRate) : 0}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Avg. Time</p>
                        <p className="text-3xl font-bold">
                          {analytics.overview?.averageTimeSpent ? Math.round(analytics.overview.averageTimeSpent / 60) : 0}m
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-200" />
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
                    <CustomBarChart
                      data={performanceTrends?.scoreDistribution || []}
                      title="Score Distribution"
                      color="#3b82f6"
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
                    <CustomPieChart
                      data={performanceTrends?.completionRates || []}
                      title="Completion Rates"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'communication' && (
              <motion.div
                key="communication"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Communication Overview */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Communication Skills Analysis
                    </h2>
                    <button
                      onClick={() => toggleSection('communication')}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {expandedSections.communication ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {expandedSections.communication && (
                    <div className="space-y-6">
                      {/* Communication Distribution */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <CustomPieChart
                            data={communicationAnalysis?.distribution || []}
                            title="Communication Skills Distribution"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">
                              {communicationAnalysis?.averageScore ? Math.round(communicationAnalysis.averageScore * 100) / 100 : 0}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">Average Communication Score</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Excellent Communicators</span>
                              <span className="font-semibold text-green-600">
                                {communicationAnalysis?.distribution?.find(d => d.label.includes('Excellent'))?.value || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Good Communicators</span>
                              <span className="font-semibold text-blue-600">
                                {communicationAnalysis?.distribution?.find(d => d.label.includes('Good'))?.value || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Average Communicators</span>
                              <span className="font-semibold text-yellow-600">
                                {communicationAnalysis?.distribution?.find(d => d.label.includes('Average'))?.value || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Poor Communicators</span>
                              <span className="font-semibold text-red-600">
                                {communicationAnalysis?.distribution?.find(d => d.label.includes('Poor'))?.value || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Communicators */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Top Communicators
                        </h3>
                        <div className="space-y-3">
                          {communicationAnalysis?.topPerformers?.map((candidate, index) => (
                            <div key={candidate.candidateId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full font-semibold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">{candidate.candidateName}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.candidateEmail}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-blue-600">
                                  {candidate.communicationScore}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Communication Score</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedTab === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                    Performance Trends
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CustomBarChart
                      data={performanceTrends?.scoreDistribution || []}
                      title="Score Distribution"
                      color="#10b981"
                    />
                    <CustomBarChart
                      data={performanceTrends?.completionRates || []}
                      title="Completion Rates"
                      color="#f59e0b"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'comparison' && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Candidate Comparison
                    </h2>
                    <div className="flex items-center space-x-4">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="score">Overall Score</option>
                        <option value="communication">Communication</option>
                        <option value="completion">Completion</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Rank</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Candidate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Overall Score</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Communication</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Completion</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Time Spent</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData?.map((candidate, index) => (
                          <tr key={candidate.email} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full font-semibold">
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{candidate.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {Math.round(candidate.score * 100) / 100}
                                </span>
                                <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(candidate.score / 4) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {Math.round(candidate.communication * 100) / 100}
                                </span>
                                <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${(candidate.communication / 4) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {Math.round(candidate.completion)}%
                                </span>
                                <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${candidate.completion}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {Math.round(candidate.timeSpent / 60)}m
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                candidate.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : candidate.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {candidate.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InterviewAnalyticsDashboard;
