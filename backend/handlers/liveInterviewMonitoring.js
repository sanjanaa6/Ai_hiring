const Interview = require('../models/Interview');
const User = require('../models/User');

/**
 * Get all live/active interviews with candidate progress
 */
const getLiveInterviews = async (req, res) => {
  try {
    console.log('📊 [LIVE MONITOR] Fetching live interviews...');
    
    // Get all active interviews
    const interviews = await Interview.find({
      status: 'active',
      approvalStatus: 'approved'
    }).select('interviewId title jobTitle rounds candidateAnswers');

    // Get all users with active interview progress
    const usersWithProgress = await User.find({
      'interviewProgress': { $exists: true, $ne: [] }
    }).select('name email interviewProgress');

    const liveInterviews = [];

    // Process each user's progress
    for (const user of usersWithProgress) {
      for (const progress of user.interviewProgress) {
        // Only include in-progress or recently completed interviews (within last hour)
        const isActive = progress.status === 'in_progress' || progress.status === 'started';
        const isRecentlyCompleted = progress.status === 'completed' && 
          progress.completedAt && 
          (new Date() - new Date(progress.completedAt)) < 3600000; // 1 hour

        if (isActive || isRecentlyCompleted) {
          // Find the corresponding interview
          const interview = interviews.find(i => i.interviewId === progress.interviewId);
          
          if (interview) {
            // Calculate time spent
            const startTime = new Date(progress.startedAt || progress.lastAccessedAt);
            const currentTime = new Date();
            const timeSpent = Math.floor((currentTime - startTime) / 1000); // in seconds

            // Find current round
            const currentRoundData = progress.rounds?.find(r => r.status === 'in_progress');
            const currentRound = currentRoundData ? 
              interview.rounds.find(r => r.roundId === currentRoundData.roundId) : null;

            // Count completed rounds
            const completedRounds = progress.rounds?.filter(r => r.status === 'completed').length || 0;

            liveInterviews.push({
              interviewId: interview.interviewId,
              interviewTitle: interview.title,
              jobTitle: interview.jobTitle,
              candidateId: user._id.toString(),
              candidateName: user.name,
              candidateEmail: user.email,
              status: progress.status,
              startedAt: progress.startedAt || progress.lastAccessedAt,
              lastAccessedAt: progress.lastAccessedAt,
              timeSpent,
              currentRound: currentRound?.title || null,
              currentRoundNumber: currentRoundData?.roundNumber || null,
              completedRounds,
              totalRounds: interview.rounds.length,
              progress: {
                answeredQuestions: progress.progress?.answeredQuestions || 0,
                totalQuestions: progress.progress?.totalQuestions || 0,
                percentage: progress.progress?.totalQuestions > 0 
                  ? Math.round((progress.progress.answeredQuestions / progress.progress.totalQuestions) * 100)
                  : 0
              }
            });
          }
        }
      }
    }

    // Sort by most recent activity
    liveInterviews.sort((a, b) => 
      new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
    );

    console.log(`✅ [LIVE MONITOR] Found ${liveInterviews.length} live/recent interviews`);

    res.json({
      success: true,
      data: liveInterviews,
      count: liveInterviews.length,
      activeCount: liveInterviews.filter(i => i.status === 'in_progress' || i.status === 'started').length
    });

  } catch (error) {
    console.error('❌ [LIVE MONITOR] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live interviews: ' + error.message
    });
  }
};

/**
 * Get detailed real-time data for a specific candidate's interview
 */
