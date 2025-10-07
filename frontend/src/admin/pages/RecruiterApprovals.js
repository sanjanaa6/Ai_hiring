import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import apiService from '../../services/apiService';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';

const RecruiterApprovals = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [docsRecruiter, setDocsRecruiter] = useState(null);

  useEffect(() => {
    fetchRecruiters();
  }, []);

  // Build backend origin for static file links (use API base URL, not window origin)
  const getBackendOrigin = () => {
    try {
      const apiBase = apiService.client?.defaults?.baseURL || '';
      if (apiBase) {
        return apiBase.replace(/\/api$/i, '');
      }
    } catch (_) {}
    // Dev fallback: if running on localhost:3000, serve static from :5000
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (/localhost|127\.0\.0\.1/.test(hostname)) {
        return `${protocol}//${hostname}:5000`;
      }
      return window.location.origin;
    }
    return '';
  };

  const buildDocUrl = (maybeUrl, maybePath) => {
    const origin = getBackendOrigin();
    if (maybeUrl) return `${origin}${maybeUrl}`;
    if (maybePath && /recruiter-docs\//.test(maybePath)) {
      const tail = maybePath.split('recruiter-docs/')[1] || '';
      return `${origin}/uploads/recruiter-docs/${tail}`;
    }
    return '';
  };

  const openDocsModal = async (recruiter) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`/api/admin/recruiters/${recruiter._id}/docs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        const merged = {
          ...recruiter,
          recruiterDocuments: {
            ...recruiter.recruiterDocuments,
            ...data.data
          }
        };
        setDocsRecruiter(merged);
      } else {
        setDocsRecruiter(recruiter);
      }
    } catch (_) {
      setDocsRecruiter(recruiter);
    }
    setShowDocs(true);
  };
  const closeDocsModal = () => {
    setDocsRecruiter(null);
    setShowDocs(false);
  };

  const fetchRecruiters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/recruiters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecruiters(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecruiters = recruiters.filter(recruiter => {
    const matchesSearch = recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recruiter.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recruiter.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (recruiterId) => {
    setActionLoading(true);
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
        await fetchRecruiters(); // Refresh the list
        alert('Recruiter approved successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to approve recruiter');
      }
    } catch (error) {
      console.error('Error approving recruiter:', error);
      alert('Error approving recruiter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (recruiterId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reject-recruiter/${recruiterId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason })
      });

      if (response.ok) {
        await fetchRecruiters(); // Refresh the list
        setShowModal(false);
        setRejectionReason('');
        setSelectedRecruiter(null);
        alert('Recruiter rejected successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to reject recruiter');
      }
    } catch (error) {
      console.error('Error rejecting recruiter:', error);
      alert('Error rejecting recruiter');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setShowModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStats = () => {
    const total = recruiters.length;
    const pending = recruiters.filter(r => r.approvalStatus === 'pending').length;
    const approved = recruiters.filter(r => r.approvalStatus === 'approved').length;
    const rejected = recruiters.filter(r => r.approvalStatus === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Recruiter Approvals</h1>
            <p className="text-gray-600 mt-2">Manage recruiter account approvals</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recruiters</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search recruiters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recruiters Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recruiters ({filteredRecruiters.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recruiter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecruiters.map((recruiter) => (
                    <tr key={recruiter._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {recruiter.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {recruiter.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {recruiter.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {recruiter.recruiterProfile?.company || 'Not specified'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {recruiter.recruiterProfile?.position || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(recruiter.approvalStatus)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(recruiter.approvalStatus)}`}>
                            {recruiter.approvalStatus}
                          </span>
                        </div>
                        {recruiter.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1">
                            Reason: {recruiter.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(recruiter.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {(
                            recruiter.recruiterDocuments?.gstFileUrl ||
                            recruiter.recruiterDocuments?.panFileUrl ||
                            recruiter.recruiterDocuments?.gstFile ||
                            recruiter.recruiterDocuments?.panFile
                          ) ? (
                            <button 
                              className="px-2 py-1 text-xs rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
                              onClick={() => openDocsModal(recruiter)}
                              title="View uploaded documents"
                            >
                              View Docs
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">No docs</span>
                          )}
                          {recruiter.approvalStatus === 'pending' && (
                            <>
                              <button 
                                className="text-green-600 hover:text-green-900"
                                onClick={() => handleApprove(recruiter._id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => openRejectModal(recruiter)}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecruiters.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recruiters found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No recruiters have registered yet.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Recruiter
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Rejecting: <strong>{selectedRecruiter?.name}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="form-textarea w-full"
                  rows="3"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectionReason('');
                    setSelectedRecruiter(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRecruiter._id)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Docs Modal */}
      {showDocs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Uploaded Documents</h3>
              <button onClick={closeDocsModal} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium mr-2">GST Number:</span>
                <span>{docsRecruiter?.recruiterDocuments?.gstNumber || '—'}</span>
              </div>
              <div>
                <span className="font-medium mr-2">PAN Number:</span>
                <span>{docsRecruiter?.recruiterDocuments?.panNumber || '—'}</span>
              </div>
              <div className="flex items-center space-x-4">
                {buildDocUrl(docsRecruiter?.recruiterDocuments?.gstFileUrl, docsRecruiter?.recruiterDocuments?.gstFile) ? (
                  <a
                    href={buildDocUrl(docsRecruiter?.recruiterDocuments?.gstFileUrl, docsRecruiter?.recruiterDocuments?.gstFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 text-xs rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Open GST Document
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">No GST document</span>
                )}
                {buildDocUrl(docsRecruiter?.recruiterDocuments?.panFileUrl, docsRecruiter?.recruiterDocuments?.panFile) ? (
                  <a
                    href={buildDocUrl(docsRecruiter?.recruiterDocuments?.panFileUrl, docsRecruiter?.recruiterDocuments?.panFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 text-xs rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Open PAN Document
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">No PAN document</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RecruiterApprovals;
