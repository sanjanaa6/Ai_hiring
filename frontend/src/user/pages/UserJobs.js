import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserLayout from '../components/UserLayout';
import { Briefcase, Search, Filter, MapPin, DollarSign, Clock, Star, Bookmark, ExternalLink } from 'lucide-react';

const UserJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesType && matchesLocation;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'full-time':
        return 'bg-blue-100 text-blue-800';
      case 'part-time':
        return 'bg-purple-100 text-purple-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApply = (jobId) => {
    // TODO: Implement job application logic
    console.log('Applying to job:', jobId);
  };

  const handleBookmark = (jobId) => {
    // TODO: Implement bookmark logic
    console.log('Bookmarking job:', jobId);
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Find Your Dream Job</h1>
            <p className="text-gray-600 mt-2">Discover opportunities that match your skills and interests</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {job.title}
                      </h3>
                      <p className="text-lg text-gray-600 mb-2">{job.company}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(job.type)}`}>
                        {job.type}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBookmark(job._id)}
                          className="p-2 text-gray-400 hover:text-yellow-500"
                        >
                          <Bookmark className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApply(job._id)}
                          className="btn-primary flex items-center"
                        >
                          Apply Now
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700 line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      <span>4.5 rating</span>
                      <span className="mx-2">•</span>
                      <span>50+ applicants</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || typeFilter !== 'all' || locationFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No jobs are available at the moment.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserJobs;
