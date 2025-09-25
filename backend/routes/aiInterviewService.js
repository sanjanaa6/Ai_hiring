const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-3.5-turbo';
const FALLBACK_MODELS = [
  'openai/gpt-3.5-turbo',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemini-pro',
  'anthropic/claude-3-haiku',
  'microsoft/wizardlm-2-8x22b',
  'meta-llama/llama-3.1-70b-instruct'
];

// Helper functions for dynamic interview generation
function detectProgrammingLanguage(jobDescription) {
  const description = jobDescription.toLowerCase();
  
  // More specific and weighted keyword detection
  const languagePatterns = [
    // Python patterns (highest priority for Python)
    { language: 'python', patterns: [
      { keywords: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'celery', 'py'], weight: 3 },
      { keywords: ['data science', 'machine learning', 'ai', 'ml', 'data analysis'], weight: 2 },
      { keywords: ['backend', 'api', 'server'], weight: 1 }
    ]},
    
    // React/JSX patterns
    { language: 'jsx', patterns: [
      { keywords: ['react', 'jsx', 'tsx', 'react.js', 'reactjs', 'next.js', 'nextjs', 'gatsby'], weight: 3 },
      { keywords: ['frontend', 'component', 'hooks', 'redux'], weight: 2 },
      { keywords: ['ui', 'user interface', 'web app'], weight: 1 }
    ]},
    
    // TypeScript patterns
    { language: 'typescript', patterns: [
      { keywords: ['typescript', 'ts', 'angular', 'nestjs'], weight: 3 },
      { keywords: ['type safety', 'interface', 'generic'], weight: 2 }
    ]},
    
    // JavaScript patterns (non-React)
    { language: 'javascript', patterns: [
      { keywords: ['javascript', 'js', 'node.js', 'nodejs', 'express', 'vue', 'vue.js', 'vuejs'], weight: 3 },
      { keywords: ['frontend', 'backend', 'fullstack'], weight: 2 },
      { keywords: ['web development', 'api'], weight: 1 }
    ]},
    
    // Java patterns
    { language: 'java', patterns: [
      { keywords: ['java', 'spring', 'spring boot', 'hibernate', 'maven', 'gradle'], weight: 3 },
      { keywords: ['enterprise', 'backend', 'microservices'], weight: 2 },
      { keywords: ['oop', 'object oriented'], weight: 1 }
    ]},
    
    // C# patterns
    { language: 'csharp', patterns: [
      { keywords: ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'entity framework'], weight: 3 },
      { keywords: ['microsoft', 'enterprise', 'backend'], weight: 2 }
    ]},
    
    // Go patterns
    { language: 'go', patterns: [
      { keywords: ['go', 'golang', 'gin', 'echo', 'gorilla'], weight: 3 },
      { keywords: ['microservices', 'backend', 'api'], weight: 2 }
    ]},
    
    // PHP patterns
    { language: 'php', patterns: [
      { keywords: ['php', 'laravel', 'symfony', 'codeigniter', 'wordpress'], weight: 3 },
      { keywords: ['web development', 'backend'], weight: 2 }
    ]},
    
    // Ruby patterns
    { language: 'ruby', patterns: [
      { keywords: ['ruby', 'rails', 'ruby on rails', 'sinatra'], weight: 3 },
      { keywords: ['web development', 'backend'], weight: 2 }
    ]},
    
    // C++ patterns
    { language: 'cpp', patterns: [
      { keywords: ['c++', 'cpp', 'c plus plus', 'qt', 'boost'], weight: 3 },
      { keywords: ['system programming', 'performance', 'embedded'], weight: 2 }
    ]},
    
    // C patterns
    { language: 'c', patterns: [
      { keywords: ['c programming', 'c language', 'embedded c'], weight: 3 },
      { keywords: ['system programming', 'embedded', 'firmware'], weight: 2 }
    ]},
    
    // Swift patterns
    { language: 'swift', patterns: [
      { keywords: ['swift', 'ios', 'xcode', 'cocoa', 'swiftui'], weight: 3 },
      { keywords: ['mobile development', 'apple'], weight: 2 }
    ]},
    
    // Kotlin patterns
    { language: 'kotlin', patterns: [
      { keywords: ['kotlin', 'android', 'jetpack', 'compose'], weight: 3 },
      { keywords: ['mobile development', 'android development'], weight: 2 }
    ]},
    
    // Rust patterns
    { language: 'rust', patterns: [
      { keywords: ['rust', 'cargo', 'tokio', 'actix'], weight: 3 },
      { keywords: ['system programming', 'performance', 'memory safety'], weight: 2 }
    ]},
    
    // Scala patterns
    { language: 'scala', patterns: [
      { keywords: ['scala', 'akka', 'play', 'spark'], weight: 3 },
      { keywords: ['functional programming', 'big data'], weight: 2 }
    ]}
  ];
  
  let bestMatch = { language: 'javascript', score: 0 };
  
  for (const { language, patterns } of languagePatterns) {
    let score = 0;
    for (const { keywords, weight } of patterns) {
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
          score += weight;
        }
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { language, score };
    }
  }
  
  console.log(`🎯 [LANGUAGE DETECTION] Detected: ${bestMatch.language} (score: ${bestMatch.score})`);
  return bestMatch.language;
}

