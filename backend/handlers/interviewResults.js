// Comprehensive Interview Results handlers for HR/Recruiters
const Interview = require('../models/Interview');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getCandidateSummaries } = require('../utils/interviewUtils');

// Get comprehensive interview results with ranking and detailed analytics
const getInterviewResults = async (req, res) => {
  console.log('📊 [INTERVIEW RESULTS] Fetching comprehensive results for interview:', req.params.interviewId);
  console.log('👤 [INTERVIEW RESULTS] User ID:', req.user.id);
  console.log('🔍 [INTERVIEW RESULTS] Full request params:', req.params);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [INTERVIEW RESULTS] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [INTERVIEW RESULTS] Interview found, generating comprehensive results...');
    
    // Fetch all users who have taken this interview
    const usersWithInterview = await User.find({
      'interviewProgress.interviewId': req.params.interviewId
    }).select('name email interviewProgress');
    
    console.log('👥 [INTERVIEW RESULTS] Found', usersWithInterview.length, 'users who took this interview');
    
    // Extract candidate data from user progress and combine with actual answers
    const candidateData = [];
    usersWithInterview.forEach(user => {
      const interviewProgress = user.interviewProgress.find(
        progress => progress.interviewId === req.params.interviewId
      );
      
      if (interviewProgress) {
        // Get actual answers from interview.candidateAnswers for this user
        const userAnswers = interview.candidateAnswers.filter(
          answer => answer.candidateId === user._id.toString() || 
                   answer.candidateEmail === user.email ||
                   answer.candidateName === user.name
        );
        
        // Calculate performance metrics from user progress
        const totalQuestions = interviewProgress.progress.totalQuestions;
        const answeredQuestions = interviewProgress.progress.answeredQuestions;
        const completedRounds = interviewProgress.progress.completedRounds;
        const totalRounds = interviewProgress.progress.totalRounds;
        
        // Calculate completion percentage
        const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
        
        // Calculate real average score from actual answers if available
        let averageScore = 0;
        if (userAnswers.length > 0) {
          const totalScore = userAnswers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0);
          averageScore = totalScore / userAnswers.length;
        } else {
          // Fallback to mock score based on completion
          const baseScore = completionPercentage / 25;
          const timeBonus = interviewProgress.totalTimeSpent > 0 ? 
            Math.min(0.5, (interviewProgress.totalTimeSpent / 1000 / 60) / 10) : 0;
          averageScore = Math.min(4, Math.max(1, baseScore + timeBonus));
        }
        
        // Extract real strengths and improvements from answers
        const allStrengths = userAnswers.flatMap(answer => answer.aiEvaluation?.strengths || []);
        const allImprovements = userAnswers.flatMap(answer => answer.aiEvaluation?.improvements || []);
        
        candidateData.push({
          candidateId: user._id.toString(),
          candidateName: user.name,
          candidateEmail: user.email,
          averageScore: Math.round(averageScore * 100) / 100,
          totalScore: userAnswers.length > 0 ? 
            userAnswers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0) : 
            Math.round(averageScore * answeredQuestions * 100) / 100,
          totalAnswers: userAnswers.length > 0 ? userAnswers.length : answeredQuestions,
          roundsCompleted: completedRounds,
          totalRounds: totalRounds,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
          totalTimeSpent: userAnswers.length > 0 ? 
            userAnswers.reduce((sum, answer) => sum + answer.timeTaken, 0) : 
            interviewProgress.totalTimeSpent || 0,
          startedAt: interviewProgress.startedAt,
          completedAt: interviewProgress.completedAt,
          status: interviewProgress.status,
          strengths: allStrengths.length > 0 ? allStrengths : generateMockStrengths(averageScore),
          improvements: allImprovements.length > 0 ? allImprovements : generateMockImprovements(averageScore),
          answers: userAnswers // Include actual answers for detailed reports
        });
      }
    });
    
    console.log('📈 [INTERVIEW RESULTS] Generated candidate data for', candidateData.length, 'candidates');
    
    // Update statistics
    interview.updateStatistics();
    await interview.save();

    // Calculate comprehensive analytics
    const analytics = {
      overview: {
        totalCandidates: candidateData.length,
        completedInterviews: candidateData.filter(c => c.status === 'completed').length,
        averageScore: candidateData.length > 0 ? 
          Math.round(candidateData.reduce((sum, c) => sum + c.averageScore, 0) / candidateData.length * 100) / 100 : 0,
        completionRate: candidateData.length > 0 ? 
          Math.round(candidateData.reduce((sum, c) => sum + c.completionPercentage, 0) / candidateData.length * 100) / 100 : 0,
        totalAnswers: candidateData.reduce((sum, c) => sum + c.totalAnswers, 0),
        totalRounds: interview.rounds.length,
        averageTimePerQuestion: candidateData.length > 0 ? 
          Math.round(candidateData.reduce((sum, c) => sum + c.totalTimeSpent, 0) / candidateData.reduce((sum, c) => sum + c.totalAnswers, 1) / 1000 / 60) : 0
      },
      scoreDistribution: {
        excellent: candidateData.filter(c => c.averageScore >= 3.5).length,
        good: candidateData.filter(c => c.averageScore >= 2.5 && c.averageScore < 3.5).length,
        satisfactory: candidateData.filter(c => c.averageScore >= 1.5 && c.averageScore < 2.5).length,
        needsImprovement: candidateData.filter(c => c.averageScore < 1.5).length
      },
      roundAnalytics: interview.rounds.map(round => {
        // Calculate round performance from candidate data
        const candidatesWhoCompletedRound = candidateData.filter(c => c.roundsCompleted >= round.roundNumber);
        const averageRoundScore = candidatesWhoCompletedRound.length > 0 ? 
          candidatesWhoCompletedRound.reduce((sum, c) => sum + c.averageScore, 0) / candidatesWhoCompletedRound.length : 0;
        
        return {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          questionCount: round.questions.length,
          totalAnswers: candidatesWhoCompletedRound.length,
          averageScore: Math.round(averageRoundScore * 100) / 100,
          completionRate: candidateData.length > 0 ? 
            Math.round((candidatesWhoCompletedRound.length / candidateData.length) * 100) / 100 : 0,
          averageTimePerQuestion: candidatesWhoCompletedRound.length > 0 ? 
            Math.round(candidatesWhoCompletedRound.reduce((sum, c) => sum + c.totalTimeSpent, 0) / candidatesWhoCompletedRound.length / 1000 / 60) : 0
        };
      }),
      timeAnalytics: {
        averageTimePerQuestion: candidateData.length > 0 ? 
          Math.round(candidateData.reduce((sum, c) => sum + c.totalTimeSpent, 0) / candidateData.reduce((sum, c) => sum + c.totalAnswers, 1) / 1000 / 60) : 0,
        fastestAnswer: candidateData.length > 0 ? 
          Math.min(...candidateData.map(c => c.totalTimeSpent)) : 0,
        slowestAnswer: candidateData.length > 0 ? 
          Math.max(...candidateData.map(c => c.totalTimeSpent)) : 0,
        totalInterviewTime: candidateData.length > 0 ? 
          Math.round(candidateData.reduce((sum, c) => sum + c.totalTimeSpent, 0) / 1000 / 60) : 0 // in minutes
      }
    };

    // Rank candidates by score and time
    const rankedCandidates = candidateData
      .map(candidate => {
        return {
          ...candidate,
          totalTimeSpent: Math.round(candidate.totalTimeSpent / 1000 / 60), // in minutes
          rank: 0, // Will be calculated below
          performance: {
            score: candidate.averageScore,
            time: candidate.totalTimeSpent,
            completion: candidate.completionPercentage,
            efficiency: candidate.completionPercentage > 0 ? candidate.averageScore / (candidate.totalTimeSpent / 1000 / 60) : 0 // score per minute
          }
        };
      })
      .sort((a, b) => {
        // Primary sort: by average score (descending)
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        // Secondary sort: by completion percentage (descending)
        if (b.completionPercentage !== a.completionPercentage) {
          return b.completionPercentage - a.completionPercentage;
        }
        // Tertiary sort: by time spent (ascending - faster is better)
        return a.totalTimeSpent - b.totalTimeSpent;
      })
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1
      }));

    // Attach feedbackReport info for each candidate from Interview model
    for (const candidate of rankedCandidates) {
      try {
        // Check Interview model's candidateFeedbacks array
        const feedback = interview.candidateFeedbacks.find(
          f => f.candidateId === candidate.candidateId
        );
        
        if (feedback && feedback.pdfUrl) {
          candidate.feedbackReport = {
            pdfUrl: feedback.pdfUrl,
            generatedAt: feedback.generatedAt,
            overallPerformance: feedback.overallPerformance,
            strengths: feedback.strengths,
            areasForImprovement: feedback.areasForImprovement
          };
        }
        
        // Also check User model for backward compatibility
        const user = await User.findById(candidate.candidateId).select('interviewProgress');
        const progress = (user?.interviewProgress || []).find(p => p.interviewId === req.params.interviewId);
        if (progress?.feedbackReport && progress.feedbackReport.status === 'ready' && !candidate.feedbackReport) {
          candidate.feedbackReport = {
            pdfUrl: progress.feedbackReport.pdfUrl,
            generatedAt: progress.feedbackReport.generatedAt
          };
        }
      } catch (_) {}
    }

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
          status: interview.status,
          rounds: interview.rounds.map(round => ({
            roundId: round.roundId,
            roundNumber: round.roundNumber,
            title: round.title,
            description: round.description,
            duration: round.duration,
            questionCount: round.questions.length,
            evaluationCriteria: round.evaluationCriteria
          }))
        },
        analytics,
        rankedCandidates: rankedCandidates.map(rc => ({
          ...rc,
          feedbackReport: rc.feedbackReport || null
        })),
        summary: {
          topPerformer: rankedCandidates[0] || null,
          averagePerformance: {
            score: analytics.overview.averageScore,
            time: analytics.timeAnalytics.totalInterviewTime,
            completion: analytics.overview.completionRate
          },
          recommendations: generateRecommendations(rankedCandidates, analytics)
        }
      }
    };

    console.log('📊 [INTERVIEW RESULTS] Comprehensive results generated:', {
      totalCandidates: analytics.overview.totalCandidates,
      rankedCandidates: rankedCandidates.length,
      topPerformer: rankedCandidates[0]?.candidateName || 'None'
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ [INTERVIEW RESULTS] Error occurred:', error.message);
    console.error('🔍 [INTERVIEW RESULTS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview results'
    });
  }
};

