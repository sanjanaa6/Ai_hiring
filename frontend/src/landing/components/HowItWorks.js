import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  UserPlus, 
  MessageCircle, 
  Brain, 
  CheckCircle,
  ArrowRight,
  Clock,
  Users,
  Target
} from 'lucide-react';

const HowItWorks = () => {
  const { isDarkMode } = useTheme();
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Post Your Job",
      description: "Create detailed job postings with requirements, skills, and company culture details.",
      details: [
        "Define role requirements",
        "Set interview criteria",
        "Configure AI parameters"
      ],
      color: "bg-blue-500"
    },
    {
      number: "02",
      icon: MessageCircle,
      title: "AI Conducts Interviews",
      description: "Our AI interviews candidates 24/7, asking relevant questions and evaluating responses.",
      details: [
        "Natural conversation flow",
        "Real-time analysis",
        "Adaptive questioning"
      ],
      color: "bg-green-500"
    },
    {
      number: "03",
      icon: Brain,
      title: "AI Analysis & Scoring",
      description: "Advanced AI analyzes responses for technical skills, soft skills, and cultural fit.",
      details: [
        "Technical competency",
        "Communication skills",
        "Cultural alignment"
      ],
      color: "bg-purple-500"
    },
    {
      number: "04",
      icon: CheckCircle,
      title: "Get Top Candidates",
      description: "Receive ranked candidate lists with detailed reports and recommendations.",
      details: [
        "Ranked candidate list",
        "Detailed reports",
        "Hiring recommendations"
      ],
      color: "bg-orange-500"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "70% Faster Hiring",
      description: "Reduce time-to-hire with automated screening and instant evaluation"
    },
    {
      icon: Users,
      title: "Better Candidates",
      description: "AI identifies top performers you might have missed with traditional methods"
    },
    {
      icon: Target,
      title: "Higher Accuracy",
      description: "95% accuracy in predicting candidate success based on data analysis"
    }
  ];

  return (
    <section id="how-it-works" className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            How It Works
          </h2>
          <p className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Our AI-powered hiring process is simple, efficient, and delivers better results
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gray-300 transform translate-x-4 z-0">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full"></div>
                  </div>
                )}

                <div className={`relative z-10 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  {/* Step Number */}
                  <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl mb-4`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>

                  {/* Content */}
                  <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className={`rounded-2xl p-8 shadow-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center mb-8">
            <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Why Choose AI Hiring?
            </h3>
            <p className={`transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Experience the future of recruitment with measurable results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Process Flow Visualization */}
        <div className={`mt-16 rounded-2xl p-8 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-800 to-gray-700' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}>
          <div className="text-center mb-8">
            <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              The Complete Process
            </h3>
            <p className={`transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              From job posting to final hiring decision in just a few steps
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className={`flex items-center space-x-3 rounded-lg p-4 shadow-md transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Job Posting</span>
            </div>

            <ArrowRight className={`w-5 h-5 hidden md:block transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />

            <div className={`flex items-center space-x-3 rounded-lg p-4 shadow-md transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>AI Interview</span>
            </div>

            <ArrowRight className={`w-5 h-5 hidden md:block transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />

            <div className={`flex items-center space-x-3 rounded-lg p-4 shadow-md transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>AI Analysis</span>
            </div>

            <ArrowRight className={`w-5 h-5 hidden md:block transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />

            <div className={`flex items-center space-x-3 rounded-lg p-4 shadow-md transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Hire Best Fit</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
