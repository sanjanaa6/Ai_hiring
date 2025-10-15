import React, { useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle,
  Users
} from 'lucide-react';

const Profiling = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState('Software Engineers');

  const categories = [
    'Software Engineers',
    'AI Engineers',
    'ML Engineers',
    'Data Scientists',
    'DevOps',
    'Solutions Architect',
    'QA Engineer'
  ];

  // Sample profiles data
  const profiles = {
    'Software Engineers': [
      {
        id: 1,
        name: 'Rahul Sharma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        role: 'Staff Software Engineer',
        experience: '10 Years',
        location: 'Bangalore, India',
        companies: ['Uber', 'IIT Kanpur'],
        skills: ['JavaScript', 'Java', 'Python', 'SQL', 'C', 'Spring', 'C++', 'AngularJS'],
        topSkills: ['JavaScript', 'Java', 'Python'],
        verified: true,
        rating: 4.9
      },
      {
        id: 2,
        name: 'Sumit Jha',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        role: 'Senior Software Development Engineer',
        experience: '12 Years',
        location: 'Pune, India',
        companies: ['Atlassian'],
        skills: ['C++', 'Java', 'JavaScript'],
        topSkills: ['C++', 'Java', 'JavaScript'],
        verified: true,
        rating: 4.8
      },
      {
        id: 3,
        name: 'Meghna Srivastava',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        role: 'Software Development Engineer',
        experience: '5 Years',
        location: 'Hyderabad, India',
        companies: ['Microsoft', 'IIT'],
        skills: ['Java', 'Backend', 'Algorithms', 'Data Modelling', 'Spark', 'Scala'],
        topSkills: ['Java', 'Backend', 'Algorithms'],
        verified: true,
        rating: 4.7
      }
    ],
    'AI Engineers': [
      {
        id: 4,
        name: 'Aaryan Popli',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
        role: 'Software Engineer 2',
        experience: '3.9 Years',
        location: 'Bangalore, India',
        companies: ['Amazon'],
        skills: ['AWS', 'Python', 'Django', 'Next.js', 'React', 'Microservices'],
        topSkills: ['AWS', 'Python', 'Django'],
        verified: true,
        rating: 4.8
      }
    ]
  };

  // Add fallback for other categories
  ['ML Engineers', 'Data Scientists', 'DevOps', 'Solutions Architect', 'QA Engineer'].forEach(cat => {
    if (!profiles[cat]) {
      profiles[cat] = [profiles['Software Engineers'][0]];
    }
  });

  const currentProfiles = profiles[activeCategory] || [];

  const handleProfileClick = (profileId) => {
    // Navigate to profile detail page
    navigate(`/profile/${profileId}`);
  };

  return (
    <section
      ref={ref}
      className={`py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-black' 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Top Talent Profiles
          </h2>
          
          <p className={`text-lg max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Pre-vetted professionals with verified skills and experience
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 font-medium transition-all duration-300 border ${
                  activeCategory === category
                    ? isDarkMode
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-white border-black'
                    : isDarkMode
                    ? 'bg-transparent text-white border-gray-700 hover:border-white'
                    : 'bg-transparent text-black border-gray-300 hover:border-black'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Profile Cards Grid */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {currentProfiles.slice(0, 3).map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleProfileClick(profile.id)}
              className={`cursor-pointer p-6 transition-all duration-300 border-2 hover:shadow-xl ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-800 hover:border-white'
                  : 'bg-white border-gray-300 hover:border-black'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/100x100/cccccc/666666?text=' + profile.name.charAt(0);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {profile.name}
                    </h3>
                    {profile.verified && <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />}
                  </div>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.role}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Exp. {profile.experience}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {profile.companies.map((company, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 text-xs font-medium border ${
                      isDarkMode ? 'bg-transparent text-gray-400 border-gray-700' : 'bg-transparent text-gray-600 border-gray-300'
                    }`}
                  >
                    {company}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.topSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 text-xs font-medium ${
                      isDarkMode
                        ? 'bg-white text-black'
                        : 'bg-black text-white'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Click on any profile to view complete details
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className={`px-8 py-4 font-bold text-lg transition-all border-2 ${
              isDarkMode
                ? 'bg-white text-black border-white hover:bg-transparent hover:text-white'
                : 'bg-black text-white border-black hover:bg-transparent hover:text-black'
            }`}
          >
            Browse All Candidates
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Profiling;
