import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Quote, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Testimonials = () => {
  const { isDarkMode } = useTheme();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      content: "AI Hiring has completely transformed our recruitment process. We've reduced our time-to-hire by 65% and the quality of candidates has significantly improved.",
      rating: 5,
      metric: "65%",
      metricLabel: "Faster Hiring"
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "StartupXYZ",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "As a startup, we needed to scale our hiring quickly without compromising quality. AI Hiring allowed us to interview 10x more candidates while maintaining high standards.",
      rating: 5,
      metric: "10x",
      metricLabel: "More Candidates"
    },
    {
      name: "Emily Rodriguez",
      role: "Talent Acquisition Manager",
      company: "GlobalTech",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "The bias-free assessment feature is a game-changer. We've seen a 40% increase in diverse hires since implementing AI Hiring.",
      rating: 5,
      metric: "40%",
      metricLabel: "Diverse Hires"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const current = testimonials[currentTestimonial];

  return (
    <section id="testimonials" className={`relative py-24 overflow-hidden ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      {/* Diagonal Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className={`w-full h-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} style={{
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 20px, ${
            isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          } 20px, ${
            isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          } 40px)`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            <span className={`text-sm font-semibold tracking-wider uppercase ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Success Stories
            </span>
          </motion.div>

          <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Trusted by Industry
            <br />
            <span className="relative inline-block">
              Leaders
              <motion.div
                className={`absolute bottom-2 left-0 right-0 h-3 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                } opacity-10`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              />
            </span>
          </h2>
        </motion.div>

        {/* Unique Split-Screen Testimonial Layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTestimonial}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Left Side - Image & Stats */}
            <motion.div
              className={`relative overflow-hidden ${
                isDarkMode ? 'bg-white' : 'bg-black'
              }`}
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              {/* Large Profile Image */}
              <div className="relative h-full min-h-[500px]">
                <motion.img
                  src={current.image}
                  alt={current.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 ${
                  isDarkMode 
                    ? 'bg-gradient-to-t from-white via-transparent to-transparent' 
                    : 'bg-gradient-to-t from-black via-transparent to-transparent'
                }`}></div>

                {/* Stats Card */}
                <motion.div
                  className={`absolute bottom-8 left-8 right-8 p-6 border-2 ${
                    isDarkMode 
                      ? 'bg-white border-black' 
                      : 'bg-black border-white'
                  }`}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <motion.div
                        className={`text-5xl font-bold mb-2 ${
                          isDarkMode ? 'text-black' : 'text-white'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                      >
                        {current.metric}
                      </motion.div>
                      <div className={`text-sm font-semibold ${
                        isDarkMode ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        {current.metricLabel}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Star className={`w-8 h-8 ${
                        isDarkMode ? 'text-black' : 'text-white'
                      }`} />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              className={`relative p-12 flex flex-col justify-center ${
                isDarkMode ? 'bg-black' : 'bg-white'
              }`}
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              {/* Floating Quote */}
              <motion.div
                className="absolute top-8 right-8 opacity-5"
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Quote className={`w-32 h-32 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} />
              </motion.div>

              {/* Star Rating */}
              <motion.div
                className="flex gap-1 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {[...Array(current.rating)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                  >
                    <Star className={`w-6 h-6 ${
                      isDarkMode ? 'text-white fill-white' : 'text-black fill-black'
                    }`} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Testimonial Text */}
              <motion.blockquote
                className={`text-2xl md:text-3xl font-light leading-relaxed mb-8 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                "{current.content}"
              </motion.blockquote>

              {/* Author Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className={`text-xl font-bold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {current.name}
                </div>
                <div className={`text-sm mb-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {current.role} • {current.company}
                </div>

                {/* Read More Link */}
                <motion.div
                  className="flex items-center gap-2 group cursor-pointer"
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className={`text-sm font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Read Full Story
                  </span>
                  <ArrowRight className={`w-5 h-5 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`} />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`relative h-1 transition-all ${
                index === currentTestimonial 
                  ? 'w-16' 
                  : 'w-8'
              }`}
              whileHover={{ scale: 1.2 }}
            >
              <div className={`absolute inset-0 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-300'
              }`}></div>
              {index === currentTestimonial && (
                <motion.div
                  className={`absolute inset-0 ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 5, ease: "linear" }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
