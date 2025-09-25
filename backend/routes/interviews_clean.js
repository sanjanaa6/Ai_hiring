const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const KIMI_MODEL = 'moonshot/moonshot-v1-8k';

// Validation function for interview structure
const validateInterviewStructure = (interviewData) => {
  try {
    if (!interviewData) {
      console.log('❌ [VALIDATION] Interview data is null or undefined');
      return false;
    }

    if (!interviewData.interviewId || !interviewData.title || !interviewData.jobTitle) {
      console.log('❌ [VALIDATION] Missing required fields (interviewId, title, or jobTitle)');
      return false;
    }

    if (!interviewData.rounds || !Array.isArray(interviewData.rounds)) {
      console.log('❌ [VALIDATION] Rounds is missing or not an array');
      return false;
    }

    if (interviewData.rounds.length === 0) {
      console.log('❌ [VALIDATION] No rounds found');
      return false;
    }

    console.log('✅ [VALIDATION] Interview structure is valid');
    return true;
  } catch (error) {
    console.log('❌ [VALIDATION] Error during validation:', error.message);
    return false;
  }
};

// Helper function to parse AI response
const parseAIResponse = (responseText) => {
  try {
    // Try to parse as JSON first
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, return null
    console.log('⚠️ [PARSE AI RESPONSE] No valid JSON found in response');
    return null;
  } catch (error) {
    console.error('❌ [PARSE AI RESPONSE] Error parsing AI response:', error);
    return null;
  }
};

