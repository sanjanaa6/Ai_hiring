import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Search, MapPin, Filter, X, ChevronDown, Sparkles, Zap } from 'lucide-react';

const JobFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const { isDarkMode } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 1
  );

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== '' && value !== 1
  ).length;

  return (
    <motion.div 
      className={`rounded-2xl shadow-lg border transition-all duration-300 mb-8 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with gradient background */}
      <div className={`relative overflow-hidden rounded-t-2xl ${
        isDarkMode 
          ? 'bg-gradient-to-r from-gray-800 to-gray-700' 
          : 'bg-gradient-to-r from-blue-50 to-purple-50'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                isDarkMode 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`text-xl font-bold transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Smart Job Filters
                </h3>
                <p className={`text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Find your perfect match with intelligent filtering
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeFilterCount > 0 && (
                <motion.div 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDarkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-700'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {activeFilterCount} active
                </motion.div>
              )}
              
              {hasActiveFilters && (
                <motion.button
                  onClick={onClearFilters}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4" />
                  <span>Clear All</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Filters */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search Input */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className={`block text-sm font-semibold transition-colors ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <Search className="h-4 w-4 inline mr-2" />
              Search Jobs
            </label>
            <div className="relative group">
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
              <input
                type="text"
                placeholder="Job title, company, or keywords"
                className={`relative w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
              />
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
            </div>
          </motion.div>

          {/* Job Type */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className={`block text-sm font-semibold transition-colors ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <Zap className="h-4 w-4 inline mr-2" />
              Job Type
            </label>
            <select
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
              }`}
              value={filters.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </motion.div>

          {/* Location */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className={`block text-sm font-semibold transition-colors ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <MapPin className="h-4 w-4 inline mr-2" />
              Location
            </label>
            <div className="relative group">
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}></div>
              <input
                type="text"
                placeholder="City, state, or remote"
                className={`relative w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500'
                }`}
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
              />
              <MapPin className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
            </div>
          </motion.div>

          {/* Experience Level */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className={`block text-sm font-semibold transition-colors ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <Sparkles className="h-4 w-4 inline mr-2" />
              Experience
            </label>
            <select
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
              }`}
              value={filters.experience}
              onChange={(e) => onFilterChange('experience', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
          </motion.div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <motion.button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-purple-600/20 text-purple-400' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className={`font-semibold transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Advanced Filters
                </h4>
                <p className={`text-sm transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Salary, company size, and posting date
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className={`h-5 w-5 transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Salary Range */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      💰 Salary Range
                    </label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'
                      }`}
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
                  </motion.div>

                  {/* Company Size */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      🏢 Company Size
                    </label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                      }`}
                      value={filters.companySize}
                      onChange={(e) => onFilterChange('companySize', e.target.value)}
                    >
                      <option value="">Any Size</option>
                      <option value="startup">Startup (1-50)</option>
                      <option value="small">Small (51-200)</option>
                      <option value="medium">Medium (201-1000)</option>
                      <option value="large">Large (1000+)</option>
                    </select>
                  </motion.div>

                  {/* Posted Date */}
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className={`block text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      📅 Posted Date
                    </label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                      }`}
                      value={filters.posted}
                      onChange={(e) => onFilterChange('posted', e.target.value)}
                    >
                      <option value="">Any Time</option>
                      <option value="1">Last 24 hours</option>
                      <option value="7">Last week</option>
                      <option value="30">Last month</option>
                      <option value="90">Last 3 months</option>
                    </select>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default JobFilters;