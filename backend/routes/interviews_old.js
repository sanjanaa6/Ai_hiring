const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// Validation function for interview structure
const validateInterviewStructure = (interviewData) => {
  try {
    // Check if interviewData exists
    if (!interviewData) {
      console.log('❌ [VALIDATION] Interview data is null or undefined');
      return false;
    }

    // Check required fields
    if (!interviewData.interviewId || !interviewData.title || !interviewData.jobTitle) {
      console.log('❌ [VALIDATION] Missing required fields (interviewId, title, or jobTitle)');
      return false;
    }

    // Check if rounds exist and is an array
    if (!interviewData.rounds || !Array.isArray(interviewData.rounds)) {
      console.log('❌ [VALIDATION] Rounds is missing or not an array');
      return false;
    }

    // Check if there's at least one round
    if (interviewData.rounds.length === 0) {
      console.log('❌ [VALIDATION] No rounds found');
      return false;
    }

    // Validate each round
    for (let i = 0; i < interviewData.rounds.length; i++) {
      const round = interviewData.rounds[i];
      
      if (!round.roundId || !round.title || !round.description) {
        console.log(`❌ [VALIDATION] Round ${i + 1} missing required fields (roundId, title, or description)`);
        return false;
      }

      if (!round.questions || !Array.isArray(round.questions)) {
        console.log(`❌ [VALIDATION] Round ${i + 1} questions is missing or not an array`);
        return false;
      }

      if (round.questions.length === 0) {
        console.log(`❌ [VALIDATION] Round ${i + 1} has no questions`);
        return false;
      }

      // Validate each question
      for (let j = 0; j < round.questions.length; j++) {
        const question = round.questions[j];
        
        if (!question.questionId || !question.question || !question.type) {
          console.log(`❌ [VALIDATION] Round ${i + 1}, Question ${j + 1} missing required fields`);
          return false;
        }
      }
    }

    console.log('✅ [VALIDATION] Interview structure is valid');
    return true;
  } catch (error) {
    console.log('❌ [VALIDATION] Error during validation:', error.message);
    return false;
  }
};

// Get candidate summaries from candidate answers
const getCandidateSummaries = (candidateAnswers) => {
  try {
    if (!candidateAnswers || !Array.isArray(candidateAnswers)) {
      console.log('⚠️ [CANDIDATE SUMMARIES] No candidate answers provided');
      return [];
    }

    // Group answers by candidate
    const candidateGroups = {};
    candidateAnswers.forEach(answer => {
      const candidateId = answer.candidateId;
      if (!candidateGroups[candidateId]) {
        candidateGroups[candidateId] = {
          candidateId: answer.candidateId,
          candidateName: answer.candidateName,
          candidateEmail: answer.candidateEmail,
          answers: [],
          totalScore: 0,
          answerCount: 0
        };
      }
      candidateGroups[candidateId].answers.push(answer);
      if (answer.aiEvaluation && answer.aiEvaluation.score) {
        candidateGroups[candidateId].totalScore += answer.aiEvaluation.score;
        candidateGroups[candidateId].answerCount += 1;
      }
    });

    // Convert to array and calculate averages
    const summaries = Object.values(candidateGroups).map(candidate => ({
      candidateId: candidate.candidateId,
      candidateName: candidate.candidateName,
      candidateEmail: candidate.candidateEmail,
      totalAnswers: candidate.answers.length,
      averageScore: candidate.answerCount > 0 ? (candidate.totalScore / candidate.answerCount).toFixed(2) : 0,
      lastAnswerDate: candidate.answers.length > 0 ? 
        new Date(Math.max(...candidate.answers.map(a => new Date(a.timestamp)))) : null,
      roundsCompleted: new Set(candidate.answers.map(a => a.roundId)).size
    }));

    console.log('✅ [CANDIDATE SUMMARIES] Generated summaries for', summaries.length, 'candidates');
    return summaries;
  } catch (error) {
    console.error('❌ [CANDIDATE SUMMARIES] Error generating summaries:', error.message);
    return [];
  }
};

// Get interview details for review (recruiter only)
router.get('/:interviewId/review', auth, async (req, res) => {
  console.log('🔍 [REVIEW INTERVIEW] Fetching interview for review:', req.params.interviewId);
  console.log('👤 [REVIEW INTERVIEW] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [REVIEW INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [REVIEW INTERVIEW] Interview found for review:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      approvalStatus: interview.approvalStatus
    });

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('❌ [REVIEW INTERVIEW] Error occurred:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview for review'
    });
  }
});

// Get approved interview by ID (public access for candidates)
router.get('/public/:interviewId', async (req, res) => {
  console.log('🔍 [GET PUBLIC INTERVIEW] Fetching approved interview:', req.params.interviewId);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId
    });

    if (!interview) {
      console.log('❌ [GET PUBLIC INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Only allow access to approved interviews (or pending for testing)
    if (interview.approvalStatus !== 'approved' && interview.approvalStatus !== 'pending') {
      console.log('⚠️ [GET PUBLIC INTERVIEW] Attempt to access unapproved interview:', {
        interviewId: interview.interviewId,
        approvalStatus: interview.approvalStatus
      });
      return res.status(403).json({
        success: false,
        error: `This interview is not available yet. Status: ${interview.approvalStatus}`
      });
    }

    // Log the approval status for debugging
    console.log('📋 [GET PUBLIC INTERVIEW] Interview status:', {
      interviewId: interview.interviewId,
      approvalStatus: interview.approvalStatus,
      approvedAt: interview.approvedAt,
      approvedBy: interview.approvedBy
    });

    console.log('✅ [GET PUBLIC INTERVIEW] Approved interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      approvalStatus: interview.approvalStatus
    });

    // Return limited data for public access
    const responseData = {
      interviewId: interview.interviewId,
      title: interview.title,
      totalDuration: interview.totalDuration,
      rounds: interview.rounds,
      approvalStatus: interview.approvalStatus
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ [GET PUBLIC INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview'
    });
  }
});

// Get interview by ID (handles both candidate and recruiter access)
router.get('/:interviewId', auth, async (req, res) => {
  console.log('🔍 [GET INTERVIEW] Fetching interview:', req.params.interviewId);
  console.log('👤 [GET INTERVIEW] User role:', req.user.role);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId
    });

    if (!interview) {
      console.log('❌ [GET INTERVIEW] Interview not found:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Check if user is a recruiter or the interview creator
    const isRecruiter = req.user.role === 'recruiter' || req.user.role === 'admin';
    const isCreator = interview.createdBy.toString() === req.user.id.toString();

    // For candidates, only show approved interviews
    if (!isRecruiter && !isCreator && interview.approvalStatus !== 'approved') {
      console.log('⚠️ [GET INTERVIEW] Attempt to access unapproved interview');
      return res.status(403).json({
        success: false,
        error: 'This interview is not available yet'
      });
    }

    console.log('✅ [GET INTERVIEW] Interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      approvalStatus: interview.approvalStatus
    });

    // Return full data for recruiters/creators, limited data for candidates
    const responseData = isRecruiter || isCreator ? interview : {
      interviewId: interview.interviewId,
      title: interview.title,
      totalDuration: interview.totalDuration,
      rounds: interview.approvalStatus === 'approved' ? interview.rounds : [],
      approvalStatus: interview.approvalStatus
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ [GET INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview'
    });
  }
});

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const KIMI_MODEL = 'google/gemini-flash-1.5';
const FALLBACK_MODEL = 'microsoft/phi-3-mini-128k-instruct:free';

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

    // Check if this is a role-specific prompt (contains structured interview rounds)
    const isRoleSpecificPrompt = userPrompt.includes('**Introduction & Self Intro**') || 
                                 userPrompt.includes('**Self Introduction**') ||
                                 userPrompt.includes('**Coding Round**') ||
                                 userPrompt.includes('**Sales Pitch/Role-play**');

    let extractionPrompt;
    
    if (isRoleSpecificPrompt) {
      // Use the role-specific prompt directly
      console.log('🎯 [INTERVIEW GENERATE] Detected role-specific prompt, using directly...');
      extractionPrompt = userPrompt;
    } else {
      // Extract job details from the prompt (legacy behavior)
      extractionPrompt = `Extract job details from this user prompt and format as JSON:

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
    }

    console.log('🤖 [INTERVIEW GENERATE] Extracting job details...');
    
    let extractionResponse;
    let extractedJobDetails;
    
    if (isRoleSpecificPrompt) {
      // For role-specific prompts, extract basic job info and use the prompt directly
      console.log('🎯 [INTERVIEW GENERATE] Processing role-specific prompt...');
      try {
        const basicExtractionPrompt = `Extract basic job information from this interview prompt and return as JSON:

"${userPrompt}"

Return only this JSON format:
{
  "title": "Job title",
  "description": "Brief job description",
  "requirements": "Key requirements",
  "level": "junior|mid|senior|lead",
  "duration": 30,
  "company": "Company name"
}`;

        extractionResponse = await axios.post(OPENROUTER_API_URL, {
          model: KIMI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting basic job information. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: basicExtractionPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'AI Hiring Platform'
          }
        });
        
        extractedJobDetails = parseAIResponse(extractionResponse.data.choices[0].message.content);
        console.log('✅ [INTERVIEW GENERATE] Basic job details extracted:', extractedJobDetails.title);
      } catch (error) {
        console.log('⚠️ [INTERVIEW GENERATE] Basic extraction failed, using fallback');
        extractedJobDetails = {
          title: 'AI Generated Job',
          description: userPrompt.substring(0, 200) + '...',
          requirements: 'As specified in job description',
          level: 'mid',
          duration: 30,
          company: 'Company'
        };
      }
    } else {
      // Original extraction logic for non-role-specific prompts
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
      let interviewData;
      try {
        interviewData = await createStructuredInterview(userPrompt, jobDetails);
      } catch (aiError) {
        console.log('⚠️ [INTERVIEW GENERATE] AI services unavailable, using offline structure:', aiError.message);
        interviewData = createOfflineInterviewStructure(jobDetails);
      }
      const finalData = ensureSixRounds(interviewData, jobDetails);
      
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
    }

    let jobDetails;
    try {
      const extractedContent = extractionResponse.data.choices[0].message.content;
      console.log('📋 [INTERVIEW GENERATE] Raw extraction result:', extractedContent.substring(0, 200) + '...');
      
      // Clean the response if it has markdown code blocks
      const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : extractedContent;
      
      extractedJobDetails = JSON.parse(jsonContent);
      console.log('✅ [INTERVIEW GENERATE] Job details extracted:', {
        title: extractedJobDetails.title,
        level: extractedJobDetails.level,
        duration: extractedJobDetails.duration
      });
    } catch (parseError) {
      console.log('⚠️ [INTERVIEW GENERATE] Failed to parse job details, using fallbacks');
      // Fallback to basic extraction
      extractedJobDetails = {
        title: extractBasicTitle(userPrompt),
        description: userPrompt,
        requirements: "Requirements to be determined based on the role",
        level: "mid",
        duration: 30,
        company: "Company"
      };
    }

    // For role-specific prompts, use the structured interview directly
    if (isRoleSpecificPrompt) {
      console.log('🎯 [INTERVIEW GENERATE] Using role-specific interview structure...');
      
      let interviewData;
      try {
        interviewData = await createRoleSpecificInterview(userPrompt, extractedJobDetails);
      } catch (aiError) {
        console.log('⚠️ [INTERVIEW GENERATE] AI services unavailable, using offline structure:', aiError.message);
        interviewData = createOfflineInterviewStructure(extractedJobDetails);
      }
      
      const finalData = ensureSixRounds(interviewData, extractedJobDetails);
      
      // Save to database
      const interview = new Interview({
        ...finalData,
        jobTitle: extractedJobDetails.title,
        jobDescription: extractedJobDetails.description,
        jobRequirements: extractedJobDetails.requirements,
        jobLevel: extractedJobDetails.level,
        company: extractedJobDetails.company,
        originalPrompt: userPrompt,
        createdBy: req.user.id
      });

      await interview.save();
      console.log('✅ [INTERVIEW GENERATE] Role-specific interview saved, ID:', interview.interviewId);

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

    const { title, description, requirements, level, duration } = extractedJobDetails;
    console.log('✅ [INTERVIEW GENERATE] Using job details for AI interview generation...');

    // Generate interview using AI
    const interviewPrompt = `You are an expert HR professional and interviewer. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes

Create a structured interview with exactly 6 hiring rounds that are HIGHLY SPECIALIZED and PRACTICAL for this specific role. Each round must have exactly 5 questions with hands-on challenges:

ROUND 1: Role-Specific Fundamentals (20-25 minutes)
- 5 fundamental questions with practical applications
- For Developers: Coding challenges with code editor, algorithm problems, code review scenarios
- For Data Analysts: Excel formulas, SQL queries, data manipulation tasks
- For Hiring Managers: Resume evaluation, candidate comparison scenarios
- For Designers: Design challenges, portfolio review, creative problem-solving
- For Sales: Prospecting techniques, lead qualification, sales methodology, CRM usage, pipeline management
- Focus on core skills and tools specific to ${title} role

ROUND 2: Practical Skills Assessment (20-25 minutes)
- 5 hands-on challenges and real-world scenarios
- For Developers: Live coding sessions with code editor, debugging exercises, system design
- For Data Analysts: VLOOKUP/HLOOKUP tests, pivot tables, data visualization
- For Hiring Managers: Interview simulation, decision-making scenarios
- For Sales: Objection handling, negotiation scenarios, pitch presentations, role-play exercises
- Assess practical application of skills in realistic situations

ROUND 3: Problem-Solving & Critical Thinking (15-20 minutes)
- 5 complex scenarios with role-specific challenges
- For Developers: Performance optimization, scalability issues, architecture decisions
- For Data Analysts: Data quality issues, statistical analysis, reporting challenges
- For Hiring Managers: Difficult hiring decisions, team conflict resolution
- For Marketing: Campaign optimization, market analysis, ROI evaluation
- For Sales: Complex deal scenarios, competitive situations, customer retention challenges
- Industry-specific problem-solving approaches and decision-making

ROUND 4: Advanced Skills & Tool Proficiency (15-20 minutes)
- 5 advanced questions and tool-specific challenges
- For Developers: Framework-specific questions, API integration, security best practices
- For Data Analysts: Advanced Excel functions, database queries, BI tools
- For Hiring Managers: ATS systems, recruitment metrics, talent assessment tools
- For Finance: Financial modeling, risk assessment, compliance scenarios
- For Sales: Advanced CRM usage, sales analytics, territory management, forecasting
- Deep dive into specialized tools and advanced techniques

ROUND 5: Leadership & Team Collaboration (12-15 minutes)
- 5 questions about working in teams and leadership scenarios
- For Senior roles: Team management, mentoring, project leadership
- For Individual contributors: Cross-functional collaboration, knowledge sharing
- For Managers: Performance management, team building, conflict resolution
- For Sales: Team selling, sales management, territory coordination, cross-functional partnerships
- Communication skills and team dynamics specific to this role level

ROUND 6: Industry Knowledge & Strategic Thinking (12-15 minutes)
- 5 questions about industry trends, strategic thinking, and future planning
- For Developers: Technology trends, architecture evolution, innovation
- For Data Analysts: Data science trends, analytics evolution, business intelligence
- For Hiring Managers: Talent market trends, recruitment strategies, HR technology
- For Business roles: Market analysis, competitive landscape, strategic planning
- For Sales: Market trends, competitive analysis, sales strategy, customer behavior insights
- Assess industry awareness and long-term thinking capabilities

IMPORTANT: Format your response as valid JSON with this exact structure. You MUST include exactly 6 rounds, each with exactly 5 questions.

CRITICAL INSTRUCTIONS:
1. Create questions that are SPECIFIC to this exact role, not generic questions
2. If the job mentions React, ask about React concepts, not just JavaScript
3. If the job mentions Python, ask about Python-specific features, not just programming
4. If the job mentions AWS, ask about AWS services, not just cloud concepts
5. If the job mentions databases, ask about specific database technologies mentioned
6. Make questions appropriate for the role level (${level}-level)
7. Focus on the specific technologies and tools mentioned in the job description

Examples of SPECIFIC vs GENERIC questions:
- GENERIC: "Tell me about yourself"
- SPECIFIC for React Developer: "Explain how you would optimize a React component's performance using memoization and what are the trade-offs?"
- SPECIFIC for Sales Representative: "Walk me through your process for qualifying a lead and determining their budget authority and decision-making timeline."

- GENERIC: "What is your experience with databases?"
- SPECIFIC for Python Developer: "How would you implement database connection pooling in a Python Django application and handle connection timeouts?"
- SPECIFIC for Sales Representative: "How do you use CRM data to identify upselling opportunities and what metrics do you track to measure success?"

JSON Structure:
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
          "type": "coding-challenge",
          "question": "GENERATE SPECIFIC QUESTION BASED ON JOB DESCRIPTION",
          "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
          "timeLimit": 5,
          "difficulty": "easy",
          "followUpQuestions": ["GENERATE SPECIFIC FOLLOW-UP QUESTIONS"],
          "codeEditor": {
            "enabled": true,
            "language": "CHOOSE APPROPRIATE LANGUAGE",
            "starterCode": "GENERATE RELEVANT STARTER CODE",
            "testCases": [
              {"input": "RELEVANT INPUT", "expected": "EXPECTED OUTPUT"}
            ]
          }
        },
        {
          "id": "q1_2",
          "type": "technical",
          "question": "GENERATE SPECIFIC QUESTION BASED ON JOB DESCRIPTION",
          "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["GENERATE SPECIFIC FOLLOW-UP QUESTIONS"]
        },
        // Continue with 3 more questions (q1_3, q1_4, q1_5) following the same pattern
      ],
      "evaluationCriteria": {
        "technical": "Evaluate technical knowledge and skills",
        "problemSolving": "Evaluate problem-solving approach"
      }
    },
    // Continue with rounds 2-6 following the same pattern
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

