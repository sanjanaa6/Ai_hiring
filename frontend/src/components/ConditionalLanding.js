import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../landing/LandingPage';

const ConditionalLanding = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!loading && isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'candidate' || user.role === 'user') {
        navigate('/user', { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/recruiter', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        // Fallback to general dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page only if user is not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
};

export default ConditionalLanding;