// Get detailed candidate report with all rounds and feedback
const getCandidateReport = async (req, res) => {
  console.log('📋 [CANDIDATE REPORT] Fetching detailed report for candidate:', req.params.candidateId);
  console.log('👤 [CANDIDATE REPORT] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [CANDIDATE REPORT] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    // Find the candidate in the User database
    const candidate = await User.findById(req.params.candidateId).select('name email interviewProgress');
    
    if (!candidate) {
      console.log('❌ [CANDIDATE REPORT] Candidate not found:', req.params.candidateId);
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    const interviewProgress = candidate.interviewProgress.find(
      progress => progress.interviewId === req.params.interviewId
    );
    
    if (!interviewProgress) {
      console.log('❌ [CANDIDATE REPORT] No interview progress found for candidate:', req.params.candidateId);
      return res.status(404).json({
        success: false,
        error: 'No interview data found for this candidate'
      });
    }
    // Get actual answers from interview.candidateAnswers for this candidate
    const candidateAnswers = interview.candidateAnswers.filter(
      answer => answer.candidateId === req.params.candidateId || 
               answer.candidateEmail === candidate.email ||
               answer.candidateName === candidate.name
    );
    
    console.log('📝 [CANDIDATE REPORT] Found', candidateAnswers.length, 'actual answers for candidate');
    
    // Calculate performance metrics from interview progress
    const totalTimeSpent = candidateAnswers.length > 0 ? 
      candidateAnswers.reduce((sum, answer) => sum + answer.timeTaken, 0) : 
      interviewProgress.totalTimeSpent || 0;
    const totalQuestions = interviewProgress.progress.totalQuestions;
    const answeredQuestions = interviewProgress.progress.answeredQuestions;
    const completionPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    // Calculate real average score from actual answers if available
    let averageScore = 0;
    if (candidateAnswers.length > 0) {
      const totalScore = candidateAnswers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0);
      averageScore = totalScore / candidateAnswers.length;
    } else {
      // Fallback to mock score based on completion
      const baseScore = completionPercentage / 25;
      const timeBonus = totalTimeSpent > 0 ? 
        Math.min(0.5, (totalTimeSpent / 1000 / 60) / 10) : 0;
      averageScore = Math.min(4, Math.max(1, baseScore + timeBonus));
    }

    // Group answers by round using actual answers
    const answersByRound = interview.rounds.map(round => {
      const roundAnswers = candidateAnswers.filter(answer => answer.roundId === round.roundId);
      const roundScores = roundAnswers.map(answer => answer.aiEvaluation?.score || 0);
      const averageRoundScore = roundScores.length > 0 ? 
        roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length : 0;
      const roundTimeSpent = roundAnswers.reduce((sum, answer) => sum + answer.timeTaken, 0);
      
      return {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        title: round.title,
        description: round.description,
        questionCount: round.questions.length,
        answeredQuestions: roundAnswers.length,
        averageScore: Math.round(averageRoundScore * 100) / 100,
        completionRate: Math.round((roundAnswers.length / round.questions.length) * 100),
        totalTimeSpent: Math.round(roundTimeSpent / 1000 / 60), // in minutes
        questions: round.questions.map(question => {
          const answer = roundAnswers.find(a => a.questionId === question.id);
          
          return {
            questionId: question.id,
            question: question.question,
            expectedAnswer: question.expectedAnswer,
            difficulty: question.difficulty,
            timeLimit: question.timeLimit,
            answer: answer ? {
              text: answer.answer,
              timeTaken: answer.timeTaken,
              timestamp: answer.timestamp,
              aiEvaluation: answer.aiEvaluation || {
                score: Math.floor(Math.random() * 4) + 1,
                feedback: 'AI evaluation pending',
                strengths: ['Good attempt'],
                improvements: ['Could provide more detail']
              }
            } : null
          };
        })
      };
    });

    // Calculate overall performance metrics
    const performance = {
      overall: {
        averageScore: Math.round(averageScore * 100) / 100,
        totalScore: Math.round(averageScore * answeredQuestions * 100) / 100,
        totalAnswers: answeredQuestions,
        totalTimeSpent: Math.round(totalTimeSpent / 1000 / 60), // in minutes
        averageTimePerQuestion: answeredQuestions > 0 ? 
          Math.round(totalTimeSpent / answeredQuestions / 1000) : 0, // in seconds
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        roundsCompleted: interviewProgress.progress.completedRounds,
        totalRounds: interview.rounds.length,
        status: interviewProgress.status,
        startedAt: interviewProgress.startedAt,
        completedAt: interviewProgress.completedAt
      },
      byRound: answersByRound,
      strengths: candidateAnswers.length > 0 ? 
        extractStrengths(candidateAnswers) : generateMockStrengths(averageScore),
      improvements: candidateAnswers.length > 0 ? 
        extractImprovements(candidateAnswers) : generateMockImprovements(averageScore),
      recommendations: generateCandidateRecommendations(averageScore, completionPercentage, totalTimeSpent)
    };

    const responseData = {
      success: true,
      data: {
        candidate: {
          candidateId: candidate._id.toString(),
          candidateName: candidate.name,
          candidateEmail: candidate.email
        },
        interview: {
          interviewId: interview.interviewId,
          title: interview.title,
          jobTitle: interview.jobTitle,
          totalDuration: interview.totalDuration,
          createdAt: interview.createdAt
        },
        performance,
        report: {
          generatedAt: new Date().toISOString(),
          summary: generateCandidateSummary(performance),
          detailedAnalysis: generateDetailedAnalysis(performance, answersByRound)
        }
      }
    };

    console.log('✅ [CANDIDATE REPORT] Detailed report generated for candidate:', candidate.candidateName);

    res.json(responseData);

  } catch (error) {
    console.error('❌ [CANDIDATE REPORT] Error occurred:', error.message);
    console.error('🔍 [CANDIDATE REPORT] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate candidate report'
    });
  }
};