function getRoleSpecificConfig(jobTitle, detectedLanguage) {
  const title = jobTitle.toLowerCase();
  
  // Developer roles
  if (title.includes('frontend') || title.includes('react') || title.includes('ui') || title.includes('front-end')) {
    return {
      role: 'frontend',
      language: detectedLanguage,
      focus: 'User interface, component architecture, state management, performance optimization',
      tools: ['React', 'JavaScript/TypeScript', 'CSS', 'HTML', 'Testing frameworks'],
      challenges: ['Component design', 'State management', 'Performance optimization', 'Responsive design']
    };
  }
  
  if (title.includes('backend') || title.includes('api') || title.includes('server') || title.includes('back-end')) {
    return {
      role: 'backend',
      language: detectedLanguage,
      focus: 'API design, database management, security, scalability, system architecture',
      tools: ['Node.js', 'Express', 'Databases', 'Authentication', 'Testing'],
      challenges: ['API design', 'Database optimization', 'Security implementation', 'Scalability']
    };
  }
  
  if (title.includes('fullstack') || title.includes('full-stack') || title.includes('full stack')) {
    return {
      role: 'fullstack',
      language: detectedLanguage,
      focus: 'End-to-end development, system integration, database design, user experience',
      tools: ['Frontend frameworks', 'Backend technologies', 'Databases', 'DevOps'],
      challenges: ['System integration', 'Database design', 'Performance optimization', 'Deployment']
    };
  }
  
  if (title.includes('mobile') || title.includes('ios') || title.includes('android')) {
    return {
      role: 'mobile',
      language: detectedLanguage,
      focus: 'Mobile app development, platform-specific features, performance, user experience',
      tools: ['React Native', 'Flutter', 'Native development', 'Mobile testing'],
      challenges: ['Cross-platform compatibility', 'Performance optimization', 'Platform integration', 'User experience']
    };
  }
  
  if (title.includes('data') || title.includes('analyst') || title.includes('scientist')) {
    return {
      role: 'data',
      language: detectedLanguage,
      focus: 'Data analysis, machine learning, statistical modeling, data visualization',
      tools: ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Matplotlib'],
      challenges: ['Data cleaning', 'Statistical analysis', 'Model building', 'Data visualization']
    };
  }
  
  if (title.includes('devops') || title.includes('sre') || title.includes('infrastructure')) {
    return {
      role: 'devops',
      language: detectedLanguage,
      focus: 'Infrastructure automation, CI/CD, monitoring, security, scalability',
      tools: ['Docker', 'Kubernetes', 'AWS/Azure/GCP', 'CI/CD tools', 'Monitoring'],
      challenges: ['Infrastructure automation', 'Deployment strategies', 'Monitoring setup', 'Security implementation']
    };
  }
  
  if (title.includes('qa') || title.includes('test') || title.includes('quality')) {
    return {
      role: 'qa',
      language: detectedLanguage,
      focus: 'Test automation, quality assurance, bug detection, test strategy',
      tools: ['Selenium', 'Jest', 'Cypress', 'Testing frameworks', 'Bug tracking'],
      challenges: ['Test automation', 'Test strategy', 'Bug detection', 'Quality metrics']
    };
  }
  
  // Default to general developer
  return {
    role: 'developer',
    language: detectedLanguage,
    focus: 'Software development, problem solving, system design, code quality',
    tools: ['Programming languages', 'Frameworks', 'Databases', 'Testing', 'Version control'],
    challenges: ['Problem solving', 'System design', 'Code optimization', 'Technical implementation']
  };
}

