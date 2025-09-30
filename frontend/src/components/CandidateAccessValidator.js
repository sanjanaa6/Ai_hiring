import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { validateCandidateAccess } from '../utils/timeValidation';
import { Clock, Calendar, AlertCircle, CheckCircle, XCircle, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

const CandidateAccessValidator = ({ 
  schedule, 
  onAccessGranted, 
  onAccessDenied,
  showCountdown = true,
  autoRefresh = true,
  candidateStatus = null
}) => {
  const { isDarkMode } = useTheme();
  const [accessStatus, setAccessStatus] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Validate access and update status
  const validateAccess = useCallback(() => {
    if (!schedule) {
      setAccessStatus({
        canAccess: false,
        reason: 'no_schedule',
        message: 'No schedule information available'
      });
      return;
    }

    const timeValidation = validateCandidateAccess(schedule);
    
    // Check candidate status first
    if (candidateStatus) {
      const allowedStatuses = ['passed', 'in_progress', 'started'];
      if (!allowedStatuses.includes(candidateStatus)) {
        let message = 'Access denied';
        let reason = 'status_restriction';
        
        switch (candidateStatus) {
          case 'rejected':
            message = 'You have been rejected from this interview. Access denied.';
            reason = 'rejected';
            break;
          case 'on_hold':
            message = 'Your interview is on hold. Please wait for recruiter approval to continue.';
            reason = 'on_hold';
            break;
          case 'failed':
            message = 'You have failed this interview. Access denied.';
            reason = 'failed';
            break;
          case 'completed':
            message = 'You have already completed this interview.';
            reason = 'completed';
            break;
          case 'abandoned':
            message = 'You have abandoned this interview. Access denied.';
            reason = 'abandoned';
            break;
          default:
            message = 'Your interview status does not allow access at this time.';
            reason = 'invalid_status';
        }
        
        const statusValidation = {
          canAccess: false,
          reason,
          message,
          timeRemaining: timeValidation.timeRemaining,
          candidateStatus
        };
        
        setAccessStatus(statusValidation);
        setTimeRemaining(timeValidation.timeRemaining);
        onAccessDenied?.(statusValidation);
        return;
      }
    }
    
    // If status is valid, check time-based access
    setAccessStatus(timeValidation);
    setTimeRemaining(timeValidation.timeRemaining);
    
    // Call appropriate callback
    if (timeValidation.canAccess) {
      onAccessGranted?.(timeValidation);
    } else {
      onAccessDenied?.(timeValidation);
    }
  }, [schedule, candidateStatus, onAccessGranted, onAccessDenied]);

  // Initial validation
  useEffect(() => {
    validateAccess();
  }, [schedule, candidateStatus, validateAccess]);

  // Auto-refresh every second if enabled
  useEffect(() => {
    if (!autoRefresh || !schedule) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      validateAccess();
      setTimeout(() => setIsRefreshing(false), 100);
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, schedule, validateAccess]);

  if (!schedule) {
    return (
      <div className={`p-6 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No Schedule Available
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This round has not been scheduled yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!accessStatus) {
    return (
      <div className={`p-6 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="animate-pulse">
          <div className={`h-4 bg-gray-300 rounded w-3/4 mb-2 ${isDarkMode ? 'bg-gray-600' : ''}`}></div>
          <div className={`h-3 bg-gray-300 rounded w-1/2 ${isDarkMode ? 'bg-gray-600' : ''}`}></div>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (accessStatus.reason) {
      case 'active':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'upcoming':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'ended':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'scheduled':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-gray-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (accessStatus.reason) {
      case 'active':
        return isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200';
      case 'upcoming':
        return isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200';
      case 'ended':
        return isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200';
      case 'scheduled':
        return isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200';
      case 'completed':
        return isDarkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200';
      default:
        return isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200';
    }
  };

  const formatScheduleTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-lg border transition-all duration-300 ${getStatusColor()}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg ${
          isDarkMode ? 'bg-gray-700' : 'bg-white'
        }`}>
          {getStatusIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold text-lg ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {schedule.roundName || 'Interview Round'}
            </h3>
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
          
          <p className={`text-sm mb-3 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {accessStatus.message}
          </p>

          {/* Schedule Information */}
          <div className={`p-3 rounded-lg mb-4 ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>Start:</strong> {formatScheduleTime(schedule.startDateTime)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  <strong>End:</strong> {formatScheduleTime(schedule.endDateTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          {showCountdown && timeRemaining && timeRemaining.total > 0 && (
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <Timer className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {accessStatus.reason === 'upcoming' ? 'Starts in:' : 'Ends in:'}
                </span>
              </div>
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
          )}

          {/* Access Control Message */}
          {!accessStatus.canAccess && (
            <div className={`mt-4 p-3 rounded-lg ${
              accessStatus.reason === 'scheduled' 
                ? isDarkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
                : isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {accessStatus.reason === 'scheduled' ? (
                  <Clock className="w-4 h-4 text-yellow-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  accessStatus.reason === 'scheduled'
                    ? isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                    : isDarkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  {accessStatus.reason === 'scheduled' ? 'Round Scheduled' : 'Access Restricted'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                accessStatus.reason === 'scheduled'
                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  : isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {accessStatus.reason === 'scheduled' 
                  ? 'Round is scheduled but not yet active. Please wait for the round to begin.'
                  : 'You can only access this round during the scheduled time window.'
                }
              </p>
            </div>
          )}

          {/* Access Granted Message */}
          {accessStatus.canAccess && (
            <div className={`mt-4 p-3 rounded-lg ${
              isDarkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  Access Granted
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                You can now proceed with the interview round.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateAccessValidator;
