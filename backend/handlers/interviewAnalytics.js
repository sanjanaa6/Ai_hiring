

// Interview analytics and performance handlers
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const { getCandidateSummaries } = require('../utils/interviewUtils');

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

// Get ranked candidates list with sorting options
const getRankedCandidates = async (req, res) => {
  console.log('🏆 [RANKED CANDIDATES] Fetching ranked candidates for interview:', req.params.interviewId);
  console.log('👤 [RANKED CANDIDATES] User ID:', req.user.id);
  
  try {
    const { sortBy = 'score', sortOrder = 'desc', limit = 50, offset = 0 } = req.query;
    
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [RANKED CANDIDATES] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [RANKED CANDIDATES] Interview found, generating ranked candidates...');
    
    // Get candidate performance summaries
    const candidateSummaries = getCandidateSummaries(interview.candidateAnswers);
    
    // Calculate additional metrics for ranking
    const enhancedCandidates = candidateSummaries.map((candidate, index) => {
      const totalTimeSpent = candidate.answers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0);
      const averageTimePerQuestion = candidate.totalAnswers > 0 ? totalTimeSpent / candidate.totalAnswers : 0;
      
      // Calculate completion percentage
      const totalQuestions = interview.rounds.reduce((sum, round) => sum + round.questions.length, 0);
      const completionPercentage = totalQuestions > 0 ? (candidate.totalAnswers / totalQuestions) * 100 : 0;
      
      // Calculate rank based on multiple factors
      const scoreWeight = 0.6;
      const completionWeight = 0.3;
      const timeWeight = 0.1;
      
      // Normalize time (lower is better, so invert)
      const maxTime = Math.max(...candidateSummaries.map(c => 
        c.answers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0)
      ));
      const normalizedTime = maxTime > 0 ? (maxTime - totalTimeSpent) / maxTime : 0;
      
      const compositeScore = (candidate.averageScore * scoreWeight) + 
                           (completionPercentage / 100 * completionWeight) + 
                           (normalizedTime * timeWeight);
      
      return {
        ...candidate,
        rank: index + 1,
        totalTimeSpent: Math.round(totalTimeSpent),
        averageTimePerQuestion: Math.round(averageTimePerQuestion),
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        compositeScore: Math.round(compositeScore * 100) / 100,
        startedAt: candidate.answers.length > 0 ? 
          new Date(Math.min(...candidate.answers.map(a => a.timestamp))) : null,
        completedAt: candidate.answers.length > 0 ? 
          new Date(Math.max(...candidate.answers.map(a => a.timestamp))) : null,
        status: completionPercentage === 100 ? 'completed' : 
                completionPercentage > 0 ? 'in_progress' : 'not_started'
      };
    });

    // Apply sorting
    let sortedCandidates = [...enhancedCandidates];
    switch (sortBy) {
      case 'score':
        sortedCandidates.sort((a, b) => sortOrder === 'desc' ? 
          b.averageScore - a.averageScore : a.averageScore - b.averageScore);
        break;
      case 'time':
        sortedCandidates.sort((a, b) => sortOrder === 'desc' ? 
          b.totalTimeSpent - a.totalTimeSpent : a.totalTimeSpent - b.totalTimeSpent);
        break;
      case 'completion':
        sortedCandidates.sort((a, b) => sortOrder === 'desc' ? 
          b.completionPercentage - a.completionPercentage : a.completionPercentage - b.completionPercentage);
        break;
      case 'composite':
        sortedCandidates.sort((a, b) => sortOrder === 'desc' ? 
          b.compositeScore - a.compositeScore : a.compositeScore - b.compositeScore);
        break;
      case 'name':
        sortedCandidates.sort((a, b) => sortOrder === 'desc' ? 
          b.candidateName.localeCompare(a.candidateName) : a.candidateName.localeCompare(b.candidateName));
        break;
      default:
        // Default to composite score ranking
        sortedCandidates.sort((a, b) => b.compositeScore - a.compositeScore);
    }

    // Update ranks after sorting
    sortedCandidates = sortedCandidates.map((candidate, index) => ({
      ...candidate,
      rank: index + 1
    }));

    // Apply pagination
    const paginatedCandidates = sortedCandidates.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    console.log('📊 [RANKED CANDIDATES] Generated rankings for', enhancedCandidates.length, 'candidates');

    res.json({
      success: true,
      data: {
        candidates: paginatedCandidates,
        totalCandidates: enhancedCandidates.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < enhancedCandidates.length
        },
        sorting: {
          sortBy,
          sortOrder
        },
        summary: {
          totalCandidates: enhancedCandidates.length,
          completedInterviews: enhancedCandidates.filter(c => c.status === 'completed').length,
          inProgressInterviews: enhancedCandidates.filter(c => c.status === 'in_progress').length,
          averageScore: enhancedCandidates.length > 0 ? 
            Math.round(enhancedCandidates.reduce((sum, c) => sum + c.averageScore, 0) / enhancedCandidates.length * 100) / 100 : 0,
          averageCompletionRate: enhancedCandidates.length > 0 ? 
            Math.round(enhancedCandidates.reduce((sum, c) => sum + c.completionPercentage, 0) / enhancedCandidates.length * 100) / 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [RANKED CANDIDATES] Error occurred:', error.message);
    console.error('🔍 [RANKED CANDIDATES] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ranked candidates'
    });
  }
};

