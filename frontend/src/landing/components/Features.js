import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Brain, 
  Clock, 
  Shield, 
  BarChart3, 
  Users, 
  Zap,
  Target,
  Globe,
  MessageSquare,
  FileText
} from 'lucide-react';

const Features = () => {
  const { isDarkMode } = useTheme();
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Interviews",
      description: "Conduct intelligent interviews with AI that adapts to each candidate's responses and provides real-time analysis.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Schedule interviews anytime, anywhere. Our AI never sleeps and is always ready to conduct interviews.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Shield,
      title: "Bias-Free Assessment",
      description: "Eliminate unconscious bias with objective AI evaluation based on skills, experience, and cultural fit.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Get detailed insights into your hiring process with comprehensive analytics and performance metrics.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Enable your entire hiring team to collaborate, share feedback, and make informed decisions together.",
      color: "bg-pink-100 text-pink-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Reduce time-to-hire by 70% with automated screening and instant candidate evaluation.",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Target,
      title: "Precision Matching",
      description: "Advanced algorithms match candidates to roles based on skills, experience, and cultural alignment.",
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Conduct interviews in multiple languages and time zones to find the best talent worldwide.",
      color: "bg-teal-100 text-teal-600"
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "AI conducts human-like conversations that feel natural and engaging for candidates.",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: FileText,
      title: "Detailed Reports",
      description: "Generate comprehensive reports with candidate scores, strengths, and improvement areas.",
      color: "bg-gray-100 text-gray-600"
    }
  ];

  return (
    <section id="features" className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Powerful Features for Modern Hiring
          </h2>
          <p className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Everything you need to streamline your recruitment process and find the perfect candidates
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={`rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border group ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                    : 'bg-white border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className={`rounded-2xl p-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-800 to-gray-700' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Transform Your Hiring Process?
            </h3>
            <p className={`mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join thousands of companies already using AI Hiring to find better candidates faster.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