const getCandidateInterviewDetails = async (req, res) => {
  try {
    const { interviewId, candidateId } = req.params;
    
    console.log('🔍 [LIVE MONITOR] Fetching details for:', { interviewId, candidateId });

    // Get the interview
    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Get the candidate/user
    const user = await User.findById(candidateId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    // Find the progress for this interview
    const progress = user.interviewProgress.find(p => p.interviewId === interviewId);
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Interview progress not found for this candidate'
      });
    }

    // Get candidate's answers
    const candidateAnswers = interview.candidateAnswers.filter(
      answer => answer.candidateId === candidateId
    );

    // Build detailed response
    const detailedData = {
      interview: {
        interviewId: interview.interviewId,
        title: interview.title,
        jobTitle: interview.jobTitle,
        totalRounds: interview.rounds.length,
        rounds: interview.rounds.map(round => ({
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          duration: round.duration,
          type: round.type,
          questionCount: round.questions?.length || 0
        }))
      },
      candidate: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      },
      progress: {
        status: progress.status,
        startedAt: progress.startedAt,
        lastAccessedAt: progress.lastAccessedAt,
        completedAt: progress.completedAt,
        totalTimeSpent: progress.totalTimeSpent,
        rounds: progress.rounds.map(roundProgress => {
          const roundData = interview.rounds.find(r => r.roundId === roundProgress.roundId);
          return {
            ...roundProgress,
            roundTitle: roundData?.title,
            roundType: roundData?.type,
            questions: roundProgress.questions.map(q => {
              const questionData = roundData?.questions.find(rq => rq.id === q.questionId);
              return {
                ...q,
                questionText: questionData?.question
              };
            })
          };
        }),
        overallProgress: {
          completedRounds: progress.progress?.completedRounds || 0,
          totalRounds: progress.progress?.totalRounds || 0,
          answeredQuestions: progress.progress?.answeredQuestions || 0,
          totalQuestions: progress.progress?.totalQuestions || 0,
          percentage: progress.progress?.totalQuestions > 0 
            ? Math.round((progress.progress.answeredQuestions / progress.progress.totalQuestions) * 100)
            : 0
        }
      },
      answers: candidateAnswers.map(answer => ({
        roundId: answer.roundId,
        questionId: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        answerType: answer.answerType,
        timeTaken: answer.timeTaken,
        timestamp: answer.timestamp,
        aiEvaluation: answer.aiEvaluation
      })),
      realTimeData: {
        isActive: progress.status === 'in_progress' || progress.status === 'started',
        currentRound: progress.rounds?.find(r => r.status === 'in_progress'),
        lastActivity: progress.lastAccessedAt,
        sessionDuration: progress.startedAt ? 
          Math.floor((new Date() - new Date(progress.startedAt)) / 1000) : 0
      }
    };

    console.log('✅ [LIVE MONITOR] Details fetched successfully');

    res.json({
      success: true,
      data: detailedData
    });

  } catch (error) {
    console.error('❌ [LIVE MONITOR] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview details: ' + error.message
    });
  }
};

/**
 * Get live statistics for monitoring dashboard
 */
const getLiveStatistics = async (req, res) => {
  try {
    console.log('📈 [LIVE MONITOR] Fetching live statistics...');

    // Get all users with progress
    const usersWithProgress = await User.find({
      'interviewProgress': { $exists: true, $ne: [] }
    }).select('interviewProgress');

    const stats = {
      activeNow: 0,
      totalToday: 0,
      completedToday: 0,
      averageProgress: 0,
      byStatus: {
        started: 0,
        in_progress: 0,
        completed: 0,
        paused: 0
      }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalProgressPercentage = 0;
    let progressCount = 0;

    for (const user of usersWithProgress) {
      for (const progress of user.interviewProgress) {
        // Count today's interviews
        const startedToday = progress.startedAt && new Date(progress.startedAt) >= today;
        if (startedToday) {
          stats.totalToday++;
        }

        // Count by status
        if (progress.status === 'in_progress' || progress.status === 'started') {
          stats.activeNow++;
          stats.byStatus[progress.status]++;
        } else if (progress.status === 'completed' && startedToday) {
          stats.completedToday++;
          stats.byStatus.completed++;
        }

        // Calculate average progress
        if (progress.progress?.totalQuestions > 0) {
          const percentage = (progress.progress.answeredQuestions / progress.progress.totalQuestions) * 100;
          totalProgressPercentage += percentage;
          progressCount++;
        }
      }
    }

    stats.averageProgress = progressCount > 0 ? Math.round(totalProgressPercentage / progressCount) : 0;

    console.log('✅ [LIVE MONITOR] Statistics calculated');

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [LIVE MONITOR] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics: ' + error.message
    });
  }
};

module.exports = {
  getLiveInterviews,
  getCandidateInterviewDetails,
  getLiveStatistics
};
