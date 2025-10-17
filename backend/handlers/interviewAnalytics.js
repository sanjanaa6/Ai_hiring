

// Enhanced Interview Analytics handlers for comprehensive performance analysis
const Interview = require('../models/Interview');
const User = require('../models/User');
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

    // Get comprehensive feedback data from Interview model
    const feedbackData = interview.candidateFeedbacks.find(
      f => f.candidateId === candidateId
    );

    console.log('✅ [CANDIDATE DETAILS] Generated detailed view for candidate:', candidate.candidateName);
    console.log('📊 [CANDIDATE DETAILS] Feedback data:', feedbackData ? 'Found' : 'Not found');

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
        // Include comprehensive feedback data
        feedback: feedbackData ? {
          overallScore: feedbackData.overallScore,
          overallPerformance: feedbackData.overallPerformance,
          strengths: feedbackData.strengths,
          areasForImprovement: feedbackData.areasForImprovement,
          recommendations: feedbackData.recommendations,
          skillScores: feedbackData.skillScores,
          roundWiseFeedback: feedbackData.roundWiseFeedback,
          questionScores: feedbackData.questionScores,
          monitoringData: feedbackData.monitoringData,
          pdfUrl: feedbackData.pdfUrl,
          generatedAt: feedbackData.generatedAt
        } : null,
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

// Get comprehensive interview analytics with communication analysis
const getInterviewAnalytics = async (req, res) => {
  console.log('📊 [ANALYTICS] Fetching comprehensive analytics for interview:', req.params.interviewId);
  console.log('👤 [ANALYTICS] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [ANALYTICS] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [ANALYTICS] Interview found, generating comprehensive analytics...');
    
    // Fetch all users who have taken this interview
    const usersWithInterview = await User.find({
      'interviewProgress.interviewId': req.params.interviewId
    }).select('name email interviewProgress');
    
    console.log('👥 [ANALYTICS] Found', usersWithInterview.length, 'users who took this interview');
    
    // Process candidate data with enhanced analytics
    const candidateData = [];
    const allAnswers = interview.candidateAnswers || [];
    
    usersWithInterview.forEach(user => {
      const interviewProgress = user.interviewProgress.find(
        progress => progress.interviewId === req.params.interviewId
      );
      
      if (interviewProgress) {
        const userAnswers = allAnswers.filter(answer => answer.candidateId === user._id.toString());
        
        // Calculate comprehensive metrics
        const totalRounds = interview.rounds.length;
        const completedRounds = interviewProgress.progress.completedRounds || 0;
        const totalQuestions = interview.rounds.reduce((sum, round) => sum + round.questions.length, 0);
        const answeredQuestions = userAnswers.length;
        const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
        
        // Calculate average score
        const averageScore = userAnswers.length > 0 ? 
          userAnswers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0) / userAnswers.length : 0;
        
        // Calculate communication score based on AI feedback analysis
        const communicationScore = calculateCommunicationScore(userAnswers);
        
        // Calculate time metrics
        const totalTimeSpent = userAnswers.length > 0 ? 
          userAnswers.reduce((sum, answer) => sum + answer.timeTaken, 0) : 
          interviewProgress.totalTimeSpent || 0;
        
        // Extract strengths and improvements
        const allStrengths = userAnswers.flatMap(answer => answer.aiEvaluation?.strengths || []);
        const allImprovements = userAnswers.flatMap(answer => answer.aiEvaluation?.improvements || []);
        
        candidateData.push({
          candidateId: user._id.toString(),
          candidateName: user.name,
          candidateEmail: user.email,
          averageScore: Math.round(averageScore * 100) / 100,
          communicationScore: Math.round(communicationScore * 100) / 100,
          totalScore: userAnswers.length > 0 ? 
            userAnswers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0) : 
            Math.round(averageScore * answeredQuestions * 100) / 100,
          totalAnswers: userAnswers.length > 0 ? userAnswers.length : answeredQuestions,
          roundsCompleted: completedRounds,
          totalRounds: totalRounds,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
          totalTimeSpent: totalTimeSpent,
          averageTimePerQuestion: answeredQuestions > 0 ? Math.round(totalTimeSpent / answeredQuestions) : 0,
          startedAt: interviewProgress.startedAt,
          completedAt: interviewProgress.completedAt,
          status: interviewProgress.status,
          strengths: allStrengths.length > 0 ? allStrengths : generateMockStrengths(averageScore),
          improvements: allImprovements.length > 0 ? allImprovements : generateMockImprovements(averageScore),
          answers: userAnswers
        });
      }
    });
    
    console.log('📈 [ANALYTICS] Generated candidate data for', candidateData.length, 'candidates');
    
    // Calculate comprehensive analytics
    const analytics = {
      interview: {
        interviewId: interview.interviewId,
        title: interview.title,
        jobTitle: interview.jobTitle,
        totalDuration: interview.totalDuration,
        totalRounds: interview.rounds.length,
        totalQuestions: interview.rounds.reduce((sum, round) => sum + round.questions.length, 0)
      },
      overview: {
        totalCandidates: candidateData.length,
        completedInterviews: candidateData.filter(c => c.status === 'completed').length,
        inProgressInterviews: candidateData.filter(c => c.status === 'in_progress').length,
        averageScore: candidateData.length > 0 ? 
          candidateData.reduce((sum, c) => sum + c.averageScore, 0) / candidateData.length : 0,
        averageCommunicationScore: candidateData.length > 0 ? 
          candidateData.reduce((sum, c) => sum + c.communicationScore, 0) / candidateData.length : 0,
        averageCompletionRate: candidateData.length > 0 ? 
          candidateData.reduce((sum, c) => sum + c.completionPercentage, 0) / candidateData.length : 0,
        averageTimeSpent: candidateData.length > 0 ? 
          candidateData.reduce((sum, c) => sum + c.totalTimeSpent, 0) / candidateData.length : 0,
        completionRate: candidateData.length > 0 ? 
          (candidateData.filter(c => c.status === 'completed').length / candidateData.length) * 100 : 0
      },
      performance: {
        scoreDistribution: calculateScoreDistribution(candidateData),
        communicationDistribution: calculateCommunicationDistribution(candidateData),
        completionDistribution: calculateCompletionDistribution(candidateData)
      },
      insights: {
        topPerformers: candidateData
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 5),
        topCommunicators: candidateData
          .sort((a, b) => b.communicationScore - a.communicationScore)
          .slice(0, 5),
        fastestCompleters: candidateData
          .filter(c => c.status === 'completed')
          .sort((a, b) => a.totalTimeSpent - b.totalTimeSpent)
          .slice(0, 5),
        needsAttention: candidateData
          .filter(c => c.averageScore < 2.0 || c.completionPercentage < 50)
          .sort((a, b) => a.averageScore - b.averageScore)
      },
      candidates: candidateData
    };

    console.log('✅ [ANALYTICS] Analytics generated successfully');

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ [ANALYTICS] Error occurred:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      details: error.message
    });
  }
};

