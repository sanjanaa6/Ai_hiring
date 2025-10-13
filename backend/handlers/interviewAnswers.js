// Interview answer submission and management handlers
const Interview = require('../models/Interview');

// Submit interview answer endpoint (singular - for frontend compatibility)
const submitAnswer = async (req, res) => {
  console.log('📝 [SUBMIT ANSWER] Submitting answer for interview:', req.params.interviewId);
  console.log('🔍 [SUBMIT ANSWER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { questionId, answer, roundId, timeSpent, candidateId, candidateName, candidateEmail, question } = req.body;
    
    if (!questionId || !answer) {
      console.log('❌ [SUBMIT ANSWER] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Question ID and answer are required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [SUBMIT ANSWER] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Initialize candidateAnswers array if it doesn't exist
    if (!interview.candidateAnswers) {
      interview.candidateAnswers = [];
    }

    // Check if answer already exists for this question and candidate
    const existingAnswerIndex = interview.candidateAnswers.findIndex(
      ans => ans.questionId === questionId && ans.candidateId === (candidateId || 'anonymous')
    );

    const answerData = {
      candidateId: candidateId || 'anonymous',
      candidateName: candidateName || 'Anonymous Candidate',
      candidateEmail: candidateEmail || 'anonymous@example.com',
      roundId,
      questionId,
      question: question || 'Question not provided',
      answer,
      timeTaken: timeSpent || 0,
      timestamp: new Date(),
      aiEvaluation: {
        score: Math.floor(Math.random() * 4) + 1, // Temporary random score (1-4)
        feedback: 'AI evaluation pending - will be implemented with proper AI service',
        strengths: ['Good attempt', 'Clear communication'],
        improvements: ['Could provide more detail', 'Consider examples']
      }
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      interview.candidateAnswers[existingAnswerIndex] = answerData;
      console.log('🔄 [SUBMIT ANSWER] Updated existing answer for question:', questionId);
    } else {
      // Add new answer
      interview.candidateAnswers.push(answerData);
      console.log('✅ [SUBMIT ANSWER] Added new answer for question:', questionId);
    }

    await interview.save();

    console.log('✅ [SUBMIT ANSWER] Answer submitted successfully');
    console.log('📊 [SUBMIT ANSWER] Total candidate answers:', interview.candidateAnswers.length);

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        questionId,
        answerId: answerData.timestamp,
        submittedAt: answerData.timestamp,
        totalAnswers: interview.candidateAnswers.length
      }
    });

  } catch (error) {
    console.error('❌ [SUBMIT ANSWER] Error occurred:', error.message);
    console.error('🔍 [SUBMIT ANSWER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
};

// Submit interview answer endpoint (plural - for API consistency)
const submitAnswers = async (req, res) => {
  console.log('📝 [SUBMIT ANSWERS] Submitting answers for interview:', req.params.interviewId);
  console.log('🔍 [SUBMIT ANSWERS] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { questionId, answer, roundId, timeSpent, candidateId, candidateName, candidateEmail, question } = req.body;
    
    if (!questionId || !answer) {
      console.log('❌ [SUBMIT ANSWERS] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Question ID and answer are required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [SUBMIT ANSWERS] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Initialize candidateAnswers array if it doesn't exist
    if (!interview.candidateAnswers) {
      interview.candidateAnswers = [];
    }

    // Check if answer already exists for this question and candidate
    const existingAnswerIndex = interview.candidateAnswers.findIndex(
      ans => ans.questionId === questionId && ans.candidateId === (candidateId || 'anonymous')
    );

    const answerData = {
      candidateId: candidateId || 'anonymous',
      candidateName: candidateName || 'Anonymous Candidate',
      candidateEmail: candidateEmail || 'anonymous@example.com',
      roundId,
      questionId,
      question: question || 'Question not provided',
      answer,
      timeTaken: timeSpent || 0,
      timestamp: new Date(),
      aiEvaluation: {
        score: Math.floor(Math.random() * 4) + 1, // Temporary random score (1-4)
        feedback: 'AI evaluation pending - will be implemented with proper AI service',
        strengths: ['Good attempt', 'Clear communication'],
        improvements: ['Could provide more detail', 'Consider examples']
      }
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      interview.candidateAnswers[existingAnswerIndex] = answerData;
      console.log('🔄 [SUBMIT ANSWERS] Updated existing answer for question:', questionId);
    } else {
      // Add new answer
      interview.candidateAnswers.push(answerData);
      console.log('✅ [SUBMIT ANSWERS] Added new answer for question:', questionId);
    }

    await interview.save();

    console.log('✅ [SUBMIT ANSWERS] Answer submitted successfully');
    console.log('📊 [SUBMIT ANSWERS] Total candidate answers:', interview.candidateAnswers.length);

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        questionId,
        answerId: answerData.timestamp,
        submittedAt: answerData.timestamp,
        totalAnswers: interview.candidateAnswers.length
      }
    });

  } catch (error) {
    console.error('❌ [SUBMIT ANSWERS] Error occurred:', error.message);
    console.error('🔍 [SUBMIT ANSWERS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
};

// Get interview answers endpoint (for recruiters)
const getAnswers = async (req, res) => {
  console.log('📋 [GET ANSWERS] Fetching answers for interview:', req.params.interviewId);
  console.log('👤 [GET ANSWERS] User ID:', req.user.id);
  console.log('🔍 [GET ANSWERS] Query params:', req.query);
  
  try {
    const { candidateId } = req.query;
    
    // Find the interview and verify recruiter access
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [GET ANSWERS] Interview not found or access denied:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    // Get all candidate answers
    let answers = interview.candidateAnswers || [];
    
    console.log('📊 [GET ANSWERS] Total answers in database:', answers.length);
    console.log('📋 [GET ANSWERS] Sample answers:', answers.slice(0, 3));
    
    // Filter by candidate if specified
    if (candidateId) {
      answers = answers.filter(answer => answer.candidateId === candidateId);
    }

    // Get unique candidate IDs from answers
    const uniqueCandidateIds = [...new Set(answers.map(answer => answer.candidateId).filter(id => id && id !== 'anonymous'))];
    
    // Filter out anonymous IDs (those starting with 'anon_') to get only valid ObjectIds
    const mongoose = require('mongoose');
    const validObjectIds = uniqueCandidateIds.filter(id => {
      // Check if it's a valid ObjectId format and not an anonymous ID
      return !id.startsWith('anon_') && mongoose.Types.ObjectId.isValid(id);
    });
    
    // Fetch additional candidate information from User model if available
    const User = require('../models/User');
    const candidateUsers = await User.find({
      _id: { $in: validObjectIds }
    }).select('name email _id');

    // Create a map of candidate ID to user info
    const candidateUserMap = {};
    candidateUsers.forEach(user => {
      candidateUserMap[user._id.toString()] = {
        name: user.name,
        email: user.email,
        userId: user._id.toString()
      };
    });

    // Group answers by candidate with enhanced information
    const answersByCandidate = {};
    answers.forEach(answer => {
      const key = answer.candidateId || 'anonymous';
      if (!answersByCandidate[key]) {
        // Get user info if available, otherwise use answer data
        const userInfo = candidateUserMap[answer.candidateId] || {};
        
        answersByCandidate[key] = {
          candidateId: answer.candidateId,
          candidateName: userInfo.name || answer.candidateName || 'Unknown Candidate',
          candidateEmail: userInfo.email || answer.candidateEmail || 'unknown@example.com',
          userId: userInfo.userId || null,
          answers: [],
          totalScore: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          roundsCompleted: new Set(),
          completionStatus: 'in_progress',
          startedAt: null,
          completedAt: null
        };
      }
      
      // Add answer to candidate
      answersByCandidate[key].answers.push({
        ...answer,
        roundId: answer.roundId,
        questionId: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        timeTaken: answer.timeTaken,
        timestamp: answer.timestamp,
        aiEvaluation: answer.aiEvaluation || {
          score: 0,
          feedback: 'No evaluation available',
          strengths: [],
          improvements: []
        }
      });
      
      // Update candidate statistics
      answersByCandidate[key].totalScore += answer.aiEvaluation?.score || 0;
      answersByCandidate[key].totalTimeSpent += answer.timeTaken || 0;
      answersByCandidate[key].roundsCompleted.add(answer.roundId);
      
      // Track timestamps
      if (!answersByCandidate[key].startedAt || answer.timestamp < answersByCandidate[key].startedAt) {
        answersByCandidate[key].startedAt = answer.timestamp;
      }
      if (!answersByCandidate[key].completedAt || answer.timestamp > answersByCandidate[key].completedAt) {
        answersByCandidate[key].completedAt = answer.timestamp;
      }
    });

    // Calculate final statistics for each candidate
    Object.keys(answersByCandidate).forEach(candidateKey => {
      const candidate = answersByCandidate[candidateKey];
      candidate.averageScore = candidate.answers.length > 0 ? 
        Math.round((candidate.totalScore / candidate.answers.length) * 100) / 100 : 0;
      candidate.roundsCompleted = Array.from(candidate.roundsCompleted);
      candidate.totalRounds = interview.rounds.length;
      candidate.completionPercentage = Math.round((candidate.roundsCompleted.length / interview.rounds.length) * 100);
      candidate.completionStatus = candidate.completionPercentage === 100 ? 'completed' : 'in_progress';
      
      // Convert time to minutes
      candidate.totalTimeSpent = Math.round(candidate.totalTimeSpent / 1000 / 60);
    });

    // Calculate comprehensive summary statistics
    const summary = {
      totalAnswers: answers.length,
      totalCandidates: Object.keys(answersByCandidate).length,
      completedCandidates: Object.values(answersByCandidate).filter(c => c.completionStatus === 'completed').length,
      averageScore: answers.length > 0 ? 
        Math.round(answers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0) / answers.length * 100) / 100 : 0,
      completionRate: Object.keys(answersByCandidate).length > 0 ? 
        Math.round(Object.values(answersByCandidate).reduce((sum, candidate) => sum + candidate.completionPercentage, 0) / Object.keys(answersByCandidate).length) : 0,
      totalTimeSpent: Math.round(Object.values(answersByCandidate).reduce((sum, candidate) => sum + candidate.totalTimeSpent, 0)),
      scoreDistribution: {
        excellent: Object.values(answersByCandidate).filter(c => c.averageScore >= 3.5).length,
        good: Object.values(answersByCandidate).filter(c => c.averageScore >= 2.5 && c.averageScore < 3.5).length,
        satisfactory: Object.values(answersByCandidate).filter(c => c.averageScore >= 1.5 && c.averageScore < 2.5).length,
        needsImprovement: Object.values(answersByCandidate).filter(c => c.averageScore < 1.5).length
      }
    };

    // Sort candidates by performance (score and completion)
    const sortedCandidates = Object.values(answersByCandidate).sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.completionPercentage - a.completionPercentage;
    });

    console.log('✅ [GET ANSWERS] Answers retrieved successfully');
    console.log('📊 [GET ANSWERS] Total answers:', answers.length);
    console.log('👥 [GET ANSWERS] Total candidates:', summary.totalCandidates);
    console.log('📈 [GET ANSWERS] Completed candidates:', summary.completedCandidates);

    res.json({
      success: true,
      data: {
        answers: answers,
        answersByCandidate: answersByCandidate,
        sortedCandidates: sortedCandidates,
        summary: summary,
        interview: {
          interviewId: interview.interviewId,
          interviewTitle: interview.title,
          jobTitle: interview.jobTitle,
          jobDescription: interview.jobDescription,
          totalDuration: interview.totalDuration,
          totalRounds: interview.rounds.length,
          rounds: interview.rounds.map(round => ({
            roundId: round.roundId,
            roundNumber: round.roundNumber,
            title: round.title,
            description: round.description,
            duration: round.duration,
            questionCount: round.questions.length,
            type: round.type
          })),
          createdAt: interview.createdAt,
          status: interview.status
        }
      }
    });

  } catch (error) {
    console.error('❌ [GET ANSWERS] Error occurred:', error.message);
    console.error('🔍 [GET ANSWERS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch answers'
    });
  }
};