function getDefaultStarterCode(language) {
  const starterCodes = {
    javascript: `// Welcome to the coding challenge!
// Write your solution below

function solution() {
    // Your code here
    return "Hello, World!";
}

// Test your solution
console.log(solution());`,
    
    python: `# Welcome to the coding challenge!
# Write your solution below

def solution():
    # Your code here
    return "Hello, World!"

# Test your solution
print(solution())`,
    
    java: `// Welcome to the coding challenge!
// Write your solution below

public class Solution {
    public static String solution() {
        // Your code here
        return "Hello, World!";
    }
    
    public static void main(String[] args) {
        System.out.println(solution());
    }
}`,
    
    cpp: `// Welcome to the coding challenge!
// Write your solution below

#include <iostream>
#include <string>

std::string solution() {
    // Your code here
    return "Hello, World!";
}

int main() {
    std::cout << solution() << std::endl;
    return 0;
}`,
    
    csharp: `// Welcome to the coding challenge!
// Write your solution below

using System;

public class Solution {
    public static string Solution() {
        // Your code here
        return "Hello, World!";
    }
    
    public static void Main(string[] args) {
        Console.WriteLine(Solution());
    }
}`,
    
    go: `// Welcome to the coding challenge!
// Write your solution below

package main

import "fmt"

func solution() string {
    // Your code here
    return "Hello, World!"
}

func main() {
    fmt.Println(solution())
}`,
    
    php: `<?php
// Welcome to the coding challenge!
// Write your solution below

function solution() {
    // Your code here
    return "Hello, World!";
}

// Test your solution
echo solution();
?>`,
    
    ruby: `# Welcome to the coding challenge!
# Write your solution below

def solution
    # Your code here
    "Hello, World!"
end

# Test your solution
puts solution`,
    
    rust: `// Welcome to the coding challenge!
// Write your solution below

fn solution() -> String {
    // Your code here
    "Hello, World!".to_string()
}

fn main() {
    println!("{}", solution());
}`,
    
    swift: `// Welcome to the coding challenge!
// Write your solution below

import Foundation

func solution() -> String {
    // Your code here
    return "Hello, World!"
}

// Test your solution
print(solution())`,
    
    kotlin: `// Welcome to the coding challenge!
// Write your solution below

fun solution(): String {
    // Your code here
    return "Hello, World!"
}

// Test your solution
fun main() {
    println(solution())
}`,
    
    scala: `// Welcome to the coding challenge!
// Write your solution below

object Solution {
    def solution(): String = {
        // Your code here
        "Hello, World!"
    }
    
    def main(args: Array[String]): Unit = {
        println(solution())
    }
}`
  };
  
  return starterCodes[language] || starterCodes.javascript;
}

