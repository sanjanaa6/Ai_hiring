import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { validateCandidateAccess } from '../utils/timeValidation';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RoundAccessTest = () => {
  const { isDarkMode } = useTheme();
  const [testResults, setTestResults] = useState([]);

  const testCases = [
    {
      name: "Upcoming Round (Future)",
      schedule: {
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // 25 hours from now
        roundName: "Future Round Test"
      }
    },
    {
      name: "Active Round (Now)",
      schedule: {
        startDateTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        endDateTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        roundName: "Active Round Test"
      }
    },
    {
      name: "Ended Round (Past)",
      schedule: {
        startDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        roundName: "Ended Round Test"
      }
    }
  ];

  const runTests = () => {
    const results = testCases.map(testCase => {
      const validation = validateCandidateAccess(testCase.schedule);
      return {
        ...testCase,
        validation,
        passed: validation.canAccess === (testCase.name.includes("Active"))
      };
    });
    setTestResults(results);
  };

  const getStatusIcon = (canAccess, reason) => {
    if (canAccess) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (reason === 'upcoming') {
      return <Clock className="w-5 h-5 text-blue-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (canAccess, reason) => {
    if (canAccess) {
      return isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200';
    } else if (reason === 'upcoming') {
      return isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200';
    } else {
      return isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Round Access Control Test
        </h3>
        <button
          onClick={runTests}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Run Tests
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(result.validation.canAccess, result.validation.reason)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.validation.canAccess, result.validation.reason)}
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {result.name}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {result.schedule.roundName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    result.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Access: {result.validation.canAccess ? 'Granted' : 'Denied'}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {result.validation.message}
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Start: {result.schedule.startDateTime.toLocaleString()} | 
                  End: {result.schedule.endDateTime.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`mt-6 p-4 rounded-lg ${
        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
      }`}>
        <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Test Instructions:
        </h4>
        <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <li>• <strong>Upcoming Round:</strong> Should show "Access Denied" - Round not started yet</li>
          <li>• <strong>Active Round:</strong> Should show "Access Granted" - Round is currently active</li>
          <li>• <strong>Ended Round:</strong> Should show "Access Denied" - Round has ended</li>
        </ul>
      </div>
    </div>
  );
};

export default RoundAccessTest;
