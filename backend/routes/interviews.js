const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const KIMI_MODEL = 'moonshotai/kimi-vl-a3b-thinking';
const FALLBACK_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// Generate AI interview
router.post('/generate', auth, async (req, res) => {
  console.log('🚀 [INTERVIEW GENERATE] Starting interview generation...');
  console.log('📝 [INTERVIEW GENERATE] Request body:', {
    prompt: req.body.prompt?.substring(0, 200) + '...'
  });
  console.log('👤 [INTERVIEW GENERATE] User ID:', req.user.id);

  try {
    const { prompt: userPrompt } = req.body;
    
    if (!userPrompt || userPrompt.trim().length < 10) {
      console.log('❌ [INTERVIEW GENERATE] Validation failed - missing or too short prompt');
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a detailed job description prompt (minimum 10 characters)' 
      });
    }

    console.log('✅ [INTERVIEW GENERATE] Validation passed, extracting job details from prompt...');

    // First, extract job details from the prompt
    const extractionPrompt = `Extract job details from this user prompt and format as JSON:

User Prompt: "${userPrompt}"

Extract and format the following information as valid JSON:
{
  "title": "Job title (e.g., Senior Frontend Developer)",
  "description": "Comprehensive job description based on the prompt",
  "requirements": "Key requirements and qualifications",
  "level": "junior|mid|senior|lead (based on context)",
  "duration": 30,
  "company": "Company name if mentioned, otherwise 'Company'"
}

If any information is missing, make reasonable assumptions based on the context.`;

    console.log('🤖 [INTERVIEW GENERATE] Extracting job details...');
    
    let extractionResponse;
    try {
      // Try multiple models for job extraction
      const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo'];
      let lastError = null;
      
      for (const model of modelsToTry) {
        try {
          console.log('🎯 [INTERVIEW GENERATE] Trying extraction model:', model);
          
      extractionResponse = await axios.post(OPENROUTER_API_URL, {
            model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured job information from natural language descriptions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'AI Hiring Platform'
        }
      });
          
          console.log('✅ [INTERVIEW GENERATE] Extraction success with model:', model);
          break; // Success, exit the loop
          
        } catch (error) {
          console.log('❌ [INTERVIEW GENERATE] Extraction failed with model:', model, error.response?.status || error.message);
          lastError = error;
          continue; // Try next model
        }
      }
      
      if (!extractionResponse) {
        throw lastError || new Error('All extraction models failed');
      }
    } catch (apiError) {
      console.log('⚠️ [INTERVIEW GENERATE] OpenRouter API extraction failed, using fallback:', apiError.response?.status || apiError.message);
      // Skip extraction step and use fallback immediately
      const jobDetails = {
        title: extractBasicTitle(userPrompt),
        description: userPrompt,
        requirements: "Requirements to be determined based on the role",
        level: "mid",
        duration: 30,
        company: "Company"
      };
      
      // Generate interview with fallback data
      const interviewData = createStructuredInterview(userPrompt, jobDetails);
      const finalData = ensureFiveRounds(interviewData, jobDetails);
      
      // Save to database
      const interview = new Interview({
        ...finalData,
        jobTitle: jobDetails.title,
        jobDescription: jobDetails.description,
        jobRequirements: jobDetails.requirements,
        jobLevel: jobDetails.level,
        company: jobDetails.company,
        originalPrompt: userPrompt,
        createdBy: req.user.id
      });

      await interview.save();
      console.log('✅ [INTERVIEW GENERATE] Interview saved with fallback data, ID:', interview.interviewId);

      return res.json({
        success: true,
        data: {
          interviewId: interview.interviewId,
          title: interview.title,
          totalDuration: interview.totalDuration,
          rounds: interview.rounds,
          link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${interview.interviewId}`
        }
      });
    }

    let jobDetails;
    try {
      const extractedContent = extractionResponse.data.choices[0].message.content;
      console.log('📋 [INTERVIEW GENERATE] Raw extraction result:', extractedContent.substring(0, 200) + '...');
      
      // Clean the response if it has markdown code blocks
      const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : extractedContent;
      
      jobDetails = JSON.parse(jsonContent);
      console.log('✅ [INTERVIEW GENERATE] Job details extracted:', {
        title: jobDetails.title,
        level: jobDetails.level,
        duration: jobDetails.duration
      });
    } catch (parseError) {
      console.log('⚠️ [INTERVIEW GENERATE] Failed to parse job details, using fallbacks');
      // Fallback to basic extraction
      jobDetails = {
        title: extractBasicTitle(userPrompt),
        description: userPrompt,
        requirements: "Requirements to be determined based on the role",
        level: "mid",
        duration: 30,
        company: "Company"
      };
    }

    const { title, description, requirements, level, duration } = jobDetails;
    console.log('✅ [INTERVIEW GENERATE] Using job details for interview generation...');

    // Generate interview using AI
    const interviewPrompt = `You are an expert HR professional and technical interviewer. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes

Create a structured interview with exactly 5 hiring rounds that are SPECIFICALLY tailored to this role:

ROUND 1: Technical Fundamentals (15-20 minutes)
- 3-4 technical questions directly related to ${title} role
- Focus on core technologies and concepts mentioned in requirements
- Assess depth of technical knowledge for this specific position

ROUND 2: Role-Specific Experience (15-20 minutes)
- 3-4 questions about past experience relevant to ${title}
- STAR method questions specific to this role's challenges
- Real-world scenarios this position would face

ROUND 3: Problem-Solving & Critical Thinking (15-20 minutes)
- 2-3 complex scenarios specific to ${title} role
- Industry-specific problem-solving approaches
- Decision-making under pressure relevant to this position

ROUND 4: Team Collaboration & Leadership (10-15 minutes)
- Questions about working in teams for ${title} role
- Leadership scenarios relevant to this position level
- Communication skills for this specific role

ROUND 5: Cultural Fit & Industry Knowledge (10-15 minutes)
- Current trends and technologies in the ${title} field
- Alignment with company values and work culture
- Career goals and motivation for this specific role

IMPORTANT: Format your response as valid JSON with this exact structure:
{
  "interviewId": "interview_${Date.now()}",
  "title": "AI Multi-Round Interview - ${title}",
  "totalDuration": ${duration},
  "rounds": [
    {
      "roundId": "round_1",
      "roundNumber": 1,
      "title": "Technical Fundamentals",
      "description": "Evaluate technical skills and problem-solving abilities",
      "duration": 20,
      "questions": [
        {
          "id": "q1_1",
          "type": "technical",
          "question": "Your technical question here",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
        }
      ],
      "evaluationCriteria": {
        "technical": "How to evaluate technical knowledge and skills",
        "problemSolving": "How to evaluate problem-solving approach"
      }
    }
  ],
  "overallEvaluationCriteria": {
    "technical": "Overall technical competency assessment",
    "communication": "Communication and articulation skills",
    "problemSolving": "Problem-solving methodology and creativity",
    "culturalFit": "Alignment with company values and culture",
    "leadership": "Leadership potential and team collaboration",
    "motivation": "Career goals and job motivation"
  },
  "scoringSystem": {
    "excellent": "4",
    "good": "3",
    "satisfactory": "2",
    "needsImprovement": "1"
  }
}

Make sure the JSON is valid and properly formatted with all 5 rounds.`;

    console.log('🤖 [INTERVIEW GENERATE] Calling OpenRouter API...');
    console.log('🔑 [INTERVIEW GENERATE] API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('🌐 [INTERVIEW GENERATE] API URL:', OPENROUTER_API_URL);
    console.log('🎯 [INTERVIEW GENERATE] Model:', KIMI_MODEL);

    let aiResponse;
    try {
      // Try multiple models for interview generation
      const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'];
      let lastError = null;
      
      for (const model of modelsToTry) {
        try {
          console.log('🎯 [INTERVIEW GENERATE] Trying generation model:', model);
          
      aiResponse = await axios.post(OPENROUTER_API_URL, {
            model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR professional and technical interviewer. Generate comprehensive, role-specific interview questions in valid JSON format.'
        },
        {
          role: 'user',
            content: interviewPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'AI Hiring Platform'
      }
    });
          
          console.log('✅ [INTERVIEW GENERATE] Generation success with model:', model);
          break; // Success, exit the loop
          
        } catch (error) {
          console.log('❌ [INTERVIEW GENERATE] Generation failed with model:', model, error.response?.status || error.message);
          lastError = error;
          continue; // Try next model
        }
      }
      
      if (!aiResponse) {
        throw lastError || new Error('All generation models failed');
      }
    } catch (apiError) {
      console.log('⚠️ [INTERVIEW GENERATE] OpenRouter API failed, using structured fallback:', apiError.response?.status || apiError.message);
      
      // Create interview with structured fallback
      const interviewData = createStructuredInterview("AI Generated Interview", { title, description, requirements, level, duration });
      const finalData = ensureFiveRounds(interviewData, { title, description, requirements, level, duration });
      
      // Save to database
      const interview = new Interview({
        ...finalData,
        jobTitle: title,
        jobDescription: description,
        jobRequirements: requirements,
        jobLevel: level,
        company: jobDetails.company || 'Company',
        originalPrompt: userPrompt,
        createdBy: req.user.id
      });

      await interview.save();
      console.log('✅ [INTERVIEW GENERATE] Interview saved with structured fallback, ID:', interview.interviewId);

      return res.json({
        success: true,
        data: {
          interviewId: interview.interviewId,
          title: interview.title,
          totalDuration: interview.totalDuration,
          rounds: interview.rounds,
          link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${interview.interviewId}`
        }
      });
    }

    console.log('✅ [INTERVIEW GENERATE] AI API call successful');
    console.log('📊 [INTERVIEW GENERATE] AI Response status:', aiResponse.status);
    console.log('📝 [INTERVIEW GENERATE] AI Response length:', aiResponse.data.choices[0].message.content.length);

    const aiData = aiResponse.data.choices[0].message.content;
    
    // Parse AI response
    let interviewData;
    try {
      console.log('🔍 [INTERVIEW GENERATE] Attempting to parse AI response as JSON...');
      interviewData = JSON.parse(aiData);
      console.log('✅ [INTERVIEW GENERATE] JSON parsing successful');
      console.log('📊 [INTERVIEW GENERATE] Generated rounds:', interviewData.rounds?.length || 0);
    } catch (parseError) {
      console.log('⚠️ [INTERVIEW GENERATE] JSON parsing failed, creating structured response');
      console.log('❌ [INTERVIEW GENERATE] Parse error:', parseError.message);
      console.log('📝 [INTERVIEW GENERATE] AI response preview:', aiData.substring(0, 200) + '...');
      // If JSON parsing fails, create a structured response
      interviewData = createStructuredInterview(aiData, { title, description, requirements, level, duration });
    }

    // Ensure exactly 5 rounds exist
    try {
      interviewData = ensureFiveRounds(interviewData, { title, description, requirements, level, duration });
      console.log('✅ [INTERVIEW GENERATE] ensureFiveRounds applied:', interviewData.rounds?.length || 0);
    } catch (e) {
      console.log('⚠️ [INTERVIEW GENERATE] ensureFiveRounds error:', e.message);
    }

    console.log('💾 [INTERVIEW GENERATE] Creating interview in database...');
    // Create interview in database
    const interview = new Interview({
      ...interviewData,
      jobTitle: title,
      jobDescription: description,
      jobRequirements: requirements,
      jobLevel: level,
      company: jobDetails.company || 'Company',
      originalPrompt: userPrompt, // Store the original user prompt
      createdBy: req.user.id
    });

    await interview.save();
    console.log('✅ [INTERVIEW GENERATE] Interview saved successfully with ID:', interview.interviewId);

    const responseData = {
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds,
        link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${interview.interviewId}`
      }
    };

    console.log('🎉 [INTERVIEW GENERATE] Interview generation completed successfully');
    console.log('🔗 [INTERVIEW GENERATE] Generated link:', responseData.data.link);

    res.json(responseData);

  } catch (error) {
    console.error('❌ [INTERVIEW GENERATE] Error occurred:', error.message);
    console.error('🔍 [INTERVIEW GENERATE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...',
      response: error.response?.data,
      status: error.response?.status
    });
    
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate interview';
    console.error('📤 [INTERVIEW GENERATE] Sending error response:', errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Start a session for a candidate: returns the first unanswered question
router.post('/:interviewId/session/start', async (req, res) => {
  try {
    const { candidateId, candidateName, candidateEmail } = req.body || {};
    if (!candidateId || !candidateName || !candidateEmail) {
      return res.status(400).json({ success: false, error: 'candidateId, candidateName, candidateEmail are required' });
    }

    const interview = await Interview.findOne({ interviewId: req.params.interviewId, status: 'active' });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found or inactive' });

    const nextQuestion = getNextQuestion(interview, candidateId);
    return res.json({ success: true, data: { nextQuestion, progress: getProgress(interview, candidateId) } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

// Start specific round with camera and device validation
router.post('/:interviewId/round/:roundId/start', async (req, res) => {
  console.log('🎬 [START ROUND] Starting round with camera validation for interview:', req.params.interviewId);
  console.log('🎭 [START ROUND] Round ID:', req.params.roundId);
  
  try {
    const { candidateId, candidateName, candidateEmail, deviceCheckPassed } = req.body || {};
    
    if (!candidateId || !candidateName || !candidateEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'candidateId, candidateName, candidateEmail are required' 
      });
    }

    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId, 
      status: 'active' 
    });
    
    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        error: 'Interview not found or inactive' 
      });
    }

    // Find the specific round
    const round = interview.rounds.find(r => r.roundId === req.params.roundId);
    if (!round) {
      return res.status(404).json({ 
        success: false, 
        error: 'Round not found' 
      });
    }

    // Device validation check
    if (!deviceCheckPassed) {
      console.log('❌ [START ROUND] Device check failed for candidate:', candidateId);
      return res.status(400).json({
        success: false,
        error: 'Device validation failed. Please ensure no electronic devices are detected.',
        requiresDeviceCheck: true
      });
    }

    console.log('✅ [START ROUND] Device check passed, starting round:', round.title);

    // Get first question of this round
    const firstQuestion = round.questions && round.questions.length > 0 ? round.questions[0] : null;
    
    if (!firstQuestion) {
      return res.status(400).json({
        success: false,
        error: 'No questions found in this round'
      });
    }

    const response = {
      success: true,
      data: {
        round: {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          duration: round.duration,
          totalQuestions: round.questions.length
        },
        currentQuestion: {
          questionId: firstQuestion.id,
          type: firstQuestion.type,
          question: firstQuestion.question,
          timeLimit: firstQuestion.timeLimit,
          difficulty: firstQuestion.difficulty,
          questionNumber: 1,
          totalQuestions: round.questions.length
        },
        instructions: {
          voiceRequired: true,
          cameraRequired: true,
          timeLimit: firstQuestion.timeLimit * 60, // Convert to seconds
          message: 'Please answer using your voice. You have ' + firstQuestion.timeLimit + ' minutes for this question.'
        }
      }
    };

    console.log('🎤 [START ROUND] Round started successfully with voice requirements');
    return res.json(response);

  } catch (error) {
    console.error('❌ [START ROUND] Error occurred:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to start round' 
    });
  }
});

// Validate image for electronic devices using AI
router.post('/:interviewId/validate-environment', async (req, res) => {
  console.log('🔍 [DEVICE CHECK] Starting environment validation for interview:', req.params.interviewId);
  
  try {
    const { imageData, candidateId } = req.body;
    
    if (!imageData || !candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Image data and candidate ID are required'
      });
    }

    console.log('🤖 [DEVICE CHECK] Analyzing image for electronic devices...');

    // AI prompt for device detection
    const deviceCheckPrompt = `Analyze this image captured from a candidate's camera during an interview. Look for any electronic devices that should not be present during an exam/interview.

Detect and identify:
1. Mobile phones/smartphones
2. Tablets or iPads
3. Smart watches
4. Additional monitors or screens
5. Other electronic devices (excluding the computer/laptop they're using for the interview)

Respond with JSON only:
{
  "devicesDetected": true/false,
  "devices": ["list of detected devices"],
  "severity": "low/medium/high",
  "recommendation": "allow/warn/block",
  "message": "Explanation for the candidate"
}

If no unauthorized devices are detected, set devicesDetected to false.`;

    let deviceCheckResult;
    
    try {
      // Try OpenRouter API for device detection
      const aiResponse = await axios.post(OPENROUTER_API_URL, {
        model: KIMI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at detecting electronic devices in images for interview security. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: deviceCheckPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'AI Hiring Platform'
        }
      });

      const aiContent = aiResponse.data.choices[0].message.content;
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : aiContent;
      
      deviceCheckResult = JSON.parse(jsonContent);
      console.log('✅ [DEVICE CHECK] AI analysis completed:', deviceCheckResult);
      
    } catch (apiError) {
      console.log('⚠️ [DEVICE CHECK] AI API failed, using basic validation:', apiError.response?.status || apiError.message);
      
      // Fallback: Basic validation (assume no devices for now)
      deviceCheckResult = {
        devicesDetected: false,
        devices: [],
        severity: "low",
        recommendation: "allow",
        message: "Environment check completed. You may proceed with the interview."
      };
    }

    const response = {
      success: true,
      data: {
        deviceCheckPassed: deviceCheckResult.recommendation === 'allow',
        devicesDetected: deviceCheckResult.devicesDetected,
        devices: deviceCheckResult.devices || [],
        severity: deviceCheckResult.severity || 'low',
        message: deviceCheckResult.message,
        recommendation: deviceCheckResult.recommendation
      }
    };

    console.log('🔒 [DEVICE CHECK] Validation completed:', response.data.deviceCheckPassed ? 'PASSED' : 'FAILED');
    return res.json(response);

  } catch (error) {
    console.error('❌ [DEVICE CHECK] Error occurred:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate environment'
    });
  }
});

// Get current session state and next question
router.get('/:interviewId/session/state', async (req, res) => {
  try {
    const { candidateId } = req.query;
    if (!candidateId) return res.status(400).json({ success: false, error: 'candidateId is required' });
    const interview = await Interview.findOne({ interviewId: req.params.interviewId });
    if (!interview) return res.status(404).json({ success: false, error: 'Interview not found' });
    const nextQuestion = getNextQuestion(interview, candidateId);
    return res.json({ success: true, data: { nextQuestion, progress: getProgress(interview, candidateId) } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to get session state' });
  }
});

// Get interview by ID (for candidates)
router.get('/:interviewId', async (req, res) => {
  console.log('🔍 [GET INTERVIEW] Fetching interview:', req.params.interviewId);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      status: 'active'
    });

    if (!interview) {
      console.log('❌ [GET INTERVIEW] Interview not found or inactive:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or inactive'
      });
    }

    // Normalize legacy shape: if no rounds but questions exist, wrap into a single round
    let normalizedRounds = Array.isArray(interview.rounds) && interview.rounds.length > 0
      ? interview.rounds
      : [];

    if (normalizedRounds.length === 0 && Array.isArray(interview.questions) && interview.questions.length > 0) {
      normalizedRounds = [{
        roundId: 'round_1',
        roundNumber: 1,
        title: interview.title || 'Interview',
        description: 'Auto-generated round from legacy questions',
        duration: interview.totalDuration || 30,
        questions: interview.questions,
        evaluationCriteria: {}
      }];
    }

    console.log('✅ [GET INTERVIEW] Interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: normalizedRounds.length,
      totalDuration: interview.totalDuration
    });

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: normalizedRounds,
        overallEvaluationCriteria: interview.overallEvaluationCriteria,
        scoringSystem: interview.scoringSystem
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
      error: 'Failed to get interview'
    });
  }
});

// Submit candidate answer (supports both text and voice)
router.post('/:interviewId/answer', async (req, res) => {
  console.log('📝 [SUBMIT ANSWER] New answer submission for interview:', req.params.interviewId);
  console.log('👤 [SUBMIT ANSWER] Candidate:', req.body.candidateName, req.body.candidateEmail);
  console.log('❓ [SUBMIT ANSWER] Question ID:', req.body.questionId);
  console.log('🎤 [SUBMIT ANSWER] Answer type:', req.body.answerType || 'text');
  
  try {
    const { 
      candidateId, 
      candidateName, 
      candidateEmail, 
      roundId, 
      questionId, 
      question, 
      answer, 
      timeTaken,
      answerType = 'text',
      audioData,
      transcription
    } = req.body;

    if (!candidateId || !candidateName || !candidateEmail || !roundId || !questionId || !question) {
      console.log('❌ [SUBMIT ANSWER] Validation failed - missing required fields');
      console.log('📋 [SUBMIT ANSWER] Received fields:', Object.keys(req.body));
      return res.status(400).json({
        success: false,
        error: 'candidateId, candidateName, candidateEmail, roundId, questionId, question are required'
      });
    }

    // Validate answer based on type
    let finalAnswer = answer;
    if (answerType === 'voice') {
      if (!transcription && !audioData) {
        return res.status(400).json({
          success: false,
          error: 'Voice answers require either transcription or audio data'
        });
      }
      
      // Use transcription text for AI evaluation (not the audio data)
      if (transcription && transcription.trim().length > 0) {
        finalAnswer = transcription.trim();
        console.log('🎙️ [SUBMIT ANSWER] Using transcription for AI evaluation:', {
          transcriptionLength: finalAnswer.length,
          preview: finalAnswer.substring(0, 100) + '...',
          note: 'Transcription text will be sent to AI for evaluation and feedback'
        });
      } else {
        finalAnswer = '[Voice answer - transcription not available, audio data provided]';
        console.log('⚠️ [SUBMIT ANSWER] No transcription available, using fallback text for AI evaluation');
      }
    } else {
      if (!answer) {
        return res.status(400).json({
          success: false,
          error: 'Text answer is required for text-type submissions'
        });
      }
    }

    console.log('✅ [SUBMIT ANSWER] Validation passed, finding interview...');
    const interview = await Interview.findOne({ interviewId: req.params.interviewId });
    if (!interview) {
      console.log('❌ [SUBMIT ANSWER] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    console.log('✅ [SUBMIT ANSWER] Interview found, evaluating answer with AI...');
    console.log('📝 [SUBMIT ANSWER] Sending to AI for evaluation:', {
      answerType: answerType,
      textLength: finalAnswer.length,
      isTranscription: answerType === 'voice' && transcription ? true : false
    });
    
    // Evaluate answer using AI (transcription text for voice answers, regular text for text answers)
    const evaluation = await evaluateAnswer(question, finalAnswer, interview.overallEvaluationCriteria);
    console.log('🤖 [SUBMIT ANSWER] AI evaluation completed:', {
      score: evaluation.score,
      feedbackLength: evaluation.feedback?.length || 0,
      evaluationType: answerType === 'voice' ? 'Transcription-based evaluation' : 'Text-based evaluation'
    });

    // Add candidate answer
    const candidateAnswer = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      questionId,
      question,
      answer: finalAnswer,
      timeTaken,
      answerType,
      audioData: answerType === 'voice' ? audioData : undefined,
      transcription: answerType === 'voice' ? transcription : undefined,
      aiEvaluation: evaluation,
      timestamp: new Date()
    };

    console.log('💾 [SUBMIT ANSWER] Saving answer to database...');
    interview.candidateAnswers.push(candidateAnswer);
    interview.updateStatistics();
    await interview.save();

    console.log('✅ [SUBMIT ANSWER] Answer saved successfully');
    console.log('📊 [SUBMIT ANSWER] Updated statistics:', {
      totalCandidates: interview.statistics.totalCandidates,
      completedInterviews: interview.statistics.completedInterviews,
      averageScore: interview.statistics.averageScore
    });

    // Find next question in the same round or next round
    const nextQuestion = getNextQuestionInSequence(interview, candidateId, roundId, questionId);

    res.json({
      success: true,
      data: {
        answerId: candidateAnswer._id,
        evaluation: evaluation,
        nextQuestion: nextQuestion,
        roundComplete: !nextQuestion || nextQuestion.roundId !== roundId,
        interviewComplete: !nextQuestion
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
});

// Get interview statistics (for recruiters)
router.get('/:interviewId/stats', auth, async (req, res) => {
  console.log('📊 [GET STATS] Fetching statistics for interview:', req.params.interviewId);
  console.log('👤 [GET STATS] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [GET STATS] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [GET STATS] Interview found, generating statistics...');
    // Get candidate summaries
    const candidateSummaries = getCandidateSummaries(interview.candidateAnswers);
    console.log('📈 [GET STATS] Generated summaries for', candidateSummaries.length, 'candidates');

    const responseData = {
      success: true,
      data: {
        statistics: interview.statistics,
        candidateSummaries,
        totalAnswers: interview.candidateAnswers.length,
        rounds: interview.rounds.map(round => ({
          roundId: round.roundId,
          title: round.title,
          questionCount: round.questions.length
        }))
      }
    };

    console.log('📊 [GET STATS] Statistics generated:', {
      totalCandidates: interview.statistics.totalCandidates,
      completedInterviews: interview.statistics.completedInterviews,
      averageScore: interview.statistics.averageScore,
      candidateSummaries: candidateSummaries.length
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ [GET STATS] Error occurred:', error.message);
    console.error('🔍 [GET STATS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get interview statistics'
    });
  }
});

// Get all interviews for recruiter
router.get('/', auth, async (req, res) => {
  console.log('📋 [GET ALL INTERVIEWS] Fetching interviews for user:', req.user.id);
  
  try {
    const interviews = await Interview.find({ createdBy: req.user.id })
      .select('interviewId title jobTitle totalDuration statistics createdAt status')
      .sort({ createdAt: -1 });

    const frontendBase = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host').replace(/:\\d+$/, ':3000')}` || 'http://localhost:3000';
    const withLinks = interviews.map(i => ({
      interviewId: i.interviewId,
      title: i.title,
      jobTitle: i.jobTitle,
      totalDuration: i.totalDuration,
      statistics: i.statistics,
      createdAt: i.createdAt,
      status: i.status,
      link: `${frontendBase.replace(/\/$/, '')}/interview/${i.interviewId}`
    }));

    console.log('✅ [GET ALL INTERVIEWS] Found', withLinks.length, 'interviews');

    res.json({
      success: true,
      data: withLinks
    });

  } catch (error) {
    console.error('❌ [GET ALL INTERVIEWS] Error occurred:', error.message);
    console.error('🔍 [GET ALL INTERVIEWS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get interviews'
    });
  }
});