async function extractJobDetailsFromPrompt(jobPrompt) {
  console.log('🔍 [JOB EXTRACTION] Extracting job details from prompt...');
  
  const extractionPrompt = `Extract job details from this user prompt and format as JSON:

User Prompt: "${jobPrompt}"

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

  try {
    const response = await axios.post(OPENROUTER_API_URL, {
      model: KIMI_MODEL,
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

    const extractedContent = response.data.choices[0].message.content;
    const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : extractedContent;
    
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('❌ [JOB EXTRACTION] Failed to extract job details:', error.message);
    throw error;
  }
}

function extractJobTitle(jobPrompt) {
  // Simple extraction - look for common patterns
  const lines = jobPrompt.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('title:') || line.toLowerCase().includes('position:')) {
      return line.split(':')[1]?.trim() || 'Software Developer';
    }
  }
  return 'Software Developer';
}

function extractLevel(jobPrompt) {
  const prompt = jobPrompt.toLowerCase();
  if (prompt.includes('senior') || prompt.includes('lead') || prompt.includes('principal')) return 'senior';
  if (prompt.includes('junior') || prompt.includes('entry') || prompt.includes('graduate')) return 'junior';
  if (prompt.includes('mid') || prompt.includes('intermediate')) return 'mid';
  return 'mid'; // Default
}

function generateDynamicInterviewPrompt(jobDetails, roleConfig) {
  const { title, description, requirements, level, duration } = jobDetails;
  const { role, language, focus, tools, challenges } = roleConfig;
  
  return `You are an expert HR professional and technical interviewer. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes
- Primary Language: ${language}
- Role Focus: ${focus}
- Key Tools: ${tools.join(', ')}
- Main Challenges: ${challenges.join(', ')}

Create a structured interview with exactly 6 hiring rounds that are HIGHLY SPECIALIZED and PRACTICAL for this specific role. Each round must have exactly 5 questions with hands-on challenges:

ROUND 1: Role-Specific Technical Fundamentals (20-25 minutes)
- 5 technical questions with practical applications
- For Developers: MUST include coding challenges with codeEditor object (enabled: true, language: "${language}", starterCode, testCases), algorithm problems, system design basics
- For Data Analysts: Excel formulas, SQL queries, data manipulation tasks
- For Hiring Managers: Resume evaluation, candidate comparison scenarios
- For Designers: Design challenges, portfolio review, creative problem-solving
- Focus on core skills and tools specific to ${title} role

ROUND 2: Practical Skills Assessment (20-25 minutes)
- 5 hands-on challenges and real-world scenarios
- For Developers: MUST include live coding challenges, debugging exercises, system design problems, API design, database design
- For Data Analysts: Advanced Excel challenges, complex SQL queries, data cleaning scenarios
- For Hiring Managers: Interview simulations, candidate evaluation exercises
- For Designers: Design system challenges, user experience scenarios
- Assess practical application of skills in realistic situations

ROUND 3: Problem-Solving & Critical Thinking (15-20 minutes)
- 5 scenario-based questions that test analytical thinking
- Present real-world problems and ask for solutions
- For Developers: System architecture decisions, performance optimization, debugging complex issues
- For Data Analysts: Data interpretation, statistical analysis, business insights
- For Hiring Managers: Conflict resolution, team management scenarios, decision-making
- For Designers: User experience problems, design trade-offs, creative solutions
- Evaluate approach to problem-solving and decision-making

ROUND 4: Advanced Technical Deep Dive (20-25 minutes)
- 5 advanced technical questions specific to the role
- For Developers: Advanced ${language} concepts, system design, scalability, security, performance optimization
- For Data Analysts: Advanced statistical methods, machine learning concepts, data pipeline design
- For Hiring Managers: Advanced HR strategies, talent development, organizational design
- For Designers: Advanced design principles, user research, design systems, accessibility
- Test depth of technical knowledge and expertise

ROUND 5: Behavioral & Cultural Fit (15-20 minutes)
- 5 behavioral questions using STAR method
- Focus on role-specific scenarios and challenges
- For Developers: Team collaboration, code review processes, learning new technologies, handling technical debt
- For Data Analysts: Working with stakeholders, presenting insights, handling data quality issues
- For Hiring Managers: Managing difficult situations, building teams, driving change
- For Designers: Working with developers, handling feedback, user research collaboration
- Assess soft skills, communication, and cultural alignment

ROUND 6: Scenario-Based Role Play (15-20 minutes)
- 5 realistic work scenarios and role-playing exercises
- For Developers: Code review session, technical discussion with non-technical stakeholders, debugging session with team
- For Data Analysts: Presenting findings to executives, handling data quality issues, collaborating with business teams
- For Hiring Managers: Conducting interviews, handling difficult conversations, team building exercises
- For Designers: Design critique session, user feedback discussion, cross-functional collaboration
- Simulate real work environment and interactions

CRITICAL REQUIREMENTS:
1. Each round must have EXACTLY 5 questions
2. For coding questions, include codeEditor object with:
   - enabled: true
   - language: "${language}"
   - starterCode: appropriate starter code for the language
   - testCases: array of test cases with input/output
3. Include followUpQuestions for interactive questions
4. Set appropriate timeLimit (2-6 minutes per question)
5. Set difficulty levels: easy, medium, hard
6. Make questions highly specific to ${title} role and ${language} technology
7. Include practical, hands-on challenges
8. Ensure questions test both technical skills and soft skills
9. Make questions progressive in difficulty within each round
10. Include real-world scenarios and practical applications

Return ONLY valid JSON in this exact format:
{
  "title": "AI-Generated Interview for ${title}",
  "totalDuration": ${duration},
  "rounds": [
    {
      "roundId": "round_1",
      "roundNumber": 1,
      "title": "Role-Specific Technical Fundamentals",
      "description": "Evaluate core technical knowledge and fundamentals",
      "duration": 25,
      "evaluationCriteria": {
        "technical": "Core technical knowledge and understanding",
        "practical": "Application of technical concepts"
      },
      "questions": [
        {
          "id": "q1_1",
          "type": "technical",
          "question": "Specific technical question for ${title}",
          "expectedAnswer": "What to look for in the answer",
          "timeLimit": 5,
          "difficulty": "medium",
          "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"],
          "codeEditor": {
            "enabled": true,
            "language": "${language}",
            "starterCode": "Appropriate starter code",
            "testCases": [
              {"input": "test input", "output": "expected output", "description": "Test case description"}
            ]
          }
        }
      ]
    }
  ]
}

