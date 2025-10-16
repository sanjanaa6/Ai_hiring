import React, { useState } from 'react';
import { CheckCircle, Lock, Clock, Play, Zap, Target, Brain, Rocket, Star, Award, Trophy, Crown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
// feedback removed

const RoundSelection = ({ 
  allRounds, 
  completedRounds, 
  userProgress, 
  interviewData,
  onSelectRound,
  onFinishInterview,
  loading 
}) => {
  const { isDarkMode } = useTheme();
  const interviewId = interviewData?.interviewId || interviewData?.interview?.interviewId;

  const startSpecificRound = (roundId) => {
    const round = allRounds.find(r => (r._id || r.id || r.roundId) === roundId);
    if (round) {
      onSelectRound(round);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-400 opacity-20"></div>
          </div>
          <div className="space-y-2">
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Preparing Your Interview Journey
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading rounds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 overflow-hidden pt-16 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="h-full flex flex-col relative z-10">
        {/* Professional Header */}
        <div className={`backdrop-blur-xl border-b px-8 py-8 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-slate-900/90 via-gray-900/80 to-black/70 border-white/10' 
            : 'bg-gradient-to-r from-white/95 via-slate-50/90 to-gray-100/80 border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Left Section - Logo & Title */}
              <div className="flex items-center space-x-6">
                <div className={`p-4 rounded-2xl shadow-xl ${
                isDarkMode 
                    ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-blue-500/30' 
                    : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-blue-400/40'
                }`}>
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Interview Management
                  </h1>
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Professional Assessment Dashboard
                  </p>
                </div>
              </div>

              {/* Right Section - Status & Progress */}
              <div className="flex items-center space-x-6">
                <div className={`px-4 py-2 rounded-full ${
                isDarkMode 
                    ? 'bg-emerald-500/20 border border-emerald-400/30' 
                    : 'bg-emerald-100 border border-emerald-300'
              }`}>
                  <span className={`text-sm font-semibold ${
                    isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                  }`}>
                    Active Assessment
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {completedRounds.size}/{allRounds.length}
                </div>
                  <div className={`text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Rounds Completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Professional Progress Dashboard */}
            <div className="mb-12">
              <div className={`rounded-2xl p-8 backdrop-blur-xl border shadow-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-900/80 via-gray-900/60 to-black/40 border-white/10' 
                  : 'bg-gradient-to-br from-white/90 via-slate-50/80 to-gray-100/60 border-gray-200'
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Progress Stats */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className={`text-2xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Assessment Progress
                        </h2>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Track candidate performance across all rounds
                        </p>
                      </div>
                      <div className={`px-6 py-3 rounded-xl ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-blue-500/30' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-blue-400/40'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {completedRounds.size}/{allRounds.length}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-4">
                      <div className={`w-full rounded-full h-4 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      }`}>
                        <div
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 h-4 rounded-full transition-all duration-1000 shadow-lg relative overflow-hidden"
                          style={{ width: `${allRounds.length > 0 ? (completedRounds.size / allRounds.length) * 100 : 0}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {allRounds.length > 0 ? Math.round((completedRounds.size / allRounds.length) * 100) : 0}% Complete
                        </span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {allRounds.length - completedRounds.size} rounds remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${
                      isDarkMode 
                        ? 'bg-emerald-500/10 border border-emerald-400/20' 
                        : 'bg-emerald-50 border border-emerald-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                        <div>
                          <div className={`text-lg font-bold ${
                            isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                          }`}>
                            {completedRounds.size}
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            Completed
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${  
                      isDarkMode 
                        ? 'bg-blue-500/10 border border-blue-400/20' 
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-6 w-6 text-blue-500" />
                        <div>
                          <div className={`text-lg font-bold ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-700'
                          }`}>
                            {allRounds.length - completedRounds.size}
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            Remaining
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rounds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {allRounds.map((round, index) => {
                const roundId = round._id || round.id || round.roundId;
                const isCompleted = completedRounds.has(roundId);
                const previousRoundId = allRounds[index - 1]?._id || allRounds[index - 1]?.id || allRounds[index - 1]?.roundId;
                const isAvailable = index === 0 || (previousRoundId && completedRounds.has(previousRoundId));
                
                // Debug logging for first few rounds
                if (index < 3) {
                  console.log(`🔍 Round ${index + 1} (${round.title}):`, {
                    roundId,
                    isCompleted,
                    previousRoundId,
                    isAvailable,
                    completedRounds: Array.from(completedRounds)
                  });
                }
                
                // Check if round is in progress (has some answered questions but not completed)
                const isInProgress = userProgress && userProgress.rounds ? 
                  userProgress.rounds.some(pr => 
                    pr.roundId === roundId && 
                    pr.status === 'in_progress'
                  ) : false;
                
                // Check schedule and time-based availability
                const currentInterviewData = interviewData || {};
                const roundSchedule = currentInterviewData.schedules?.find(schedule => schedule.roundNumber === round.roundNumber);
                const isScheduled = !!roundSchedule;
                
                // Check if scheduled round is within its time window
                let isScheduledAndActive = false;
                if (roundSchedule && roundSchedule.startDateTime && roundSchedule.endDateTime) {
                  const now = new Date();
                  const start = new Date(roundSchedule.startDateTime);
                  const end = new Date(roundSchedule.endDateTime);
                  isScheduledAndActive = now >= start && now <= end;
                }
                
                // Round is available if it's either not scheduled OR if it's scheduled and within time window
                const finalAvailability = isAvailable && (!isScheduled || isScheduledAndActive);
                
                // Get appropriate icon for round type
                const getRoundIcon = (roundType, index) => {
                  const icons = [
                    <Brain className="h-6 w-6" />,
                    <Target className="h-6 w-6" />,
                    <Zap className="h-6 w-6" />,
                    <Rocket className="h-6 w-6" />,
                    <Star className="h-6 w-6" />,
                    <Award className="h-6 w-6" />,
                    <Trophy className="h-6 w-6" />,
                    <Crown className="h-6 w-6" />
                  ];
                  
                  if (roundType === 'form_submission') return <Target className="h-6 w-6" />;
                  if (roundType === 'file_upload') return <Zap className="h-6 w-6" />;
                  return icons[index % icons.length];
                };
                
                return (
                  <div
                    key={roundId}
                    className={`group relative rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-xl ${
                      isCompleted
                        ? isDarkMode 
                          ? 'bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-teal-500/5 border border-emerald-400/40 shadow-emerald-500/20' 
                          : 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-300 shadow-emerald-200/30'
                        : isScheduled
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-orange-900/25 via-red-900/15 to-pink-900/10 border border-orange-700/40 opacity-80'
                          : 'bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 border border-orange-400 opacity-80'
                        : finalAvailability
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-slate-800/70 via-gray-800/50 to-black/30 border border-blue-400/40 hover:border-blue-400/70 hover:shadow-2xl hover:shadow-blue-500/40 cursor-pointer backdrop-blur-md'
                          : 'bg-gradient-to-br from-white/90 via-blue-50/70 to-indigo-50/50 border border-blue-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200/60 cursor-pointer backdrop-blur-md'
                        : isDarkMode
                          ? 'bg-gradient-to-br from-gray-800/40 via-slate-800/30 to-black/20 border border-gray-700/40 opacity-70'
                          : 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 border border-gray-400 opacity-70'
                    }`}
                  >
                    {/* Professional Card Header */}
                    <div className={`relative p-6 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500/15 to-green-500/15'
                        : isScheduled
                        ? 'bg-gradient-to-r from-orange-500/15 to-red-500/15'
                        : finalAvailability
                        ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/15'
                        : 'bg-gradient-to-r from-gray-500/15 to-slate-500/15'
                    }`}>
                      {/* Subtle Animation for Available Rounds */}
                    {finalAvailability && !isScheduled && (
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-3 left-6 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-40"></div>
                          <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30 delay-500"></div>
                          <div className="absolute bottom-6 left-10 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-35 delay-1000"></div>
                      </div>
                    )}
                    
                      <div className="relative z-10 flex items-center justify-between">
                        {/* Round Number Badge */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 ${
                            isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                              : isScheduled
                            ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/30'
                              : finalAvailability
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/30'
                            : 'bg-gradient-to-br from-gray-500 to-slate-600 shadow-gray-500/30'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-7 w-7 text-white drop-shadow-lg" />
                          ) : (
                            <span className="text-white text-lg font-bold drop-shadow-lg">{index + 1}</span>
                          )}
                        </div>

                        {/* Round Type Icon */}
                        <div className={`p-3 rounded-lg ${
                          isCompleted
                            ? 'bg-emerald-500/20 border border-emerald-400/30'
                            : isScheduled
                            ? 'bg-orange-500/20 border border-orange-400/30'
                            : finalAvailability
                            ? 'bg-blue-500/20 border border-blue-400/30'
                            : 'bg-gray-500/20 border border-gray-400/30'
                        }`}>
                          {getRoundIcon(round.type, index)}
                        </div>
                      </div>
                      </div>

                    {/* Professional Card Content */}
                    <div className="p-6">
                      {/* Round Title */}
                      <h3 className={`text-lg font-bold mb-3 leading-tight ${
                          isCompleted
                            ? isDarkMode ? 'text-emerald-200' : 'text-emerald-800'
                            : isScheduled
                            ? isDarkMode ? 'text-orange-300' : 'text-orange-700'
                            : finalAvailability
                            ? isDarkMode ? 'text-white' : 'text-slate-900'
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {round.title}
                      </h3>

                      {/* Round Type Badge */}
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          round.type === 'form_submission'
                            ? isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : round.type === 'file_upload'
                            ? isDarkMode ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'bg-purple-100 text-purple-800 border border-purple-300'
                            : round.type === 'system_design'
                            ? isDarkMode ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-green-100 text-green-800 border border-green-300'
                            : isDarkMode ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {round.type === 'form_submission' ? '📝 Form Submission' : 
                           round.type === 'file_upload' ? '📁 File Upload' : 
                           round.type === 'system_design' ? '🎨 System Design' :
                           '💬 Interview'}
                        </span>
                      </div>

                      {/* Round Description */}
                      <p className={`text-sm mb-6 leading-relaxed ${
                          isCompleted
                            ? isDarkMode ? 'text-emerald-300/90' : 'text-emerald-700'
                            : isScheduled
                            ? isDarkMode ? 'text-orange-300/90' : 'text-orange-600'
                            : finalAvailability
                            ? isDarkMode ? 'text-gray-200/95' : 'text-slate-600'
                            : isDarkMode ? 'text-gray-500/70' : 'text-gray-400'
                      }`}>
                        {round.description}
                      </p>

                      {/* Schedule Information */}
                      {isScheduled && (
                        <div className={`mb-6 p-4 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-orange-500/10 border-orange-400/30 text-orange-300' 
                            : 'bg-orange-50 border-orange-300 text-orange-700'
                        }`}>
                          <div className="flex items-center space-x-2 mb-3">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold text-sm">Scheduled Round</span>
                          </div>
                          <div className="text-xs space-y-2">
                            <div className="flex justify-between">
                              <span className="opacity-80">Start:</span>
                              <span className="font-medium">{new Date(roundSchedule.startDateTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="opacity-80">End:</span>
                              <span className="font-medium">{new Date(roundSchedule.endDateTime).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-2 p-2 rounded bg-orange-500/10 text-center">
                              <span className="text-xs font-medium">⏰ Scheduled Time</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Round Info Cards */}
                      <div className="flex justify-between space-x-3 mb-6">
                        <div className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-blue-500/10 border border-blue-400/20' 
                            : 'bg-blue-50 border border-blue-200'
                        }`}>
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-semibold text-blue-600">{round.duration || 30}m</span>
                        </div>
                        <div className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-purple-500/10 border border-purple-400/20' 
                            : 'bg-purple-50 border border-purple-200'
                        }`}>
                          <Target className="h-4 w-4 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-600">
                            {round.type === 'form_submission' 
                              ? `${round.formFields?.length || 0} Fields`
                              : round.type === 'file_upload'
                              ? `${round.fileUploadRequirements?.length || 0} Files`
                              : round.type === 'system_design'
                              ? `${round.questions?.length || 0} Problem${round.questions?.length !== 1 ? 's' : ''}`
                              : `${round.questions?.length || 0} Q`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Professional Action Button */}
                      {isCompleted ? (
                        <div className="space-y-3">
                          <div className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-center ${
                            isDarkMode 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            ✅ Completed Successfully
                          </div>
                          {round.allowRetake ? (
                            <button
                              onClick={() => startSpecificRound(roundId)}
                              disabled={loading}
                              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30"
                            >
                              🔄 Retake Round
                            </button>
                          ) : (
                            <div className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-center ${
                              isDarkMode 
                                ? 'bg-gray-700/50 text-gray-400 border border-gray-600/40' 
                                : 'bg-gray-100 text-gray-500 border border-gray-300'
                            }`}>
                              🔒 Retake Not Allowed
                            </div>
                          )}
                        </div>
                      ) : isScheduled && !isScheduledAndActive ? (
                        <div className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-center ${
                          isDarkMode 
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' 
                            : 'bg-orange-100 text-orange-700 border border-orange-300'
                        }`}>
                          <div className="flex items-center justify-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Scheduled - Not Yet Available</span>
                          </div>
                        </div>
                      ) : finalAvailability ? (
                        <button
                          onClick={() => startSpecificRound(roundId)}
                          disabled={loading}
                          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-500 transform hover:scale-105 shadow-lg relative overflow-hidden ${
                            isInProgress 
                              ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/30 hover:shadow-orange-500/50'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
                          } disabled:transform-none`}
                        >
                          {/* Animated Background */}
                          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-white/10 to-white/5"></div>
                          
                          {/* Button Content */}
                          <div className="relative z-10 flex items-center justify-center space-x-2">
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Starting...</span>
                              </>
                            ) : (
                              <>
                                <span>{isInProgress ? 'Continue Interview' : 'Start Round'}</span>
                                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              </>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-center ${
                          isDarkMode 
                            ? 'bg-gray-700/50 text-gray-400 border border-gray-600/40' 
                            : 'bg-gray-100 text-gray-500 border border-gray-300'
                        }`}>
                          <div className="flex items-center justify-center space-x-2">
                            <Lock className="h-4 w-4" />
                            <span>Complete Previous Rounds</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Professional Assessment Summary */}
            <div className="mt-12">
              <div className={`rounded-2xl p-8 shadow-2xl transition-all duration-500 hover:scale-105 backdrop-blur-xl border ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-900/80 via-gray-900/60 to-black/40 border-white/10' 
                  : 'bg-gradient-to-br from-white/90 via-slate-50/80 to-gray-100/60 border-gray-200'
              }`}>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`p-4 rounded-2xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-blue-400/40'
                    }`}>
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <h3 className={`font-bold text-3xl ml-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Assessment Summary</h3>
                  </div>
                  
                  <div className={`text-xl mb-8 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-600'
                  }`}>
                    <span className="font-semibold">Progress:</span> 
                    <span className={`font-bold text-3xl mx-2 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>{Math.min(completedRounds.size, allRounds.length)}</span>
                    <span className="font-semibold">/</span>
                    <span className={`font-bold text-2xl mx-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{allRounds.length}</span>
                    <span className="font-semibold">rounds completed</span>
                </div>
                  
                  <div className={`w-full rounded-full h-4 mb-6 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 h-4 rounded-full transition-all duration-1000 shadow-lg relative overflow-hidden"
                    style={{ width: `${allRounds.length > 0 ? Math.min((completedRounds.size / allRounds.length) * 100, 100) : 0}%` }}
                  >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className={`text-lg font-semibold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {allRounds.length > 0 ? Math.min(Math.round((completedRounds.size / allRounds.length) * 100), 100) : 0}% Complete
                  </div>
                </div>

                {/* Professional Finish Button */}
                {completedRounds.size >= allRounds.length && allRounds.length > 0 && (
                  <div className="mt-8">
                    <button
                      onClick={() => {
                        console.log('🎉 Finishing interview...');
                        if (onFinishInterview) {
                          onFinishInterview();
                        }
                      }}
                      className={`w-full max-w-lg mx-auto py-6 px-8 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-green-500/50'
                          : 'bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white shadow-green-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <Crown className="w-8 h-8" />
                        <span>🎉 Complete Assessment & Generate Report</span>
                      </div>
                    </button>
                    <p className={`text-sm mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Generate comprehensive AI-powered assessment report
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundSelection;