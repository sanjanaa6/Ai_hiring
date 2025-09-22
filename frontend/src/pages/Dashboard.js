import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import CandidateDashboard from '../user/pages/CandidateDashboard';
import RecruiterDashboard from '../recruiter/pages/RecruiterDashboard';
import AdminDashboard from '../admin/pages/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're already on a role-specific route
  const isOnRoleRoute = location.pathname.startsWith('/recruiter') || 
                       location.pathname.startsWith('/user') || 
                       location.pathname.startsWith('/admin');

  useEffect(() => {
    // If not on a role-specific route, redirect to the appropriate one
    if (!isOnRoleRoute) {
      if (user?.role === 'candidate' || user?.role === 'user') {
        navigate('/user', { replace: true });
      } else if (user?.role === 'recruiter') {
        navigate('/recruiter', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, navigate, isOnRoleRoute]);

  // Route to appropriate dashboard based on user role and current path
  if (location.pathname.startsWith('/recruiter') && (user?.role === 'recruiter' || user?.role === 'admin')) {
    return <RecruiterDashboard />;
  } else if (location.pathname.startsWith('/user') && (user?.role === 'candidate' || user?.role === 'user')) {
    return <CandidateDashboard />;
  } else if (location.pathname.startsWith('/admin') && user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Fallback for unknown roles or unauthorized access
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this dashboard.</p>
      </div>
    </div>
  );
};

export default Dashboard;
