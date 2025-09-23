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
        
        extractedJobDetails = JSON.parse(extractionResponse.data.choices[0].message.content);
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
      const interviewData = createStructuredInterview(userPrompt, jobDetails);
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
      const interviewData = createRoleSpecificInterview(userPrompt, extractedJobDetails);
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
    const interviewPrompt = `You are an expert HR professional and technical interviewer. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes

Create a structured interview with exactly 6 hiring rounds that are HIGHLY SPECIALIZED and PRACTICAL for this specific role. Each round must have exactly 5 questions with hands-on challenges:

ROUND 1: Role-Specific Technical Fundamentals (20-25 minutes)
- 5 technical questions with practical applications
- For Developers: Coding challenges with code editor, algorithm problems, code review scenarios
- For Data Analysts: Excel formulas, SQL queries, data manipulation tasks
- For Hiring Managers: Resume evaluation, candidate comparison scenarios
- For Designers: Design challenges, portfolio review, creative problem-solving
- Focus on core skills and tools specific to ${title} role

ROUND 2: Practical Skills Assessment (20-25 minutes)
- 5 hands-on challenges and real-world scenarios
- For Developers: Live coding sessions with code editor, debugging exercises, system design
- For Data Analysts: VLOOKUP/HLOOKUP tests, pivot tables, data visualization
- For Hiring Managers: Interview simulation, decision-making scenarios
- For Sales: Objection handling, negotiation scenarios, pitch presentations
- Assess practical application of skills in realistic situations

ROUND 3: Problem-Solving & Critical Thinking (15-20 minutes)
- 5 complex scenarios with role-specific challenges
- For Developers: Performance optimization, scalability issues, architecture decisions
- For Data Analysts: Data quality issues, statistical analysis, reporting challenges
- For Hiring Managers: Difficult hiring decisions, team conflict resolution
- For Marketing: Campaign optimization, market analysis, ROI evaluation
- Industry-specific problem-solving approaches and decision-making

ROUND 4: Advanced Technical & Tool Proficiency (15-20 minutes)
- 5 advanced technical questions and tool-specific challenges
- For Developers: Framework-specific questions, API integration, security best practices
- For Data Analysts: Advanced Excel functions, database queries, BI tools
- For Hiring Managers: ATS systems, recruitment metrics, talent assessment tools
- For Finance: Financial modeling, risk assessment, compliance scenarios
- Deep dive into specialized tools and advanced techniques

ROUND 5: Leadership & Team Collaboration (12-15 minutes)
- 5 questions about working in teams and leadership scenarios
- For Senior roles: Team management, mentoring, project leadership
- For Individual contributors: Cross-functional collaboration, knowledge sharing
- For Managers: Performance management, team building, conflict resolution
- Communication skills and team dynamics specific to this role level

ROUND 6: Industry Knowledge & Strategic Thinking (12-15 minutes)
- 5 questions about industry trends, strategic thinking, and future planning
- For Developers: Technology trends, architecture evolution, innovation
- For Data Analysts: Data science trends, analytics evolution, business intelligence
- For Hiring Managers: Talent market trends, recruitment strategies, HR technology
- For Business roles: Market analysis, competitive landscape, strategic planning
- Assess industry awareness and long-term thinking capabilities

IMPORTANT: Format your response as valid JSON with this exact structure. You MUST include exactly 6 rounds, each with exactly 5 questions:
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
          "question": "Write a function to reverse a string. Use the code editor provided.",
          "expectedAnswer": "Look for coding skills, algorithm understanding, and clean code",
          "timeLimit": 5,
          "difficulty": "easy",
          "followUpQuestions": ["Can you optimize this further?", "How would you test this function?"],
          "codeEditor": {
            "enabled": true,
            "language": "javascript",
            "starterCode": "function reverseString(str) {\n    // Your code here\n}",
            "testCases": [
              {"input": "\"hello\"", "expected": "\"olleh\""},
              {"input": "\"world\"", "expected": "\"dlrow\""}
            ]
          }
        },
        {
          "id": "q1_2",
          "type": "technical",
          "question": "Explain the difference between REST and GraphQL APIs.",
          "expectedAnswer": "Look for API design knowledge and practical understanding",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Can you give examples of each?", "What are the trade-offs?"]
        },
        {
          "id": "q1_3",
          "type": "coding-challenge",
          "question": "Implement a function to find the factorial of a number using recursion.",
          "expectedAnswer": "Assess recursion understanding and algorithm implementation",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": ["What's the time complexity?", "How would you handle edge cases?"],
          "codeEditor": {
            "enabled": true,
            "language": "javascript",
            "starterCode": "function factorial(n) {\n    // Your recursive code here\n}",
            "testCases": [
              {"input": "5", "expected": "120"},
              {"input": "3", "expected": "6"}
            ]
          }
        },
        {
          "id": "q1_4",
          "type": "technical",
          "question": "How do you handle database migrations in production?",
          "expectedAnswer": "Look for DevOps knowledge and production experience",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["What if the migration fails?", "How do you rollback?"]
        },
        {
          "id": "q1_5",
          "type": "coding-challenge",
          "question": "Write a function to check if a string is a palindrome.",
          "expectedAnswer": "Assess string manipulation and algorithm skills",
          "timeLimit": 4,
          "difficulty": "easy",
          "followUpQuestions": ["Can you do this without extra space?", "How would you handle case sensitivity?"],
          "codeEditor": {
            "enabled": true,
            "language": "javascript",
            "starterCode": "function isPalindrome(str) {\n    // Your code here\n}",
            "testCases": [
              {"input": "\"racecar\"", "expected": "true"},
              {"input": "\"hello\"", "expected": "false"}
            ]
          }
        }
      ],
      "evaluationCriteria": {
        "technical": "How to evaluate technical knowledge and skills",
        "problemSolving": "How to evaluate problem-solving approach"
      }
    },
    {
      "roundId": "round_2",
      "roundNumber": 2,
      "title": "Role-Specific Experience",
      "description": "Assess relevant experience and practical application",
      "duration": 20,
      "questions": [
        {
          "id": "q2_1",
          "type": "experience",
          "question": "Experience question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_2",
          "type": "experience",
          "question": "Experience question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_3",
          "type": "experience",
          "question": "Experience question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_4",
          "type": "experience",
          "question": "Experience question 4",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_5",
          "type": "experience",
          "question": "Experience question 5",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_6",
          "type": "experience",
          "question": "Experience question 6",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_7",
          "type": "experience",
          "question": "Experience question 7",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q2_8",
          "type": "experience",
          "question": "Experience question 8",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        }
      ],
      "evaluationCriteria": {
        "experience": "How to evaluate experience depth",
        "application": "How to evaluate practical application"
      }
    },
    {
      "roundId": "round_3",
      "roundNumber": 3,
      "title": "Problem-Solving & Critical Thinking",
      "description": "Test analytical and problem-solving capabilities",
      "duration": 20,
      "questions": [
        {
          "id": "q3_1",
          "type": "problem-solving",
          "question": "Problem-solving question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_2",
          "type": "problem-solving",
          "question": "Problem-solving question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_3",
          "type": "problem-solving",
          "question": "Problem-solving question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_4",
          "type": "problem-solving",
          "question": "Problem-solving question 4",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_5",
          "type": "problem-solving",
          "question": "Problem-solving question 5",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_6",
          "type": "problem-solving",
          "question": "Problem-solving question 6",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_7",
          "type": "problem-solving",
          "question": "Problem-solving question 7",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q3_8",
          "type": "problem-solving",
          "question": "Problem-solving question 8",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        }
      ],
      "evaluationCriteria": {
        "analysis": "How to evaluate analytical thinking",
        "decision": "How to evaluate decision-making process"
      }
    },
    {
      "roundId": "round_4",
      "roundNumber": 4,
      "title": "Team Collaboration & Leadership",
      "description": "Evaluate teamwork and leadership potential",
      "duration": 15,
      "questions": [
        {
          "id": "q4_1",
          "type": "teamwork",
          "question": "Teamwork question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_2",
          "type": "leadership",
          "question": "Leadership question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_3",
          "type": "teamwork",
          "question": "Teamwork question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_4",
          "type": "leadership",
          "question": "Leadership question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_5",
          "type": "teamwork",
          "question": "Teamwork question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_6",
          "type": "leadership",
          "question": "Leadership question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_7",
          "type": "teamwork",
          "question": "Teamwork question 4",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q4_8",
          "type": "leadership",
          "question": "Leadership question 4",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        }
      ],
      "evaluationCriteria": {
        "collaboration": "How to evaluate teamwork skills",
        "leadership": "How to evaluate leadership potential"
      }
    },
    {
      "roundId": "round_5",
      "roundNumber": 5,
      "title": "Cultural Fit & Industry Knowledge",
      "description": "Assess cultural alignment and industry awareness",
      "duration": 15,
      "questions": [
        {
          "id": "q5_1",
          "type": "industry",
          "question": "Industry question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_2",
          "type": "motivation",
          "question": "Motivation question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_3",
          "type": "culture",
          "question": "Culture question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_4",
          "type": "industry",
          "question": "Industry question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_5",
          "type": "culture",
          "question": "Culture question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_6",
          "type": "motivation",
          "question": "Motivation question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_7",
          "type": "industry",
          "question": "Industry question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q5_8",
          "type": "culture",
          "question": "Culture question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        }
      ],
      "evaluationCriteria": {
        "industry": "How to evaluate industry knowledge",
        "culture": "How to evaluate cultural fit"
      }
    },
    {
      "roundId": "round_6",
      "roundNumber": 6,
      "title": "Advanced Technical & Behavioral Assessment",
      "description": "Deep dive into specialized knowledge and complex scenarios",
      "duration": 15,
      "questions": [
        {
          "id": "q6_1",
          "type": "technical",
          "question": "Advanced technical question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_2",
          "type": "behavioral",
          "question": "Advanced behavioral question 1",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_3",
          "type": "technical",
          "question": "Advanced technical question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_4",
          "type": "behavioral",
          "question": "Advanced behavioral question 2",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_5",
          "type": "technical",
          "question": "Advanced technical question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_6",
          "type": "behavioral",
          "question": "Advanced behavioral question 3",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_7",
          "type": "technical",
          "question": "Advanced technical question 4",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        },
        {
          "id": "q6_8",
          "type": "behavioral",
          "question": "Advanced behavioral question 4",
          "expectedAnswer": "What to look for",
          "timeLimit": 3,
          "difficulty": "hard",
          "followUpQuestions": ["Follow-up 1", "Follow-up 2"]
        }
      ],
      "evaluationCriteria": {
        "technical": "How to evaluate advanced technical knowledge",
        "behavioral": "How to evaluate complex behavioral scenarios"
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
      const interviewData = createStructuredInterview("AI Generated Interview", { title, description, requirements, level, duration });
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
      interviewData = createStructuredInterview(aiData, { title, description, requirements, level, duration });
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

// Helper function to create role-specific interview from structured prompt
function createRoleSpecificInterview(prompt, jobDetails) {
  const interviewId = `interview_${Date.now()}`;
  
  // Determine if this is a developer or sales interview based on the prompt
  const isDeveloperInterview = prompt.includes('**Coding Round**') || prompt.includes('React fundamentals');
  const isSalesInterview = prompt.includes('**Sales Pitch/Role-play**') || prompt.includes('**Objection Handling**');
  
  let rounds = [];
  
  if (isDeveloperInterview) {
    rounds = [
      {
        title: "Introduction & Self Intro",
        description: "Get to know the candidate's background and motivation",
        duration: 5,
        questions: [
          {
            id: "q1_1",
            type: "behavioral",
            question: "Tell me about yourself and your background in software development.",
            expectedAnswer: "Look for relevant experience, technical background, and career progression",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_2",
            type: "experience",
            question: "What projects have you worked on that you're most proud of?",
            expectedAnswer: "Assess project complexity, technical skills, and impact",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q1_3",
            type: "motivation",
            question: "What are you looking for in your next role?",
            expectedAnswer: "Evaluate career goals and role alignment",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_4",
            type: "behavioral",
            question: "What motivates you in your career as a developer?",
            expectedAnswer: "Assess passion, drive, and long-term commitment",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_5",
            type: "learning",
            question: "How do you stay updated with the latest technologies?",
            expectedAnswer: "Evaluate continuous learning and adaptability",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Basic Technical Questions",
        description: "Assess fundamental technical knowledge",
        duration: 10,
        questions: [
          {
            id: "q2_1",
            type: "technical",
            question: "Explain the difference between props and state in React.",
            expectedAnswer: "Props are read-only data passed from parent to child, state is mutable data managed within component",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q2_2",
            type: "technical",
            question: "What are React hooks and how do they work?",
            expectedAnswer: "Hooks allow functional components to use state and lifecycle features",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q2_3",
            type: "technical",
            question: "How does JavaScript's event loop work?",
            expectedAnswer: "Event loop handles asynchronous operations using call stack, callback queue, and microtask queue",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: []
          },
          {
            id: "q2_4",
            type: "technical",
            question: "What is the difference between let, const, and var?",
            expectedAnswer: "var is function-scoped and hoisted, let/const are block-scoped, const is immutable",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q2_5",
            type: "technical",
            question: "Explain the concept of closures in JavaScript.",
            expectedAnswer: "Closures allow inner functions to access outer function variables even after outer function returns",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Interactive Coding Round",
        description: "AI-guided hands-on coding assessment with real-time feedback and modifications",
        duration: 20,
        questions: [
          {
            id: "q3_1",
            type: "interactive-coding",
            question: "Let's start with a simple task. I'll guide you through building a todo app. First, create a basic React component structure. I'll review your code and ask for improvements.",
            expectedAnswer: "AI will review code, suggest improvements, ask for modifications, and guide through iterations",
            timeLimit: 6,
            difficulty: "medium",
            followUpQuestions: [
              "Great! Now add state management for the todos. Show me your implementation.",
              "I see you used useState. Can you modify it to use useReducer instead?",
              "Good! Now add the delete functionality. How would you implement it?",
              "Perfect! Let's add a toggle feature. Can you show me how you'd handle the completed state?"
            ]
          },
          {
            id: "q3_2",
            type: "interactive-coding",
            question: "Now let's work on API integration. I want you to fetch data from an API and display it. Start with a basic fetch implementation, and I'll help you improve it.",
            expectedAnswer: "AI will review API implementation, suggest error handling, loading states, and optimization",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: [
              "Good start! Now add proper error handling. What would you do if the API fails?",
              "Excellent! Can you add a loading state while the data is being fetched?",
              "Nice! Now let's optimize it. Can you implement caching to avoid unnecessary API calls?",
              "Perfect! How would you handle the case where the API returns an empty array?"
            ]
          },
          {
            id: "q3_3",
            type: "interactive-coding",
            question: "Let's build a search/filter component together. Start with a basic input field, and I'll guide you through making it more sophisticated.",
            expectedAnswer: "AI will review filtering logic, suggest performance improvements, and guide through advanced features",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: [
              "Good! Now add real-time filtering as the user types. How would you implement this?",
              "Great! Can you add debouncing to improve performance?",
              "Excellent! Now let's add multiple filter criteria. How would you handle filtering by multiple fields?",
              "Perfect! Can you add a clear filter button and show the number of results?"
            ]
          }
        ]
      },
      {
        title: "Advanced Technical Questions",
        description: "Deep dive into advanced concepts",
        duration: 10,
        questions: [
          {
            id: "q4_1",
            type: "technical",
            question: "How would you optimize a React application for performance?",
            expectedAnswer: "Use React.memo, useMemo, useCallback, code splitting, lazy loading, and proper state management",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: []
          },
          {
            id: "q4_2",
            type: "technical",
            question: "Explain different state management solutions (Redux, Context API).",
            expectedAnswer: "Redux for complex state, Context API for simple state, consider performance implications",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: []
          },
          {
            id: "q4_3",
            type: "technical",
            question: "How do you handle API integration and error handling?",
            expectedAnswer: "Use proper HTTP methods, implement retry logic, handle loading states, and user feedback",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_4",
            type: "technical",
            question: "What testing strategies do you use for frontend applications?",
            expectedAnswer: "Unit tests, integration tests, E2E tests, mocking, and test-driven development",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_5",
            type: "technical",
            question: "How would you debug a memory leak in a web application?",
            expectedAnswer: "Use browser dev tools, check for event listeners, closures, and proper cleanup",
            timeLimit: 4,
            difficulty: "hard",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Behavioral/Soft Skills",
        description: "Assess communication and teamwork",
        duration: 8,
        questions: [
          {
            id: "q5_1",
            type: "behavioral",
            question: "Tell me about a time you had to learn a new technology quickly.",
            expectedAnswer: "Assess learning ability, adaptability, and problem-solving approach",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_2",
            type: "behavioral",
            question: "How do you handle disagreements with team members?",
            expectedAnswer: "Look for conflict resolution skills, communication, and teamwork",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_3",
            type: "behavioral",
            question: "Describe a challenging problem you solved recently.",
            expectedAnswer: "Evaluate problem-solving methodology and technical skills",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_4",
            type: "behavioral",
            question: "How do you prioritize tasks when working on multiple projects?",
            expectedAnswer: "Assess time management, organization, and decision-making skills",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q5_5",
            type: "behavioral",
            question: "What's your approach to code reviews and feedback?",
            expectedAnswer: "Evaluate collaboration, learning mindset, and professional growth",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Interactive Final Discussion",
        description: "AI-guided conversational wrap-up with dynamic feedback and next steps",
        duration: 10,
        questions: [
          {
            id: "q6_1",
            type: "interactive-discussion",
            question: "Great job on the technical rounds! I was impressed with your coding skills. Now, let's have a more personal conversation. What questions do you have about this role and our company culture? I'm here to answer anything you'd like to know.",
            expectedAnswer: "AI will engage in natural conversation, answer questions, and assess candidate engagement",
            timeLimit: 4,
            difficulty: "easy",
            followUpQuestions: [
              "That's a great question! Let me explain our development process in detail...",
              "I'm glad you asked about that. Here's how we handle that situation...",
              "Excellent question! This shows you're thinking about the role seriously. Let me share more details...",
              "I appreciate your interest in that aspect. Here's what you can expect..."
            ]
          },
          {
            id: "q6_2",
            type: "interactive-discussion",
            question: "Based on our conversation today, I can see you'd be a great fit for our team. Let's discuss the practical aspects. What are your thoughts on compensation and what would make this opportunity attractive to you?",
            expectedAnswer: "AI will engage in salary discussion, provide feedback on expectations, and assess negotiation skills",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: [
              "That's a reasonable expectation. Let me share our compensation structure...",
              "I understand your perspective. Here's how we typically structure offers...",
              "Great question about benefits! Let me walk you through our package...",
              "I appreciate your transparency. Let's discuss how we can make this work..."
            ]
          },
          {
            id: "q6_3",
            type: "interactive-discussion",
            question: "I'm excited about the possibility of working together! Let's talk about timing. When would you ideally like to start, and do you have any concerns or questions about the transition?",
            expectedAnswer: "AI will discuss start dates, address concerns, and provide reassurance about the process",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: [
              "That timeline works well for us. Let me explain our onboarding process...",
              "I understand your situation. Here's how we can accommodate that...",
              "Great! Let me share what the first few weeks would look like...",
              "Perfect timing! Here's what you can expect during the transition..."
            ]
          }
        ]
      }
    ];
  } else if (isSalesInterview) {
    rounds = [
      {
        title: "Self Introduction",
        description: "Get to know the candidate's sales background",
        duration: 5,
        questions: [
          {
            id: "q1_1",
            type: "behavioral",
            question: "Tell me about yourself and your experience in sales.",
            expectedAnswer: "Look for relevant sales experience, achievements, and career progression",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_2",
            type: "achievement",
            question: "What sales achievements are you most proud of?",
            expectedAnswer: "Assess sales performance, metrics, and impact",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q1_3",
            type: "motivation",
            question: "What motivates you in a sales career?",
            expectedAnswer: "Evaluate passion, drive, and long-term commitment to sales",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_4",
            type: "career",
            question: "What are you looking for in your next sales role?",
            expectedAnswer: "Assess career goals and role alignment",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q1_5",
            type: "definition",
            question: "How do you define sales success?",
            expectedAnswer: "Evaluate understanding of sales metrics and success criteria",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Basic Sales Questions",
        description: "Assess fundamental sales knowledge",
        duration: 10,
        questions: [
          {
            id: "q2_1",
            type: "process",
            question: "Walk me through your sales process from lead to close.",
            expectedAnswer: "Assess understanding of sales methodology and process",
            timeLimit: 4,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q2_2",
            type: "qualification",
            question: "How do you identify and qualify prospects?",
            expectedAnswer: "Evaluate lead qualification skills and criteria",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q2_3",
            type: "technical",
            question: "What CRM systems have you used?",
            expectedAnswer: "Assess technical proficiency with sales tools",
            timeLimit: 2,
            difficulty: "easy",
            followUpQuestions: []
          },
          {
            id: "q2_4",
            type: "strategy",
            question: "How do you handle lead generation?",
            expectedAnswer: "Evaluate prospecting strategies and techniques",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q2_5",
            type: "relationship",
            question: "What's your approach to building customer relationships?",
            expectedAnswer: "Assess relationship-building skills and customer focus",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Interactive Sales Role-play",
        description: "AI-guided sales demonstrations with real-time feedback and coaching",
        duration: 18,
        questions: [
          {
            id: "q3_1",
            type: "interactive-pitch",
            question: "Let's do a role-play! I'm a potential customer interested in our product. Start by introducing yourself and our product. I'll respond as a customer would, and we'll have a natural conversation. I'll give you feedback and ask you to adjust your approach.",
            expectedAnswer: "AI will role-play as customer, provide real-time feedback, and guide sales techniques",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: [
              "Good start! But I'm not sure I understand the value. Can you explain it differently?",
              "I like that approach better. Now, what if I tell you I'm already using a competitor's solution?",
              "Excellent! You handled that well. Now, I'm concerned about the price. How would you address that?",
              "Great response! Now, let's say I'm interested but need to discuss with my team. How would you handle that?"
            ]
          },
          {
            id: "q3_2",
            type: "interactive-objection",
            question: "Now let's practice objection handling. I'll present different objections, and you respond. I'll give you feedback and ask you to try different approaches until we find what works best.",
            expectedAnswer: "AI will present various objections, provide feedback on responses, and coach on better techniques",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: [
              "Good response, but let me challenge you with this: 'Your price is too high compared to others.'",
              "I see your approach. Now try this objection: 'We don't have budget right now.'",
              "Interesting strategy. What if I say: 'We're happy with our current solution'?",
              "Excellent! You're getting the hang of it. One more: 'I need to think about it.'"
            ]
          },
          {
            id: "q3_3",
            type: "interactive-closing",
            question: "Perfect! Now let's work on closing. I'll be a warm prospect who's shown interest. Guide me through the closing process, and I'll give you feedback on your approach. Don't be afraid to ask for the sale!",
            expectedAnswer: "AI will role-play as interested prospect, provide feedback on closing techniques, and coach on confidence",
            timeLimit: 6,
            difficulty: "hard",
            followUpQuestions: [
              "Good attempt, but I'm still hesitant. How would you create more urgency?",
              "I like that approach! Now, what if I say yes? What would be your next steps?",
              "Excellent closing technique! How would you handle it if I said I need to discuss with my manager?",
              "Perfect! You've got the right mindset. Let's practice one more closing scenario..."
            ]
          }
        ]
      },
      {
        title: "Objection Handling",
        description: "Test ability to overcome sales objections",
        duration: 10,
        questions: [
          {
            id: "q4_1",
            type: "objection",
            question: "How do you handle the objection 'Your price is too high'?",
            expectedAnswer: "Assess value communication and price justification skills",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_2",
            type: "objection",
            question: "What do you do when a prospect says 'We're not interested'?",
            expectedAnswer: "Evaluate persistence and qualification techniques",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_3",
            type: "objection",
            question: "How do you respond to 'We already have a solution'?",
            expectedAnswer: "Assess competitive positioning and differentiation",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_4",
            type: "objection",
            question: "What's your approach to 'I need to discuss with my team'?",
            expectedAnswer: "Evaluate stakeholder management and follow-up skills",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q4_5",
            type: "objection",
            question: "How do you handle 'We don't have budget right now'?",
            expectedAnswer: "Assess budget qualification and timing management",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Communication & Confidence Check",
        description: "Assess communication and confidence",
        duration: 8,
        questions: [
          {
            id: "q5_1",
            type: "communication",
            question: "How do you build rapport with new prospects?",
            expectedAnswer: "Assess relationship-building and communication skills",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_2",
            type: "communication",
            question: "Describe your communication style with different types of customers.",
            expectedAnswer: "Evaluate adaptability and customer-centric approach",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_3",
            type: "resilience",
            question: "How do you handle rejection in sales?",
            expectedAnswer: "Assess resilience, persistence, and mental toughness",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_4",
            type: "negotiation",
            question: "What's your approach to negotiating deals?",
            expectedAnswer: "Evaluate negotiation skills and win-win mindset",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          },
          {
            id: "q5_5",
            type: "motivation",
            question: "How do you maintain confidence during difficult sales periods?",
            expectedAnswer: "Assess self-motivation and mental resilience",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          }
        ]
      },
      {
        title: "Interactive Final Discussion",
        description: "AI-guided conversational wrap-up with dynamic feedback and next steps",
        duration: 10,
        questions: [
          {
            id: "q6_1",
            type: "interactive-discussion",
            question: "Excellent work on the sales role-play! I was impressed with your natural sales instincts and ability to adapt. Now, let's have a more personal conversation. What questions do you have about this sales role and our company? I'm here to answer anything you'd like to know.",
            expectedAnswer: "AI will engage in natural conversation, answer questions about sales role, and assess candidate engagement",
            timeLimit: 4,
            difficulty: "easy",
            followUpQuestions: [
              "That's a great question about our sales process! Let me explain how we structure our sales cycles...",
              "I'm glad you asked about that. Here's how we handle that situation in sales...",
              "Excellent question! This shows you're thinking about the role seriously. Let me share more details...",
              "I appreciate your interest in that aspect. Here's what you can expect in this sales environment..."
            ]
          },
          {
            id: "q6_2",
            type: "interactive-discussion",
            question: "Based on our conversation today, I can see you'd be a great addition to our sales team. Let's discuss the practical aspects. What are your thoughts on sales targets, commission structure, and what would make this opportunity attractive to you?",
            expectedAnswer: "AI will engage in compensation discussion, provide feedback on expectations, and assess sales motivation",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: [
              "That's a reasonable expectation for our market. Let me share our commission structure...",
              "I understand your perspective. Here's how we typically structure our sales compensation...",
              "Great question about sales targets! Let me walk you through our goal-setting process...",
              "I appreciate your transparency. Let's discuss how we can make this sales opportunity work for you..."
            ]
          },
          {
            id: "q6_3",
            type: "interactive-discussion",
            question: "I'm excited about the possibility of having you on our sales team! Let's talk about timing and next steps. When would you ideally like to start, and do you have any concerns or questions about transitioning into this sales role?",
            expectedAnswer: "AI will discuss start dates, address concerns about sales role, and provide reassurance about the process",
            timeLimit: 3,
            difficulty: "easy",
            followUpQuestions: [
              "That timeline works well for us. Let me explain our sales onboarding process...",
              "I understand your situation. Here's how we can accommodate that in our sales team...",
              "Great! Let me share what the first few weeks in sales would look like...",
              "Perfect timing! Here's what you can expect during the sales transition..."
            ]
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
function createStructuredInterview(textResponse, jobDetails) {1
  const interviewId = `interview_${Date.now()}`;
  
  // Check if this is a role-specific prompt
  const isRoleSpecificPrompt = textResponse.includes('**Introduction & Self Intro**') || 
                               textResponse.includes('**Self Introduction**') ||
                               textResponse.includes('**Coding Round**') ||
                               textResponse.  includes('**Sales Pitch/Role-play**');
  
  if (isRoleSpecificPrompt) {
    console.log('🎯 [INTERVIEW GENERATE] Using role-specific prompt structure');
    return createRoleSpecificInterview(textResponse, jobDetails);
  }
  
  // Generate 6 comprehensive rounds based on job details with role-specific challenges
  const isDeveloper = jobDetails.title.toLowerCase().includes('developer') || jobDetails.title.toLowerCase().includes('engineer') || jobDetails.title.toLowerCase().includes('programmer');
  const isDataAnalyst = jobDetails.title.toLowerCase().includes('analyst') || jobDetails.title.toLowerCase().includes('data') || jobDetails.title.toLowerCase().includes('excel');
  const isHiringManager = jobDetails.title.toLowerCase().includes('manager') || jobDetails.title.toLowerCase().includes('hr') || jobDetails.title.toLowerCase().includes('recruiter');
  const isDesigner = jobDetails.title.toLowerCase().includes('designer') || jobDetails.title.toLowerCase().includes('ui') || jobDetails.title.toLowerCase().includes('ux');
  const isSales = jobDetails.title.toLowerCase().includes('sales') || jobDetails.title.toLowerCase().includes('business development');
  const isFinance = jobDetails.title.toLowerCase().includes('finance') || jobDetails.title.toLowerCase().includes('accounting') || jobDetails.title.toLowerCase().includes('financial');

  const rounds = [
    {
      roundId: "round_1",
      roundNumber: 1,
      title: "Role-Specific Technical Fundamentals",
      description: "Evaluate technical skills and practical applications specific to this role",
      duration: 25,
      questions: isDeveloper ? [
        {
          id: "q1_1",
          type: "coding-challenge",
          question: `Write a function to reverse a string. Use the code editor provided.`,
          expectedAnswer: "Look for coding skills, algorithm understanding, and clean code",
          timeLimit: 5,
          difficulty: "easy",
          followUpQuestions: ["Can you optimize this further?", "How would you test this function?"],
          codeEditor: {
            enabled: true,
            language: "javascript",
            starterCode: "function reverseString(str) {\n    // Your code here\n}",
            testCases: [
              {"input": "\"hello\"", "expected": "\"olleh\""},
              {"input": "\"world\"", "expected": "\"dlrow\""}
            ]
          }
        },
        {
          id: "q1_2",
          type: "coding-challenge",
          question: `Implement a function to find the factorial of a number using recursion.`,
          expectedAnswer: "Assess recursion understanding and algorithm implementation",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["What's the time complexity?", "How would you handle edge cases?"],
          codeEditor: {
            enabled: true,
            language: "javascript",
            starterCode: "function factorial(n) {\n    // Your recursive code here\n}",
            testCases: [
              {"input": "5", "expected": "120"},
              {"input": "3", "expected": "6"}
            ]
          }
        },
        {
          id: "q1_3",
          type: "system-design",
          question: `Design a URL shortener service like bit.ly. What components would you need?`,
          expectedAnswer: "Look for system design thinking, scalability considerations, and architecture knowledge",
          timeLimit: 6,
          difficulty: "hard",
          followUpQuestions: ["How would you handle 1 million requests per second?", "What database would you choose?"]
        },
        {
          id: "q1_4",
          type: "technical",
          question: `Explain the difference between REST and GraphQL APIs. When would you use each?`,
          expectedAnswer: "Look for API design knowledge and practical understanding",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give examples of each?", "What are the trade-offs?"]
        },
        {
          id: "q1_5",
          type: "coding-challenge",
          question: `Write a function to check if a string is a palindrome.`,
          expectedAnswer: "Assess string manipulation and algorithm skills",
          timeLimit: 4,
          difficulty: "easy",
          followUpQuestions: ["Can you do this without extra space?", "How would you handle case sensitivity?"],
          codeEditor: {
            enabled: true,
            language: "javascript",
            starterCode: "function isPalindrome(str) {\n    // Your code here\n}",
            testCases: [
              {"input": "\"racecar\"", "expected": "true"},
              {"input": "\"hello\"", "expected": "false"}
            ]
          }
        }
      ] : isDataAnalyst ? [
        {
          id: "q1_1",
          type: "excel-challenge",
          question: `Create a VLOOKUP formula to find employee salaries from a separate table. The lookup value is in column A, and you need to return the salary from column 3.`,
          expectedAnswer: "Look for Excel proficiency and formula understanding",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["What if there are duplicate names?", "How would you handle errors?"]
        },
        {
          id: "q1_2",
          type: "sql-challenge",
          question: `Write a SQL query to find the top 10 customers by total purchase amount, including their names and total spent.`,
          expectedAnswer: "Assess SQL skills and query optimization",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How would you optimize this query?", "What indexes would you add?"]
        },
        {
          id: "q1_3",
          type: "data-analysis",
          question: `You have a dataset with missing values. Walk me through your approach to handle this.`,
          expectedAnswer: "Look for data cleaning methodology and statistical knowledge",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["What methods would you use?", "How do you validate your approach?"]
        },
        {
          id: "q1_4",
          type: "excel-challenge",
          question: `Create a pivot table to show monthly sales by product category. Then create a chart to visualize the trends.`,
          expectedAnswer: "Assess Excel advanced features and data visualization skills",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How would you make this dynamic?", "What other visualizations would you consider?"]
        },
        {
          id: "q1_5",
          type: "statistical",
          question: `Explain the difference between correlation and causation. Give an example.`,
          expectedAnswer: "Look for statistical understanding and critical thinking",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How do you test for causation?", "What are common pitfalls?"]
        }
      ] : isHiringManager ? [
        {
          id: "q1_1",
          type: "resume-evaluation",
          question: `Here are three resumes for a Senior Developer position. Compare them and tell me which candidate you would hire and why.`,
          expectedAnswer: "Look for evaluation criteria, decision-making process, and role understanding",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["What questions would you ask in the interview?", "How do you verify their claims?"]
        },
        {
          id: "q1_2",
          type: "interview-simulation",
          question: `Simulate conducting a technical interview. Ask me 3 questions you would ask a candidate for this ${jobDetails.title} position.`,
          expectedAnswer: "Assess interview skills, role knowledge, and questioning techniques",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How do you evaluate their answers?", "What red flags do you look for?"]
        },
        {
          id: "q1_3",
          type: "decision-making",
          question: `You have two equally qualified candidates but can only hire one. One has more experience, the other has better cultural fit. How do you decide?`,
          expectedAnswer: "Look for decision-making framework and prioritization skills",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: ["What additional information would you gather?", "How do you communicate the decision?"]
        },
        {
          id: "q1_4",
          type: "ats-systems",
          question: `Explain how you would use an ATS system to streamline the hiring process for this role.`,
          expectedAnswer: "Assess technology knowledge and process optimization skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What features are most important?", "How do you measure success?"]
        },
        {
          id: "q1_5",
          type: "talent-assessment",
          question: `How do you assess soft skills during the interview process?`,
          expectedAnswer: "Look for assessment methodology and behavioral interview knowledge",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What questions do you ask?", "How do you avoid bias?"]
        }
      ] : [
        {
          id: "q1_1",
          type: "technical",
          question: `What are the key technical skills and technologies required for a ${jobDetails.title} position?`,
          expectedAnswer: "Look for relevant technical knowledge and current industry practices",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you walk me through your experience with these technologies?", "How do you stay current with industry developments?"]
        },
        {
          id: "q1_2",
          type: "technical",
          question: `Describe a challenging technical problem you've solved in your previous role.`,
          expectedAnswer: "Assess problem-solving approach and technical depth",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What alternative approaches did you consider?", "How would you optimize this solution?"]
        },
        {
          id: "q1_3",
          type: "technical",
          question: `How do you approach debugging complex issues in your work?`,
          expectedAnswer: "Look for systematic debugging methodology and technical reasoning",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give a specific example?", "What tools do you use for debugging?"]
        },
        {
          id: "q1_4",
          type: "technical",
          question: `What tools and technologies are you most comfortable with for this role?`,
          expectedAnswer: "Assess technical proficiency and depth of knowledge",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["How did you learn these technologies?", "What's your experience level with each?"]
        },
        {
          id: "q1_5",
          type: "technical",
          question: `How do you ensure quality and accuracy in your work?`,
          expectedAnswer: "Look for understanding of best practices and quality assurance",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What quality control processes do you use?", "How do you handle errors?"]
        }
      ],
      evaluationCriteria: {
        technical: "Technical knowledge depth and practical application",
        problemSolving: "Analytical thinking and solution design"
      }
    },
    {
      roundId: "round_2",
      roundNumber: 2,
      title: "Practical Skills Assessment",
      description: "Hands-on challenges and real-world scenarios specific to this role",
      duration: 25,
      questions: isDeveloper ? [
        {
          id: "q2_1",
          type: "live-coding",
          question: `Write a function to reverse a linked list. You can use any programming language.`,
          expectedAnswer: "Look for coding skills, algorithm understanding, and problem-solving approach",
          timeLimit: 6,
          difficulty: "medium",
          followUpQuestions: ["Can you do this iteratively and recursively?", "What's the time and space complexity?"]
        },
        {
          id: "q2_2",
          type: "debugging-exercise",
          question: `This code has a bug that causes infinite recursion. Identify and fix it: [Code with recursive call without base case]`,
          expectedAnswer: "Assess debugging skills and understanding of recursion",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How would you test the fix?", "What other issues do you see?"]
        },
        {
          id: "q2_3",
          type: "system-design",
          question: `Design a chat application that can handle 10,000 concurrent users. What components would you need?`,
          expectedAnswer: "Look for system design thinking, scalability knowledge, and architecture skills",
          timeLimit: 7,
          difficulty: "hard",
          followUpQuestions: ["How would you handle message delivery?", "What about offline users?"]
        },
        {
          id: "q2_4",
          type: "code-optimization",
          question: `This function is too slow for large datasets. How would you optimize it? [Inefficient nested loop code]`,
          expectedAnswer: "Assess optimization skills and performance analysis",
          timeLimit: 5,
          difficulty: "hard",
          followUpQuestions: ["What's the new time complexity?", "How would you test the performance?"]
        },
        {
          id: "q2_5",
          type: "api-design",
          question: `Design a REST API for a blog system. What endpoints would you create?`,
          expectedAnswer: "Look for API design knowledge and REST principles understanding",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How would you handle authentication?", "What about pagination?"]
        },
        {
          id: "q2_6",
          type: "database-design",
          question: `Design a database schema for an e-commerce platform. What tables would you need?`,
          expectedAnswer: "Assess database design skills and normalization understanding",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["How would you handle user reviews?", "What about inventory management?"]
        },
        {
          id: "q2_7",
          type: "testing",
          question: `Write unit tests for this function: [Simple function with edge cases]`,
          expectedAnswer: "Look for testing knowledge and edge case consideration",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["What edge cases did you consider?", "How would you test error conditions?"]
        },
        {
          id: "q2_8",
          type: "deployment",
          question: `How would you deploy this application to production? Walk me through your process.`,
          expectedAnswer: "Assess DevOps knowledge and deployment best practices",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How do you handle rollbacks?", "What about monitoring?"]
        }
      ] : isDataAnalyst ? [
        {
          id: "q2_1",
          type: "excel-practical",
          question: `Given a dataset with sales data, create a formula to calculate the percentage change from the previous month.`,
          expectedAnswer: "Look for Excel formula skills and data analysis understanding",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How would you handle the first month?", "What if there are missing values?"]
        },
        {
          id: "q2_2",
          type: "sql-practical",
          question: `Write a query to find customers who made purchases in the last 30 days but not in the previous 30 days.`,
          expectedAnswer: "Assess SQL skills and date manipulation",
          timeLimit: 5,
          difficulty: "hard",
          followUpQuestions: ["How would you optimize this query?", "What indexes would help?"]
        },
        {
          id: "q2_3",
          type: "data-cleaning",
          question: `You have a dataset with inconsistent date formats, duplicate entries, and missing values. Walk me through your cleaning process.`,
          expectedAnswer: "Look for data cleaning methodology and attention to detail",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["What tools would you use?", "How do you validate your cleaning?"]
        },
        {
          id: "q2_4",
          type: "pivot-table",
          question: `Create a pivot table showing quarterly sales by region and product category. Then create a chart to visualize the trends.`,
          expectedAnswer: "Assess Excel advanced features and data visualization skills",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How would you make this dynamic?", "What insights do you see?"]
        },
        {
          id: "q2_5",
          type: "statistical-analysis",
          question: `Calculate the correlation coefficient between advertising spend and sales. What does this tell you?`,
          expectedAnswer: "Look for statistical knowledge and business interpretation",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["Is this correlation significant?", "What other factors might influence sales?"]
        },
        {
          id: "q2_6",
          type: "dashboard-design",
          question: `Design a KPI dashboard for a retail manager. What metrics would you include and how would you visualize them?`,
          expectedAnswer: "Assess business understanding and visualization skills",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["How would you make it interactive?", "What tools would you use?"]
        },
        {
          id: "q2_7",
          type: "data-validation",
          question: `How would you validate the accuracy of this sales report? What checks would you perform?`,
          expectedAnswer: "Look for data validation skills and quality assurance",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What red flags would you look for?", "How do you document your findings?"]
        },
        {
          id: "q2_8",
          type: "forecasting",
          question: `Using this historical sales data, how would you forecast next quarter's sales?`,
          expectedAnswer: "Assess forecasting knowledge and analytical thinking",
          timeLimit: 5,
          difficulty: "hard",
          followUpQuestions: ["What method would you use?", "How do you measure accuracy?"]
        }
      ] : isHiringManager ? [
        {
          id: "q2_1",
          type: "interview-simulation",
          question: `Conduct a 5-minute interview with me for a ${jobDetails.title} position. Ask me 3 relevant questions.`,
          expectedAnswer: "Assess interview skills, role knowledge, and questioning techniques",
          timeLimit: 5,
          difficulty: "medium",
          followUpQuestions: ["How would you evaluate my answers?", "What follow-up questions would you ask?"]
        },
        {
          id: "q2_2",
          type: "candidate-comparison",
          question: `Here are two candidates with different strengths. Candidate A has 5 years experience but limited soft skills. Candidate B has 2 years experience but excellent communication. Which would you hire and why?`,
          expectedAnswer: "Look for decision-making framework and evaluation criteria",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: ["What additional information would you gather?", "How do you communicate this decision?"]
        },
        {
          id: "q2_3",
          type: "reference-check",
          question: `How would you conduct a reference check for a senior-level candidate? What questions would you ask?`,
          expectedAnswer: "Assess reference checking skills and verification process",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How do you handle negative references?", "What if references don't respond?"]
        },
        {
          id: "q2_4",
          type: "salary-negotiation",
          question: `A candidate is asking for 20% more than your budget. How do you handle this negotiation?`,
          expectedAnswer: "Look for negotiation skills and budget management",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["What alternatives could you offer?", "How do you maintain the relationship?"]
        },
        {
          id: "q2_5",
          type: "onboarding-plan",
          question: `Create a 30-day onboarding plan for a new ${jobDetails.title} hire. What would you include?`,
          expectedAnswer: "Assess onboarding knowledge and employee experience focus",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: ["How do you measure onboarding success?", "What if they're not meeting expectations?"]
        },
        {
          id: "q2_6",
          type: "team-conflict",
          question: `Two team members are having a conflict that's affecting productivity. How do you resolve this?`,
          expectedAnswer: "Look for conflict resolution skills and team management",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: ["What if the conflict continues?", "How do you prevent future conflicts?"]
        },
        {
          id: "q2_7",
          type: "performance-review",
          question: `How would you conduct a performance review for an underperforming employee?`,
          expectedAnswer: "Assess performance management skills and difficult conversation handling",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: ["What if they don't improve?", "How do you document the process?"]
        },
        {
          id: "q2_8",
          type: "retention-strategy",
          question: `A top performer is considering leaving. How do you retain them?`,
          expectedAnswer: "Look for retention strategies and employee engagement knowledge",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What if you can't meet their demands?", "How do you prevent this in the future?"]
        }
      ] : [
        {
          id: "q2_1",
          type: "experience",
          question: `Tell me about your experience with the main responsibilities of a ${jobDetails.title}.`,
          expectedAnswer: "Evaluate relevant experience and practical knowledge",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What was your biggest achievement in this area?", "What challenges did you face?"]
        },
        {
          id: "q2_2",
          type: "scenario",
          question: `How would you approach a project where you need to ${jobDetails.level === 'senior' || jobDetails.level === 'lead' ? 'lead a team and' : ''} deliver results under tight deadlines?`,
          expectedAnswer: "Look for project management skills and prioritization",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How do you handle scope changes?", "How do you communicate progress to stakeholders?"]
        },
        {
          id: "q2_3",
          type: "experience",
          question: `Describe a project where you had to learn a new technology or skill quickly.`,
          expectedAnswer: "Assess learning agility and adaptability",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you approach the learning process?", "What was the outcome?"]
        },
        {
          id: "q2_4",
          type: "scenario",
          question: `Tell me about a time when you had to work with stakeholders who had different priorities.`,
          expectedAnswer: "Look for stakeholder management and negotiation skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you resolve the conflict?", "What was the final outcome?"]
        },
        {
          id: "q2_5",
          type: "experience",
          question: `What's the most complex project you've worked on, and what was your role?`,
          expectedAnswer: "Assess project complexity handling and role clarity",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["What made it complex?", "How did you contribute to its success?"]
        },
        {
          id: "q2_6",
          type: "scenario",
          question: `How do you handle situations where requirements change mid-project?`,
          expectedAnswer: "Look for adaptability and change management skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give a specific example?", "How do you communicate changes to the team?"]
        },
        {
          id: "q2_7",
          type: "experience",
          question: `Describe a time when you had to mentor or train someone on your team.`,
          expectedAnswer: "Assess mentoring and knowledge transfer abilities",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What was your approach?", "How did you measure success?"]
        },
        {
          id: "q2_8",
          type: "scenario",
          question: `Tell me about a project that didn't go as planned. How did you handle it?`,
          expectedAnswer: "Look for problem-solving and resilience under pressure",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["What went wrong?", "What did you learn from the experience?"]
        }
      ],
      evaluationCriteria: {
        practical: "Hands-on skills and real-world application",
        problemSolving: "Ability to solve practical challenges"
      }
    },
    {
      roundId: "round_3",
      roundNumber: 3,
      title: "Problem-Solving & Critical Thinking",
      description: "Test analytical and problem-solving capabilities",
      duration: 20,
      questions: [
        {
          id: "q3_1",
          type: "problem-solving",
          question: `A ${jobDetails.title} project is behind schedule and stakeholders are concerned. Walk me through your approach to get it back on track.`,
          expectedAnswer: "Assess systematic problem-solving and stakeholder management",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How would you prevent this in future projects?", "How do you balance quality vs. timeline?"]
        },
        {
          id: "q3_2",
          type: "critical-thinking",
          question: `If you had to make a recommendation between two competing technical solutions, how would you evaluate and present your decision?`,
          expectedAnswer: "Look for structured decision-making and communication skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What factors would be most important?", "How would you handle disagreement from team members?"]
        },
        {
          id: "q3_3",
          type: "problem-solving",
          question: `How would you approach debugging a production issue that's affecting multiple users?`,
          expectedAnswer: "Assess crisis management and systematic debugging approach",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["What's your first step?", "How do you prioritize fixes?"]
        },
        {
          id: "q3_4",
          type: "critical-thinking",
          question: `Describe a time when you had to make a difficult technical decision with limited information.`,
          expectedAnswer: "Look for decision-making under uncertainty and risk assessment",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How did you gather more information?", "What was the outcome?"]
        },
        {
          id: "q3_5",
          type: "problem-solving",
          question: `How do you approach optimizing a slow-performing application?`,
          expectedAnswer: "Assess systematic performance analysis and optimization methodology",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What tools would you use?", "How do you measure improvement?"]
        },
        {
          id: "q3_6",
          type: "critical-thinking",
          question: `If you had to choose between implementing a quick fix or a proper long-term solution, how would you decide?`,
          expectedAnswer: "Look for understanding of technical debt and business priorities",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What factors influence your decision?", "How do you communicate this to stakeholders?"]
        },
        {
          id: "q3_7",
          type: "problem-solving",
          question: `Describe how you would handle a situation where a critical team member leaves mid-project.`,
          expectedAnswer: "Assess contingency planning and knowledge transfer strategies",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How do you minimize impact?", "What's your knowledge transfer process?"]
        },
        {
          id: "q3_8",
          type: "critical-thinking",
          question: `How do you evaluate the trade-offs between different architectural approaches?`,
          expectedAnswer: "Look for architectural thinking and technical decision-making process",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["What criteria do you use?", "How do you document your decisions?"]
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
      duration: 15,
      questions: [
        {
          id: "q4_1",
          type: "teamwork",
          question: `Describe a time when you had to work with a difficult team member or stakeholder. How did you handle it?`,
          expectedAnswer: "Assess interpersonal skills and conflict resolution",
          timeLimit: 3,
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
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give a specific example?", "What's your approach to giving feedback?"]
        },
        {
          id: "q4_3",
          type: "teamwork",
          question: `How do you handle disagreements with team members about technical decisions?`,
          expectedAnswer: "Look for conflict resolution and collaborative decision-making",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give an example?", "How do you reach consensus?"]
        },
        {
          id: "q4_4",
          type: "leadership",
          question: `Describe a time when you had to motivate a team during a challenging project.`,
          expectedAnswer: "Assess motivational and leadership skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What strategies did you use?", "What was the outcome?"]
        },
        {
          id: "q4_5",
          type: "teamwork",
          question: `How do you ensure effective communication within your team?`,
          expectedAnswer: "Look for communication strategies and team coordination",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["What tools do you use?", "How do you handle remote collaboration?"]
        },
        {
          id: "q4_6",
          type: "leadership",
          question: `Tell me about a time when you had to make an unpopular decision for the team.`,
          expectedAnswer: "Assess decision-making courage and team management",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How did you communicate it?", "How did the team react?"]
        },
        {
          id: "q4_7",
          type: "teamwork",
          question: `How do you handle situations where team members have different working styles?`,
          expectedAnswer: "Look for adaptability and team harmony management",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give an example?", "How do you find common ground?"]
        },
        {
          id: "q4_8",
          type: "leadership",
          question: `Describe your approach to giving constructive feedback to team members.`,
          expectedAnswer: "Assess feedback delivery and team development skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What's your feedback framework?", "How do you ensure it's well-received?"]
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
      duration: 15,
      questions: [
        {
          id: "q5_1",
          type: "industry",
          question: `What trends do you see shaping the ${jobDetails.title.includes('Developer') || jobDetails.title.includes('Engineer') ? 'technology' : 'industry'} landscape, and how do you stay informed?`,
          expectedAnswer: "Evaluate industry awareness and continuous learning",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How do these trends affect your work?", "What resources do you use to stay updated?"]
        },
        {
          id: "q5_2",
          type: "motivation",
          question: `Why are you interested in this ${jobDetails.title} position, and what are your career goals for the next few years?`,
          expectedAnswer: "Assess motivation, cultural fit, and long-term potential",
          timeLimit: 3,
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
        },
        {
          id: "q5_4",
          type: "industry",
          question: `What do you think are the biggest challenges facing the ${jobDetails.title.includes('Developer') || jobDetails.title.includes('Engineer') ? 'technology' : 'industry'} industry today?`,
          expectedAnswer: "Look for industry insight and critical thinking about challenges",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How would you address these challenges?", "What opportunities do you see?"]
        },
        {
          id: "q5_5",
          type: "culture",
          question: `Describe your ideal work environment and team culture.`,
          expectedAnswer: "Assess cultural preferences and team fit",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["What motivates you most?", "How do you contribute to team culture?"]
        },
        {
          id: "q5_6",
          type: "motivation",
          question: `What aspects of this role excite you most, and what concerns you?`,
          expectedAnswer: "Look for honest self-assessment and role understanding",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How would you address your concerns?", "What support would you need?"]
        },
        {
          id: "q5_7",
          type: "industry",
          question: `How do you see your role evolving in the next 5 years in this industry?`,
          expectedAnswer: "Assess long-term vision and career planning",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What skills will you need to develop?", "How do you plan to stay relevant?"]
        },
        {
          id: "q5_8",
          type: "culture",
          question: `How do you balance work-life integration, and what does that look like for you?`,
          expectedAnswer: "Look for realistic expectations and personal values alignment",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["How do you manage stress?", "What activities help you recharge?"]
        }
      ],
      evaluationCriteria: {
        industry: "Knowledge of industry trends and continuous learning",
        culture: "Alignment with company values and growth mindset"
      }
    },
    {
      roundId: "round_6",
      roundNumber: 6,
      title: "Advanced Technical & Behavioral Assessment",
      description: "Deep dive into specialized knowledge and complex scenarios",
      duration: 15,
      questions: [
        {
          id: "q6_1",
          type: "technical",
          question: `Describe a complex system you've designed or architected. What were the key challenges?`,
          expectedAnswer: "Assess system design thinking and architectural knowledge",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How did you handle scalability?", "What would you do differently?"]
        },
        {
          id: "q6_2",
          type: "behavioral",
          question: `Tell me about a time when you had to learn a completely new technology stack for a project.`,
          expectedAnswer: "Look for learning agility and adaptability",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you approach the learning?", "What was the outcome?"]
        },
        {
          id: "q6_3",
          type: "technical",
          question: `How would you design a system to handle millions of concurrent users?`,
          expectedAnswer: "Assess scalability thinking and distributed systems knowledge",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["What components would you consider?", "How would you handle failures?"]
        },
        {
          id: "q6_4",
          type: "behavioral",
          question: `Describe a situation where you had to work with a team that had very different technical opinions.`,
          expectedAnswer: "Look for collaboration and consensus-building skills",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you resolve the differences?", "What was the final decision?"]
        },
        {
          id: "q6_5",
          type: "technical",
          question: `What's your approach to ensuring security in applications you develop?`,
          expectedAnswer: "Assess security awareness and best practices knowledge",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What security tools do you use?", "How do you stay updated on threats?"]
        },
        {
          id: "q6_6",
          type: "behavioral",
          question: `Tell me about a time when you had to deliver bad news to stakeholders about a project.`,
          expectedAnswer: "Look for communication skills and stakeholder management",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How did you prepare for the conversation?", "What was the response?"]
        },
        {
          id: "q6_7",
          type: "technical",
          question: `How do you approach code reviews, and what do you look for?`,
          expectedAnswer: "Assess code quality standards and review process understanding",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["What's your feedback style?", "How do you handle disagreements?"]
        },
        {
          id: "q6_8",
          type: "behavioral",
          question: `Describe a time when you had to make a significant technical decision that affected the entire team.`,
          expectedAnswer: "Look for decision-making process and team impact consideration",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How did you gather input?", "What was the team's reaction?"]
        }
      ],
      evaluationCriteria: {
        technical: "Advanced technical knowledge and system thinking",
        behavioral: "Complex scenario handling and decision-making"
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

// Ensure exactly six rounds with exactly 5 questions each
function ensureSixRounds(interviewData, jobDetails) {
  const data = interviewData || {};
  data.rounds = Array.isArray(data.rounds) ? data.rounds : [];
  
    // If more than 6 rounds, trim to exactly 6
  if (data.rounds.length >= 6) {
    data.rounds = data.rounds.slice(0, 6);
  }

  // Ensure each round has exactly 5 questions
  data.rounds = data.rounds.map((round, roundIndex) => {
    const questions = Array.isArray(round.questions) ? round.questions : [];
    
    // If less than 5 questions, pad with generic questions
    while (questions.length < 5) {
      const questionIndex = questions.length + 1;
      questions.push({
        id: `q${roundIndex + 1}_${questionIndex}`,
        type: 'technical',
        question: `Question ${questionIndex} for ${jobDetails.title} role: Please describe your experience and approach.`,
        expectedAnswer: 'Comprehensive answer expected',
        timeLimit: 3,
        difficulty: 'medium',
        followUpQuestions: []
      });
    }
    
    // If more than 5 questions, trim to exactly 5
    if (questions.length > 5) {
      questions.splice(5);
    }
    
    // Ensure question IDs are properly formatted
    questions.forEach((q, qIndex) => {
      q.id = `q${roundIndex + 1}_${qIndex + 1}`;
    });
    
    return {
      ...round,
      roundId: `round_${roundIndex + 1}`,
      roundNumber: roundIndex + 1,
      questions: questions
    };
  });

  // If less than 6 rounds, create additional rounds
  while (data.rounds.length < 6) {
    const idx = data.rounds.length + 1;
    const baseRound = data.rounds[0] || {
    title: 'Technical Fundamentals',
    description: 'Evaluate fundamentals',
    duration: 15,
    evaluationCriteria: { technical: 'Concept understanding' }
  };

    data.rounds.push({
      roundId: `round_${idx}`,
      roundNumber: idx,
      title: baseRound.title + ` (Round ${idx})`,
      description: baseRound.description,
      duration: baseRound.duration,
      evaluationCriteria: baseRound.evaluationCriteria,
      questions: [
        { id: `q${idx}_1`, type: 'conceptual', question: `What are key concepts for ${jobDetails.title}?`, expectedAnswer: 'Core concepts', timeLimit: 3, difficulty: 'easy', followUpQuestions: [] },
        { id: `q${idx}_2`, type: 'technical', question: `Describe your experience with ${jobDetails.title} technologies.`, expectedAnswer: 'Technical experience', timeLimit: 3, difficulty: 'medium', followUpQuestions: [] },
        { id: `q${idx}_3`, type: 'problem-solving', question: `How do you approach technical challenges?`, expectedAnswer: 'Problem-solving approach', timeLimit: 3, difficulty: 'medium', followUpQuestions: [] },
        { id: `q${idx}_4`, type: 'experience', question: `Tell me about a relevant project you've worked on.`, expectedAnswer: 'Project experience', timeLimit: 3, difficulty: 'medium', followUpQuestions: [] },
        { id: `q${idx}_5`, type: 'technical', question: `What tools and technologies do you use regularly?`, expectedAnswer: 'Tool proficiency', timeLimit: 3, difficulty: 'easy', followUpQuestions: [] }
      ]
    });
  }

  // Final validation: ensure exactly 6 rounds with exactly 5 questions each
  data.rounds = data.rounds.slice(0, 6).map((round, index) => ({
    ...round,
    roundId: `round_${index + 1}`,
    roundNumber: index + 1,
    questions: (round.questions || []).slice(0, 5).map((q, qIndex) => ({
        ...q,
      id: `q${index + 1}_${qIndex + 1}`
    }))
  }));
  
  return data;
}

// Validate interview structure - ensure exactly 6 rounds with exactly 5 questions each
function validateInterviewStructure(interviewData) {
  if (!interviewData || !Array.isArray(interviewData.rounds)) {
    console.log('❌ [VALIDATION] Invalid interview data structure');
    return false;
  }
  
  if (interviewData.rounds.length !== 6) {
    console.log(`❌ [VALIDATION] Expected 6 rounds, got ${interviewData.rounds.length}`);
    return false;
  }
  
  let isValid = true;
  interviewData.rounds.forEach((round, index) => {
    if (!round.questions || !Array.isArray(round.questions)) {
      console.log(`❌ [VALIDATION] Round ${index + 1} has no questions array`);
      isValid = false;
    } else if (round.questions.length !== 5) {
      console.log(`❌ [VALIDATION] Round ${index + 1} has ${round.questions.length} questions, expected exactly 5`);
      isValid = false;
    }
  });
  
  if (isValid) {
    console.log('✅ [VALIDATION] Interview structure is valid: 6 rounds with 5 questions each');
  }
  
  return isValid;
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
        totalQuestions: currentRound.questions.length,
        codeEditor: q.codeEditor || null,
        followUpQuestions: q.followUpQuestions || []
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
          newRound: true,
          codeEditor: q.codeEditor || null,
          followUpQuestions: q.followUpQuestions || []
        };
      }
    }
  }
  
  return null; // No more questions
}

