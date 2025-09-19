const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat-v3.1:free';

// Generate AI interview
router.post('/generate', auth, async (req, res) => {
  console.log('🚀 [INTERVIEW GENERATE] Starting interview generation...');
  console.log('📝 [INTERVIEW GENERATE] Request body:', {
    title: req.body.title,
    description: req.body.description?.substring(0, 100) + '...',
    requirements: req.body.requirements?.substring(0, 100) + '...',
    level: req.body.level,
    duration: req.body.duration
  });
  console.log('👤 [INTERVIEW GENERATE] User ID:', req.user.id);

  try {
    const { title, description, requirements, level = 'mid', duration = 30 } = req.body;
    
    if (!title || !description || !requirements) {
      console.log('❌ [INTERVIEW GENERATE] Validation failed - missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Title, description, and requirements are required' 
      });
    }

    console.log('✅ [INTERVIEW GENERATE] Validation passed, calling AI service...');

    // Generate interview using AI
    const prompt = `You are an expert HR professional and technical interviewer. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes

Create a structured interview with 6+ hiring rounds that are SPECIFICALLY tailored to this role:

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

ROUND 5: Industry Knowledge & Trends (10-15 minutes)
- Current trends and technologies in the ${title} field
- Industry best practices and methodologies
- Future outlook and adaptation skills

ROUND 6: Cultural Fit & Motivation (10-15 minutes)
- Alignment with company values and work culture
- Career goals and growth in ${title} field
- Motivation and passion for this specific role

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

Make sure the JSON is valid and properly formatted with all 6 rounds.`;

    console.log('🤖 [INTERVIEW GENERATE] Calling OpenRouter API...');
    console.log('🔑 [INTERVIEW GENERATE] API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('🌐 [INTERVIEW GENERATE] API URL:', OPENROUTER_API_URL);
    console.log('🎯 [INTERVIEW GENERATE] Model:', DEEPSEEK_MODEL);

    const aiResponse = await axios.post(OPENROUTER_API_URL, {
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR professional and technical interviewer. Generate comprehensive, role-specific interview questions in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
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

    console.log('💾 [INTERVIEW GENERATE] Creating interview in database...');
    // Create interview in database
    const interview = new Interview({
      ...interviewData,
      jobTitle: title,
      jobDescription: description,
      jobRequirements: requirements,
      jobLevel: level,
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

    console.log('✅ [GET INTERVIEW] Interview found:', {
      id: interview.interviewId,
      title: interview.title,
      rounds: interview.rounds.length,
      totalDuration: interview.totalDuration
    });

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        rounds: interview.rounds,
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

// Submit candidate answer
router.post('/:interviewId/answer', async (req, res) => {
  console.log('📝 [SUBMIT ANSWER] New answer submission for interview:', req.params.interviewId);
  console.log('👤 [SUBMIT ANSWER] Candidate:', req.body.candidateName, req.body.candidateEmail);
  console.log('❓ [SUBMIT ANSWER] Question ID:', req.body.questionId);
  
  try {
    const { candidateId, candidateName, candidateEmail, roundId, questionId, question, answer, timeTaken } = req.body;

    if (!candidateId || !candidateName || !candidateEmail || !roundId || !questionId || !question || !answer) {
      console.log('❌ [SUBMIT ANSWER] Validation failed - missing required fields');
      console.log('📋 [SUBMIT ANSWER] Received fields:', Object.keys(req.body));
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
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
    // Evaluate answer using AI
    const evaluation = await evaluateAnswer(question, answer, interview.overallEvaluationCriteria);
    console.log('🤖 [SUBMIT ANSWER] AI evaluation completed:', {
      score: evaluation.score,
      feedbackLength: evaluation.feedback?.length || 0
    });

    // Add candidate answer
    const candidateAnswer = {
      candidateId,
      candidateName,
      candidateEmail,
      roundId,
      questionId,
      question,
      answer,
      timeTaken,
      aiEvaluation: evaluation
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

    res.json({
      success: true,
      data: {
        answerId: candidateAnswer._id,
        evaluation: evaluation
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

    console.log('✅ [GET ALL INTERVIEWS] Found', interviews.length, 'interviews');
    console.log('📊 [GET ALL INTERVIEWS] Interview titles:', interviews.map(i => i.title));

    res.json({
      success: true,
      data: interviews
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

// Helper function to create structured interview from text
function createStructuredInterview(textResponse, jobDetails) {
  const interviewId = `interview_${Date.now()}`;
  
  // Default rounds structure
  const defaultRounds = [
    {
      roundId: "round_1",
      roundNumber: 1,
      title: "Technical Fundamentals",
      description: "Evaluate technical skills and problem-solving abilities",
      duration: 20,
      questions: [
        {
          id: "q1_1",
          type: "technical",
          question: `What are the key technical skills required for a ${jobDetails.title} position?`,
          expectedAnswer: "Look for relevant technical knowledge and experience",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["Can you provide specific examples?", "How do you stay updated with new technologies?"]
        }
      ],
      evaluationCriteria: {
        technical: "Evaluate technical knowledge and skills",
        problemSolving: "Assess problem-solving approach"
      }
    }
  ];

  return {
    interviewId,
    title: `AI Multi-Round Interview - ${jobDetails.title}`,
    totalDuration: jobDetails.duration || 30,
    rounds: defaultRounds,
    overallEvaluationCriteria: {
      technical: "Overall technical competency assessment",
      communication: "Communication and articulation skills",
      problemSolving: "Problem-solving methodology and creativity",
      culturalFit: "Alignment with company values and culture",
      leadership: "Leadership potential and team collaboration",
      motivation: "Career goals and job motivation"
    },
    scoringSystem: {
      excellent: "4",
      good: "3",
      satisfactory: "2",
      needsImprovement: "1"
    }
  };
}

// Helper function to evaluate answer using AI
async function evaluateAnswer(question, answer, criteria) {
  console.log('🤖 [EVALUATE ANSWER] Starting AI evaluation...');
  console.log('❓ [EVALUATE ANSWER] Question length:', question.length);
  console.log('💬 [EVALUATE ANSWER] Answer length:', answer.length);
  
  try {
    const prompt = `Evaluate this interview answer based on the criteria:

Question: ${question}
Answer: ${answer}

Evaluation Criteria: ${JSON.stringify(criteria)}

Provide evaluation in this JSON format:
{
  "score": 3,
  "feedback": "Detailed feedback about the answer",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Area for improvement 1", "Area for improvement 2"]
}

Score: 1-4 (1=Needs Improvement, 2=Satisfactory, 3=Good, 4=Excellent)`;

    console.log('🤖 [EVALUATE ANSWER] Calling AI for evaluation...');
    const aiResponse = await axios.post(OPENROUTER_API_URL, {
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interviewer. Evaluate candidate answers objectively and provide constructive feedback.'
        },
        {
          role: 'user',
          content: prompt
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

    console.log('✅ [EVALUATE ANSWER] AI evaluation response received');
    const evaluation = JSON.parse(aiResponse.data.choices[0].message.content);
    console.log('📊 [EVALUATE ANSWER] Evaluation result:', {
      score: evaluation.score,
      feedbackLength: evaluation.feedback?.length || 0,
      strengthsCount: evaluation.strengths?.length || 0,
      improvementsCount: evaluation.improvements?.length || 0
    });
    
    return evaluation;

  } catch (error) {
    console.error('❌ [EVALUATE ANSWER] Error occurred:', error.message);
    console.error('🔍 [EVALUATE ANSWER] Error details:', {
      name: error.name,
      message: error.message,
      response: error.response?.data
    });
    
    return {
      score: 2,
      feedback: "Unable to evaluate answer at this time",
      strengths: [],
      improvements: ["Answer could not be evaluated"]
    };
  }
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

module.exports = router;