// Calculate communication score based on AI feedback analysis
const calculateCommunicationScore = (userAnswers) => {
  if (!userAnswers || userAnswers.length === 0) return 0;
  
  let totalCommunicationScore = 0;
  let validAnswers = 0;
  
  userAnswers.forEach(answer => {
    const feedback = answer.aiEvaluation?.feedback || '';
    const baseScore = answer.aiEvaluation?.score || 0;
    
    // Communication keywords analysis
    const communicationKeywords = [
      'clear', 'articulate', 'confident', 'professional', 'concise',
      'detailed', 'well-structured', 'logical', 'persuasive', 'engaging',
      'eloquent', 'coherent', 'fluent', 'expressive', 'compelling'
    ];
    
    const negativeKeywords = [
      'unclear', 'confusing', 'rambling', 'disorganized', 'incoherent',
      'vague', 'unfocused', 'poor communication', 'hard to follow'
    ];
    
    const keywordCount = communicationKeywords.filter(keyword => 
      feedback.toLowerCase().includes(keyword)
    ).length;
    
    const negativeCount = negativeKeywords.filter(keyword => 
      feedback.toLowerCase().includes(keyword)
    ).length;
    
    // Calculate communication score (0-4 scale)
    let communicationScore = baseScore;
    
    // Boost for positive communication indicators
    if (keywordCount > 0) {
      communicationScore += (keywordCount * 0.2);
    }
    
    // Penalty for negative communication indicators
    if (negativeCount > 0) {
      communicationScore -= (negativeCount * 0.3);
    }
    
    // Ensure score stays within bounds
    communicationScore = Math.max(0, Math.min(4, communicationScore));
    
    totalCommunicationScore += communicationScore;
    validAnswers++;
  });
  
  return validAnswers > 0 ? totalCommunicationScore / validAnswers : 0;
};

