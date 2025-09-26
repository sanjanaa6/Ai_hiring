import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import apiService from '../services/apiService';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign,
  Briefcase,
  Building,
  Calendar
} from 'lucide-react';

const Jobs = () => {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    location: '',
    experience: '',
    page: 1
  });

  const { data: jobsData, isLoading, error } = useQuery(
    ['jobs', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await apiService.getJobs(Object.fromEntries(params));
      return response;
    },
    {
      keepPreviousData: true
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle different response structures
  const jobs = Array.isArray(jobsData) ? jobsData : jobsData?.jobs || [];
  const totalPages = jobsData?.totalPages || 1;
  const currentPage = jobsData?.currentPage || 1;

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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Jobs</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Next Job</h1>
          <p className="text-gray-600">
            Discover opportunities that match your skills and career goals.
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Job title, company, or keywords"
                  className="form-input pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Job Type</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="form-label">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="City, state, or remote"
                  className="form-input pl-10"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Experience Level</label>
              <select
                className="form-select"
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Showing {jobs.length} of {data?.total || 0} jobs
            </p>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Sort by: Most Recent</span>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-semibold text-gray-900 mr-3">
                        {job.title}
                      </h2>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        job.type === 'full-time' 
                          ? 'bg-green-100 text-green-800'
                          : job.type === 'part-time'
                          ? 'bg-blue-100 text-blue-800'
                          : job.type === 'contract'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {job.type.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <Building className="h-5 w-5 mr-2" />
                      <span className="font-medium">{job.company}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="h-5 w-5 mr-1" />
                      <span>{job.location}</span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.experienceLevel.replace('-', ' ').toUpperCase()}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      {job.salary && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary.min && job.salary.max 
                            ? `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`
                            : 'Salary not specified'
                          }
                        </div>
                      )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {job.applications?.length || 0} applications
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="btn btn-outline"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/jobs/${job._id}`}
                      className="btn btn-primary"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
              <button
                onClick={() => setFilters({
                  search: '',
                  type: '',
                  location: '',
                  experience: '',
                  page: 1
                })}
                className="btn btn-primary"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-md text-sm font-medium ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