// Get candidate answers for an interview (optionally filter by candidateId)
router.get('/:interviewId/answers', auth, async (req, res) => {
  console.log('🧾 [GET ANSWERS] Fetching answers for interview:', req.params.interviewId);
  const { candidateId } = req.query;

  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [GET ANSWERS] Interview not found or access denied');
      return res.status(404).json({ success: false, error: 'Interview not found or access denied' });
    }

    let answers = interview.candidateAnswers || [];
    if (candidateId) {
      answers = answers.filter(a => a.candidateId === candidateId);
    }

    // Map question metadata for convenience
    const questionIndex = new Map();
    for (const round of interview.rounds || []) {
      for (const q of round.questions || []) {
        questionIndex.set(q.id, { roundId: round.roundId, roundTitle: round.title, questionText: q.question, type: q.type });
      }
    }

    const detailedAnswers = answers.map(a => ({
      candidateId: a.candidateId,
      candidateName: a.candidateName,
      candidateEmail: a.candidateEmail,
      roundId: a.roundId,
      roundTitle: questionIndex.get(a.questionId)?.roundTitle || null,
      questionId: a.questionId,
      question: a.question || questionIndex.get(a.questionId)?.questionText || null,
      type: questionIndex.get(a.questionId)?.type || null,
      answer: a.answer,
      timeTaken: a.timeTaken,
      timestamp: a.timestamp,
      aiEvaluation: a.aiEvaluation
    }));

    res.json({ success: true, data: detailedAnswers });

  } catch (error) {
    console.error('❌ [GET ANSWERS] Error occurred:', error.message);
    console.error('🔍 [GET ANSWERS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    res.status(500).json({ success: false, error: 'Failed to get answers' });
  }
});

