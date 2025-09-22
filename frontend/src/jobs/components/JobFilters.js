import React from 'react';
import { Search, MapPin, Filter, X } from 'lucide-react';

const JobFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 1
  );

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Jobs</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      
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
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Job Type</label>
          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
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
              onChange={(e) => onFilterChange('location', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Experience Level</label>
          <select
            className="form-select"
            value={filters.experience}
            onChange={(e) => onFilterChange('experience', e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Salary Range</label>
            <select
              className="form-select"
              value={filters.salaryRange}
              onChange={(e) => onFilterChange('salaryRange', e.target.value)}
            >
              <option value="">Any Salary</option>
              <option value="0-50000">$0 - $50,000</option>
              <option value="50000-75000">$50,000 - $75,000</option>
              <option value="75000-100000">$75,000 - $100,000</option>
              <option value="100000-150000">$100,000 - $150,000</option>
              <option value="150000+">$150,000+</option>
            </select>
          </div>

          <div>
            <label className="form-label">Company Size</label>
            <select
              className="form-select"
              value={filters.companySize}
              onChange={(e) => onFilterChange('companySize', e.target.value)}
            >
              <option value="">Any Size</option>
              <option value="startup">Startup (1-50)</option>
              <option value="small">Small (51-200)</option>
              <option value="medium">Medium (201-1000)</option>
              <option value="large">Large (1000+)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Posted</label>
            <select
              className="form-select"
              value={filters.posted}
              onChange={(e) => onFilterChange('posted', e.target.value)}
            >
              <option value="">Any Time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last week</option>
              <option value="30">Last month</option>
              <option value="90">Last 3 months</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobFilters;