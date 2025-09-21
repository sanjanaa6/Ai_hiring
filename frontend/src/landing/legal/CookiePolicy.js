import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  Cookie, 
  Shield, 
  BarChart3, 
  Settings, 
  Eye,
  Zap,
  Globe,
  Lock,
  Star,
  Trophy,
  Target,
  Sparkles,
  Heart,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Gamepad2,
  Gift,
  Coins,
  Award,
  Timer
} from 'lucide-react';

const CookiePolicy = () => {
  const { isDarkMode } = useTheme();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false
  });
  const [cookiesCollected, setCookiesCollected] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [achievementUnlocked, setAchievementUnlocked] = useState(null);
  const [floatingCookies, setFloatingCookies] = useState([]);
  const [cookieLevel, setCookieLevel] = useState(1);
  const [showCookieGame, setShowCookieGame] = useState(false);

  useEffect(() => {
    // Initialize floating cookies
    const cookies = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 20,
      rotation: Math.random() * 360,
      delay: Math.random() * 4,
      speed: Math.random() * 2 + 1
    }));
    setFloatingCookies(cookies);
  }, []);

  const cookieTypes = [
    {
      id: 'essential',
      name: '🍪 Essential Cookies',
      icon: Shield,
      description: 'Critical for basic website functionality',
      color: 'from-green-500 to-emerald-500',
      required: true,
      purpose: 'Authentication, security, basic functionality',
      examples: ['Login sessions', 'Security tokens', 'Language preferences'],
      duration: 'Session or 1 year',
      points: 50
    },
    {
      id: 'analytics',
      name: '📊 Analytics Cookies',
      icon: BarChart3,
      description: 'Help us understand how you use our cosmic platform',
      color: 'from-blue-500 to-cyan-500',
      required: false,
      purpose: 'Usage analytics, performance monitoring',
      examples: ['Page views', 'Time spent', 'Feature usage'],
      duration: '2 years',
      points: 30
    },
    {
      id: 'marketing',
      name: '🎯 Marketing Cookies',
      icon: Target,
      description: 'Deliver personalized cosmic advertisements',
      color: 'from-purple-500 to-pink-500',
      required: false,
      purpose: 'Ad personalization, cross-platform tracking',
      examples: ['Ad preferences', 'Campaign tracking', 'Social media pixels'],
      duration: '1 year',
      points: 20
    },
    {
      id: 'personalization',
      name: '✨ Personalization Cookies',
      icon: Sparkles,
      description: 'Customize your galactic learning experience',
      color: 'from-orange-500 to-red-500',
      required: false,
      purpose: 'Custom themes, preferences, recommendations',
      examples: ['UI preferences', 'Course recommendations', 'Dark mode settings'],
      duration: '6 months',
      points: 40
    }
  ];

  const achievements = [
    { id: 1, name: 'Cookie Connoisseur', description: 'Enabled 2+ cookie types', icon: Star, threshold: 2 },
    { id: 2, name: 'Privacy Guardian', description: 'Carefully chose your preferences', icon: Shield, threshold: 1 },
    { id: 3, name: 'Cosmic Explorer', description: 'Collected 10+ cookies in game', icon: Trophy, threshold: 10 },
    { id: 4, name: 'Cookie Master', description: 'Reached level 5 in cookie game', icon: Award, threshold: 5 }
  ];

  const handleCookieToggle = (cookieType) => {
    if (cookieType === 'essential') return; // Can't disable essential cookies
    
    setCookiePreferences(prev => {
      const newPrefs = { ...prev, [cookieType]: !prev[cookieType] };
      
      // Calculate score and check achievements
      const enabledCount = Object.values(newPrefs).filter(Boolean).length;
      setGameScore(enabledCount * 25);
      
      // Check for achievements
      checkAchievements(enabledCount);
      
      return newPrefs;
    });
  };

  const checkAchievements = (enabledCount) => {
    const newAchievement = achievements.find(
      achievement => enabledCount >= achievement.threshold && !achievementUnlocked
    );
    
    if (newAchievement) {
      setAchievementUnlocked(newAchievement);
      setTimeout(() => setAchievementUnlocked(null), 3000);
    }
  };

  const collectCookie = (cookieId) => {
    setCookiesCollected(prev => prev + 1);
    setGameScore(prev => prev + 10);
    
    // Level up every 5 cookies
    if ((cookiesCollected + 1) % 5 === 0) {
      setCookieLevel(prev => prev + 1);
    }
    
    // Remove collected cookie
    setFloatingCookies(prev => prev.filter(cookie => cookie.id !== cookieId));
  };

  const resetCookieGame = () => {
    setCookiesCollected(0);
    setGameScore(0);
    setCookieLevel(1);
    
    // Regenerate cookies
    const cookies = Array.from({ length: 40 }, (_, i) => ({
      id: i + Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 20,
      rotation: Math.random() * 360,
      delay: Math.random() * 4,
      speed: Math.random() * 2 + 1
    }));
    setFloatingCookies(cookies);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900' 
        : 'bg-white'
    }`}>
      {/* Floating Cookies */}
      <div className="fixed inset-0 overflow-hidden">
        {floatingCookies.map(cookie => (
          <motion.div
            key={cookie.id}
            className={`absolute cursor-pointer ${showCookieGame ? 'pointer-events-auto' : 'pointer-events-none'} ${
              isDarkMode ? 'text-orange-400/40' : 'text-orange-500/50'
            }`}
            style={{
              left: `${cookie.x}%`,
              top: `${cookie.y}%`,
              fontSize: `${cookie.size}px`,
              transform: `rotate(${cookie.rotation}deg)`
            }}
            animate={{
              y: [0, -40, 0],
              rotate: [cookie.rotation, cookie.rotation + 360],
              scale: showCookieGame ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: cookie.speed * 4,
              repeat: Infinity,
              delay: cookie.delay,
              ease: "easeInOut"
            }}
            onClick={() => showCookieGame && collectCookie(cookie.id)}
            whileHover={showCookieGame ? { scale: 1.3 } : {}}
          >
            <Cookie />
          </motion.div>
        ))}
      </div>

      {/* Achievement Notification */}
      <AnimatePresence>
        {achievementUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
              isDarkMode 
                ? 'bg-gradient-to-r from-yellow-900/90 to-orange-900/90 border-yellow-500/50' 
                : 'bg-gradient-to-r from-yellow-100/90 to-orange-100/90 border-yellow-300'
            } shadow-2xl`}>
              <div className="flex items-center space-x-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <achievementUnlocked.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    🏆 Achievement Unlocked!
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {achievementUnlocked.name}: {achievementUnlocked.description}
                  </p>
                </div>
              </div>
            </div>
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
                ? 'bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-orange-600 via-yellow-600 to-red-600 bg-clip-text text-transparent'
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
            Cookie Policy
          </motion.h1>
          <motion.p 
            className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto mb-8`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sweet digital cookies that enhance your cosmic learning experience
          </motion.p>

          {/* Game Stats */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className={`px-6 py-3 rounded-full backdrop-blur-xl ${
              isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'
            }`}>
              <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                🍪 Collected: {cookiesCollected}
              </span>
            </div>
            <div className={`px-6 py-3 rounded-full backdrop-blur-xl ${
              isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'
            }`}>
              <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                ⭐ Score: {gameScore}
              </span>
            </div>
            <div className={`px-6 py-3 rounded-full backdrop-blur-xl ${
              isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'
            }`}>
              <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                🎮 Level: {cookieLevel}
              </span>
            </div>
            <motion.button
              onClick={() => setShowCookieGame(!showCookieGame)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                showCookieGame 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                  : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
              } hover:shadow-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Gamepad2 className="w-5 h-5 mr-2 inline" />
              {showCookieGame ? 'Stop Cookie Hunt' : 'Start Cookie Hunt!'}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Cookie Types */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            🍪 Types of Cosmic Cookies
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {cookieTypes.map((cookie, index) => {
              const IconComponent = cookie.icon;
              const isEnabled = cookiePreferences[cookie.id];
              
              return (
                <motion.div
                  key={cookie.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-8 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white/80 border-gray-200/50 hover:bg-white/90'
                  } ${isEnabled ? 'ring-2 ring-orange-500/30' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        className={`p-3 rounded-xl bg-gradient-to-r ${cookie.color}`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {cookie.name}
                        </h3>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {cookie.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle */}
                    <motion.button
                      onClick={() => handleCookieToggle(cookie.id)}
                      disabled={cookie.required}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        cookie.required 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'hover:scale-110'
                      }`}
                      whileHover={!cookie.required ? { scale: 1.1 } : {}}
                      whileTap={!cookie.required ? { scale: 0.9 } : {}}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </motion.button>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className={`text-sm font-semibold mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Purpose:
                      </h4>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {cookie.purpose}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className={`text-sm font-semibold mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Examples:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {cookie.examples.map((example, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs ${
                              isDarkMode 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Duration: 
                        </span>
                        <span className={`text-sm font-semibold ml-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {cookie.duration}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className={`text-sm font-semibold ${
                          isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`}>
                          +{cookie.points} points
                        </span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      isEnabled 
                        ? isDarkMode 
                          ? 'bg-green-900/30 border border-green-500/30' 
                          : 'bg-green-100 border border-green-200'
                        : isDarkMode 
                          ? 'bg-gray-700/30 border border-gray-600/30' 
                          : 'bg-gray-100 border border-gray-200'
                    }`}>
                      {isEnabled ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            {cookie.required ? 'Required - Always Active' : 'Enabled'}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-gray-400" />
                          <span className={`text-sm font-semibold ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Disabled
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Cookie Management */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            🎛️ Cookie Management Center
          </motion.h2>
          
          <div className={`p-8 rounded-2xl backdrop-blur-xl border ${
            isDarkMode 
              ? 'bg-white/10 border-white/20' 
              : 'bg-white/90 border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.button
                className="p-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <CheckCircle className="w-8 h-8 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Accept All</h3>
                <p className="text-sm opacity-90">Enable all cosmic cookies for full experience</p>
              </motion.button>
              
              <motion.button
                className="p-6 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white text-center hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-8 h-8 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Customize</h3>
                <p className="text-sm opacity-90">Choose your preferred cookie settings</p>
              </motion.button>
              
              <motion.button
                className="p-6 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-center hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <XCircle className="w-8 h-8 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Reject Optional</h3>
                <p className="text-sm opacity-90">Only essential cookies (required)</p>
              </motion.button>
            </div>
            
            {/* Cookie Clear Button */}
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.button
                onClick={resetCookieGame}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Cookie className="w-5 h-5 mr-2 inline" />
                Clear All Cookies & Reset Game
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Cookie Fun Facts */}
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className={`p-8 rounded-2xl backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-500/30' 
              : 'bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200'
          }`}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center"
            >
              <Cookie className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              🍪 Did You Know?
            </h3>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              The term "cookie" in computing was coined by web browser programmer Lou Montulli in 1994. 
              It was derived from "magic cookie," a term used in Unix systems!
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {Object.values(cookiePreferences).filter(Boolean).length}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Types Enabled
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {gameScore}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Privacy Score
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div 
          className="text-center mt-16 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Last updated: January 2024 | Baked with Cosmic Love 🍪✨
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicy;