// Helper function to create role-specific interview from structured prompt
async function createRoleSpecificInterview(prompt, jobDetails) {
  try {
    const interviewId = `interview_${Date.now()}`;
    
    console.log('🤖 [AI INTERVIEW] Generating complete AI interview for:', jobDetails.title);
    console.log('🔍 [AI INTERVIEW] Job details:', {
      title: jobDetails.title,
      company: jobDetails.company,
      description: jobDetails.description?.substring(0, 100) + '...'
    });
    
    // Create comprehensive AI prompt for interview generation
    const aiPrompt = `
You are an expert interview designer. Create a comprehensive 6-round interview structure for the following position:

Job Title: ${jobDetails.title}
Company: ${jobDetails.company}
Job Description: ${jobDetails.description || 'No description provided'}

Requirements:
1. Create exactly 6 rounds with 5 questions each (30 total questions)
2. Each round should have a specific focus and increasing difficulty
3. Include various question types: behavioral, technical, situational, role-play, problem-solving
4. Make questions specific to the role and industry
5. Include realistic time limits and difficulty levels
6. Add follow-up questions where appropriate

Round Structure:
- Round 1: Introduction & Background (5 questions)
- Round 2: Technical/Professional Skills (5 questions) 
- Round 3: Problem Solving & Scenarios (5 questions)
- Round 4: Behavioral & Experience (5 questions)
- Round 5: Advanced Assessment (5 questions)
- Round 6: Final Evaluation & Fit (5 questions)

Respond with valid JSON only in this exact format:
{
  "interviewId": "${interviewId}",
  "title": "AI Multi-Round Interview - ${jobDetails.title}",
  "totalDuration": 90,
  "rounds": [
    {
      "roundId": "round_1",
      "roundNumber": 1,
      "title": "Round Title",
      "description": "Round description",
      "duration": 15,
      "questions": [
        {
          "id": "q1_1",
          "type": "question_type",
          "question": "Question text",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 3,
          "difficulty": "easy|medium|hard",
          "followUpQuestions": ["follow-up 1", "follow-up 2"]
        }
      ],
      "evaluationCriteria": {
        "skill1": "Description",
        "skill2": "Description"
      }
    }
  ],
  "overallEvaluationCriteria": {
    "technical": "Overall technical competency",
    "communication": "Communication skills",
    "experience": "Relevant experience"
  },
  "scoringSystem": {
    "excellent": "4",
    "good": "3", 
    "satisfactory": "2",
    "needsImprovement": "1"
  },
  "company": "${jobDetails.company}"
}

Make sure each question is directly relevant to the specific role and requirements mentioned.`;

    const response = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview designer. Generate comprehensive, role-specific interview questions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const interviewData = parseAIResponse(response.data.choices[0].message.content);
    console.log('✅ [AI INTERVIEW] Successfully generated AI interview with', interviewData.rounds?.length || 0, 'rounds');
    
    return interviewData;
    
  } catch (error) {
    console.error('❌ [AI INTERVIEW] Error generating AI interview:', error.message);
    console.error('🔍 [AI INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    // If AI fails, throw an error instead of using fallback
    throw new Error(`Failed to generate AI interview: ${error.message}`);
  }
}

// Helper function to create structured interview from text
async function createStructuredInterview(textResponse, jobDetails) {
  const interviewId = `interview_${Date.now()}`;
  
  // Check if this is a role-specific prompt
  const isRoleSpecificPrompt = textResponse.includes('**Introduction & Self Intro**') || 
                               textResponse.includes('**Self Introduction**') ||
                               textResponse.includes('**Coding Round**') ||
                               textResponse.includes('**Sales Pitch/Role-play**');
  
  if (isRoleSpecificPrompt) {
    console.log('🎯 [INTERVIEW GENERATE] Using role-specific prompt structure');
    return await createRoleSpecificInterview(textResponse, jobDetails);
  }
  
  // For all cases, use AI to generate completely dynamic questions
  console.log('🤖 [STRUCTURED INTERVIEW] Generating all questions with AI...');
  
  try {
    // Use the AI interview generation function
    return await createRoleSpecificInterview(textResponse, jobDetails);
  } catch (error) {
    console.error('❌ [STRUCTURED INTERVIEW] Error generating AI questions:', error);
    
    // If AI fails, throw an error instead of using fallback
    throw new Error(`Failed to generate AI interview: ${error.message}`);
  }
}

// Generate interview endpoint
router.post('/generate', auth, async (req, res) => {
  console.log('🎯 [INTERVIEW GENERATE] Starting interview generation...');
  console.log('👤 [INTERVIEW GENERATE] User ID:', req.user.id);
  console.log('👤 [INTERVIEW GENERATE] User role:', req.user.role);
  
  try {
    const { prompt, jobDetails } = req.body;
    
    if (!prompt || !jobDetails) {
      console.log('❌ [INTERVIEW GENERATE] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Prompt and job details are required'
      });
    }

    console.log('📝 [INTERVIEW GENERATE] Prompt:', prompt.substring(0, 100) + '...');
    console.log('📋 [INTERVIEW GENERATE] Job details:', {
      title: jobDetails.title,
      company: jobDetails.company
    });

    // Generate interview using AI
    const interviewData = await createStructuredInterview(prompt, jobDetails);
    
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
      approvalStatus: 'pending'
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
});

// Approve interview endpoint
router.post('/:interviewId/approve', auth, async (req, res) => {
  console.log('✅ [APPROVE INTERVIEW] Approving interview:', req.params.interviewId);
  console.log('👤 [APPROVE INTERVIEW] User ID:', req.user.id);
  console.log('👤 [APPROVE INTERVIEW] User role:', req.user.role);
  
  try {
    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      console.log('❌ [APPROVE INTERVIEW] Unauthorized user role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Only recruiters and admins can approve interviews'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [APPROVE INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    if (interview.approvalStatus === 'approved') {
      console.log('⚠️ [APPROVE INTERVIEW] Interview already approved:', req.params.interviewId);
      return res.status(400).json({
        success: false,
        error: 'Interview is already approved'
      });
    }

    // Update interview status to approved
    interview.approvalStatus = 'approved';
    interview.approvedAt = new Date();
    interview.approvedBy = req.user.id;
    
    await interview.save();

    console.log('✅ [APPROVE INTERVIEW] Interview approved successfully');
    console.log('📊 [APPROVE INTERVIEW] Interview ID:', interview.interviewId);
    console.log('📊 [APPROVE INTERVIEW] Approved by:', req.user.id);
    console.log('📊 [APPROVE INTERVIEW] Approved at:', interview.approvedAt);

    // Generate shareable link
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${frontendBase}/interviews/${interview.interviewId}`;

    res.json({
      success: true,
      message: 'Interview approved successfully',
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        approvalStatus: interview.approvalStatus,
        approvedAt: interview.approvedAt,
        approvedBy: interview.approvedBy,
        shareableLink: shareableLink
      }
    });

  } catch (error) {
    console.error('❌ [APPROVE INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [APPROVE INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to approve interview'
    });
  }
});

// Reject interview endpoint
router.post('/:interviewId/reject', auth, async (req, res) => {
  console.log('❌ [REJECT INTERVIEW] Rejecting interview:', req.params.interviewId);
  console.log('👤 [REJECT INTERVIEW] User ID:', req.user.id);
  console.log('👤 [REJECT INTERVIEW] User role:', req.user.role);
  
  try {
    // Check if user is recruiter or admin
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      console.log('❌ [REJECT INTERVIEW] Unauthorized user role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Only recruiters and admins can reject interviews'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [REJECT INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    if (interview.approvalStatus === 'rejected') {
      console.log('⚠️ [REJECT INTERVIEW] Interview already rejected:', req.params.interviewId);
      return res.status(400).json({
        success: false,
        error: 'Interview is already rejected'
      });
    }

    // Update interview status to rejected
    interview.approvalStatus = 'rejected';
    interview.rejectedAt = new Date();
    interview.rejectedBy = req.user.id;
    
    // Add rejection reason if provided
    if (req.body.rejectionReason) {
      interview.rejectionReason = req.body.rejectionReason;
    }

    await interview.save();

    console.log('✅ [REJECT INTERVIEW] Interview rejected successfully');
    console.log('📊 [REJECT INTERVIEW] Interview ID:', interview.interviewId);
    console.log('📊 [REJECT INTERVIEW] Rejected by:', req.user.id);
    console.log('📊 [REJECT INTERVIEW] Rejected at:', interview.rejectedAt);

    res.json({
      success: true,
      message: 'Interview rejected successfully',
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        approvalStatus: interview.approvalStatus,
        rejectedAt: interview.rejectedAt,
        rejectedBy: interview.rejectedBy,
        rejectionReason: interview.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ [REJECT INTERVIEW] Error occurred:', error.message);
    console.error('🔍 [REJECT INTERVIEW] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to reject interview'
    });
  }
});

module.exports = router;
