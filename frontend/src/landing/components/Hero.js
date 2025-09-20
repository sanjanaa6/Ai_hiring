import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight, Play, Users, Building2, TrendingUp } from 'lucide-react';

const Hero = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <section className={`pt-16 min-h-screen flex items-center transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className={`text-4xl md:text-6xl font-bold leading-tight transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                AI-Powered
                <span className="text-blue-600 block">Hiring Platform</span>
              </h1>
              <p className={`text-xl leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Whether you're a candidate looking for your dream job, a recruiter seeking top talent, 
                or a company scaling your team - our AI platform makes hiring smarter, faster, and more fair.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className={`border-2 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400' 
                  : 'border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600'
              }`}>
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">10K+</div>
                <div className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">1M+</div>
                <div className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Interviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">95%</div>
                <div className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Accuracy</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className={`rounded-2xl shadow-2xl p-8 space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Mock Dashboard */}
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Interview Dashboard</h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>

              {/* Mock Interview Cards */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>John Smith</h4>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Software Engineer</p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">85% Match</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Completed</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Sarah Johnson</h4>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Product Manager</p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">92% Match</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>In Progress</div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>Mike Chen</h4>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Data Scientist</p>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-600 font-semibold">78% Match</div>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Scheduled</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock AI Analysis */}
              <div className={`rounded-lg p-4 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>AI Analysis</span>
                </div>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Analyzing candidate responses for technical skills, cultural fit, and communication abilities...
                </p>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-600 text-white p-3 rounded-full shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