CRITICAL REQUIREMENTS - STRICT ENFORCEMENT:
1. You MUST generate exactly 6 rounds (round_1 through round_6) - NO MORE, NO LESS
2. Each round MUST contain exactly 5 questions (q1_1 through q1_5, q2_1 through q2_5, etc.) - STRICTLY 5 QUESTIONS PER ROUND
3. Do NOT generate fewer than 6 rounds
4. Do NOT generate more than 6 rounds
5. Do NOT generate fewer than 5 questions per round
6. Do NOT generate more than 5 questions per round
7. For coding challenges, include codeEditor object with enabled: true, language, starterCode, and testCases
8. Make sure the JSON is valid and properly formatted with all 6 rounds, each containing exactly 5 questions
9. VALIDATION: Count your questions - each round must have exactly 5 questions before submitting
10. If you cannot generate exactly 5 questions for a round, use generic questions to reach the count of 5`;

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
      const interviewData = await createStructuredInterview("AI Generated Interview", { title, description, requirements, level, duration });
      const finalData = ensureSixRounds(interviewData, { title, description, requirements, level, duration });
      
      // Save to database
      const interview = new Interview({
        ...finalData,
        jobTitle: title,
        jobDescription: description,
        jobRequirements: requirements,
        jobLevel: level,
        company: extractedJobDetails.company || 'Company',
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
      interviewData = await createStructuredInterview(aiData, { title, description, requirements, level, duration });
    }

    // Ensure exactly 6 rounds exist with exactly 5 questions each
    try {
      interviewData = ensureSixRounds(interviewData, { title, description, requirements, level, duration });
      console.log('✅ [INTERVIEW GENERATE] ensureSixRounds applied:', interviewData.rounds?.length || 0);
      
      // Additional validation: Log question counts for each round
      if (interviewData.rounds) {
        interviewData.rounds.forEach((round, index) => {
          const questionCount = round.questions ? round.questions.length : 0;
          console.log(`📊 [INTERVIEW GENERATE] Round ${index + 1} (${round.title}): ${questionCount} questions`);
          if (questionCount !== 5) {
            console.log(`⚠️ [INTERVIEW GENERATE] Round ${index + 1} has ${questionCount} questions instead of 5 - this should be fixed by ensureSixRounds`);
          }
        });
      }
    } catch (e) {
      console.log('⚠️ [INTERVIEW GENERATE] ensureSixRounds error:', e.message);
    }

    // Final validation before saving
    const isValidStructure = validateInterviewStructure(interviewData);
    if (!isValidStructure) {
      console.log('⚠️ [INTERVIEW GENERATE] Interview structure validation failed, but continuing with ensureSixRounds applied data');
    }

    console.log('💾 [INTERVIEW GENERATE] Creating interview in database...');
    
    // Create jobDetailsForDb object for consistency
    const jobDetailsForDb = {
      title: title,
      description: description,
      requirements: requirements,
      level: level,
      duration: duration,
      company: 'Company' // Default company name
    };
    
    // Create interview in database
    const interview = new Interview({
      ...interviewData,
      jobTitle: title,
      jobDescription: description,
      jobRequirements: requirements,
      jobLevel: level,
      company: jobDetailsForDb.company,
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
        approvalStatus: 'pending',
        reviewLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recruiter/review/${interview.interviewId}`
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

