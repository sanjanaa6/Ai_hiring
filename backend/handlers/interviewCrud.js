// Interview CRUD operations
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const { validateInterviewStructure, extractJobDetailsFromPrompt } = require('../utils/interviewUtils');
const { createStructuredInterview } = require('../services/aiInterviewService');
const crypto = require('crypto');

// Create interview endpoint
const createInterview = async (req, res) => {
  console.log('📝 [CREATE INTERVIEW] Creating new interview for user:', req.user.id);
  console.log('📋 [CREATE INTERVIEW] Interview data:', req.body);
  
  try {
    const {
      title,
      jobTitle,
      jobDescription,
      jobRequirements,
      jobLevel,
      totalDuration,
      rounds
    } = req.body;

    // Validate required fields
    if (!title || !jobTitle || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Title, job title, and job description are required'
      });
    }

    if (!rounds || rounds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one round is required'
      });
    }

    // Generate unique interview ID
    const interviewId = `interview_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create interview object
    const interview = new Interview({
      interviewId: interviewId,
      title: title,
      jobTitle: jobTitle,
      jobDescription: jobDescription,
      jobRequirements: jobRequirements || '',
      jobLevel: jobLevel || 'Mid-level',
      totalDuration: totalDuration || 60,
      rounds: rounds,
      approvalStatus: 'pending',
      createdBy: req.user.id,
      status: 'active',
      overallEvaluationCriteria: {
        technical: '',
        communication: '',
        problemSolving: '',
        culturalFit: '',
        leadership: '',
        motivation: ''
      },
      scoringSystem: {
        excellent: '4 - Exceeds expectations',
        good: '3 - Meets expectations',
        satisfactory: '2 - Partially meets expectations',
        needsImprovement: '1 - Below expectations'
      }
    });

    // Generate access links for all rounds
    interview.generateAccessLinks();

    // Save interview
    await interview.save();

    console.log('✅ [CREATE INTERVIEW] Interview created successfully:', interviewId);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        jobTitle: interview.jobTitle,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds.length,
        approvalStatus: interview.approvalStatus,
        createdAt: interview.createdAt,
        link: `/recruiter/review/${interview.interviewId}`
      }
    });

  } catch (error) {
    console.error('❌ [CREATE INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [CREATE INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create interview'
    });
  }
};

// Get all interviews for user endpoint (must come before /:interviewId route)
const getAllInterviews = async (req, res) => {
  console.log('📋 [GET INTERVIEWS] Fetching all interviews for user:', req.user.id);
  console.log('👤 [GET INTERVIEWS] User role:', req.user.role);
  
  try {
    // Scope interviews
    // - Admin: can see all
    // - Recruiter: can only see interviews they created (createdBy)
    // - Others: can only see interviews they created (createdBy)
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
    
    const interviews = await Interview.find(query).sort({ createdAt: -1 });

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
    // Scope access to interview by ownership unless admin
    const query = req.user.role === 'admin'
      ? { interviewId: req.params.interviewId }
      : { interviewId: req.params.interviewId, createdBy: req.user.id };
    
    console.log('🔍 [GET INTERVIEW] Query:', JSON.stringify(query));
    const interview = await Interview.findOne(query);

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
    
    // Debug allowRetake fields in database
    if (interview.rounds) {
      console.log('🔍 [GET INTERVIEW] Round allowRetake values from database:');
      interview.rounds.forEach((round, index) => {
        console.log(`🔍 [GET INTERVIEW] Round ${index + 1} (${round.title}): allowRetake = ${round.allowRetake} (${typeof round.allowRetake})`);
      });
    }

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

    // Get schedules for this interview
    const InterviewSchedule = require('../models/InterviewSchedule');
    const schedules = await InterviewSchedule.find({ 
      interviewId: interview.interviewId 
    }).select('roundNumber startDateTime endDateTime status maxCandidates');

    console.log('📊 [GET PUBLIC INTERVIEW] Schedules found:', schedules.length);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds,
        schedules: schedules, // Include schedules in the response
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
      console.log('🧹 [UPDATE INTERVIEW] Original rounds data:', JSON.stringify(updateFields.rounds, null, 2));
      updateFields.rounds = updateFields.rounds.map((round, index) => {
        console.log(`🧹 [UPDATE INTERVIEW] Processing round ${index + 1}:`, JSON.stringify(round, null, 2));
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
        
        // If no questions exist and it's an interview round, add a default question
        if (cleanQuestions.length === 0 && round.type !== 'file_upload' && round.type !== 'form_submission') {
          cleanQuestions = [{
            id: `q${index + 1}_1`,
            type: 'technical',
            question: 'Please tell me about your experience and background.',
            expectedAnswer: 'The candidate should provide relevant experience and background information.',
            timeLimit: 3,
            difficulty: 'medium',
            followUpQuestions: []
          }];
          console.log(`🔧 [UPDATE INTERVIEW] Added default question to empty interview round ${index + 1}`);
        }
        
        // Log the original round data to debug allowRetake
        console.log(`🔍 [UPDATE INTERVIEW] Original round ${index + 1} allowRetake value:`, round.allowRetake, typeof round.allowRetake);
        
        // Ensure required fields have default values
        const cleanedRound = {
          roundId: round.roundId || `round_${index + 1}`,
          roundNumber: round.roundNumber || index + 1,
          title: round.title || `Round ${index + 1}`,
          description: round.description || `Round ${index + 1} description`,
          duration: round.duration || 10, // Default to 10 minutes if missing
          type: round.type || 'interview', // Preserve round type
          allowRetake: Boolean(round.allowRetake), // Ensure allowRetake is always a boolean
          evaluationCriteria: round.evaluationCriteria || {
            technical: '',
            communication: '',
            problemSolving: '',
            culturalFit: '',
            leadership: '',
            motivation: ''
          }
        };
        
        console.log(`🔍 [UPDATE INTERVIEW] Cleaned round ${index + 1} allowRetake value:`, cleanedRound.allowRetake, typeof cleanedRound.allowRetake);

        // Handle different round types
        if (round.type === 'file_upload') {
          // For file upload rounds, preserve fileUploadRequirements and remove questions
          cleanedRound.fileUploadRequirements = round.fileUploadRequirements || [];
          delete cleanedRound.questions; // Remove questions field for file upload rounds
          delete cleanedRound.formFields; // Remove formFields for file upload rounds
          console.log(`📁 [UPDATE INTERVIEW] Preserving file upload round ${index + 1} with ${cleanedRound.fileUploadRequirements.length} requirements, allowRetake: ${cleanedRound.allowRetake}`);
        } else if (round.type === 'form_submission') {
          // For form submission rounds, preserve formFields and remove questions/fileUploadRequirements
          cleanedRound.formFields = round.formFields || [];
          delete cleanedRound.questions; // Remove questions field for form submission rounds
          delete cleanedRound.fileUploadRequirements; // Remove fileUploadRequirements for form submission rounds
          console.log(`📝 [UPDATE INTERVIEW] Preserving form submission round ${index + 1} with ${cleanedRound.formFields.length} form fields, allowRetake: ${cleanedRound.allowRetake}`);
        } else {
          // For interview rounds, use questions and remove fileUploadRequirements/formFields
          cleanedRound.questions = cleanQuestions;
          delete cleanedRound.fileUploadRequirements; // Remove fileUploadRequirements field for interview rounds
          delete cleanedRound.formFields; // Remove formFields for interview rounds
          console.log(`💬 [UPDATE INTERVIEW] Preserving interview round ${index + 1} with ${cleanQuestions.length} questions, allowRetake: ${cleanedRound.allowRetake}`);
        }
        
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

    // Generate access links for all rounds
    const accessLinks = interview.generateAccessLinks();
    
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
        approvalStatus: interview.approvalStatus,
        accessLinks: accessLinks.map(link => ({
          roundNumber: link.roundNumber,
          accessLink: link.accessLink,
          isScheduled: link.isScheduled
        }))
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
  createInterview,
  getAllInterviews,
  getInterviewById,
  getPublicInterview,
  updateInterview,
  deleteInterview,
  generateInterview
};
