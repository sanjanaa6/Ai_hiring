import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ModernInterview from '../components/ModernInterview';
import { sampleInterviewData, createCodingFocusedInterview } from '../data/sampleInterviewData';
import { sampleNonDeveloperInterviews } from '../data/sampleNonDeveloperInterviews';
import ResizeObserverTest from '../components/ResizeObserverTest';
import { 
  Code2, 
  Play, 
  Settings, 
  Users, 
  Clock,
  Target,
  Brain,
  Zap,
  User,
  Briefcase
} from 'lucide-react';

const CodingInterviewDemo = () => {
  const { isDarkMode } = useTheme();
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    experience: '3 years',
    skills: ['JavaScript', 'React', 'Node.js']
  });

  const availableInterviews = [
    // Developer Interviews (should show test cases)
    {
      id: 'full-stack',
      title: 'Full Stack Developer Interview',
      description: 'Comprehensive interview with coding, system design, and behavioral rounds',
      duration: '90 minutes',
      difficulty: 'Medium',
      rounds: 4,
      questions: 8,
      type: 'developer',
      icon: <Code2 className="h-5 w-5" />,
      data: sampleInterviewData
    },
    {
      id: 'coding-focused',
      title: 'Technical Coding Interview',
      description: 'Focused coding interview with algorithmic challenges',
      duration: '60 minutes',
      difficulty: 'Medium',
      rounds: 2,
      questions: 5,
      type: 'developer',
      icon: <Code2 className="h-5 w-5" />,
      data: createCodingFocusedInterview()
    },
    {
      id: 'junior-dev',
      title: 'Junior Developer Interview',
      description: 'Entry-level interview with basic coding problems',
      duration: '45 minutes',
      difficulty: 'Easy',
      rounds: 1,
      questions: 3,
      type: 'developer',
      icon: <Code2 className="h-5 w-5" />,
      data: createCodingFocusedInterview('Junior Developer Interview')
    },
    // Non-Developer Interviews (should NOT show test cases)
    {
      id: 'sales',
      title: 'Sales Representative Interview',
      description: 'Interview for sales position focusing on communication and selling skills',
      duration: '45 minutes',
      difficulty: 'Medium',
      rounds: 2,
      questions: 3,
      type: 'non-developer',
      icon: <User className="h-5 w-5" />,
      data: sampleNonDeveloperInterviews[0]
    },
    {
      id: 'marketing',
      title: 'Marketing Manager Interview',
      description: 'Interview for marketing position focusing on strategy and creativity',
      duration: '60 minutes',
      difficulty: 'Medium',
      rounds: 2,
      questions: 3,
      type: 'non-developer',
      icon: <Briefcase className="h-5 w-5" />,
      data: sampleNonDeveloperInterviews[1]
    },
    {
      id: 'hr',
      title: 'HR Specialist Interview',
      description: 'Interview for human resources position focusing on people management',
      duration: '50 minutes',
      difficulty: 'Medium',
      rounds: 2,
      questions: 3,
      type: 'non-developer',
      icon: <Users className="h-5 w-5" />,
      data: sampleNonDeveloperInterviews[2]
    }
  ];

  const handleInterviewComplete = (results) => {
    console.log('Interview completed:', results);
    setSelectedInterview(null);
  };

  const handleInterviewError = (error) => {
    console.error('Interview error:', error);
    setSelectedInterview(null);
  };

  if (selectedInterview) {
    return (
      <ModernInterview
        interviewId={selectedInterview.data._id}
        candidateInfo={candidateInfo}
        onComplete={handleInterviewComplete}
        onError={handleInterviewError}
      />
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Code2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Coding Interview Demo
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Experience the enhanced coding round system with test cases
              </p>
            </div>
          </div>
        </div>

        {/* ResizeObserver Test */}
        <div className="max-w-2xl mx-auto mb-8">
          <ResizeObserverTest />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className={`p-6 rounded-2xl ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-white/10' 
              : 'bg-white/80 border border-gray-200'
          } shadow-lg`}>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-green-500" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Real-time Test Execution
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Write code and see test results instantly with detailed feedback
            </p>
          </div>

          <div className={`p-6 rounded-2xl ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-white/10' 
              : 'bg-white/80 border border-gray-200'
          } shadow-lg`}>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Smart Hints System
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Get contextual hints and guidance when you're stuck
            </p>
          </div>

          <div className={`p-6 rounded-2xl ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-white/10' 
              : 'bg-white/80 border border-gray-200'
          } shadow-lg`}>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Performance Analytics
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Track code quality, execution time, and test coverage
            </p>
          </div>
        </div>

        {/* Interview Selection */}
        <div className={`max-w-6xl mx-auto ${
          isDarkMode 
            ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
            : 'bg-white/80 backdrop-blur-md border border-gray-200'
        } rounded-2xl shadow-2xl overflow-hidden`}>
          
          <div className="p-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose an Interview to Demo
            </h2>
            
            <div className="grid gap-6">
              {availableInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className={`p-6 rounded-xl border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedInterview(interview)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          interview.type === 'developer' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {interview.icon}
                        </div>
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {interview.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          interview.difficulty === 'Easy' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : interview.difficulty === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {interview.difficulty}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          interview.type === 'developer' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {interview.type === 'developer' ? 'Developer' : 'Non-Developer'}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {interview.description}
                      </p>

                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {interview.duration}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {interview.rounds} rounds
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {interview.questions} questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                        isDarkMode
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Demo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate Info */}
        <div className={`max-w-2xl mx-auto mt-8 p-6 rounded-xl ${
          isDarkMode 
            ? 'bg-slate-800/50 border border-white/10' 
            : 'bg-white/80 border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Demo Candidate Profile
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Name:
              </span>
              <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {candidateInfo.name}
              </span>
            </div>
            <div>
              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Experience:
              </span>
              <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {candidateInfo.experience}
              </span>
            </div>
            <div className="col-span-2">
              <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Skills:
              </span>
              <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {candidateInfo.skills.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingInterviewDemo;
