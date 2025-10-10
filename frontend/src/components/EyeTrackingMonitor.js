import React, { useState, useEffect } from 'react';

const EyeTrackingMonitor = ({
  gazeDirection,
  violationCount,
  maxViolations = 10,
  isLookingAway,
  onRemoveUser
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Show warning when looking away
  useEffect(() => {
    if (isLookingAway && gazeDirection !== 'center') {
      setWarningMessage(`⚠️ You're looking ${gazeDirection.toUpperCase()}! Look at the screen immediately!`);
      setShowWarning(true);
      
      setTimeout(() => {
        setShowWarning(false);
      }, 8000);
    }
  }, [isLookingAway, gazeDirection]);

  // Handle max violations
  useEffect(() => {
    if (violationCount >= maxViolations && onRemoveUser) {
      console.log('🚨 MAX VIOLATIONS REACHED - TERMINATING INTERVIEW');
      onRemoveUser();
    }
  }, [violationCount, maxViolations, onRemoveUser]);

  const getSeverity = () => {
    if (violationCount === 0) return 'none';
    if (violationCount < maxViolations - 1) return 'warning';
    if (violationCount === maxViolations - 1) return 'critical';
    return 'max';
  };

  const severity = getSeverity();

  return (
    <>
      {/* ALL WARNINGS CONSOLIDATED UNDER CAMERA - TOP RIGHT */}
      <div className="fixed top-4 right-4 z-50 w-80">
        {/* Main Status Card */}
        <div className={`mb-2 rounded-lg shadow-lg p-3 ${
          gazeDirection === 'center' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">👁️</span>
              <span className="font-bold text-sm">
                {gazeDirection === 'center' ? 'LOOKING AT SCREEN' : `LOOKING ${gazeDirection.toUpperCase()}`}
              </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              gazeDirection === 'center' ? 'bg-green-200' : 'bg-red-200'
            } animate-ping`} />
          </div>
        </div>

        {/* Violation Counter */}
        <div className={`rounded-lg shadow-lg p-3 ${
          severity === 'none' ? 'bg-green-500' :
          severity === 'warning' ? 'bg-yellow-500' :
          severity === 'critical' ? 'bg-orange-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <span className="font-bold text-sm">
                {severity === 'none' ? 'NO VIOLATIONS' : 
                 severity === 'warning' ? `WARNING: ${violationCount}/${maxViolations}` :
                 severity === 'critical' ? `CRITICAL: ${violationCount}/${maxViolations}` :
                 `TERMINATED: ${violationCount}/${maxViolations}`}
              </span>
            </div>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                severity === 'none' ? 'bg-green-200' :
                severity === 'warning' ? 'bg-yellow-200' :
                severity === 'critical' ? 'bg-orange-200' : 'bg-red-200'
              }`}
              style={{ width: `${(violationCount / maxViolations) * 100}%` }}
            />
          </div>
        </div>

        {/* Warning Message */}
        {showWarning && (
          <div className="mt-2 bg-red-500 text-white rounded-lg shadow-lg p-3 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚨</span>
              <span className="font-bold text-sm">{warningMessage}</span>
            </div>
            <div className="mt-2 text-xs">
              ⚠️ {maxViolations - violationCount} warnings remaining!
            </div>
          </div>
        )}

        {/* Critical Warning */}
        {severity === 'critical' && (
          <div className="mt-2 bg-red-600 text-white rounded-lg shadow-lg p-3 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💀</span>
              <span className="font-bold text-sm">FINAL WARNING!</span>
            </div>
            <div className="mt-2 text-xs">
              Next violation will terminate the interview!
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EyeTrackingMonitor;