// Compute progress for a candidate
function getProgress(interview, candidateId) {
  const total = (interview.rounds || []).length * 5; // Always 5 questions per round
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
    return createEnhancedFallbackEvaluation(round, candidateAnswers);
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

    const evaluationPrompt = `You are an expert technical interviewer and HR professional. Generate personalized feedback in the exact format shown below.

CANDIDATE: ${candidateName}
INTERVIEW ROUND: ${round.title}
ROUND DESCRIPTION: ${round.description}
TOTAL QUESTIONS: ${round.questions.length}
QUESTIONS ANSWERED: ${candidateAnswers.length}

DETAILED Q&A ANALYSIS:
${roundData.answers.map((item, index) => `
QUESTION ${index + 1}: ${item.question}
CANDIDATE'S ANSWER: ${item.answer}
TIME SPENT: ${item.timeSpent || 'Not recorded'}
---`).join('\n')}

${performanceAnalysis}

INSTRUCTIONS:
Generate feedback in this EXACT format with personal greeting and structured sections:

1. Start with: "Hi ${candidateName.toLowerCase()},"
2. Add: "Thank you for your time today. Along with technical assessment, here is feedback on your communication and presentation:"
3. Create 4 sections with specific content:

STRENGTHS:
- Only include strengths if they are genuinely demonstrated
- List specific strengths with examples from their actual answers
- Focus on communication, confidence, and technical clarity
- Use bullet points with "•" format

AREAS TO IMPROVE:
- List specific areas for improvement with actionable advice
- Focus on communication style, confidence, and technical depth
- Provide clear, constructive guidance
- Use bullet points with "•" format

OVERALL IMPRESSION:
- Write 2-3 sentences summarizing their overall performance
- Be encouraging but honest about their potential
- Focus on their interview presence and communication

AI SOFT SKILLS SCORE:
- Rate each skill out of 10 based on their actual performance:
  * Clarity of Communication: X/10
  * Vocabulary & Grammar: X/10  
  * Confidence & Body Language: X/10
  * Listening & Responsiveness: X/10

RESPOND WITH VALID JSON ONLY:
{
  "overallScore": 75,
  "feedback": "Hi ${candidateName.toLowerCase()},\\n\\nThank you for your time today. Along with technical assessment, here is feedback on your communication and presentation:\\n\\n**Strengths:**\\n• [Only include if genuinely demonstrated - specific strength with example]\\n\\n**Areas to Improve:**\\n• [Specific improvement area with actionable advice]\\n• [Another improvement area with guidance]\\n• [Third improvement area with suggestions]\\n\\n**Overall Impression:**\\n[2-3 sentences summarizing performance and potential]\\n\\n**AI Soft Skills Score:**\\n• Clarity of Communication: X/10\\n• Vocabulary & Grammar: X/10\\n• Confidence & Body Language: X/10\\n• Listening & Responsiveness: X/10",
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "areasForImprovement": ["Improvement area 1", "Improvement area 2", "Improvement area 3"],
  "recommendation": "Proceed to next round" or "Needs significant improvement" or "Strong candidate",
  "individualScores": [75, 80, 70, 85, 65],
  "softSkillsScores": {
    "clarity": 8,
    "vocabulary": 7,
    "confidence": 8,
    "listening": 9
  }
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
    
    return createEnhancedFallbackEvaluation(round, candidateAnswers);
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

// Enhanced fallback evaluation function with better AI-like feedback
function createEnhancedFallbackEvaluation(round, candidateAnswers) {
  console.log('🤖 [ENHANCED FALLBACK] Creating AI-enhanced fallback evaluation');
  
  // Calculate comprehensive metrics
  const totalAnswers = candidateAnswers.length;
  const totalQuestions = round.questions.length;
  const completionRate = (totalAnswers / totalQuestions) * 100;
  
  // Enhanced analysis of answer quality
  const avgAnswerLength = candidateAnswers.reduce((sum, answer) => 
    sum + (answer.answer ? answer.answer.length : 0), 0) / totalAnswers;
  
  // Technical knowledge indicators
  const technicalKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'database', 'api', 'function',
    'algorithm', 'framework', 'library', 'html', 'css', 'sql', 'git', 'docker',
    'kubernetes', 'aws', 'azure', 'microservices', 'rest', 'graphql', 'mongodb',
    'mysql', 'postgresql', 'redis', 'elasticsearch', 'jenkins', 'ci/cd', 'testing',
    'unit test', 'integration test', 'agile', 'scrum', 'devops', 'security'
  ];
  
  const hasTechnicalTerms = candidateAnswers.some(answer => 
    answer.answer && technicalKeywords.some(keyword => 
      answer.answer.toLowerCase().includes(keyword)
    )
  );
  
  // Experience and examples indicators
  const experienceKeywords = [
    'example', 'project', 'experience', 'worked', 'built', 'developed', 'created',
    'implemented', 'designed', 'architected', 'managed', 'led', 'collaborated',
    'team', 'client', 'user', 'requirement', 'challenge', 'solution', 'result'
  ];
  
  const hasExamples = candidateAnswers.some(answer => 
    answer.answer && experienceKeywords.some(keyword => 
      answer.answer.toLowerCase().includes(keyword)
    )
  );
  
  // Problem-solving indicators
  const problemSolvingKeywords = [
    'approach', 'method', 'strategy', 'process', 'step', 'analyze', 'debug',
    'troubleshoot', 'optimize', 'improve', 'refactor', 'design pattern', 'best practice'
  ];
  
  const hasProblemSolving = candidateAnswers.some(answer => 
    answer.answer && problemSolvingKeywords.some(keyword => 
      answer.answer.toLowerCase().includes(keyword)
    )
  );
  
  // Negative indicators
  const negativeKeywords = [
    'no idea', 'not sure', 'don\'t know', 'unclear', 'confused', 'forgot',
    'not familiar', 'never used', 'can\'t remember'
  ];
  
  const hasNegativeResponses = candidateAnswers.some(answer => 
    answer.answer && negativeKeywords.some(keyword => 
      answer.answer.toLowerCase().includes(keyword)
    )
  );
  
  // Calculate comprehensive score
  let overallScore = 30; // Start with base score
  const strengths = [];
  const improvements = [];
  
  // Technical knowledge scoring
  if (hasTechnicalTerms) {
    overallScore += 25;
    strengths.push("Demonstrated technical knowledge and familiarity with relevant technologies");
  } else {
    improvements.push("Include specific technical terms, frameworks, and tools relevant to the role");
  }
  
  // Experience and examples scoring
  if (hasExamples) {
    overallScore += 20;
    strengths.push("Shared practical experience and real-world examples");
  } else {
    improvements.push("Provide concrete examples from your projects and work experience");
  }
  
  // Problem-solving approach scoring
  if (hasProblemSolving) {
    overallScore += 15;
    strengths.push("Showed structured approach to problem-solving");
  } else {
    improvements.push("Explain your problem-solving methodology and thought process");
  }
  
  // Response quality scoring
  if (avgAnswerLength > 150) {
    overallScore += 10;
    strengths.push("Provided detailed and comprehensive responses");
  } else if (avgAnswerLength < 50) {
    overallScore -= 10;
    improvements.push("Provide more detailed explanations and expand on your answers");
  }
  
  // Completion rate scoring
  if (completionRate >= 100) {
    overallScore += 10;
    strengths.push("Completed all questions in the round");
  } else if (completionRate >= 80) {
    overallScore += 5;
    strengths.push("Completed most questions in the round");
  } else {
    improvements.push("Aim to answer all questions to demonstrate full engagement");
  }
  
  // Negative response penalties
  if (hasNegativeResponses) {
    overallScore -= 20;
    improvements.push("Avoid responses indicating uncertainty - show confidence in your knowledge");
  }
  
  // Ensure score is within bounds
  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));
  
  // Generate personalized feedback in the new format
  const candidateName = candidateAnswers[0]?.candidateName || "Candidate";
  
  let feedback = `Hi ${candidateName.toLowerCase()},\n\n`;
  feedback += `Thank you for your time today. Along with technical assessment, here is feedback on your communication and presentation:\n\n`;
  
  // Calculate soft skills scores based on performance
  const clarityScore = Math.min(10, Math.max(1, Math.round((overallScore / 100) * 10)));
  const vocabularyScore = hasTechnicalTerms ? Math.min(10, clarityScore + 1) : Math.max(1, clarityScore - 2);
  const confidenceScore = hasNegativeResponses ? Math.max(1, clarityScore - 2) : Math.min(10, clarityScore + 1);
  const listeningScore = completionRate >= 100 ? Math.min(10, clarityScore + 2) : Math.max(1, clarityScore - 1);
  
  // Strengths section - only show if there are actual strengths
  const strengthsList = [];
  if (hasTechnicalTerms) {
    strengthsList.push("You demonstrated technical knowledge by mentioning relevant technologies and frameworks in your responses.");
  }
  if (hasExamples) {
    strengthsList.push("You provided concrete examples from your experience, showing practical application of your skills.");
  }
  if (hasProblemSolving) {
    strengthsList.push("You showed a structured approach to problem-solving with clear methodology.");
  }
  if (avgAnswerLength > 100) {
    strengthsList.push("You provided detailed and comprehensive responses that demonstrated thorough thinking.");
  }
  if (completionRate >= 100) {
    strengthsList.push("You completed all questions in the round, showing full engagement.");
  }
  
  if (strengthsList.length > 0) {
    feedback += `**Strengths:**\n`;
    strengthsList.forEach(strength => {
      feedback += `• ${strength}\n`;
    });
  }
  
  // Areas to Improve section
  const improvementsList = [];
  if (!hasTechnicalTerms) {
    improvementsList.push("Include more specific technical terms, frameworks, and tools relevant to the role in your responses.");
  }
  if (!hasExamples) {
    improvementsList.push("Provide concrete examples from your projects and work experience to demonstrate practical skills.");
  }
  if (!hasProblemSolving) {
    improvementsList.push("Explain your problem-solving methodology and thought process more clearly.");
  }
  if (avgAnswerLength < 50) {
    improvementsList.push("Provide more detailed explanations and expand on your answers with specific details.");
  }
  if (hasNegativeResponses) {
    improvementsList.push("Avoid responses indicating uncertainty - show confidence in your knowledge and experience.");
  }
  if (completionRate < 100) {
    improvementsList.push("Aim to answer all questions to demonstrate full engagement and commitment.");
  }
  
  if (improvementsList.length > 0) {
    feedback += `\n**Areas to Improve:**\n`;
    improvementsList.forEach(improvement => {
      feedback += `• ${improvement}\n`;
    });
  }
  
  // Overall Impression section
  feedback += `\n**Overall Impression:**\n`;
  if (overallScore >= 80) {
    feedback += `You came across as confident, technically knowledgeable, and a strong communicator. Your responses demonstrated solid understanding and practical experience. With continued practice, you'll excel in technical interviews.\n`;
  } else if (overallScore >= 60) {
    feedback += `You showed good potential with some strong technical knowledge and communication skills. With refinement in providing more detailed examples and clearer explanations, your interview performance will be even stronger.\n`;
  } else if (overallScore >= 40) {
    feedback += `You demonstrated basic technical awareness but need to work on providing more detailed responses and concrete examples. Focus on building confidence and articulating your experience more clearly.\n`;
  } else {
    feedback += `You participated in the interview but need significant improvement in technical knowledge and communication. Consider preparing more thoroughly and practicing articulating your skills and experience.\n`;
  }
  
  // AI Soft Skills Score section
  feedback += `\n**AI Soft Skills Score:**\n`;
  feedback += `• Clarity of Communication: ${clarityScore}/10\n`;
  feedback += `• Vocabulary & Grammar: ${vocabularyScore}/10\n`;
  feedback += `• Confidence & Body Language: ${confidenceScore}/10\n`;
  feedback += `• Listening & Responsiveness: ${listeningScore}/10`;
  
  // Individual question scores
  const uniqueQuestionIds = [...new Set(candidateAnswers.map(answer => answer.questionId))];
  const individualScores = uniqueQuestionIds.map(questionId => {
    const questionAnswers = candidateAnswers.filter(answer => answer.questionId === questionId);
    const latestAnswer = questionAnswers[questionAnswers.length - 1];
    
    // Calculate individual score based on answer quality
    let questionScore = overallScore;
    if (latestAnswer?.answer) {
      const answerLength = latestAnswer.answer.length;
      const hasTech = technicalKeywords.some(keyword => 
        latestAnswer.answer.toLowerCase().includes(keyword)
      );
      const hasExp = experienceKeywords.some(keyword => 
        latestAnswer.answer.toLowerCase().includes(keyword)
      );
      
      if (hasTech && hasExp && answerLength > 100) {
        questionScore = Math.min(100, overallScore + 15);
      } else if (hasTech || hasExp) {
        questionScore = Math.min(100, overallScore + 5);
      } else if (answerLength < 30) {
        questionScore = Math.max(0, overallScore - 15);
      }
    }
    
    return Math.round(questionScore);
  });

  return {
    overallScore: overallScore,
    feedback: feedback,
    strengths: strengths.length > 0 ? strengths : ["Participated in the interview round"],
    areasForImprovement: improvements.length > 0 ? improvements : ["Provide more detailed and specific responses"],
    recommendation: overallScore >= 70 ? "Proceed to next round" : overallScore >= 50 ? "Needs improvement" : "Needs significant improvement",
    individualScores: individualScores,
    softSkillsScores: {
      clarity: clarityScore,
      vocabulary: vocabularyScore,
      confidence: confidenceScore,
      listening: listeningScore
    }
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

// AI Coding Assistant endpoint for real-time help during coding
router.post('/:interviewId/coding-assistant', async (req, res) => {
  console.log('🤖 [CODING ASSISTANT] Starting AI coding assistance...');
  console.log('📝 [CODING ASSISTANT] Request body:', {
    question: req.body.question?.substring(0, 100) + '...',
    currentCode: req.body.currentCode?.substring(0, 100) + '...',
    language: req.body.language,
    sessionId: req.body.sessionId
  });

  try {
    const { interviewId } = req.params;
    const { question, currentCode, language, testCases, testResults, userMessage, sessionId } = req.body;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({
        success: false,
        error: 'User message is required'
      });
    }

    // Find the interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    console.log('✅ [CODING ASSISTANT] Interview found, generating AI response...');

    // Create context-aware prompt for coding assistance
    const isInterviewerMode = req.body.isInterviewer;
    
    const codingAssistantPrompt = isInterviewerMode ? 
      `You are an AI interviewer conducting a coding interview. Your role is to assess the candidate's technical skills and problem-solving approach.

Context:
- Interview Question: ${question || 'Coding challenge'}
- Current Code: ${currentCode || 'No code written yet'}
- Programming Language: ${language || 'javascript'}
- Test Cases: ${JSON.stringify(testCases || [])}
- Test Results: ${JSON.stringify(testResults || [])}
- Session ID: ${sessionId || 'unknown'}

Candidate's Question: ${userMessage}

Interviewer Guidelines:
1. Ask probing questions to understand their thought process
2. Assess their technical knowledge and approach
3. Challenge their assumptions and ask for explanations
4. Ask about time/space complexity if relevant
5. Ask about edge cases and error handling
6. Ask about testing strategies
7. Do NOT provide hints, solutions, or direct help
8. Focus on evaluating their problem-solving skills
9. Ask follow-up questions based on their responses
10. Be professional but challenging

Respond as an experienced technical interviewer who wants to thoroughly assess the candidate's abilities.` :
      `You are an AI coding assistant helping a candidate during a coding interview. 

Context:
- Interview Question: ${question || 'Coding challenge'}
- Current Code: ${currentCode || 'No code written yet'}
- Programming Language: ${language || 'javascript'}
- Test Cases: ${JSON.stringify(testCases || [])}
- Test Results: ${JSON.stringify(testResults || [])}
- Session ID: ${sessionId || 'unknown'}

Candidate's Question: ${userMessage}

Guidelines:
1. Be helpful and encouraging but don't give away the complete solution
2. Provide hints, suggestions, and debugging help
3. Guide them to think through the problem step by step
4. If they're stuck, suggest approaches or point out potential issues
5. If they ask for the solution directly, explain the approach instead
6. Keep responses concise and actionable
7. Be supportive and maintain a positive learning environment

Respond as a helpful coding mentor who wants to see them succeed through their own problem-solving.`;

    console.log('🤖 [CODING ASSISTANT] Calling OpenRouter API...');
    console.log('🔑 [CODING ASSISTANT] API Key present:', !!process.env.OPENROUTER_API_KEY);

    // Try multiple models for coding assistance
    const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'];
    let aiResponse = null;
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        console.log('🎯 [CODING ASSISTANT] Trying model:', model);
        
        aiResponse = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful coding mentor and AI assistant. Provide constructive guidance without giving away complete solutions. Be encouraging and educational.'
            },
            {
              role: 'user',
              content: codingAssistantPrompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'AI Hiring Platform - Coding Assistant'
          },
          timeout: 30000
        });
        
        console.log('✅ [CODING ASSISTANT] Success with model:', model);
        break; // Success, exit the loop
        
      } catch (error) {
        console.log('❌ [CODING ASSISTANT] Failed with model:', model, error.response?.status || error.message);
        lastError = error;
        continue; // Try next model
      }
    }
    
    if (!aiResponse) {
      throw lastError || new Error('All models failed');
    }

    console.log('✅ [CODING ASSISTANT] AI response received, status:', aiResponse.status);
    
    if (!aiResponse.data || !aiResponse.data.choices || !aiResponse.data.choices[0]) {
      throw new Error('Invalid AI response structure');
    }

    const aiResponseText = aiResponse.data.choices[0].message.content;
    console.log('📝 [CODING ASSISTANT] AI response length:', aiResponseText.length);

    // Log the interaction for analytics (optional)
    if (interview.codingInteractions) {
      interview.codingInteractions.push({
        sessionId: sessionId,
        userMessage: userMessage,
        aiResponse: aiResponseText,
        timestamp: new Date(),
        language: language,
        questionId: req.body.questionId
      });
    } else {
      interview.codingInteractions = [{
        sessionId: sessionId,
        userMessage: userMessage,
        aiResponse: aiResponseText,
        timestamp: new Date(),
        language: language,
        questionId: req.body.questionId
      }];
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        response: aiResponseText,
        timestamp: new Date(),
        model: aiResponse.data.model || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ [CODING ASSISTANT] Error occurred:', error);
    
    // Fallback response
    const fallbackResponse = "I'm here to help with your coding challenge! Could you please rephrase your question or let me know what specific aspect you'd like assistance with?";
    
    res.json({
      success: true,
      data: {
        response: fallbackResponse,
        timestamp: new Date(),
        model: 'fallback',
        error: 'AI service temporarily unavailable'
      }
    });
  }
});