// Complete interview endpoint
const completeInterview = async (req, res) => {
  console.log('🏁 [COMPLETE INTERVIEW] Completing interview:', req.params.interviewId);
  console.log('🔍 [COMPLETE INTERVIEW] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { candidateInfo, totalTimeSpent, completionNotes } = req.body;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [COMPLETE INTERVIEW] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Mark interview as completed
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.candidateInfo = candidateInfo || {};
    interview.totalTimeSpent = totalTimeSpent || 0;
    interview.completionNotes = completionNotes || '';

    await interview.save();

    console.log('✅ [COMPLETE INTERVIEW] Interview completed successfully');
    console.log('📊 [COMPLETE INTERVIEW] Completed at:', interview.completedAt);
    console.log('📊 [COMPLETE INTERVIEW] Total candidate answers:', interview.candidateAnswers?.length || 0);

    res.json({
      success: true,
      message: 'Interview completed successfully',
      data: {
        interviewId: interview.interviewId,
        status: interview.status,
        completedAt: interview.completedAt,
        totalAnswers: interview.candidateAnswers?.length || 0,
        totalTimeSpent: interview.totalTimeSpent
      }
    });

  } catch (error) {
    console.error('❌ [COMPLETE INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [COMPLETE INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to complete interview'
    });
  }
};

