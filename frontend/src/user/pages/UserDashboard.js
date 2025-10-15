import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../../services/apiService';
import { 
  Link as LinkIcon, 
  AlertCircle,
  User,
  Calendar,
  Search,
  FileText,
  Home,
  Clock,
  CheckCircle,
  Play,
  Award,
  BookOpen,
  Target,
  ArrowRight,
  RefreshCw,
  Settings,
  Activity,
  Clock3,
  Trophy,
  Eye,
  TrendingUp,
  Zap,
  LogOut
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [interviewLink, setInterviewLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState(null);

  // Check if there's an interview link in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const link = urlParams.get('link');
    if (link) {
      setInterviewLink(link);
    }
  }, []);

  // Fetch user progress
  useEffect(() => {
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    try {
      const result = await apiService.getUserProgress();
      
      if (result.success) {
        setProgress(result.data);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleJoinInterview = () => {
    if (!interviewLink.trim()) {
      setError('Please enter a valid interview link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = new URL(interviewLink);
      const pathname = url.pathname;
      const pathParts = pathname.split('/');
      const last = pathParts[pathParts.length - 1];

      // Support multiple link types
      if (pathname.startsWith('/interview/')) {
        navigate(`${pathname}${url.search}`);
      } else if (pathname.startsWith('/round/')) {
        navigate(`${pathname}${url.search}`);
      } else if (pathname.startsWith('/pcb-round/')) {
        navigate(`${pathname}${url.search}`);
      } else if (last && (last.startsWith('interview_') || last.startsWith('electronics_interview_'))) {
        navigate(`/interview/${last}`);
      } else {
        setError('Invalid interview link format');
      }
    } catch (error) {
      setError('Invalid interview link');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'started':
        return 'text-yellow-600 bg-yellow-100';
      case 'abandoned':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Play className="w-4 h-4" />;
      case 'started':
        return <Clock className="w-4 h-4" />;
      case 'abandoned':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgressPercentage = (interview) => {
    if (interview.progress.totalQuestions === 0) return 0;
    return Math.round((interview.progress.answeredQuestions / interview.progress.totalQuestions) * 100);
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'interviews', label: 'My Interviews', icon: BookOpen },
    { id: 'join-interview', label: 'Join Interview', icon: LinkIcon },
    { id: 'browse-jobs', label: 'Browse Jobs', icon: Search },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'interviews':
        return renderInterviews();
      case 'join-interview':
        return renderJoinInterview();
      case 'browse-jobs':
        return renderBrowseJobs();
      case 'applications':
        return renderApplications();
      case 'profile':
        return renderProfile();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  // Overview tab content
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Welcome Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500'}`}></div>
        <div className="relative p-8">
        <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                  Candidate Portal
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name}! 👋
            </h1>
              <p className="text-white/90 text-lg">
                Your interview journey continues here
            </p>
          </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-white/80 text-sm">Total Score</div>
                <div className="text-3xl font-bold text-white">
                  {progress?.totalInterviews > 0 
                    ? Math.round((progress.completedInterviews / progress.totalInterviews) * 100)
                    : 0}%
                </div>
              </div>
              <Trophy className="w-16 h-16 text-yellow-300 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`group relative overflow-hidden rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${isDarkMode ? 'border-blue-500/20' : 'border-blue-100'} hover:border-blue-500 transition-all`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
              <TrendingUp className="w-5 h-5 text-blue-500 opacity-50" />
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Interviews
          </p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {progress?.totalInterviews || 0}
          </p>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${isDarkMode ? 'border-green-500/20' : 'border-green-100'} hover:border-green-500 transition-all`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
              <Trophy className="w-5 h-5 text-green-500 opacity-50" />
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Completed
          </p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {progress?.completedInterviews || 0}
          </p>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${isDarkMode ? 'border-yellow-500/20' : 'border-yellow-100'} hover:border-yellow-500 transition-all`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Play className="w-6 h-6 text-yellow-600" />
          </div>
              <Clock3 className="w-5 h-5 text-yellow-500 opacity-50" />
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            In Progress
          </p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {progress?.inProgressInterviews || 0}
          </p>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${isDarkMode ? 'border-purple-500/20' : 'border-purple-100'} hover:border-purple-500 transition-all`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Award className="w-6 h-6 text-purple-600" />
          </div>
              <Zap className="w-5 h-5 text-purple-500 opacity-50" />
            </div>
            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Success Rate
          </p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {progress?.totalInterviews > 0 
              ? Math.round((progress.completedInterviews / progress.totalInterviews) * 100)
              : 0}%
          </p>
          </div>
        </div>
      </div>

      {/* Recent Activity with Enhanced Design */}
      <div className={`rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${isDarkMode ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-white'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
              <Activity className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </h2>
          </div>
        </div>
        <div className="p-6">
          {progress?.interviewProgress?.length === 0 ? (
            <div className="text-center py-12">
              <div className={`inline-flex p-4 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
                <Activity className="w-12 h-12 text-gray-400" />
              </div>
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No recent activity
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                Start an interview to see your progress here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {progress?.interviewProgress?.slice(0, 3).map((interview, index) => (
                <div key={interview.interviewId} className={`group flex items-center space-x-4 p-4 rounded-xl border-2 ${isDarkMode ? 'border-gray-700 hover:border-blue-500/50 bg-gray-900/50' : 'border-gray-100 hover:border-blue-200 bg-gray-50/50'} transition-all cursor-pointer`}>
                  <div className={`p-3 rounded-xl ${getStatusColor(interview.status)}`}>
                    {getStatusIcon(interview.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {interview.interviewTitle}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {interview.status === 'completed' && interview.completedAt 
                        ? `✓ Completed ${formatDate(interview.completedAt)}`
                        : `Last accessed ${formatDate(interview.lastAccessedAt)}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                  <div className="text-right">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {calculateProgressPercentage(interview)}%
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Progress
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-600 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'} transition-colors`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed Interviews */}
      {progress?.completedInterviews > 0 && (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Completed Interviews
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {progress?.interviewProgress?.filter(interview => interview.status === 'completed').map((interview, index) => (
                <div key={interview.interviewId} className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {interview.interviewTitle}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Completed: {formatDate(interview.completedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {calculateProgressPercentage(interview)}% Complete
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {interview.progress.answeredQuestions} / {interview.progress.totalQuestions} questions
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.href = `/interview/${interview.interviewId}`}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Interviews tab content
  const renderInterviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Interviews
        </h2>
        <button
          onClick={fetchUserProgress}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {progress?.interviewProgress?.length === 0 ? (
        <div className={`text-center py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <BookOpen className="w-20 h-20 mx-auto mb-6 text-gray-400" />
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
            No interviews yet
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            Start your first interview to see your progress here
          </p>
          <button
            onClick={() => setActiveTab('join-interview')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Interview
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {progress?.interviewProgress?.map((interview, index) => (
            <div
              key={`${interview.interviewId}-${interview.startedAt || index}`}
              className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${getStatusColor(interview.status)}`}>
                    {getStatusIcon(interview.status)}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {interview.interviewTitle}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Started: {formatDate(interview.startedAt)}
                      {interview.status === 'completed' && interview.completedAt && (
                        <span className="ml-2 text-green-600">
                          • Completed: {formatDate(interview.completedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                    {interview.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Progress: {interview.progress.answeredQuestions} / {interview.progress.totalQuestions} questions
                  </span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {calculateProgressPercentage(interview)}%
                  </span>
                </div>
                <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-3`}>
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgressPercentage(interview)}%` }}
                  ></div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rounds</p>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {interview.progress.completedRounds} / {interview.progress.totalRounds}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock3 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time Spent</p>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Math.round(interview.totalTimeSpent / 60)} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Accessed</p>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(interview.lastAccessedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Questions</p>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {interview.progress.answeredQuestions} / {interview.progress.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {interview.status === 'completed' ? (
                  <>
                    <button
                      onClick={() => window.location.href = `/interview/${interview.interviewId}`}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Review Interview</span>
                    </button>
                    <div className="flex items-center space-x-2 px-4 py-3 bg-green-100 text-green-800 rounded-lg">
                      <Trophy className="w-4 h-4" />
                      <span className="font-medium">Completed</span>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => window.location.href = `/interview/${interview.interviewId}`}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Continue Interview</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Join Interview tab content
  const renderJoinInterview = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Join Interview
        </h2>
      
      <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <LinkIcon className="w-8 h-8 text-white" />
              </div>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              Enter Interview Link
            </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Paste the interview link provided by the recruiter
            </p>
          </div>

        <div className="space-y-4">
            <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Interview Link
              </label>
                <input
                  type="url"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  placeholder="https://yourapp.com/interview/interview_123456789"
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border-gray-300 bg-white'
              }`}
            />
            </div>

            {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleJoinInterview}
              disabled={loading || !interviewLink.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              {loading ? (
                <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Joining...</span>
                </>
              ) : (
                <>
                <LinkIcon className="h-4 w-4" />
                  <span>Join Interview</span>
                </>
              )}
            </button>
                </div>
      </div>
    </div>
  );

  // Browse Jobs tab content
  const renderBrowseJobs = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Browse Jobs
      </h2>
      
      <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Find Your Next Opportunity
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Browse and apply to available job opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Search Features</h4>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Search by skills and location</li>
              <li>• Filter by experience level</li>
              <li>• Save jobs for later</li>
              <li>• One-click applications</li>
            </ul>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Benefits</h4>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Track application status</li>
              <li>• Get interview invitations</li>
              <li>• Receive job recommendations</li>
              <li>• Connect with recruiters</li>
            </ul>
          </div>
        </div>

        <Link
          to="/user/jobs"
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <Search className="h-4 w-4" />
          <span>Browse Jobs</span>
        </Link>
      </div>
    </div>
  );

  // Applications tab content
  const renderApplications = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        My Applications
      </h2>
      
      <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Track Your Applications
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor your job applications and interview progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Application Status</h4>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• View application status</li>
              <li>• Track interview progress</li>
              <li>• See recruiter feedback</li>
              <li>• Manage applications</li>
            </ul>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Interview Tracking</h4>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Schedule interviews</li>
              <li>• View interview results</li>
              <li>• Get performance feedback</li>
              <li>• Track improvement</li>
            </ul>
          </div>
        </div>

        <Link
          to="/user/applications"
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <FileText className="h-4 w-4" />
          <span>View Applications</span>
        </Link>
      </div>
    </div>
  );

  // Profile tab content
  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Profile Settings
      </h2>
      
      <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.name}
            </h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {user?.email}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Full Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>

        <Link
          to="/user/profile"
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
        >
          <User className="h-4 w-4" />
          <span>Edit Profile</span>
        </Link>
      </div>
    </div>
  );

  // Settings tab content
  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Settings
      </h2>
      
      <div className={`p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dark Mode
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Toggle dark/light theme
              </p>
            </div>
            <div className={`w-12 h-6 rounded-full ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`hidden lg:block w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="p-6 h-full overflow-y-auto">

            {/* User Info */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name}
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Candidate
                </p>
                  </div>
                </div>
                
            {/* Navigation */}
            <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700'
                          : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                        <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
              </div>
                </div>
                
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
              {renderContent()}
            </div>
          </div>
        </div>
    </div>
  );
};

export default UserDashboard;
