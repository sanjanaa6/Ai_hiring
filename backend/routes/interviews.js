const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// API Configuration
const OPENROUTER_API_URL = (process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1') + '/chat/completions';

// Fallback models in order of preference
const FALLBACK_MODELS = [
  'openai/gpt-3.5-turbo',
  'openai/gpt-4',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3-sonnet',
  'google/gemini-pro',
  'meta-llama/llama-2-70b-chat',
  'mistralai/mistral-7b-instruct'
];

// Validation function for interview structure
const validateInterviewStructure = (interviewData) => {
  try {
    if (!interviewData) {
      console.log('❌ [VALIDATION] Interview data is null or undefined');
      return false;
    }

    if (!interviewData.interviewId || !interviewData.title) {
      console.log('❌ [VALIDATION] Missing required fields (interviewId or title)');
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
    console.log('🔍 [PARSE AI RESPONSE] Raw response text length:', responseText.length);
    
    // Try to find and extract JSON from the response
    let jsonText = responseText;
    
    // Look for JSON object boundaries
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = responseText.substring(jsonStart, jsonEnd + 1);
      console.log('🔍 [PARSE AI RESPONSE] Extracted JSON text length:', jsonText.length);
    }
    
    // Try to clean up common JSON issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/\n/g, ' ')     // Replace newlines with spaces
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
    
    console.log('🔍 [PARSE AI RESPONSE] Cleaned JSON text:', jsonText.substring(0, 200) + '...');
    
    const parsed = JSON.parse(jsonText);
    console.log('✅ [PARSE AI RESPONSE] Successfully parsed JSON');
    return parsed;
    
  } catch (error) {
    console.error('❌ [PARSE AI RESPONSE] Error parsing AI response:', error.message);
    console.error('🔍 [PARSE AI RESPONSE] Error at position:', error.message.match(/position (\d+)/)?.[1]);
    
    // Try to find the problematic area
    if (error.message.includes('position')) {
      const position = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
      const start = Math.max(0, position - 100);
      const end = Math.min(responseText.length, position + 100);
      console.error('🔍 [PARSE AI RESPONSE] Problematic area:', responseText.substring(start, end));
    }
    
    return null;
  }
};

// Helper function to create fallback interview when AI parsing fails
const createFallbackInterview = (jobDetails, interviewId) => {
  console.log('🔄 [FALLBACK INTERVIEW] Creating fallback interview structure...');
  
  const isDeveloperRole = jobDetails.title.toLowerCase().includes('developer') || 
                         jobDetails.title.toLowerCase().includes('engineer') || 
                         jobDetails.title.toLowerCase().includes('programmer') ||
                         jobDetails.title.toLowerCase().includes('coder');
  
  let rounds = [
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
          question: "Tell me about yourself and your relevant experience for this role.",
          expectedAnswer: "Look for relevant experience and skills",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_2",
          type: "behavioral",
          question: "What interests you about this position?",
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
          question: "What questions do you have for us?",
          expectedAnswer: "Look for engagement",
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
  ];
  
  // Add coding round for developers
  if (isDeveloperRole) {
    rounds.push({
      roundId: "round_2",
      roundNumber: 2,
      title: "Coding Challenge & Technical Skills",
      description: "Assess candidate's programming skills and technical knowledge",
      duration: 15,
      questions: [
        {
          id: "q2_1",
          type: "coding",
          question: "Write a function to reverse a string in your preferred programming language.",
          expectedAnswer: "Look for clean, efficient code and proper syntax",
          timeLimit: 5,
          difficulty: "easy",
          followUpQuestions: ["Can you optimize this solution?", "What's the time complexity?"]
        },
        {
          id: "q2_2",
          type: "coding",
          question: "Implement a function to find the factorial of a number using recursion.",
          expectedAnswer: "Look for correct recursive implementation and base case handling",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["What happens with large numbers?", "Can you implement it iteratively?"]
        },
        {
          id: "q2_3",
          type: "technical",
          question: "Explain the difference between a stack and a queue with examples.",
          expectedAnswer: "Look for clear understanding of data structures and their use cases",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["When would you use each one?", "Can you implement them?"]
        },
        {
          id: "q2_4",
          type: "coding",
          question: "Write a function to check if a string is a palindrome.",
          expectedAnswer: "Look for efficient algorithm and clean code",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["Can you handle case sensitivity?", "What about spaces and punctuation?"]
        },
        {
          id: "q2_5",
          type: "technical",
          question: "What is the difference between REST and GraphQL APIs?",
          expectedAnswer: "Look for understanding of API design patterns and their trade-offs",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["When would you choose one over the other?", "What are the performance implications?"]
        }
      ],
      evaluationCriteria: {
        codingSkills: "Ability to write clean, efficient code",
        problemSolving: "Approach to solving programming problems",
        technicalKnowledge: "Understanding of programming concepts and best practices"
      }
    });
  }
  
  return {
    interviewId: interviewId,
    title: `AI Multi-Round Interview - ${jobDetails.title}`,
    totalDuration: 90,
    rounds: rounds,
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
};

// Helper function to extract job details from prompt
const extractJobDetailsFromPrompt = (prompt) => {
  try {
    console.log('🔍 [EXTRACT JOB DETAILS] Extracting from prompt...');
    
    // Extract job title from prompt
    let title = 'Generic Role';
    const titleMatch = prompt.match(/(?:for this job|for a|for an|for the)\s*:?\s*([^:\n]+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // Try to find role-specific keywords
      if (prompt.toLowerCase().includes('sales')) {
        title = 'Sales Representative';
      } else if (prompt.toLowerCase().includes('developer')) {
        title = 'Software Developer';
      } else if (prompt.toLowerCase().includes('engineer')) {
        title = 'Software Engineer';
      } else if (prompt.toLowerCase().includes('manager')) {
        title = 'Manager';
      } else if (prompt.toLowerCase().includes('analyst')) {
        title = 'Business Analyst';
      }
    }
    
    const jobDetails = {
      title: title,
      company: 'Your Company',
      description: prompt.substring(0, 500) + '...',
      requirements: prompt.substring(0, 300) + '...',
      level: 'Mid-level'
    };
    
    console.log('✅ [EXTRACT JOB DETAILS] Extracted:', jobDetails);
    return jobDetails;
  } catch (error) {
    console.error('❌ [EXTRACT JOB DETAILS] Error extracting job details:', error);
    return {
      title: 'Generic Role',
      company: 'Your Company',
      description: 'No description available',
      requirements: 'No requirements available',
      level: 'Mid-level'
    };
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
    
    // Create role-specific AI prompt for interview generation
    const isDeveloperRole = jobDetails.title.toLowerCase().includes('developer') || 
                           jobDetails.title.toLowerCase().includes('engineer') || 
                           jobDetails.title.toLowerCase().includes('programmer') ||
                           jobDetails.title.toLowerCase().includes('coder');
    
    const isSalesRole = jobDetails.title.toLowerCase().includes('sales') || 
                       jobDetails.title.toLowerCase().includes('account');
    
    const isManagerRole = jobDetails.title.toLowerCase().includes('manager') || 
                         jobDetails.title.toLowerCase().includes('lead') ||
                         jobDetails.title.toLowerCase().includes('director');
    
    let roleSpecificPrompt = '';
    
    if (isDeveloperRole) {
      roleSpecificPrompt = `
DEVELOPER-SPECIFIC REQUIREMENTS:
- Round 2 MUST be a "Coding Challenge" round with live coding questions
- Round 3 MUST be a "System Design & Architecture" round
- Include specific programming languages, frameworks, and technologies
- Add algorithm and data structure questions
- Include code review and debugging scenarios
- Focus on software development best practices

Round Structure for Developers:
- Round 1: Introduction & Background (5 questions)
- Round 2: Coding Challenge & Technical Skills (5 questions) 
- Round 3: System Design & Architecture (5 questions)
- Round 4: Problem Solving & Debugging (5 questions)
- Round 5: Advanced Technical Assessment (5 questions)
- Round 6: Final Evaluation & Cultural Fit (5 questions)`;
    } else if (isSalesRole) {
      roleSpecificPrompt = `
SALES-SPECIFIC REQUIREMENTS:
- Round 2 MUST be a "Sales Process & CRM" round
- Round 3 MUST be a "Sales Pitch & Role-play" round
- Include lead generation, prospecting, and closing techniques
- Add negotiation and objection handling scenarios
- Focus on sales metrics and performance indicators

Round Structure for Sales:
- Round 1: Introduction & Background (5 questions)
- Round 2: Sales Process & CRM Knowledge (5 questions) 
- Round 3: Sales Pitch & Role-play (5 questions)
- Round 4: Behavioral & Experience (5 questions)
- Round 5: Advanced Sales Assessment (5 questions)
- Round 6: Final Evaluation & Fit (5 questions)`;
    } else if (isManagerRole) {
      roleSpecificPrompt = `
MANAGER-SPECIFIC REQUIREMENTS:
- Round 2 MUST be a "Leadership & Team Management" round
- Round 3 MUST be a "Strategic Thinking & Decision Making" round
- Include team building, conflict resolution, and performance management
- Add budget and resource allocation scenarios
- Focus on leadership styles and management philosophies

Round Structure for Managers:
- Round 1: Introduction & Background (5 questions)
- Round 2: Leadership & Team Management (5 questions) 
- Round 3: Strategic Thinking & Decision Making (5 questions)
- Round 4: Behavioral & Experience (5 questions)
- Round 5: Advanced Management Assessment (5 questions)
- Round 6: Final Evaluation & Cultural Fit (5 questions)`;
    } else {
      roleSpecificPrompt = `
GENERIC ROLE REQUIREMENTS:
- Round 2 MUST be a "Technical/Professional Skills" round
- Round 3 MUST be a "Problem Solving & Scenarios" round
- Include role-specific technical knowledge and skills
- Add industry-specific scenarios and challenges
- Focus on professional competencies and expertise

Round Structure:
- Round 1: Introduction & Background (5 questions)
- Round 2: Technical/Professional Skills (5 questions) 
- Round 3: Problem Solving & Scenarios (5 questions)
- Round 4: Behavioral & Experience (5 questions)
- Round 5: Advanced Assessment (5 questions)
- Round 6: Final Evaluation & Fit (5 questions)`;
    }
    
    const aiPrompt = `
You are an expert interview designer. Create a comprehensive 6-round interview structure for the following position:

Job Title: ${jobDetails.title}
Company: ${jobDetails.company}
Job Description: ${jobDetails.description || 'No description provided'}

${roleSpecificPrompt}

GENERAL REQUIREMENTS:
1. Create exactly 6 rounds with 5 questions each (30 total questions)
2. Each round should have a specific focus and increasing difficulty
3. Include various question types: behavioral, technical, situational, role-play, problem-solving, coding (for developers)
4. Make questions specific to the role and industry
5. Include realistic time limits and difficulty levels
6. Add follow-up questions where appropriate
7. For coding questions, include specific programming languages and frameworks
8. For system design, include scalability, performance, and architecture considerations

IMPORTANT: Respond with ONLY valid JSON. No additional text, explanations, or formatting. Ensure all JSON is properly formatted with correct commas, brackets, and quotes.

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

    // Check if API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    console.log('🔑 [AI INTERVIEW] API Key exists:', !!process.env.OPENROUTER_API_KEY);
    console.log('🔑 [AI INTERVIEW] API Key length:', process.env.OPENROUTER_API_KEY?.length || 0);
    console.log('🌐 [AI INTERVIEW] API URL:', OPENROUTER_API_URL);
    console.log('🤖 [AI INTERVIEW] Available models:', FALLBACK_MODELS);

    // Try each model until one works
    let response = null;
      let lastError = null;
      
    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [AI INTERVIEW] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);
      
      try {
        response = await axios.post(OPENROUTER_API_URL, {
            model: model,
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
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Hiring System'
      }
    });
          
        console.log(`✅ [AI INTERVIEW] Successfully used model: ${model}`);
        break; // Success! Exit the loop
          
        } catch (error) {
        console.log(`❌ [AI INTERVIEW] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
          lastError = error;
        
        // If this is the last model, we'll throw the error
        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    const interviewData = parseAIResponse(response.data.choices[0].message.content);
    
    if (!interviewData) {
      console.log('⚠️ [AI INTERVIEW] Failed to parse AI response, creating fallback interview...');
      return createFallbackInterview(jobDetails, interviewId);
    }
    
    console.log('✅ [AI INTERVIEW] Successfully generated AI interview with', interviewData?.rounds?.length || 0, 'rounds');
    console.log('🔍 [AI INTERVIEW] Generated interview data:', JSON.stringify(interviewData, null, 2));
    
    return interviewData;

  } catch (error) {
    console.error('❌ [AI INTERVIEW] All models failed to generate interview');
    console.error('🔍 [AI INTERVIEW] Last error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    // Check if it's an API key issue
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your OPENROUTER_API_KEY environment variable.');
    } else if (error.response?.status === 400) {
      console.error('🔍 [AI INTERVIEW] API Response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || error.message;
      throw new Error(`All models failed. Last error: ${errorMessage}`);
    } else if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
    
    // If all models fail, throw an error
    console.log('🔄 [AI INTERVIEW] All models failed, creating fallback interview...');
    return createFallbackInterview(jobDetails, interviewId);
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

// Get interview by ID endpoint (public access for shareable links)
router.get('/public/:interviewId', async (req, res) => {
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
});

// Get interview by ID endpoint (authenticated access)
router.get('/:interviewId', auth, async (req, res) => {
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
});

// Get all interviews for user endpoint
router.get('/', auth, async (req, res) => {
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
});

// Delete interview endpoint
router.delete('/:interviewId', auth, async (req, res) => {
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
});

// Generate interview endpoint
router.post('/generate', auth, async (req, res) => {
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

    console.log('📝 [INTERVIEW GENERATE] Prompt:', prompt.substring(0, 100) + '...');
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

// Submit interview answer endpoint (singular - for frontend compatibility)
router.post('/:interviewId/answer', async (req, res) => {
  console.log('📝 [SUBMIT ANSWER] Submitting answer for interview:', req.params.interviewId);
  console.log('🔍 [SUBMIT ANSWER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { questionId, answer, roundId, timeSpent } = req.body;
    
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

    // Initialize answers array if it doesn't exist
    if (!interview.answers) {
      interview.answers = [];
    }

    // Check if answer already exists for this question
    const existingAnswerIndex = interview.answers.findIndex(
      ans => ans.questionId === questionId
    );

    const answerData = {
      questionId,
      answer,
      roundId,
      timeSpent: timeSpent || 0,
      submittedAt: new Date(),
      timestamp: Date.now()
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      interview.answers[existingAnswerIndex] = answerData;
      console.log('🔄 [SUBMIT ANSWER] Updated existing answer for question:', questionId);
    } else {
      // Add new answer
      interview.answers.push(answerData);
      console.log('✅ [SUBMIT ANSWER] Added new answer for question:', questionId);
    }

    await interview.save();

    console.log('✅ [SUBMIT ANSWER] Answer submitted successfully');
    console.log('📊 [SUBMIT ANSWER] Total answers:', interview.answers.length);

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        questionId,
        answerId: answerData.timestamp,
        submittedAt: answerData.submittedAt,
        totalAnswers: interview.answers.length
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

// Submit interview answer endpoint (plural - for API consistency)
router.post('/:interviewId/answers', async (req, res) => {
  console.log('📝 [SUBMIT ANSWER] Submitting answer for interview:', req.params.interviewId);
  console.log('🔍 [SUBMIT ANSWER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { questionId, answer, roundId, timeSpent } = req.body;
    
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

    // Initialize answers array if it doesn't exist
    if (!interview.answers) {
      interview.answers = [];
    }

    // Check if answer already exists for this question
    const existingAnswerIndex = interview.answers.findIndex(
      ans => ans.questionId === questionId
    );

    const answerData = {
      questionId,
      answer,
      roundId,
      timeSpent: timeSpent || 0,
      submittedAt: new Date(),
      timestamp: Date.now()
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      interview.answers[existingAnswerIndex] = answerData;
      console.log('🔄 [SUBMIT ANSWER] Updated existing answer for question:', questionId);
    } else {
      // Add new answer
      interview.answers.push(answerData);
      console.log('✅ [SUBMIT ANSWER] Added new answer for question:', questionId);
    }

    await interview.save();

    console.log('✅ [SUBMIT ANSWER] Answer submitted successfully');
    console.log('📊 [SUBMIT ANSWER] Total answers:', interview.answers.length);

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        questionId,
        answerId: answerData.timestamp,
        submittedAt: answerData.submittedAt,
        totalAnswers: interview.answers.length
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

// Get interview answers endpoint
router.get('/:interviewId/answers', async (req, res) => {
  console.log('📋 [GET ANSWERS] Fetching answers for interview:', req.params.interviewId);
  
  try {
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

    console.log('✅ [GET ANSWERS] Answers retrieved successfully');
    console.log('📊 [GET ANSWERS] Total answers:', interview.answers?.length || 0);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        answers: interview.answers || [],
        totalAnswers: interview.answers?.length || 0
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
});

// Complete interview endpoint
router.post('/:interviewId/complete', async (req, res) => {
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
    console.log('📊 [COMPLETE INTERVIEW] Total answers:', interview.answers?.length || 0);

    res.json({
      success: true,
      message: 'Interview completed successfully',
      data: {
        interviewId: interview.interviewId,
        status: interview.status,
        completedAt: interview.completedAt,
        totalAnswers: interview.answers?.length || 0,
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
});

// Live AI Interviewer endpoint for dynamic coding questions
router.post('/:interviewId/coding-assistant', async (req, res) => {
  console.log('🤖 [LIVE AI INTERVIEWER] Processing live coding interaction:', req.params.interviewId);
  console.log('🔍 [LIVE AI INTERVIEWER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, code, language, context, interactionType } = req.body;
    
    if (!question) {
      console.log('❌ [LIVE AI INTERVIEWER] Missing question');
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [LIVE AI INTERVIEWER] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Create AI prompt for live coding interviewer
    const aiPrompt = `
You are a LIVE AI coding interviewer. You are actively monitoring the candidate's code as they write it. Based on their current code, ask dynamic, probing questions about their approach.

Original Question: ${question}
Programming Language: ${language || 'JavaScript'}
Current Code: ${code || 'No code written yet'}
Context: ${context || 'No additional context'}
Interaction Type: ${interactionType || 'monitoring'}

Your role is to:
1. Analyze the current code approach and implementation
2. Ask probing questions about their choices and reasoning
3. Challenge their approach with follow-up questions
4. Guide them to think about edge cases, optimization, and best practices
5. Be conversational and engaging, like a real interviewer

Ask 1-2 specific questions about their current approach. Examples:
- "I see you're using a for loop here. Why did you choose this approach over using array methods?"
- "What's the time complexity of your current solution?"
- "How would you handle the edge case where the input is empty?"
- "I notice you're not handling null values. What happens if the input contains null?"
- "Can you explain your thought process behind this algorithm choice?"

Respond in JSON format:
{
  "aiQuestion": "Your dynamic question about their current approach",
  "codeAnalysis": "Brief analysis of what you observe in their code",
  "followUpQuestion": "A second probing question to dig deeper",
  "suggestion": "A subtle hint or suggestion without giving away the solution",
  "encouragement": "Encouraging feedback to keep them motivated"
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
`;

    // Try each model until one works
    let response = null;
    let lastError = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [CODING ASSISTANT] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

      try {
        response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a LIVE AI coding interviewer. Monitor code as it\'s written and ask dynamic, probing questions about the approach. Be conversational and engaging. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Coding Assistant'
          }
        });

        console.log(`✅ [CODING ASSISTANT] Successfully used model: ${model}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`❌ [CODING ASSISTANT] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;

        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    console.log('🔍 [CODING ASSISTANT] Raw AI response:', response.data.choices[0].message.content);
    
    let aiResponse = parseAIResponse(response.data.choices[0].message.content);
    
    if (!aiResponse) {
      console.log('⚠️ [CODING ASSISTANT] Failed to parse AI response, creating fallback response...');
      aiResponse = {
        aiQuestion: "I can see you're working on the solution. Can you walk me through your current approach?",
        codeAnalysis: "The code is being developed. Let's discuss the approach.",
        followUpQuestion: "What's your thought process behind this implementation?",
        suggestion: "Consider thinking about edge cases and time complexity.",
        encouragement: "Good start! Keep going and explain your reasoning as you code."
      };
    }
    
    console.log('🔍 [CODING ASSISTANT] Final AI response:', JSON.stringify(aiResponse, null, 2));
    console.log('✅ [CODING ASSISTANT] Dynamic AI question generated successfully');

    // Generate voice text for the AI question
    let voiceText = aiResponse.aiQuestion;
    try {
      // Create a simple voice-friendly version of the question
      voiceText = aiResponse.aiQuestion
        .replace(/"/g, '') // Remove quotes
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    } catch (error) {
      console.log('⚠️ [LIVE AI INTERVIEWER] Voice text generation failed, using original question');
    }

    res.json({
      success: true,
      data: {
        question: question,
        language: language,
        code: code,
        aiResponse: aiResponse,
        voiceText: voiceText,
        voiceSettings: {
          language: 'en-US',
          voice: 'default',
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [LIVE AI INTERVIEWER] Error occurred:', error.message);
    console.error('🔍 [LIVE AI INTERVIEWER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process live coding interaction'
    });
  }
});

// Generate live coding question endpoint
router.post('/:interviewId/generate-coding-question', async (req, res) => {
  console.log('🎯 [GENERATE CODING] Generating live coding question:', req.params.interviewId);
  console.log('🔍 [GENERATE CODING] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { difficulty, language, topic, previousQuestions } = req.body;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [GENERATE CODING] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Create AI prompt for generating coding questions
    const aiPrompt = `
You are an expert coding interviewer. Generate a live coding question with the following specifications:

Difficulty Level: ${difficulty || 'medium'}
Programming Language: ${language || 'JavaScript'}
Topic: ${topic || 'General programming'}
Previous Questions: ${previousQuestions ? previousQuestions.join(', ') : 'None'}

Requirements:
1. Create a practical, real-world coding problem
2. Include clear problem description and examples
3. Specify expected input/output format
4. Provide test cases
5. Include hints for the candidate
6. Make it appropriate for the difficulty level

Respond in JSON format:
{
  "question": "Clear problem description",
  "examples": [
    {
      "input": "example input",
      "output": "expected output",
      "explanation": "why this output"
    }
  ],
  "testCases": [
    {
      "input": "test input",
      "output": "expected output"
    }
  ],
  "hints": ["Hint 1", "Hint 2"],
  "difficulty": "easy/medium/hard",
  "estimatedTime": "time in minutes",
  "topics": ["topic1", "topic2"],
  "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
`;

    // Try each model until one works
    let response = null;
    let lastError = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [GENERATE CODING] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

      try {
        response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert coding interviewer. Generate practical coding problems. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Coding Question Generator'
          }
        });

        console.log(`✅ [GENERATE CODING] Successfully used model: ${model}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`❌ [GENERATE CODING] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;

        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    const aiResponse = parseAIResponse(response.data.choices[0].message.content);
    
    if (!aiResponse) {
      console.log('⚠️ [GENERATE CODING] Failed to parse AI response, creating fallback question...');
      aiResponse = {
        question: "Write a function to find the maximum element in an array.",
        examples: [
          {
            input: "[1, 5, 3, 9, 2]",
            output: "9",
            explanation: "9 is the largest number in the array"
          }
        ],
        testCases: [
          { input: "[1, 5, 3, 9, 2]", output: "9" },
          { input: "[-1, -5, -3]", output: "-1" }
        ],
        hints: ["Consider iterating through the array", "Keep track of the maximum value found so far"],
        difficulty: difficulty || "medium",
        estimatedTime: "10-15 minutes",
        topics: ["arrays", "algorithms"],
        followUpQuestions: [
          "How would you modify this to find the second largest element?",
          "What's the time complexity of your solution?"
        ]
      };
    }

    console.log('✅ [GENERATE CODING] Live coding question generated successfully');

    res.json({
      success: true,
      data: {
        questionId: `live_${Date.now()}`,
        question: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [GENERATE CODING] Error occurred:', error.message);
    console.error('🔍 [GENERATE CODING] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate coding question'
    });
  }
});

// Get coding hints endpoint (GET)
router.get('/:interviewId/coding-hints', async (req, res) => {
  console.log('💡 [CODING HINTS] Getting coding hints for interview:', req.params.interviewId);
  console.log('🔍 [CODING HINTS] Query params:', req.query);
  
  try {
    const { question, language, difficulty } = req.query;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [CODING HINTS] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Create AI prompt for coding hints
    const aiPrompt = `
You are an expert coding interviewer. Provide helpful hints for this coding question:

Question: ${question || 'General coding question'}
Programming Language: ${language || 'JavaScript'}
Difficulty: ${difficulty || 'medium'}

Please provide:
1. 3-5 helpful hints that guide the candidate without giving away the solution
2. Common approaches or strategies for this type of problem
3. Key concepts to consider
4. Potential pitfalls to avoid

Respond in JSON format:
{
  "hints": [
    "Hint 1 - guides without revealing solution",
    "Hint 2 - suggests approach or strategy", 
    "Hint 3 - mentions key concepts",
    "Hint 4 - warns about common mistakes",
    "Hint 5 - suggests next steps"
  ],
  "strategies": [
    "Strategy 1",
    "Strategy 2"
  ],
  "keyConcepts": [
    "Concept 1",
    "Concept 2"
  ],
  "commonPitfalls": [
    "Pitfall 1",
    "Pitfall 2"
  ]
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
`;

    // Try each model until one works
    let response = null;
    let lastError = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [CODING HINTS] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

      try {
        response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a LIVE AI coding interviewer. Monitor code as it\'s written and ask dynamic, probing questions about the approach. Be conversational and engaging. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.5
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Coding Hints'
          }
        });

        console.log(`✅ [CODING HINTS] Successfully used model: ${model}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`❌ [CODING HINTS] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;

        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    const aiResponse = parseAIResponse(response.data.choices[0].message.content);
    
    if (!aiResponse) {
      console.log('⚠️ [CODING HINTS] Failed to parse AI response, creating fallback hints...');
      aiResponse = {
        hints: [
          "Start by understanding the problem requirements clearly",
          "Consider the data structures that might be useful",
          "Think about the time and space complexity",
          "Break the problem into smaller subproblems",
          "Test your solution with edge cases"
        ],
        strategies: [
          "Use a systematic approach to solve the problem",
          "Consider both iterative and recursive solutions"
        ],
        keyConcepts: [
          "Algorithm design",
          "Data structure selection"
        ],
        commonPitfalls: [
          "Not handling edge cases",
          "Incorrect loop boundaries"
        ]
      };
    }

    console.log('✅ [CODING HINTS] Coding hints generated successfully');

    res.json({
      success: true,
      data: {
        question: question,
        language: language,
        difficulty: difficulty,
        hints: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [CODING HINTS] Error occurred:', error.message);
    console.error('🔍 [CODING HINTS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get coding hints'
    });
  }
});

// Live AI Interviewer endpoint (POST) - handles coding-hints calls
router.post('/:interviewId/coding-hints', async (req, res) => {
  console.log('🤖 [LIVE AI INTERVIEWER] Processing live coding interaction:', req.params.interviewId);
  console.log('🔍 [LIVE AI INTERVIEWER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, currentCode, language, difficulty, isLiveComment, isInterviewer, questionNumber, previousQuestions } = req.body;
    
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [CODING HINTS POST] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Create AI prompt for live coding interviewer
    const aiPrompt = `
You are a LIVE AI coding interviewer watching the candidate code in real-time. You must ask dynamic, specific questions based on what they're actually writing.

Original Question: ${question || 'General coding question'}
Programming Language: ${language || 'JavaScript'}
Current Code: ${currentCode || 'No code written yet'}
Difficulty: ${difficulty || 'medium'}
Question Number: ${questionNumber || 1}
Previous Questions Asked: ${previousQuestions ? previousQuestions.join(', ') : 'None'}

ANALYZE THE CURRENT CODE AND ASK SPECIFIC QUESTIONS:

IMPORTANT: This is question ${questionNumber || 1} of 3. Make sure to ask a DIFFERENT type of question than the previous ones.

If the code is empty or just has comments:
- "I see you're starting fresh. What's your first step in approaching this problem?"
- "Before you start coding, can you walk me through your overall strategy?"

If they're writing React/JavaScript:
- "I see you're using ${currentCode.includes('useState') ? 'useState' : 'a function'}. What state will you need to manage for this component?"
- "You're ${currentCode.includes('fetch') ? 'using fetch' : 'not using fetch yet'}. How will you handle the API response?"
- "I notice you're ${currentCode.includes('async') ? 'using async/await' : 'not handling async yet'}. How will you manage the asynchronous nature of API calls?"

If they're writing algorithms:
- "I see you're using ${currentCode.includes('for') ? 'a for loop' : currentCode.includes('while') ? 'a while loop' : 'a different approach'}. Why did you choose this method?"
- "What's the time complexity of your current approach?"
- "How will you handle edge cases like empty inputs or null values?"

If they're writing specific patterns:
- "I notice you're ${currentCode.includes('if') ? 'using conditional logic' : 'not using conditionals yet'}. What conditions do you need to check?"
- "You're ${currentCode.includes('return') ? 'returning a value' : 'not returning anything yet'}. What should this function return?"

Be conversational and ask follow-up questions like:
- "Can you explain your reasoning behind this approach?"
- "What would happen if the input was different?"
- "How would you test this code?"

QUESTION FOCUS BY NUMBER:
- Question 1: Focus on approach and strategy
- Question 2: Focus on implementation details and edge cases
- Question 3: Focus on optimization and testing

Respond in JSON format:
{
  "aiQuestion": "Your specific question about what they're actually writing",
  "codeAnalysis": "What you observe in their current code",
  "followUpQuestion": "A deeper question about their approach",
  "suggestion": "A subtle hint without giving away the solution",
  "encouragement": "Motivational feedback"
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
`;

    // Try each model until one works
    let response = null;
    let lastError = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [LIVE AI INTERVIEWER] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

      try {
        response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a LIVE AI coding interviewer. Monitor code as it\'s written and ask dynamic, probing questions about the approach. Be conversational and engaging. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.5
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Coding Hints'
          }
        });

        console.log(`✅ [LIVE AI INTERVIEWER] Successfully used model: ${model}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`❌ [LIVE AI INTERVIEWER] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;

        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    console.log('🔍 [LIVE AI INTERVIEWER] Raw AI response:', response.data.choices[0].message.content);
    
    let aiResponse = parseAIResponse(response.data.choices[0].message.content);
    
    if (!aiResponse) {
      console.log('⚠️ [LIVE AI INTERVIEWER] Failed to parse AI response, creating fallback response...');
      aiResponse = {
        aiQuestion: "I can see you're working on the solution. Can you walk me through your current approach?",
        codeAnalysis: "The code is being developed. Let's discuss the approach.",
        followUpQuestion: "What's your thought process behind this implementation?",
        suggestion: "Consider thinking about edge cases and time complexity.",
        encouragement: "Good start! Keep going and explain your reasoning as you code."
      };
    }
    
    console.log('🔍 [LIVE AI INTERVIEWER] Final AI response:', JSON.stringify(aiResponse, null, 2));
    console.log('✅ [LIVE AI INTERVIEWER] Dynamic AI question generated successfully');

    // Generate voice text for the AI question
      let voiceText = aiResponse.aiQuestion;
      try {
        // Create a simple voice-friendly version of the question
        voiceText = aiResponse.aiQuestion
          .replace(/"/g, '') // Remove quotes
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
      } catch (error) {
        console.log('⚠️ [LIVE AI INTERVIEWER] Voice text generation failed, using original question');
      }

      res.json({
        success: true,
        data: {
          question: question,
          language: language,
          currentCode: currentCode,
          aiResponse: aiResponse,
          voiceText: voiceText,
          voiceSettings: {
            language: 'en-US',
            voice: 'default',
            speed: 1.0,
            pitch: 1.0,
            volume: 1.0
          },
          timestamp: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error('❌ [LIVE AI INTERVIEWER] Error occurred:', error.message);
    console.error('🔍 [LIVE AI INTERVIEWER] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process live coding interaction'
    });
  }
});

// Mark coding question as done endpoint
router.post('/:interviewId/coding-done', async (req, res) => {
  console.log('✅ [CODING DONE] Marking coding question as done:', req.params.interviewId);
  console.log('🔍 [CODING DONE] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { questionId, code, language, timeSpent, notes } = req.body;
    
    if (!questionId) {
      console.log('❌ [CODING DONE] Missing question ID');
      return res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [CODING DONE] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Initialize coding submissions if it doesn't exist
    if (!interview.codingSubmissions) {
      interview.codingSubmissions = [];
    }

    // Check if submission already exists for this question
    const existingSubmissionIndex = interview.codingSubmissions.findIndex(
      sub => sub.questionId === questionId
    );

    const submissionData = {
      questionId,
      code: code || '',
      language: language || 'JavaScript',
      timeSpent: timeSpent || 0,
      notes: notes || '',
      submittedAt: new Date(),
      status: 'completed',
      timestamp: Date.now()
    };

    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      interview.codingSubmissions[existingSubmissionIndex] = submissionData;
      console.log('🔄 [CODING DONE] Updated existing submission for question:', questionId);
    } else {
      // Add new submission
      interview.codingSubmissions.push(submissionData);
      console.log('✅ [CODING DONE] Added new submission for question:', questionId);
    }

    await interview.save();

    console.log('✅ [CODING DONE] Coding submission marked as done successfully');
    console.log('📊 [CODING DONE] Total submissions:', interview.codingSubmissions.length);

    res.json({
      success: true,
      message: 'Coding question marked as done successfully',
      data: {
        questionId,
        submissionId: submissionData.timestamp,
        submittedAt: submissionData.submittedAt,
        totalSubmissions: interview.codingSubmissions.length,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ [CODING DONE] Error occurred:', error.message);
    console.error('🔍 [CODING DONE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to mark coding question as done'
    });
  }
});

// Get coding submissions endpoint
router.get('/:interviewId/coding-submissions', async (req, res) => {
  console.log('📋 [CODING SUBMISSIONS] Getting coding submissions for interview:', req.params.interviewId);
  
  try {
    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [CODING SUBMISSIONS] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    console.log('✅ [CODING SUBMISSIONS] Coding submissions retrieved successfully');
    console.log('📊 [CODING SUBMISSIONS] Total submissions:', interview.codingSubmissions?.length || 0);

    res.json({
      success: true,
      data: {
        interviewId: interview.interviewId,
        submissions: interview.codingSubmissions || [],
        totalSubmissions: interview.codingSubmissions?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [CODING SUBMISSIONS] Error occurred:', error.message);
    console.error('🔍 [CODING SUBMISSIONS] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch coding submissions'
    });
  }
});

// AI Voice Interviewer endpoint - converts AI questions to speech
router.post('/:interviewId/ai-voice', async (req, res) => {
  console.log('🎤 [AI VOICE] Converting AI question to speech:', req.params.interviewId);
  console.log('🔍 [AI VOICE] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, language, voice } = req.body;
    
    if (!question) {
      console.log('❌ [AI VOICE] Missing question text');
      return res.status(400).json({
        success: false,
        error: 'Question text is required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [AI VOICE] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // Create AI prompt for voice generation
    const aiPrompt = `
You are an AI voice interviewer. Convert this interview question into natural, conversational speech.

Question: ${question}
Language: ${language || 'English'}
Voice Style: ${voice || 'Professional but friendly'}

Requirements:
1. Make it sound natural and conversational
2. Add appropriate pauses and emphasis
3. Make it engaging and encouraging
4. Keep it concise but clear
5. Sound like a real interviewer asking the question

Convert the question into natural speech format that would sound good when spoken aloud.

Respond in JSON format:
{
  "voiceText": "The natural, conversational version of the question for speech",
  "emphasis": ["word1", "word2"],
  "pauses": [2, 5],
  "tone": "encouraging",
  "duration": "estimated duration in seconds"
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
`;

    // Try each model until one works
    let response = null;
    let lastError = null;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i];
      console.log(`🔄 [AI VOICE] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);

      try {
        response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI voice interviewer. Convert text questions into natural, conversational speech. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || 'http://localhost:3000',
            'X-Title': 'AI Voice Interviewer'
          }
        });

        console.log(`✅ [AI VOICE] Successfully used model: ${model}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.log(`❌ [AI VOICE] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;

        if (i === FALLBACK_MODELS.length - 1) {
          throw lastError;
        }
      }
    }

    const aiResponse = parseAIResponse(response.data.choices[0].message.content);
    
    if (!aiResponse) {
      console.log('⚠️ [AI VOICE] Failed to parse AI response, creating fallback voice text...');
      aiResponse = {
        voiceText: question,
        emphasis: [],
        pauses: [],
        tone: "encouraging",
        duration: "5"
      };
    }

    console.log('✅ [AI VOICE] Voice text generated successfully');

    res.json({
      success: true,
      data: {
        originalQuestion: question,
        voiceText: aiResponse.voiceText,
        emphasis: aiResponse.emphasis || [],
        pauses: aiResponse.pauses || [],
        tone: aiResponse.tone || "encouraging",
        duration: aiResponse.duration || "5",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [AI VOICE] Error occurred:', error.message);
    console.error('🔍 [AI VOICE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate voice text'
    });
  }
});

// AI Voice Interviewer with TTS endpoint
router.post('/:interviewId/ai-voice-speak', async (req, res) => {
  console.log('🎤 [AI VOICE SPEAK] Generating speech for AI question:', req.params.interviewId);
  console.log('🔍 [AI VOICE SPEAK] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, language, voice, speed } = req.body;
    
    if (!question) {
      console.log('❌ [AI VOICE SPEAK] Missing question text');
      return res.status(400).json({
        success: false,
        error: 'Question text is required'
      });
    }

    // Find the interview
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      approvalStatus: 'approved'
    });

    if (!interview) {
      console.log('❌ [AI VOICE SPEAK] Interview not found or not approved:', req.params.interviewId);
      return res.status(404).json({
        success: false,
        error: 'Interview not found or not available'
      });
    }

    // For now, return the text that can be used with browser TTS
    // In a full implementation, you would integrate with a TTS service like Google Cloud TTS, AWS Polly, or Azure Speech
    const voiceSettings = {
      text: question,
      language: language || 'en-US',
      voice: voice || 'default',
      speed: speed || 1.0,
      pitch: 1.0,
      volume: 1.0
    };

    console.log('✅ [AI VOICE SPEAK] Voice settings prepared for TTS');

    res.json({
      success: true,
      data: {
        text: voiceSettings.text,
        language: voiceSettings.language,
        voice: voiceSettings.voice,
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume,
        instructions: "Use browser SpeechSynthesis API or integrate with TTS service",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [AI VOICE SPEAK] Error occurred:', error.message);
    console.error('🔍 [AI VOICE SPEAK] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate speech'
    });
  }
});

// Helper function to generate candidate performance summaries
const getCandidateSummaries = (candidateAnswers) => {
  const candidateMap = new Map();
  
  candidateAnswers.forEach(answer => {
    const candidateId = answer.candidateId;
    
    if (!candidateMap.has(candidateId)) {
      candidateMap.set(candidateId, {
        candidateId: answer.candidateId,
        candidateName: answer.candidateName,
        candidateEmail: answer.candidateEmail,
        totalAnswers: 0,
        totalScore: 0,
        averageScore: 0,
        roundsCompleted: new Set(),
        answers: [],
        strengths: [],
        improvements: [],
        lastActivity: answer.timestamp
      });
    }
    
    const candidate = candidateMap.get(candidateId);
    candidate.totalAnswers++;
    candidate.totalScore += answer.aiEvaluation?.score || 0;
    candidate.roundsCompleted.add(answer.roundId);
    candidate.answers.push({
      roundId: answer.roundId,
      questionId: answer.questionId,
      question: answer.question,
      answer: answer.answer,
      score: answer.aiEvaluation?.score || 0,
      feedback: answer.aiEvaluation?.feedback || '',
      timeTaken: answer.timeTaken,
      timestamp: answer.timestamp
    });
    
    if (answer.aiEvaluation?.strengths) {
      candidate.strengths.push(...answer.aiEvaluation.strengths);
    }
    if (answer.aiEvaluation?.improvements) {
      candidate.improvements.push(...answer.aiEvaluation.improvements);
    }
    
    if (answer.timestamp > candidate.lastActivity) {
      candidate.lastActivity = answer.timestamp;
    }
  });
  
  // Calculate averages and convert to array
  return Array.from(candidateMap.values()).map(candidate => {
    candidate.averageScore = candidate.totalAnswers > 0 ? 
      (candidate.totalScore / candidate.totalAnswers) : 0;
    candidate.roundsCompleted = Array.from(candidate.roundsCompleted);
    candidate.completionRate = candidate.roundsCompleted.length;
    
    // Get unique strengths and improvements
    candidate.strengths = [...new Set(candidate.strengths)];
    candidate.improvements = [...new Set(candidate.improvements)];
    
    return candidate;
  }).sort((a, b) => b.averageScore - a.averageScore); // Sort by highest score first
};

// Get interview performance analytics (for recruiters only)
router.get('/:interviewId/performance', auth, async (req, res) => {
  console.log('📊 [PERFORMANCE] Fetching performance analytics for interview:', req.params.interviewId);
  console.log('👤 [PERFORMANCE] User ID:', req.user.id);
  
  try {
    const interview = await Interview.findOne({ 
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      console.log('❌ [PERFORMANCE] Interview not found or access denied');
      return res.status(404).json({
        success: false,
        error: 'Interview not found or access denied'
      });
    }

    console.log('✅ [PERFORMANCE] Interview found, generating performance analytics...');
    
    // Update statistics
    interview.updateStatistics();
    await interview.save();
    
    // Get candidate performance summaries
    const candidateSummaries = getCandidateSummaries(interview.candidateAnswers);
    console.log('📈 [PERFORMANCE] Generated summaries for', candidateSummaries.length, 'candidates');

    // Calculate detailed analytics
    const analytics = {
      overview: {
        totalCandidates: interview.statistics.totalCandidates,
        completedInterviews: interview.statistics.completedInterviews,
        averageScore: Math.round(interview.statistics.averageScore * 100) / 100,
        completionRate: Math.round(interview.statistics.completionRate * 100) / 100,
        totalAnswers: interview.candidateAnswers.length
      },
      scoreDistribution: {
        excellent: candidateSummaries.filter(c => c.averageScore >= 3.5).length,
        good: candidateSummaries.filter(c => c.averageScore >= 2.5 && c.averageScore < 3.5).length,
        satisfactory: candidateSummaries.filter(c => c.averageScore >= 1.5 && c.averageScore < 2.5).length,
        needsImprovement: candidateSummaries.filter(c => c.averageScore < 1.5).length
      },
      roundAnalytics: interview.rounds.map(round => {
        const roundAnswers = interview.candidateAnswers.filter(a => a.roundId === round.roundId);
        const roundScores = roundAnswers.map(a => a.aiEvaluation?.score || 0);
        const averageRoundScore = roundScores.length > 0 ? 
          roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length : 0;
        
        return {
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          questionCount: round.questions.length,
          totalAnswers: roundAnswers.length,
          averageScore: Math.round(averageRoundScore * 100) / 100,
          completionRate: Math.round((roundAnswers.length / interview.statistics.totalCandidates) * 100) / 100
        };
      }),
      timeAnalytics: {
        averageTimePerQuestion: interview.candidateAnswers.length > 0 ? 
          Math.round(interview.candidateAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / interview.candidateAnswers.length) : 0,
        fastestAnswer: interview.candidateAnswers.length > 0 ? 
          Math.min(...interview.candidateAnswers.map(a => a.timeTaken)) : 0,
        slowestAnswer: interview.candidateAnswers.length > 0 ? 
          Math.max(...interview.candidateAnswers.map(a => a.timeTaken)) : 0
      }
    };

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
          status: interview.status
        },
        analytics,
        candidateSummaries,
        rounds: interview.rounds.map(round => ({
          roundId: round.roundId,
          roundNumber: round.roundNumber,
          title: round.title,
          description: round.description,
          duration: round.duration,
          questionCount: round.questions.length
        }))
      }
    };

    console.log('📊 [PERFORMANCE] Performance analytics generated:', {
      totalCandidates: analytics.overview.totalCandidates,
      completedInterviews: analytics.overview.completedInterviews,
      averageScore: analytics.overview.averageScore,
      candidateSummaries: candidateSummaries.length
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ [PERFORMANCE] Error occurred:', error.message);
    console.error('🔍 [PERFORMANCE] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics'
    });
  }
});

module.exports = router;

