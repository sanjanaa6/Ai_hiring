import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getTimeUntilStart, getTimeUntilEnd } from '../utils/timeValidation';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Timer,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

const RoundAccess = () => {
  const { accessLink } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [roundData, setRoundData] = useState(null);
  const [accessValidation, setAccessValidation] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch round data and validate access
  const fetchRoundData = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
      
      const response = await fetch(`${apiBaseUrl}/interviews/round/${accessLink}`);
      const result = await response.json();
      
      if (response.status === 403) {
        // Access denied - show error with schedule info
        setError(result.details || result.message || 'Access denied');
        setRoundData(result.data); // Still set round data to show schedule info
        setAccessValidation(result.data?.accessValidation);
        return;
      }
      
      if (result.success) {
        setRoundData(result.data);
        setAccessValidation(result.data.accessValidation);
        
        // Calculate time remaining
        const now = new Date();
        const start = new Date(result.data.schedule.startDateTime);
        const end = new Date(result.data.schedule.endDateTime);
        
        if (now < start) {
          setTimeRemaining(getTimeUntilStart(result.data.schedule.startDateTime));
        } else if (now >= start && now <= end) {
          setTimeRemaining(getTimeUntilEnd(result.data.schedule.endDateTime));
        }
      } else {
        setError(result.message || 'Failed to load round data');
      }
    } catch (err) {
      console.error('Error fetching round data:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh time remaining
  useEffect(() => {
    if (!roundData) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const start = new Date(roundData.schedule.startDateTime);
      const end = new Date(roundData.schedule.endDateTime);
      
      if (now < start) {
        setTimeRemaining(getTimeUntilStart(roundData.schedule.startDateTime));
      } else if (now >= start && now <= end) {
        setTimeRemaining(getTimeUntilEnd(roundData.schedule.endDateTime));
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [roundData]);

  useEffect(() => {
    if (accessLink) {
      fetchRoundData();
    }
  }, [accessLink, fetchRoundData]);

  // Start the round interview
  const handleStartRound = async () => {
    if (!accessValidation?.canAccess) return;

    try {
      setIsStarting(true);
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://aihire.eval8.xyz/api' 
        : 'http://localhost:5000/api';
      
      const response = await fetch(`${apiBaseUrl}/interviews/round/${accessLink}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Navigate to the interview round
        navigate(`/interview/round/${accessLink}`, { 
          state: { 
            roundData: result.data,
            accessValidation: result.data.accessValidation
          }
        });
      } else {
        setError(result.message || 'Failed to start round');
      }
    } catch (err) {
      console.error('Error starting round:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // Copy access link to clipboard
  const copyAccessLink = () => {
    const fullUrl = `${window.location.origin}/round/${accessLink}`;
    navigator.clipboard.writeText(fullUrl);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading round information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-2xl mx-auto p-6 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
        >
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Access Denied
            </h2>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </p>
            
            {/* Show schedule information if available */}
            {roundData && (
              <div className={`mt-6 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Round Information
                </h3>
                <div className="text-left space-y-2">
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Round: 
                    </span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {roundData.schedule?.roundName}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Start Time: 
                    </span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {roundData.schedule?.startDateTime ? new Date(roundData.schedule.startDateTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      End Time: 
                    </span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {roundData.schedule?.endDateTime ? new Date(roundData.schedule.endDateTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {accessValidation && (
                    <div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Status: 
                      </span>
                      <span className={`ml-2 capitalize ${
                        accessValidation.reason === 'upcoming' ? 'text-blue-500' :
                        accessValidation.reason === 'ended' ? 'text-red-500' :
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {accessValidation.reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Refresh
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!roundData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Round Not Found
          </h2>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The round you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const { schedule, interview, accessValidation: validation } = roundData;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {schedule.roundName}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {interview?.title} • Round {schedule.roundNumber}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={copyAccessLink}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="Copy access link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-lg overflow-hidden`}
        >
          {/* Status Header */}
          <div className={`p-6 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          } ${
            validation?.canAccess 
              ? isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
              : isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center space-x-4">
              {validation?.canAccess ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <Clock className="w-8 h-8 text-yellow-500" />
              )}
              <div className="flex-1">
                <h2 className={`text-xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {validation?.canAccess ? 'Round is Active' : 'Round Not Available'}
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {validation?.message}
                </p>
              </div>
            </div>
          </div>

          {/* Round Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Schedule Information */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Schedule Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Start Time
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(schedule.startDateTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        End Time
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(schedule.endDateTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Timer className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Duration
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {schedule.duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Remaining */}
              {timeRemaining && timeRemaining.total > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {validation?.canAccess ? 'Time Remaining' : 'Time Until Start'}
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="flex space-x-4 text-center">
                      {timeRemaining.days > 0 && (
                        <div>
                          <div className={`text-2xl font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {timeRemaining.days}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Days
                          </div>
                        </div>
                      )}
                      <div>
                        <div className={`text-2xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {timeRemaining.hours}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Hours
                        </div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {timeRemaining.minutes}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Minutes
                        </div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {timeRemaining.seconds}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Seconds
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {schedule.description && (
              <div className="mt-6">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Round Description
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {schedule.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            {schedule.requirements && (
              <div className="mt-4">
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Requirements
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {schedule.requirements}
                </p>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleStartRound}
                disabled={!validation?.canAccess || isStarting}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  validation?.canAccess && !isStarting
                    ? isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : isDarkMode
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Starting...</span>
                  </>
                ) : validation?.canAccess ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Round</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Round Not Available</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoundAccess;