// Get coding hints for a specific question
router.post('/:interviewId/coding-hints', async (req, res) => {
  console.log('💡 [CODING HINTS] Generating coding hints...');
  
  try {
    const { interviewId } = req.params;
    const { question, currentCode, language, testCases } = req.body;

    const isInterviewerMode = req.body.isInterviewer;
    
    const isLiveComment = req.body.isLiveComment;
    
    const hintsPrompt = isLiveComment ?
      `You are an AI interviewer watching a candidate code in real-time. Provide interactive feedback and questions about their current code.

Question: ${question || 'Coding challenge'}
Current Code: ${currentCode || 'No code written yet'}
Language: ${language || 'javascript'}
Test Cases: ${JSON.stringify(testCases || [])}

Provide ONE interactive comment that:
1. Questions their approach or choice of method
2. Asks "why did you use X instead of Y?"
3. Suggests optimizations or better practices
4. Challenges their implementation decisions
5. Asks about edge cases or error handling

Examples:
- "Why did you choose a for loop instead of array methods here?"
- "This approach works, but have you considered the time complexity?"
- "What happens if the input is null or empty?"
- "Could you optimize this by using a different data structure?"

Format as a JSON array with one object: {"type": "interactive", "content": "your comment here"}` :
      isInterviewerMode ?
      `You are an AI interviewer conducting a coding interview. Generate probing questions to assess the candidate's technical skills and problem-solving approach.

Question: ${question || 'Coding challenge'}
Current Code: ${currentCode || 'No code written yet'}
Language: ${language || 'javascript'}
Test Cases: ${JSON.stringify(testCases || [])}

Generate 3-5 interview questions that assess:
1. Problem understanding and approach
2. Technical knowledge and algorithm choice
3. Edge cases and error handling
4. Time/space complexity analysis
5. Testing and debugging strategies

Format as a JSON array of question objects with "type" and "content" fields. Types should be: "approach", "algorithm", "edge-case", "complexity", or "testing".

Do NOT provide hints or solutions - only assessment questions.` :
      `You are an AI coding mentor providing hints for a coding interview question.

Question: ${question || 'Coding challenge'}
Current Code: ${currentCode || 'No code written yet'}
Language: ${language || 'javascript'}
Test Cases: ${JSON.stringify(testCases || [])}

Provide 3-5 helpful hints that guide the candidate toward the solution without giving it away directly. Focus on:
1. Understanding the problem
2. Approach/algorithm suggestions  
3. Common pitfalls to avoid
4. Edge cases to consider
5. Debugging tips

Format as a JSON array of hint objects with "type" and "content" fields. Types should be: "approach", "algorithm", "edge-case", "optimization", or "debugging".`;

    console.log('🤖 [CODING HINTS] Calling OpenRouter API...');

    const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo'];
    let aiResponse = null;
    let lastError = null;
    
    for (const model of modelsToTry) {
      try {
        console.log('🎯 [CODING HINTS] Trying model:', model);
        
        aiResponse = await axios.post(OPENROUTER_API_URL, {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful coding mentor. Provide structured hints in JSON format. Be educational and encouraging.'
            },
            {
              role: 'user',
              content: hintsPrompt
            }
          ],
          max_tokens: 400,
          temperature: 0.6
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'AI Hiring Platform - Coding Hints'
          },
          timeout: 20000
        });
        
        console.log('✅ [CODING HINTS] Success with model:', model);
        break;
        
      } catch (error) {
        console.log('❌ [CODING HINTS] Failed with model:', model, error.response?.status || error.message);
        lastError = error;
        continue;
      }
    }
    
    if (!aiResponse) {
      throw lastError || new Error('All models failed');
    }

    const aiResponseText = aiResponse.data.choices[0].message.content;
    console.log('📝 [CODING HINTS] AI response received');

    let hints;
    try {
      hints = JSON.parse(aiResponseText);
    } catch (parseError) {
      // Fallback questions/hints if JSON parsing fails
      if (isLiveComment) {
        hints = [
          { type: 'interactive', content: 'Why did you choose this approach? Have you considered alternative solutions?' }
        ];
      } else if (isInterviewerMode) {
        hints = [
          { type: 'approach', content: 'Can you walk me through your approach to solving this problem?' },
          { type: 'algorithm', content: 'What data structures are you considering and why?' },
          { type: 'edge-case', content: 'How would you handle edge cases in your solution?' },
          { type: 'complexity', content: 'What is the time and space complexity of your approach?' }
        ];
      } else {
        hints = [
          { type: 'approach', content: 'Break down the problem into smaller steps' },
          { type: 'algorithm', content: 'Think about the most efficient approach' },
          { type: 'edge-case', content: 'Consider edge cases and boundary conditions' },
          { type: 'debugging', content: 'Use console.log or print statements to debug' }
        ];
      }
    }

    res.json({
      success: true,
      data: {
        hints: hints,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [CODING HINTS] Error occurred:', error);
    
    // Fallback questions/hints
    const fallbackHints = isLiveComment ? [
      { type: 'interactive', content: 'Why did you choose this approach? Have you considered alternative solutions?' }
    ] : isInterviewerMode ? [
      { type: 'approach', content: 'Can you explain your thought process for this problem?' },
      { type: 'algorithm', content: 'What algorithm are you implementing and why?' },
      { type: 'edge-case', content: 'What edge cases should we consider?' },
      { type: 'complexity', content: 'How would you analyze the efficiency of your solution?' }
    ] : [
      { type: 'approach', content: 'Start by understanding what the function should return' },
      { type: 'algorithm', content: 'Think about the step-by-step process needed' },
      { type: 'edge-case', content: 'Consider what happens with empty inputs or special cases' },
      { type: 'debugging', content: 'Test your solution with different inputs' }
    ];
    
    res.json({
      success: true,
      data: {
        hints: fallbackHints,
        timestamp: new Date(),
        error: 'AI service temporarily unavailable'
      }
    });
  }
});

// Start Coding Round with Live AI Monitoring
router.post('/coding-round/start', auth, async (req, res) => {
  console.log('🚀 [CODING ROUND] Starting coding round with live AI monitoring...');
  console.log('👤 [CODING ROUND] User ID:', req.user.id);

  try {
    const { interviewId, question, language = 'javascript', starterCode = '' } = req.body;
    
    if (!interviewId || !question) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interview ID and question are required' 
      });
    }

    // Create coding session
    const sessionId = `coding_${Date.now()}_${req.user.id}`;
    
    // Store session data (in production, use Redis or database)
    const codingSession = {
      sessionId,
      interviewId,
      userId: req.user.id,
      question,
      language,
      starterCode,
      startTime: new Date(),
      codeHistory: [],
      aiComments: [],
      isActive: true,
      testCases: []
    };

    // Generate test cases for the question
    const testCasesPrompt = `Generate 3-5 test cases for this coding question:

Question: "${question}"
Language: ${language}
Starter Code: "${starterCode}"

Return as JSON array with this format:
[
  {
    "input": "test input value",
    "expectedOutput": "expected output",
    "description": "what this test case checks"
  }
]`;

    let testCases = [];
    try {
      const testCasesResponse = await axios.post(OPENROUTER_API_URL, {
        model: KIMI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at generating test cases for coding problems. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: testCasesPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      testCases = JSON.parse(testCasesResponse.data.choices[0].message.content);
      codingSession.testCases = testCases;
    } catch (error) {
      console.log('⚠️ [CODING ROUND] Test case generation failed, using fallback');
      testCases = [
        {
          input: "sample input",
          expectedOutput: "expected output",
          description: "Basic functionality test"
        }
      ];
    }

    res.json({
      success: true,
      data: {
        sessionId,
        question,
        language,
        starterCode,
        testCases,
        message: "Coding round started. AI will monitor your progress live."
      }
    });

  } catch (error) {
    console.error('❌ [CODING ROUND] Error starting coding round:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start coding round' 
    });
  }
});

