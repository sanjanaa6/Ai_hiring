import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  MessageCircle, 
  Brain,
  ArrowRight,
  Sparkles,
  Rocket,
  Shield,
  TrendingUp,
  Star,
  Play,
  Pause
} from 'lucide-react';

const HowItWorks = () => {
  const { isDarkMode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 6);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Smart Job Creation",
      description: "AI-powered job posting with intelligent requirement extraction and optimization.",
      details: [
        "Auto-extract job requirements",
        "Optimize job descriptions",
        "Set intelligent criteria"
      ],
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      darkBgColor: "from-blue-900/20 to-cyan-900/20",
      delay: 0
    },
    {
      number: "02",
      icon: MessageCircle,
      title: "AI Interview Engine",
      description: "Advanced conversational AI conducts natural, adaptive interviews 24/7.",
      details: [
        "Natural conversation flow",
        "Real-time adaptation",
        "Multi-language support"
      ],
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
      darkBgColor: "from-emerald-900/20 to-teal-900/20",
      delay: 0.2
    },
    {
      number: "03",
      icon: Brain,
      title: "Deep AI Analysis",
      description: "Comprehensive analysis of technical skills, soft skills, and cultural alignment.",
      details: [
        "Technical competency scoring",
        "Communication assessment",
        "Cultural fit analysis"
      ],
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
      darkBgColor: "from-orange-900/20 to-red-900/20",
      delay: 0.4
    },
    {
      number: "04",
      icon: Shield,
      title: "Bias-Free Evaluation",
      description: "Fair, unbiased assessment ensuring equal opportunities for all candidates.",
      details: [
        "Bias detection & removal",
        "Fair scoring algorithms",
        "Diversity metrics"
      ],
      color: "from-indigo-500 to-blue-500",
      bgColor: "from-indigo-50 to-blue-50",
      darkBgColor: "from-indigo-900/20 to-blue-900/20",
      delay: 0.6
    },
    {
      number: "05",
      icon: TrendingUp,
      title: "Smart Ranking",
      description: "Intelligent candidate ranking based on multiple factors and predictive analytics.",
      details: [
        "Predictive success scoring",
        "Multi-factor ranking",
        "Success probability"
      ],
      color: "from-violet-500 to-purple-500",
      bgColor: "from-violet-50 to-purple-50",
      darkBgColor: "from-violet-900/20 to-purple-900/20",
      delay: 0.8
    },
    {
      number: "06",
      icon: Rocket,
      title: "Instant Hiring",
      description: "Get your top candidates with detailed reports and hiring recommendations.",
      details: [
        "Top candidate selection",
        "Detailed reports",
        "Hiring recommendations"
      ],
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-50 to-rose-50",
      darkBgColor: "from-pink-900/20 to-rose-900/20",
      delay: 1.0
    }
  ];


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <section id="how-it-works" className={`relative py-24 overflow-hidden ${
        isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              isDarkMode ? 'bg-blue-400/20' : 'bg-blue-500/10'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
                        animate={{
                          y: [0, -100, 0],
                          opacity: [0, 1, 0],
              scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: Math.random() * 8 + 8,
              repeat: Infinity,
              delay: Math.random() * 3,
                        }}
          />
        ))}
        
        {/* Large Floating Orbs */}
        <motion.div
          className={`absolute top-1/3 left-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-blue-500/5 to-cyan-500/5' : 'bg-gradient-to-r from-blue-400/10 to-cyan-400/10'
          } blur-3xl`}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div
          className={`absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5' : 'bg-gradient-to-r from-emerald-400/10 to-teal-400/10'
          } blur-3xl`}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <motion.div 
          className="text-center mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
            </motion.div>
            <span className="text-blue-600 font-semibold">How It Works</span>
          </motion.div>

          <motion.h2 
            variants={itemVariants}
            className={`text-4xl md:text-6xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              The Future of
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              AI Hiring
            </motion.span>
          </motion.h2>
          
          <motion.p 
            variants={itemVariants}
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Experience the most advanced AI-powered hiring platform that revolutionizes recruitment with 
            <motion.span 
              className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {" "}intelligent automation
            </motion.span>
            , fair assessments, and predictive analytics.
          </motion.p>

          {/* Interactive Play Button */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center mt-8"
          >
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white' 
                  : 'bg-white/50 border border-gray-200/50 text-gray-700 hover:text-gray-900'
              } backdrop-blur-sm hover:backdrop-blur-md`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: isPlaying ? 0 : 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </motion.div>
                <span>{isPlaying ? 'Pause Demo' : 'Play Demo'}</span>
                </div>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Enhanced 6-Step Process */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = activeStep === index;
            
            return (
              <motion.div 
                key={index} 
                className="relative group" 
                variants={itemVariants}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: isActive ? 1.05 : 1,
                  rotateY: isActive ? 5 : 0
                }}
                transition={{ 
                  delay: step.delay,
                  type: "spring",
                  stiffness: 100,
                  damping: 12
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                onHoverStart={() => setActiveStep(index)}
              >
                {/* 3D Card Container */}
                  <motion.div 
                  className={`relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl border transition-all duration-500 ${
                    isDarkMode 
                      ? `bg-gradient-to-br ${step.darkBgColor} border-gray-700/50` 
                      : `bg-gradient-to-br ${step.bgColor} border-gray-200/50`
                  } shadow-2xl hover:shadow-3xl`}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                  animate={{
                    boxShadow: isActive 
                      ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
                      : '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Animated Background Gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    animate={{
                      opacity: isActive ? 0.1 : 0
                    }}
                  />

                  {/* Floating Particles */}
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${step.color}`}
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

                  {/* Step Number and Icon Side by Side */}
                  <motion.div 
                    className="flex items-center space-x-4 mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay + 0.2 }}
                  >
                    {/* Step Number with 3D Effect */}
                    <motion.div 
                      className={`relative w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl`}
                      animate={{
                        rotateY: isActive ? 10 : 0,
                        scale: isActive ? 1.1 : 1,
                      }}
                      whileHover={{ 
                        rotateY: 15,
                        scale: 1.15,
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <motion.span
                        animate={{ 
                          textShadow: isActive 
                            ? '0 0 20px rgba(255, 255, 255, 0.5)' 
                            : '0 0 0px rgba(255, 255, 255, 0)'
                        }}
                      >
                        {step.number}
                      </motion.span>
                      
                      {/* Glow Effect */}
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl blur-lg opacity-0`}
                        animate={{
                          opacity: isActive ? 0.3 : 0,
                          scale: isActive ? 1.2 : 1
                        }}
                      />
                    </motion.div>

                    {/* Animated Icon */}
                    <motion.div 
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg`}
                      animate={{ 
                        rotate: isActive ? 360 : 0,
                        scale: isActive ? 1.1 : 1
                      }}
                      whileHover={{ 
                        rotate: 360, 
                        scale: 1.2,
                        transition: { duration: 0.6 }
                      }}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                      </motion.div>
                    </motion.div>

                  {/* Content */}
                    <motion.h3 
                      className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    animate={{
                      color: isActive 
                        ? (isDarkMode ? '#60a5fa' : '#2563eb')
                        : (isDarkMode ? '#ffffff' : '#111827')
                    }}
                      >
                        {step.title}
                    </motion.h3>

                    <motion.p 
                      className={`mb-6 leading-relaxed transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    animate={{
                      opacity: isActive ? 1 : 0.8
                    }}
                    >
                      {step.description}
                    </motion.p>

                  {/* Animated Details */}
                  <motion.div className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                    <motion.div 
                          key={detailIndex} 
                        className="flex items-center space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                            animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { delay: step.delay + 0.5 + detailIndex * 0.1 }
                        }}
                      >
                            <motion.div
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
                              animate={{
                            scale: isActive ? [1, 1.5, 1] : 1,
                            opacity: isActive ? [1, 0.5, 1] : 1
                              }}
                              transition={{
                            duration: 1.5,
                                repeat: Infinity,
                            delay: detailIndex * 0.2
                              }}
                            />
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {detail}
                        </span>
                      </motion.div>
                      ))}
                  </motion.div>

                  {/* Progress Indicator */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: isActive ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className={`h-full bg-gradient-to-r ${step.color}`}
                      animate={{
                        opacity: isActive ? 1 : 0
                      }}
                    />
                  </motion.div>

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0"
                    animate={{
                      x: isActive ? ['-100%', '100%'] : '-100%',
                      opacity: isActive ? [0, 1, 0] : 0
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                {/* Connection Arrow */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-1/2 -right-4 z-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay + 0.3 }}
                  >
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      } shadow-lg`}
                      animate={{
                        scale: isActive ? 1.2 : 1,
                        rotate: isActive ? 360 : 0
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <ArrowRight className={`w-4 h-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Interactive Timeline Summary */}
        <motion.div 
          className={`relative rounded-3xl p-12 backdrop-blur-xl border transition-all duration-500 ${
          isDarkMode 
              ? 'bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-gray-600/50' 
              : 'bg-gradient-to-br from-white/80 to-blue-50/80 border-gray-200/50'
          } shadow-2xl`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
          
          <div className="relative text-center">
            <motion.div
              className="inline-flex items-center space-x-3 px-6 py-3 rounded-full text-lg font-bold mb-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-6 h-6 text-blue-500" />
              </motion.div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Ready to Transform Your Hiring?
              </span>
            </motion.div>

            <motion.h3 
              className={`text-3xl md:text-4xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            >
              From Job Post to Perfect Hire in 
              <motion.span 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {" "}6 Simple Steps
              </motion.span>
            </motion.h3>

            <motion.p 
              className={`text-xl max-w-3xl mx-auto leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
            >
              Our AI-powered platform revolutionizes recruitment with intelligent automation, 
              fair assessments, and predictive analytics. Experience the future of hiring today.
            </motion.p>

            {/* Animated Stats */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.6 }}
            >
              {[
                { value: "70%", label: "Faster Hiring", color: "from-blue-500 to-cyan-500" },
                { value: "95%", label: "Accuracy Rate", color: "from-emerald-500 to-teal-500" },
                { value: "24/7", label: "AI Availability", color: "from-orange-500 to-red-500" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center group"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {stat.label}
              </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
