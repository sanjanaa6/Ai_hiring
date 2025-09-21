import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  CheckCircle, 
  Shield, 
  Star,
  Clock,
  Globe,
  Lock,
  Heart,
  Sparkles,
  ChevronDown,
  BookOpen,
  AlertTriangle,
  Award
} from 'lucide-react';

const TermsOfService = () => {
  const { isDarkMode } = useTheme();
  const [readingSections, setReadingSections] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [readingProgress, setReadingProgress] = useState(0);
  const [agreedSections, setAgreedSections] = useState(new Set());
  const [cosmicParticles, setCosmicParticles] = useState([]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Generate cosmic particles
  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2
    }));
    setCosmicParticles(particles);
  }, []);

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: CheckCircle,
      content: `By accessing and using our platform, you agree to be bound by these Terms of Service, our Privacy Policy, and any additional terms and conditions that may apply. If you do not agree with any of these terms, you are prohibited from using or accessing our services.`,
      interactive: true,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'services',
      title: '2. Description of Services',
      icon: Shield,
      content: `Our platform provides online assessment and learning solutions, including but not limited to technical skill assessment and evaluation, coding challenges and practice problems, online courses and learning materials, proctored examinations, performance analytics and reporting, and certificate generation.`,
      interactive: true,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'accounts',
      title: '3. User Accounts',
      icon: Star,
      content: `To access certain features of our platform, you must register for an account. You agree to provide accurate and complete information, maintain the security of your account credentials, accept responsibility for all activities under your account, and notify us immediately of any unauthorized access.`,
      interactive: true,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'payments',
      title: '4. Payment Terms',
      icon: Award,
      content: `Pro Plan subscriptions and other paid services are subject to the following terms: All payments are processed securely through Razorpay, prices are subject to change with notice, refunds are subject to our Refund Policy, and payment information must be accurate and current.`,
      interactive: true,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'intellectual-property',
      title: '5. Intellectual Property',
      icon: BookOpen,
      content: `All content on our platform, including but not limited to text, graphics, logos, images, audio clips, digital downloads, and data compilations, is our property or the property of our licensors and is protected by copyright laws.`,
      interactive: true,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'user-content',
      title: '6. User Content',
      icon: Lock,
      content: `By submitting content to our platform, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content. You represent that you have all necessary rights to grant this license.`,
      interactive: true,
      color: 'from-red-500 to-rose-500'
    },
    {
      id: 'prohibited',
      title: '7. Prohibited Activities',
      icon: AlertTriangle,
      content: `Users are prohibited from violating any applicable laws or regulations, sharing account credentials, attempting to circumvent our security measures, engaging in cheating or plagiarism, and interfering with other users' access to the service.`,
      interactive: true,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'termination',
      title: '8. Termination',
      icon: Globe,
      content: `We reserve the right to terminate or suspend access to our services immediately, without prior notice or liability, for any reason whatsoever, including breach of Terms.`,
      interactive: true,
      color: 'from-teal-500 to-blue-500'
    },
    {
      id: 'liability',
      title: '9. Limitation of Liability',
      icon: Clock,
      content: `To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.`,
      interactive: true,
      color: 'from-gray-500 to-slate-500'
    },
    {
      id: 'changes',
      title: '10. Changes to Terms',
      icon: Sparkles,
      content: `We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform. Continued use of our service after such modifications constitutes acceptance of the updated terms.`,
      interactive: true,
      color: 'from-emerald-500 to-green-500'
    },
    {
      id: 'contact',
      title: '11. Contact Information',
      icon: Star,
      content: `For questions about these Terms of Service, please contact us at gokul@hysteresis.in or visit https://hysteresis.in`,
      interactive: true,
      color: 'from-amber-500 to-yellow-500'
    }
  ];

  const handleSectionRead = (sectionId) => {
    setReadingSections(prev => new Set([...prev, sectionId]));
    const progress = ((readingSections.size + 1) / sections.length) * 100;
    setReadingProgress(progress);
  };

  const handleSectionAgree = (sectionId) => {
    setAgreedSections(prev => new Set([...prev, sectionId]));
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
        handleSectionRead(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-white'
    }`}>
      {/* Cosmic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {cosmicParticles.map(particle => (
          <motion.div
            key={particle.id}
            className={`absolute rounded-full ${
              isDarkMode ? 'bg-white' : 'bg-purple-400'
            }`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity]
            }}
            transition={{
              duration: particle.speed * 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

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
                ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent'
            }`}
            animate={{
              backgroundPosition: ['0%', '100%', '0%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Navigate the cosmic laws that govern our digital universe
          </motion.p>
          
          {/* Reading Progress */}
          <motion.div 
            className="mt-8 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className={`rounded-full p-1 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <motion.div
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${readingProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cosmic Progress: {Math.round(readingProgress)}% Complete
            </p>
          </motion.div>
        </motion.div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            const isExpanded = expandedSections.has(section.id);
            const isRead = readingSections.has(section.id);
            const isAgreed = agreedSections.has(section.id);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-white/80 border-gray-200/50 hover:bg-white/90'
                } ${isRead ? 'ring-2 ring-purple-500/30' : ''}`}
              >
                {/* Section Header */}
                <motion.div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className={`p-3 rounded-xl bg-gradient-to-r ${section.color}`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {section.title}
                        </h3>
                        {isRead && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center space-x-2 mt-1"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500">Read</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className={`w-6 h-6 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Section Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className={`p-6 rounded-xl ${
                          isDarkMode 
                            ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50' 
                            : 'bg-gradient-to-r from-gray-50 to-white'
                        }`}>
                          <p className={`text-lg leading-relaxed mb-6 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {section.content}
                          </p>

                          {/* Interactive Agreement Button */}
                          <motion.button
                            onClick={() => handleSectionAgree(section.id)}
                            disabled={isAgreed}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              isAgreed
                                ? 'bg-green-500 text-white cursor-not-allowed'
                                : `bg-gradient-to-r ${section.color} hover:shadow-lg hover:scale-105 text-white`
                            }`}
                            whileHover={!isAgreed ? { scale: 1.05 } : {}}
                            whileTap={!isAgreed ? { scale: 0.95 } : {}}
                          >
                            {isAgreed ? (
                              <span className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>Agreement Confirmed! ✨</span>
                              </span>
                            ) : (
                              'I Agree to These Terms'
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Final Agreement Section */}
        {agreedSections.size === sections.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mt-12 text-center"
          >
            <motion.div
              className={`p-8 rounded-2xl backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30' 
                  : 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200'
              }`}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(168, 85, 247, 0.4)',
                  '0 0 40px rgba(168, 85, 247, 0.6)',
                  '0 0 20px rgba(168, 85, 247, 0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className={`text-2xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                🎉 Terms of Service Complete!
              </h3>
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                You've successfully reviewed all terms and conditions! Your account is now fully compliant with our service agreement. ✨
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Last Updated */}
        <motion.div 
          className="text-center mt-16 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Last updated: January 2024 | Your trust is our foundation ✨
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
