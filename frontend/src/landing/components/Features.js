import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  BarChart3, 
  Users, 
  Zap,
  Sparkles,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Target,
  Rocket,
  Heart,
  Crown,
  Gift,
  Award,
  TrendingUp,
  Globe,
  Eye
} from 'lucide-react';

const Features = () => {
  const { isDarkMode } = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);


  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const features = [
    {
      icon: Brain,
      title: "Advanced Code Analysis",
      description: "Advanced AI conducts intelligent interviews that adapt to each candidate's responses and provides real-time analysis with 95% accuracy.",
      gradient: "from-blue-500 to-purple-600",
      bgGradient: "from-blue-50 to-cyan-50",
      darkBgGradient: "from-blue-900/20 to-cyan-900/20",
      delay: 0,
      stats: "95% Accuracy",
      color: "blue",
      secondaryIcon: Sparkles,
      iconStyle: "squircle-blue-purple"
    },
    {
      icon: Eye,
      title: "Real-time AI Proctoring",
      description: "Reduce time-to-hire by 70% with automated screening, instant candidate evaluation, and real-time decision making.",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-yellow-50 to-orange-50",
      darkBgGradient: "from-yellow-900/20 to-orange-900/20",
      delay: 0.1,
      stats: "70% Faster",
      color: "orange",
      secondaryIcon: Rocket,
      iconStyle: "squircle-orange"
    },
    {
      icon: Target,
      title: "Performance Insights",
      description: "Eliminate unconscious bias with objective AI evaluation based on skills, experience, and cultural fit analysis.",
      gradient: "from-purple-500 to-purple-700",
      bgGradient: "from-emerald-50 to-teal-50",
      darkBgGradient: "from-emerald-900/20 to-teal-900/20",
      delay: 0.2,
      stats: "100% Fair",
      color: "purple",
      secondaryIcon: Award,
      iconStyle: "squircle-purple"
    },
    {
      icon: Shield,
      title: "Instant Evaluation",
      description: "Get detailed insights into your hiring process with comprehensive analytics, performance metrics, and predictive modeling.",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-purple-50 to-pink-50",
      darkBgGradient: "from-purple-900/20 to-pink-900/20",
      delay: 0.3,
      stats: "Real-time Data",
      color: "green",
      secondaryIcon: TrendingUp,
      iconStyle: "squircle-green"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Enable your entire hiring team to collaborate seamlessly, share feedback, and make informed decisions together.",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-50 to-blue-50",
      darkBgGradient: "from-indigo-900/20 to-blue-900/20",
      delay: 0.4,
      stats: "Unlimited Users",
      color: "indigo",
      secondaryIcon: Heart,
      iconStyle: "squircle-indigo"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Conduct interviews in multiple languages and time zones to find the best talent worldwide with seamless integration.",
      gradient: "from-rose-500 to-red-500",
      bgGradient: "from-rose-50 to-red-50",
      darkBgGradient: "from-rose-900/20 to-red-900/20",
      delay: 0.5,
      stats: "50+ Languages",
      color: "rose",
      secondaryIcon: Crown,
      iconStyle: "squircle-rose"
    }
  ];



  return (
    <section 
      id="features" 
      ref={ref}
      className={`relative py-24 overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
      }`}
    >
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Feature Icons */}
        {[...Array(20)].map((_, i) => {
          const icons = [Brain, Zap, Shield, BarChart3, Users, Globe, Sparkles, Rocket, Heart, Crown];
          const IconComponent = icons[i % icons.length];
          return (
          <motion.div
            key={i}
              className={`absolute ${
                isDarkMode ? 'text-blue-400/10' : 'text-blue-500/5'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
                y: [0, -100, 0],
                rotate: [0, 360, 0],
                opacity: [0, 0.3, 0],
              scale: [0, 1, 0],
            }}
            transition={{
                duration: Math.random() * 10 + 15,
              repeat: Infinity,
                delay: Math.random() * 5,
              }}
            >
              <IconComponent className="w-8 h-8" />
            </motion.div>
          );
        })}
        
        {/* Large Floating Orbs */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-blue-500/5 to-cyan-500/5' : 'bg-gradient-to-r from-blue-400/10 to-cyan-400/10'
          } blur-3xl`}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5' : 'bg-gradient-to-r from-emerald-400/10 to-teal-400/10'
          } blur-3xl`}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Gift className="w-4 h-4 text-blue-500" />
            </motion.div>
            <span className="text-blue-600 font-semibold">Powerful Features</span>
          </motion.div>

          <motion.h2 
            className={`text-4xl md:text-6xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <motion.span 
              className="block"
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Revolutionary
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              AI Features
            </motion.span>
          </motion.h2>
          
          <motion.p 
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Experience the future of hiring with our 
            <motion.span 
              className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {" "}6 game-changing features
            </motion.span>
            {" "}that transform your recruitment process.
          </motion.p>
        </motion.div>

        {/* Interactive Features Showcase */}
        <div className="relative">
          {/* Feature Navigation */}
        <motion.div 
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 1.4, duration: 0.8 }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
            return (
                <motion.button
                key={index}
                  onClick={() => {
                    setActiveFeature(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${feature.gradient} text-white shadow-xl`
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -5 : 0
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ 
                        rotate: isActive ? 360 : 0,
                        scale: isActive ? 1.2 : 1
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </motion.div>
                    <span className="text-sm">{feature.title.split(' ')[0]}</span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                  <motion.div
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    />
                  )}
                </motion.button>
            );
          })}
        </motion.div>

          {/* Auto-play Controls */}
        <motion.div 
            className="flex justify-center items-center space-x-4 mb-12"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            <motion.button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-3 rounded-full transition-all duration-300 ${
                isAutoPlaying 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              onClick={() => setActiveFeature(0)}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Feature Display */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <AnimatePresence mode="wait">
              {features.map((feature, index) => {
                if (index !== activeFeature) return null;
                
                const IconComponent = feature.icon;
                const SecondaryIcon = feature.secondaryIcon;
                
                return (
                  <motion.div
                    key={index}
            className={`relative overflow-hidden rounded-3xl p-12 backdrop-blur-xl border ${
              isDarkMode 
                        ? `bg-gradient-to-br ${feature.darkBgGradient} border-gray-600/50` 
                        : `bg-gradient-to-br ${feature.bgGradient} border-gray-200/50`
                    } shadow-2xl`}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
                    {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                        className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-r ${feature.gradient} opacity-10 blur-2xl`}
                animate={{
                          scale: [1, 1.5, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                          duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
                      
              <motion.div
                        className={`absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-r ${feature.gradient} opacity-10 blur-2xl`}
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                }}
                transition={{
                          duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

                    <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      {/* Left Side - Content */}
                      <div>
              <motion.div
                          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-gradient-to-r ${feature.gradient} text-white`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                            <SecondaryIcon className="w-4 h-4" />
                </motion.div>
                          <span>{feature.stats}</span>
              </motion.div>

              <motion.h3 
                          className={`text-4xl md:text-5xl font-bold mb-6 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                        >
                          {feature.title}
              </motion.h3>
              
              <motion.p 
                          className={`text-xl leading-relaxed mb-8 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                        >
                          {feature.description}
              </motion.p>
              
                <motion.button 
                          className={`group relative px-8 py-4 bg-gradient-to-r ${feature.gradient} text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8, duration: 0.8 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                          
                          <div className="relative flex items-center space-x-2">
                            <span>Learn More</span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ArrowRight className="w-5 h-5" />
                            </motion.div>
                          </div>
                        </motion.button>
                      </div>

                      {/* Right Side - Visual */}
                      <div className="relative flex justify-center">
                        <motion.div
                          className={`w-48 h-48 mx-auto rounded-[2rem] bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-2xl relative overflow-hidden`}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100 }}
                          whileHover={{ 
                            scale: 1.05, 
                            rotate: 2,
                            transition: { duration: 0.3 }
                          }}
                          style={{
                            borderRadius: '2rem'
                          }}
                        >
                          {/* Subtle glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[2rem]" />
                          
                          <motion.div
                            animate={{ 
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ 
                              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                            }}
                          >
                            <IconComponent className="w-24 h-24 text-white stroke-2" />
                          </motion.div>
                        </motion.div>

                        {/* Floating Elements */}
                  <div className="absolute inset-0 overflow-hidden">
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`}
                              style={{
                                left: `${20 + i * 15}%`,
                                top: `${30 + i * 10}%`,
                              }}
                              animate={{
                                y: [0, -30, 0],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Shine Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0"
                      animate={{
                        x: ['-100%', '100%'],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
