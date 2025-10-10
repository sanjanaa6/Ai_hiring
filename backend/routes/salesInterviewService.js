const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-3.5-turbo';
const FALLBACK_MODELS = [
  'openai/gpt-3.5-turbo',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemini-pro',
  'anthropic/claude-3-haiku'
];

// Generate AI response for sales role-play scenarios
router.post('/generate-sales-response', auth, async (req, res) => {
  console.log('🎭 [SALES ROLE-PLAY] Generating AI response for sales scenario...');
  
  try {
    const { prompt, scenario, userInput, step, isQuestionGeneration } = req.body;
    
    if (!scenario) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: scenario is required'
      });
    }

    console.log('📝 [SALES ROLE-PLAY] Request details:', {
      step,
      scenarioTitle: scenario.title,
      userInputLength: userInput?.length || 0,
      isQuestionGeneration
    });

    let aiResponse;
    
    if (isQuestionGeneration) {
      // Generate question for the specific step
      const questionPrompt = generateQuestionPrompt(step, scenario);
      aiResponse = await callOpenRouterAPI(questionPrompt, req);
    } else {
      // Generate response based on user input
      if (!prompt || !userInput) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: prompt and userInput are required for response generation'
        });
      }
      aiResponse = await callOpenRouterAPI(prompt, req);
    }
    const aiContent = aiResponse.data.choices[0].message.content;
    
    console.log('📋 [SALES ROLE-PLAY] Raw AI response received, parsing...');
    
    // Parse AI response
    let responseData = null;
    
    if (isQuestionGeneration) {
      // For question generation, the response should be plain text
      responseData = {
        content: aiContent.trim(),
        nextStep: step,
        feedback: null,
        metrics: null
      };
    } else {
      // For response generation, try to parse as JSON
      try {
        responseData = JSON.parse(aiContent);
      } catch (parseError) {
        console.log('⚠️ [SALES ROLE-PLAY] Failed to parse as JSON, creating fallback response...');
        
        // Create fallback response based on step
        responseData = createFallbackSalesResponse(userInput, step, scenario);
      }

      // Validate response structure
      if (!responseData.content) {
        console.log('⚠️ [SALES ROLE-PLAY] Invalid response structure, creating fallback...');
        responseData = createFallbackSalesResponse(userInput, step, scenario);
      }
    }

    console.log('✅ [SALES ROLE-PLAY] Sales response generated successfully');

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ [SALES ROLE-PLAY] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate sales response'
    });
  }
});

// Generate sales interview questions with role-play scenarios
router.post('/generate-sales-questions', auth, async (req, res) => {
  console.log('🎯 [SALES QUESTIONS] Generating sales interview questions...');
  
  try {
    const { jobDetails, roundType } = req.body;
    
    if (!jobDetails) {
      return res.status(400).json({
        success: false,
        error: 'Job details are required'
      });
    }

    console.log('📝 [SALES QUESTIONS] Job details:', {
      title: jobDetails.title,
      level: jobDetails.level,
      roundType
    });

    const prompt = generateSalesQuestionsPrompt(jobDetails, roundType);
    
    // Call OpenRouter API to generate sales questions
    const aiResponse = await callOpenRouterAPI(prompt, req);
    const aiContent = aiResponse.data.choices[0].message.content;
    
    console.log('📋 [SALES QUESTIONS] Raw AI response received, parsing...');
    
    // Parse AI response
    let questionsData = null;
    try {
      questionsData = JSON.parse(aiContent);
    } catch (parseError) {
      console.log('⚠️ [SALES QUESTIONS] Failed to parse as JSON, creating fallback questions...');
      questionsData = createFallbackSalesQuestions(jobDetails, roundType);
    }

    console.log('✅ [SALES QUESTIONS] Sales questions generated successfully');

    res.json({
      success: true,
      data: questionsData
    });

  } catch (error) {
    console.error('❌ [SALES QUESTIONS] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate sales questions'
    });
  }
});

// Generate question prompt for specific step
function generateQuestionPrompt(step, scenario) {
  const customerName = scenario.customerProfile.name;
  const companyName = scenario.customerProfile.company;
  
  return `You are a potential customer in a sales role-play interview scenario. Generate exactly one question for step ${step} of a 3-step sales conversation.

SCENARIO CONTEXT:
${scenario.context}

CUSTOMER PROFILE:
- Name: ${customerName}
- Company: ${companyName}
- Pain Points: ${scenario.customerProfile.painPoints.join(', ')}
- Budget: ${scenario.customerProfile.budget}
- Timeline: ${scenario.customerProfile.timeline}
- Decision Style: ${scenario.customerProfile.decisionMakingStyle}

CONVERSATION FLOW:
- Step 0: Initial interest and needs discovery
- Step 1: Objections and concerns about cost/timeline
- Step 2: Decision process and next steps

Generate a realistic customer question for step ${step} that:
1. Stays in character as the customer
2. Tests the candidate's sales skills appropriately
3. Moves the conversation forward naturally
4. Is relevant to the scenario and customer profile

Respond with ONLY the question text - no explanations, no JSON, just the question itself.`;
}