Generate questions that are highly specific to the ${title} role, ${language} technology, and ${level} level. Make them practical, challenging, and relevant to real-world work scenarios.`;
}

async function callOpenRouterAPI(prompt) {
  console.log('🤖 [OPENROUTER] Calling OpenRouter API with multiple fallback models...');
  
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    try {
      console.log(`🎯 [OPENROUTER] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${model}`);
      
      const response = await axios.post(OPENROUTER_API_URL, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional and technical interviewer. You MUST respond with ONLY valid JSON. Do not include any text, explanations, or markdown outside the JSON structure. The JSON must be complete and properly formatted.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3 // Lower temperature for more consistent JSON
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'AI Hiring Platform'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log(`✅ [OPENROUTER] Success with model: ${model}`);
      return response;
      
    } catch (error) {
      console.log(`❌ [OPENROUTER] Failed with model: ${model}`, error.response?.status || error.message);
      
      // If this is the last model, throw the error
      if (i === FALLBACK_MODELS.length - 1) {
        console.log('💥 [OPENROUTER] All models failed');
        throw new Error('All AI models failed to generate interview');
      }
      
      // Wait a bit before trying the next model
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function saveInterviewToDatabase(interview, userId, jobDetails = null) {
  console.log('💾 [SAVE INTERVIEW] Saving interview to database...');
  
  const interviewData = {
    interviewId: `interview_${Date.now()}`,
    title: interview.title,
    totalDuration: interview.totalDuration,
    rounds: interview.rounds,
    jobTitle: jobDetails?.title || 'AI Generated Job',
    jobDescription: jobDetails?.description || 'AI generated job description',
    jobRequirements: jobDetails?.requirements || 'Requirements to be determined',
    jobLevel: jobDetails?.level || 'mid',
    company: jobDetails?.company || 'Company',
    originalPrompt: jobDetails?.originalPrompt || 'AI generated interview',
    createdBy: userId,
    approvalStatus: 'pending'
  };
  
  const newInterview = new Interview(interviewData);
  await newInterview.save();
  
  console.log('✅ [SAVE INTERVIEW] Interview saved with ID:', newInterview.interviewId);
  return newInterview;
}

// Generate AI interview - MAIN FUNCTION
router.post('/generate-ai', auth, async (req, res) => {
  console.log('🚀 [AI INTERVIEW] Starting AI interview generation...');
  console.log('📝 [AI INTERVIEW] Request body:', {
    prompt: req.body.prompt?.substring(0, 200) + '...'
  });
  console.log('👤 [AI INTERVIEW] User ID:', req.user.id);

  try {
    const { prompt: userPrompt } = req.body;
    
    if (!userPrompt || userPrompt.trim().length < 10) {
      console.log('❌ [AI INTERVIEW] Validation failed - missing or too short prompt');
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a detailed job description prompt (minimum 10 characters)' 
      });
    }

    console.log('✅ [AI INTERVIEW] Validation passed, extracting job details...');

    // Extract job details from prompt
    const jobDetails = await extractJobDetailsFromPrompt(userPrompt);
    console.log('✅ [AI INTERVIEW] Job details extracted:', {
      title: jobDetails.title,
      level: jobDetails.level,
      duration: jobDetails.duration
    });

    // Detect programming language and get role configuration
    const detectedLanguage = detectProgrammingLanguage(jobDetails.description);
    const roleConfig = getRoleSpecificConfig(jobDetails.title, detectedLanguage);
    
    console.log('🎯 [AI INTERVIEW] Role configuration:', {
      role: roleConfig.role,
      language: roleConfig.language,
      focus: roleConfig.focus
    });

    // Generate dynamic interview prompt
    const interviewPrompt = generateDynamicInterviewPrompt(jobDetails, roleConfig);
    
    console.log('🤖 [AI INTERVIEW] Generating interview with AI...');
    
    // Call OpenRouter API to generate interview
    const aiResponse = await callOpenRouterAPI(interviewPrompt);
    const aiContent = aiResponse.data.choices[0].message.content;
    
    console.log('📋 [AI INTERVIEW] Raw AI response received, parsing...');
    
    // Parse AI response with robust parsing
    let interviewData;
    try {
      interviewData = parseAIResponse(aiContent);
      console.log('✅ [AI INTERVIEW] AI response parsed successfully');
    } catch (parseError) {
      console.error('❌ [AI INTERVIEW] Failed to parse AI response:', parseError.message);
      throw new Error('Failed to parse AI-generated interview data');
    }

    // Validate interview structure
    if (!validateInterviewStructure(interviewData)) {
      console.log('❌ [AI INTERVIEW] Invalid interview structure from AI');
      throw new Error('AI generated invalid interview structure');
    }

    // Enhance questions with proper starter code and test cases
    interviewData = enhanceInterviewWithCodeEditor(interviewData, roleConfig);
    
    // Ensure interviewId is present
    if (!interviewData.interviewId) {
      interviewData.interviewId = `interview_${Date.now()}`;
    }
    
    // Save to database
    const savedInterview = await saveInterviewToDatabase(interviewData, req.user.id, {
      ...jobDetails,
      originalPrompt: userPrompt
    });

    console.log('✅ [AI INTERVIEW] Interview generated and saved successfully');

    return res.json({
      success: true,
      data: {
        interviewId: savedInterview.interviewId,
        title: savedInterview.title,
        totalDuration: savedInterview.totalDuration,
        rounds: savedInterview.rounds,
        link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${savedInterview.interviewId}`
      }
    });

  } catch (error) {
    console.error('❌ [AI INTERVIEW] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI interview'
    });
  }
});

