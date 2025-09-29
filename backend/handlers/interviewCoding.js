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
};

// Live AI Interviewer endpoint (POST) - handles coding-hints calls
const postCodingHints = async (req, res) => {
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

module.exports = {
  codingAssistant,
  generateCodingQuestion,
  getCodingHints,
  postCodingHints,
  markCodingDone,
  getCodingSubmissions
};