// Helper function to call OpenRouter API
async function callOpenRouterAPI(prompt, req = null) {
  console.log('🤖 [OPENROUTER] Calling OpenRouter API for sales interview...');
  
  // Get the referer URL safely
  const getRefererUrl = () => {
    if (req) {
      return `${req.protocol}://${req.get('host')}`;
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  };
  
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    try {
      console.log(`🎯 [OPENROUTER] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);
      
      const response = await axios.post(OPENROUTER_API_URL, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales interviewer and role-play customer. You MUST respond with ONLY valid JSON. Do not include any text, explanations, or markdown outside the JSON structure. The JSON must be complete and properly formatted.'
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
          'HTTP-Referer': getRefererUrl(),
          'X-Title': 'AI Sales Interview Platform'
        },
        timeout: 30000
      });
      
      console.log(`✅ [OPENROUTER] Success with model: ${model}`);
      return response;
      
    } catch (error) {
      console.log(`❌ [OPENROUTER] Failed with model: ${model}`, error.response?.status || error.message);
      
      if (i === FALLBACK_MODELS.length - 1) {
        console.log('💥 [OPENROUTER] All models failed');
        throw new Error('All AI models failed to generate sales response');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Generate sales questions prompt
function generateSalesQuestionsPrompt(jobDetails, roundType) {
  const { title, description, level } = jobDetails;
  
  return `You are an expert sales interviewer. Generate exactly 5 sales interview questions for this SPECIFIC sales position.

Job Details:
- Title: ${title}
- Description: ${description}
- Level: ${level}
- Round Type: ${roundType}

Create interactive sales role-play scenarios where the candidate can demonstrate their sales skills through realistic conversations.

For each question, provide:
1. A realistic sales scenario
2. Customer profile and context
3. Specific objectives to test
4. Expected sales skills to demonstrate

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "type": "sales-role-play",
      "question": "Specific sales scenario description",
      "scenario": {
        "context": "Detailed scenario context",
        "customerProfile": {
          "name": "Customer Name",
          "title": "Customer Title",
          "company": "Company Name",
          "painPoints": ["Pain point 1", "Pain point 2"],
          "budget": "Budget range",
          "timeline": "Decision timeline",
          "decisionMakingStyle": "Decision making style"
        },
        "objectives": ["Objective 1", "Objective 2", "Objective 3"],
        "challenges": ["Challenge 1", "Challenge 2"]
      },
      "expectedAnswer": "What to look for in the candidate's approach",
      "timeLimit": 10,
      "difficulty": "medium",
      "evaluationCriteria": {
        "rapportBuilding": "Ability to build rapport and trust",
        "needsDiscovery": "Skill in discovering customer needs",
        "valueProposition": "Effectiveness of value proposition presentation",
        "objectionHandling": "Ability to handle objections professionally",
        "closingTechnique": "Skill in closing or securing next steps"
      }
    }
  ]
}

Make sure each scenario is directly relevant to the ${title} role and tests practical sales skills.`;
}

// Create fallback sales response
function createFallbackSalesResponse(userInput, step, scenario) {
  console.log('🔄 [FALLBACK SALES] Creating fallback sales response...');
  
  const customerName = scenario.customerProfile.name;
  const responses = {
    introduction: [
      "That's interesting. Can you tell me more about your company and how you've helped similar businesses?",
      "I appreciate you taking the time to meet with me. What specific challenges are you facing right now?",
      "Before we dive deeper, I'd like to understand your current situation better. What's working well for you?"
    ],
    pitch: [
      "That sounds promising, but I'm concerned about the implementation process. How long does it typically take?",
      "The benefits you mentioned are interesting, but I need to see some concrete ROI data. Do you have case studies?",
      "I like what I'm hearing, but I'm worried about the cost. What kind of investment are we talking about?"
    ],
    objection: [
      "I understand your point, but I'm still not convinced this is the right solution for us. What makes you different from competitors?",
      "That's a good point, but I'm concerned about the learning curve for my team. How do you handle training?",
      "I see the value, but I need to discuss this with my team first. What's your timeline for implementation?"
    ],
    closing: [
      "I'm interested, but I need to think about it. What's the next step in your process?",
      "This looks good, but I need to get approval from my manager. When do you need a decision?",
      "I like what I see, but I want to compare this with a couple of other options. Can you send me a proposal?"
    ],
    feedback: [
      "Thank you for the presentation. I'll review everything and get back to you soon.",
      "I appreciate your time today. I'll discuss this with my team and let you know our decision.",
      "This has been very informative. I'll be in touch once I've had a chance to review everything."
    ]
  };

  const stepResponses = responses[step] || responses.introduction;
  const randomResponse = stepResponses[Math.floor(Math.random() * stepResponses.length)];

  return {
    content: randomResponse,
    nextStep: getNextStep(step),
    feedback: generateFeedback(userInput, step),
    metrics: generateMetrics(userInput, step)
  };
}

// Create fallback sales questions
function createFallbackSalesQuestions(jobDetails, roundType) {
  console.log('🔄 [FALLBACK SALES] Creating fallback sales questions...');
  
  const { title, level } = jobDetails;
  
  const questions = [
    {
      id: "q1",
      type: "sales-role-play",
      question: "You're meeting with a potential client who is interested in your product but has concerns about cost and implementation. How do you handle this situation?",
      scenario: {
        context: "You're presenting your product to a mid-size company. The prospect is interested but has budget concerns and implementation questions.",
        customerProfile: {
          name: "Sarah Johnson",
          title: "VP of Operations",
          company: "TechCorp Solutions",
          painPoints: ["High operational costs", "Inefficient processes", "Need for better analytics"],
          budget: "Mid-range",
          timeline: "3-6 months",
          decisionMakingStyle: "Analytical and cost-conscious"
        },
        objectives: ["Build rapport", "Address cost concerns", "Present value proposition", "Secure next steps"],
        challenges: ["Budget constraints", "Implementation timeline", "Team training needs"]
      },
      expectedAnswer: "Look for ability to build rapport, address objections professionally, present clear value proposition, and secure next steps.",
      timeLimit: 10,
      difficulty: "medium",
      evaluationCriteria: {
        rapportBuilding: "Ability to build rapport and trust",
        needsDiscovery: "Skill in discovering customer needs",
        valueProposition: "Effectiveness of value proposition presentation",
        objectionHandling: "Ability to handle objections professionally",
        closingTechnique: "Skill in closing or securing next steps"
      }
    },
    {
      id: "q2",
      type: "sales-role-play",
      question: "A prospect mentions they're already working with a competitor. How do you differentiate your solution and win them over?",
      scenario: {
        context: "You're in a competitive sales situation where the prospect is already using a competitor's solution.",
        customerProfile: {
          name: "Mike Chen",
          title: "Director of Sales",
          company: "GrowthCorp Inc",
          painPoints: ["Current solution limitations", "High costs", "Poor customer support"],
          budget: "High",
          timeline: "1-3 months",
          decisionMakingStyle: "Results-oriented and data-driven"
        },
        objectives: ["Understand current solution gaps", "Present competitive advantages", "Build urgency", "Schedule demo"],
        challenges: ["Existing relationship with competitor", "Change resistance", "Feature comparison"]
      },
      expectedAnswer: "Look for competitive analysis skills, ability to identify gaps in current solution, and effective differentiation strategies.",
      timeLimit: 10,
      difficulty: "hard",
      evaluationCriteria: {
        rapportBuilding: "Ability to build rapport despite competitive situation",
        needsDiscovery: "Skill in uncovering pain points with current solution",
        valueProposition: "Effectiveness of competitive differentiation",
        objectionHandling: "Ability to handle competitive objections",
        closingTechnique: "Skill in creating urgency and next steps"
      }
    }
  ];

  return { questions };
}

// Helper functions
function getNextStep(currentStep) {
  const stepFlow = {
    introduction: 'pitch',
    pitch: 'objection',
    objection: 'closing',
    closing: 'feedback',
    feedback: 'feedback'
  };
  return stepFlow[currentStep] || 'pitch';
}

function generateFeedback(userInput, step) {
  const feedbacks = {
    introduction: "Good start on building rapport. Consider asking more specific questions about their current challenges.",
    pitch: "Nice value proposition presentation. Make sure to address their specific pain points.",
    objection: "Good objection handling. Try to understand the root cause of their concern.",
    closing: "Effective closing approach. Be clear about next steps and timeline.",
    feedback: "Great job on the sales conversation. You demonstrated strong sales skills."
  };
  return feedbacks[step] || "Good response. Keep building on your sales approach.";
}

function generateMetrics(userInput, step) {
  // Simple scoring based on response length and content
  const baseScore = Math.min(5, Math.max(1, Math.floor(userInput.length / 50) + 2));
  
  return {
    pitchQuality: baseScore,
    objectionHandling: baseScore,
    closingTechnique: baseScore,
    communication: baseScore
  };
}

module.exports = router;