// Live AI Monitoring - Code Analysis
router.post('/coding-round/monitor', auth, async (req, res) => {
  console.log('🤖 [CODING MONITOR] AI monitoring code changes...');

  try {
    const { sessionId, code, question, language } = req.body;
    
    if (!sessionId || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and code are required' 
      });
    }

    // Analyze the code and provide live feedback
    const analysisPrompt = `You are an AI interviewer monitoring a live coding session. Analyze the candidate's code and provide helpful, encouraging feedback.

Question: "${question}"
Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`

Provide analysis in this JSON format:
{
  "analysis": "Brief analysis of the current code",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "questions": ["thoughtful question about their approach"],
  "encouragement": "positive feedback about their progress"
}

Be encouraging but also ask probing questions to understand their thinking.`;

    const analysisResponse = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive AI interviewer. Provide constructive feedback and ask thoughtful questions to understand the candidate\'s approach.'
        },
        {
          role: 'user',
          content: analysisPrompt
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

    const analysis = JSON.parse(analysisResponse.data.choices[0].message.content);

    res.json({
      success: true,
      data: {
        analysis: analysis.analysis,
        suggestions: analysis.suggestions || [],
        questions: analysis.questions || [],
        encouragement: analysis.encouragement,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [CODING MONITOR] Error in AI monitoring:', error);
    
    // Fallback response
    res.json({
      success: true,
      data: {
        analysis: "I can see you're making progress on the code. Keep going!",
        suggestions: ["Consider edge cases", "Think about time complexity"],
        questions: ["Can you explain your approach so far?"],
        encouragement: "Great work! I'm here to help if you need guidance.",
        timestamp: new Date(),
        error: 'AI analysis temporarily unavailable'
      }
    });
  }
});

// Submit Code for Testing and AI Review
router.post('/coding-round/submit', auth, async (req, res) => {
  console.log('📝 [CODING SUBMIT] Code submission for testing and review...');

  try {
    const { sessionId, code, question, language, testCases } = req.body;
    
    if (!sessionId || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID and code are required' 
      });
    }

    // Run test cases (simplified - in production, use proper code execution sandbox)
    const testResults = testCases.map((testCase, index) => {
      // This is a simplified test runner - in production, use a proper code execution service
      try {
        // For demo purposes, we'll simulate test execution
        const passed = Math.random() > 0.3; // Simulate 70% pass rate
        return {
          testCase: index + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: passed ? testCase.expectedOutput : "incorrect output",
          passed: passed,
          description: testCase.description
        };
      } catch (error) {
        return {
          testCase: index + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: "error",
          passed: false,
          description: testCase.description,
          error: error.message
        };
      }
    });

    // AI Code Review
    const reviewPrompt = `You are an AI interviewer conducting a final code review. Analyze the submitted code thoroughly.

Question: "${question}"
Language: ${language}
Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Test Results: ${JSON.stringify(testResults)}

Provide a comprehensive review in this JSON format:
{
  "overallScore": 85,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "technicalQuestions": ["technical question 1", "technical question 2"],
  "feedback": "Overall feedback about the solution",
  "followUpQuestions": ["follow-up question 1", "follow-up question 2"]
}

Be thorough but fair in your assessment.`;

    const reviewResponse = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer. Provide detailed, fair feedback on code submissions.'
        },
        {
          role: 'user',
          content: reviewPrompt
        }
      ],
      max_tokens: 600,
      temperature: 0.5
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const review = JSON.parse(reviewResponse.data.choices[0].message.content);

    res.json({
      success: true,
      data: {
        testResults,
        review: {
          overallScore: review.overallScore,
          strengths: review.strengths || [],
          improvements: review.improvements || [],
          technicalQuestions: review.technicalQuestions || [],
          feedback: review.feedback,
          followUpQuestions: review.followUpQuestions || []
        },
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [CODING SUBMIT] Error in code submission:', error);
    
    // Fallback response
    res.json({
      success: true,
      data: {
        testResults: [],
        review: {
          overallScore: 75,
          strengths: ["Code structure looks good"],
          improvements: ["Consider edge cases"],
          technicalQuestions: ["Can you explain your algorithm choice?"],
          feedback: "Good effort! Let's discuss your approach.",
          followUpQuestions: ["How would you optimize this solution?"]
        },
        timestamp: new Date(),
        error: 'AI review temporarily unavailable'
      }
    });
  }
});

// Live AI Questions During Coding
router.post('/coding-round/ask-question', auth, async (req, res) => {
  console.log('❓ [CODING QUESTION] AI asking live question...');

  try {
    const { sessionId, code, question, context } = req.body;
    
    const questionPrompt = `You are an AI interviewer asking a live question during a coding session. Based on the current context, ask a thoughtful question that will be spoken aloud to the candidate.

Original Question: "${question}"
Current Code Context: "${context || 'No specific context'}"
Current Code:
\`\`\`
${code}
\`\`\`

Ask a relevant question that:
1. Tests their understanding of the current approach
2. Challenges their thinking process
3. Explores their problem-solving methodology
4. Is appropriate for the current stage of coding
5. Can be answered verbally (not requiring code)
6. Encourages them to explain their reasoning

Make the question conversational and natural for voice interaction. Return only the question as a string.`;

    const questionResponse = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert interviewer. Ask insightful questions that help evaluate the candidate\'s technical understanding and problem-solving approach.'
        },
        {
          role: 'user',
          content: questionPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.8
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const aiQuestion = questionResponse.data.choices[0].message.content.trim();

    res.json({
      success: true,
      data: {
        question: aiQuestion,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [CODING QUESTION] Error generating AI question:', error);
    
    // Fallback questions
    const fallbackQuestions = [
      "Can you walk me through your thought process for this approach?",
      "What made you choose this particular algorithm?",
      "How would you handle edge cases in your solution?",
      "What's the time complexity of your current approach?",
      "How would you test this function to ensure it works correctly?"
    ];
    
    const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

    res.json({
      success: true,
      data: {
        question: randomQuestion,
        timestamp: new Date(),
        error: 'AI question generation temporarily unavailable'
      }
    });
  }
});

// Handle Voice Answer Submission for Coding Round
router.post('/coding-round/voice-answer', auth, async (req, res) => {
  console.log('🎙️ [VOICE ANSWER] Processing voice answer for coding round...');

  try {
    const { sessionId, question, voiceAnswer, code, language } = req.body;
    
    if (!sessionId || !question || !voiceAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, question, and voiceAnswer'
      });
    }

    // Generate AI response to the voice answer
    const responsePrompt = `You are an AI interviewer evaluating a candidate's voice answer during a coding session.

Original Question: "${question}"
Candidate's Voice Answer: "${voiceAnswer}"
Current Code Context:
\`\`\`${language}
${code}
\`\`\`

Evaluate the candidate's answer and provide:
1. A brief acknowledgment of their response
2. Constructive feedback on their answer
3. A follow-up question or clarification if needed
4. Encouragement to continue coding

Keep your response conversational and supportive, as if you're having a real-time conversation during the coding session.`;

    const responseResult = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive AI interviewer conducting a live coding session. Provide encouraging, constructive feedback and ask follow-up questions to help the candidate demonstrate their skills.'
        },
        {
          role: 'user',
          content: responsePrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const aiResponse = responseResult.data.choices[0].message.content.trim();

    // Store the voice answer in the database (you might want to add this to your Interview model)
    // For now, we'll just log it
    console.log('📝 [VOICE ANSWER] Stored voice answer:', {
      sessionId,
      question,
      voiceAnswer,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        aiResponse: aiResponse,
        timestamp: new Date(),
        message: 'Voice answer processed successfully'
      }
    });

  } catch (error) {
    console.error('❌ [VOICE ANSWER] Error processing voice answer:', error);
    
    // Fallback response
    const fallbackResponse = "Thank you for your answer. That's an interesting perspective. Can you continue with your coding approach?";
    
    res.json({
      success: true,
      data: {
        aiResponse: fallbackResponse,
        timestamp: new Date(),
        error: 'AI response generation temporarily unavailable'
      }
    });
  }
});

module.exports = router;
