import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  ThumbsUp, 
  Award, 
  TrendingUp,
  Users,
  Clock,
  Target,
  Zap,
  Shield,
  Rocket,
  CheckCircle,
  Pause,
  Play,
  MessageCircle
} from 'lucide-react';

const Testimonials = () => {
  const { isDarkMode } = useTheme();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      content: "AI Hiring has completely transformed our recruitment process. We've reduced our time-to-hire by 65% and the quality of candidates has significantly improved. The AI interviews are so natural that candidates often forget they're talking to a machine.",
      rating: 5,
      color: "from-blue-500 to-cyan-500",
      icon: Users,
      metric: "65%",
      metricLabel: "Faster Hiring"
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "StartupXYZ",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "As a startup, we needed to scale our hiring quickly without compromising quality. AI Hiring allowed us to interview 10x more candidates while maintaining high standards. The detailed reports help us make data-driven hiring decisions.",
      rating: 5,
      color: "from-emerald-500 to-teal-500",
      icon: Rocket,
      metric: "10x",
      metricLabel: "More Candidates"
    },
    {
      name: "Emily Rodriguez",
      role: "Talent Acquisition Manager",
      company: "GlobalTech",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "The bias-free assessment feature is a game-changer. We've seen a 40% increase in diverse hires since implementing AI Hiring. The platform helps us focus on skills and potential rather than unconscious biases.",
      rating: 5,
      color: "from-orange-500 to-red-500",
      icon: Shield,
      metric: "40%",
      metricLabel: "More Diverse Hires"
    },
    {
      name: "David Thompson",
      role: "VP of Engineering",
      company: "InnovateLab",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "The technical assessment capabilities are outstanding. AI Hiring accurately evaluates coding skills, problem-solving abilities, and technical communication. We've hired some of our best engineers through this platform.",
      rating: 5,
      color: "from-indigo-500 to-blue-500",
      icon: Zap,
      metric: "95%",
      metricLabel: "Technical Accuracy"
    },
    {
      name: "Lisa Wang",
      role: "Head of People",
      company: "ScaleUp Inc",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80",
      content: "The analytics dashboard provides incredible insights into our hiring funnel. We can now identify bottlenecks, optimize our process, and make strategic decisions based on real data. ROI has been exceptional.",
      rating: 5,
      color: "from-violet-500 to-purple-500",
      icon: TrendingUp,
      metric: "300%",
      metricLabel: "ROI Increase"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentTestimonial];

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
    <section id="testimonials" className={`relative py-24 overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Hearts */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDarkMode ? 'bg-pink-400/20' : 'bg-pink-500/10'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -80, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 6 + 8,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
        
        {/* Large Floating Orbs */}
        <motion.div
          className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-pink-500/5 to-rose-500/5' : 'bg-gradient-to-r from-pink-400/10 to-rose-400/10'
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
          className={`absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-blue-500/5 to-cyan-500/5' : 'bg-gradient-to-r from-blue-400/10 to-cyan-400/10'
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
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Heart className="w-4 h-4 text-pink-500" />
            </motion.div>
            <span className="text-pink-600 font-semibold">Customer Love</span>
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
              What Our Customers
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-pink-600 via-rose-500 to-red-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Say About Us
            </motion.span>
          </motion.h2>

          <motion.p 
            variants={itemVariants}
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Join thousands of companies that have transformed their hiring with 
            <motion.span 
              className={`font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {" "}AI-powered recruitment
            </motion.span>
            . See the results for yourself.
          </motion.p>
        </motion.div>

        {/* 3D Testimonial Carousel */}
        <motion.div 
          className="relative mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial}
              className={`relative rounded-3xl p-8 md:p-12 overflow-hidden backdrop-blur-xl border ${
          isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-gray-600/50' 
                  : 'bg-gradient-to-br from-white/80 to-blue-50/80 border-gray-200/50'
              } shadow-2xl`}
              initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -90, scale: 0.8 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02, y: -5 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Animated Background Gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${current.color} opacity-5`}
                animate={{
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Floating Quote Icons */}
              <div className="absolute top-8 right-8">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                >
                  <Quote className={`w-24 h-24 ${
                    isDarkMode ? 'text-gray-600/20' : 'text-gray-300/30'
                  }`} />
                </motion.div>
          </div>

          <div className="relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Testimonial Content */}
                  <div className="lg:col-span-2">
                    {/* Animated Stars */}
                    <motion.div 
                      className="flex items-center mb-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                  {[...Array(current.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200 }}
                        >
                          <Star className="w-6 h-6 text-yellow-400 fill-current" />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Testimonial Text */}
                    <motion.blockquote 
                      className={`text-xl md:text-2xl leading-relaxed mb-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                      >
                  "{current.content}"
                      </motion.span>
                    </motion.blockquote>

                    {/* Author Info */}
                    <motion.div 
                      className="flex items-center space-x-4"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                  <img
                    src={current.image}
                    alt={current.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                  <div>
                        <motion.div 
                          className={`font-bold text-xl ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.3 }}
                        >
                      {current.name}
                        </motion.div>
                        <motion.div 
                          className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4 }}
                        >
                      {current.role} at {current.company}
                        </motion.div>
                    </div>
                    </motion.div>
              </div>

                  {/* Metric Card */}
                  <motion.div
                    className="lg:col-span-1"
                    initial={{ opacity: 0, x: 50, rotateY: 90 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 1.5, duration: 0.8, type: "spring" }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className={`relative p-8 rounded-2xl backdrop-blur-xl border ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50 border-gray-600/30' 
                        : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/30'
                    } shadow-xl`}>
                      {/* Animated Background */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${current.color} opacity-10 rounded-2xl`}
                        animate={{
                          opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />

                      <div className="relative text-center">
                        {/* Icon */}
                        <motion.div
                          className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center`}
                          animate={{ 
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 8, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                        >
                          <current.icon className="w-8 h-8 text-white" />
                        </motion.div>

                        {/* Metric */}
                        <motion.div
                          className={`text-4xl font-bold bg-gradient-to-r ${current.color} bg-clip-text text-transparent mb-2`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            delay: 1.7, 
                            type: "spring", 
                            stiffness: 200 
                          }}
                        >
                          {current.metric}
                        </motion.div>

                        <motion.div 
                          className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.8 }}
                        >
                          {current.metricLabel}
                        </motion.div>
              </div>
            </div>
                  </motion.div>
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
          </AnimatePresence>

          {/* Enhanced Navigation */}
          <div className="flex justify-center items-center space-x-6 mt-8">
            <motion.button
              onClick={prevTestimonial}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'bg-white/50 border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-white/80'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* Auto-play Toggle */}
            <motion.button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                isAutoPlaying 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isAutoPlaying ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </motion.div>
            </motion.button>

            <motion.button
              onClick={nextTestimonial}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'bg-white/50 border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-white/80'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>

        {/* Animated Testimonial Indicators */}
        <motion.div 
          className="flex justify-center space-x-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`relative w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentTestimonial 
                  ? `bg-gradient-to-r ${testimonial.color}` 
                  : 'bg-gray-300'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {index === currentTestimonial && (
                <motion.div
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${testimonial.color} opacity-50`}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default Testimonials;
