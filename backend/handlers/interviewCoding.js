// Live coding interview handlers
const Interview = require('../models/Interview');
const axios = require('axios');
const { OPENROUTER_API_URL, FALLBACK_MODELS, parseAIResponse } = require('../utils/interviewUtils');

// Live AI Interviewer endpoint for dynamic coding questions
const codingAssistant = async (req, res) => {
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
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`,
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
};

// Generate live coding question endpoint
const generateCodingQuestion = async (req, res) => {
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
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`,
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
};

// Get coding hints endpoint (GET)
const getCodingHints = async (req, res) => {
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
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`,
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
};

// Live AI Interviewer endpoint (POST) - handles coding-hints calls
const postCodingHints = async (req, res) => {
  console.log('🤖 [LIVE AI INTERVIEWER] Processing live coding interaction:', req.params.interviewId);
  console.log('🔍 [LIVE AI INTERVIEWER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { question, currentCode, language, difficulty, isLiveComment, isInterviewer, questionNumber, previousQuestions, conversationHistory, previousResponses, codeLength, hasStartedCoding, userResponse, isFollowUp, conversationStep, isCodeComplete, generateTestCases } = req.body;
    
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

    // Handle test case generation
    if (generateTestCases) {
      console.log('🧪 [TEST CASES] Generating test cases for question:', question);
      
      try {
        const testCases = await generateTestCasesForQuestion(question, language);
        
        console.log('✅ [TEST CASES] Generated', testCases.length, 'test cases');
        
        return res.json({
          success: true,
          data: {
            testCases: testCases,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ [TEST CASES] Error generating test cases:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate test cases'
        });
      }
    }

    // Check if this is a sales question
    const isSalesQuestion = language === 'sales' || 
                           (question && question.toLowerCase().includes('sales')) ||
                           (currentCode && currentCode.toLowerCase().includes('sales'));

    // Create AI prompt for live interviewer (coding or sales)
    const aiPrompt = isSalesQuestion ? `
You are a LIVE AI sales interviewer conducting a dynamic sales interview. You must ask specific, follow-up questions based on the candidate's sales answer.

Original Question: ${question || 'General sales question'}
Sales Answer: ${currentCode || 'No answer provided yet'}
Difficulty: ${difficulty || 'medium'}
Question Number: ${questionNumber || 1}
Previous Questions Asked: ${previousQuestions ? previousQuestions.join(', ') : 'None'}

ANALYZE THE SALES ANSWER AND ASK SPECIFIC FOLLOW-UP QUESTIONS:

IMPORTANT: This is question ${questionNumber || 1} of 3. Make sure to ask a DIFFERENT type of question than the previous ones.

Based on their sales answer, ask relevant follow-up questions such as:
- "Can you elaborate on your sales approach in that situation?"
- "How would you handle objections from the customer?"
- "What sales techniques did you use to close that deal?"
- "How do you build rapport with potential customers?"
- "What would you do differently if you faced that situation again?"
- "How do you qualify leads before making a sales pitch?"
- "What metrics do you use to measure sales success?"

Make your question specific to their answer and relevant to sales best practices.

Respond in JSON format:
{
  "aiQuestion": "Your specific sales follow-up question",
  "codeAnalysis": "What you observe in their sales answer",
  "followUpQuestion": "A deeper question about their sales approach",
  "suggestion": "A subtle hint about sales best practices",
  "encouragement": "Motivational feedback"
}

IMPORTANT: Respond with ONLY valid JSON. No additional text or formatting.
` : `
You are a LIVE AI coding interviewer watching the candidate code in real-time. You must ask dynamic, specific questions based on what they're actually writing.

Original Question: ${question || 'General coding question'}
Programming Language: ${language || 'JavaScript'}
Current Code: ${currentCode || 'No code written yet'}
Difficulty: ${difficulty || 'medium'}
Question Number: ${questionNumber || 1}
Previous Questions Asked: ${previousQuestions ? previousQuestions.join(', ') : 'None'}

CONVERSATION CONTEXT:
- Previous AI Responses: ${previousResponses || 0}
- Code Length: ${codeLength || 0} characters
- Has Started Coding: ${hasStartedCoding ? 'Yes' : 'No'}
- Code Complete: ${isCodeComplete ? 'Yes' : 'No'}
- Conversation Step: ${conversationStep || 0}
- Recent Conversation: ${conversationHistory || 'No previous conversation'}
${userResponse ? `- User Response: "${userResponse}"` : ''}
${isFollowUp ? '- This is a FOLLOW-UP response to user input' : ''}

STRUCTURED CONVERSATION FLOW:
${conversationStep === 1 ? '- STEP 1: Ask about their overall approach and strategy' : ''}
${conversationStep === 2 ? '- STEP 2: Ask about implementation details, edge cases, or optimization' : ''}
${conversationStep === 3 ? '- STEP 3: Thank them and indicate conversation is complete' : ''}

IMPORTANT: Follow the structured conversation flow. Each step should build on the previous one.

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

${conversationStep === 1 ? `
STEP 1 GUIDELINES (First Question):
- Ask about their overall approach and strategy
- Focus on high-level problem-solving approach
- Examples: "What was your overall strategy for solving this problem?", "How did you approach breaking down this challenge?", "What was your thought process for this solution?"
` : ''}

${conversationStep === 2 ? `
STEP 2 GUIDELINES (Second Question):
- Ask about implementation details, edge cases, or optimization
- Focus on technical depth and code quality
- Examples: "How would you handle edge cases like [specific scenario]?", "What's the time complexity of your approach?", "How would you optimize this for better performance?", "What would you do differently if you had more time?"
` : ''}

${conversationStep === 3 ? `
STEP 3 GUIDELINES (Final Response):
- Thank them for their detailed explanation
- Acknowledge their problem-solving skills
- Indicate the conversation is complete
- Examples: "Thank you for the detailed explanation! Your approach shows excellent problem-solving skills.", "Great work! Your solution demonstrates good understanding of [concept]. Let's move on to the next question."
` : ''}

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
            'HTTP-Referer': process.env.OPENROUTER_REFERER_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`,
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
      
      // Check if this is a sales question and create appropriate fallback
      if (isSalesQuestion) {
        // Try to extract the question from the raw response if it's plain text
        const rawResponse = response.data.choices[0].message.content;
        if (rawResponse && typeof rawResponse === 'string' && rawResponse.trim()) {
          console.log('🔄 [LIVE AI INTERVIEWER] Using raw response as sales question:', rawResponse);
          aiResponse = {
            aiQuestion: rawResponse.trim(),
            codeAnalysis: "The candidate provided a sales answer. Let's explore further.",
            followUpQuestion: "Can you elaborate on your sales approach?",
            suggestion: "Consider discussing specific sales techniques and results.",
            encouragement: "Good answer! Let's dive deeper into your sales experience."
          };
        } else {
          aiResponse = {
            aiQuestion: "Can you tell me more about your sales experience and approach?",
            codeAnalysis: "The candidate is discussing sales. Let's explore their methodology.",
            followUpQuestion: "How do you typically handle customer objections?",
            suggestion: "Consider discussing specific sales scenarios and outcomes.",
            encouragement: "Great start! Let's explore your sales expertise further."
          };
        }
      } else {
        aiResponse = {
          aiQuestion: "I can see you're working on the solution. Can you walk me through your current approach?",
          codeAnalysis: "The code is being developed. Let's discuss the approach.",
          followUpQuestion: "What's your thought process behind this implementation?",
          suggestion: "Consider thinking about edge cases and time complexity.",
          encouragement: "Good start! Keep going and explain your reasoning as you code."
        };
      }
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
};

// Mark coding question as done endpoint
const markCodingDone = async (req, res) => {
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
};

// Get coding submissions endpoint
const getCodingSubmissions = async (req, res) => {
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
};

// Generate test cases for a coding question
const generateTestCasesForQuestion = async (question, language) => {
  try {
    console.log('🧪 [TEST CASES] Analyzing question for test case generation:', question);
    
    // Create AI prompt for test case generation
    const aiPrompt = `
You are a test case generator for coding interviews. Generate SPECIFIC test cases for this exact question:

QUESTION: "${question}"
LANGUAGE: ${language}

CRITICAL REQUIREMENTS:
1. Analyze the question to understand what the code should accomplish
2. Create REAL, SPECIFIC test cases with actual input values and expected outputs
3. Do NOT use placeholder text like "realistic input" or "expected output"
4. Use concrete examples that would actually test the solution
5. Cover basic functionality, edge cases, and error conditions

EXAMPLES OF GOOD TEST CASES:
- For factorial: input "5", expectedOutput "120"
- For string reversal: input "hello", expectedOutput "olleh"  
- For array sorting: input "[3,1,4,1,5]", expectedOutput "[1,1,3,4,5]"
- For web scraping: input "https://example.com", expectedOutput "Data scraped successfully"

RESPOND WITH ONLY VALID JSON - NO OTHER TEXT:
{
  "testCases": [
    {
      "id": 1,
      "name": "Basic functionality test",
      "input": "ACTUAL_CONCRETE_INPUT_VALUE",
      "expectedOutput": "ACTUAL_EXPECTED_OUTPUT_VALUE",
      "description": "Tests basic functionality"
    },
    {
      "id": 2,
      "name": "Edge case test", 
      "input": "ACTUAL_EDGE_CASE_INPUT",
      "expectedOutput": "ACTUAL_EDGE_CASE_OUTPUT",
      "description": "Tests edge case handling"
    },
    {
      "id": 3,
      "name": "Error handling test",
      "input": "ACTUAL_ERROR_INPUT",
      "expectedOutput": "ACTUAL_ERROR_OUTPUT",
      "description": "Tests error handling"
    }
  ]
}

REMEMBER: Replace ALL placeholder text with actual, specific values that make sense for this question!
`;

    console.log('🧪 [TEST CASES] Sending AI prompt for test case generation');
    
    // Use the same AI service as other functions
    const aiResponse = await parseAIResponse(aiPrompt);
    
    console.log('🧪 [TEST CASES] AI response received:', aiResponse);
    
    if (aiResponse && aiResponse.testCases && aiResponse.testCases.length > 0) {
      // Validate that test cases don't contain placeholder text
      const hasPlaceholderText = aiResponse.testCases.some(testCase => 
        testCase.input && (
          testCase.input.includes('realistic input') ||
          testCase.input.includes('expected output') ||
          testCase.input.includes('ACTUAL_') ||
          testCase.input.includes('edge case input') ||
          testCase.input.includes('invalid input')
        ) ||
        testCase.expectedOutput && (
          testCase.expectedOutput.includes('expected output') ||
          testCase.expectedOutput.includes('ACTUAL_') ||
          testCase.expectedOutput.includes('edge case output') ||
          testCase.expectedOutput.includes('error message')
        )
      );
      
      if (hasPlaceholderText) {
        console.log('⚠️ [TEST CASES] AI response contains placeholder text, using fallback');
        return generateFallbackTestCases(question, language);
      }
      
      console.log('✅ [TEST CASES] Successfully generated', aiResponse.testCases.length, 'AI test cases');
      return aiResponse.testCases;
    } else {
      console.log('⚠️ [TEST CASES] AI response invalid, using fallback');
      return generateFallbackTestCases(question, language);
    }
  } catch (error) {
    console.error('❌ [TEST CASES] Error generating test cases with AI:', error);
    return generateFallbackTestCases(question, language);
  }
};

// Extract key information from question for better test case generation
const extractQuestionInfo = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  // Extract function names, variables, or specific requirements
  const functionMatches = question.match(/(?:function|def|create|write|implement)\s+(\w+)/gi);
  const variableMatches = question.match(/(?:variable|input|parameter)\s+(\w+)/gi);
  const numberMatches = question.match(/\b(\d+)\b/g);
  const stringMatches = question.match(/"([^"]+)"/g);
  
  return {
    functions: functionMatches || [],
    variables: variableMatches || [],
    numbers: numberMatches || [],
    strings: stringMatches || [],
    isWebScraping: lowerQuestion.includes('scrape') || lowerQuestion.includes('web scraping') || lowerQuestion.includes('website'),
    isArray: lowerQuestion.includes('array') || lowerQuestion.includes('list') || lowerQuestion.includes('sort'),
    isString: lowerQuestion.includes('string') || lowerQuestion.includes('text') || lowerQuestion.includes('word'),
    isDatabase: lowerQuestion.includes('database') || lowerQuestion.includes('sql') || lowerQuestion.includes('query'),
    isFile: lowerQuestion.includes('file') || lowerQuestion.includes('read') || lowerQuestion.includes('write'),
    isApi: lowerQuestion.includes('api') || lowerQuestion.includes('http') || lowerQuestion.includes('request'),
    isFactorial: lowerQuestion.includes('factorial'),
    isFibonacci: lowerQuestion.includes('fibonacci'),
    isPrime: lowerQuestion.includes('prime'),
    isPalindrome: lowerQuestion.includes('palindrome'),
    isReverse: lowerQuestion.includes('reverse'),
    isMathematical: lowerQuestion.includes('calculate') || lowerQuestion.includes('math') || lowerQuestion.includes('number')
  };
};

// Fallback test case generation
const generateFallbackTestCases = (question, language) => {
  console.log('🔄 [FALLBACK] Generating fallback test cases for:', question);
  
  const questionInfo = extractQuestionInfo(question);
  const lowerQuestion = question.toLowerCase();
  
  // Factorial questions
  if (questionInfo.isFactorial) {
    return [
      {
        id: 1,
        name: "Basic Factorial Test",
        input: "5",
        expectedOutput: "120",
        description: "Test factorial of 5"
      },
      {
        id: 2,
        name: "Edge Case - Zero",
        input: "0",
        expectedOutput: "1",
        description: "Test factorial of 0"
      },
      {
        id: 3,
        name: "Edge Case - One",
        input: "1",
        expectedOutput: "1",
        description: "Test factorial of 1"
      }
    ];
  }
  
  // Fibonacci questions
  if (questionInfo.isFibonacci) {
    return [
      {
        id: 1,
        name: "Basic Fibonacci Test",
        input: "5",
        expectedOutput: "5",
        description: "Test fibonacci of 5"
      },
      {
        id: 2,
        name: "Edge Case - Zero",
        input: "0",
        expectedOutput: "0",
        description: "Test fibonacci of 0"
      },
      {
        id: 3,
        name: "Edge Case - One",
        input: "1",
        expectedOutput: "1",
        description: "Test fibonacci of 1"
      }
    ];
  }
  
  // Prime number questions
  if (questionInfo.isPrime) {
    return [
      {
        id: 1,
        name: "Prime Number Test",
        input: "7",
        expectedOutput: "true",
        description: "Test if 7 is prime"
      },
      {
        id: 2,
        name: "Non-Prime Test",
        input: "4",
        expectedOutput: "false",
        description: "Test if 4 is not prime"
      },
      {
        id: 3,
        name: "Edge Case - Two",
        input: "2",
        expectedOutput: "true",
        description: "Test if 2 is prime"
      }
    ];
  }
  
  // Palindrome questions
  if (questionInfo.isPalindrome) {
    return [
      {
        id: 1,
        name: "Palindrome Test",
        input: "racecar",
        expectedOutput: "true",
        description: "Test if 'racecar' is a palindrome"
      },
      {
        id: 2,
        name: "Non-Palindrome Test",
        input: "hello",
        expectedOutput: "false",
        description: "Test if 'hello' is not a palindrome"
      },
      {
        id: 3,
        name: "Empty String Test",
        input: "",
        expectedOutput: "true",
        description: "Test empty string palindrome"
      }
    ];
  }
  
  // Web scraping questions
  if (questionInfo.isWebScraping) {
    const sampleUrl = questionInfo.strings.length > 0 ? questionInfo.strings[0].replace(/"/g, '') : "https://example.com";
    return [
      {
        id: 1,
        name: "Basic Scraping Test",
        input: sampleUrl,
        expectedOutput: "Data scraped successfully",
        description: "Test basic web scraping functionality"
      },
      {
        id: 2,
        name: "Invalid URL Test",
        input: "not-a-valid-url",
        expectedOutput: "Error: Invalid URL format",
        description: "Test error handling for invalid URLs"
      },
      {
        id: 3,
        name: "Empty Page Test",
        input: "https://httpstat.us/204",
        expectedOutput: "No content found",
        description: "Test handling of empty pages"
      }
    ];
  }
  
  // Array/List manipulation questions
  if (questionInfo.isArray) {
    const sampleNumbers = questionInfo.numbers.length > 0 ? questionInfo.numbers.slice(0, 5) : ["3", "1", "4", "1", "5"];
    return [
      {
        id: 1,
        name: "Basic Array Test",
        input: `[${sampleNumbers.join(', ')}]`,
        expectedOutput: `[${sampleNumbers.sort().join(', ')}]`,
        description: "Test basic array processing"
      },
      {
        id: 2,
        name: "Empty Array Test",
        input: "[]",
        expectedOutput: "[]",
        description: "Test empty array handling"
      },
      {
        id: 3,
        name: "Single Element Test",
        input: `[${sampleNumbers[0]}]`,
        expectedOutput: `[${sampleNumbers[0]}]`,
        description: "Test single element array"
      }
    ];
  }
  
  // String manipulation questions
  if (questionInfo.isString) {
    const sampleString = questionInfo.strings.length > 0 ? questionInfo.strings[0].replace(/"/g, '') : "Hello World";
    return [
      {
        id: 1,
        name: "Basic String Test",
        input: sampleString,
        expectedOutput: sampleString.split('').reverse().join(''),
        description: "Test basic string manipulation"
      },
      {
        id: 2,
        name: "Empty String Test",
        input: "",
        expectedOutput: "",
        description: "Test empty string handling"
      },
      {
        id: 3,
        name: "Special Characters Test",
        input: "Hello, World! 123",
        expectedOutput: "321 !dlroW ,olleH",
        description: "Test string with special characters"
      }
    ];
  }
  
  // Database questions
  if (lowerQuestion.includes('database') || lowerQuestion.includes('sql') || lowerQuestion.includes('query')) {
    return [
      {
        id: 1,
        name: "Basic Query Test",
        input: "SELECT * FROM users",
        expectedOutput: "Query executed successfully",
        description: "Test basic database query"
      },
      {
        id: 2,
        name: "Invalid Query Test",
        input: "INVALID SQL",
        expectedOutput: "Error: Invalid SQL syntax",
        description: "Test error handling for invalid queries"
      },
      {
        id: 3,
        name: "Empty Result Test",
        input: "SELECT * FROM empty_table",
        expectedOutput: "No results found",
        description: "Test handling of empty results"
      }
    ];
  }
  
  // File handling questions
  if (lowerQuestion.includes('file') || lowerQuestion.includes('read') || lowerQuestion.includes('write')) {
    return [
      {
        id: 1,
        name: "Basic File Test",
        input: "test.txt",
        expectedOutput: "File processed successfully",
        description: "Test basic file operations"
      },
      {
        id: 2,
        name: "Non-existent File Test",
        input: "nonexistent.txt",
        expectedOutput: "Error: File not found",
        description: "Test error handling for missing files"
      },
      {
        id: 3,
        name: "Empty File Test",
        input: "empty.txt",
        expectedOutput: "File is empty",
        description: "Test handling of empty files"
      }
    ];
  }
  
  // API questions
  if (lowerQuestion.includes('api') || lowerQuestion.includes('http') || lowerQuestion.includes('request')) {
    return [
      {
        id: 1,
        name: "Basic API Test",
        input: "GET /api/users",
        expectedOutput: "API call successful",
        description: "Test basic API functionality"
      },
      {
        id: 2,
        name: "Invalid Endpoint Test",
        input: "GET /api/invalid",
        expectedOutput: "Error: 404 Not Found",
        description: "Test error handling for invalid endpoints"
      },
      {
        id: 3,
        name: "Server Error Test",
        input: "GET /api/error",
        expectedOutput: "Error: 500 Internal Server Error",
        description: "Test handling of server errors"
      }
    ];
  }
  
  // Default generic test cases
  console.log('🔄 [FALLBACK] Using generic test cases');
  return [
    {
      id: 1,
      name: "Basic Functionality Test",
      input: "test input",
      expectedOutput: "expected output",
      description: "Test basic functionality"
    },
    {
      id: 2,
      name: "Edge Case Test",
      input: "edge case input",
      expectedOutput: "edge case output",
      description: "Test edge case handling"
    },
    {
      id: 3,
      name: "Error Handling Test",
      input: "invalid input",
      expectedOutput: "error message",
      description: "Test error handling"
    }
  ];
};

// Debug endpoint to test test case generation
const testTestCases = async (req, res) => {
  try {
    const { question, language } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }
    
    console.log('🧪 [DEBUG] Testing test case generation for:', question);
    
    const testCases = await generateTestCasesForQuestion(question, language || 'javascript');
    
    res.json({
      success: true,
      data: {
        question,
        language: language || 'javascript',
        testCases,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error testing test cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test cases'
    });
  }
};

module.exports = {
  codingAssistant,
  generateCodingQuestion,
  getCodingHints,
  postCodingHints,
  markCodingDone,
  getCodingSubmissions,
  testTestCases,
  generateTestCasesForQuestion
};