// Delete an interview
router.delete('/:interviewId', auth, async (req, res) => {
  console.log('🗑️ [DELETE INTERVIEW] Requested for:', req.params.interviewId, 'by', req.user.id);
  try {
    const deleted = await Interview.findOneAndDelete({ interviewId: req.params.interviewId, createdBy: req.user.id });
    if (!deleted) {
      console.log('❌ [DELETE INTERVIEW] Not found or no access');
      return res.status(404).json({ success: false, error: 'Interview not found or access denied' });
    }
    console.log('✅ [DELETE INTERVIEW] Deleted:', deleted.interviewId);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ [DELETE INTERVIEW] Error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to delete interview' });
  }
});

// Complete round and get evaluation
router.post('/:interviewId/round/:roundId/complete', async (req, res) => {
  console.log('🏁 [COMPLETE ROUND] Completing round:', req.params.roundId);
  
  try {
    const { candidateEmail, candidateName, performanceData } = req.body;
    
    if (!candidateEmail || !candidateName) {
      return res.status(400).json({ 
        success: false, 
        error: 'candidateEmail and candidateName are required' 
      });
    }

    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId, 
      status: 'active' 
    });
    
    if (!interview) {
      return res.status(404).json({ 
        success: false, 
        error: 'Interview not found or inactive' 
      });
    }

    // Find the specific round
    const round = interview.rounds.find(r => r.roundId === req.params.roundId);
    if (!round) {
      return res.status(404).json({ 
        success: false, 
        error: 'Round not found' 
      });
    }

    // Get all answers for this round from the interview document
    const candidateAnswers = interview.candidateAnswers.filter(answer => 
      answer.candidateEmail === candidateEmail && 
      answer.roundId === req.params.roundId
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (candidateAnswers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No answers found for this round' 
      });
    }

    // Evaluate round answers using AI with performance data
    console.log('🤖 [COMPLETE ROUND] Calling AI for comprehensive round evaluation...');
    const evaluation = await evaluateRoundAnswers(round, candidateAnswers, interview.overallEvaluationCriteria, performanceData);

    console.log('✅ [COMPLETE ROUND] AI round evaluation completed for:', req.params.roundId);
    console.log('📊 [COMPLETE ROUND] Evaluation summary:', {
      overallScore: evaluation.overallScore,
      recommendation: evaluation.recommendation,
      strengthsCount: evaluation.strengths?.length || 0,
      improvementsCount: evaluation.areasForImprovement?.length || 0
    });
    
    return res.json({ 
      success: true, 
      data: { 
        evaluation,
        roundId: req.params.roundId,
        roundTitle: round.title,
        totalQuestions: round.questions.length,
        answeredQuestions: candidateAnswers.length
      } 
    });

  } catch (error) {
    console.error('❌ [COMPLETE ROUND] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to complete round evaluation' 
    });
  }
});

