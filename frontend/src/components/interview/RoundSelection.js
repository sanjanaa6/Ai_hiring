import React from 'react';
import { CheckCircle, Lock, Clock, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const RoundSelection = ({ 
  allRounds, 
  completedRounds, 
  userProgress, 
  interviewData,
  onSelectRound,
  loading 
}) => {
  const { isDarkMode } = useTheme();

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
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading interview rounds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`backdrop-blur-md border-b px-6 py-4 ${
          isDarkMode 
            ? 'bg-black/20 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <div className="text-center">
            <h1 className={`text-2xl font-bold mb-1 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Choose Interview Round</h1>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Complete rounds in sequence to unlock the next ones</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRounds.map((round, index) => {
                const roundId = round._id || round.id || round.roundId;
                const isCompleted = completedRounds.has(roundId);
                const isAvailable = index === 0 || completedRounds.has(allRounds[index - 1]?._id || allRounds[index - 1]?.id || allRounds[index - 1]?.roundId);
                
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
                
                return (
                  <div
                    key={roundId}
                    className={`group relative rounded-3xl p-8 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 ${
                      isCompleted
                        ? isDarkMode 
                          ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/15 to-teal-500/10 border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/30' 
                          : 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 shadow-2xl shadow-emerald-200/60'
                        : isScheduled
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-orange-900/40 via-red-900/30 to-pink-900/20 border-2 border-orange-700/40 opacity-70'
                          : 'bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 border-2 border-orange-400 opacity-70'
                        : finalAvailability
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-slate-900/80 via-gray-900/60 to-black/40 border-2 border-blue-400/40 hover:border-blue-400/80 hover:shadow-2xl hover:shadow-blue-500/40 cursor-pointer backdrop-blur-md'
                          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-300 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200/60 cursor-pointer'
                        : isDarkMode
                          ? 'bg-gradient-to-br from-gray-900/40 via-slate-900/30 to-black/20 border-2 border-gray-700/40 opacity-60'
                          : 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 border-2 border-gray-400 opacity-60'
                    }`}
                  >
                    {/* Animated Background Glow */}
                    {finalAvailability && !isScheduled && (
                      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-indigo-500/10 animate-pulse' 
                          : 'bg-gradient-to-br from-blue-100/60 via-cyan-100/40 to-indigo-100/50'
                      }`}></div>
                    )}
                    
                    {/* Floating Particles Effect */}
                    {finalAvailability && !isScheduled && (
                      <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute top-2 left-4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-60"></div>
                        <div className="absolute top-6 right-6 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40 delay-300"></div>
                        <div className="absolute bottom-4 left-8 w-1 h-1 bg-indigo-400 rounded-full animate-ping opacity-50 delay-700"></div>
                        <div className="absolute bottom-8 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-30 delay-1000"></div>
                      </div>
                    )}
                    
                    <div className="relative z-10 text-center">
                      {/* Round Number with Enhanced Design */}
                      <div className="relative mb-8">
                        <div
                          className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-all duration-500 group-hover:scale-110 ${
                            isCompleted
                                ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-emerald-500/40'
                              : isScheduled
                                ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 shadow-orange-500/50'
                              : finalAvailability
                                ? 'bg-gradient-to-br from-slate-800 via-blue-600 to-indigo-700 shadow-blue-500/50'
                                : 'bg-gradient-to-br from-gray-600 to-slate-700 shadow-gray-500/30'
                          }`}
                        >
                          {isCompleted ? (
                              <CheckCircle className="h-10 w-10 text-white drop-shadow-lg animate-bounce" />
                          ) : (
                              <span className="text-white text-2xl font-black drop-shadow-lg">{index + 1}</span>
                          )}
                        </div>

                        {/* Animated Decorative Rings */}
                        {finalAvailability && !isScheduled && (
                          <>
                            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl border-2 border-blue-400/40 animate-ping"></div>
                            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl border border-cyan-400/60 animate-pulse"></div>
                            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl border border-indigo-400/30 animate-pulse delay-300"></div>
                          </>
                        )}
                        
                        {/* Glowing Orb Effect */}
                        {finalAvailability && !isScheduled && (
                          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-xl animate-pulse"></div>
                        )}
                      </div>

                      {/* Round Title with Better Typography */}
                      <h3
                        className={`text-2xl font-black mb-4 leading-tight transition-all duration-300 group-hover:scale-105 ${
                          isCompleted
                            ? isDarkMode ? 'text-emerald-200' : 'text-emerald-800'
                            : isScheduled
                            ? isDarkMode ? 'text-orange-300' : 'text-orange-700'
                            : finalAvailability
                            ? isDarkMode ? 'text-white' : 'text-slate-900'
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {round.title}
                      </h3>

                      {/* Round Description with Better Spacing */}
                      <p
                        className={`text-sm mb-6 leading-relaxed transition-all duration-300 ${
                          isCompleted
                            ? isDarkMode ? 'text-emerald-300/90' : 'text-emerald-700'
                            : isScheduled
                            ? isDarkMode ? 'text-orange-300/90' : 'text-orange-600'
                            : finalAvailability
                            ? isDarkMode ? 'text-gray-200/95' : 'text-slate-600'
                            : isDarkMode ? 'text-gray-500/70' : 'text-gray-400'
                        }`}
                      >
                        {round.description}
                      </p>

                      {/* Schedule Information */}
                      {isScheduled && (
                        <div className={`mb-6 p-4 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-orange-900/20 border-orange-700 text-orange-300' 
                            : 'bg-orange-50 border-orange-200 text-orange-700'
                        }`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold text-sm">Round is Scheduled</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div>Start: {new Date(roundSchedule.startDateTime).toLocaleString()}</div>
                            <div>End: {new Date(roundSchedule.endDateTime).toLocaleString()}</div>
                            <div className="font-medium mt-2">⏰ Round will be available during scheduled time</div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Round Info with Black/Blue Theme */}
                      <div className={`flex justify-center space-x-4 mb-8 ${
                        isDarkMode ? 'text-gray-300' : 'text-slate-600'
                      }`}>
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 group-hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-slate-800/60 border border-blue-400/30' 
                            : 'bg-blue-100/80 border border-blue-200'
                        }`}>
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-bold">{round.duration || 30}m</span>
                        </div>
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 group-hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-slate-800/60 border border-cyan-400/30' 
                            : 'bg-cyan-100/80 border border-cyan-200'
                        }`}>
                          <span className="text-xs font-bold">{round.questions?.length || 0} Q</span>
                        </div>
                      </div>

                      {/* Enhanced Action Button with Black/Blue Theme */}
                      {isCompleted ? (
                        <div className="space-y-4">
                          <div className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/20' 
                              : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-lg shadow-emerald-200/40'
                          }`}>
                            ✅ Completed
                          </div>
                          <button
                            onClick={() => startSpecificRound(roundId)}
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
                          >
                            Retake Round
                          </button>
                        </div>
                      ) : isScheduled && !isScheduledAndActive ? (
                        <div className={`w-full py-5 px-8 rounded-2xl font-bold text-sm transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-orange-800/40 text-orange-300 border-2 border-orange-600/40' 
                            : 'bg-orange-200 text-orange-700 border-2 border-orange-400'
                        }`}>
                          <div className="flex items-center justify-center space-x-3">
                            <span className="text-lg">⏰</span>
                            <span>Round is Scheduled - Not Yet Available</span>
                          </div>
                        </div>
                      ) : finalAvailability ? (
                        <button
                          onClick={() => startSpecificRound(roundId)}
                          disabled={loading}
                          className={`w-full py-5 px-8 rounded-2xl font-black text-base transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 disabled:transform-none shadow-2xl relative overflow-hidden ${
                            isInProgress 
                              ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 shadow-orange-500/40 hover:shadow-orange-500/60'
                              : 'bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-800 hover:from-slate-700 hover:via-blue-600 hover:to-indigo-700 shadow-blue-500/40 hover:shadow-blue-500/60'
                          } text-white disabled:from-gray-600 disabled:to-gray-600`}
                        >
                          {/* Animated Background */}
                          <div className={`absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 ${
                            isInProgress 
                              ? 'bg-gradient-to-r from-orange-400/20 via-amber-400/20 to-yellow-400/20'
                              : 'bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20'
                          }`}></div>
                          
                          {/* Button Content */}
                          <div className="relative z-10 flex items-center justify-center space-x-3">
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                        <div className={`w-full py-5 px-8 rounded-2xl font-bold text-sm transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-800/40 text-gray-400 border-2 border-gray-600/40' 
                            : 'bg-gray-200 text-gray-500 border-2 border-gray-400'
                        }`}>
                          <div className="flex items-center justify-center space-x-3">
                            <span className="text-lg">🔒</span>
                            <span>Complete Previous Rounds First</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Overall Progress with Black/Blue Theme */}
            <div className="mt-10 text-center">
              <div className={`border-2 rounded-3xl p-8 shadow-2xl transition-all duration-500 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-900/80 via-gray-900/60 to-black/40 border-blue-400/40 shadow-blue-500/30' 
                  : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-blue-300 shadow-blue-200/40'
              }`}>
                <h3 className={`font-black text-2xl mb-4 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>Interview Progress</h3>
                <div className={`text-lg mb-6 ${
                  isDarkMode ? 'text-gray-200' : 'text-slate-600'
                }`}>
                  Completed: <span className="font-black text-blue-500 text-2xl">{completedRounds.size}</span> / <span className="font-black text-xl">{allRounds.length}</span> rounds
                </div>
                <div className={`w-full rounded-full h-4 mt-4 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
                }`}>
                  <div
                    className="bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 h-4 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden"
                    style={{ width: `${allRounds.length > 0 ? (completedRounds.size / allRounds.length) * 100 : 0}%` }}
                  >
                    {/* Animated Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className={`text-sm mt-4 font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {allRounds.length > 0 ? Math.round((completedRounds.size / allRounds.length) * 100) : 0}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundSelection;