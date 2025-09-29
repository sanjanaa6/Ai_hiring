// AI Interview Generation Service
const axios = require('axios');
const { OPENROUTER_API_URL, FALLBACK_MODELS, parseAIResponse } = require('../utils/interviewUtils');
const { createFallbackInterview } = require('../utils/fallbackInterview');

// Helper function to create role-specific interview from structured prompt
async function createRoleSpecificInterview(prompt, jobDetails) {
  try {
    const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🤖 [AI INTERVIEW] Generating complete AI interview for:', jobDetails.title);
    console.log('🔍 [AI INTERVIEW] Job details:', {
      title: jobDetails.title,
      company: jobDetails.company,
      description: jobDetails.description?.substring(0, 100) + '...'
    });
    
    // Create role-specific AI prompt for interview generation
    // Enhanced role detection that checks both title and description
    const titleLower = jobDetails.title.toLowerCase();
    const descriptionLower = (jobDetails.description || '').toLowerCase();
    
    const isDeveloperRole = titleLower.includes('developer') || 
                           titleLower.includes('engineer') || 
                           titleLower.includes('programmer') ||
                           titleLower.includes('coder') ||
                           titleLower.includes('software') ||
                           titleLower.includes('frontend') ||
                           titleLower.includes('backend') ||
                           titleLower.includes('fullstack') ||
                           titleLower.includes('full-stack') ||
                           descriptionLower.includes('coding') ||
                           descriptionLower.includes('programming') ||
                           descriptionLower.includes('python') ||
                           descriptionLower.includes('java') ||
                           descriptionLower.includes('javascript') ||
                           descriptionLower.includes('react') ||
                           descriptionLower.includes('node') ||
                           descriptionLower.includes('sql') ||
                           descriptionLower.includes('algorithm') ||
                           descriptionLower.includes('data structure');
    
    console.log('🔍 [ROLE DETECTION] Job Title:', jobDetails.title);
    console.log('🔍 [ROLE DETECTION] Is Developer Role:', isDeveloperRole);
    console.log('🔍 [ROLE DETECTION] Description contains coding keywords:', 
      descriptionLower.includes('coding') || descriptionLower.includes('programming') || 
      descriptionLower.includes('python') || descriptionLower.includes('java'));
    
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
NON-TECHNICAL ROLE REQUIREMENTS:
- Round 2 MUST be a "Professional Skills & Knowledge" round
- Round 3 MUST be a "Problem Solving & Scenarios" round
- Include role-specific professional knowledge and skills
- Add industry-specific scenarios and challenges
- Focus on professional competencies and expertise
- DO NOT include any coding, programming, or technical implementation questions
- DO NOT include system design or architecture questions
- Focus on soft skills, industry knowledge, and role-specific competencies

Round Structure:
- Round 1: Introduction & Background (5 questions)
- Round 2: Professional Skills & Knowledge (5 questions) 
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
3. Include various question types: behavioral, technical, situational, role-play, problem-solving
4. ${isDeveloperRole ? 'INCLUDE coding questions with specific programming languages and frameworks' : 'DO NOT include any coding, programming, or technical implementation questions'}
5. Make questions specific to the role and industry
6. Include realistic time limits and difficulty levels
7. Add follow-up questions where appropriate
8. ${isDeveloperRole ? 'For system design, include scalability, performance, and architecture considerations' : 'Focus on role-specific skills, industry knowledge, and professional competencies'}

CRITICAL JSON FORMATTING REQUIREMENTS:
- Respond with ONLY valid JSON - no additional text, explanations, or formatting
- Ensure all JSON is properly formatted with correct commas, brackets, and quotes
- Do not include any text before or after the JSON
- Make sure all strings are properly quoted with double quotes
- Ensure all arrays and objects are properly closed
- Do not include trailing commas
- Escape any special characters in strings properly
- The response must be parseable by JSON.parse() without any modifications

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
              content: 'You are an expert interview designer. Generate comprehensive, role-specific interview questions. CRITICAL: You must respond with ONLY valid JSON. No additional text, explanations, or formatting. The JSON must be properly formatted and parseable by JSON.parse(). Do not include any text before or after the JSON object.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 9000,
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
  const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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

module.exports = {
  createRoleSpecificInterview,
  createStructuredInterview
};