// Calculate score distribution
const calculateScoreDistribution = (candidateData) => {
  const distribution = {
    excellent: candidateData.filter(c => c.averageScore >= 3.5).length,
    good: candidateData.filter(c => c.averageScore >= 2.5 && c.averageScore < 3.5).length,
    average: candidateData.filter(c => c.averageScore >= 1.5 && c.averageScore < 2.5).length,
    poor: candidateData.filter(c => c.averageScore < 1.5).length
  };
  
  return [
    { label: 'Excellent (3.5+)', value: distribution.excellent },
    { label: 'Good (2.5-3.4)', value: distribution.good },
    { label: 'Average (1.5-2.4)', value: distribution.average },
    { label: 'Poor (<1.5)', value: distribution.poor }
  ];
};

// Calculate communication distribution
const calculateCommunicationDistribution = (candidateData) => {
  const distribution = {
    excellent: candidateData.filter(c => c.communicationScore >= 3.5).length,
    good: candidateData.filter(c => c.communicationScore >= 2.5 && c.communicationScore < 3.5).length,
    average: candidateData.filter(c => c.communicationScore >= 1.5 && c.communicationScore < 2.5).length,
    poor: candidateData.filter(c => c.communicationScore < 1.5).length
  };
  
  return [
    { label: 'Excellent (3.5+)', value: distribution.excellent },
    { label: 'Good (2.5-3.4)', value: distribution.good },
    { label: 'Average (1.5-2.4)', value: distribution.average },
    { label: 'Poor (<1.5)', value: distribution.poor }
  ];
};

// Calculate completion distribution
const calculateCompletionDistribution = (candidateData) => {
  const distribution = {
    completed: candidateData.filter(c => c.completionPercentage >= 90).length,
    mostlyComplete: candidateData.filter(c => c.completionPercentage >= 70 && c.completionPercentage < 90).length,
    partiallyComplete: candidateData.filter(c => c.completionPercentage >= 40 && c.completionPercentage < 70).length,
    barelyStarted: candidateData.filter(c => c.completionPercentage < 40).length
  };
  
  return [
    { label: 'Completed (90%+)', value: distribution.completed },
    { label: 'Mostly Complete (70-89%)', value: distribution.mostlyComplete },
    { label: 'Partially Complete (40-69%)', value: distribution.partiallyComplete },
    { label: 'Barely Started (<40%)', value: distribution.barelyStarted }
  ];
};

// Generate mock strengths based on score
const generateMockStrengths = (score) => {
  if (score >= 3.5) {
    return [
      'Excellent technical knowledge',
      'Strong problem-solving skills',
      'Clear communication',
      'Professional demeanor'
    ];
  } else if (score >= 2.5) {
    return [
      'Good technical understanding',
      'Solid problem-solving approach',
      'Adequate communication'
    ];
  } else if (score >= 1.5) {
    return [
      'Basic technical knowledge',
      'Some problem-solving ability'
    ];
  } else {
    return [
      'Shows potential for improvement'
    ];
  }
};

// Generate mock improvements based on score
const generateMockImprovements = (score) => {
  if (score >= 3.5) {
    return [
      'Continue building on existing strengths',
      'Consider advanced certifications'
    ];
  } else if (score >= 2.5) {
    return [
      'Enhance technical depth',
      'Improve communication clarity',
      'Practice problem-solving techniques'
    ];
  } else if (score >= 1.5) {
    return [
      'Strengthen fundamental concepts',
      'Improve communication skills',
      'Practice more coding problems',
      'Study industry best practices'
    ];
  } else {
    return [
      'Focus on basic technical skills',
      'Improve communication',
      'Practice fundamental concepts',
      'Consider additional training'
    ];
  }
};

module.exports = {
  getPerformanceAnalytics,
  getRankedCandidates,
  getCandidateDetails,
  getInterviewAnalytics
};
