import React from 'react';
import { useAuth } from '../context/AuthContext';
import CandidateDashboard from '../user/pages/CandidateDashboard';
import RecruiterDashboard from '../recruiter/pages/RecruiterDashboard';
import AdminDashboard from '../admin/pages/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to appropriate dashboard based on user role
  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  } else if (user?.role === 'recruiter') {
    return <RecruiterDashboard />;
  } else if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Fallback for unknown roles
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
