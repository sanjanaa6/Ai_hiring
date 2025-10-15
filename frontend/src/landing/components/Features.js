import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, useInView } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  BarChart3, 
  Users, 
  Zap,
  Target,
  Globe,
  Eye,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Features = () => {
  const { isDarkMode } = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const features = [
    {
      icon: Brain,
      title: "AI Interviews",
      description: "Intelligent conversations that adapt in real-time",
      detail: "Our AI conducts natural, dynamic interviews 24/7, evaluating candidates with 95% accuracy while maintaining human-like interaction.",
      number: "01"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Data-driven insights for better decisions",
      detail: "Comprehensive reports with 100+ metrics, predictive scoring, and detailed candidate comparisons to identify top talent instantly.",
      number: "02"
    },
    {
      icon: Shield,
      title: "Bias-Free Hiring",
      description: "Fair evaluation for every candidate",
      detail: "Advanced algorithms ensure unbiased assessments, focusing purely on skills and qualifications to build diverse teams.",
      number: "03"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get qualified candidates in minutes",
      detail: "Automated screening and ranking delivers top candidates 10x faster than traditional methods, saving weeks of work.",
      number: "04"
    }
  ];



  return (
    <section 
      id="features" 
      ref={ref}
      className={`relative py-24 overflow-hidden ${
        isDarkMode 
          ? 'bg-black' 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute inset-0 ${
          isDarkMode ? 'bg-white' : 'bg-black'
        }`} style={{
          backgroundImage: `linear-gradient(${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            <span className={`text-sm font-semibold tracking-wider uppercase ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Features
            </span>
          </motion.div>

          <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Powerful Tools for
            <br />
            <span className="relative inline-block">
              Modern Recruitment
              <motion.div
                className={`absolute bottom-2 left-0 right-0 h-3 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                } opacity-10`}
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              />
            </span>
          </h2>
          
          <p className={`text-lg max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Everything you need to revolutionize your hiring process
          </p>
        </motion.div>

        {/* Auto-Scrolling Horizontal Cards */}
        <div className="relative overflow-hidden">
          {/* Gradient Overlays for Scroll Indication */}
          <div className={`absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none ${
            isDarkMode 
              ? 'bg-gradient-to-r from-black to-transparent' 
              : 'bg-gradient-to-r from-amber-50 to-transparent'
          }`}></div>
          <div className={`absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none ${
            isDarkMode 
              ? 'bg-gradient-to-l from-black to-transparent' 
              : 'bg-gradient-to-l from-amber-50 to-transparent'
          }`}></div>

          <motion.div
            className="flex gap-8 pb-8"
            animate={{
              x: [0, -1900]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25,
                ease: "linear"
              }
            }}
          >
            {/* Duplicate features for seamless loop */}
            {[...features, ...features, ...features].map((feature, index) => {
              const IconComponent = feature.icon;
              const isHovered = hoveredIndex === index;
                
                return (
                  <motion.div
                    key={index}
                    className="relative flex-shrink-0"
                    style={{ width: '450px' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                <motion.div
                  className={`relative overflow-hidden border-2 transition-all duration-700 ${
                    isDarkMode
                      ? isHovered ? 'bg-white border-white' : 'bg-black border-gray-800'
                      : isHovered ? 'bg-black border-black' : 'bg-white border-gray-200'
                  }`}
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                    zIndex: isHovered ? 10 : 1
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Diagonal Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className={`w-full h-full ${
                      isDarkMode
                        ? isHovered ? 'bg-black' : 'bg-white'
                        : isHovered ? 'bg-white' : 'bg-black'
                    }`} style={{
                      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${
                        isDarkMode
                          ? isHovered ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                          : isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      } 10px, ${
                        isDarkMode
                          ? isHovered ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                          : isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      } 20px)`
                    }}></div>
                  </div>

                  <div className="relative p-10">
                    {/* Number Badge */}
                    <motion.div
                      className={`absolute top-6 right-6 w-16 h-16 flex items-center justify-center border-2 transition-all duration-700 ${
                        isDarkMode
                          ? isHovered ? 'border-black bg-black' : 'border-white bg-transparent'
                          : isHovered ? 'border-white bg-white' : 'border-black bg-transparent'
                      }`}
                      animate={{
                        rotate: isHovered ? 180 : 0
                      }}
                      transition={{ duration: 0.7 }}
                    >
                      <span className={`text-2xl font-bold transition-colors duration-700 ${
                        isDarkMode
                          ? isHovered ? 'text-white' : 'text-white'
                          : isHovered ? 'text-black' : 'text-black'
                      }`}>
                        {feature.number}
                      </span>
                    </motion.div>

                    {/* Icon */}
                    <motion.div
                      className="mb-8"
                      animate={{
                        y: isHovered ? -10 : 0
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.div
                        className={`w-20 h-20 flex items-center justify-center transition-all duration-700 ${
                          isDarkMode
                            ? isHovered ? 'bg-black' : 'bg-white'
                            : isHovered ? 'bg-white' : 'bg-black'
                        }`}
                        animate={{
                          rotate: isHovered ? 360 : 0
                        }}
                        transition={{ duration: 0.8 }}
                      >
                        <IconComponent className={`w-10 h-10 transition-colors duration-700 ${
                          isDarkMode
                            ? isHovered ? 'text-white' : 'text-black'
                            : isHovered ? 'text-black' : 'text-white'
                        }`} />
                      </motion.div>
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                      className={`text-3xl font-bold mb-3 transition-colors duration-700 ${
                        isDarkMode
                          ? isHovered ? 'text-black' : 'text-white'
                          : isHovered ? 'text-white' : 'text-black'
                      }`}
                      animate={{
                        x: isHovered ? 10 : 0
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      {feature.title}
                    </motion.h3>

                    {/* Description */}
                    <p className={`text-base mb-6 transition-colors duration-700 ${
                      isDarkMode
                        ? isHovered ? 'text-gray-700' : 'text-gray-400'
                        : isHovered ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>

                    {/* Expandable Detail */}
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: isHovered ? 'auto' : 0,
                        opacity: isHovered ? 1 : 0
                      }}
                      transition={{ duration: 0.5 }}
                      className="overflow-hidden"
                    >
                      <div className={`pt-4 border-t-2 transition-colors duration-700 ${
                        isDarkMode
                          ? isHovered ? 'border-gray-300' : 'border-gray-800'
                          : isHovered ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <p className={`text-sm leading-relaxed transition-colors duration-700 ${
                          isDarkMode
                            ? isHovered ? 'text-gray-600' : 'text-gray-500'
                            : isHovered ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {feature.detail}
                        </p>
                      </div>
                    </motion.div>

                    {/* Arrow Indicator */}
                    <motion.div
                      className="mt-6 flex items-center gap-2"
                      animate={{
                        x: isHovered ? 10 : 0
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className={`text-sm font-semibold transition-colors duration-700 ${
                        isDarkMode
                          ? isHovered ? 'text-black' : 'text-white'
                          : isHovered ? 'text-white' : 'text-black'
                      }`}>
                        {isHovered ? 'Learn more' : 'Explore'}
                      </span>
                      <motion.div
                        animate={{
                          x: isHovered ? 5 : 0
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowRight className={`w-5 h-5 transition-colors duration-700 ${
                          isDarkMode
                            ? isHovered ? 'text-black' : 'text-white'
                            : isHovered ? 'text-white' : 'text-black'
                        }`} />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Bottom Accent Line */}
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-2 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
