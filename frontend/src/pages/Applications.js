import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Building,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const Applications = () => {
  const { user } = useAuth();

  const { data: applications, isLoading, error } = useQuery(
    'applications',
    async () => {
      const response = await axios.get('/api/applications/my');
      return response.data;
    },
    {
      enabled: !!user
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'shortlisted':
      case 'hired':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Applications</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">
            Track the status of your job applications and manage your job search.
          </p>
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application._id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-semibold text-gray-900 mr-3">
                        {application.job?.title || 'Job Application'}
                      </h2>
                      <span className={`px-3 py-1 text-sm rounded-full flex items-center ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1 capitalize">{application.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <Building className="h-5 w-5 mr-2" />
                      <span className="font-medium">{application.job?.company || 'Company'}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="h-5 w-5 mr-1" />
                      <span>{application.job?.location || 'Location'}</span>
                    </div>

                    <p className="text-gray-700 mb-4">
                      {application.coverLetter}
                    </p>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Applied on {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Resume submitted</span>
                      </div>
                      {application.additionalDocuments && application.additionalDocuments.length > 0 && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>{application.additionalDocuments.length} additional documents</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button className="btn btn-outline">
                        View Details
                      </button>
                      {application.status === 'pending' && (
                        <button className="btn btn-secondary">
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {application.aiScore && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">AI Match Score</span>
                      <span className="text-lg font-bold text-blue-600">{application.aiScore}%</span>
                    </div>
                    {application.aiFeedback && (
                      <p className="text-sm text-blue-700 mt-1">{application.aiFeedback}</p>
                    )}
                  </div>
                )}

                {application.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Recruiter Notes</h4>
                    <p className="text-sm text-gray-700">{application.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't applied to any jobs yet. Start browsing available positions and apply to jobs that interest you.
            </p>
            <a href="/jobs" className="btn btn-primary">
              Browse Jobs
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
