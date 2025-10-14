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
    const { prompt, scenario, userInput, step, isQuestionGeneration, conversationContext } = req.body;
    
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
      isQuestionGeneration,
      conversationHistoryLength: conversationContext?.length || 0
    });

    let aiResponse;
    
    if (isQuestionGeneration) {
      // Generate question for the specific step using conversation history
      const questionPrompt = generateConversationalQuestionPrompt(step, scenario, conversationContext);
      aiResponse = await callOpenRouterAPI(questionPrompt, req, true); // true = conversational mode
    } else {
      // Generate response based on user input
      if (!prompt || !userInput) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: prompt and userInput are required for response generation'
        });
      }
      aiResponse = await callOpenRouterAPI(prompt, req, false); // false = JSON mode
    }
    const aiContent = aiResponse.data.choices[0].message.content;
    
    console.log('📋 [SALES ROLE-PLAY] Raw AI response received, parsing...');
    
    // Parse AI response
    let responseData = null;
    
    if (isQuestionGeneration) {
      // For question generation, the response should be plain text
      const cleanedContent = aiContent.trim();
      console.log('🎯 [SALES ROLE-PLAY] AI-generated conversational question:', cleanedContent.substring(0, 100) + '...');
      
      responseData = {
        content: cleanedContent,
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

// Generate conversational question prompt based on conversation history
function generateConversationalQuestionPrompt(step, scenario, conversationContext) {
  const customerName = scenario.customerProfile.name;
  const companyName = scenario.customerProfile.company;
  
  // Build conversation history string
  let conversationHistory = '';
  if (conversationContext && conversationContext.length > 0) {
    conversationHistory = '\n\nCONVERSATION HISTORY:\n';
    conversationContext.forEach((msg, index) => {
      const speaker = msg.type === 'ai' ? customerName : 'Sales Candidate';
      conversationHistory += `${speaker}: ${msg.content}\n`;
    });
  }
  
  return `You are ${customerName}, a potential customer in a sales role-play interview scenario. You are having a natural, flowing conversation with a sales candidate.

SCENARIO CONTEXT:
${scenario.context}

YOUR PROFILE (${customerName}):
- Company: ${companyName}
- Pain Points: ${scenario.customerProfile.painPoints.join(', ')}
- Budget: ${scenario.customerProfile.budget}
- Timeline: ${scenario.customerProfile.timeline}
- Decision Style: ${scenario.customerProfile.decisionMakingStyle}
${conversationHistory}

CONVERSATION STRUCTURE:
This is a 3-question sales roleplay (Question 0, 1, and 2). You are currently generating Question ${step}.
- Question 0: Initial discovery - understand their approach, build rapport
- Question 1: Value discussion and objections - test their value proposition and objection handling
- Question 2: Decision and closing - test their closing skills and next steps

Based on the conversation so far, generate your next response as the customer. Your response should:
1. Be a natural continuation of the conversation - reference what the candidate just said
2. Stay in character as ${customerName} with your specific concerns and decision-making style
3. Test the candidate's sales skills appropriate for Question ${step}
4. Move the conversation forward organically based on what has been discussed
5. Be realistic - ask follow-up questions, raise concerns, or express interest based on the candidate's responses

IMPORTANT: 
- DO NOT use generic, scripted questions
- DO reference specific points the candidate made in their last response
- DO act like a real customer who is listening and responding to what's being said
- If the candidate addressed your concerns well, show interest; if not, push back naturally
- Keep responses concise (2-3 sentences max) to maintain natural conversation flow

Respond with ONLY your next statement or question as the customer - no explanations, no JSON, just what ${customerName} would naturally say next.`;
}

// Helper function to call OpenRouter API
async function callOpenRouterAPI(prompt, req = null, isConversational = false) {
  console.log('🤖 [OPENROUTER] Calling OpenRouter API for sales interview...');
  
  // Get the referer URL safely
  const getRefererUrl = () => {
    if (req) {
      return `${req.protocol}://${req.get('host')}`;
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  };
  
  // Different system prompts for conversational vs structured responses
  const systemPrompt = isConversational 
    ? 'You are a realistic potential customer in a sales role-play scenario. Respond naturally as the customer would, based on the conversation context. Be authentic, ask relevant questions, raise realistic concerns, and react to what the sales candidate says. Do not break character.'
    : 'You are an expert sales interviewer and role-play customer. You MUST respond with ONLY valid JSON. Do not include any text, explanations, or markdown outside the JSON structure. The JSON must be complete and properly formatted.';
  
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    
    // Try each model with retries
    for (let retry = 0; retry < 3; retry++) {
      try {
        console.log(`🎯 [OPENROUTER] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model} (attempt ${retry + 1}/3)`);
        
        const response = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
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
          timeout: 45000, // Increased timeout to 45 seconds
          validateStatus: function (status) {
            return status < 500; // Resolve only if status is less than 500
          }
        });
        
        // Check if response is successful
        if (response.status === 200 && response.data.choices && response.data.choices.length > 0) {
          console.log(`✅ [OPENROUTER] Success with model: ${model}`);
          return response;
        } else {
          throw new Error(`Invalid response: ${response.status}`);
        }
        
      } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.log(`❌ [OPENROUTER] Attempt ${retry + 1} failed for ${model}:`, errorMsg);
        
        // If this is the last retry for the last model, throw error
        if (i === FALLBACK_MODELS.length - 1 && retry === 2) {
          console.log('💥 [OPENROUTER] All models and retries exhausted');
          throw new Error('All AI models failed to generate sales response. Please check your internet connection.');
        }
        
        // Exponential backoff: wait longer between retries
        const waitTime = Math.min(1000 * Math.pow(2, retry), 5000);
        console.log(`⏳ [OPENROUTER] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
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

// Create fallback sales response based on conversation context
function createFallbackSalesResponse(userInput, step, scenario, conversationContext) {
  console.log('🔄 [FALLBACK SALES] Creating fallback sales response...');
  
  const customerName = scenario.customerProfile.name;
  
  // Analyze user input for context
  const userInputLower = userInput.toLowerCase();
  let response = '';
  
  // Check what the candidate mentioned and respond accordingly
  if (userInputLower.includes('cost') || userInputLower.includes('price') || userInputLower.includes('budget')) {
    response = "I appreciate you bringing up the cost. However, I'm more concerned about the ROI and how quickly we can see results. Can you walk me through some specific examples of cost savings your clients have achieved?";
  } else if (userInputLower.includes('implement') || userInputLower.includes('timeline') || userInputLower.includes('time')) {
    response = "That timeline is interesting. But I'm worried about disrupting our current operations during implementation. How do you typically handle the transition to minimize downtime?";
  } else if (userInputLower.includes('team') || userInputLower.includes('training') || userInputLower.includes('learn')) {
    response = "Training is definitely a concern for us. My team is already stretched thin. How much time commitment are we looking at for onboarding, and what kind of support do you provide during that period?";
  } else if (userInputLower.includes('competitor') || userInputLower.includes('different') || userInputLower.includes('compare')) {
    response = "I've heard similar pitches from your competitors. What specifically makes your solution stand out? I need concrete differentiators, not just marketing speak.";
  } else if (userInputLower.includes('roi') || userInputLower.includes('return') || userInputLower.includes('value')) {
    response = "The value proposition sounds good on paper, but I need to see real numbers. Do you have case studies from companies similar to ours that show measurable results?";
  } else if (userInputLower.includes('demo') || userInputLower.includes('show') || userInputLower.includes('see')) {
    response = "A demo would be helpful. But before we schedule that, I need to understand if this is even the right fit for our specific pain points. Can you tell me more about how you've solved similar challenges?";
  } else if (step === 0) {
    // Initial conversation - respond to their introduction
    response = "Thanks for that introduction. I've been looking at solutions to address our operational inefficiencies. What specific industries or use cases have you had the most success with?";
  } else if (step === 1) {
    // Mid conversation - raise objections
    response = "I see what you're saying, but I'm still not entirely convinced. We've tried similar solutions before and they didn't deliver. What makes this different, and how can you guarantee we won't face the same issues?";
  } else {
    // Later conversation - closing concerns
    response = "This is definitely interesting, and I can see potential value. However, I need to discuss this with my leadership team before making any commitments. What's your typical sales process from here, and what kind of timeline are we looking at?";
  }

  return {
    content: response,
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


