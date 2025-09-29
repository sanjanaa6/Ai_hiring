

// Interview analytics and performance handlers
const Interview = require('../../models/Interview');
const { auth } = require('../../middleware/auth');
const { getCandidateSummaries } = require('../../utils/interviewUtils');

// Get interview performance analytics (for recruiters only)
const getPerformanceAnalytics = async (req, res) => {
  console.log('📊 [PERFORMANCE] Fetching performance analytics for interview:', req.params.interviewId);
  console.log('👤 [PERFORMANCE] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [PERFORMANCE] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [PERFORMANCE] Interview found, generating performance analytics...');
    
    // Update statistics
    interview.updateStatistics();
    await interview.save();
    
    // Get candidate performance summaries
    const candidateSummaries = getCandidateSummaries(interview.candidateAnswers);
    console.log('📈 [PERFORMANCE] Generated summaries for', candidateSummaries.length, 'candidates');

    // Calculate detailed analytics
    const analytics = {
      overview: {
        totalCandidates: interview.statistics.totalCandidates,
        completedInterviews: interview.statistics.completedInterviews,
        averageScore: Math.round(interview.statistics.averageScore * 100) / 100,
        completionRate: Math.round(interview.statistics.completionRate * 100) / 100,
        totalAnswers: interview.candidateAnswers.length
      },
      scoreDistribution: {
        excellent: candidateSummaries.filter(c => c.averageScore >= 3.5).length,
        good: candidateSummaries.filter(c => c.averageScore >= 2.5 && c.averageScore < 3.5).length,
        satisfactory: candidateSummaries.filter(c => c.averageScore >= 1.5 && c.averageScore < 2.5).length,
        needsImprovement: candidateSummaries.filter(c => c.averageScore < 1.5).length
      },
      roundAnalytics: interview.rounds.map(round => {
        const roundAnswers = interview.candidateAnswers.filter(a => a.roundId === round.roundId);
        const roundScores = roundAnswers.map(a => a.aiEvaluation?.score || 0);
        const averageRoundScore = roundScores.length > 0 ? 
          roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length : 0;
        
        return {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          questionCount: round.questions.length,
          totalAnswers: roundAnswers.length,
          averageScore: Math.round(averageRoundScore * 100) / 100,
          completionRate: Math.round((roundAnswers.length / interview.statistics.totalCandidates) * 100) / 100
        };
      }),
      timeAnalytics: {
        averageTimePerQuestion: interview.candidateAnswers.length > 0 ? 
          Math.round(interview.candidateAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / interview.candidateAnswers.length) : 0,
        fastestAnswer: interview.candidateAnswers.length > 0 ? 
          Math.min(...interview.candidateAnswers.map(a => a.timeTaken)) : 0,
        slowestAnswer: interview.candidateAnswers.length > 0 ? 
          Math.max(...interview.candidateAnswers.map(a => a.timeTaken)) : 0
      }
    };

    const responseData = {
      success: true,
      data: {
        interview: {
          interviewId: interview.interviewId,
          title: interview.title,
          jobTitle: interview.jobTitle,
          jobLevel: interview.jobLevel,
          totalDuration: interview.totalDuration,
          createdAt: interview.createdAt,
          status: interview.status
        },
        analytics,
        candidateSummaries,
        rounds: interview.rounds.map(round => ({
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          duration: round.duration,
          questionCount: round.questions.length
        }))
      }
    };

    console.log('📊 [PERFORMANCE] Performance analytics generated:', {
      totalCandidates: analytics.overview.totalCandidates,
      completedInterviews: analytics.overview.completedInterviews,
      averageScore: analytics.overview.averageScore,
      candidateSummaries: candidateSummaries.length
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ [PERFORMANCE] Error occurred:', error.message);
    console.error('🔍 [PERFORMANCE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics'
    });
  }
};

module.exports = {
  getPerformanceAnalytics
};
