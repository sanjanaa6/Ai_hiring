import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Users, Building2, TrendingUp, Sparkles, Zap, Target, Brain, Rocket, Cpu, Network } from 'lucide-react';

const Hero = () => {
  const { isDarkMode } = useTheme();
  

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
    <section className={`relative pt-16 min-h-screen flex items-center overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDarkMode ? 'bg-blue-400/30' : 'bg-blue-500/20'
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
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
        
        {/* Large Floating Orbs */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-blue-400/20 to-cyan-400/20'
          } blur-3xl`}
          animate={{
            scale: [1, 1.2, 1],
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
            isDarkMode ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-r from-emerald-400/20 to-teal-400/20'
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

        {/* Grid Pattern */}
        <div className={`absolute inset-0 opacity-5 ${
          isDarkMode ? 'bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)]' : 'bg-[radial-gradient(circle_at_1px_1px,_black_1px,_transparent_0)]'
        }`} style={{ backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Content */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <div className="space-y-6">
              {/* Animated Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Powered by Advanced AI</span>
              </motion.div>

              {/* Animated Title */}
              <div className="space-y-2">
                <motion.h1 
                  className={`text-5xl md:text-7xl font-bold leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8, type: "spring", stiffness: 100 }}
                >
                  <motion.span
                    className="block"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                AI-Powered
                  </motion.span>
                  <motion.span
                    className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                  >
                    Hiring Platform
                  </motion.span>
                </motion.h1>

                {/* Animated Subtitle */}
                <motion.p 
                  className={`text-xl md:text-2xl leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  Transform your hiring process with intelligent automation, 
                  <motion.span 
                    className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {" "}fair assessments
                  </motion.span>
                  , and data-driven insights.
                </motion.p>
              </div>
            </div>

            {/* Animated CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
              <Link
                to="/register"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white px-10 py-5 rounded-2xl text-lg font-semibold flex items-center justify-center space-x-3 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  
                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      animate={{
                        x: [0, 100, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                    ></motion.div>
                    <motion.div
                      animate={{
                        x: [0, -100, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                      className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                    ></motion.div>
                  </div>

                  <div className="relative z-10 flex items-center space-x-3">
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Rocket className="w-6 h-6" />
                    </motion.div>
                <span>Start Free Trial</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Shine effect */}
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  ></motion.div>
              </Link>
              </motion.div>

              <motion.button 
                className={`group relative overflow-hidden border-2 px-10 py-5 rounded-2xl text-lg font-semibold flex items-center justify-center space-x-3 transition-all duration-300 ${
                isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 bg-gray-800/50 hover:bg-gray-700/50' 
                    : 'border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 bg-white/50 hover:bg-white/80'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Play className="w-6 h-6" />
                </motion.div>
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Animated Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              {[
                { 
                  value: "10K+", 
                  label: "Companies", 
                  icon: Building2,
                  color: "from-blue-500 to-cyan-500",
                  delay: 0
                },
                { 
                  value: "1M+", 
                  label: "Interviews", 
                  icon: Users,
                  color: "from-emerald-500 to-teal-500",
                  delay: 0.1
                },
                { 
                  value: "95%", 
                  label: "Accuracy", 
                  icon: Target,
                  color: "from-orange-500 to-red-500",
                  delay: 0.2
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0 + stat.delay, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div
                    className={`relative p-6 rounded-2xl ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border border-gray-700/50' 
                        : 'bg-white/50 border border-gray-200/50'
                    } backdrop-blur-sm hover:backdrop-blur-md transition-all duration-300`}
                    whileHover={{ 
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                      borderColor: isDarkMode ? "rgba(59, 130, 246, 0.5)" : "rgba(59, 130, 246, 0.3)"
                    }}
                  >
                    {/* Animated Icon */}
                    <motion.div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>

                    {/* Animated Counter */}
                    <motion.div
                      className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        delay: 2.2 + stat.delay, 
                        type: "spring", 
                        stiffness: 200 
                      }}
                    >
                      {stat.value}
                    </motion.div>

                    <div className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {stat.label}
            </div>

                    {/* Hover effect particles */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${stat.color}`}
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${20 + i * 20}%`,
                          }}
                          animate={{
                            y: [0, -20, 0],
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
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Animated Visual */}
          <motion.div 
            className="relative"
            variants={itemVariants}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
          >
            {/* Floating Elements */}
            <motion.div
              className="absolute -top-6 -right-6 z-10"
              animate={{
                y: [-10, 10, -10],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-8 h-8" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 z-10"
              animate={{
                y: [10, -10, 10],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-2xl">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-8 h-8" />
                </motion.div>
              </div>
            </motion.div>

            {/* 3D AI Brain Visualization Card */}
            <motion.div
              className={`relative rounded-3xl shadow-2xl p-8 backdrop-blur-xl border ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50' 
                  : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50'
              }`}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                {/* Floating Neural Network */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={`neural-${i}`}
                    className={`absolute w-1 h-1 ${
                      ['bg-blue-400', 'bg-green-400', 'bg-orange-400', 'bg-purple-400', 'bg-pink-400'][i % 5]
                    } rounded-full opacity-60`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeInOut"
                    }}
                  />
                ))}

                {/* Gradient Waves */}
                <motion.div
                  className={`absolute inset-0 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-blue-900/10 via-transparent to-purple-900/10'
                      : 'bg-gradient-to-r from-blue-100/30 via-transparent to-purple-100/30'
                  }`}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>

              {/* Header */}
              <div className="relative z-10 text-center mb-8">
                <motion.div
                  className="flex items-center justify-center space-x-3 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.7, duration: 0.6 }}
                >
                  <motion.div
                    className={`p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600`}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 20px rgba(59, 130, 246, 0.3)",
                        "0 0 40px rgba(147, 51, 234, 0.5)",
                        "0 0 20px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Brain className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      AI Hiring Intelligence
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Smart candidate assessment system
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* 3D Brain Visualization */}
              <div className="relative flex items-center justify-center mb-8">
                <motion.div
                  className={`relative w-64 h-64 rounded-full flex items-center justify-center shadow-2xl ${
                    isDarkMode ? 'bg-gray-800/70 border border-gray-700/50' : 'bg-white/70 border border-gray-200/50'
                  } backdrop-blur-xl`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Outer Rings */}
                  <motion.div
                    className={`absolute w-full h-full rounded-full border-2 ${isDarkMode ? 'border-blue-500/30' : 'border-blue-300/30'}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className={`absolute w-[80%] h-[80%] rounded-full border-2 ${isDarkMode ? 'border-purple-500/30' : 'border-purple-300/30'}`}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className={`absolute w-[60%] h-[60%] rounded-full border-2 ${isDarkMode ? 'border-emerald-500/30' : 'border-emerald-300/30'}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Central Brain */}
                  <motion.div
                    className={`relative w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl`}
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        `0 0 20px rgba(59, 130, 246, 0.5)`,
                        `0 0 40px rgba(168, 85, 247, 0.7)`,
                        `0 0 20px rgba(59, 130, 246, 0.5)`
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Brain className="w-16 h-16 text-white" strokeWidth={1.5} />
                    {/* Pulsing glow */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white opacity-0"
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>

                  {/* Neural Network Particles */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={`ai-particle-${i}`}
                      className={`absolute w-2 h-2 rounded-full ${
                        ['bg-blue-400', 'bg-purple-400', 'bg-emerald-400'][i % 3]
                      } opacity-70`}
                      style={{
                        left: `${50 + Math.cos(i * 18) * 40}%`,
                        top: `${50 + Math.sin(i * 18) * 40}%`,
                      }}
                      animate={{
                        x: [0, Math.random() * 20 - 10, 0],
                        y: [0, Math.random() * 20 - 10, 0],
                        opacity: [0.5, 1, 0.5],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 2
                      }}
                    />
                  ))}
                </motion.div>
              </div>

              {/* AI Processing Indicators */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Processing", value: "247", icon: Cpu, color: "from-blue-500 to-cyan-500" },
                  { label: "Neural Nodes", value: "1.2K", icon: Network, color: "from-purple-500 to-pink-500" },
                  { label: "Accuracy", value: "98.7%", icon: Target, color: "from-emerald-500 to-teal-500" },
                  { label: "Speed", value: "0.3ms", icon: Zap, color: "from-orange-500 to-red-500" }
                ].map((indicator, i) => {
                  const Icon = indicator.icon;
                  return (
                    <motion.div
                      key={i}
                      className={`p-4 rounded-xl shadow-lg flex items-center space-x-3 ${
                        isDarkMode ? 'bg-gray-700/80' : 'bg-white/80'
                      } backdrop-blur-md border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 3.0 + i * 0.2, duration: 0.6 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <motion.div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-r ${indicator.color} flex items-center justify-center`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <div>
                        <div className={`text-lg font-bold bg-gradient-to-r ${indicator.color} bg-clip-text text-transparent`}>
                          {indicator.value}
                        </div>
                        <div className={`text-xs font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {indicator.label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Live Status */}
              <motion.div 
                className={`flex items-center justify-center space-x-3 p-4 rounded-2xl backdrop-blur-sm border ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-600/30' 
                    : 'bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-gray-200/50'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.8, duration: 0.6 }}
              >
                <motion.div
                  className="flex items-center space-x-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                  />
                </motion.div>
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  AI Neural Network Active
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
