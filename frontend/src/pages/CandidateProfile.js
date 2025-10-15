import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import ProfessionalTimeline from '../components/ProfessionalTimeline';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  TrendingUp,
  Code,
  Database,
  CheckCircle,
  Star,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  BarChart3,
  Layers,
  Link,
  Leaf,
  Zap,
  Cloud,
  Laptop,
  Monitor,
  FolderOpen,
  Send,
  CheckSquare
} from 'lucide-react';

const CandidateProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock profile data - In production, fetch from API
  const profilesData = {
    '1': {
      id: 1,
      name: 'Rahul Purohit',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      role: 'Staff Software Engineer',
      experience: '10 Years',
      location: 'Bangalore, India',
      email: 'rahul.purohit@example.com',
      phone: '+91 98765 43210',
      linkedin: 'linkedin.com/in/rahulpurohit',
      github: 'github.com/rahulpurohit',
      currentCompany: 'Uber',
      bio: 'Skilled in Java, Python, JavaScript, SQL, C++, Spring, and AngularJS. I specialize in building scalable backend systems, optimizing resource usage (compute, storage, network), and designing large-scale data pipelines. I bring strong fundamentals in distributed systems, SOLID code, algorithms, and data structures. With a customer-first mindset, domain-driven design skills, and an eye for product value, I contribute beyond code by shaping roadmaps and driving impact. I thrive in collaborative teams, adapt quickly, and raise the bar on quality and standards through peer influence and leadership.',
      skillsets: ['JavaScript', 'Java', 'Python', 'SQL', 'C', 'Spring', 'Angular JS'],
      professionalSummary: {
        totalYears: 10,
        positions: [
          {
            title: 'Staff Software Engineer',
            company: 'Uber',
            duration: 'Nov, 2022 - Present',
            period: '2 yr 11 months',
            description: 'Worked on building the Retain and Remit platform from scratch. Onboarded two new use-cases on the platform.',
            skills: ['Java', 'Spring', 'Kafka', 'AWS', 'Microservices']
          },
          {
            title: 'SDE-II',
            company: 'Amazon',
            duration: 'Aug, 2021 - Oct, 2022',
            period: '1 yr 2 months',
            description: 'Improved platform by building tier-1 by generating new key use-cases to understand the customer journey.',
            skills: ['Java', 'DynamoDB', 'API Gateway', 'Lambda']
          },
          {
            title: 'Senior Software Engineer',
            company: 'Google',
            duration: 'Aug, 2020 - Jul, 2021',
            period: '11 months',
            description: 'Worked on search infrastructure and ranking algorithms.',
            skills: ['C++', 'Python', 'TensorFlow']
          },
          {
            title: 'Staff Software Engineer',
            company: 'Druva',
            duration: 'Jul, 2015 - Jul, 2017',
            period: '2 yr',
            description: 'Led team of 5 engineers building cloud backup solutions.',
            skills: ['Java', 'AWS', 'PostgreSQL']
          },
          {
            title: 'SDE-II',
            company: 'Amazon',
            duration: 'Aug, 2017 - Oct, 2018',
            period: '1 yr 2 months',
            description: 'Worked on Alexa voice services and natural language processing.',
            skills: ['Python', 'Machine Learning', 'NLP']
          },
          {
            title: 'Staff Software Engineer',
            company: 'Druva',
            duration: 'Jan, 2019 - Aug, 2020',
            period: '1 yr 7 months',
            description: 'Architected disaster recovery solutions for enterprise clients.',
            skills: ['Java', 'Kubernetes', 'Docker']
          }
        ]
      },
      applications: [
        { name: 'HTML', icon: 'Globe' },
        { name: 'Weka', icon: 'BarChart3' },
        { name: 'Oracle 11g', icon: 'Database' },
        { name: 'Neo4j', icon: 'Link' },
        { name: 'MongoDB', icon: 'Leaf' },
        { name: 'DynamoDB', icon: 'Zap' },
        { name: 'AWS S3', icon: 'Cloud' },
        { name: 'AWS Lambda', icon: 'Zap' },
        { name: 'IntelliJ', icon: 'Laptop' },
        { name: 'Putty', icon: 'Monitor' },
        { name: 'WinSCP', icon: 'FolderOpen' },
        { name: 'Postman', icon: 'Send' },
        { name: 'QC', icon: 'CheckSquare' }
      ],
      achievements: [
        'EMPLOYEE OF THE YEAR AWARD AT FLIPKART',
        'WINNER OF MICROSOFT CODE.FUN.DO HACKATHON',
        'Ranked 1st Microsoft Code.Fun.Do Hackathon',
        'Ranked 1st Hack in the North',
        'Innovative solution at ICSE-MAN-IISER-IMS-IIITS',
        'All India Rank 27 Hacking in Hackathon 2012'
      ],
      projects: [
        {
          title: 'Graph Orchestration Optimization',
          description: 'Solved orchestration and algorithm to solve problem for basic users of GitHub users.'
        },
        {
          title: 'Thrift-Twirp in My Pocket',
          description: 'Mobile application for micro-service where users can use a common point-point to discussions, take pictures.'
        }
      ],
      education: [
        {
          degree: 'B.Tech in CSE',
          institution: 'IIT Kanpur',
          year: '2010 - 2014'
        }
      ],
      verified: true,
      rating: 4.9,
      availability: 'Available for hire'
    },
    '2': {
      id: 2,
      name: 'Sumit Jha',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      role: 'Senior Software Development Engineer',
      experience: '12 Years',
      location: 'Pune, India',
      email: 'sumit.jha@example.com',
      currentCompany: 'Atlassian',
      bio: 'Experienced in building products from the ground up and scaling systems used by over 100 million users. Have led cross-functional teams, managing 10+ engineers across 3 simultaneous projects.',
      skillsets: ['C++', 'Java', 'JavaScript'],
      professionalSummary: {
        totalYears: 12,
        positions: [
          {
            title: 'Senior Software Engineer',
            company: 'Atlassian',
            duration: '2018 - Present',
            period: '6+ years',
            description: 'Leading development of Jira Cloud platform.',
            skills: ['Java', 'React', 'AWS']
          }
        ]
      },
      applications: [
        { name: 'Docker', icon: 'Layers' },
        { name: 'Kubernetes', icon: 'Cloud' },
        { name: 'Jenkins', icon: 'Code' }
      ],
      achievements: [
        'Led team managing 10+ engineers',
        'Built systems for 100M+ users'
      ],
      projects: [],
      education: [],
      verified: true,
      rating: 4.8,
      availability: 'Available for hire'
    },
    '3': {
      id: 3,
      name: 'Meghna Srivastava',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      role: 'Software Development Engineer',
      experience: '5 Years',
      location: 'Hyderabad, India',
      email: 'meghna.s@example.com',
      currentCompany: 'Microsoft',
      bio: 'Backend engineer passionate about building scalable systems with experience at Meta, Amazon, Microsoft.',
      skillsets: ['Java', 'Backend', 'Algorithms', 'Spark', 'Scala'],
      professionalSummary: {
        totalYears: 5,
        positions: [
          {
            title: 'SDE',
            company: 'Microsoft',
            duration: '2020 - Present',
            period: '4+ years',
            description: 'Working on Azure infrastructure.',
            skills: ['Java', 'Azure', 'Distributed Systems']
          }
        ]
      },
      applications: [],
      achievements: [],
      projects: [],
      education: [],
      verified: true,
      rating: 4.7,
      availability: 'Available for hire'
    },
    '4': {
      id: 4,
      name: 'Aaryan Popli',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      role: 'Software Engineer 2',
      experience: '3.9 Years',
      location: 'Bangalore, India',
      email: 'aaryan.popli@example.com',
      currentCompany: 'Amazon',
      bio: 'Collaborative software engineer and data scientist with strong time management skills.',
      skillsets: ['AWS', 'Python', 'Django', 'React'],
      professionalSummary: {
        totalYears: 3.9,
        positions: [
          {
            title: 'Software Engineer 2',
            company: 'Amazon',
            duration: '2021 - Present',
            period: '3+ years',
            description: 'Working on AWS services.',
            skills: ['Python', 'AWS', 'Microservices']
          }
        ]
      },
      applications: [],
      achievements: [],
      projects: [],
      education: [],
      verified: true,
      rating: 4.8,
      availability: 'Available for hire'
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundProfile = profilesData[profileId];
      if (foundProfile) {
        setProfile(foundProfile);
      }
      setLoading(false);
    }, 500);
  }, [profileId]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Profile Not Found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      {/* Header with Back Button */}
      <div className={`sticky top-0 z-50 ${
        isDarkMode ? 'bg-black border-b border-gray-800' : 'bg-white border-b border-gray-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 px-4 py-2 transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-gray-300'
                : 'hover:bg-gray-100 text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Profiles</span>
          </button>
          
          <button
            className={`px-6 py-3 font-semibold transition-all ${
              isDarkMode
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            Hire A Talent
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 md:p-12 mb-8 shadow-lg ${
            isDarkMode
              ? 'bg-black border border-gray-800'
              : 'bg-gradient-to-br from-white to-amber-50/50'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Profile Image & Basic Info */}
            <div className="lg:col-span-1">
              <div className="text-center lg:text-left">
                <div className="inline-block relative mb-6">
                  <div className={`w-48 h-48 rounded-full border-4 overflow-hidden ${
                    isDarkMode ? 'border-white' : 'border-black'
                  }`}>
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x400/cccccc/666666?text=' + profile.name.charAt(0);
                      }}
                    />
                  </div>
                  {profile.verified && (
                    <div className={`absolute bottom-2 right-2 rounded-full p-2 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}>
                      <CheckCircle className={`w-6 h-6 ${
                        isDarkMode ? 'text-black' : 'text-white'
                      }`} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Profile Details */}
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className={`text-4xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.name}
                  </h1>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(profile.rating)
                            ? isDarkMode
                              ? 'fill-white text-white'
                              : 'fill-black text-black'
                            : isDarkMode
                            ? 'text-gray-700'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className={`ml-2 font-semibold ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {profile.rating}
                    </span>
                  </div>
                </div>
              </div>

              <p className={`text-lg leading-relaxed mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {profile.bio}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Role
                  </h3>
                  <p className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.role}
                  </p>
                </div>
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Years of Experience
                  </h3>
                  <p className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.experience}
                  </p>
                </div>
              </div>

              {/* Skillsets */}
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  <Code className="w-5 h-5" />
                  Skillsets
                  <span className="text-2xl">🎯</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skillsets.map((skill, idx) => (
                    <span
                      key={idx}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isDarkMode
                          ? 'bg-gray-800 text-white border border-gray-700'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-8 md:p-12 mb-8 shadow-lg ${
            isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'
          }`}
        >
          <div className="mb-12">
            <div className="flex items-baseline gap-4 mb-8">
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Professional<br/>Summary
              </h2>
              <div className="flex items-baseline gap-2">
                <span className={`text-7xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {profile.professionalSummary.totalYears}
                </span>
                <span className="text-2xl text-amber-500 font-bold">●</span>
                <span className={`text-xl ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Years
                </span>
              </div>
            </div>
          </div>

        {/* Pixel-accurate timeline */}
        <ProfessionalTimeline positions={profile.professionalSummary.positions} isDarkMode={isDarkMode} />
        </motion.div>

        {/* Applications & Tools Known */}
        {profile.applications && profile.applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-8 md:p-12 mb-8 shadow-lg ${
              isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              <Database className="w-6 h-6" />
              Applications & Tools Known
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profile.applications.map((app, idx) => {
                // Map icon name to component
                const iconComponents = {
                  Globe, BarChart3, Database, Link, Leaf, Zap, Cloud, 
                  Laptop, Monitor, FolderOpen, Send, CheckSquare, Layers, Code
                };
                const IconComponent = iconComponents[app.icon];
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
                      isDarkMode
                        ? 'bg-gray-900 border border-gray-800 hover:border-white'
                        : 'bg-gray-50 border border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {IconComponent && (
                        <IconComponent className={`w-10 h-10 ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`} />
                      )}
                    </div>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {app.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl p-8 md:p-12 mb-8 shadow-lg ${
              isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-3 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              <Award className="w-6 h-6" />
              Achievements
            </h2>
            <div className="space-y-3">
              {profile.achievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 p-4 border ${
                    isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <Award className={`w-6 h-6 mt-1 flex-shrink-0 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`} />
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {achievement}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Major Projects */}
        {profile.projects && profile.projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-8 md:p-12 shadow-lg ${
              isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-baseline gap-4 mb-8">
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Major Projects
              </h2>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {profile.projects.length}
                </span>
                <span className={`text-xl ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Projects
                </span>
              </div>
            </div>
            <div className="space-y-6">
              {profile.projects.map((project, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl ${
                    isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}></div>
                    <h3 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {project.title}
                    </h3>
                  </div>
                  <p className={`ml-6 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CandidateProfile;