// Helper function to create structured interview from text
function createStructuredInterview(textResponse, jobDetails) {
  const interviewId = `interview_${Date.now()}`;
  
  // Generate 5 comprehensive rounds based on job details
  const rounds = [
    {
      roundId: "round_1",
      roundNumber: 1,
      title: "Technical Fundamentals",
      description: "Evaluate technical skills and problem-solving abilities",
      duration: 15,
      questions: [
        {
          id: "q1_1",
          type: "technical",
          question: `What are the key technical skills and technologies required for a ${jobDetails.title} position?`,
          expectedAnswer: "Look for relevant technical knowledge and current industry practices",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["Can you walk me through your experience with these technologies?", "How do you stay current with industry developments?"]
        },
        {
          id: "q1_2",
          type: "technical",
          question: `Describe a challenging technical problem you've solved in your previous role.`,
          expectedAnswer: "Assess problem-solving approach and technical depth",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["What alternative approaches did you consider?", "How would you optimize this solution?"]
        }
      ],
      evaluationCriteria: {
        technical: "Technical knowledge depth and application",
        problemSolving: "Analytical thinking and solution design"
      }
    },
    {
      roundId: "round_2",
      roundNumber: 2,
      title: "Role-Specific Experience",
      description: "Assess relevant experience and practical application",
      duration: 15,
      questions: [
        {
          id: "q2_1",
          type: "experience",
          question: `Tell me about your experience with the main responsibilities of a ${jobDetails.title}.`,
          expectedAnswer: "Evaluate relevant experience and practical knowledge",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["What was your biggest achievement in this area?", "What challenges did you face?"]
        },
        {
          id: "q2_2",
          type: "scenario",
          question: `How would you approach a project where you need to ${jobDetails.level === 'senior' || jobDetails.level === 'lead' ? 'lead a team and' : ''} deliver results under tight deadlines?`,
          expectedAnswer: "Look for project management skills and prioritization",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How do you handle scope changes?", "How do you communicate progress to stakeholders?"]
        }
      ],
      evaluationCriteria: {
        experience: "Depth and relevance of past experience",
        application: "Ability to apply knowledge to real scenarios"
      }
    },
    {
      roundId: "round_3",
      roundNumber: 3,
      title: "Problem-Solving & Critical Thinking",
      description: "Test analytical and problem-solving capabilities",
      duration: 15,
      questions: [
        {
          id: "q3_1",
          type: "problem-solving",
          question: `A ${jobDetails.title} project is behind schedule and stakeholders are concerned. Walk me through your approach to get it back on track.`,
          expectedAnswer: "Assess systematic problem-solving and stakeholder management",
          timeLimit: 6,
          difficulty: "hard",
          followUpQuestions: ["How would you prevent this in future projects?", "How do you balance quality vs. timeline?"]
        },
        {
          id: "q3_2",
          type: "critical-thinking",
          question: `If you had to make a recommendation between two competing technical solutions, how would you evaluate and present your decision?`,
          expectedAnswer: "Look for structured decision-making and communication skills",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["What factors would be most important?", "How would you handle disagreement from team members?"]
        }
      ],
      evaluationCriteria: {
        analysis: "Systematic approach to problem analysis",
        decision: "Quality of decision-making process"
      }
    },
    {
      roundId: "round_4",
      roundNumber: 4,
      title: "Team Collaboration & Leadership",
      description: "Evaluate teamwork and leadership potential",
      duration: 12,
      questions: [
        {
          id: "q4_1",
          type: "teamwork",
          question: `Describe a time when you had to work with a difficult team member or stakeholder. How did you handle it?`,
          expectedAnswer: "Assess interpersonal skills and conflict resolution",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["What would you do differently?", "How do you build trust with team members?"]
        },
        {
          id: "q4_2",
          type: "leadership",
          question: jobDetails.level === 'senior' || jobDetails.level === 'lead' 
            ? `How do you mentor junior team members and help them grow in their careers?`
            : `How do you contribute to team success and support your colleagues?`,
          expectedAnswer: jobDetails.level === 'senior' || jobDetails.level === 'lead'
            ? "Look for mentoring and development skills"
            : "Assess collaboration and team contribution",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["Can you give a specific example?", "What's your approach to giving feedback?"]
        }
      ],
      evaluationCriteria: {
        collaboration: "Ability to work effectively with others",
        leadership: "Leadership potential and influence"
      }
    },
    {
      roundId: "round_5",
      roundNumber: 5,
      title: "Cultural Fit & Industry Knowledge",
      description: "Assess cultural alignment and industry awareness",
      duration: 13,
      questions: [
        {
          id: "q5_1",
          type: "industry",
          question: `What trends do you see shaping the ${jobDetails.title.includes('Developer') || jobDetails.title.includes('Engineer') ? 'technology' : 'industry'} landscape, and how do you stay informed?`,
          expectedAnswer: "Evaluate industry awareness and continuous learning",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How do these trends affect your work?", "What resources do you use to stay updated?"]
        },
        {
          id: "q5_2",
          type: "motivation",
          question: `Why are you interested in this ${jobDetails.title} position, and what are your career goals for the next few years?`,
          expectedAnswer: "Assess motivation, cultural fit, and long-term potential",
          timeLimit: 4,
          difficulty: "easy",
          followUpQuestions: ["What excites you most about this role?", "How does this position align with your career plans?"]
        },
        {
          id: "q5_3",
          type: "culture",
          question: `How do you prefer to receive feedback, and how do you handle constructive criticism?`,
          expectedAnswer: "Evaluate growth mindset and cultural adaptability",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["Can you give an example of how feedback helped you improve?", "What's your approach to self-improvement?"]
        }
      ],
      evaluationCriteria: {
        industry: "Knowledge of industry trends and continuous learning",
        culture: "Alignment with company values and growth mindset"
      }
    }
  ];

  return {
    interviewId,
    title: `AI Multi-Round Interview - ${jobDetails.title}`,
    totalDuration: jobDetails.duration || 60,
    rounds: rounds,
    overallEvaluationCriteria: {
      technical: "Overall technical competency and problem-solving skills",
      communication: "Clarity of communication and articulation abilities",
      experience: "Relevance and depth of professional experience",
      teamwork: "Collaboration skills and team contribution",
      leadership: "Leadership potential and influence capabilities",
      growth: "Learning mindset and adaptability to change",
      culture: "Alignment with company values and cultural fit"
    },
    scoringSystem: {
      excellent: "4",
      good: "3",
      satisfactory: "2",
      needsImprovement: "1"
    }
  };
}

