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

// AI-powered language detection endpoint
router.post('/detect-language', auth, async (req, res) => {
  console.log('🤖 [AI LANGUAGE DETECTION] Processing request...');
  
  try {
    const { jobDescription, jobTitle, context } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'Job description is required'
      });
    }

    // Create AI prompt for language detection
    const aiPrompt = `
You are an expert technical recruiter and programming language specialist. Your task is to analyze a job description and determine the most appropriate programming language for a coding interview.

Job Title: ${jobTitle || 'Not specified'}
Job Description: ${jobDescription}

Context: ${context || 'coding_interview'}

Based on the job description, determine the most suitable programming language for the coding interview. Consider:

1. **Primary Technology Stack**: What languages/frameworks are explicitly mentioned?
2. **Job Role Type**: Frontend, Backend, Full-stack, Data Science, Mobile, etc.
3. **Industry Context**: What type of applications will they be building?
4. **Skill Requirements**: What programming concepts are emphasized?

Available languages and their typical use cases:
- **JavaScript**: Web development, full-stack, Node.js, general web apps
- **Python**: Data science, machine learning, backend APIs, automation, scripting
- **Java**: Enterprise applications, backend services, Android development
- **C#**: .NET development, enterprise applications, Windows development
- **C++**: System programming, performance-critical applications, game development
- **Go**: Modern backend development, microservices, cloud-native applications
- **PHP**: Web development, content management systems, rapid web apps
- **Ruby**: Web development, rapid prototyping, startup environments
- **Swift**: iOS development, Apple ecosystem, mobile apps
- **Kotlin**: Android development, modern mobile apps, Google ecosystem
- **Rust**: System programming, performance and safety, modern systems
- **Scala**: Functional programming, big data, distributed systems
- **TypeScript**: Type-safe JavaScript, large-scale applications, enterprise
- **JSX/React**: Frontend development, component-based UIs, modern web apps

Respond with a JSON object containing:
{
  "language": "the_most_suitable_language",
  "confidence": 85,
  "reasoning": "Brief explanation of why this language was chosen",
  "alternatives": [
    {"language": "alternative1", "confidence": 70, "reason": "Why this is also suitable"},
    {"language": "alternative2", "confidence": 60, "reason": "Why this could work"}
  ],
  "context": "Additional context about the choice"
}

Be precise and consider the specific requirements mentioned in the job description.`;

    // Try AI detection first
    let aiResult = null;
    try {
      const response = await axios.post(OPENROUTER_API_URL, {
        model: PRIMARY_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical recruiter specializing in programming language selection for coding interviews. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
          'X-Title': 'AI Hiring Platform'
        }
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        const aiResponse = response.data.choices[0].message.content;
        console.log('🤖 [AI LANGUAGE DETECTION] AI Response:', aiResponse);
        
        try {
          // Try to parse JSON response
          const parsedResponse = JSON.parse(aiResponse);
          aiResult = {
            language: parsedResponse.language || 'javascript',
            confidence: parsedResponse.confidence || 80,
            reasoning: parsedResponse.reasoning || 'AI determined this is the most suitable language',
            alternatives: parsedResponse.alternatives || [],
            context: parsedResponse.context || 'AI analysis'
          };
        } catch (parseError) {
          console.log('⚠️ [AI LANGUAGE DETECTION] Failed to parse AI response, using fallback');
        }
      }
    } catch (aiError) {
      console.log('⚠️ [AI LANGUAGE DETECTION] AI detection failed, using fallback:', aiError.message);
    }

    // Fallback to local detection if AI fails
    if (!aiResult) {
      console.log('🔄 [AI LANGUAGE DETECTION] Using local detection fallback');
      aiResult = localLanguageDetection(jobDescription, jobTitle);
    }

    console.log('✅ [AI LANGUAGE DETECTION] Final result:', aiResult);

    res.json({
      success: true,
      data: aiResult
    });

  } catch (error) {
    console.error('❌ [AI LANGUAGE DETECTION] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect programming language'
    });
  }
});

