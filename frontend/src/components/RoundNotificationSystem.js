import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { validateCandidateAccess, getCurrentRoundStatus } from '../utils/timeValidation';
import { Bell, BellOff, Clock, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RoundNotificationSystem = ({ 
  schedules = [], 
  onStatusChange,
  enableNotifications = true,
  autoRefresh = true 
}) => {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Generate notifications based on schedule status
  const generateNotifications = () => {
    const newNotifications = [];
    
    schedules.forEach(schedule => {
      if (!schedule || !schedule.startDateTime || !schedule.endDateTime) return;
      
      const accessStatus = validateCandidateAccess(schedule);
      const currentStatus = getCurrentRoundStatus(
        schedule.startDateTime, 
        schedule.endDateTime, 
        schedule.status
      );
      
      // Create notification based on status
      let notification = {
        id: schedule._id || schedule.roundId,
        scheduleId: schedule._id,
        roundName: schedule.roundName || 'Interview Round',
        status: currentStatus,
        accessStatus: accessStatus,
        timestamp: new Date(),
        priority: 'normal'
      };

      // Set priority and message based on status
      switch (currentStatus) {
        case 'active':
          notification.priority = 'high';
          notification.message = `${schedule.roundName} is now active and available for candidates`;
          notification.icon = CheckCircle;
          notification.color = 'green';
          break;
        case 'upcoming':
          notification.priority = 'medium';
          notification.message = `${schedule.roundName} will start soon`;
          notification.icon = Clock;
          notification.color = 'blue';
          break;
        case 'ended':
          notification.priority = 'low';
          notification.message = `${schedule.roundName} has ended`;
          notification.icon = XCircle;
          notification.color = 'gray';
          break;
        default:
          notification.priority = 'normal';
          notification.message = `${schedule.roundName} status updated`;
          notification.icon = Info;
          notification.color = 'blue';
      }

      newNotifications.push(notification);
    });

    setNotifications(newNotifications);
    setLastUpdate(new Date());
    
    // Call status change callback
    onStatusChange?.(newNotifications);
  };

  // Initial notification generation
  useEffect(() => {
    if (schedules.length > 0) {
      generateNotifications();
    }
  }, [schedules]);

  // Auto-refresh notifications
  useEffect(() => {
    if (!autoRefresh || schedules.length === 0) return;

    const interval = setInterval(() => {
      generateNotifications();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, schedules]);

  // Get notification summary
  const getNotificationSummary = () => {
    const activeCount = notifications.filter(n => n.status === 'active').length;
    const upcomingCount = notifications.filter(n => n.status === 'upcoming').length;
    const endedCount = notifications.filter(n => n.status === 'ended').length;
    
    return { activeCount, upcomingCount, endedCount };
  };

  const summary = getNotificationSummary();
  const hasActiveRounds = summary.activeCount > 0;
  const hasUpcomingRounds = summary.upcomingCount > 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200';
      case 'medium':
        return isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200';
      case 'low':
        return isDarkMode ? 'bg-gray-900/20 border-gray-700' : 'bg-gray-50 border-gray-200';
      default:
        return isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'upcoming':
        return 'text-blue-600';
      case 'ended':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  if (!enableNotifications || schedules.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Notification Bell */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative p-3 rounded-full shadow-lg transition-all duration-200 ${
          hasActiveRounds 
            ? isDarkMode 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-green-500 hover:bg-green-600'
            : isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-white hover:bg-gray-50'
        } ${isDarkMode ? 'border border-gray-600' : 'border border-gray-200'}`}
      >
        {hasActiveRounds ? (
          <Bell className="w-5 h-5 text-white" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        
        {/* Notification Badge */}
        {(summary.activeCount > 0 || summary.upcomingCount > 0) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              hasActiveRounds ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {summary.activeCount + summary.upcomingCount}
          </motion.div>
        )}
      </motion.button>

      {/* Expanded Notifications Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`mt-2 rounded-lg shadow-xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Round Status
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className={`p-1 rounded ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              
              {/* Summary */}
              <div className="flex space-x-4 mt-2 text-sm">
                {summary.activeCount > 0 && (
                  <span className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>{summary.activeCount} Active</span>
                  </span>
                )}
                {summary.upcomingCount > 0 && (
                  <span className="flex items-center space-x-1 text-blue-600">
                    <Clock className="w-3 h-3" />
                    <span>{summary.upcomingCount} Upcoming</span>
                  </span>
                )}
                {summary.endedCount > 0 && (
                  <span className="flex items-center space-x-1 text-gray-600">
                    <XCircle className="w-3 h-3" />
                    <span>{summary.endedCount} Ended</span>
                  </span>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const IconComponent = notification.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 border-b last:border-b-0 ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className={`w-4 h-4 mt-0.5 ${getStatusColor(notification.status)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.roundName}
                          </p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-1 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className={`p-4 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t text-xs ${
              isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
            }`}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoundNotificationSystem;