// Ensure exactly five rounds by duplicating/adapting the first round if needed
function ensureFiveRounds(interviewData, jobDetails) {
  const data = interviewData || {};
  data.rounds = Array.isArray(data.rounds) ? data.rounds : [];
  if (data.rounds.length >= 5) {
    // If more than 5 rounds, trim to exactly 5
    data.rounds = data.rounds.slice(0, 5);
    return data;
  }

  const base = data.rounds[0] || {
    roundId: 'round_1',
    roundNumber: 1,
    title: 'Technical Fundamentals',
    description: 'Evaluate fundamentals',
    duration: 10,
    questions: [
      { id: 'q1_1', type: 'conceptual', question: `What are key concepts for ${jobDetails.title}?`, expectedAnswer: 'Core concepts', timeLimit: 3, difficulty: 'easy', followUpQuestions: [] }
    ],
    evaluationCriteria: { technical: 'Concept understanding' }
  };

  while (data.rounds.length < 5) {
    const idx = data.rounds.length + 1;
    data.rounds.push({
      ...base,
      roundId: `round_${idx}`,
      roundNumber: idx,
      title: base.title + ` (${idx})`,
      questions: (base.questions || []).map((q, i) => ({
        ...q,
        id: `q${idx}_${i + 1}`
      }))
    });
  }

  // Normalize roundNumber sequence
  data.rounds = data.rounds.map((r, i) => ({ ...r, roundNumber: i + 1, roundId: `round_${i + 1}` }));
  return data;
}

// Compute next unanswered question for a candidate
function getNextQuestion(interview, candidateId) {
  const answered = new Set(
    (interview.candidateAnswers || [])
      .filter(a => a.candidateId === candidateId)
      .map(a => a.questionId)
  );
  for (const round of interview.rounds || []) {
    for (const q of round.questions || []) {
      if (!answered.has(q.id)) {
        return {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          roundTitle: round.title,
          questionId: q.id,
          type: q.type,
          question: q.question,
          timeLimit: q.timeLimit,
          difficulty: q.difficulty
        };
      }
    }
  }
  return null;
}

// Get next question in sequence after current question
function getNextQuestionInSequence(interview, candidateId, currentRoundId, currentQuestionId) {
  const answered = new Set(
    (interview.candidateAnswers || [])
      .filter(a => a.candidateId === candidateId)
      .map(a => a.questionId)
  );
  
  // Find current round
  const currentRoundIndex = interview.rounds.findIndex(r => r.roundId === currentRoundId);
  if (currentRoundIndex === -1) return null;
  
  const currentRound = interview.rounds[currentRoundIndex];
  
  // Find current question index in the round
  const currentQuestionIndex = currentRound.questions.findIndex(q => q.id === currentQuestionId);
  if (currentQuestionIndex === -1) return null;
  
  // Check for next question in same round
  for (let i = currentQuestionIndex + 1; i < currentRound.questions.length; i++) {
    const q = currentRound.questions[i];
    if (!answered.has(q.id)) {
      return {
        roundId: currentRound.roundId,
        roundNumber: currentRound.roundNumber,
        roundTitle: currentRound.title,
        questionId: q.id,
        type: q.type,
        question: q.question,
        timeLimit: q.timeLimit,
        difficulty: q.difficulty,
        questionNumber: i + 1,
        totalQuestions: currentRound.questions.length
      };
    }
  }
  
  // If no more questions in current round, check next rounds
  for (let roundIndex = currentRoundIndex + 1; roundIndex < interview.rounds.length; roundIndex++) {
    const round = interview.rounds[roundIndex];
    for (let questionIndex = 0; questionIndex < round.questions.length; questionIndex++) {
      const q = round.questions[questionIndex];
      if (!answered.has(q.id)) {
        return {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          roundTitle: round.title,
          questionId: q.id,
          type: q.type,
          question: q.question,
          timeLimit: q.timeLimit,
          difficulty: q.difficulty,
          questionNumber: questionIndex + 1,
          totalQuestions: round.questions.length,
          newRound: true
        };
      }
    }
  }
  
  return null; // No more questions
}

// Compute progress for a candidate
function getProgress(interview, candidateId) {
  const total = (interview.rounds || []).reduce((acc, r) => acc + (r.questions?.length || 0), 0);
  const answered = (interview.candidateAnswers || []).filter(a => a.candidateId === candidateId).length;
  return { answered, total, completed: answered >= total };
}

