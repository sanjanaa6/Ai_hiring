import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  UserCheck, 
  Trash2,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Star,
  Fingerprint,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

const PrivacyPolicy = () => {
  const { isDarkMode } = useTheme();

  const [selectedDataType, setSelectedDataType] = useState(null);
  const [privacyScore, setPrivacyScore] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [cosmicShield, setCosmicShield] = useState(false);
  const [floatingPrivacyIcons, setFloatingPrivacyIcons] = useState([]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Initialize floating privacy icons
    const icons = [Shield, Lock, Eye, UserCheck, KeyRound, ShieldCheck];
    const floating = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      Icon: icons[Math.floor(Math.random() * icons.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      delay: Math.random() * 2
    }));
    setFloatingPrivacyIcons(floating);
  }, []);

  const dataCategories = [
    {
      id: 'personal',
      title: '👤 Personal Information',
      icon: UserCheck,
      description: 'Name, email, profile data',
      color: 'from-blue-500 to-cyan-500',
      data: [
        'Full Name (stored in encrypted galactic vault)',
        'Email Address (protected by quantum shields)',
        'Profile Picture (compressed with cosmic algorithms)',
        'Learning Preferences (mapped to your neural patterns)'
      ],
      protection: 'AES-256 Quantum Encryption'
    },
    {
      id: 'learning',
      title: '🧠 Learning Data',
      icon: Sparkles,
      description: 'Progress, achievements, analytics',
      color: 'from-purple-500 to-pink-500',
      data: [
        'Course Progress (tracked across dimensions)',
        'Test Scores (stored in achievement constellation)',
        'Time Spent Learning (measured in cosmic cycles)',
        'Skill Assessments (analyzed by AI oracles)'
      ],
      protection: 'Blockchain-secured Learning Ledger'
    },
    {
      id: 'technical',
      title: '⚙️ Technical Data',
      icon: Database,
      description: 'Device info, IP, usage patterns',
      color: 'from-green-500 to-teal-500',
      data: [
        'Device Information (fingerprinted with stardust)',
        'IP Address (masked in cosmic coordinates)',
        'Browser Data (analyzed by digital telescopes)',
        'Usage Patterns (mapped to learning orbits)'
      ],
      protection: 'Anonymized Data Processing'
    },
    {
      id: 'communication',
      title: '💬 Communication',
      icon: Share2,
      description: 'Messages, feedback, support',
      color: 'from-orange-500 to-red-500',
      data: [
        'Support Messages (archived in help galaxy)',
        'Feedback & Reviews (powered by sentiment stars)',
        'Community Posts (shared across learning nebulas)',
        'Notification Preferences (tuned to your frequency)'
      ],
      protection: 'End-to-End Encrypted Communications'
    }
  ];

  const privacyRights = [
    {
      icon: Eye,
      title: 'Right to Know',
      description: 'See exactly what data we collect and why',
      action: 'View Data Report',
      color: 'bg-blue-500'
    },
    {
      icon: Download,
      title: 'Data Portability',
      description: 'Download your data in a portable cosmic format',
      action: 'Export Data',
      color: 'bg-green-500'
    },
    {
      icon: Trash2,
      title: 'Right to Delete',
      description: 'Remove your data from our cosmic database',
      action: 'Delete Account',
      color: 'bg-red-500'
    },
    {
      icon: Lock,
      title: 'Opt-Out Rights',
      description: 'Control how your data is used for analytics',
      action: 'Manage Preferences',
      color: 'bg-purple-500'
    }
  ];

  const handleDataTypeClick = (dataType) => {
    setSelectedDataType(dataType);
    setInteractionCount(prev => prev + 1);
    setPrivacyScore(prev => Math.min(prev + 10, 100));
  };

  const activateCosmicShield = () => {
    setCosmicShield(true);
    setTimeout(() => setCosmicShield(false), 3000);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900' 
        : 'bg-white'
    }`}>
      {/* Floating Privacy Icons */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingPrivacyIcons.map(item => {
          const IconComponent = item.Icon;
          return (
            <motion.div
              key={item.id}
              className={`absolute ${isDarkMode ? 'text-indigo-400/20' : 'text-indigo-300/30'}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `scale(${item.scale}) rotate(${item.rotation}deg)`
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [item.rotation, item.rotation + 360, item.rotation],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut"
              }}
            >
              <IconComponent size={24} />
            </motion.div>
          );
        })}
      </div>

      {/* Cosmic Shield Effect */}
      <AnimatePresence>
        {cosmicShield && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear" }}
            >
              <div className="w-96 h-96 border-4 border-cyan-400 rounded-full animate-pulse">
                <div className="w-full h-full border-2 border-purple-400 rounded-full animate-spin">
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield className="w-24 h-24 text-cyan-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent'
            }`}
            animate={{
              backgroundPosition: ['0%', '100%', '0%'],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto mb-8`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Your data is sacred in our cosmic realm. Discover how we protect your digital essence.
          </motion.p>

          {/* Privacy Score */}
          <motion.div 
            className="flex items-center justify-center space-x-4 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className={`px-6 py-3 rounded-full backdrop-blur-xl ${
              isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'
            }`}>
              <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Privacy Score: {privacyScore}%
              </span>
            </div>
            <motion.button
              onClick={activateCosmicShield}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🛡️ Activate Cosmic Shield
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Data Categories */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            🌌 Data We Collect
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dataCategories.map((category, index) => {
              const IconComponent = category.icon;
              const isSelected = selectedDataType?.id === category.id;
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl backdrop-blur-xl border cursor-pointer transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white/80 border-gray-200/50 hover:bg-white/90'
                  } ${isSelected ? 'ring-2 ring-purple-500/50 shadow-lg' : ''}`}
                  onClick={() => handleDataTypeClick(category)}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {category.title}
                  </h3>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {category.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Data Type Details */}
          <AnimatePresence>
            {selectedDataType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-2xl backdrop-blur-xl border p-8 ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/90 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-6">
                  <motion.div
                    className={`p-4 rounded-xl bg-gradient-to-r ${selectedDataType.color}`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <selectedDataType.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {selectedDataType.title}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className={`text-lg font-semibold mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          What We Collect:
                        </h4>
                        <ul className="space-y-2">
                          {selectedDataType.data.map((item, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-lg font-semibold mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Protection Method:
                        </h4>
                        <div className={`p-4 rounded-xl ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className={`font-semibold ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>
                              {selectedDataType.protection}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Your data is protected with military-grade cosmic encryption
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Privacy Rights */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            ⚖️ Your Privacy Rights
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {privacyRights.map((right, index) => {
              const IconComponent = right.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl backdrop-blur-xl border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white/80 border-gray-200/50 hover:bg-white/90'
                  } transition-all duration-300 group cursor-pointer`}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="flex items-start space-x-4">
                    <motion.div
                      className={`p-3 rounded-xl ${right.color} text-white`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {right.title}
                      </h3>
                      <p className={`text-sm mb-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {right.description}
                      </p>
                      <motion.button
                        className={`px-4 py-2 text-sm font-semibold rounded-lg ${right.color} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {right.action}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Interaction Statistics */}
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className={`p-6 rounded-2xl backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30' 
              : 'bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200'
          }`}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center"
            >
              <Fingerprint className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              🎯 Privacy Engagement Score
            </h3>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              You've interacted with {interactionCount} privacy sections
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: i < Math.floor(interactionCount / 2) ? [1, 1.2, 1] : 1,
                    opacity: i < Math.floor(interactionCount / 2) ? 1 : 0.3
                  }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Star className="w-6 h-6 text-yellow-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div 
          className="text-center mt-16 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Last updated: January 2024 | Secured by Cosmic Privacy Protocols
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
