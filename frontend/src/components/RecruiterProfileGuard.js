import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * RecruiterProfileGuard - Ensures recruiters complete their profile before accessing features
 */
const RecruiterProfileGuard = ({ children }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  useEffect(() => {
    if (user && user.role === 'recruiter') {
      checkProfileCompletion();
    }
  }, [user]);

  const checkProfileCompletion = () => {
    const missing = [];

    // Only Essential Required Fields
    if (!user.name || user.name.trim() === '') missing.push('Full Name');
    if (!user.profile?.phone) missing.push('Phone Number');
    if (!user.recruiterProfile?.company) missing.push('Company Name');
    if (!user.recruiterProfile?.position) missing.push('Position/Title');

    setMissingFields(missing);
    setIsProfileComplete(missing.length === 0);

    // If profile is incomplete and not on profile page, redirect
    if (missing.length > 0 && location.pathname !== '/recruiter/profile') {
      navigate('/recruiter/profile', { 
        state: { 
          message: 'Please complete your profile to access recruiter features',
          missingFields: missing 
        } 
      });
    }
  };

  // Allow access to profile page always
  if (location.pathname === '/recruiter/profile') {
    return <>{children}</>;
  }

  // If profile is incomplete, show blocking message
  if (user?.role === 'recruiter' && !isProfileComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
        <div className={`max-w-2xl w-full mx-4 p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Profile Incomplete
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please complete your profile to access recruiter features
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Missing Required Fields:
            </h3>
            <ul className="space-y-2">
              {missingFields.map((field, index) => (
                <li key={index} className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {field}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate('/recruiter/profile')}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Complete Profile Now
          </button>
        </div>
      </div>
    );
  }

  // Profile is complete, allow access
  return <>{children}</>;
};

export default RecruiterProfileGuard;
