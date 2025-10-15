import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Users, 
  MessageSquare,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const HowItWorks = () => {
  const { isDarkMode } = useTheme();

  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Create Job Post",
      subtitle: "Define your requirements",
      description: "Post your job with detailed requirements. Our AI analyzes and optimizes your job description for better candidate matching.",
      delay: 0
    },
    {
      number: "02",
      icon: Users,
      title: "AI Screening",
      subtitle: "Automated candidate evaluation",
      description: "AI conducts intelligent interviews with candidates 24/7, evaluating technical skills and cultural fit automatically.",
      delay: 0.1
    },
    {
      number: "03",
      icon: MessageSquare,
      title: "Review Results",
      subtitle: "Get detailed insights",
      description: "Access comprehensive AI-generated reports with candidate rankings, skill assessments, and interview transcripts.",
      delay: 0.2
    },
    {
      number: "04",
      icon: CheckCircle,
      title: "Hire Top Talent",
      subtitle: "Make confident decisions",
      description: "Select the best candidates based on data-driven insights and proceed with hiring the perfect match for your team.",
      delay: 0.3
    }
  ];


  return (
    <section id="how-it-works" className={`relative py-24 ${
        isDarkMode 
        ? 'bg-black' 
        : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Hire in <span className="font-bold">4 Easy Steps</span>
          </h2>
        </motion.div>

        {/* 4-Step Process */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <React.Fragment key={index}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: step.delay, duration: 0.5 }}
                  className={`relative p-8 border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-gray-200'
                  }`}
                >
                  {/* Step Number */}
                  <div className={`text-5xl font-bold mb-6 ${
                    isDarkMode ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {step.number}
                  </div>

                  {/* Icon and Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      isDarkMode ? 'border-white' : 'border-black'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`} />
                    </div>
                    <h3 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {step.title}
                    </h3>
                  </div>

                  {/* Subtitle */}
                  <p className={`text-base font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {step.subtitle}
                  </p>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </motion.div>

                {/* Animated Arrow Between Steps */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:flex absolute top-1/2 transform -translate-y-1/2 items-center justify-center"
                    style={{
                      left: `${(index + 1) * 25 - 2}%`,
                      zIndex: 10
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.delay + 0.3, duration: 0.5 }}
                  >
                    <motion.div
                      animate={{
                        x: [0, 5, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRight className={`w-6 h-6 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                    </motion.div>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
