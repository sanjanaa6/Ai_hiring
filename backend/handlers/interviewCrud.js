// Interview CRUD operations
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const { validateInterviewStructure, extractJobDetailsFromPrompt } = require('../utils/interviewUtils');
const { createStructuredInterview } = require('../services/aiInterviewService');

// Get all interviews for user endpoint (must come before /:interviewId route)
const getAllInterviews = async (req, res) => {
  console.log('📋 [GET INTERVIEWS] Fetching all interviews for user:', req.user.id);
  console.log('👤 [GET INTERVIEWS] User role:', req.user.role);
  
  try {
    // Find all interviews for the user
    const interviews = await Interview.find({
      createdBy: req.user.id
    }).sort({ createdAt: -1 });

    console.log('✅ [GET INTERVIEWS] Found', interviews.length, 'interviews');

    res.json({
      success: true,
      data: interviews.map(interview => ({
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds?.length || 0,
        approvalStatus: interview.approvalStatus,
        jobTitle: interview.jobTitle,
        company: interview.company,
        createdAt: interview.createdAt,
        approvedAt: interview.approvedAt,
        rejectedAt: interview.rejectedAt
      }))
    });

  } catch (error) {
    console.error('❌ [GET INTERVIEWS] Error occurred:', error.message);
    console.error('🔍 [GET INTERVIEWS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews'
    });
  }
};

// Get interview by ID endpoint (authenticated access)
const getInterviewById = async (req, res) => {
  console.log('🔍 [GET INTERVIEW] Fetching interview:', req.params.interviewId);
  console.log('👤 [GET INTERVIEW] User ID:', req.user.id);
  console.log('👤 [GET INTERVIEW] User role:', req.user.role);
  
  try {
    // Find the interview (allow access to pending interviews for testing)
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [GET INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [GET INTERVIEW] Interview found successfully');
    console.log('📊 [GET INTERVIEW] Interview ID:', interview.interviewId);
    console.log('📊 [GET INTERVIEW] Title:', interview.title);
    console.log('📊 [GET INTERVIEW] Rounds:', interview.rounds?.length || 0);
    console.log('📊 [GET INTERVIEW] Status:', interview.approvalStatus);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds,
        approvalStatus: interview.approvalStatus,
        jobTitle: interview.jobTitle,
        jobDescription: interview.jobDescription,
        jobRequirements: interview.jobRequirements,
        jobLevel: interview.jobLevel,
        company: interview.company,
        overallEvaluationCriteria: interview.overallEvaluationCriteria,
        scoringSystem: interview.scoringSystem,
        createdAt: interview.createdAt,
        approvedAt: interview.approvedAt,
        rejectedAt: interview.rejectedAt,
        rejectionReason: interview.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ [GET INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [GET INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview'
    });
  }
};

// Get interview by ID endpoint (public access for shareable links)
const getPublicInterview = async (req, res) => {
  console.log('🌐 [GET PUBLIC INTERVIEW] Fetching public interview:', req.params.interviewId);
  
  try {
    // Find the interview (only approved interviews are publicly accessible)
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [GET PUBLIC INTERVIEW] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available for public access'
      });
    }

    console.log('✅ [GET PUBLIC INTERVIEW] Interview found successfully');
    console.log('📊 [GET PUBLIC INTERVIEW] Interview ID:', interview.interviewId);
    console.log('📊 [GET PUBLIC INTERVIEW] Title:', interview.title);
    console.log('📊 [GET PUBLIC INTERVIEW] Rounds:', interview.rounds?.length || 0);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds,
        approvalStatus: interview.approvalStatus,
        jobTitle: interview.jobTitle,
        jobDescription: interview.jobDescription,
        jobRequirements: interview.jobRequirements,
        jobLevel: interview.jobLevel,
        company: interview.company,
        overallEvaluationCriteria: interview.overallEvaluationCriteria,
        scoringSystem: interview.scoringSystem,
        createdAt: interview.createdAt,
        approvedAt: interview.approvedAt
      }
    });

  } catch (error) {
    console.error('❌ [GET PUBLIC INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [GET PUBLIC INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview'
    });
  }
};

