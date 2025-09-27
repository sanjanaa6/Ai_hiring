import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Users, Briefcase, FileText, Shield, Eye, Edit, Trash2, CheckCircle, XCircle, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (recruiterId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/approve-recruiter/${recruiterId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh the dashboard data
        alert('Recruiter approved successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve recruiter');
      }
    } catch (error) {
      console.error('Error approving recruiter:', error);
      alert('Error approving recruiter');
    }
  };

  const handleQuickReject = async (recruiterId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reject-recruiter/${recruiterId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: reason })
      });

      if (response.ok) {
        await fetchDashboardData(); // Refresh the dashboard data
        alert('Recruiter rejected successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject recruiter');
      }
    } catch (error) {
      console.error('Error rejecting recruiter:', error);
      alert('Error rejecting recruiter');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}! Manage the entire platform
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(dashboardData?.userStats || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.jobStats?.active || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(dashboardData?.applicationStats || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </div>

          <a href="/admin/recruiter-approvals" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Recruiters</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.pendingRecruitersCount || 0}
                  </p>
                  {dashboardData?.pendingRecruitersCount > 0 && (
                    <p className="text-xs text-purple-600 mt-1">Click to review</p>
                  )}
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* Pending Recruiters Quick Actions */}
        {dashboardData?.pendingRecruitersCount > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pending Recruiter Approvals</h2>
              <a 
                href="/admin/recruiter-approvals" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </a>
            </div>
            <p className="text-gray-600 mb-4">
              You have {dashboardData.pendingRecruitersCount} recruiter(s) waiting for approval.
            </p>
            <div className="flex space-x-3">
              <a 
                href="/admin/recruiter-approvals"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Review & Approve
              </a>
              <a 
                href="/admin/recruiter-approvals"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </a>
            </div>
          </div>
        )}

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Candidates</span>
                <span className="font-medium text-blue-600">
                  {dashboardData?.userStats?.candidate || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recruiters</span>
                <span className="font-medium text-green-600">
                  {dashboardData?.userStats?.recruiter || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Admins</span>
                <span className="font-medium text-purple-600">
                  {dashboardData?.userStats?.admin || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active</span>
                <span className="font-medium text-green-600">
                  {dashboardData?.jobStats?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paused</span>
                <span className="font-medium text-yellow-600">
                  {dashboardData?.jobStats?.paused || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Closed</span>
                <span className="font-medium text-gray-600">
                  {dashboardData?.jobStats?.closed || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Applied</span>
                <span className="font-medium text-blue-600">
                  {dashboardData?.applicationStats?.applied || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Review</span>
                <span className="font-medium text-yellow-600">
                  {dashboardData?.applicationStats?.review || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interview</span>
                <span className="font-medium text-purple-600">
                  {dashboardData?.applicationStats?.interview || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Pending Recruiters */}
        {dashboardData?.pendingRecruiters && dashboardData.pendingRecruiters.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Pending Recruiters</h2>
                <a 
                  href="/admin/recruiter-approvals" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.pendingRecruiters.slice(0, 3).map((recruiter) => (
                  <div key={recruiter._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {recruiter.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{recruiter.name}</h3>
                        <p className="text-sm text-gray-600">{recruiter.email}</p>
                        <p className="text-sm text-gray-500">
                          {recruiter.recruiterProfile?.company || 'Company not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleQuickApprove(recruiter._id)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleQuickReject(recruiter._id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            </div>
            <div className="p-6">
              {dashboardData?.users?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.users.map((user) => (
                    <div key={user._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                          user.role === 'candidate' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'recruiter' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          user.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            </div>
            <div className="p-6">
              {dashboardData?.applications?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.applications.map((application) => (
                    <div key={application._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{application.candidate.name}</h3>
                          <p className="text-sm text-gray-600">{application.job.title}</p>
                          <p className="text-sm text-gray-500">{application.candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            application.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                            application.status === 'offered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </span>
                          <div className="mt-2 flex space-x-2">
                            <button className="text-green-600 hover:text-green-800">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No applications found</p>
              )}
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
