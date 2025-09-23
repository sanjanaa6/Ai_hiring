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
      className={`group relative rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        isDarkMode 
          ? 'bg-black border-gray-800 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-400'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      
      <div className="relative p-6">
        {/* Header with save button */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* Monochrome company logo and header */}
            <div className="flex items-center mb-4">
              <motion.div 
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl mr-4 shadow-lg ${
                  isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span className="relative z-10">{job.company?.charAt(0) || 'C'}</span>
              </motion.div>
              <div className="flex-1">
                <motion.h2 
                  className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {job.title}
                </motion.h2>
                <motion.div 
                  className={`flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium">{job.company}</span>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Monochrome save button */}
          {isCandidate && (
            <motion.button
              onClick={handleSaveJob}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isLiked 
                  ? isDarkMode
                    ? 'text-white bg-gray-800 hover:bg-gray-700 shadow-lg' 
                    : 'text-black bg-gray-100 hover:bg-gray-200 shadow-lg'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800 hover:shadow-md'
                    : 'text-gray-400 hover:text-black hover:bg-gray-100 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                scale: isLiked ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
          )}
        </div>

        {/* Monochrome job type and experience badges */}
        <div className="flex flex-wrap gap-3 mb-4">
          <motion.span 
            className={`px-4 py-2 text-xs font-semibold rounded-full border shadow-sm ${
              isDarkMode 
                ? 'bg-gray-800 text-white border-gray-600' 
                : 'bg-gray-100 text-black border-gray-300'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {job.type.replace('-', ' ').toUpperCase()}
          </motion.span>
          <motion.span 
            className={`px-4 py-2 text-xs font-semibold rounded-full shadow-sm ${
              isDarkMode 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-200 text-black'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {job.experienceLevel.replace('-', ' ').toUpperCase()}
          </motion.span>
          {job.salary && (job.salary.min || job.salary.max) && (
            <motion.span 
              className={`px-4 py-2 text-xs font-semibold rounded-full border shadow-sm ${
                isDarkMode 
                  ? 'bg-gray-600 text-white border-gray-500' 
                  : 'bg-gray-300 text-black border-gray-400'
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <DollarSign className="h-3 w-3 inline mr-1" />
              {formatSalary(job.salary)}
            </motion.span>
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

        {/* Monochrome Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 4).map((skill, index) => (
                <motion.span
                  key={index}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-600 hover:border-gray-400' 
                      : 'bg-gray-100 text-black border-gray-300 hover:border-gray-500'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {skill}
                </motion.span>
              ))}
              {job.skills.length > 4 && (
                <motion.span 
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  +{job.skills.length - 4} more
                </motion.span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex justify-between items-center pt-4 border-t transition-colors ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
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
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={`/jobs/${job._id}`}
                      className={`px-6 py-2.5 border-2 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-all duration-300 shadow-sm hover:shadow-lg ${
                        isDarkMode 
                          ? 'border-white text-white hover:bg-white hover:text-black' 
                          : 'border-black text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Details</span>
                    </Link>
                  </motion.div>
                  {!isApplied ? (
                    <motion.button
                      onClick={handleApply}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-white text-black hover:bg-gray-200' 
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Zap className="h-4 w-4" />
                      <span>Apply Now</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2 shadow-lg ${
                        isDarkMode 
                          ? 'bg-gray-600 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}
                      disabled
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Award className="h-4 w-4" />
                      <span>Applied</span>
                    </motion.button>
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