// Update interview endpoint
const updateInterview = async (req, res) => {
  console.log('📝 [UPDATE INTERVIEW] Updating interview:', req.params.interviewId);
  console.log('👤 [UPDATE INTERVIEW] User ID:', req.user.id);
  console.log('👤 [UPDATE INTERVIEW] User role:', req.user.role);
  console.log('📝 [UPDATE INTERVIEW] Update data:', req.body);
  
  try {
    const { interviewId } = req.params;
    const updateData = req.body;
    
    // Find the interview by custom interviewId field
    const interview = await Interview.findOne({ interviewId: interviewId });
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }
    
    // Check if user has permission to update this interview
    if (interview.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this interview'
      });
    }
    
    // Update the interview with provided data
    const allowedFields = ['title', 'description', 'rounds', 'totalDuration', 'status'];
    const updateFields = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });
    
    // Validate and clean rounds data before saving
    if (updateFields.rounds && Array.isArray(updateFields.rounds)) {
      console.log('🧹 [UPDATE INTERVIEW] Cleaning rounds data before saving...');
      updateFields.rounds = updateFields.rounds.map((round, index) => {
        // Clean and validate questions
        let cleanQuestions = (round.questions || []).map((question, qIndex) => ({
          id: question.id || `q${index + 1}_${qIndex + 1}`,
          type: question.type || 'technical',
          question: question.question || 'Question text',
          expectedAnswer: question.expectedAnswer || 'Expected answer',
          timeLimit: question.timeLimit || 3,
          difficulty: question.difficulty || 'medium',
          followUpQuestions: question.followUpQuestions || []
        }));
        
        // If no questions exist, add a default question
        if (cleanQuestions.length === 0) {
          cleanQuestions = [{
            id: `q${index + 1}_1`,
            type: 'technical',
            question: 'Please tell me about your experience and background.',
            expectedAnswer: 'The candidate should provide relevant experience and background information.',
            timeLimit: 3,
            difficulty: 'medium',
            followUpQuestions: []
          }];
          console.log(`🔧 [UPDATE INTERVIEW] Added default question to empty round ${index + 1}`);
        }
        
        // Ensure required fields have default values
        const cleanedRound = {
          roundId: round.roundId || `round_${index + 1}`,
          roundNumber: round.roundNumber || index + 1,
          title: round.title || `Round ${index + 1}`,
          description: round.description || `Round ${index + 1} description`,
          duration: round.duration || 10, // Default to 10 minutes if missing
          questions: cleanQuestions,
          evaluationCriteria: round.evaluationCriteria || {
            technical: '',
            communication: '',
            problemSolving: '',
            culturalFit: '',
            leadership: '',
            motivation: ''
          }
        };
        
        // Log if we're fixing a null duration
        if (round.duration === null || round.duration === undefined) {
          console.log(`🔧 [UPDATE INTERVIEW] Fixed null duration for round ${index + 1}, setting to 10`);
        }
        
        return cleanedRound;
      });
      
      console.log('✅ [UPDATE INTERVIEW] Rounds data cleaned successfully');
    }
    
    // Log the cleaned updateFields before saving
    console.log('📝 [UPDATE INTERVIEW] Cleaned updateFields:', JSON.stringify(updateFields, null, 2));
    
    // Update the interview using the MongoDB _id
    const updatedInterview = await Interview.findByIdAndUpdate(
      interview._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    console.log('✅ [UPDATE INTERVIEW] Interview updated successfully');

    res.json({
      success: true,
      data: updatedInterview,
      message: 'Interview updated successfully'
    });

  } catch (error) {
    console.error('❌ [UPDATE INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update interview: ' + error.message
    });
  }
};

// Delete interview endpoint
const deleteInterview = async (req, res) => {
  console.log('🗑️ [DELETE INTERVIEW] Deleting interview:', req.params.interviewId);
  console.log('👤 [DELETE INTERVIEW] User ID:', req.user.id);
  console.log('👤 [DELETE INTERVIEW] User role:', req.user.role);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [DELETE INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    await Interview.deleteOne({ interviewId: req.params.interviewId });
    console.log('✅ [DELETE INTERVIEW] Interview deleted successfully');
    
    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('❌ [DELETE INTERVIEW] Error occurred:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete interview'
    });
  }
};

// Generate interview endpoint
const generateInterview = async (req, res) => {
  console.log('🎯 [INTERVIEW GENERATE] Starting interview generation...');
  console.log('👤 [INTERVIEW GENERATE] User ID:', req.user.id);
  console.log('👤 [INTERVIEW GENERATE] User role:', req.user.role);
  
  try {
    const { prompt, jobDetails } = req.body;
    
    // Debug: Log the entire request body
    console.log('🔍 [INTERVIEW GENERATE] Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [INTERVIEW GENERATE] Prompt exists:', !!prompt);
    console.log('🔍 [INTERVIEW GENERATE] JobDetails exists:', !!jobDetails);
    
    if (!prompt) {
      console.log('❌ [INTERVIEW GENERATE] Missing required prompt');
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Extract job details from prompt if not provided
    let extractedJobDetails = jobDetails;
    if (!extractedJobDetails) {
      console.log('🔍 [INTERVIEW GENERATE] Extracting job details from prompt...');
      extractedJobDetails = extractJobDetailsFromPrompt(prompt);
    }

    console.log('📝 [INTERVIEW GENERATE] Prompt:', prompt && prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt);
    console.log('📋 [INTERVIEW GENERATE] Job details:', {
      title: extractedJobDetails.title,
      company: extractedJobDetails.company
    });

    // Generate interview using AI
    const interviewData = await createStructuredInterview(prompt, extractedJobDetails);
    
    if (!interviewData) {
      console.log('❌ [INTERVIEW GENERATE] Failed to generate interview data');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate interview data'
      });
    }

    // Validate the generated interview structure
    if (!validateInterviewStructure(interviewData)) {
      console.log('❌ [INTERVIEW GENERATE] Generated interview structure is invalid');
      return res.status(500).json({
        success: false,
        error: 'Generated interview structure is invalid'
      });
    }

    // Save interview to database
    const interview = new Interview({
      ...interviewData,
      createdBy: req.user.id,
      approvalStatus: 'pending',
      jobTitle: extractedJobDetails.title,
      jobDescription: extractedJobDetails.description,
      jobRequirements: extractedJobDetails.requirements,
      jobLevel: extractedJobDetails.level,
      company: extractedJobDetails.company
    });

    await interview.save();

    console.log('✅ [INTERVIEW GENERATE] Interview generated and saved successfully');
    console.log('📊 [INTERVIEW GENERATE] Interview ID:', interview.interviewId);
    console.log('📊 [INTERVIEW GENERATE] Rounds:', interview.rounds.length);
    
    res.json({
      success: true,
      message: 'Interview generated successfully',
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        rounds: interview.rounds.length,
        totalDuration: interview.totalDuration,
        approvalStatus: interview.approvalStatus
      }
    });

  } catch (error) {
    console.error('❌ [INTERVIEW GENERATE] Error occurred:', error.message);
    console.error('🔍 [INTERVIEW GENERATE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate interview'
    });
  }
};

module.exports = {
  getAllInterviews,
  getInterviewById,
  getPublicInterview,
  updateInterview,
  deleteInterview,
  generateInterview
};
