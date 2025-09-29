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

// Get interview answers endpoint
const getAnswers = async (req, res) => {
  console.log('📋 [GET ANSWERS] Fetching answers for interview:', req.params.interviewId);
  console.log('🔍 [GET ANSWERS] Query params:', req.query);
  
  try {
    const { candidateId } = req.query;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [GET ANSWERS] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Get candidate answers
    let answers = interview.candidateAnswers || [];
    
    // Filter by candidate if specified
    if (candidateId) {
      answers = answers.filter(answer => answer.candidateId === candidateId);
    }

    console.log('✅ [GET ANSWERS] Answers retrieved successfully');
    console.log('📊 [GET ANSWERS] Total answers:', answers.length);

    res.json({
      success: true,
      data: {
        answers: answers,
        totalAnswers: answers.length,
        interviewId: interview.interviewId,
        interviewTitle: interview.title
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

module.exports = {
  submitAnswer,
  submitAnswers,
  getAnswers,
  completeInterview
};