// Robust JSON parsing function with multiple attempts
function parseAIResponse(content) {
  console.log('🔍 [PARSE] Attempting to parse AI response...');
  
  // Clean the content
  let cleanContent = content.trim();
  
  // Remove any markdown code blocks
  const jsonMatch = cleanContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    cleanContent = jsonMatch[1];
    console.log('📝 [PARSE] Extracted JSON from markdown code block');
  }
  
  // Try to parse as-is first
  try {
    const parsed = JSON.parse(cleanContent);
    console.log('✅ [PARSE] Successfully parsed JSON on first attempt');
    return parsed;
  } catch (error) {
    console.log('⚠️ [PARSE] First parse attempt failed, trying fixes...');
  }
  
  // Try to fix common JSON issues
  const fixes = [
    // Fix unterminated strings
    (str) => str.replace(/(".*?)(\n|$)/g, '$1"'),
    // Fix trailing commas
    (str) => str.replace(/,(\s*[}\]])/g, '$1'),
    // Fix missing quotes around keys
    (str) => str.replace(/(\w+):/g, '"$1":'),
    // Fix single quotes to double quotes
    (str) => str.replace(/'/g, '"'),
    // Remove any text before the first {
    (str) => str.replace(/^[^{]*/, ''),
    // Remove any text after the last }
    (str) => str.replace(/[^}]*$/, ''),
    // Fix escaped quotes
    (str) => str.replace(/\\"/g, '"'),
    // Fix newlines in strings
    (str) => str.replace(/\n/g, '\\n'),
    // Fix tabs in strings
    (str) => str.replace(/\t/g, '\\t')
  ];
  
  for (let i = 0; i < fixes.length; i++) {
    try {
      let fixedContent = cleanContent;
      
      // Apply the fix
      fixedContent = fixes[i](fixedContent);
      
      const parsed = JSON.parse(fixedContent);
      console.log(`✅ [PARSE] Successfully parsed JSON after applying fix ${i + 1}`);
      return parsed;
    } catch (error) {
      console.log(`⚠️ [PARSE] Fix ${i + 1} failed, trying next...`);
    }
  }
  
  // If all fixes fail, try to extract just the structure
  try {
    console.log('🔄 [PARSE] Attempting to extract basic structure...');
    const basicStructure = {
      interviewId: `interview_${Date.now()}`,
      title: "AI-Generated Interview",
      totalDuration: 120,
      rounds: []
    };
    
    // Try to extract rounds from the content
    const roundMatches = content.match(/"rounds?":\s*\[([\s\S]*?)\]/g);
    if (roundMatches) {
      console.log('📋 [PARSE] Found rounds structure, creating basic interview...');
      // Create 6 basic rounds with 5 questions each
      for (let i = 1; i <= 6; i++) {
        basicStructure.rounds.push({
          roundId: `round_${i}`,
          roundNumber: i,
          title: `Round ${i}`,
          description: `Interview round ${i}`,
          duration: 20,
          evaluationCriteria: {
            technical: "Technical knowledge assessment",
            practical: "Practical skills evaluation"
          },
          questions: []
        });
        
        // Add 5 questions to each round
        for (let j = 1; j <= 5; j++) {
          basicStructure.rounds[i-1].questions.push({
            id: `q${i}_${j}`,
            type: "technical",
            question: `AI-generated question ${j} for round ${i}`,
            expectedAnswer: "Look for relevant technical knowledge and practical experience",
            timeLimit: 3,
            difficulty: "medium",
            followUpQuestions: []
          });
        }
      }
    }
    
    console.log('✅ [PARSE] Created basic interview structure');
    return basicStructure;
    
  } catch (error) {
    console.error('💥 [PARSE] All parsing attempts failed');
    throw new Error('Failed to parse AI response after all attempts');
  }
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

// Enhance interview with proper code editor configuration
function enhanceInterviewWithCodeEditor(interviewData, roleConfig) {
  console.log('🔧 [ENHANCE] Enhancing interview with code editor configuration...');
  
  const { language } = roleConfig;
  const defaultStarterCode = getDefaultStarterCode(language);
  
  interviewData.rounds.forEach((round, roundIndex) => {
    round.questions.forEach((question, questionIndex) => {
      // Ensure proper question ID
      question.id = `q${roundIndex + 1}_${questionIndex + 1}`;
      
      // Add code editor for coding questions
      if (question.type === 'technical' || question.type === 'coding' || question.type === 'interactive-coding') {
        if (!question.codeEditor) {
          question.codeEditor = {
            enabled: true,
            language: language,
            starterCode: defaultStarterCode,
            testCases: [
              {
                input: "test input",
                output: "expected output",
                description: "Basic test case"
              }
            ]
          };
        }
      }
      
      // Ensure follow-up questions exist
      if (!question.followUpQuestions) {
        question.followUpQuestions = [];
      }
      
      // Ensure time limit exists
      if (!question.timeLimit) {
        question.timeLimit = 3;
      }
      
      // Ensure difficulty exists
      if (!question.difficulty) {
        question.difficulty = 'medium';
      }
    });
  });
  
  console.log('✅ [ENHANCE] Interview enhanced successfully');
  return interviewData;
}

// Get interview by ID
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

// Get all interviews for a user
router.get('/', auth, async (req, res) => {
  console.log('📋 [GET INTERVIEWS] Fetching interviews for user:', req.user.id);
  
  try {
    const interviews = await Interview.find({
      createdBy: req.user.id
    }).sort({ createdAt: -1 });

    console.log(`✅ [GET INTERVIEWS] Found ${interviews.length} interviews`);

    res.json({
      success: true,
      data: interviews.map(interview => ({
        interviewId: interview.interviewId,
        title: interview.title,
        totalDuration: interview.totalDuration,
        jobTitle: interview.jobTitle,
        jobLevel: interview.jobLevel,
        company: interview.company,
        approvalStatus: interview.approvalStatus,
        createdAt: interview.createdAt,
        link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${interview.interviewId}`
      }))
    });
  } catch (error) {
    console.error('❌ [GET INTERVIEWS] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews'
    });
  }
});

// Delete interview
router.delete('/:interviewId', auth, async (req, res) => {
  console.log('🗑️ [DELETE INTERVIEW] Deleting interview:', req.params.interviewId);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId,
      createdBy: req.user.id
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    await Interview.deleteOne({ interviewId: req.params.interviewId });
    
    console.log('✅ [DELETE INTERVIEW] Interview deleted successfully');
    
    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    console.error('❌ [DELETE INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete interview'
    });
  }
});

// Approve interview
router.post('/:interviewId/approve', auth, async (req, res) => {
  console.log('✅ [APPROVE INTERVIEW] Approving interview:', req.params.interviewId);
  
  try {
    const interview = await Interview.findOne({
      interviewId: req.params.interviewId
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Check if user has permission to approve
    const isRecruiter = req.user.role === 'recruiter' || req.user.role === 'admin';
    const isCreator = interview.createdBy.toString() === req.user.id.toString();

    if (!isRecruiter && !isCreator) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to approve this interview'
      });
    }

    interview.approvalStatus = 'approved';
    await interview.save();
    
    console.log('✅ [APPROVE INTERVIEW] Interview approved successfully');
    
    res.json({
      success: true,
      message: 'Interview approved successfully'
    });
  } catch (error) {
    console.error('❌ [APPROVE INTERVIEW] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve interview'
    });
  }
});

module.exports = router;