// Start specific round
router.post('/:interviewId/round/:roundId/start', async (req, res) => {
  console.log('🎬 [START ROUND] Starting round for interview:', req.params.interviewId);
  console.log('🎭 [START ROUND] Round ID:', req.params.roundId);
  
  try {
    const { candidateId, candidateName, candidateEmail } = req.body || {};
    
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

    console.log('✅ [START ROUND] Starting round:', round.title);

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
          totalQuestions: round.questions.length,
          codeEditor: firstQuestion.codeEditor || null,
          followUpQuestions: firstQuestion.followUpQuestions || []
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

    console.log('✅ [SUBMIT ANSWER] Interview found, checking question type...');
    
    // Find the question type from the interview structure
    let questionType = 'text'; // default
    for (const round of interview.rounds || []) {
      for (const q of round.questions || []) {
        if (q.id === questionId) {
          questionType = q.type;
          break;
        }
      }
      if (questionType !== 'text') break;
    }
    
    console.log('🔍 [SUBMIT ANSWER] Question type detected:', questionType);
    
    // Handle interactive-coding questions differently - redirect to coding round
    if (questionType === 'interactive-coding') {
      console.log('🚀 [SUBMIT ANSWER] Interactive coding question detected - redirecting to coding round...');
      
      // For interactive coding, we need to start the coding round session
      // The frontend should handle this by calling the coding round endpoints
      return res.json({
        success: true,
        data: {
          redirectToCodingRound: true,
          message: "This is an interactive coding question. Please use the coding round interface.",
          codingRoundData: {
            interviewId: req.params.interviewId,
            question: question,
            questionId: questionId,
            roundId: roundId,
            candidateId: candidateId,
            candidateName: candidateName,
            candidateEmail: candidateEmail
          }
        }
      });
    }
    
    console.log('📝 [SUBMIT ANSWER] Sending to AI for evaluation:', {
      answerType: answerType,
      textLength: finalAnswer.length,
      isTranscription: answerType === 'voice' && transcription ? true : false,
      questionType: questionType
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

// Get pending interviews for review
router.get('/pending-review', auth, async (req, res) => {
  console.log('📋 [PENDING REVIEW] Fetching pending interviews for review...');
  console.log('👤 [PENDING REVIEW] User ID:', req.user.id);
  
  try {
    const interviews = await Interview.find({ 
      createdBy: req.user.id,
      approvalStatus: 'pending'
    }).sort({ createdAt: -1 });
    
    console.log('✅ [PENDING REVIEW] Found', interviews.length, 'pending interviews');
    
    res.json({
      success: true,
      data: interviews.map(interview => ({
        interviewId: interview.interviewId,
        title: interview.title,
        jobTitle: interview.jobTitle,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds.length,
        createdAt: interview.createdAt,
        approvalStatus: interview.approvalStatus
      }))
    });
    
  } catch (error) {
    console.error('❌ [PENDING REVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending interviews'
    });
  }
});

// Get all interviews for recruiter
router.get('/', auth, async (req, res) => {
  console.log('📋 [GET ALL INTERVIEWS] Fetching interviews for user:', req.user.id);
  
  try {
    const interviews = await Interview.find({ createdBy: req.user.id })
      .select('interviewId title jobTitle totalDuration statistics createdAt status approvalStatus')
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
      approvalStatus: i.approvalStatus,
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

// Helper function to generate sales knowledge questions
async function generateSalesKnowledgeQuestions(jobDetails) {
  const prompt = `You are an expert sales interviewer. Generate exactly 5 sales knowledge questions for this SPECIFIC sales position. Analyze the job description carefully and create questions that assess fundamental sales knowledge, methodologies, and best practices relevant to this role.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

CRITICAL INSTRUCTIONS:
1. Create questions that assess sales fundamentals, not generic questions
2. Focus on sales methodologies, CRM usage, pipeline management, prospecting techniques
3. Make questions appropriate for the role level (${jobDetails.level || 'mid'}-level)
4. Include questions about sales tools, metrics, and best practices
5. Each question should have a clear expected answer for evaluation

Examples of GOOD sales knowledge questions:
- "What is your approach to qualifying leads and determining their budget authority?"
- "How do you use CRM data to identify upselling opportunities?"
- "What metrics do you track to measure sales performance?"

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON, no markdown code blocks
- Ensure all strings are properly quoted and closed
- Ensure all arrays and objects are properly closed with ] and }
- Do not truncate any strings or arrays
- Each question must be a complete, valid JSON object

Return ONLY a valid JSON array with this exact format:
[
  {
    "id": "q2_1",
    "type": "sales",
    "question": "GENERATE SPECIFIC SALES KNOWLEDGE QUESTION",
    "expectedAnswer": "Look for understanding of sales fundamentals, methodologies, and best practices",
    "timeLimit": 3,
    "difficulty": "medium",
    "followUpQuestions": []
  }
]

Make sure each question is directly relevant to sales knowledge and this specific role.`;

  try {
    const response = await axios.post(`${process.env.OPENROUTER_API_URL}/chat/completions`, {
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales interviewer. Generate relevant, specific sales knowledge questions based on job requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER_URL,
        'X-Title': 'AI Interview System'
      }
    });

    const aiData = response.data.choices[0].message.content.trim();
    console.log('✅ [SALES KNOWLEDGE] AI response received:', aiData.substring(0, 100) + '...');
    
    const questions = JSON.parse(aiData);
    console.log('✅ [SALES KNOWLEDGE] Generated', questions.length, 'sales knowledge questions');
    return questions;
  } catch (error) {
    console.error('❌ [SALES KNOWLEDGE] Error generating sales knowledge questions:', error);
    return [];
  }
}

// Helper function to generate sales role-play questions
async function generateSalesRolePlayQuestions(jobDetails) {
  const prompt = `You are an expert sales interviewer. Generate exactly 5 sales role-play questions for this SPECIFIC sales position. Create interactive scenarios where the candidate can demonstrate their sales skills through role-playing exercises.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

CRITICAL INSTRUCTIONS:
1. Create interactive role-play scenarios, not just questions
2. Focus on practical sales situations like cold calling, presentations, negotiations
3. Make scenarios appropriate for the role level (${jobDetails.level || 'mid'}-level)
4. Include realistic customer personas and objections
5. Each scenario should allow the candidate to demonstrate sales skills

Examples of GOOD sales role-play questions:
- "Let's role-play a cold call to a potential client. I'll be the prospect who is skeptical about your product."
- "Present your product to me as if I'm a decision-maker with budget constraints."
- "Handle this objection: 'Your price is too high compared to competitors.'"

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON, no markdown code blocks
- Ensure all strings are properly quoted and closed
- Ensure all arrays and objects are properly closed with ] and }
- Do not truncate any strings or arrays
- Each question must be a complete, valid JSON object

Return ONLY a valid JSON array with this exact format:
[
  {
    "id": "q3_1",
    "type": "role_play",
    "question": "GENERATE SPECIFIC SALES ROLE-PLAY SCENARIO",
    "expectedAnswer": "AI will guide through role-play, provide feedback, and assess sales skills",
    "timeLimit": 6,
    "difficulty": "medium",
    "followUpQuestions": []
  }
]

Make sure each role-play scenario is directly relevant to this sales role.`;

  try {
    const response = await axios.post(`${process.env.OPENROUTER_API_URL}/chat/completions`, {
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales interviewer. Generate relevant, specific sales role-play scenarios based on job requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER_URL,
        'X-Title': 'AI Interview System'
      }
    });

    const aiData = response.data.choices[0].message.content.trim();
    console.log('✅ [SALES ROLE-PLAY] AI response received:', aiData.substring(0, 100) + '...');
    
    const questions = JSON.parse(aiData);
    console.log('✅ [SALES ROLE-PLAY] Generated', questions.length, 'sales role-play questions');
    return questions;
  } catch (error) {
    console.error('❌ [SALES ROLE-PLAY] Error generating sales role-play questions:', error);
    return [];
  }
}

// Helper function to generate objection handling questions
async function generateObjectionHandlingQuestions(jobDetails) {
  const prompt = `You are an expert sales interviewer. Generate exactly 5 objection handling questions for this SPECIFIC sales position. Create scenarios that test the candidate's ability to handle common sales objections and difficult situations.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

CRITICAL INSTRUCTIONS:
1. Create objection handling scenarios, not just questions
2. Focus on common sales objections like price, timing, competition, authority
3. Make scenarios appropriate for the role level (${jobDetails.level || 'mid'}-level)
4. Include realistic objections that would occur in this industry/role
5. Each scenario should test objection handling skills and persistence

Examples of GOOD objection handling questions:
- "The customer says 'Your price is 30% higher than your competitor.' How do you respond?"
- "The prospect says 'We need to think about it and get back to you.' What's your approach?"
- "The decision-maker says 'We don't have budget for this right now.' How do you handle this?"

CRITICAL JSON FORMATTING REQUIREMENTS:
- Return ONLY valid JSON, no markdown code blocks
- Ensure all strings are properly quoted and closed
- Ensure all arrays and objects are properly closed with ] and }
- Do not truncate any strings or arrays
- Each question must be a complete, valid JSON object

Return ONLY a valid JSON array with this exact format:
[
  {
    "id": "q4_1",
    "type": "objection_handling",
    "question": "GENERATE SPECIFIC OBJECTION HANDLING SCENARIO",
    "expectedAnswer": "Look for objection handling techniques, persistence, and problem-solving approach",
    "timeLimit": 4,
    "difficulty": "medium",
    "followUpQuestions": []
  }
]

Make sure each objection scenario is directly relevant to this sales role.`;

  try {
    const response = await axios.post(`${process.env.OPENROUTER_API_URL}/chat/completions`, {
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales interviewer. Generate relevant, specific objection handling scenarios based on job requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER_URL,
        'X-Title': 'AI Interview System'
      }
    });

    const aiData = response.data.choices[0].message.content.trim();
    console.log('✅ [OBJECTION HANDLING] AI response received:', aiData.substring(0, 100) + '...');
    
    const questions = JSON.parse(aiData);
    console.log('✅ [OBJECTION HANDLING] Generated', questions.length, 'objection handling questions');
    return questions;
  } catch (error) {
    console.error('❌ [OBJECTION HANDLING] Error generating objection handling questions:', error);
    return [];
  }
}

// Helper function to generate role-specific advanced questions dynamically
async function generateRoleSpecificAdvancedQuestions(jobDetails) {
  const technologies = detectTechnologies(jobDetails);
  
  // Create a comprehensive prompt for AI to generate advanced questions
  const prompt = `You are an expert technical interviewer. Generate exactly 5 advanced technical interview questions for this SPECIFIC job position. Analyze the job description carefully and create questions that are tailored to the exact technologies, frameworks, and requirements mentioned.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

Detected Technologies:
- Languages: ${technologies.languages.join(', ') || 'Not specified'}
- Frameworks: ${technologies.frameworks.join(', ') || 'Not specified'}
- Databases: ${technologies.databases.join(', ') || 'Not specified'}
- Tools: ${technologies.tools.join(', ') || 'Not specified'}

CRITICAL INSTRUCTIONS:
1. Create questions that are SPECIFIC to this exact role, not generic advanced questions
2. If the job mentions React, ask about React performance optimization, not just general optimization
3. If the job mentions Python, ask about Python-specific advanced concepts, not just programming
4. If the job mentions AWS, ask about AWS architecture patterns, not just cloud concepts
5. If the job mentions microservices, ask about microservices patterns, not just architecture
6. Make questions appropriate for the role level (${jobDetails.level || 'mid'}-level)
7. Focus on the specific technologies and tools mentioned in the job description

Examples of SPECIFIC vs GENERIC advanced questions:
- GENERIC: "How would you optimize application performance?"
- SPECIFIC for React Developer: "How would you optimize React application performance using techniques like code splitting, memoization, and virtual DOM optimization?"

- GENERIC: "Explain system design principles"
- SPECIFIC for Python Developer: "How would you design a scalable Python web application using Django/Flask with proper database optimization and caching strategies?"

Generate 5 advanced technical questions that are:
1. SPECIFIC to the technologies mentioned in the job description
2. Appropriate for the role level (${jobDetails.level || 'mid'}-level)
3. Focus on advanced concepts, optimization, architecture, and best practices for THIS specific role
4. Mix of medium and hard difficulty levels
5. Cover performance, scalability, security, and system design topics
6. Test deep understanding of the technologies and their ecosystem

Return ONLY a valid JSON array with this exact format:
[
  {
    "id": "q4_1",
    "type": "technical",
    "question": "GENERATE SPECIFIC ADVANCED QUESTION BASED ON JOB DESCRIPTION",
    "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
    "timeLimit": 4,
    "difficulty": "hard",
    "followUpQuestions": []
  }
]

Make sure the questions are directly relevant to the technologies and role mentioned in the job description.`;

  try {
    const response = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Generate relevant, advanced technical questions based on job requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const questions = parseAIResponse(response.data.choices[0].message.content);
    return questions;
  } catch (error) {
    console.error('Error generating dynamic advanced questions:', error);
    // Fallback to basic questions
    return [
      {
        id: "q4_1",
            type: "technical",
        question: "How would you optimize application performance?",
        expectedAnswer: "Profiling, algorithm optimization, caching, database optimization, monitoring",
        timeLimit: 4,
        difficulty: "hard",
            followUpQuestions: []
          },
          {
        id: "q4_2",
            type: "technical",
        question: "Explain system design principles for scalable applications.",
        expectedAnswer: "Load balancing, microservices, caching, database sharding, monitoring",
            timeLimit: 4,
        difficulty: "hard",
            followUpQuestions: []
          },
          {
        id: "q4_3",
            type: "technical",
        question: "How do you handle error handling and logging?",
        expectedAnswer: "Proper exception handling, structured logging, monitoring, alerting systems",
        timeLimit: 3,
        difficulty: "medium",
            followUpQuestions: []
          },
          {
        id: "q4_4",
            type: "technical",
        question: "What testing strategies do you use for applications?",
        expectedAnswer: "Unit tests, integration tests, E2E tests, mocking, TDD approach",
            timeLimit: 3,
        difficulty: "medium",
            followUpQuestions: []
          },
          {
        id: "q4_5",
            type: "technical",
        question: "How would you debug complex issues in production?",
        expectedAnswer: "Logging, monitoring, profiling, systematic debugging approach, root cause analysis",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: []
          }
    ];
  }
}

// Helper function to generate role-specific coding questions dynamically
async function generateRoleSpecificCodingQuestions(jobDetails) {
  const technologies = detectTechnologies(jobDetails);
  
  // Create a comprehensive prompt for AI to generate coding questions
  const prompt = `You are an expert technical interviewer. Generate exactly 3 interactive coding interview questions for this SPECIFIC job position. Analyze the job description carefully and create coding challenges that are tailored to the exact technologies, frameworks, and requirements mentioned.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

Detected Technologies:
- Languages: ${technologies.languages.join(', ') || 'Not specified'}
- Frameworks: ${technologies.frameworks.join(', ') || 'Not specified'}
- Databases: ${technologies.databases.join(', ') || 'Not specified'}
- Tools: ${technologies.tools.join(', ') || 'Not specified'}

CRITICAL INSTRUCTIONS:
1. Create coding challenges that are SPECIFIC to this exact role, not generic coding problems
2. If the job mentions React, create React component challenges, not just JavaScript
3. If the job mentions Python, create Python-specific coding tasks, not just algorithms
4. If the job mentions APIs, create API-related coding challenges
5. If the job mentions databases, create database-related coding tasks
6. Make challenges appropriate for the role level (${jobDetails.level || 'mid'}-level)
7. Focus on the specific technologies and tools mentioned in the job description

Examples of SPECIFIC vs GENERIC coding challenges:
- GENERIC: "Write a function to reverse a string"
- SPECIFIC for React Developer: "Create a React component that fetches data from an API and displays it in a list with filtering functionality"

- GENERIC: "Implement a binary search algorithm"
- SPECIFIC for Python Developer: "Write a Python function using pandas to process a CSV file and calculate summary statistics"

Generate 3 interactive coding questions that are:
1. SPECIFIC to the technologies mentioned in the job description
2. Appropriate for the role level (${jobDetails.level || 'mid'}-level)
3. Hands-on coding tasks that can be completed in 5-6 minutes each
4. Progressive difficulty (start easy, build complexity)
5. Include practical scenarios relevant to THIS specific role
6. Each question should have 4 follow-up questions for AI guidance

Return ONLY a valid JSON array with this exact format:
[
  {
    "id": "q3_1",
    "type": "interactive-coding",
    "question": "GENERATE SPECIFIC CODING TASK BASED ON JOB TECHNOLOGIES",
    "expectedAnswer": "AI will review code, suggest improvements, ask for modifications, and guide through iterations",
    "timeLimit": 6,
    "difficulty": "medium",
    "followUpQuestions": [
      "GENERATE SPECIFIC FOLLOW-UP QUESTION 1",
      "GENERATE SPECIFIC FOLLOW-UP QUESTION 2", 
      "GENERATE SPECIFIC FOLLOW-UP QUESTION 3",
      "GENERATE SPECIFIC FOLLOW-UP QUESTION 4"
    ]
  }
]

Make sure each coding task is directly relevant to the specific technologies and role mentioned in the job description.`;

  try {
    const response = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Generate relevant, specific coding challenges based on job requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const questions = parseAIResponse(response.data.choices[0].message.content);
    return questions;
  } catch (error) {
    console.error('Error generating dynamic coding questions:', error);
    // Fallback to basic questions
    return [
          {
            id: "q3_1",
            type: "interactive-coding",
        question: "Let's start with a simple algorithm implementation. Create a function to solve a common programming problem. I'll guide you through improvements.",
            expectedAnswer: "AI will review code, suggest improvements, ask for modifications, and guide through iterations",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: [
          "Great! Now analyze the time and space complexity. What are they?",
          "Good! Can you optimize this further?",
          "Excellent! Now add input validation. How would you handle edge cases?",
          "Perfect! How would you test this function?"
            ]
          },
          {
            id: "q3_2",
            type: "interactive-coding",
        question: "Let's work on data structure implementation. Create a basic data structure and I'll help you enhance it step by step.",
        expectedAnswer: "AI will review data structure design, suggest improvements, and performance optimizations",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: [
          "Good start! Now add error handling. How would you handle invalid operations?",
          "Great! Can you add more methods to your data structure?",
          "Excellent! Now let's add iterators. How would you implement this?",
          "Perfect! How would you handle memory management?"
            ]
          },
          {
            id: "q3_3",
            type: "interactive-coding",
        question: "Let's build a utility function together. Start with basic functionality, and I'll guide you through making it more robust.",
        expectedAnswer: "AI will review function design, suggest improvements, and best practices",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: [
          "Good! Now add proper error handling. How would you implement this?",
          "Great! Can you add input validation?",
          "Excellent! Now let's add documentation. How would you structure this?",
          "Perfect! How would you handle edge cases?"
        ]
      }
    ];
  }
}

// Helper function to generate introduction questions dynamically
async function generateIntroductionQuestions(jobDetails) {
  try {
    const prompt = `Generate 5 introduction and background questions for this SPECIFIC job role. Analyze the job description carefully and create questions that are tailored to the exact requirements, technologies, and responsibilities mentioned.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}
Level: ${jobDetails.level}

IMPORTANT: Create questions that are SPECIFIC to this exact role, not generic questions. For example:
- If it's a React Developer role, ask about React experience, not just "software development"
- If it's a Python Data Scientist role, ask about Python libraries, data analysis, not just "programming"
- If it's a DevOps Engineer role, ask about CI/CD, cloud platforms, not just "technical skills"
- If it's a Mobile Developer role, ask about iOS/Android, not just "development"

Analyze the job description and create questions that assess:
1. Specific experience with the technologies mentioned in the job description
2. Relevant projects and achievements related to this exact role
3. Understanding of the specific responsibilities and challenges of this position
4. Motivation for this particular role and company
5. Specific skills and knowledge required for this position

Return as JSON array with this structure:
[
  {
    "id": "q1_1",
    "type": "behavioral",
    "question": "GENERATE SPECIFIC INTRODUCTION QUESTION BASED ON JOB REQUIREMENTS",
    "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
    "timeLimit": 3,
    "difficulty": "easy",
    "followUpQuestions": []
  }
]

CRITICAL: Make each question SPECIFIC to this job description. Do not use generic questions like "Tell me about yourself" or "What are your strengths". Instead, create questions that directly relate to the technologies, responsibilities, and requirements mentioned in the job description.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    const questions = parseAIResponse(aiResponse);
    return questions;
  } catch (error) {
    console.error('Error generating introduction questions:', error);
    // Use better fallback questions
    return generateFallbackQuestions(jobDetails, 'introduction', 5);
  }
}

// Helper function to generate behavioral questions dynamically
async function generateBehavioralQuestions(jobDetails) {
  try {
    const prompt = `Generate 5 behavioral and soft skills questions for this job role:

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}
Level: ${jobDetails.level}

Create questions that assess:
1. Teamwork and collaboration
2. Problem-solving and adaptability
3. Leadership and initiative
4. Communication and feedback handling
5. Values and cultural fit

Return as JSON array with this structure:
[
  {
    "id": "q5_1",
    "type": "behavioral",
    "question": "GENERATE SPECIFIC BEHAVIORAL QUESTION BASED ON JOB REQUIREMENTS",
    "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
    "timeLimit": 3,
    "difficulty": "medium",
    "followUpQuestions": []
  }
]

Make questions relevant to this specific role and industry.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    const questions = parseAIResponse(aiResponse);
    return questions;
  } catch (error) {
    console.error('Error generating behavioral questions:', error);
    // Fallback questions
    return [
      {
        id: "q5_1",
        type: "behavioral",
        question: "Tell me about a time when you had to work with a difficult team member.",
        expectedAnswer: "Assess conflict resolution and interpersonal skills",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
      }
    ];
  }
}

// Helper function to generate final assessment questions dynamically
async function generateFinalAssessmentQuestions(jobDetails) {
  try {
    const prompt = `Generate 5 final assessment and wrap-up questions for this job role:

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}
Level: ${jobDetails.level}

Create questions that:
1. Allow candidate to highlight additional strengths
2. Assess candidate's questions about the role/company
3. Discuss availability and timeline
4. Address salary expectations
5. Understand next steps and expectations

Return as JSON array with this structure:
[
  {
    "id": "q6_1",
    "type": "summary",
    "question": "GENERATE SPECIFIC FINAL ASSESSMENT QUESTION BASED ON JOB REQUIREMENTS",
    "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
    "timeLimit": 2,
    "difficulty": "easy",
    "followUpQuestions": []
  }
]

Make questions appropriate for the final stage of the interview.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    const questions = parseAIResponse(aiResponse);
    return questions;
  } catch (error) {
    console.error('Error generating final assessment questions:', error);
    // Fallback questions
    return [
      {
        id: "q6_1",
        type: "summary",
        question: "Is there anything else you'd like us to know about you?",
        expectedAnswer: "Allow candidate to highlight additional strengths",
        timeLimit: 2,
        difficulty: "easy",
            followUpQuestions: []
      }
    ];
  }
}

// Helper function to parse JSON from AI responses (handles markdown code blocks and malformed JSON)
function parseAIResponse(responseText) {
  try {
    // First try to parse as direct JSON
    return JSON.parse(responseText);
  } catch (error) {
    try {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // If no code blocks, try to find JSON array or object
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      console.error('❌ [JSON PARSE] Failed to parse AI response:', parseError.message);
      console.error('📝 [JSON PARSE] Raw response:', responseText);
      
      // Try to fix common JSON issues
      try {
        const fixedJson = fixMalformedJson(responseText);
        if (fixedJson) {
          console.log('🔧 [JSON PARSE] Attempting to fix malformed JSON...');
          return JSON.parse(fixedJson);
        }
      } catch (fixError) {
        console.error('❌ [JSON PARSE] Failed to fix malformed JSON:', fixError.message);
      }
      
      throw parseError;
    }
  }
}

// Helper function to fix common JSON malformation issues
function fixMalformedJson(responseText) {
  try {
    // Extract JSON from markdown code blocks first
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Try to find the JSON array
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonText = arrayMatch[0];
    }
    
    // Fix common issues
    let fixedJson = jsonText
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix missing quotes around property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix missing commas between objects
      .replace(/}\s*{/g, '},{')
      // Fix truncated strings by closing them properly
      .replace(/"([^"]*?)(\s*$)/g, '"$1"')
      // Fix unclosed strings in the middle of JSON (common AI error)
      .replace(/"([^"]*?)(\s*$)/gm, (match, content) => {
        // If the string is not properly closed, close it
        if (!match.endsWith('"')) {
          return `"${content.trim()}"`;
        }
        return match;
      })
      // Fix missing closing brackets/braces
      .replace(/([^}\]])\s*$/, '$1}]')
      // Fix specific pattern: unclosed strings in followUpQuestions
      .replace(/"followUpQuestions":\s*\[([^\]]*?)(\s*$)/g, (match, content) => {
        // If the array is not properly closed, close it
        if (!match.endsWith(']')) {
          const cleanContent = content.replace(/,\s*$/, ''); // Remove trailing comma
          return `"followUpQuestions": [${cleanContent}]`;
        }
        return match;
      })
      // Fix specific pattern: unclosed expectedAnswer strings
      .replace(/"expectedAnswer":\s*"([^"]*?)(\s*$)/g, (match, content) => {
        // If the string is not properly closed, close it
        if (!match.endsWith('"')) {
          return `"expectedAnswer": "${content.trim()}"`;
        }
        return match;
      });
    
    // Handle specific truncation patterns we've seen
    // Pattern 1: Truncated in the middle of a string value
    if (fixedJson.includes('"How would') && !fixedJson.includes('"How would you')) {
      // Find the last complete question and truncate there
      const lastCompleteQuestion = fixedJson.lastIndexOf('}');
      if (lastCompleteQuestion > 0) {
        fixedJson = fixedJson.substring(0, lastCompleteQuestion + 1) + ']';
      }
    }
    
    // Pattern 4: Handle truncated followUpQuestions arrays
    if (fixedJson.includes('"followUpQuestions": [') && !fixedJson.includes('"followUpQuestions": []')) {
      // Find incomplete followUpQuestions and fix them
      fixedJson = fixedJson.replace(/"followUpQuestions":\s*\[([^\]]*?)(\s*$)/g, (match, content) => {
        // If the array is not properly closed, close it
        if (!match.endsWith(']')) {
          const cleanContent = content.replace(/,\s*$/, ''); // Remove trailing comma
          return `"followUpQuestions": [${cleanContent}]`;
        }
        return match;
      });
    }
    
    // Pattern 5: Handle truncated expectedAnswer strings
    if (fixedJson.includes('"expectedAnswer": "') && fixedJson.includes('"expectedAnswer": "The answer should cover')) {
      // Find incomplete expectedAnswer and fix them
      fixedJson = fixedJson.replace(/"expectedAnswer":\s*"([^"]*?)(\s*$)/g, (match, content) => {
        // If the string is not properly closed, close it
        if (!match.endsWith('"')) {
          return `"expectedAnswer": "${content.trim()}"`;
        }
        return match;
      });
    }
    
    // Pattern 2: Truncated in expectedAnswer field
    if (fixedJson.includes('"expectedAnswer": "The answer should cover using appropriate exception handling mechanisms (try-catch blocks, custom exceptions), logging frameworks (e')) {
      // Find the start of this incomplete question and remove it
      const incompleteStart = fixedJson.lastIndexOf('{', fixedJson.indexOf('"expectedAnswer": "The answer should cover using appropriate exception handling mechanisms'));
      if (incompleteStart > 0) {
        fixedJson = fixedJson.substring(0, incompleteStart) + ']';
      }
    }
    
    // Pattern 3: Truncated in followUpQuestions
    if (fixedJson.includes('"How would') && fixedJson.includes('"How would you')) {
      // Find the last complete question before the truncated one
      const truncatedIndex = fixedJson.indexOf('"How would');
      const lastCompleteIndex = fixedJson.lastIndexOf('}', truncatedIndex);
      if (lastCompleteIndex > 0) {
        fixedJson = fixedJson.substring(0, lastCompleteIndex + 1) + ']';
      }
    }
    
    // If the JSON is still truncated, try to close it properly
    if (fixedJson.includes('"expectedAnswer": "To handle concurrent access to a shared counter, synchronization mechanisms are essential.  Mutexes (mutual')) {
      // This is the specific case we saw in the error - truncate at the incomplete answer
      const truncateAt = fixedJson.indexOf('"expectedAnswer": "To handle concurrent access to a shared counter, synchronization mechanisms are essential.  Mutexes (mutual');
      if (truncateAt > 0) {
        // Find the start of this question and remove it
        const questionStart = fixedJson.lastIndexOf('{', truncateAt);
        if (questionStart > 0) {
          fixedJson = fixedJson.substring(0, questionStart) + ']';
        }
      }
    }
    
    // Try to parse and validate the fixed JSON
    try {
      const parsed = JSON.parse(fixedJson);
      if (Array.isArray(parsed)) {
        // Validate and fix each question object
        const validatedQuestions = parsed.map((question, index) => {
          return validateAndFixQuestion(question, index);
        }).filter(question => question !== null); // Remove invalid questions
        return JSON.stringify(validatedQuestions);
      }
    } catch (validationError) {
      console.error('❌ [JSON FIX] Validation failed:', validationError.message);
      
      // Last resort: try to extract complete question objects manually
      try {
        const completeQuestions = extractCompleteQuestions(fixedJson);
        if (completeQuestions.length > 0) {
          console.log(`🔧 [JSON FIX] Extracted ${completeQuestions.length} complete questions manually`);
          return JSON.stringify(completeQuestions);
        }
      } catch (extractError) {
        console.error('❌ [JSON FIX] Manual extraction failed:', extractError.message);
      }
    }
    
    return fixedJson;
  } catch (error) {
    console.error('❌ [JSON FIX] Failed to fix malformed JSON:', error.message);
    return null;
  }
}

// Helper function to manually extract complete question objects from malformed JSON
function extractCompleteQuestions(jsonText) {
  try {
    const questions = [];
    
    // Try multiple patterns to extract complete questions
    const patterns = [
      // Pattern 1: Simple question objects
      /\{[^{}]*"id"[^{}]*\}/g,
      // Pattern 2: Questions with nested objects (followUpQuestions)
      /\{[^{}]*"id"[^{}]*"followUpQuestions"[^{}]*\}/g,
      // Pattern 3: More complex nested structures
      /\{[^{}]*"id"[^{}]*"followUpQuestions"[^{}]*\[[^\]]*\][^{}]*\}/g
    ];
    
    for (const pattern of patterns) {
      const questionMatches = jsonText.match(pattern);
      if (questionMatches) {
        for (const match of questionMatches) {
          try {
            const question = JSON.parse(match);
            if (question.id && question.question) {
              // Ensure all required fields exist
              const completeQuestion = {
                id: question.id,
                type: question.type || 'behavioral', // Changed from 'technical' to 'behavioral' as default
                question: question.question,
                expectedAnswer: question.expectedAnswer || 'Look for relevant experience and skills',
                timeLimit: question.timeLimit || 3,
                difficulty: question.difficulty || 'medium',
                followUpQuestions: question.followUpQuestions || []
              };
              
              // Check if we already have this question (avoid duplicates)
              if (!questions.find(q => q.id === completeQuestion.id)) {
                questions.push(completeQuestion);
              }
            }
          } catch (parseError) {
            console.log(`⚠️ [EXTRACT] Skipping malformed question: ${parseError.message}`);
          }
        }
      }
    }
    
    // If we still don't have enough questions, try a more aggressive approach
    if (questions.length < 3) {
      const aggressiveMatches = jsonText.match(/\{[^{}]*"question"[^{}]*\}/g);
      if (aggressiveMatches) {
        for (const match of aggressiveMatches) {
          try {
            const question = JSON.parse(match);
            if (question.question && question.question.length > 10) {
              const completeQuestion = {
                id: question.id || `q_${questions.length + 1}`,
                type: question.type || 'behavioral', // Changed from 'technical' to 'behavioral' as default
                question: question.question,
                expectedAnswer: question.expectedAnswer || 'Look for relevant experience and skills',
                timeLimit: question.timeLimit || 3,
                difficulty: question.difficulty || 'medium',
                followUpQuestions: question.followUpQuestions || []
              };
              
              if (!questions.find(q => q.id === completeQuestion.id)) {
                questions.push(completeQuestion);
              }
            }
          } catch (parseError) {
            console.log(`⚠️ [EXTRACT] Skipping malformed question: ${parseError.message}`);
          }
        }
      }
    }
    
    return questions;
  } catch (error) {
    console.error('❌ [EXTRACT] Failed to extract questions:', error.message);
    return [];
  }
}

// Helper function to validate and fix individual question objects
function validateAndFixQuestion(question, index) {
  try {
    // Ensure required fields exist
    if (!question || typeof question !== 'object') {
      console.log(`⚠️ [QUESTION VALIDATE] Invalid question at index ${index}, skipping`);
      return null;
    }
    
    // Fix missing or invalid fields
    const fixedQuestion = {
      id: question.id || `q_${index + 1}`,
      type: question.type || 'behavioral', // Changed from 'technical' to 'behavioral' as default
      question: question.question || 'Please describe your experience and approach to this challenge.',
      expectedAnswer: question.expectedAnswer || 'Look for relevant experience and skills',
      timeLimit: question.timeLimit || 3,
      difficulty: question.difficulty || 'medium',
      followUpQuestions: question.followUpQuestions || []
    };
    
    // Validate question text
    if (!fixedQuestion.question || fixedQuestion.question.trim().length < 10) {
      console.log(`⚠️ [QUESTION VALIDATE] Question text too short at index ${index}, skipping`);
      return null;
    }
    
    // Validate expected answer
    if (!fixedQuestion.expectedAnswer || fixedQuestion.expectedAnswer.trim().length < 5) {
      fixedQuestion.expectedAnswer = 'Look for relevant and thoughtful response';
    }
    
    return fixedQuestion;
  } catch (error) {
    console.error(`❌ [QUESTION VALIDATE] Error validating question at index ${index}:`, error.message);
    return null;
  }
}

// Helper function to generate better fallback questions when AI fails
function generateFallbackQuestions(jobDetails, roundType, questionCount = 5) {
  const jobTitle = jobDetails.title || 'Software Developer';
  const isDeveloper = jobTitle.toLowerCase().includes('developer') || 
                     jobTitle.toLowerCase().includes('engineer') || 
                     jobTitle.toLowerCase().includes('programmer');
  
  const questions = [];
  
  const questionVariations = {
    introduction: [
      `Tell me about your experience with ${jobTitle} and what interests you about this specific role.`,
      `What specific projects have you worked on that are relevant to ${jobTitle}?`,
      `How do you stay updated with the latest trends and technologies in ${jobTitle}?`,
      `What are your career goals and how does this ${jobTitle} position align with them?`,
      `What questions do you have about this ${jobTitle} role and our company?`
    ],
    technical: isDeveloper ? [
      `What are the key technical skills and technologies you would use for a ${jobTitle} project?`,
      `How would you approach debugging a complex issue in a ${jobTitle} application?`,
      `What is your experience with version control systems and collaborative development?`,
      `How do you ensure code quality and maintainability in your projects?`,
      `What development methodologies and practices do you follow?`
    ] : [
      `What are the key skills and knowledge areas required for success in a ${jobTitle} role?`,
      `How would you approach solving a complex problem in your field?`,
      `What tools and technologies do you use in your daily work?`,
      `How do you stay current with industry trends and best practices?`,
      `What methodologies and processes do you follow in your work?`
    ],
    coding: isDeveloper ? [
      `Describe your approach to solving a complex technical problem in ${jobTitle} development.`,
      `How would you implement a specific feature or functionality in a ${jobTitle} project?`,
      `What debugging techniques do you use when troubleshooting ${jobTitle} applications?`,
      `How would you optimize the performance of a ${jobTitle} application?`,
      `Describe a challenging coding problem you solved and your approach.`
    ] : [
      `How would you approach solving a complex challenge in your field of expertise?`,
      `Describe a time when you had to analyze a complex problem and find a solution.`,
      `What analytical tools and methods do you use in your work?`,
      `How would you approach optimizing a process or workflow?`,
      `Describe a challenging project you managed and how you ensured success.`
    ],
    advanced: isDeveloper ? [
      `How would you optimize the performance and scalability of a ${jobTitle} application?`,
      `What are the key challenges you've faced in ${jobTitle} projects and how did you overcome them?`,
      `How would you design a scalable solution for a ${jobTitle} system?`,
      `What security considerations are important in ${jobTitle} work?`,
      `How do you stay updated with the latest trends and technologies in ${jobTitle}?`
    ] : [
      `What advanced concepts and best practices are important in your field?`,
      `How would you approach implementing a complex solution in your area of expertise?`,
      `What are the key challenges in your field and how do you address them?`,
      `How would you design a scalable and efficient process or system?`,
      `What advanced tools and techniques do you use to solve complex problems?`
    ],
    behavioral: [
      `Tell me about a challenging project you worked on and how you overcame the obstacles.`,
      `Describe a time when you had to work with a difficult team member or stakeholder.`,
      `Tell me about a time when you had to learn a new technology or skill quickly.`,
      `Describe a situation where you had to meet a tight deadline.`,
      `Tell me about a mistake you made and how you handled it.`
    ],
    final: [
      `What questions do you have about this ${jobTitle} role and our company?`,
      `What do you consider your greatest strength as a professional?`,
      `What area would you like to improve or develop further?`,
      `Why do you want to work with our company specifically?`,
      `Is there anything else you'd like us to know about you?`
    ],
    // Sales-specific question types
    sales: [
      `How do you approach identifying and qualifying potential customers?`,
      `What strategies do you use to build rapport with prospects?`,
      `How do you handle cold calling and initial outreach?`,
      `What's your process for understanding customer needs and pain points?`,
      `How do you prioritize your sales activities and manage your pipeline?`
    ],
    objection_handling: [
      `How do you handle price objections from potential customers?`,
      `What's your approach when a prospect says they need to think about it?`,
      `How do you deal with competitors being mentioned during sales conversations?`,
      `What do you do when a customer says they don't have budget?`,
      `How do you handle objections about timing or urgency?`
    ],
    closing: [
      `What closing techniques do you find most effective?`,
      `How do you recognize when a prospect is ready to buy?`,
      `What's your approach to creating urgency without being pushy?`,
      `How do you handle last-minute objections during the closing process?`,
      `What do you do when a deal stalls or goes silent?`
    ],
    relationship_building: [
      `How do you build long-term relationships with clients?`,
      `What's your approach to maintaining contact with prospects over time?`,
      `How do you handle difficult or demanding customers?`,
      `What strategies do you use for account management and retention?`,
      `How do you turn one-time buyers into repeat customers?`
    ],
    presentation: [
      `How do you structure a sales presentation to maximize impact?`,
      `What tools and techniques do you use during product demonstrations?`,
      `How do you adapt your presentation style to different audiences?`,
      `What's your approach to handling questions during presentations?`,
      `How do you measure the effectiveness of your sales presentations?`
    ],
    role_play: [
      `How would you handle a prospect who is skeptical about your product?`,
      `What would you do if a customer asked for a discount you can't provide?`,
      `How would you approach a decision-maker who seems uninterested?`,
      `What's your strategy for dealing with a prospect who keeps postponing meetings?`,
      `How would you handle a situation where a competitor is already involved?`
    ]
  };

  const expectedAnswers = {
    introduction: "Look for relevant experience, skills, and motivation for this role",
    technical: isDeveloper ? "Look for understanding of relevant technologies, frameworks, and development practices" : "Look for understanding of role-specific competencies and industry knowledge",
    coding: isDeveloper ? "Look for problem-solving methodology, technical knowledge, and practical experience" : "Look for analytical thinking, problem-solving approach, and relevant experience",
    advanced: isDeveloper ? "Look for understanding of performance optimization, scalability patterns, and best practices" : "Look for deep knowledge of advanced topics and industry best practices",
    behavioral: "Look for problem-solving skills, resilience, and learning from challenges",
    final: "Look for engagement, research about the company, and thoughtful questions",
    // Sales-specific expected answers
    sales: "Look for sales methodology, prospecting techniques, and customer qualification skills",
    objection_handling: "Look for objection handling techniques, persistence, and problem-solving approach",
    closing: "Look for closing techniques, urgency creation, and deal progression skills",
    relationship_building: "Look for relationship management, communication skills, and customer retention strategies",
    presentation: "Look for presentation skills, audience adaptation, and persuasive communication",
    role_play: "Look for practical sales experience, quick thinking, and real-world application"
  };

  const questionTypes = {
    introduction: "behavioral",
    technical: "technical",
    coding: "interactive-coding",
    advanced: "technical",
    behavioral: "behavioral",
    final: "summary",
    // Sales-specific question types
    sales: "sales",
    objection_handling: "objection_handling",
    closing: "closing",
    relationship_building: "relationship_building",
    presentation: "presentation",
    role_play: "role_play"
  };

  for (let i = 1; i <= questionCount; i++) {
    const questionList = questionVariations[roundType] || questionVariations.introduction;
    const question = questionList[(i - 1) % questionList.length]; // Cycle through available questions
    const expectedAnswer = expectedAnswers[roundType] || expectedAnswers.introduction;
    const type = questionTypes[roundType] || questionTypes.introduction;
    
    questions.push({
      id: `q_${i}`,
      type: type,
      question: question,
      expectedAnswer: expectedAnswer,
      timeLimit: 3,
      difficulty: "medium",
      followUpQuestions: []
    });
  }
  
  return questions;
}

// Helper function to determine round type based on title and round number
function getRoundType(roundTitle, roundNumber) {
  const title = roundTitle.toLowerCase();
  
  // Sales-specific round types
  if (title.includes('sales') || title.includes('selling') || title.includes('prospecting') || title.includes('lead generation')) {
    return 'sales';
  } else if (title.includes('objection') || title.includes('handling') || title.includes('negotiation')) {
    return 'objection_handling';
  } else if (title.includes('closing') || title.includes('deal') || title.includes('conversion')) {
    return 'closing';
  } else if (title.includes('relationship') || title.includes('client') || title.includes('customer')) {
    return 'relationship_building';
  } else if (title.includes('presentation') || title.includes('demo') || title.includes('pitch')) {
    return 'presentation';
  } else if (title.includes('role-play') || title.includes('scenario') || title.includes('simulation')) {
    return 'role_play';
  }
  
  // Generic round types
  if (title.includes('introduction') || title.includes('background') || roundNumber === 1) {
    return 'introduction';
  } else if (title.includes('technical') || title.includes('fundamentals') || roundNumber === 2) {
    return 'technical';
  } else if (title.includes('coding') || title.includes('interactive') || roundNumber === 3) {
    return 'coding';
  } else if (title.includes('advanced') || title.includes('complex') || roundNumber === 4) {
    return 'advanced';
  } else if (title.includes('behavioral') || title.includes('soft skills') || roundNumber === 5) {
    return 'behavioral';
  } else if (title.includes('final') || title.includes('assessment') || title.includes('decision') || roundNumber === 6) {
    return 'final';
  } else {
    return 'behavioral'; // Default fallback
  }
}

// Helper function to extract basic title from user prompt
function extractBasicTitle(prompt) {
  // Look for common patterns in the prompt
  const titlePatterns = [
    /(?:for|of|as a|as an)\s+([a-zA-Z\s]+?)(?:\s+developer|\s+engineer|\s+manager|\s+analyst|\s+designer|\s+specialist|\s+coordinator|\s+director|\s+lead|\s+senior|\s+junior|\s+position|\s+role|\s+job)/i,
    /(?:hiring|looking for|need)\s+([a-zA-Z\s]+?)(?:\s+developer|\s+engineer|\s+manager|\s+analyst|\s+designer|\s+specialist|\s+coordinator|\s+director|\s+lead|\s+senior|\s+junior|\s+position|\s+role|\s+job)/i,
    /(?:title|position|role):\s*([a-zA-Z\s]+?)(?:\n|$)/i,
    /([A-Z][a-zA-Z\s]+?)(?:\s+developer|\s+engineer|\s+manager|\s+analyst|\s+designer|\s+specialist|\s+coordinator|\s+director|\s+lead|\s+senior|\s+junior)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: extract first few words that look like a job title
  const words = prompt.split(/\s+/).slice(0, 5);
  return words.join(' ') || 'Software Developer';
}

// Helper function to ensure exactly 6 rounds with 5 questions each
function ensureSixRounds(interviewData, jobDetails) {
  console.log('🔧 [ENSURE SIX ROUNDS] Starting validation and correction...');
  
  if (!interviewData || !interviewData.rounds) {
    console.log('⚠️ [ENSURE SIX ROUNDS] No rounds found, creating default structure...');
    return createDefaultInterviewStructure(jobDetails);
  }
  
  const rounds = interviewData.rounds;
  console.log(`📊 [ENSURE SIX ROUNDS] Current rounds: ${rounds.length}`);
  
  // Ensure we have exactly 6 rounds
  while (rounds.length < 6) {
    const roundNumber = rounds.length + 1;
    console.log(`➕ [ENSURE SIX ROUNDS] Adding missing round ${roundNumber}...`);
    
    rounds.push({
      roundId: `round_${roundNumber}`,
      roundNumber: roundNumber,
      title: `Round ${roundNumber}`,
      description: `Assessment round ${roundNumber}`,
      duration: 15,
      questions: [
        {
          id: `q${roundNumber}_1`,
          type: "behavioral",
          question: `Tell me about your experience relevant to this ${jobDetails.title || 'position'}.`,
          expectedAnswer: "Look for relevant experience and skills",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        }
      ]
    });
  }
  
  // Remove excess rounds if more than 6
  if (rounds.length > 6) {
    console.log(`➖ [ENSURE SIX ROUNDS] Removing excess rounds, keeping only first 6...`);
    rounds.splice(6);
  }
  
  // Ensure each round has exactly 5 questions
  rounds.forEach((round, index) => {
    if (!round.questions) {
      round.questions = [];
    }
    
    const currentQuestions = round.questions.length;
    console.log(`📝 [ENSURE SIX ROUNDS] Round ${index + 1} has ${currentQuestions} questions`);
    
    // Add questions if less than 5
    while (round.questions.length < 5) {
      const questionNumber = round.questions.length + 1;
      const roundType = getRoundType(round.title, index + 1);
      console.log(`🔧 [ENSURE SIX ROUNDS] Adding question ${questionNumber} for round ${index + 1} (${roundType})`);
      
      const fallbackQuestions = generateFallbackQuestions(jobDetails, roundType, 1);
      
      if (fallbackQuestions.length > 0) {
        const question = fallbackQuestions[0];
        question.id = `q${index + 1}_${questionNumber}`;
        console.log(`✅ [ENSURE SIX ROUNDS] Added fallback question: ${question.question.substring(0, 50)}...`);
        round.questions.push(question);
      } else {
        // Ultimate fallback
        console.log(`⚠️ [ENSURE SIX ROUNDS] Using ultimate fallback for round ${index + 1}`);
        round.questions.push({
          id: `q${index + 1}_${questionNumber}`,
          type: "behavioral",
          question: `Tell me about your experience with ${jobDetails.title || 'this role'} and how it relates to the specific requirements of this position.`,
          expectedAnswer: "Look for relevant experience, skills, and understanding of the role requirements",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        });
      }
    }
    
    // Remove excess questions if more than 5
    if (round.questions.length > 5) {
      round.questions.splice(5);
    }
  });
  
  console.log('✅ [ENSURE SIX ROUNDS] Validation complete - 6 rounds with 5 questions each');
  return interviewData;
}

// Helper function to create default interview structure
function createDefaultInterviewStructure(jobDetails) {
  console.log('🏗️ [DEFAULT STRUCTURE] Creating default interview structure...');
  
  const rounds = [];
  for (let i = 1; i <= 6; i++) {
    const questions = [];
    for (let j = 1; j <= 5; j++) {
      questions.push({
        id: `q${i}_${j}`,
        type: "behavioral",
        question: `Tell me about your experience with ${jobDetails.title || 'this role'}.`,
        expectedAnswer: "Look for relevant experience and skills",
        timeLimit: 3,
        difficulty: "easy",
        followUpQuestions: []
      });
    }
    
    rounds.push({
      roundId: `round_${i}`,
      roundNumber: i,
      title: `Round ${i}`,
      description: `Assessment round ${i}`,
      duration: 15,
      questions: questions
    });
  }
  
  return {
    interviewId: `interview_${Date.now()}`,
    title: `AI Interview - ${jobDetails.title || 'Position'}`,
    totalDuration: 90,
    rounds: rounds
  };
}

// Helper function to create complete offline interview structure
function createOfflineInterviewStructure(jobDetails) {
  console.log('🔄 [OFFLINE STRUCTURE] Creating complete offline interview structure...');
  
  const jobTitle = jobDetails.title || 'Software Developer';
  const isDeveloper = jobTitle.toLowerCase().includes('developer') || 
                     jobTitle.toLowerCase().includes('engineer') || 
                     jobTitle.toLowerCase().includes('programmer');
  
  const rounds = [
    {
      roundId: "round_1",
      roundNumber: 1,
      title: "Introduction & Background",
      description: "Assess candidate's background and motivation for this specific role",
      duration: 15,
      questions: [
        {
          id: "q1_1",
          type: "behavioral",
          question: `Tell me about your experience with ${jobTitle} and what interests you about this position.`,
          expectedAnswer: "Look for relevant experience, skills, and career progression specific to this role",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_2",
          type: "behavioral",
          question: `What specific projects have you worked on that are relevant to ${jobTitle}?`,
          expectedAnswer: "Look for relevant project experience and technical skills",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_3",
          type: "behavioral",
          question: `How do you stay updated with the latest trends and technologies in ${jobTitle}?`,
          expectedAnswer: "Look for continuous learning and professional development",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_4",
          type: "behavioral",
          question: `What are your career goals and how does this ${jobTitle} position align with them?`,
          expectedAnswer: "Look for career motivation and alignment with the role",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_5",
          type: "behavioral",
          question: `What questions do you have about this ${jobTitle} role and our company?`,
          expectedAnswer: "Look for engagement and interest in the position",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        }
      ]
    },
    {
      roundId: "round_2",
      roundNumber: 2,
      title: "Technical Fundamentals",
      description: "Evaluate technical skills and practical applications specific to this role",
      duration: 25,
      questions: isDeveloper ? [
        {
          id: "q2_1",
          type: "technical",
          question: `What are the key technical skills required for a ${jobTitle} role?`,
          expectedAnswer: "Look for understanding of core technologies and frameworks relevant to this role",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_2",
          type: "technical",
          question: `How would you approach debugging a complex issue in a ${jobTitle} application?`,
          expectedAnswer: "Look for systematic debugging approach and problem-solving skills",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_3",
          type: "technical",
          question: `What is your experience with version control systems and collaborative development?`,
          expectedAnswer: "Look for Git knowledge and team collaboration experience",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_4",
          type: "technical",
          question: `How do you ensure code quality and maintainability in your projects?`,
          expectedAnswer: "Look for testing, code review, and best practices knowledge",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_5",
          type: "technical",
          question: `What development methodologies and practices do you follow?`,
          expectedAnswer: "Look for Agile, DevOps, and modern development practices knowledge",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        }
      ] : [
        {
          id: "q2_1",
          type: "technical",
          question: `What are the key skills and knowledge required for a ${jobTitle} role?`,
          expectedAnswer: "Look for understanding of core competencies relevant to this role",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_2",
          type: "technical",
          question: `How would you approach solving a complex problem in your field?`,
          expectedAnswer: "Look for systematic problem-solving approach and analytical skills",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_3",
          type: "technical",
          question: `What tools and technologies do you use in your daily work?`,
          expectedAnswer: "Look for relevant tool knowledge and practical experience",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_4",
          type: "technical",
          question: `How do you stay current with industry trends and best practices?`,
          expectedAnswer: "Look for continuous learning and professional development",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q2_5",
          type: "technical",
          question: `What methodologies and processes do you follow in your work?`,
          expectedAnswer: "Look for structured approach and process knowledge",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: []
        }
      ]
    },
    {
      roundId: "round_3",
      roundNumber: 3,
      title: "Interactive Coding Round",
      description: "Hands-on coding challenge to assess practical skills",
      duration: 30,
      questions: isDeveloper ? [
        {
          id: "q3_1",
          type: "interactive-coding",
          question: `Create a simple function that demonstrates your programming skills relevant to ${jobTitle}. I'll guide you through improvements and optimizations.`,
          expectedAnswer: "AI will review code, suggest improvements, ask for modifications, and guide through iterations",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: [
            "How would you optimize this code for better performance?",
            "What edge cases should we consider?",
            "How would you test this function?",
            "What improvements would you make to this solution?"
          ]
        },
        {
          id: "q3_2",
          type: "interactive-coding",
          question: `Implement a data structure or algorithm that would be useful in a ${jobTitle} project.`,
          expectedAnswer: "AI will review implementation and discuss trade-offs",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: [
            "What are the time and space complexities?",
            "How would you handle edge cases?",
            "What alternative approaches could you use?",
            "How would you integrate this into a larger system?"
          ]
        },
        {
          id: "q3_3",
          type: "interactive-coding",
          question: `Build a small component or module that demonstrates your understanding of ${jobTitle} best practices.`,
          expectedAnswer: "AI will review code structure and suggest improvements",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: [
            "How would you make this more maintainable?",
            "What design patterns could improve this?",
            "How would you handle error cases?",
            "What documentation would you add?"
          ]
        }
      ] : [
        {
          id: "q3_1",
          type: "interactive-coding",
          question: `Create a simple solution that demonstrates your skills relevant to ${jobTitle}. I'll guide you through improvements.`,
          expectedAnswer: "AI will review solution and suggest improvements",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: [
            "How would you improve this solution?",
            "What considerations should we make?",
            "How would you validate this approach?",
            "What enhancements would you suggest?"
          ]
        },
        {
          id: "q3_2",
          type: "interactive-coding",
          question: `Design a process or workflow that would be useful in a ${jobTitle} role.`,
          expectedAnswer: "AI will review design and discuss improvements",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: [
            "What are the key steps in this process?",
            "How would you handle exceptions?",
            "What tools would support this workflow?",
            "How would you measure success?"
          ]
        },
        {
          id: "q3_3",
          type: "interactive-coding",
          question: `Create a practical example that demonstrates your expertise in ${jobTitle}.`,
          expectedAnswer: "AI will review example and suggest enhancements",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: [
            "How would you scale this solution?",
            "What challenges might arise?",
            "How would you measure effectiveness?",
            "What improvements would you make?"
          ]
        }
      ]
    },
    {
      roundId: "round_4",
      roundNumber: 4,
      title: "Advanced Technical Questions",
      description: "Assess advanced knowledge and problem-solving abilities",
      duration: 20,
      questions: [
        {
          id: "q4_1",
          type: "technical",
          question: `How would you approach optimizing performance in a ${jobTitle} project?`,
          expectedAnswer: "Look for performance optimization strategies and monitoring approaches",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: []
        },
        {
          id: "q4_2",
          type: "technical",
          question: `What are the key challenges you've faced in ${jobTitle} projects and how did you overcome them?`,
          expectedAnswer: "Look for problem-solving experience and learning from challenges",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: []
        },
        {
          id: "q4_3",
          type: "technical",
          question: `How would you design a scalable solution for a ${jobTitle} system?`,
          expectedAnswer: "Look for system design thinking and scalability considerations",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: []
        },
        {
          id: "q4_4",
          type: "technical",
          question: `What security considerations are important in ${jobTitle} work?`,
          expectedAnswer: "Look for security awareness and best practices knowledge",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: []
        },
        {
          id: "q4_5",
          type: "technical",
          question: `How do you stay updated with the latest trends and technologies in ${jobTitle}?`,
          expectedAnswer: "Look for continuous learning and professional development",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: []
        }
      ]
    },
    {
      roundId: "round_5",
      roundNumber: 5,
      title: "Behavioral & Soft Skills",
      description: "Evaluate communication, teamwork, and problem-solving approach",
      duration: 15,
      questions: [
        {
          id: "q5_1",
          type: "behavioral",
          question: "Tell me about a time when you had to work with a difficult team member or stakeholder.",
          expectedAnswer: "Assess conflict resolution and interpersonal skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q5_2",
          type: "behavioral",
          question: "Describe a situation where you had to learn a new technology or skill quickly.",
          expectedAnswer: "Look for adaptability and learning agility",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q5_3",
          type: "behavioral",
          question: "Tell me about a project where you had to meet a tight deadline.",
          expectedAnswer: "Assess time management and pressure handling",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q5_4",
          type: "behavioral",
          question: "Describe a time when you had to explain a complex technical concept to a non-technical person.",
          expectedAnswer: "Look for communication and teaching skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: []
        },
        {
          id: "q5_5",
          type: "behavioral",
          question: "Tell me about a mistake you made and how you handled it.",
          expectedAnswer: "Assess accountability and learning from failures",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: []
        }
      ]
    },
    {
      roundId: "round_6",
      roundNumber: 6,
      title: "Final Assessment & Decision",
      description: "Discuss strengths, areas for improvement, and next steps",
      duration: 10,
      questions: [
        {
          id: "q6_1",
          type: "summary",
          question: "What do you consider your greatest strength as a professional?",
          expectedAnswer: "Allow candidate to highlight key strengths",
          timeLimit: 2,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q6_2",
          type: "summary",
          question: "What area would you like to improve or develop further?",
          expectedAnswer: "Look for self-awareness and growth mindset",
          timeLimit: 2,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q6_3",
          type: "summary",
          question: "Why do you want to work with our company specifically?",
          expectedAnswer: "Assess motivation and company research",
          timeLimit: 2,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q6_4",
          type: "summary",
          question: "What questions do you have about the role, team, or company?",
          expectedAnswer: "Look for engagement and thoughtful questions",
          timeLimit: 2,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q6_5",
          type: "summary",
          question: "Is there anything else you'd like us to know about you?",
          expectedAnswer: "Allow candidate to highlight additional strengths",
          timeLimit: 2,
          difficulty: "easy",
          followUpQuestions: []
        }
      ]
    }
  ];
  
  return {
    interviewId: `interview_${Date.now()}`,
    title: `Comprehensive Interview - ${jobTitle}`,
    totalDuration: 115,
    rounds: rounds
  };
}

// Helper function to detect technologies from job details
function detectTechnologies(jobDetails) {
  const text = `${jobDetails.title} ${jobDetails.description} ${jobDetails.requirements}`.toLowerCase();
  
  const technologies = {
    languages: [],
    frameworks: [],
    databases: [],
    tools: []
  };
  
  // Enhanced language detection
  const languages = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab',
    'html', 'css', 'sql', 'bash', 'powershell', 'perl', 'lua', 'dart', 'clojure', 'haskell', 'erlang', 'elixir'
  ];
  languages.forEach(lang => {
    if (text.includes(lang)) {
      technologies.languages.push(lang);
    }
  });
  
  // Enhanced framework detection
  const frameworks = [
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'fastapi', 'next.js', 'nuxt.js',
    'svelte', 'ember', 'backbone', 'jquery', 'bootstrap', 'tailwind', 'material-ui', 'antd', 'chakra', 'styled-components',
    'nestjs', 'koa', 'hapi', 'sails', 'meteor', 'feathers', 'strapi', 'prisma', 'sequelize', 'mongoose',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly'
  ];
  frameworks.forEach(framework => {
    if (text.includes(framework)) {
      technologies.frameworks.push(framework);
    }
  });
  
  // Enhanced database detection
  const databases = [
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'cassandra', 'elasticsearch', 'dynamodb',
    'maria', 'couchdb', 'neo4j', 'influxdb', 'timescaledb', 'cockroachdb', 'planetscale', 'supabase', 'firebase', 'airtable'
  ];
  databases.forEach(db => {
    if (text.includes(db)) {
      technologies.databases.push(db);
    }
  });
  
  // Enhanced tool detection
  const tools = [
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'jenkins', 'terraform', 'ansible', 'grafana', 'prometheus',
    'circleci', 'github actions', 'gitlab ci', 'travis ci', 'bamboo', 'teamcity', 'sonarqube', 'snyk', 'veracode',
    'nginx', 'apache', 'haproxy', 'varnish', 'cloudflare', 'fastly', 'datadog', 'newrelic', 'sentry', 'rollbar',
    'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'invision', 'zeplin', 'framer', 'principle'
  ];
  tools.forEach(tool => {
    if (text.includes(tool)) {
      technologies.tools.push(tool);
    }
  });
  
  return technologies;
}

// Helper function to generate role-specific technical questions dynamically
async function generateRoleSpecificTechnicalQuestions(jobDetails) {
  const technologies = detectTechnologies(jobDetails);
  
  // Create a comprehensive prompt for AI to generate questions
  const prompt = `You are an expert technical interviewer. Generate exactly 5 technical interview questions for this SPECIFIC job position. Analyze the job description carefully and create questions that are tailored to the exact technologies, frameworks, and requirements mentioned.

Job Title: ${jobDetails.title}
Job Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

Detected Technologies:
- Languages: ${technologies.languages.join(', ') || 'Not specified'}
- Frameworks: ${technologies.frameworks.join(', ') || 'Not specified'}
- Databases: ${technologies.databases.join(', ') || 'Not specified'}
- Tools: ${technologies.tools.join(', ') || 'Not specified'}

CRITICAL INSTRUCTIONS:
1. Create questions that are SPECIFIC to this exact role, not generic technical questions
2. If the job mentions React, ask about React concepts, not just JavaScript
3. If the job mentions Python, ask about Python-specific features, not just programming
4. If the job mentions AWS, ask about AWS services, not just cloud concepts
5. If the job mentions Docker, ask about containerization, not just DevOps
6. Make questions appropriate for the role level (${jobDetails.level || 'mid'}-level)
7. Focus on the specific technologies and tools mentioned in the job description

Examples of SPECIFIC vs GENERIC questions:
- GENERIC: "What is object-oriented programming?"
- SPECIFIC for React Developer: "Explain the difference between React functional components and class components, and when would you use each?"

- GENERIC: "What is a database?"
- SPECIFIC for Python Developer: "How would you use SQLAlchemy ORM in Python to handle database relationships and migrations?"

Generate 5 technical questions that are:
1. SPECIFIC to the technologies mentioned in the job description
2. Appropriate for the role level (${jobDetails.level || 'mid'}-level)
3. Cover fundamental concepts that a candidate should know for THIS specific role
4. Mix of easy, medium, and hard difficulty levels
5. Focus on practical knowledge and understanding of the specific technologies

Return ONLY a valid JSON array with this exact format:
[
  {
    "id": "q2_1",
    "type": "technical",
    "question": "GENERATE SPECIFIC TECHNICAL QUESTION BASED ON JOB TECHNOLOGIES",
    "expectedAnswer": "GENERATE SPECIFIC EXPECTED ANSWER",
    "timeLimit": 3,
    "difficulty": "easy|medium|hard",
    "followUpQuestions": []
  }
]

Make sure each question is directly relevant to the specific technologies and role mentioned in the job description.`;

  try {
    const response = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Generate relevant, specific technical questions based on job requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const questions = parseAIResponse(response.data.choices[0].message.content);
    return questions;
  } catch (error) {
    console.error('Error generating dynamic technical questions:', error);
    // Fallback to basic questions
    return [
      {
        id: "q2_1",
        type: "technical",
        question: "Explain the concept of object-oriented programming.",
        expectedAnswer: "OOP uses objects with properties and methods, includes encapsulation, inheritance, polymorphism",
        timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
        id: "q2_2",
        type: "technical",
        question: "What is the difference between a stack and a queue?",
        expectedAnswer: "Stack is LIFO (Last In First Out), Queue is FIFO (First In First Out)",
            timeLimit: 3,
        difficulty: "easy",
            followUpQuestions: []
          },
          {
        id: "q2_3",
        type: "technical",
        question: "Explain the concept of recursion with an example.",
        expectedAnswer: "Function calling itself with a base case to prevent infinite loops",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
        id: "q2_4",
        type: "technical",
        question: "What is the difference between SQL and NoSQL databases?",
        expectedAnswer: "SQL is relational with structured schema, NoSQL is non-relational with flexible schema",
        timeLimit: 4,
        difficulty: "medium",
            followUpQuestions: []
          },
          {
        id: "q2_5",
        type: "technical",
        question: "Explain the concept of version control and its benefits.",
        expectedAnswer: "Tracks changes in code, enables collaboration, rollback capabilities, branching",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          }
    ];
  }
}

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
    // Generate ALL questions dynamically using AI
    const introductionQuestions = await generateIntroductionQuestions(jobDetails);
    const technicalQuestions = await generateRoleSpecificTechnicalQuestions(jobDetails);
    const codingQuestions = await generateRoleSpecificCodingQuestions(jobDetails);
    const advancedQuestions = await generateRoleSpecificAdvancedQuestions(jobDetails);
    const behavioralQuestions = await generateBehavioralQuestions(jobDetails);
    const finalQuestions = await generateFinalAssessmentQuestions(jobDetails);

    // Create 6 rounds with AI-generated questions
    const rounds = [
      {
        roundId: "round_1",
        roundNumber: 1,
        title: "Introduction & Background",
        description: "Assess candidate's background and motivation for this specific role",
        duration: 15,
        questions: introductionQuestions,
        evaluationCriteria: {
          background: "Relevant experience and qualifications",
          motivation: "Interest and alignment with the role",
          communication: "Clarity and professionalism"
        }
      },
      {
        roundId: "round_2",
        roundNumber: 2,
        title: "Technical Fundamentals",
        description: "Evaluate technical skills and practical applications specific to this role",
        duration: 20,
        questions: technicalQuestions,
        evaluationCriteria: {
          technical: "Technical knowledge and skills",
          problemSolving: "Analytical thinking and problem-solving approach",
          communication: "Ability to explain technical concepts"
        }
      },
      {
        roundId: "round_3",
        roundNumber: 3,
        title: "Interactive Coding Challenge",
        description: "Hands-on coding assessment with AI guidance",
        duration: 25,
        questions: codingQuestions,
        evaluationCriteria: {
          coding: "Programming skills and code quality",
          logic: "Problem-solving and algorithmic thinking",
          communication: "Code explanation and collaboration"
        }
      },
      {
        roundId: "round_4",
        roundNumber: 4,
        title: "Advanced Technical Assessment",
        description: "Deep dive into advanced technical concepts and system design",
        duration: 20,
        questions: advancedQuestions,
        evaluationCriteria: {
          advanced: "Advanced technical knowledge and expertise",
          design: "System design and architecture thinking",
          scalability: "Understanding of scalable solutions"
        }
      },
      {
        roundId: "round_5",
        roundNumber: 5,
        title: "Behavioral & Experience",
        description: "Assess behavioral competencies and past experience",
        duration: 15,
        questions: behavioralQuestions,
        evaluationCriteria: {
          experience: "Relevant past experience and achievements",
          behavior: "Behavioral competencies and soft skills",
          culture: "Cultural fit and team collaboration"
        }
      },
      {
        roundId: "round_6",
        roundNumber: 6,
        title: "Final Assessment & Decision",
        description: "Comprehensive evaluation and next steps discussion",
        duration: 10,
        questions: finalQuestions,
        evaluationCriteria: {
          overall: "Overall assessment and fit for the role",
          potential: "Growth potential and future contributions",
          decision: "Final evaluation and recommendation"
        }
      }
    ];

    return {
      interviewId,
      title: `AI Multi-Round Interview - ${jobDetails.title}`,
      totalDuration: rounds.reduce((total, round) => total + round.duration, 0),
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
      },
      company: jobDetails.company
    };
  } catch (error) {
    console.error('❌ [STRUCTURED INTERVIEW] Error generating AI questions:', error);
    
    // Fallback: Use AI-generated introduction questions only
    try {
      const fallbackQuestions = await generateIntroductionQuestions(jobDetails);
      return {
        interviewId,
        title: `AI Multi-Round Interview - ${jobDetails.title}`,
        totalDuration: 30,
        rounds: [
          {
            roundId: "round_1",
            roundNumber: 1,
            title: "Introduction & Background",
            description: "Assess candidate's background and motivation for this specific role",
            duration: 30,
            questions: fallbackQuestions,
            evaluationCriteria: {
              background: "Relevant experience and qualifications",
              motivation: "Interest and alignment with the role",
              communication: "Clarity and professionalism"
            }
          }
        ],
        overallEvaluationCriteria: {
          technical: "Overall technical competency and problem-solving skills",
          communication: "Clarity of communication and articulation abilities",
          experience: "Relevance and depth of professional experience"
        },
        scoringSystem: {
          excellent: "4",
          good: "3",
          satisfactory: "2",
          needsImprovement: "1"
        },
        company: jobDetails.company
      };
    } catch (fallbackError) {
      console.error('❌ [STRUCTURED INTERVIEW] Fallback also failed:', fallbackError);
      
      // Final fallback: Single hardcoded question
      return {
        interviewId,
        title: `AI Multi-Round Interview - ${jobDetails.title}`,
        totalDuration: 30,
        rounds: [
          {
            roundId: "round_1",
            roundNumber: 1,
            title: "Introduction & Background",
            description: "Assess candidate's background and motivation for this specific role",
            duration: 30,
            questions: [
              {
                id: "q1_1",
                type: "behavioral",
                question: "Tell me about yourself and your background relevant to this position.",
                expectedAnswer: "Look for relevant experience, skills, and career progression",
                timeLimit: 3,
                difficulty: "easy",
                followUpQuestions: []
              }
            ],
            evaluationCriteria: {
              background: "Relevant experience and qualifications",
              motivation: "Interest and alignment with the role",
              communication: "Clarity and professionalism"
            }
          }
        ],
        overallEvaluationCriteria: {
          technical: "Overall technical competency and problem-solving skills",
          communication: "Clarity of communication and articulation abilities",
          experience: "Relevance and depth of professional experience"
        },
        scoringSystem: {
          excellent: "4",
          good: "3",
          satisfactory: "2",
          needsImprovement: "1"
        },
        company: jobDetails.company
      };
    }
  }
}