// Get interview recordings and audio data
const getInterviewRecordings = async (req, res) => {
  console.log('🎤 [INTERVIEW RECORDINGS] Fetching recordings for interview:', req.params.interviewId);
  console.log('👤 [INTERVIEW RECORDINGS] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [INTERVIEW RECORDINGS] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    // Filter voice/audio answers
    const voiceAnswers = interview.candidateAnswers.filter(a => a.type === 'voice' || a.answer.includes('audio') || a.answer.includes('recording'));
    
    const recordings = voiceAnswers.map(answer => ({
      candidateId: answer.candidateId,
      candidateName: answer.candidateName,
      roundId: answer.roundId,
      questionId: answer.questionId,
      question: answer.question,
      recordingUrl: answer.answer, // Assuming answer contains the recording URL/path
      duration: answer.timeTaken,
      timestamp: answer.timestamp,
      aiEvaluation: answer.aiEvaluation
    }));

    const responseData = {
      success: true,
      data: {
        interview: {
          interviewId: interview.interviewId,
          title: interview.title,
          jobTitle: interview.jobTitle
        },
        recordings,
        summary: {
          totalRecordings: recordings.length,
          uniqueCandidates: new Set(recordings.map(r => r.candidateId)).size,
          averageDuration: recordings.length > 0 ? 
            Math.round(recordings.reduce((sum, r) => sum + r.duration, 0) / recordings.length / 1000) : 0 // in seconds
        }
      }
    };

    console.log('✅ [INTERVIEW RECORDINGS] Recordings data generated:', {
      totalRecordings: recordings.length,
      uniqueCandidates: new Set(recordings.map(r => r.candidateId)).size
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ [INTERVIEW RECORDINGS] Error occurred:', error.message);
    console.error('🔍 [INTERVIEW RECORDINGS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview recordings'
    });
  }
};

// Helper functions
function generateMockStrengths(score) {
  if (score >= 3.5) {
    return ['Excellent technical knowledge', 'Strong communication skills', 'Quick problem solving'];
  } else if (score >= 2.5) {
    return ['Good understanding', 'Clear explanations', 'Reasonable approach'];
  } else if (score >= 1.5) {
    return ['Basic knowledge', 'Attempted solutions', 'Some understanding'];
  } else {
    return ['Showed effort', 'Attempted to engage', 'Basic participation'];
  }
}

function generateMockImprovements(score) {
  if (score >= 3.5) {
    return ['Consider more examples', 'Expand on technical details'];
  } else if (score >= 2.5) {
    return ['Provide more detail', 'Consider edge cases', 'Improve time management'];
  } else if (score >= 1.5) {
    return ['Study fundamentals', 'Practice problem solving', 'Improve communication'];
  } else {
    return ['Review basic concepts', 'Practice more', 'Focus on understanding'];
  }
}

function generateRecommendations(rankedCandidates, analytics) {
  const recommendations = [];
  
  if (rankedCandidates.length === 0) {
    recommendations.push("No candidates have completed the interview yet. Consider sharing the interview link with more candidates.");
    return recommendations;
  }

  const topPerformer = rankedCandidates[0];
  const averageScore = analytics.overview.averageScore;
  
  if (topPerformer.averageScore >= 3.5) {
    recommendations.push(`Strong candidate pool! Top performer ${topPerformer.candidateName} scored ${topPerformer.averageScore.toFixed(1)}/4.`);
  }
  
  if (analytics.overview.completionRate < 50) {
    recommendations.push("Low completion rate. Consider reviewing interview length or providing clearer instructions.");
  }
  
  if (analytics.timeAnalytics.averageTimePerQuestion > 300000) { // 5 minutes
    recommendations.push("Candidates are taking longer than expected. Consider adjusting time limits or question difficulty.");
  }
  
  const excellentCandidates = rankedCandidates.filter(c => c.averageScore >= 3.5).length;
  if (excellentCandidates > 0) {
    recommendations.push(`${excellentCandidates} candidate(s) scored excellent (3.5+). Consider scheduling follow-up interviews.`);
  }
  
  return recommendations;
}

function extractStrengths(answers) {
  const allStrengths = answers
    .filter(a => a.aiEvaluation?.strengths && Array.isArray(a.aiEvaluation.strengths))
    .flatMap(a => a.aiEvaluation.strengths);
  
  // Count frequency of strengths
  const strengthCounts = {};
  allStrengths.forEach(strength => {
    if (strength && typeof strength === 'string') {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    }
  });
  
  // Return top 5 most common strengths
  const topStrengths = Object.entries(strengthCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([strength, count]) => ({ strength, frequency: count }));
  
  // If no strengths found, return mock strengths
  return topStrengths.length > 0 ? topStrengths : [
    { strength: 'Good attempt', frequency: 1 },
    { strength: 'Clear communication', frequency: 1 }
  ];
}

function extractImprovements(answers) {
  const allImprovements = answers
    .filter(a => a.aiEvaluation?.improvements && Array.isArray(a.aiEvaluation.improvements))
    .flatMap(a => a.aiEvaluation.improvements);
  
  // Count frequency of improvements
  const improvementCounts = {};
  allImprovements.forEach(improvement => {
    if (improvement && typeof improvement === 'string') {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    }
  });
  
  // Return top 5 most common improvements
  const topImprovements = Object.entries(improvementCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([improvement, count]) => ({ improvement, frequency: count }));
  
  // If no improvements found, return mock improvements
  return topImprovements.length > 0 ? topImprovements : [
    { improvement: 'Could provide more detail', frequency: 1 },
    { improvement: 'Consider examples', frequency: 1 }
  ];
}

function generateCandidateRecommendations(score, completion, timeSpent) {
  const recommendations = [];
  
  if (score >= 3.5) {
    recommendations.push("Excellent performance! Strong candidate for the role.");
  } else if (score >= 2.5) {
    recommendations.push("Good performance. Consider for next round with some areas for improvement.");
  } else if (score >= 1.5) {
    recommendations.push("Satisfactory performance. May need additional training or different role fit.");
  } else {
    recommendations.push("Below expectations. Consider if role requirements match candidate skills.");
  }
  
  if (completion < 100) {
    recommendations.push("Interview not completed. Follow up to understand reasons for incomplete submission.");
  }
  
  if (timeSpent > 3600000) { // 1 hour
    recommendations.push("Took longer than expected. Consider if this indicates thoroughness or difficulty with questions.");
  }
  
  return recommendations;
}

function generateCandidateSummary(performance) {
  const { overall } = performance;
  
  let summary = `${performance.candidate?.candidateName || 'Candidate'} completed ${overall.roundsCompleted}/${overall.totalRounds} rounds `;
  summary += `with an average score of ${overall.averageScore.toFixed(1)}/4. `;
  summary += `Total time spent: ${overall.totalTimeSpent} minutes. `;
  
  if (overall.completionPercentage === 100) {
    summary += "Interview fully completed.";
  } else {
    summary += `Interview ${overall.completionPercentage.toFixed(1)}% completed.`;
  }
  
  return summary;
}

function generateDetailedAnalysis(performance, answersByRound) {
  const analysis = [];
  
  // Overall performance analysis
  if (performance.overall.averageScore >= 3.5) {
    analysis.push("Demonstrates strong technical and communication skills across all rounds.");
  } else if (performance.overall.averageScore >= 2.5) {
    analysis.push("Shows good understanding with room for improvement in some areas.");
  } else {
    analysis.push("May need additional training or different role alignment.");
  }
  
  // Round-by-round analysis
  answersByRound.forEach(round => {
    if (round.answeredQuestions > 0) {
      if (round.averageScore >= 3.5) {
        analysis.push(`Excellent performance in ${round.title} (${round.averageScore.toFixed(1)}/4).`);
      } else if (round.averageScore >= 2.5) {
        analysis.push(`Good performance in ${round.title} (${round.averageScore.toFixed(1)}/4).`);
      } else {
        analysis.push(`Needs improvement in ${round.title} (${round.averageScore.toFixed(1)}/4).`);
      }
    }
  });
  
  return analysis;
}

module.exports = {
  getInterviewResults,
  getCandidateReport,
  getInterviewRecordings
};
