import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  MapPin, 
  Clock, 
  DollarSign,
  Building,
  Calendar,
  Users,
  Heart,
  Star,
  Eye,
  Edit,
  Trash2,
  MessageCircle,
  ExternalLink,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';

const JobCard = ({ 
  job, 
  showActions = true, 
  onApply, 
  onEdit, 
  onDelete, 
  onSave, 
  isSaved = false,
  isRecruiter = false,
  isCandidate = false,
  appliedJobs = new Set(),
  savedJobs = new Set(),
  user = null
}) => {
  const { isDarkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(savedJobs.has(job._id));
  const [isApplied, setIsApplied] = useState(appliedJobs.has(job._id));

  const formatSalary = (salary) => {
    if (!salary) return 'Salary not specified';
    if (salary.min && salary.max) {
      return `${salary.currency || '$'}${salary.min.toLocaleString()} - ${salary.currency || '$'}${salary.max.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  const getJobTypeColor = (type) => {
    switch (type) {
      case 'full-time':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'part-time':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contract':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'internship':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExperienceColor = (level) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'mid':
        return 'bg-yellow-100 text-yellow-800';
      case 'senior':
        return 'bg-red-100 text-red-800';
      case 'executive':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveJob = () => {
    setIsLiked(!isLiked);
    if (onSave) onSave(job._id);
  };

  const handleApply = () => {
    setIsApplied(true);
    if (onApply) onApply(job._id);
  };

  return (
    <motion.div
      className={`group relative rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative p-6">
        {/* Header with save button */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* Company logo placeholder */}
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">
                {job.company?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className={`text-xl font-bold group-hover:text-blue-600 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {job.title}
                </h2>
                <div className={`flex items-center transition-colors ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <Building className="h-4 w-4 mr-1" />
                  <span className="font-medium">{job.company}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save button */}
          {isCandidate && (
            <motion.button
              onClick={handleSaveJob}
              className={`p-2 rounded-full transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
          )}
        </div>

        {/* Job type and experience badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getJobTypeColor(job.type)}`}>
            {job.type.replace('-', ' ').toUpperCase()}
          </span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getExperienceColor(job.experienceLevel)}`}>
            {job.experienceLevel.replace('-', ' ').toUpperCase()}
          </span>
          {job.salary && (job.salary.min || job.salary.max) && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              <DollarSign className="h-3 w-3 inline mr-1" />
              {formatSalary(job.salary)}
            </span>
          )}
        </div>

        {/* Location */}
        <div className={`flex items-center mb-4 transition-colors ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <MapPin className={`h-4 w-4 mr-2 transition-colors ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <span>{job.location}</span>
        </div>

        {/* Description */}
        <p className={`mb-4 line-clamp-2 leading-relaxed transition-colors ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 4).map((skill, index) => (
                <motion.span
                  key={index}
                  className={`px-2 py-1 text-xs rounded-md font-medium border transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-900/50 text-blue-300 border-blue-700' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {skill}
                </motion.span>
              ))}
              {job.skills.length > 4 && (
                <span className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  +{job.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex justify-between items-center pt-4 border-t transition-colors ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className={`flex items-center space-x-4 text-sm transition-colors ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(job.createdAt).toLocaleDateString()}
            </div>
            {isRecruiter && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {job.applications?.length || 0} applications
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex space-x-2">
              {isRecruiter ? (
                <>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="btn btn-outline btn-sm flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                  {job.postedBy === user?._id && (
                    <>
                      <button
                        onClick={() => onEdit && onEdit(job._id)}
                        className="btn btn-outline btn-sm flex items-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(job._id)}
                        className="btn btn-danger btn-sm flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="btn btn-outline btn-sm flex items-center space-x-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                  {!isApplied ? (
                    <motion.button
                      onClick={handleApply}
                      className="btn btn-primary btn-sm flex items-center space-x-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Zap className="h-4 w-4" />
                      <span>Apply Now</span>
                    </motion.button>
                  ) : (
                    <button
                      className="btn btn-success btn-sm flex items-center space-x-1"
                      disabled
                    >
                      <Award className="h-4 w-4" />
                      <span>Applied</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