// Approve interview endpoint
            expectedAnswer: "Look for understanding of sales KPIs and analytics",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        roundId: "round_3",
        roundNumber: 3,
        title: "Interactive Sales Role-play",
        description: "AI-guided sales demonstrations with real-time feedback",
        duration: 18,
        questions: [
          {
            id: "q3_1",
            type: "role_play",
            question: "Let's role-play a cold call. I'll be a skeptical prospect. How would you approach this?",
            expectedAnswer: "AI will guide through role-play and assess sales skills",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q3_2",
            type: "role_play",
            question: "Present your product to me as if I'm a decision-maker with budget constraints.",
            expectedAnswer: "AI will evaluate presentation skills and value proposition",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q3_3",
            type: "role_play",
            question: "I'm interested but need to think about it. How do you handle this situation?",
            expectedAnswer: "AI will assess objection handling and closing techniques",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q3_4",
            type: "role_play",
            question: "I'm comparing you with a competitor. How do you differentiate your offering?",
            expectedAnswer: "AI will evaluate competitive positioning and value communication",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q3_5",
            type: "role_play",
            question: "I'm ready to buy but want a discount. How do you handle this?",
            expectedAnswer: "AI will assess negotiation skills and value protection",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        roundId: "round_4",
        roundNumber: 4,
        title: "Objection Handling",
        description: "Test ability to overcome sales objections",
        duration: 10,
        questions: [
          {
            id: "q4_1",
            type: "objection_handling",
            question: "The customer says 'Your price is too high.' How do you respond?",
            expectedAnswer: "Look for value-based selling and objection handling techniques",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_2",
            type: "objection_handling",
            question: "The prospect says 'We need to think about it.' What's your approach?",
            expectedAnswer: "Look for urgency creation and next steps",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_3",
            type: "objection_handling",
            question: "The decision-maker says 'We don't have budget.' How do you handle this?",
            expectedAnswer: "Look for budget discovery and creative solutions",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_4",
            type: "objection_handling",
            question: "The customer says 'We're happy with our current solution.' How do you respond?",
            expectedAnswer: "Look for competitive positioning and change management",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_5",
            type: "objection_handling",
            question: "The prospect says 'This isn't the right time.' What do you do?",
            expectedAnswer: "Look for timing discovery and urgency creation",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        roundId: "round_5",
        roundNumber: 5,
        title: "Communication & Confidence",
        description: "Assess communication and confidence",
        duration: 8,
        questions: [
          {
            id: "q5_1",
            type: "behavioral",
            question: "Tell me about a time when you had to work with a difficult customer.",
            expectedAnswer: "Look for conflict resolution and customer service skills",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_2",
            type: "behavioral",
            question: "Describe a situation where you had to meet a challenging sales target.",
            expectedAnswer: "Look for goal achievement and persistence",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_3",
            type: "behavioral",
            question: "How do you handle rejection in sales?",
            expectedAnswer: "Look for resilience and positive mindset",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_4",
            type: "behavioral",
            question: "Tell me about a time when you had to learn a new product quickly.",
            expectedAnswer: "Look for learning ability and adaptability",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_5",
            type: "behavioral",
            question: "How do you stay motivated during slow sales periods?",
            expectedAnswer: "Look for self-motivation and positive attitude",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        roundId: "round_6",
        roundNumber: 6,
        title: "Final Assessment",
        description: "Wrap up interview and address candidate questions",
        duration: 10,
        questions: [
          {
            id: "q6_1",
            type: "summary",
            question: "What do you consider your greatest strength as a sales professional?",
            expectedAnswer: "Look for self-awareness and confidence",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q6_2",
            type: "summary",
            question: "What area of sales would you like to improve?",
            expectedAnswer: "Look for self-awareness and growth mindset",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q6_3",
            type: "summary",
            question: "How do you see yourself contributing to our sales team?",
            expectedAnswer: "Look for team orientation and value proposition",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q6_4",
            type: "summary",
            question: "What questions do you have about this sales role?",
            expectedAnswer: "Look for engagement and thoughtful questions",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q6_5",
            type: "summary",
            question: "Is there anything else you'd like us to know about you?",
            expectedAnswer: "Look for additional relevant information",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          }
        ]
      }
    ];
  } else {
    // For non-sales roles, use simple hardcoded questions
    console.log('🎯 [INTERVIEW GENERATE] Creating generic interview...');
    
    rounds = [
      {
        roundId: "round_1",
        roundNumber: 1,
        title: "Introduction",
        description: "Get to know the candidate",
        duration: 5,
        questions: [
          {
            id: "q1_1",
            type: "behavioral",
            question: "Tell me about yourself and your relevant experience.",
            expectedAnswer: "Look for relevant experience and skills",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_2",
            type: "behavioral",
            question: "What interests you about this role?",
            expectedAnswer: "Look for motivation and understanding",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_3",
            type: "behavioral",
            question: "What are your career goals?",
            expectedAnswer: "Look for career planning",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_4",
            type: "behavioral",
            question: "Why do you want to work here?",
            expectedAnswer: "Look for company research",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_5",
            type: "behavioral",
            question: "What questions do you have?",
            expectedAnswer: "Look for engagement",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          }
        ]
      }
    ];
  }
  
  // For sales interviews, use AI to generate dynamic questions based on job description
  if (jobDetails.title.toLowerCase().includes('sales')) {
    console.log('🎯 [INTERVIEW GENERATE] Creating sales interview with AI-generated questions...');
    console.log('🔍 [SALES INTERVIEW] Job details:', {
      title: jobDetails.title,
      description: jobDetails.description?.substring(0, 100) + '...',
      requirements: jobDetails.requirements?.substring(0, 100) + '...'
    });
    
    try {
      // Generate dynamic questions based on job description
      console.log('🔄 [SALES INTERVIEW] Generating introduction questions...');
      const introductionQuestions = await generateIntroductionQuestions(jobDetails);
      console.log('✅ [SALES INTERVIEW] Introduction questions generated:', introductionQuestions.length);
      
      console.log('🔄 [SALES INTERVIEW] Generating sales knowledge questions...');
      const salesKnowledgeQuestions = await generateSalesKnowledgeQuestions(jobDetails);
      console.log('✅ [SALES INTERVIEW] Sales knowledge questions generated:', salesKnowledgeQuestions.length);
      
      console.log('🔄 [SALES INTERVIEW] Generating sales role-play questions...');
      const salesRolePlayQuestions = await generateSalesRolePlayQuestions(jobDetails);
      console.log('✅ [SALES INTERVIEW] Sales role-play questions generated:', salesRolePlayQuestions.length);
      if (salesRolePlayQuestions.length > 0) {
        console.log('📝 [SALES INTERVIEW] Sample role-play question:', salesRolePlayQuestions[0]?.question?.substring(0, 100) + '...');
      }
      
      console.log('🔄 [SALES INTERVIEW] Generating objection handling questions...');
      const objectionHandlingQuestions = await generateObjectionHandlingQuestions(jobDetails);
      console.log('✅ [SALES INTERVIEW] Objection handling questions generated:', objectionHandlingQuestions.length);
      
      console.log('🔄 [SALES INTERVIEW] Generating behavioral questions...');
      const behavioralQuestions = await generateBehavioralQuestions(jobDetails);
      console.log('✅ [SALES INTERVIEW] Behavioral questions generated:', behavioralQuestions.length);
      
      console.log('🔄 [SALES INTERVIEW] Generating final questions...');
      const finalQuestions = await generateFinalAssessmentQuestions(jobDetails);
      console.log('✅ [SALES INTERVIEW] Final questions generated:', finalQuestions.length);
      
      rounds = [
        {
          roundId: "round_1",
          roundNumber: 1,
          title: "Self Introduction",
          description: "Get to know the candidate's sales background",
          duration: 5,
          questions: [
            {
              id: "q1_1",
              type: "behavioral",
              question: "Tell me about yourself and your sales experience.",
              expectedAnswer: "Look for relevant sales experience and achievements",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q1_2",
              type: "behavioral",
              question: "What interests you about this sales role?",
              expectedAnswer: "Look for motivation and understanding of the role",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q1_3",
              type: "behavioral",
              question: "What are your career goals in sales?",
              expectedAnswer: "Look for career planning and ambition",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q1_4",
              type: "behavioral",
              question: "Why do you want to work for our company?",
              expectedAnswer: "Look for research about the company and genuine interest",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q1_5",
              type: "behavioral",
              question: "What questions do you have about this sales position?",
              expectedAnswer: "Look for engagement and thoughtful questions",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_2",
          roundNumber: 2,
          title: "Sales Knowledge",
          description: "Assess fundamental sales knowledge",
          duration: 10,
          questions: [
            {
              id: "q2_1",
              type: "sales",
              question: "What is your approach to qualifying leads?",
              expectedAnswer: "Look for understanding of lead qualification process",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q2_2",
              type: "sales",
              question: "How do you build rapport with prospects?",
              expectedAnswer: "Look for relationship building skills",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q2_3",
              type: "sales",
              question: "What sales methodologies are you familiar with?",
              expectedAnswer: "Look for knowledge of sales processes and frameworks",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q2_4",
              type: "sales",
              question: "How do you handle cold calling?",
              expectedAnswer: "Look for prospecting techniques and persistence",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q2_5",
              type: "sales",
              question: "What metrics do you track to measure sales performance?",
              expectedAnswer: "Look for understanding of sales KPIs and analytics",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_3",
          roundNumber: 3,
          title: "Interactive Sales Role-play",
          description: "AI-guided sales demonstrations with real-time feedback",
          duration: 18,
          questions: [
            {
              id: "q3_1",
              type: "role_play",
              question: "Let's role-play a cold call. I'll be a skeptical prospect. How would you approach this?",
              expectedAnswer: "AI will guide through role-play and assess sales skills",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q3_2",
              type: "role_play",
              question: "Present your product to me as if I'm a decision-maker with budget constraints.",
              expectedAnswer: "AI will evaluate presentation skills and value proposition",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q3_3",
              type: "role_play",
              question: "I'm interested but need to think about it. How do you handle this situation?",
              expectedAnswer: "AI will assess objection handling and closing techniques",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q3_4",
              type: "role_play",
              question: "I'm comparing you with a competitor. How do you differentiate your offering?",
              expectedAnswer: "AI will evaluate competitive positioning and value communication",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q3_5",
              type: "role_play",
              question: "I'm ready to buy but want a discount. How do you handle this?",
              expectedAnswer: "AI will assess negotiation skills and value protection",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_4",
          roundNumber: 4,
          title: "Objection Handling",
          description: "Test ability to overcome sales objections",
          duration: 10,
          questions: [
            {
              id: "q4_1",
              type: "objection_handling",
              question: "The customer says 'Your price is too high.' How do you respond?",
              expectedAnswer: "Look for value-based selling and objection handling techniques",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q4_2",
              type: "objection_handling",
              question: "The prospect says 'We need to think about it.' What's your approach?",
              expectedAnswer: "Look for urgency creation and next steps",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q4_3",
              type: "objection_handling",
              question: "The decision-maker says 'We don't have budget.' How do you handle this?",
              expectedAnswer: "Look for budget discovery and creative solutions",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q4_4",
              type: "objection_handling",
              question: "The customer says 'We're happy with our current solution.' How do you respond?",
              expectedAnswer: "Look for competitive positioning and change management",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q4_5",
              type: "objection_handling",
              question: "The prospect says 'This isn't the right time.' What do you do?",
              expectedAnswer: "Look for timing discovery and urgency creation",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_5",
          roundNumber: 5,
          title: "Communication & Confidence",
          description: "Assess communication and confidence",
          duration: 8,
          questions: [
            {
              id: "q5_1",
              type: "behavioral",
              question: "Tell me about a time when you had to work with a difficult customer.",
              expectedAnswer: "Look for conflict resolution and customer service skills",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q5_2",
              type: "behavioral",
              question: "Describe a situation where you had to meet a challenging sales target.",
              expectedAnswer: "Look for goal achievement and persistence",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q5_3",
              type: "behavioral",
              question: "How do you handle rejection in sales?",
              expectedAnswer: "Look for resilience and positive mindset",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q5_4",
              type: "behavioral",
              question: "Tell me about a time when you had to learn a new product quickly.",
              expectedAnswer: "Look for learning ability and adaptability",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q5_5",
              type: "behavioral",
              question: "How do you stay motivated during slow sales periods?",
              expectedAnswer: "Look for self-motivation and positive attitude",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_6",
          roundNumber: 6,
          title: "Final Assessment",
          description: "Wrap up interview and address candidate questions",
          duration: 10,
          questions: [
            {
              id: "q6_1",
              type: "summary",
              question: "What do you consider your greatest strength as a sales professional?",
              expectedAnswer: "Look for self-awareness and confidence",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q6_2",
              type: "summary",
              question: "What area of sales would you like to improve?",
              expectedAnswer: "Look for self-awareness and growth mindset",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q6_3",
              type: "summary",
              question: "How do you see yourself contributing to our sales team?",
              expectedAnswer: "Look for team orientation and value proposition",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q6_4",
              type: "summary",
              question: "What questions do you have about this sales role?",
              expectedAnswer: "Look for engagement and thoughtful questions",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q6_5",
              type: "summary",
              question: "Is there anything else you'd like us to know about you?",
              expectedAnswer: "Look for additional relevant information",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            }
          ]
        }
      ];
    } catch (error) {
      console.error('❌ [SALES INTERVIEW] Error generating sales interview questions:', error);
      // Fallback to basic sales questions with all necessary rounds
      rounds = [
        {
          roundId: "round_1",
          roundNumber: 1,
          title: "Self Introduction",
          description: "Get to know the candidate's sales background",
          duration: 5,
          questions: [
            {
              id: "q1_1",
              type: "behavioral",
              question: "Tell me about your sales experience.",
              expectedAnswer: "Look for relevant experience",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            },
            {
              id: "q1_2",
              type: "behavioral",
              question: "What motivates you in sales?",
              expectedAnswer: "Look for motivation",
              timeLimit: 3,
              difficulty: "easy",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_2",
          roundNumber: 2,
          title: "Sales Knowledge",
          description: "Assess fundamental sales knowledge",
          duration: 10,
          questions: [
            {
              id: "q2_1",
              type: "sales",
              question: "What is your approach to qualifying leads?",
              expectedAnswer: "Look for understanding of lead qualification process",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q2_2",
              type: "sales",
              question: "How do you build rapport with prospects?",
              expectedAnswer: "Look for relationship building skills",
              timeLimit: 3,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_3",
          roundNumber: 3,
          title: "Interactive Sales Role-play",
          description: "Sales demonstrations with feedback",
          duration: 18,
          questions: [
            {
              id: "q3_1",
              type: "role_play",
              question: "Let's role-play a cold call. I'll be a skeptical prospect. How would you approach this?",
              expectedAnswer: "Look for approach and confidence",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q3_2",
              type: "role_play",
              question: "Present your product to me as if I'm a decision-maker with budget constraints.",
              expectedAnswer: "Look for value proposition and persuasion",
              timeLimit: 6,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        },
        {
          roundId: "round_4",
          roundNumber: 4,
          title: "Objection Handling",
          description: "Test ability to overcome sales objections",
          duration: 10,
          questions: [
            {
              id: "q4_1",
              type: "objection_handling",
              question: "The customer says 'Your price is too high.' How do you respond?",
              expectedAnswer: "Look for value-based selling and objection handling techniques",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            },
            {
              id: "q4_2",
              type: "objection_handling",
              question: "The prospect says 'We need to think about it.' What's your approach?",
              expectedAnswer: "Look for urgency creation and next steps",
              timeLimit: 4,
              difficulty: "medium",
              followUpQuestions: []
            }
          ]
        }
      ];
    }
  } else {
    // For non-sales roles, use simple hardcoded questions
    console.log('🎯 [INTERVIEW GENERATE] Creating generic interview...');
    
    rounds = [
      {
        roundId: "round_1",
        roundNumber: 1,
        title: "Introduction",
        description: "Get to know the candidate",
        duration: 5,
        questions: [
          {
            id: "q1_1",
            type: "behavioral",
            question: "Tell me about yourself and your relevant experience.",
            expectedAnswer: "Look for relevant experience and skills",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_2",
            type: "behavioral",
            question: "What interests you about this role?",
            expectedAnswer: "Look for motivation and understanding",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_3",
            type: "behavioral",
            question: "What are your career goals?",
            expectedAnswer: "Look for career planning",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_4",
            type: "behavioral",
            question: "Why do you want to work here?",
            expectedAnswer: "Look for company research",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_5",
            type: "behavioral",
            question: "What questions do you have?",
            expectedAnswer: "Look for engagement",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          }
        ]
      }
    ];
  }
  
  return {
    interviewId,
    title: `${jobDetails.title} Interview`,
    totalDuration: rounds.reduce((total, round) => total + round.duration, 0),
    rounds: rounds,
    jobTitle: jobDetails.title,
    jobDescription: jobDetails.description,
    jobRequirements: jobDetails.requirements,
    jobLevel: jobDetails.level,
    company: jobDetails.company
  };
}

// Helper function to create structured interview from text
async function createStructuredInterview(textResponse, jobDetails) {
  const interviewId = `interview_${Date.now()}`;
  
  // Check if this is a role-specific prompt
  const isRoleSpecificPrompt = textResponse.includes('**Introduction & Self Intro**') || 
                               textResponse.includes('**Self Introduction**') ||
                               textResponse.includes('**Coding Round**') ||
                               textResponse.  includes('**Sales Pitch/Role-play**');
  
  if (isRoleSpecificPrompt) {
    console.log('🎯 [INTERVIEW GENERATE] Using role-specific prompt structure');
    return await createRoleSpecificInterview(textResponse, jobDetails);
  }
  
  // For all cases, use AI to generate completely dynamic questions
  console.log('🤖 [STRUCTURED INTERVIEW] Generating all questions with AI...');
  
  try {
    // Generate ALL questions dynamically using AI
    const introductionQuestions = await generateIntroductionQuestions(jobDetails);
    const technicalQuestions = await generateRoleSpecificTechnicalQuestions(jobDetails);
    const codingQuestions = await generateRoleSpecificCodingQuestions(jobDetails);
    const advancedQuestions = await generateRoleSpecificAdvancedQuestions(jobDetails);
    const behavioralQuestions = await generateBehavioralQuestions(jobDetails);
    const finalQuestions = await generateFinalAssessmentQuestions(jobDetails);

    // Create 6 rounds with AI-generated questions
    const rounds = [
      {
        roundId: "round_1",
        roundNumber: 1,
        title: "Introduction & Background",
        description: "Assess candidate's background and motivation for this specific role",
        duration: 15,
        questions: introductionQuestions,
        evaluationCriteria: {
          background: "Relevant experience and qualifications",
          motivation: "Interest and alignment with the role",
          communication: "Clarity and professionalism"
        }
      },
      {
        roundId: "round_2",
        roundNumber: 2,
        title: "Technical Fundamentals",
        description: "Evaluate technical knowledge specific to this role",
        duration: 20,
        questions: technicalQuestions,
        evaluationCriteria: {
          technical: "Technical knowledge and understanding",
          problemSolving: "Analytical thinking and approach",
          practical: "Real-world application skills"
        }
      },
      {
        roundId: "round_3",
        roundNumber: 3,
        title: "Interactive Coding Challenge",
        description: "Hands-on coding assessment with AI guidance",
        duration: 25,
        questions: codingQuestions,
        evaluationCriteria: {
          coding: "Programming skills and code quality",
          logic: "Problem-solving and algorithmic thinking",
          communication: "Code explanation and collaboration"
        }
      },
      {
        roundId: "round_4",
        roundNumber: 4,
        title: "Advanced Technical Concepts",
        description: "Deep dive into advanced technical knowledge",
        duration: 20,
        questions: advancedQuestions,
        evaluationCriteria: {
          advanced: "Advanced technical knowledge",
          architecture: "System design and scalability thinking",
          bestPractices: "Industry standards and methodologies"
        }
      },
      {
        roundId: "round_5",
        roundNumber: 5,
        title: "Behavioral & Situational",
        description: "Assess behavioral competencies and cultural fit",
        duration: 15,
        questions: behavioralQuestions,
        evaluationCriteria: {
          behavioral: "Past behavior and decision-making",
          teamwork: "Collaboration and interpersonal skills",
          leadership: "Leadership potential and influence"
        }
      },
      {
        roundId: "round_6",
        roundNumber: 6,
        title: "Final Assessment",
        description: "Comprehensive evaluation and candidate questions",
        duration: 10,
        questions: finalQuestions,
        evaluationCriteria: {
          overall: "Overall fit and potential",
          growth: "Learning mindset and adaptability",
          culture: "Cultural alignment and values"
        }
      }
    ];

    // Calculate total duration
    const totalDuration = rounds.reduce((total, round) => total + round.duration, 0);

    return {
      interviewId,
      title: `AI Multi-Round Interview - ${jobDetails.title}`,
      totalDuration: totalDuration,
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
      },
      company: jobDetails.company
    };

  } catch (error) {
    console.error('❌ [STRUCTURED INTERVIEW] Error generating AI questions:', error);
    
    // Fallback: Use AI-generated introduction questions only
    try {
      const fallbackQuestions = await generateIntroductionQuestions(jobDetails);
      return {
        interviewId,
        title: `AI Multi-Round Interview - ${jobDetails.title}`,
        totalDuration: 30,
        rounds: [
          {
            roundId: "round_1",
            roundNumber: 1,
            title: "Introduction & Background",
            description: "Assess candidate's background and motivation for this specific role",
            duration: 30,
            questions: fallbackQuestions,
            evaluationCriteria: {
              background: "Relevant experience and qualifications",
              motivation: "Interest and alignment with the role",
              communication: "Clarity and professionalism"
            }
          }
        ],
        overallEvaluationCriteria: {
          technical: "Overall technical competency and problem-solving skills",
          communication: "Clarity of communication and articulation abilities",
          experience: "Relevance and depth of professional experience"
        },
        scoringSystem: {
          excellent: "4",
          good: "3",
          satisfactory: "2",
          needsImprovement: "1"
        },
        company: jobDetails.company
      };
    } catch (fallbackError) {
      console.error('❌ [STRUCTURED INTERVIEW] Fallback also failed:', fallbackError);
      
      // Final fallback: Single hardcoded question
      return {
        interviewId,
        title: `AI Multi-Round Interview - ${jobDetails.title}`,
        totalDuration: 30,
        rounds: [
          {
            roundId: "round_1",
            roundNumber: 1,
            title: "Introduction & Background",
            description: "Assess candidate's background and motivation for this specific role",
            duration: 30,
            questions: [
              {
                id: "q1_1",
                type: "behavioral",
                question: "Tell me about yourself and your background relevant to this position.",
                expectedAnswer: "Look for relevant experience, skills, and career progression",
                timeLimit: 3,
                difficulty: "easy",
                followUpQuestions: []
              }
            ],
            evaluationCriteria: {
              background: "Relevant experience and qualifications",
              motivation: "Interest and alignment with the role",
              communication: "Clarity and professionalism"
            }
          }
        ],
        overallEvaluationCriteria: {
          technical: "Overall technical competency and problem-solving skills",
          communication: "Clarity of communication and articulation abilities",
          experience: "Relevance and depth of professional experience"
        },
        scoringSystem: {
          excellent: "4",
          good: "3",
          satisfactory: "2",
          needsImprovement: "1"
        },
        company: jobDetails.company
      };
    }
  }
}

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
    
    // Add review notes if provided
    if (req.body.reviewNotes) {
      interview.reviewNotes = req.body.reviewNotes;
    }

    await interview.save();

    console.log('✅ [APPROVE INTERVIEW] Interview approved successfully:', {
      id: interview.interviewId,
      title: interview.title,
      approvedBy: req.user.id,
      approvedAt: interview.approvedAt
    });

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

    console.log('❌ [REJECT INTERVIEW] Interview rejected successfully:', {
      id: interview.interviewId,
      title: interview.title,
      rejectedBy: req.user.id,
      rejectedAt: interview.rejectedAt
    });

    res.json({
      success: true,
      message: 'Interview rejected successfully',
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        approvalStatus: interview.approvalStatus,
        rejectedAt: interview.rejectedAt,
        rejectedBy: interview.rejectedBy
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
