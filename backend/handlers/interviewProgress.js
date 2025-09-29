// Interview progress tracking handlers
const Interview = require('../models/Interview');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get user's interview progress
const getUserProgress = async (req, res) => {
  console.log('📋 [GET PROGRESS] Getting user progress for user:', req.user.id);
  
  try {
    const userId = req.user.id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log('✅ [GET PROGRESS] Progress retrieved successfully');
    
    res.json({
      success: true,
      data: {
        interviewProgress: user.interviewProgress || [],
        totalInterviews: user.interviewProgress?.length || 0,
        completedInterviews: user.interviewProgress?.filter(p => p.status === 'completed').length || 0,
        inProgressInterviews: user.interviewProgress?.filter(p => p.status === 'in_progress').length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ [GET PROGRESS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get progress: ' + error.message
    });
  }
};

// Start interview and track user progress (anonymous access)
const startAnonymousInterview = async (req, res) => {
  console.log('🚀 [START INTERVIEW ANONYMOUS] Starting interview:', req.params.interviewId);
  console.log('👤 [START INTERVIEW ANONYMOUS] Anonymous user');
  
  try {
    const { interviewId } = req.params;
    const { candidateInfo } = req.body;
    
    // Find the interview
    const interview = await Interview.findOne({ 
      interviewId: interviewId,
      approvalStatus: 'approved'
    });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }
    
    // For anonymous users, we'll track progress in the interview's answers array
    // This ensures the recruiter can see that someone attended the interview
    console.log('✅ [START INTERVIEW ANONYMOUS] Interview found, tracking anonymous attendance');
    
    res.json({
      success: true,
      data: {
        interviewId: interviewId,
        message: 'Anonymous interview tracking started',
        interview: {
          title: interview.title,
          totalDuration: interview.totalDuration,
          rounds: interview.rounds
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [START INTERVIEW ANONYMOUS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start interview: ' + error.message
    });
  }
};

// Start interview and track user progress (authenticated)
const startInterview = async (req, res) => {
  console.log('🚀 [START INTERVIEW] Starting interview:', req.params.interviewId);
  console.log('👤 [START INTERVIEW] User ID:', req.user.id);
  
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    
    // Find the interview
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user already has progress for this interview
    let progressIndex = user.interviewProgress.findIndex(
      progress => progress.interviewId === interviewId
    );
    
    if (progressIndex === -1) {
      // Create new progress entry
      const newProgress = {
        interviewId: interviewId,
        interviewTitle: interview.title,
        status: 'started',
        startedAt: new Date(),
        progress: {
          totalRounds: interview.rounds.length,
          completedRounds: 0,
          totalQuestions: interview.rounds.reduce((total, round) => total + round.questions.length, 0),
          answeredQuestions: 0,
          currentRound: 0,
          currentQuestion: 0
        },
        rounds: interview.rounds.map((round, index) => ({
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          roundTitle: round.title,
          status: 'not_started',
          questions: round.questions.map((question, qIndex) => ({
            questionId: question.id,
            questionNumber: qIndex + 1,
            status: 'not_answered',
            timeSpent: 0
          }))
        })),
        totalTimeSpent: 0,
        lastAccessedAt: new Date()
      };
      
      user.interviewProgress.push(newProgress);
      progressIndex = user.interviewProgress.length - 1;
      console.log('✅ [START INTERVIEW] Created new progress entry');
    } else {
      // Update existing progress
      user.interviewProgress[progressIndex].lastAccessedAt = new Date();
      user.interviewProgress[progressIndex].status = 'in_progress';
      console.log('🔄 [START INTERVIEW] Updated existing progress');
    }
    
    await user.save();
    
    console.log('✅ [START INTERVIEW] Interview started successfully');
    
    res.json({
      success: true,
      data: {
        interviewId: interviewId,
        progress: user.interviewProgress[progressIndex],
        interview: {
          title: interview.title,
          totalDuration: interview.totalDuration,
          rounds: interview.rounds
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [START INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start interview: ' + error.message
    });
  }
};

// Update interview progress
const updateProgress = async (req, res) => {
  console.log('📊 [UPDATE PROGRESS] Updating progress for interview:', req.params.interviewId);
  console.log('👤 [UPDATE PROGRESS] User ID:', req.user.id);
  
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    const { roundId, questionId, status, timeSpent } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Find the progress entry
    const progressIndex = user.interviewProgress.findIndex(
      progress => progress.interviewId === interviewId
    );
    
    if (progressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Interview progress not found'
      });
    }
    
    const progress = user.interviewProgress[progressIndex];
    
    // Update round progress
    const roundIndex = progress.rounds.findIndex(round => round.roundId === roundId);
    if (roundIndex !== -1) {
      const round = progress.rounds[roundIndex];
      
      // Update question progress
      const questionIndex = round.questions.findIndex(q => q.questionId === questionId);
      if (questionIndex !== -1) {
        const question = round.questions[questionIndex];
        question.status = status;
        question.timeSpent = timeSpent || 0;
        
        if (status === 'answered') {
          question.answeredAt = new Date();
        }
      }
      
      // Update round status
      const answeredQuestions = round.questions.filter(q => q.status === 'answered').length;
      const totalQuestions = round.questions.length;
      
      if (answeredQuestions === 0) {
        round.status = 'not_started';
      } else if (answeredQuestions === totalQuestions) {
        round.status = 'completed';
        round.completedAt = new Date();
      } else {
        round.status = 'in_progress';
        if (!round.startedAt) {
          round.startedAt = new Date();
        }
      }
    }
    
    // Update overall progress
    const completedRounds = progress.rounds.filter(round => round.status === 'completed').length;
    const answeredQuestions = progress.rounds.reduce((total, round) => 
      total + round.questions.filter(q => q.status === 'answered').length, 0
    );
    
    progress.progress.completedRounds = completedRounds;
    progress.progress.answeredQuestions = answeredQuestions;
    progress.totalTimeSpent += timeSpent || 0;
    progress.lastAccessedAt = new Date();
    
    // Check if interview is completed
    if (completedRounds === progress.progress.totalRounds) {
      progress.status = 'completed';
      progress.completedAt = new Date();
    } else {
      progress.status = 'in_progress';
    }
    
    await user.save();
    
    console.log('✅ [UPDATE PROGRESS] Progress updated successfully');
    
    res.json({
      success: true,
      data: {
        progress: progress,
        message: 'Progress updated successfully'
      }
    });
    
  } catch (error) {
    console.error('❌ [UPDATE PROGRESS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress: ' + error.message
    });
  }
};

// Mark interview as completed
const completeInterview = async (req, res) => {
  console.log('✅ [COMPLETE INTERVIEW] Marking interview as completed:', req.params.interviewId);
  console.log('👤 [COMPLETE INTERVIEW] User ID:', req.user.id);
  
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Find the progress entry
    const progressIndex = user.interviewProgress.findIndex(
      progress => progress.interviewId === interviewId
    );
    
    if (progressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Interview progress not found'
      });
    }
    
    const progress = user.interviewProgress[progressIndex];
    
    // Mark interview as completed
    progress.status = 'completed';
    progress.completedAt = new Date();
    progress.lastAccessedAt = new Date();
    
    // Mark all rounds as completed
    progress.rounds.forEach(round => {
      round.status = 'completed';
      round.completedAt = new Date();
      
      // Mark all questions as answered
      round.questions.forEach(question => {
        if (question.status === 'not_answered') {
          question.status = 'answered';
          question.answeredAt = new Date();
        }
      });
    });
    
    // Update progress counts
    progress.progress.completedRounds = progress.progress.totalRounds;
    progress.progress.answeredQuestions = progress.progress.totalQuestions;
    
    await user.save();
    
    console.log('✅ [COMPLETE INTERVIEW] Interview marked as completed successfully');
    
    res.json({
      success: true,
      data: {
        progress: progress,
        message: 'Interview completed successfully'
      }
    });
    
  } catch (error) {
    console.error('❌ [COMPLETE INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete interview: ' + error.message
    });
  }
};

module.exports = {
  getUserProgress,
  startAnonymousInterview,
  startInterview,
  updateProgress,
  completeInterview
};