// Get detailed candidate performance
const getCandidateDetails = async (req, res) => {
  console.log('👤 [CANDIDATE DETAILS] Fetching candidate details:', req.params.candidateId);
  console.log('👤 [CANDIDATE DETAILS] User ID:', req.user.id);
  
  try {
    const { candidateId } = req.params;
    
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [CANDIDATE DETAILS] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    // Find candidate's answers
    const candidateAnswers = interview.candidateAnswers.filter(answer => 
      answer.candidateId === candidateId
    );

    if (candidateAnswers.length === 0) {
      console.log('❌ [CANDIDATE DETAILS] Candidate not found:', candidateId);
      return res.status(404).json({
        success: false,
        error: 'Candidate not found or no answers submitted'
      });
    }

    // Get candidate summary
    const candidateSummaries = getCandidateSummaries(candidateAnswers);
    const candidate = candidateSummaries[0]; // Should be only one candidate

    // Organize answers by rounds
    const answersByRound = {};
    interview.rounds.forEach(round => {
      answersByRound[round.roundId] = {
        round: {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          duration: round.duration,
          evaluationCriteria: round.evaluationCriteria
        },
        questions: round.questions.map(question => {
          const answer = candidateAnswers.find(a => a.questionId === question.id);
          return {
            question: {
              id: question.id,
              type: question.type,
              question: question.question,
              expectedAnswer: question.expectedAnswer,
              timeLimit: question.timeLimit,
              difficulty: question.difficulty,
              followUpQuestions: question.followUpQuestions
            },
            answer: answer ? {
              answer: answer.answer,
              timeTaken: answer.timeTaken,
              submittedAt: answer.timestamp,
              aiEvaluation: answer.aiEvaluation
            } : null
          };
        })
      };
    });

    // Calculate detailed metrics
    const totalTimeSpent = candidate.answers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0);
    const totalQuestions = interview.rounds.reduce((sum, round) => sum + round.questions.length, 0);
    const completionPercentage = totalQuestions > 0 ? (candidate.totalAnswers / totalQuestions) * 100 : 0;
    
    // Calculate round-wise performance
    const roundPerformance = interview.rounds.map(round => {
      const roundAnswers = candidate.answers.filter(a => a.roundId === round.roundId);
      const roundScores = roundAnswers.map(a => a.score);
      const averageRoundScore = roundScores.length > 0 ? 
        roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length : 0;
      
      return {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        title: round.title,
        questionsAnswered: roundAnswers.length,
        totalQuestions: round.questions.length,
        averageScore: Math.round(averageRoundScore * 100) / 100,
        completionRate: Math.round((roundAnswers.length / round.questions.length) * 100),
        timeSpent: roundAnswers.reduce((sum, a) => sum + (a.timeTaken || 0), 0)
      };
    });

    // Get overall ranking
    const allCandidates = getCandidateSummaries(interview.candidateAnswers);
    const candidateRank = allCandidates.findIndex(c => c.candidateId === candidateId) + 1;

    console.log('✅ [CANDIDATE DETAILS] Generated detailed view for candidate:', candidate.candidateName);

    res.json({
      success: true,
      data: {
        candidate: {
          candidateId: candidate.candidateId,
          candidateName: candidate.candidateName,
          candidateEmail: candidate.candidateEmail,
          rank: candidateRank,
          totalCandidates: allCandidates.length
        },
        performance: {
          averageScore: candidate.averageScore,
          totalScore: candidate.totalScore,
          totalAnswers: candidate.totalAnswers,
          totalTimeSpent: Math.round(totalTimeSpent),
          averageTimePerQuestion: candidate.totalAnswers > 0 ? 
            Math.round(totalTimeSpent / candidate.totalAnswers) : 0,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
          roundsCompleted: candidate.roundsCompleted.length,
          totalRounds: interview.rounds.length,
          status: completionPercentage === 100 ? 'completed' : 
                  completionPercentage > 0 ? 'in_progress' : 'not_started',
          startedAt: candidate.answers.length > 0 ? 
            new Date(Math.min(...candidate.answers.map(a => a.timestamp))) : null,
          completedAt: candidate.answers.length > 0 ? 
            new Date(Math.max(...candidate.answers.map(a => a.timestamp))) : null
        },
        strengths: candidate.strengths,
        improvements: candidate.improvements,
        roundPerformance,
        answersByRound,
        interview: {
          interviewId: interview.interviewId,
          title: interview.title,
          jobTitle: interview.jobTitle,
          totalDuration: interview.totalDuration,
          rounds: interview.rounds.map(round => ({
            roundId: round.roundId,
            roundNumber: round.roundNumber,
            title: round.title,
            description: round.description,
            duration: round.duration,
            questionCount: round.questions.length
          }))
        }
      }
    });

  } catch (error) {
    console.error('❌ [CANDIDATE DETAILS] Error occurred:', error.message);
    console.error('🔍 [CANDIDATE DETAILS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate details'
    });
  }
};

module.exports = {
  getPerformanceAnalytics,
  getRankedCandidates,
  getCandidateDetails
};
