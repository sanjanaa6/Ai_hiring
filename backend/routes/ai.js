const express = require('express');
const axios = require('axios');
const router = express.Router();

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const KIMI_MODEL = 'moonshotai/kimi-vl-a3b-thinking';
const FALLBACK_MODEL = 'openai/gpt-3.5-turbo';

// Generate AI job description
router.post('/generate-job', async (req, res) => {
  try {
    console.log('🤖 [AI JOB GENERATE] Starting job generation...');
    console.log('📝 [AI JOB GENERATE] Request body:', req.body);

    const { prompt, role, company, industry } = req.body;

    // Validate input
    if (!prompt && !role && !company) {
      console.log('❌ [AI JOB GENERATE] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Please provide either a prompt or at least role and company'
      });
    }

    console.log('✅ [AI JOB GENERATE] Validation passed, generating job details...');

    // Create the AI prompt for job generation
    const jobPrompt = prompt || `Generate a complete job posting for a ${role} position at ${company}${industry ? ` in the ${industry} industry` : ''}.`;

    const aiPrompt = `You are an expert HR professional and job description writer. Generate a comprehensive job posting based on the following information:

${jobPrompt}

Please provide a complete job posting in the following JSON format:
{
  "title": "Job Title",
  "description": "Detailed job description including responsibilities, what the company does, and what makes this role exciting",
  "company": "Company Name",
  "location": "Location (e.g., San Francisco, CA or Remote)",
  "type": "full-time|part-time|contract|internship",
  "experienceLevel": "entry|mid|senior|executive",
  "salary": {
    "min": 80000,
    "max": 120000,
    "currency": "USD"
  },
  "requirements": [
    "3+ years of experience with React and Node.js",
    "Strong problem-solving skills",
    "Experience with agile development methodologies"
  ],
  "skills": [
    "React",
    "Node.js",
    "JavaScript",
    "TypeScript",
    "MongoDB"
  ],
  "benefits": [
    "Health insurance",
    "401k matching",
    "Flexible work hours",
    "Remote work options",
    "Professional development budget"
  ]
}

Make sure to:
1. Create an engaging and professional job description
2. Include realistic salary ranges based on the role and location
3. List relevant technical skills and requirements
4. Include attractive benefits and perks
5. Make the description compelling to attract top talent
6. Ensure all fields are properly filled
7. Return only valid JSON without any additional text`;

    console.log('🤖 [AI JOB GENERATE] Calling OpenRouter API...');
    console.log('🔑 [AI JOB GENERATE] API Key present:', !!process.env.OPENROUTER_API_KEY);

    let aiResponse;
    let lastError;

    try {
      const modelsToTry = [KIMI_MODEL, FALLBACK_MODEL, 'openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku'];

      for (const model of modelsToTry) {
        try {
          console.log(`🤖 [AI JOB GENERATE] Trying model: ${model}`);
          
          aiResponse = await axios.post(OPENROUTER_API_URL, {
            model: model,
            messages: [
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
              'HTTP-Referer': process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`,
              'X-Title': 'AI Hiring Platform'
            },
            timeout: 30000
          });

          console.log(`✅ [AI JOB GENERATE] Success with model: ${model}`);
          break;
        } catch (error) {
          console.log(`❌ [AI JOB GENERATE] Failed with model: ${model}`, error.response?.status || error.message);
          lastError = error;
          continue;
        }
      }

      if (!aiResponse) {
        throw lastError || new Error('All AI models failed');
      }

    } catch (apiError) {
      console.log('⚠️ [AI JOB GENERATE] OpenRouter API failed, using fallback:', apiError.response?.status || apiError.message);
      
      // Fallback job generation
      const fallbackJob = {
        title: role || 'Software Engineer',
        description: `We are looking for a talented ${role || 'Software Engineer'} to join our team at ${company || 'our company'}. This is an exciting opportunity to work on cutting-edge projects and make a real impact.

Key Responsibilities:
• Develop and maintain high-quality software applications
• Collaborate with cross-functional teams to deliver exceptional products
• Participate in code reviews and technical discussions
• Contribute to the overall architecture and design decisions

What We're Looking For:
• Strong technical skills and problem-solving abilities
• Excellent communication and teamwork skills
• Passion for learning and staying up-to-date with technology trends
• Experience in modern development practices`,
        company: company || 'Tech Company',
        location: 'Remote',
        type: 'full-time',
        experienceLevel: 'mid',
        salary: {
          min: 80000,
          max: 120000,
          currency: 'USD'
        },
        requirements: [
          '3+ years of relevant experience',
          'Strong problem-solving skills',
          'Excellent communication abilities',
          'Bachelor\'s degree in Computer Science or related field'
        ],
        skills: [
          'JavaScript',
          'React',
          'Node.js',
          'Git',
          'Agile Development'
        ],
        benefits: [
          'Health insurance',
          '401k matching',
          'Flexible work hours',
          'Remote work options',
          'Professional development opportunities'
        ]
      };

      console.log('✅ [AI JOB GENERATE] Using fallback job data');
      return res.json(fallbackJob);
    }

    console.log('✅ [AI JOB GENERATE] AI API call successful');
    console.log('📊 [AI JOB GENERATE] AI Response status:', aiResponse.status);

    const aiData = aiResponse.data.choices[0].message.content;
    console.log('📝 [AI JOB GENERATE] AI Response length:', aiData.length);

    // Parse AI response
    let jobData;
    try {
      console.log('🔍 [AI JOB GENERATE] Attempting to parse AI response as JSON...');
      
      // Try to extract JSON from the response
      const jsonMatch = aiData.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : aiData;
      
      jobData = JSON.parse(jsonContent);
      console.log('✅ [AI JOB GENERATE] Successfully parsed AI response');
    } catch (parseError) {
      console.log('⚠️ [AI JOB GENERATE] JSON parsing failed, using fallback');
      console.log('📝 [AI JOB GENERATE] AI response preview:', aiData.substring(0, 200) + '...');
      
      // If JSON parsing fails, create a structured response from the text
      jobData = {
        title: role || 'Software Engineer',
        description: aiData,
        company: company || 'Tech Company',
        location: 'Remote',
        type: 'full-time',
        experienceLevel: 'mid',
        salary: {
          min: 80000,
          max: 120000,
          currency: 'USD'
        },
        requirements: [
          '3+ years of relevant experience',
          'Strong problem-solving skills',
          'Excellent communication abilities'
        ],
        skills: [
          'JavaScript',
          'React',
          'Node.js',
          'Git'
        ],
        benefits: [
          'Health insurance',
          '401k matching',
          'Flexible work hours',
          'Remote work options'
        ]
      };
    }

    // Validate and ensure all required fields are present
    const validatedJobData = {
      title: jobData.title || role || 'Software Engineer',
      description: jobData.description || 'Job description will be provided during the interview process.',
      company: jobData.company || company || 'Tech Company',
      location: jobData.location || 'Remote',
      type: jobData.type || 'full-time',
      experienceLevel: jobData.experienceLevel || 'mid',
      salary: {
        min: jobData.salary?.min || 80000,
        max: jobData.salary?.max || 120000,
        currency: jobData.salary?.currency || 'USD'
      },
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [
        '3+ years of relevant experience',
        'Strong problem-solving skills',
        'Excellent communication abilities'
      ],
      skills: Array.isArray(jobData.skills) ? jobData.skills : [
        'JavaScript',
        'React',
        'Node.js',
        'Git'
      ],
      benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [
        'Health insurance',
        '401k matching',
        'Flexible work hours',
        'Remote work options'
      ]
    };

    console.log('✅ [AI JOB GENERATE] Job generation completed successfully');
    console.log('📊 [AI JOB GENERATE] Generated job:', {
      title: validatedJobData.title,
      company: validatedJobData.company,
      location: validatedJobData.location,
      type: validatedJobData.type
    });

    res.json(validatedJobData);

  } catch (error) {
    console.error('❌ [AI JOB GENERATE] Error occurred:', error.message);
    console.error('🔍 [AI JOB GENERATE] Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate job description';
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

module.exports = router;