// Helper function to evaluate answer using AI
async function evaluateAnswer(question, answer, criteria) {
  console.log('🤖 [EVALUATE ANSWER] Starting AI evaluation...');
  console.log('❓ [EVALUATE ANSWER] Question length:', question.length);
  console.log('💬 [EVALUATE ANSWER] Answer length:', answer.length);
  console.log('📝 [EVALUATE ANSWER] Answer type: Text-based evaluation (transcription or typed text)');
  
  // Check if we have the required API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ [EVALUATE ANSWER] Missing OPENROUTER_API_KEY');
    return createFallbackEvaluation(question, answer);
  }

  try {
    const prompt = `You are a strict, experienced technical interviewer with high standards. Evaluate this candidate's answer critically and provide honest, tough feedback.

QUESTION: ${question}

ANSWER: ${answer}

EVALUATION CRITERIA: ${JSON.stringify(criteria, null, 2)}

INSTRUCTIONS:
1. Be CRITICAL and HONEST - do not inflate scores
2. If the answer is vague, incomplete, or shows lack of knowledge, score it LOW
3. "No idea" or similar responses should get score 1 (Poor)
4. Only give high scores for genuinely good, detailed, technical answers
5. Provide SPECIFIC, CONSTRUCTIVE, and OBJECTIVE feedback following these guidelines:
   - Focus on specific behaviors or responses observed
   - Provide actionable suggestions for improvement
   - Base feedback on observable facts, not personal opinions
   - Evaluate: Communication skills, Problem-solving approach, Relevance of experience, Attitude and enthusiasm
6. Score from 1-4 (1=Poor, 2=Fair, 3=Good, 4=Excellent)

SCORING GUIDELINES:
- Score 1: "No idea", completely wrong, or no attempt at all
- Score 2: Basic understanding with some technical terms mentioned, but lacks depth or examples
- Score 3: Good technical knowledge with specific examples and clear explanation
- Score 4: Excellent technical depth, detailed examples, and problem-solving approach

IMPORTANT: If the answer mentions technical terms (programming languages, frameworks, databases, etc.) or provides examples, it should get at least score 2, not score 1.

RESPOND WITH VALID JSON ONLY (no markdown, no extra text):
{
  "score": 2,
  "feedback": "You mentioned technical terms like 'programming languages' and 'frameworks', which shows basic awareness. However, your explanation lacked specific examples and depth. Consider elaborating on your thought process with concrete examples from your experience.",
  "strengths": ["Only list if there are genuine strengths - be specific"],
  "improvements": ["Specific, actionable suggestions for improvement - focus on observable behaviors"]
}`;

    console.log('🤖 [EVALUATE ANSWER] Calling AI for evaluation...');
    console.log('🔑 [EVALUATE ANSWER] API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('🌐 [EVALUATE ANSWER] API URL:', OPENROUTER_API_URL);
    console.log('📝 [EVALUATE ANSWER] Question preview:', question.substring(0, 100) + '...');
    console.log('💬 [EVALUATE ANSWER] Answer preview:', answer.substring(0, 100) + '...');
    
    // Try multiple models in order of preference
    const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'];
    let aiResponse = null;
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        console.log('🎯 [EVALUATE ANSWER] Trying model:', model);
        
        aiResponse = await axios.post(OPENROUTER_API_URL, {
          model: model,
       messages: [
         {
           role: 'system',
              content: 'You are a strict, experienced technical interviewer with very high standards. Be critical and honest - do not inflate scores. Always respond with valid JSON only. No markdown, no explanations, just the JSON object.'
         },
         {
           role: 'user',
           content: prompt
         }
       ],
          max_tokens: 800,
          temperature: 0.2
     }, {
       headers: {
         'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
         'Content-Type': 'application/json',
         'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
         'X-Title': 'AI Hiring Platform'
          },
          timeout: 30000 // 30 second timeout
        });
        
        console.log('✅ [EVALUATE ANSWER] Success with model:', model);
        break; // Success, exit the loop
        
      } catch (error) {
        console.log('❌ [EVALUATE ANSWER] Failed with model:', model, error.response?.status || error.message);
        lastError = error;
        continue; // Try next model
      }
    }
    
    if (!aiResponse) {
      throw lastError || new Error('All models failed');
    }

    console.log('✅ [EVALUATE ANSWER] AI response received, status:', aiResponse.status);
    
    if (!aiResponse.data || !aiResponse.data.choices || !aiResponse.data.choices[0]) {
      throw new Error('Invalid AI response structure');
    }

    const rawContent = aiResponse.data.choices[0].message.content;
    console.log('📝 [EVALUATE ANSWER] Raw AI response length:', rawContent.length);
    console.log('📝 [EVALUATE ANSWER] Raw AI response preview:', rawContent.substring(0, 200) + '...');
    
    // Clean the response - remove markdown if present
    let cleanContent = rawContent.trim();
    
    // Remove markdown code blocks
    if (cleanContent.includes('```')) {
      const jsonMatch = cleanContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanContent = jsonMatch[1];
      }
    }
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log('🧹 [EVALUATE ANSWER] Cleaned content length:', cleanContent.length);
    
    const evaluation = JSON.parse(cleanContent);
    
    // Validate the evaluation structure
    if (!evaluation.score || !evaluation.feedback) {
      throw new Error('Invalid evaluation structure from AI');
    }
    
    // Ensure score is within valid range
    evaluation.score = Math.max(1, Math.min(4, parseInt(evaluation.score)));
    
    // Ensure arrays exist
    evaluation.strengths = evaluation.strengths || [];
    evaluation.improvements = evaluation.improvements || [];
    
    console.log('📊 [EVALUATE ANSWER] AI Evaluation successful:', {
      score: evaluation.score,
      feedbackLength: evaluation.feedback?.length || 0,
      strengthsCount: evaluation.strengths?.length || 0,
      improvementsCount: evaluation.improvements?.length || 0,
      source: 'AI_EVALUATION'
    });
    
    return evaluation;

  } catch (error) {
    console.error('❌ [EVALUATE ANSWER] Error occurred:', error.message);
    console.error('🔍 [EVALUATE ANSWER] Error details:', {
      name: error.name,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return createFallbackEvaluation(question, answer);
  }
}

// Helper function to create fallback evaluation
function createFallbackEvaluation(question, answer) {
  console.log('⚠️ [EVALUATE ANSWER] Creating FALLBACK evaluation (AI failed)');
  
  // Critical analysis based on answer length and content
  const answerLength = answer.length;
  const answerLower = answer.toLowerCase();
  let score = 1; // Default to poor - be strict
  let feedback = "The answer was received and recorded. ";
  const strengths = [];
  const improvements = [];
  
  // Check for poor responses
  if (answerLower.includes('no idea') || answerLower.includes('dont know') || answerLower.includes("don't know") || answerLength < 10) {
    score = 1;
    feedback += "Your response indicates a lack of knowledge or preparation. Communication was unclear and no specific examples were provided. ";
    improvements.push("Demonstrate concrete knowledge with specific examples from your experience");
    improvements.push("Prepare thoroughly before interviews and practice articulating your thoughts clearly");
  } else if (answerLength < 50) {
    score = 1;
    feedback += "Your answer was extremely brief and lacks substance. No specific examples or technical details were provided. ";
    improvements.push("Provide more detailed and comprehensive responses with concrete examples");
    improvements.push("Elaborate on your thought process and demonstrate problem-solving approach");
  } else if (answerLength < 100) {
    score = 2;
    feedback += "You provided a basic response but it lacks depth and specific examples. ";
    improvements.push("Include more technical details and concrete examples from your experience");
    improvements.push("Show your analytical thinking and problem-solving approach");
  } else {
    score = 3;
    feedback += "You provided a detailed response with good length. ";
    strengths.push("Provided comprehensive answer with adequate detail");
  }
  
  // Check for technical content
  if (answerLower.includes('example') || answerLower.includes('experience') || answerLower.includes('project')) {
    score = Math.min(4, score + 1);
    feedback += "Your response included relevant examples or experience, which demonstrates practical knowledge. ";
    strengths.push("Included relevant examples from experience");
  } else {
    improvements.push("Include specific examples and real-world experience to strengthen your response");
  }
  
  // Additional critical feedback
  if (answerLength < 30) {
    improvements.push("Provide much more detailed explanations with concrete examples");
    improvements.push("Demonstrate technical knowledge with specific examples from your experience");
  }
  
  feedback += "Focus on improving your technical knowledge and interview preparation to better articulate your expertise.";
    
    const fallbackResult = {
    score,
    feedback,
    strengths: strengths.length > 0 ? strengths : ["Answered the question"],
    improvements: improvements.length > 0 ? improvements : ["Consider providing more detail"]
  };
  
  console.log('📊 [EVALUATE ANSWER] Fallback evaluation created:', {
    score: fallbackResult.score,
    feedbackLength: fallbackResult.feedback?.length || 0,
    source: 'FALLBACK_EVALUATION'
  });
  
  return fallbackResult;
}

// Helper function to evaluate round answers using AI with performance data
async function evaluateRoundAnswers(round, candidateAnswers, criteria, performanceData = null) {
  console.log('🤖 [EVALUATE ROUND] Starting round evaluation...');
  console.log('🎭 [EVALUATE ROUND] Round:', round.title);
  console.log('📝 [EVALUATE ROUND] Answers count:', candidateAnswers.length);
  
  // Check if we have the required API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ [EVALUATE ROUND] Missing OPENROUTER_API_KEY');
    return createFallbackRoundEvaluation(round, candidateAnswers);
  }
  
  try {
    // Prepare round data for AI evaluation
    const roundData = {
      roundTitle: round.title,
      roundDescription: round.description,
      questions: round.questions.map(q => ({
        question: q.question,
        timeLimit: q.timeLimit
      })),
      answers: candidateAnswers.map(answer => ({
        question: answer.question,
        answer: answer.answer,
        timeSpent: answer.timeSpent
      }))
    };

    // Prepare performance data for AI analysis
    let performanceAnalysis = '';
    if (performanceData) {
      const avgResponseTime = performanceData.communicationMetrics?.responseTimes?.length > 0 
        ? performanceData.communicationMetrics.responseTimes.reduce((a, b) => a + b, 0) / performanceData.communicationMetrics.responseTimes.length 
        : 0;
      const avgConfidence = performanceData.communicationMetrics?.confidenceScores?.length > 0 
        ? performanceData.communicationMetrics.confidenceScores.reduce((a, b) => a + b, 0) / performanceData.communicationMetrics.confidenceScores.length 
        : 0;
      const avgAnswerQuality = performanceData.answerQuality?.length > 0 
        ? performanceData.answerQuality.reduce((a, b) => a + b.quality, 0) / performanceData.answerQuality.length 
        : 0;
      const engagementExpressions = performanceData.facialExpressions?.filter(exp => exp.expression === 'engaged').length || 0;
      const totalExpressions = performanceData.facialExpressions?.length || 1;
      const engagementRate = (engagementExpressions / totalExpressions) * 100;

      performanceAnalysis = `
PERFORMANCE METRICS (Real-time Analysis):
- Average Response Time: ${Math.round(avgResponseTime)} seconds
- Average Confidence Score: ${Math.round(avgConfidence)}%
- Average Answer Quality: ${Math.round(avgAnswerQuality)}%
- Engagement Rate: ${Math.round(engagementRate)}%
- Facial Expression Analysis: ${performanceData.facialExpressions?.map(exp => exp.expression).join(', ') || 'Not available'}
- Overall Engagement Level: ${performanceData.overallEngagement || 'Not measured'}

COMMUNICATION ANALYSIS:
- Response Times: ${performanceData.communicationMetrics?.responseTimes?.join(', ') || 'Not tracked'}
- Confidence Scores: ${performanceData.communicationMetrics?.confidenceScores?.join(', ') || 'Not tracked'}
- Answer Quality Scores: ${performanceData.answerQuality?.map(aq => aq.quality).join(', ') || 'Not tracked'}
`;
    }

    const evaluationPrompt = `You are a strict, experienced HR professional and technical interviewer with very high standards. Evaluate this candidate's performance critically and provide honest, tough feedback.

ROUND DETAILS:
- Title: ${round.title}
- Description: ${round.description}
- Total Questions: ${round.questions.length}
- Questions Answered: ${candidateAnswers.length}

QUESTIONS AND ANSWERS:
${roundData.answers.map((item, index) => `
Question ${index + 1}: ${item.question}
Answer: ${item.answer}
Time Spent: ${item.timeSpent || 'Not recorded'}
`).join('\n')}

${performanceAnalysis}

EVALUATION CRITERIA:
${JSON.stringify(criteria, null, 2)}

INSTRUCTIONS:
1. Be CRITICAL and HONEST - do not inflate scores
2. If answers are vague, incomplete, or show lack of knowledge, score LOW
3. "No idea" or similar responses indicate poor performance
4. Only give high scores for genuinely excellent, detailed, technical answers
5. Provide SPECIFIC, CONSTRUCTIVE, and OBJECTIVE feedback following these guidelines:
   - Focus on specific behaviors or responses observed
   - Provide actionable suggestions for improvement
   - Base feedback on observable facts, not personal opinions
   - Evaluate: Communication skills, Problem-solving approach, Relevance of experience, Attitude and enthusiasm
6. Score from 0-100 (overall score) - be strict with scoring

SCORING GUIDELINES:
- 0-30: Poor performance, "no idea" responses, major knowledge gaps
- 31-50: Below average, basic technical terms mentioned but lacks depth
- 51-70: Average performance, some understanding with examples but missing key elements
- 71-85: Good performance, solid technical knowledge with specific examples
- 86-100: Excellent performance, outstanding technical depth and problem-solving

IMPORTANT: If answers mention technical terms (programming languages, frameworks, databases, etc.) or provide examples, the overall score should be at least 31-50, not 0-30.

IMPORTANT: Only provide individual scores for questions that were actually answered by the candidate. Do not create scores for unanswered questions.

RESPOND WITH VALID JSON ONLY (no markdown, no extra text):
{
  "overallScore": 40,
  "feedback": "The candidate demonstrated basic awareness of technical concepts by mentioning programming languages and frameworks. However, responses lacked specific examples and depth. Communication was unclear at times, and problem-solving approach needs improvement. Focus on providing concrete examples from experience and elaborating on your thought process.",
  "strengths": ["Only list if there are genuine strengths - be specific and observable"],
  "areasForImprovement": ["Specific, actionable suggestions - focus on observable behaviors and provide clear guidance"],
  "recommendation": "Needs significant improvement" or "Proceed to next round" or "Strong candidate",
  "individualScores": [40, 45]
}`;

    console.log('🚀 [EVALUATE ROUND] Sending request to AI...');
    console.log('🔑 [EVALUATE ROUND] API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('🌐 [EVALUATE ROUND] API URL:', OPENROUTER_API_URL);
    
    // Try multiple models in order of preference
    const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'];
    let aiResponse = null;
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        console.log('🎯 [EVALUATE ROUND] Trying model:', model);
        
        aiResponse = await axios.post(OPENROUTER_API_URL, {
          model: model,
      messages: [
        {
          role: 'system',
              content: 'You are a strict, experienced HR professional and technical interviewer with very high standards. Be critical and honest - do not inflate scores. Always respond with valid JSON only. No markdown, no explanations, just the JSON object.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
          max_tokens: 1200,
          temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'AI Hiring Platform'
          },
          timeout: 30000 // 30 second timeout
        });
        
        console.log('✅ [EVALUATE ROUND] Success with model:', model);
        break; // Success, exit the loop
        
      } catch (error) {
        console.log('❌ [EVALUATE ROUND] Failed with model:', model, error.response?.status || error.message);
        lastError = error;
        continue; // Try next model
      }
    }
    
    if (!aiResponse) {
      throw lastError || new Error('All models failed');
    }

    console.log('✅ [EVALUATE ROUND] AI response received, status:', aiResponse.status);
    
    if (!aiResponse.data || !aiResponse.data.choices || !aiResponse.data.choices[0]) {
      throw new Error('Invalid AI response structure');
    }

    const rawContent = aiResponse.data.choices[0].message.content;
    console.log('📝 [EVALUATE ROUND] Raw AI response length:', rawContent.length);
    console.log('📝 [EVALUATE ROUND] Raw AI response preview:', rawContent.substring(0, 200) + '...');
    
    // Clean the response - remove markdown if present
    let cleanContent = rawContent.trim();
    
    // Remove markdown code blocks
    if (cleanContent.includes('```')) {
      const jsonMatch = cleanContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanContent = jsonMatch[1];
      }
    }
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log('🧹 [EVALUATE ROUND] Cleaned content length:', cleanContent.length);
    
    const evaluation = JSON.parse(cleanContent);
    
    // Validate the evaluation structure
    if (!evaluation.overallScore || !evaluation.feedback) {
      throw new Error('Invalid evaluation structure from AI');
    }
    
    // Ensure score is within valid range
    evaluation.overallScore = Math.max(0, Math.min(100, parseInt(evaluation.overallScore)));
    
    // Ensure arrays exist
    evaluation.strengths = evaluation.strengths || [];
    evaluation.areasForImprovement = evaluation.areasForImprovement || [];
    
    // Fix individual scores - only show scores for questions that were actually answered
    const uniqueQuestionIds = [...new Set(candidateAnswers.map(answer => answer.questionId))];
    evaluation.individualScores = uniqueQuestionIds.map((questionId, index) => {
      // Get the AI evaluation score for this question if available
      const questionAnswers = candidateAnswers.filter(answer => answer.questionId === questionId);
      const latestAnswer = questionAnswers[questionAnswers.length - 1]; // Get the latest answer
      return latestAnswer?.aiEvaluation?.score ? latestAnswer.aiEvaluation.score * 25 : Math.round(evaluation.overallScore); // Convert 1-4 scale to 0-100
    });
    
    console.log('📊 [EVALUATE ROUND] Evaluation successful:', {
      overallScore: evaluation.overallScore,
      feedbackLength: evaluation.feedback?.length || 0,
      strengthsCount: evaluation.strengths?.length || 0,
      improvementsCount: evaluation.areasForImprovement?.length || 0
    });
    
    return evaluation;

  } catch (error) {
    console.error('❌ [EVALUATE ROUND] Error occurred:', error.message);
    console.error('🔍 [EVALUATE ROUND] Error details:', {
      name: error.name,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return createFallbackRoundEvaluation(round, candidateAnswers);
  }
}

// Helper function to create fallback round evaluation
function createFallbackRoundEvaluation(round, candidateAnswers) {
  console.log('⚠️ [EVALUATE ROUND] Creating fallback round evaluation');
  
  // Calculate basic metrics
  const totalAnswers = candidateAnswers.length;
  const totalQuestions = round.questions.length;
  const completionRate = (totalAnswers / totalQuestions) * 100;
  
  // Critical scoring based on completion and answer quality
  let overallScore = 20; // Start low - be strict
  const strengths = [];
  const improvements = [];
  
  // Check for poor responses like "no idea"
  const hasPoorResponses = candidateAnswers.some(answer => 
    answer.answer?.toLowerCase().includes('no idea') || 
    answer.answer?.toLowerCase().includes('dont know') ||
    answer.answer?.toLowerCase().includes("don't know")
  );
  
  if (hasPoorResponses) {
    overallScore = 15; // Very low score for "no idea" responses
    improvements.push("Demonstrate concrete knowledge with specific examples from your experience");
    improvements.push("Prepare thoroughly before interviews and practice articulating your thoughts clearly");
  }
  
  if (completionRate >= 100) {
    overallScore = Math.min(overallScore + 20, 40); // Still keep it low even if completed
    strengths.push("Completed all questions in the round");
  } else if (completionRate >= 75) {
    overallScore = Math.min(overallScore + 15, 35);
    strengths.push("Completed most questions in the round");
  } else {
    overallScore = Math.min(overallScore + 5, 25);
    improvements.push("Complete all questions in future rounds");
  }
  
  // Analyze answer quality based on length - be critical
  const avgAnswerLength = candidateAnswers.reduce((sum, answer) => sum + (answer.answer?.length || 0), 0) / totalAnswers;
  
  if (avgAnswerLength > 100) {
    overallScore = Math.min(overallScore + 15, 60); // Still not too high
    strengths.push("Provided detailed responses");
  } else if (avgAnswerLength < 50) {
    overallScore = Math.max(overallScore - 10, 10); // Penalize short answers
    improvements.push("Provide much more detailed and comprehensive responses with concrete examples");
    improvements.push("Elaborate on your thought process and demonstrate problem-solving approach");
  } else {
    improvements.push("Include more technical details and concrete examples from your experience");
    improvements.push("Show your analytical thinking and problem-solving approach");
  }
  
  // Check for examples or experience in answers
  const hasExamples = candidateAnswers.some(answer => 
    answer.answer?.toLowerCase().includes('example') || 
    answer.answer?.toLowerCase().includes('experience') ||
    answer.answer?.toLowerCase().includes('project')
  );
  
  if (hasExamples) {
    overallScore = Math.min(overallScore + 10, 70);
    strengths.push("Included relevant examples and experience from past projects");
  } else {
    improvements.push("Include specific examples and real-world experience to strengthen your responses");
  }
  
  let feedback = `You completed the ${round.title} round with ${totalAnswers} out of ${totalQuestions} questions answered. `;
  
  if (hasPoorResponses) {
    feedback += "Your responses indicate significant knowledge gaps and lack of preparation. Communication was unclear and no specific examples were provided. ";
  }
  
  if (completionRate >= 100) {
    feedback += "All questions were answered, but the quality of responses needs improvement. ";
  } else {
    feedback += `The completion rate was only ${Math.round(completionRate)}%, which needs improvement. `;
    improvements.push("Complete all questions in future rounds");
  }
  
  feedback += `The average response length was ${Math.round(avgAnswerLength)} characters. `;
  
  if (overallScore >= 60) {
    feedback += "Performance was below average and requires significant improvement. Focus on providing more detailed technical explanations with specific examples.";
  } else if (overallScore >= 40) {
    feedback += "Performance was poor and demonstrates major knowledge gaps. Consider preparing more thoroughly and practicing articulating your technical knowledge.";
  } else {
    feedback += "Performance was unacceptable and indicates complete lack of preparation. Significant improvement needed in technical knowledge and interview skills.";
  }
  
  feedback += " Focus on improving your technical knowledge, preparation, and ability to communicate your expertise clearly.";
  
  // Fix individual scores - only show scores for unique questions that were actually answered
  const uniqueQuestionIds = [...new Set(candidateAnswers.map(answer => answer.questionId))];
  const individualScores = uniqueQuestionIds.map(questionId => {
    const questionAnswers = candidateAnswers.filter(answer => answer.questionId === questionId);
    const latestAnswer = questionAnswers[questionAnswers.length - 1]; // Get the latest answer
    return latestAnswer?.aiEvaluation?.score ? latestAnswer.aiEvaluation.score * 25 : Math.round(overallScore); // Convert 1-4 scale to 0-100
  });

    return {
    overallScore: Math.round(overallScore),
    feedback,
    strengths: strengths.length > 0 ? strengths : ["Participated in the round"],
    areasForImprovement: improvements.length > 0 ? improvements : ["Consider providing more detailed responses"],
    recommendation: overallScore >= 70 ? "Proceed to next round" : "Needs improvement",
    individualScores: individualScores
  };
}

// Helper function to get candidate summaries
function getCandidateSummaries(answers) {
  const candidateMap = new Map();
  
  answers.forEach(answer => {
    if (!candidateMap.has(answer.candidateId)) {
      candidateMap.set(answer.candidateId, {
        candidateId: answer.candidateId,
        candidateName: answer.candidateName,
        candidateEmail: answer.candidateEmail,
        totalAnswers: 0,
        averageScore: 0,
        strengths: [],
        improvements: [],
        lastAnswered: answer.timestamp
      });
    }
    
    const candidate = candidateMap.get(answer.candidateId);
    candidate.totalAnswers++;
    candidate.averageScore = (candidate.averageScore + (answer.aiEvaluation?.score || 0)) / candidate.totalAnswers;
    candidate.strengths.push(...(answer.aiEvaluation?.strengths || []));
    candidate.improvements.push(...(answer.aiEvaluation?.improvements || []));
  });
  
  return Array.from(candidateMap.values());
}

// Helper function to extract basic title from prompt if JSON parsing fails
function extractBasicTitle(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Common patterns to extract job titles
  const patterns = [
    /(?:hire|looking for|need|seeking)\s+(?:a\s+)?([^.!?]+?)(?:\s+(?:developer|engineer|manager|analyst|designer|specialist|lead|senior|junior))/i,
    /(?:position|role|job)\s+for\s+(?:a\s+)?([^.!?]+)/i,
    /([^.!?]*(?:developer|engineer|manager|analyst|designer|specialist|lead|senior|junior)[^.!?]*)/i
  ];
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^(a|an|the)\s+/i, '');
    }
  }
  
  // Fallback: use first part of prompt
  const words = prompt.split(' ').slice(0, 5).join(' ');
  return words.length > 50 ? words.substring(0, 50) + '...' : words;
}

module.exports = router;