// Get detailed candidate information with all answers and evaluations
const getCandidateDetails = async (req, res) => {
  console.log('👤 [CANDIDATE DETAILS] Fetching details for candidate:', req.params.candidateId);
  console.log('📋 [CANDIDATE DETAILS] Interview ID:', req.params.interviewId);
  console.log('👤 [CANDIDATE DETAILS] User ID:', req.user.id);
  
  try {
    const { candidateId } = req.params;
    const { interviewId } = req.params;
    
    // Find the interview and verify recruiter access
    const interview = await Interview.findOne({
      interviewId: interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [CANDIDATE DETAILS] Interview not found or access denied:', interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    // Get all answers for this specific candidate
    const candidateAnswers = interview.candidateAnswers.filter(
      answer => answer.candidateId === candidateId
    );

    if (candidateAnswers.length === 0) {
      console.log('❌ [CANDIDATE DETAILS] No answers found for candidate:', candidateId);
      return res.status(404).json({
        success: false,
        error: 'No answers found for this candidate'
      });
    }

    // Get candidate information from User model if available
    const User = require('../models/User');
    const candidateUser = await User.findById(candidateId).select('name email _id interviewProgress');
    
    // Get candidate's interview progress if available
    let interviewProgress = null;
    if (candidateUser && candidateUser.interviewProgress) {
      interviewProgress = candidateUser.interviewProgress.find(
        progress => progress.interviewId === interviewId
      );
    }

    // Group answers by round
    const answersByRound = {};
    candidateAnswers.forEach(answer => {
      const roundId = answer.roundId;
      if (!answersByRound[roundId]) {
        answersByRound[roundId] = [];
      }
      answersByRound[roundId].push(answer);
    });

    // Calculate comprehensive statistics
    const totalScore = candidateAnswers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0);
    const averageScore = candidateAnswers.length > 0 ? totalScore / candidateAnswers.length : 0;
    const totalTimeSpent = candidateAnswers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0);
    const roundsCompleted = Object.keys(answersByRound).length;
    const completionPercentage = interview.rounds.length > 0 ? (roundsCompleted / interview.rounds.length) * 100 : 0;

    // Extract all strengths and improvements
    const allStrengths = candidateAnswers.flatMap(answer => answer.aiEvaluation?.strengths || []);
    const allImprovements = candidateAnswers.flatMap(answer => answer.aiEvaluation?.improvements || []);

    // Count frequency of strengths and improvements
    const strengthCounts = {};
    allStrengths.forEach(strength => {
      if (strength && typeof strength === 'string') {
        strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
      }
    });

    const improvementCounts = {};
    allImprovements.forEach(improvement => {
      if (improvement && typeof improvement === 'string') {
        improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
      }
    });

    // Get top strengths and improvements
    const topStrengths = Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([strength, count]) => ({ strength, frequency: count }));

    const topImprovements = Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([improvement, count]) => ({ improvement, frequency: count }));

    // Build detailed round information
    const roundDetails = interview.rounds.map(round => {
      const roundAnswers = answersByRound[round.roundId] || [];
      const roundScores = roundAnswers.map(answer => answer.aiEvaluation?.score || 0);
      const roundAverageScore = roundScores.length > 0 ? 
        roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length : 0;
      const roundTimeSpent = roundAnswers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0);

      return {
        roundId: round.roundId,
        roundNumber: round.roundNumber,
        title: round.title,
        description: round.description,
        duration: round.duration,
        type: round.type,
        questionCount: round.questions.length,
        answeredQuestions: roundAnswers.length,
        averageScore: Math.round(roundAverageScore * 100) / 100,
        totalScore: roundScores.reduce((sum, score) => sum + score, 0),
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
                score: 0,
                feedback: 'No evaluation available',
                strengths: [],
                improvements: []
              }
            } : null
          };
        })
      };
    });

    // Generate performance insights
    const performanceInsights = {
      overall: {
        averageScore: Math.round(averageScore * 100) / 100,
        totalScore: totalScore,
        totalAnswers: candidateAnswers.length,
        totalTimeSpent: Math.round(totalTimeSpent / 1000 / 60), // in minutes
        averageTimePerQuestion: candidateAnswers.length > 0 ? 
          Math.round(totalTimeSpent / candidateAnswers.length / 1000) : 0, // in seconds
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        roundsCompleted: roundsCompleted,
        totalRounds: interview.rounds.length,
        status: completionPercentage === 100 ? 'completed' : 'in_progress'
      },
      strengths: topStrengths.length > 0 ? topStrengths : [
        { strength: 'Good attempt', frequency: 1 },
        { strength: 'Clear communication', frequency: 1 }
      ],
      improvements: topImprovements.length > 0 ? topImprovements : [
        { improvement: 'Could provide more detail', frequency: 1 },
        { improvement: 'Consider examples', frequency: 1 }
      ],
      recommendations: generateCandidateRecommendations(averageScore, completionPercentage, totalTimeSpent)
    };

    const responseData = {
      success: true,
      data: {
        candidate: {
          candidateId: candidateId,
          candidateName: candidateUser?.name || candidateAnswers[0]?.candidateName || 'Unknown Candidate',
          candidateEmail: candidateUser?.email || candidateAnswers[0]?.candidateEmail || 'unknown@example.com',
          userId: candidateUser?._id?.toString() || null
        },
        interview: {
          interviewId: interview.interviewId,
          title: interview.title,
          jobTitle: interview.jobTitle,
          jobDescription: interview.jobDescription,
          totalDuration: interview.totalDuration,
          createdAt: interview.createdAt,
          status: interview.status
        },
        performance: performanceInsights,
        roundDetails: roundDetails,
        timeline: {
          startedAt: candidateAnswers.length > 0 ? 
            new Date(Math.min(...candidateAnswers.map(a => new Date(a.timestamp)))) : null,
          completedAt: candidateAnswers.length > 0 ? 
            new Date(Math.max(...candidateAnswers.map(a => new Date(a.timestamp)))) : null,
          totalDuration: candidateAnswers.length > 0 ? 
            Math.round((Math.max(...candidateAnswers.map(a => new Date(a.timestamp))) - 
                       Math.min(...candidateAnswers.map(a => new Date(a.timestamp)))) / 1000 / 60) : 0 // in minutes
        },
        progress: interviewProgress ? {
          currentRound: interviewProgress.progress?.currentRound || 1,
          completedRounds: interviewProgress.progress?.completedRounds || 0,
          totalQuestions: interviewProgress.progress?.totalQuestions || 0,
          answeredQuestions: interviewProgress.progress?.answeredQuestions || 0,
          status: interviewProgress.status || 'in_progress'
        } : null
      }
    };

    console.log('✅ [CANDIDATE DETAILS] Detailed information retrieved for candidate:', candidateId);
    console.log('📊 [CANDIDATE DETAILS] Total answers:', candidateAnswers.length);
    console.log('📈 [CANDIDATE DETAILS] Average score:', performanceInsights.overall.averageScore);

    res.json(responseData);

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

// Helper function to generate candidate recommendations
function generateCandidateRecommendations(score, completion, timeSpent) {
  const recommendations = [];
  
  if (score >= 3.5) {
    recommendations.push("Excellent performance! Strong candidate for the role.");
    recommendations.push("Consider scheduling a follow-up interview for final assessment.");
  } else if (score >= 2.5) {
    recommendations.push("Good performance. Consider for next round with some areas for improvement.");
    recommendations.push("Review specific areas where candidate can improve.");
  } else if (score >= 1.5) {
    recommendations.push("Satisfactory performance. May need additional training or different role fit.");
    recommendations.push("Consider if role requirements match candidate skills.");
  } else {
    recommendations.push("Below expectations. Consider if role requirements match candidate skills.");
    recommendations.push("May benefit from additional preparation or different role.");
  }
  
  if (completion < 100) {
    recommendations.push("Interview not completed. Follow up to understand reasons for incomplete submission.");
  }
  
  if (timeSpent > 3600000) { // 1 hour
    recommendations.push("Took longer than expected. Consider if this indicates thoroughness or difficulty with questions.");
  }
  
  return recommendations;
}

module.exports = {
  submitAnswer,
  submitAnswers,
  getAnswers,
  getCandidateDetails,
  completeInterview
};