// Enhanced local language detection (fallback)
function localLanguageDetection(jobDescription, jobTitle = '') {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();
  
  const languagePatterns = [
    // Python (highest priority for data science, ML, backend)
    {
      language: 'python',
      patterns: [
        { keywords: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'celery', 'py'], weight: 4 },
        { keywords: ['data science', 'machine learning', 'ai', 'ml', 'data analysis', 'jupyter', 'anaconda'], weight: 3 },
        { keywords: ['backend', 'api', 'server', 'microservices'], weight: 2 },
        { keywords: ['automation', 'scripting', 'devops'], weight: 1 }
      ]
    },
    
    // React/JSX (frontend development)
    {
      language: 'jsx',
      patterns: [
        { keywords: ['react', 'jsx', 'tsx', 'react.js', 'reactjs', 'next.js', 'nextjs', 'gatsby', 'remix'], weight: 4 },
        { keywords: ['frontend', 'component', 'hooks', 'redux', 'zustand', 'context'], weight: 3 },
        { keywords: ['ui', 'user interface', 'web app', 'spa', 'single page'], weight: 2 }
      ]
    },
    
    // TypeScript (type-safe development)
    {
      language: 'typescript',
      patterns: [
        { keywords: ['typescript', 'ts', 'angular', 'nestjs', 'deno'], weight: 4 },
        { keywords: ['type safety', 'interface', 'generic', 'enum'], weight: 3 },
        { keywords: ['enterprise', 'large scale', 'maintainable'], weight: 2 }
      ]
    },
    
    // JavaScript (general web development)
    {
      language: 'javascript',
      patterns: [
        { keywords: ['javascript', 'js', 'node.js', 'nodejs', 'express', 'vue', 'vue.js', 'vuejs', 'nuxt'], weight: 4 },
        { keywords: ['vanilla js', 'es6', 'es2015', 'es2020', 'webpack', 'babel'], weight: 3 },
        { keywords: ['frontend', 'backend', 'fullstack', 'web development'], weight: 2 }
      ]
    },
    
    // Java (enterprise development)
    {
      language: 'java',
      patterns: [
        { keywords: ['java', 'spring', 'spring boot', 'hibernate', 'maven', 'gradle', 'jpa'], weight: 4 },
        { keywords: ['jvm', 'enterprise', 'microservices', 'rest api'], weight: 3 },
        { keywords: ['oop', 'object oriented', 'design patterns'], weight: 2 }
      ]
    },
    
    // C# (.NET development)
    {
      language: 'csharp',
      patterns: [
        { keywords: ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'entity framework', 'blazor'], weight: 4 },
        { keywords: ['xamarin', 'azure', 'microsoft', 'visual studio'], weight: 3 },
        { keywords: ['enterprise', 'windows', 'desktop'], weight: 2 }
      ]
    },
    
    // C++ (system programming)
    {
      language: 'cpp',
      patterns: [
        { keywords: ['c++', 'cpp', 'c plus plus', 'qt', 'boost', 'cmake'], weight: 4 },
        { keywords: ['system programming', 'performance', 'embedded', 'game development'], weight: 3 },
        { keywords: ['memory management', 'low level', 'optimization'], weight: 2 }
      ]
    },
    
    // Go (modern backend)
    {
      language: 'go',
      patterns: [
        { keywords: ['go', 'golang', 'gin', 'echo', 'gorilla', 'fiber'], weight: 4 },
        { keywords: ['microservices', 'backend', 'api', 'concurrent'], weight: 3 },
        { keywords: ['cloud native', 'docker', 'kubernetes'], weight: 2 }
      ]
    },
    
    // PHP (web development)
    {
      language: 'php',
      patterns: [
        { keywords: ['php', 'laravel', 'symfony', 'codeigniter', 'wordpress', 'drupal'], weight: 4 },
        { keywords: ['web development', 'backend', 'cms'], weight: 3 },
        { keywords: ['server side', 'dynamic'], weight: 2 }
      ]
    },
    
    // Ruby (web development)
    {
      language: 'ruby',
      patterns: [
        { keywords: ['ruby', 'rails', 'ruby on rails', 'sinatra', 'hanami'], weight: 4 },
        { keywords: ['web development', 'backend', 'mvc'], weight: 3 },
        { keywords: ['startup', 'rapid development'], weight: 2 }
      ]
    },
    
    // Swift (iOS development)
    {
      language: 'swift',
      patterns: [
        { keywords: ['swift', 'ios', 'xcode', 'cocoa', 'swiftui', 'uikit'], weight: 4 },
        { keywords: ['mobile development', 'apple', 'iphone', 'ipad'], weight: 3 },
        { keywords: ['app store', 'mobile app'], weight: 2 }
      ]
    },
    
    // Kotlin (Android development)
    {
      language: 'kotlin',
      patterns: [
        { keywords: ['kotlin', 'android', 'jetpack', 'compose', 'coroutines'], weight: 4 },
        { keywords: ['mobile development', 'android development', 'google'], weight: 3 },
        { keywords: ['play store', 'mobile app'], weight: 2 }
      ]
    },
    
    // Rust (system programming)
    {
      language: 'rust',
      patterns: [
        { keywords: ['rust', 'cargo', 'tokio', 'actix', 'serde'], weight: 4 },
        { keywords: ['system programming', 'performance', 'memory safety'], weight: 3 },
        { keywords: ['webassembly', 'blockchain'], weight: 2 }
      ]
    },
    
    // Scala (functional programming)
    {
      language: 'scala',
      patterns: [
        { keywords: ['scala', 'akka', 'play', 'spark', 'sbt'], weight: 4 },
        { keywords: ['functional programming', 'big data', 'distributed'], weight: 3 },
        { keywords: ['jvm', 'enterprise'], weight: 2 }
      ]
    }
  ];
  
  let bestMatch = { language: 'javascript', score: 0 };
  let allScores = [];
  
  for (const { language, patterns } of languagePatterns) {
    let score = 0;
    for (const { keywords, weight } of patterns) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += weight;
        }
      }
    }
    
    allScores.push({ language, score });
    
    if (score > bestMatch.score) {
      bestMatch = { language, score };
    }
  }
  
  // Calculate confidence based on score difference
  const sortedScores = allScores.sort((a, b) => b.score - a.score);
  const topScore = sortedScores[0]?.score || 0;
  const secondScore = sortedScores[1]?.score || 0;
  
  let confidence = 0;
  if (topScore > 0) {
    confidence = Math.min(95, Math.max(60, (topScore / (topScore + secondScore + 1)) * 100));
  }
  
  return {
    language: bestMatch.language,
    confidence: Math.round(confidence),
    reasoning: generateReasoning(bestMatch.language, text, bestMatch.score),
    alternatives: sortedScores.slice(1, 4).map(s => ({
      language: s.language,
      confidence: Math.round((s.score / (topScore + 1)) * 100),
      reason: `Score: ${s.score}`
    })),
    context: 'Local pattern matching analysis'
  };
}

function generateReasoning(language, text, score) {
  const reasons = {
    python: 'Python is perfect for data science, machine learning, and backend development roles',
    jsx: 'React is the most popular frontend framework for modern web applications',
    typescript: 'TypeScript provides excellent type safety for large-scale applications',
    javascript: 'JavaScript is the universal language of the web, perfect for full-stack development',
    java: 'Java is excellent for enterprise applications and backend services',
    csharp: 'C# is perfect for .NET development and Microsoft ecosystem applications',
    cpp: 'C++ is ideal for system programming and performance-critical applications',
    go: 'Go is perfect for modern backend development and microservices',
    php: 'PHP is excellent for web development and content management systems',
    ruby: 'Ruby is perfect for rapid web development and startup environments',
    swift: 'Swift is the ideal language for iOS development and Apple ecosystem',
    kotlin: 'Kotlin is perfect for Android development and modern mobile apps',
    rust: 'Rust is excellent for system programming with memory safety',
    scala: 'Scala is perfect for functional programming and big data processing'
  };
  
  return reasons[language] || 'This language is well-suited for the role requirements';
}

module.exports = router;
