import apiService from './apiService';

class DynamicInterviewService {
  constructor() {
    this.baseURL = '/api/interviews';
  }

  // Detect programming language from job description
  detectProgrammingLanguage(jobDescription) {
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
        { keywords: ['vanilla js', 'es6', 'es2015'], weight: 2 }
      ]},
      
      // Java patterns
      { language: 'java', patterns: [
        { keywords: ['java', 'spring', 'spring boot', 'hibernate', 'maven', 'gradle'], weight: 3 },
        { keywords: ['jvm', 'enterprise', 'microservices'], weight: 2 }
      ]},
      
      // C# patterns
      { language: 'csharp', patterns: [
        { keywords: ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'entity framework'], weight: 3 },
        { keywords: ['xamarin', 'azure', 'microsoft'], weight: 2 }
      ]},
      
      // C++ patterns
      { language: 'cpp', patterns: [
        { keywords: ['c++', 'cpp', 'c plus plus', 'qt', 'boost'], weight: 3 },
        { keywords: ['embedded', 'system programming', 'performance'], weight: 2 }
      ]}
    ];

    const languageScores = {};

    // Calculate weighted scores for each language
    languagePatterns.forEach(({ language, patterns }) => {
      languageScores[language] = 0;
      patterns.forEach(({ keywords, weight }) => {
        keywords.forEach(keyword => {
          if (description.includes(keyword)) {
            languageScores[language] += weight;
          }
        });
      });
    });

    // Find the language with highest score
    const topLanguage = Object.keys(languageScores).reduce((a, b) => 
      languageScores[a] > languageScores[b] ? a : b
    );

    console.log('🔍 Frontend Language Detection Results:', {
      description: description.substring(0, 100) + '...',
      scores: languageScores,
      detected: topLanguage,
      score: languageScores[topLanguage]
    });

    // Return the top language if it has a score > 0, otherwise default to javascript
    return languageScores[topLanguage] > 0 ? topLanguage : 'javascript';
  }

  // Get role-specific interview configuration
  getRoleSpecificConfig(jobTitle, detectedLanguage) {
    const roleConfigs = {
      // React/JSX specific roles (highest priority)
      'react developer': {
        language: 'jsx',
        frameworks: ['React', 'Next.js', 'Gatsby', 'React Router', 'Redux'],
        tools: ['npm', 'yarn', 'webpack', 'babel', 'jest', 'react-testing-library'],
        concepts: ['JSX', 'Components', 'Props', 'State', 'Hooks', 'Virtual DOM'],
        starterCode: 'import React from \'react\';\n\nconst Solution = () => {\n    // Write your React component here\n    return (\n        <div>\n            {/* Your JSX here */}\n        </div>\n    );\n};\n\nexport default Solution;',
        testFramework: 'jest'
      },
      'frontend developer': {
        language: 'jsx',
        frameworks: ['React', 'Vue', 'Angular', 'Svelte'],
        tools: ['npm', 'yarn', 'webpack', 'babel', 'jest', 'cypress'],
        concepts: ['JSX', 'Components', 'Props', 'State', 'Hooks', 'Virtual DOM'],
        starterCode: 'import React from \'react\';\n\nconst Solution = () => {\n    // Write your React component here\n    return (\n        <div>\n            {/* Your JSX here */}\n        </div>\n    );\n};\n\nexport default Solution;',
        testFramework: 'jest'
      },
      // TypeScript specific roles
      'typescript developer': {
        language: 'typescript',
        frameworks: ['React', 'Angular', 'Node.js', 'Express'],
        tools: ['npm', 'yarn', 'tsc', 'jest', 'eslint'],
        concepts: ['Types', 'Interfaces', 'Generics', 'Enums', 'Decorators'],
        starterCode: 'interface SolutionProps {\n    // Define your props interface here\n}\n\nconst Solution: React.FC<SolutionProps> = () => {\n    // Write your TypeScript component here\n    return (\n        <div>\n            {/* Your JSX here */}\n        </div>\n    );\n};\n\nexport default Solution;',
        testFramework: 'jest'
      },
      // Python developer roles
      'python developer': {
        language: 'python',
        frameworks: ['Django', 'Flask', 'FastAPI'],
        tools: ['pip', 'virtualenv', 'pytest', 'pandas', 'numpy'],
        concepts: ['OOP', 'async programming', 'data structures', 'algorithms'],
        starterCode: 'def solution():\n    # Write your code here\n    pass',
        testFramework: 'pytest'
      },
      // JavaScript developer roles (non-React)
      'javascript developer': {
        language: 'javascript',
        frameworks: ['Node.js', 'Express', 'Vue', 'Angular'],
        tools: ['npm', 'yarn', 'webpack', 'babel', 'jest'],
        concepts: ['ES6+', 'async/await', 'closures', 'prototypes', 'DOM manipulation'],
        starterCode: 'function solution() {\n    // Write your code here\n    return null;\n}',
        testFramework: 'jest'
      },
      'java developer': {
        language: 'java',
        frameworks: ['Spring Boot', 'Hibernate', 'Maven', 'Gradle'],
        tools: ['IntelliJ', 'Eclipse', 'Maven', 'Gradle', 'JUnit'],
        concepts: ['OOP', 'Collections', 'Streams', 'Spring Framework', 'JVM'],
        starterCode: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
        testFramework: 'junit'
      },
      'c# developer': {
        language: 'csharp',
        frameworks: ['.NET', 'ASP.NET', 'Entity Framework', 'Xamarin'],
        tools: ['Visual Studio', 'NuGet', 'MSBuild', 'NUnit'],
        concepts: ['LINQ', 'async/await', 'delegates', 'generics', 'reflection'],
        starterCode: 'using System;\n\nclass Program {\n    static void Main() {\n        // Write your code here\n    }\n}',
        testFramework: 'nunit'
      },
      'c++ developer': {
        language: 'cpp',
        frameworks: ['Qt', 'Boost', 'STL'],
        tools: ['CMake', 'GCC', 'Clang', 'Visual Studio'],
        concepts: ['Memory management', 'pointers', 'templates', 'STL', 'RAII'],
        starterCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
        testFramework: 'gtest'
      },
      'php developer': {
        language: 'php',
        frameworks: ['Laravel', 'Symfony', 'CodeIgniter', 'WordPress'],
        tools: ['Composer', 'PHPUnit', 'Xdebug', 'Apache/Nginx'],
        concepts: ['OOP', 'namespaces', 'composer', 'PDO', 'MVC'],
        starterCode: '<?php\n// Write your code here\n?>',
        testFramework: 'phpunit'
      },
      'ruby developer': {
        language: 'ruby',
        frameworks: ['Ruby on Rails', 'Sinatra', 'RSpec'],
        tools: ['Bundler', 'Rake', 'Capistrano', 'Puma'],
        concepts: ['Metaprogramming', 'blocks', 'modules', 'gems', 'MVC'],
        starterCode: '# Write your code here',
        testFramework: 'rspec'
      },
      'go developer': {
        language: 'go',
        frameworks: ['Gin', 'Echo', 'Fiber', 'GORM'],
        tools: ['Go modules', 'Docker', 'Kubernetes', 'gRPC'],
        concepts: ['Goroutines', 'channels', 'interfaces', 'pointers', 'concurrency'],
        starterCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n}',
        testFramework: 'testing'
      },
      'rust developer': {
        language: 'rust',
        frameworks: ['Tokio', 'Actix', 'Rocket', 'Serde'],
        tools: ['Cargo', 'Clippy', 'Rustfmt', 'Cargo test'],
        concepts: ['Ownership', 'borrowing', 'lifetimes', 'traits', 'macros'],
        starterCode: 'fn main() {\n    // Write your code here\n}',
        testFramework: 'cargo test'
      },
      'swift developer': {
        language: 'swift',
        frameworks: ['UIKit', 'SwiftUI', 'Combine', 'Core Data'],
        tools: ['Xcode', 'Swift Package Manager', 'CocoaPods'],
        concepts: ['Optionals', 'protocols', 'closures', 'ARC', 'async/await'],
        starterCode: 'import Foundation\n\n// Write your code here',
        testFramework: 'xctest'
      },
      'kotlin developer': {
        language: 'kotlin',
        frameworks: ['Android SDK', 'Jetpack Compose', 'Ktor', 'Spring Boot'],
        tools: ['Android Studio', 'Gradle', 'Kotlin Multiplatform'],
        concepts: ['Null safety', 'coroutines', 'data classes', 'extensions', 'DSL'],
        starterCode: 'fun main() {\n    // Write your code here\n}',
        testFramework: 'junit'
      },
      'scala developer': {
        language: 'scala',
        frameworks: ['Akka', 'Play Framework', 'Spark', 'Cats'],
        tools: ['SBT', 'ScalaTest', 'IntelliJ IDEA'],
        concepts: ['Functional programming', 'case classes', 'pattern matching', 'implicits', 'futures'],
        starterCode: 'object Solution {\n    def main(args: Array[String]): Unit = {\n        // Write your code here\n    }\n}',
        testFramework: 'scalatest'
      }
    };

    // Try to find exact match first
    const exactMatch = roleConfigs[jobTitle.toLowerCase()];
    if (exactMatch) {
      return exactMatch;
    }

    // Try to find partial match based on detected language
    const languageBasedMatch = Object.keys(roleConfigs).find(role => 
      roleConfigs[role].language === detectedLanguage
    );

    if (languageBasedMatch) {
      return roleConfigs[languageBasedMatch];
    }

    // Default configuration
    return {
      language: detectedLanguage,
      frameworks: ['Framework-specific'],
      tools: ['Language-specific tools'],
      concepts: ['Core programming concepts'],
      starterCode: this.getDefaultStarterCode(detectedLanguage),
      testFramework: 'default'
    };
  }

  getDefaultStarterCode(language) {
    const defaultTemplates = {
      jsx: 'import React from \'react\';\n\nconst Solution = () => {\n    // Write your React component here\n    return (\n        <div>\n            {/* Your JSX here */}\n        </div>\n    );\n};\n\nexport default Solution;',
      typescript: 'interface SolutionProps {\n    // Define your props interface here\n}\n\nconst Solution: React.FC<SolutionProps> = () => {\n    // Write your TypeScript component here\n    return (\n        <div>\n            {/* Your JSX here */}\n        </div>\n    );\n};\n\nexport default Solution;',
      python: 'def solution():\n    # Write your code here\n    pass',
      javascript: 'function solution() {\n    // Write your code here\n    return null;\n}',
      java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
      csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        // Write your code here\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      php: '<?php\n// Write your code here\n?>',
      ruby: '# Write your code here',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n}',
      rust: 'fn main() {\n    // Write your code here\n}',
      swift: 'import Foundation\n\n// Write your code here',
      kotlin: 'fun main() {\n    // Write your code here\n}',
      scala: 'object Solution {\n    def main(args: Array[String]): Unit = {\n        // Write your code here\n    }\n}'
    };

    return defaultTemplates[language] || defaultTemplates.javascript;
  }

  // Generate dynamic interview prompt
  generateDynamicInterviewPrompt(jobDetails, roleConfig) {
    const { title, description, requirements, level, duration } = jobDetails;
    const { language, frameworks, tools, concepts, starterCode } = roleConfig;

    // Simple, direct prompt that focuses on the job description
    const simplePrompt = `Create a technical interview for a ${title} position.

Job Description: "${description}"
Programming Language: ${language.toUpperCase()}
Frameworks: ${frameworks.join(', ')}
Tools: ${tools.join(', ')}

Generate 6 rounds with 5 questions each. Round 4 MUST be coding challenges only.

Return valid JSON with this exact structure:
{
  "interviewId": "interview_${Date.now()}",
  "title": "AI ${language.toUpperCase()} Interview - ${title}",
  "totalDuration": ${duration},
  "language": "${language}",
  "languageLocked": true,
  "rounds": [
    {
      "roundId": "round_1",
      "roundNumber": 1,
      "title": "Introduction & Background",
      "description": "Get to know the candidate",
      "duration": 15,
      "questions": [
        {
          "id": "q1_1",
          "type": "behavioral",
          "question": "Tell me about yourself and your ${language} experience.",
          "expectedAnswer": "Look for relevant experience and technical background",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": []
        }
      ]
    },
    {
      "roundId": "round_2",
      "roundNumber": 2,
      "title": "${language.toUpperCase()} Fundamentals",
      "description": "Test ${language} core concepts",
      "duration": 20,
      "questions": [
        {
          "id": "q2_1",
          "type": "technical",
          "question": "Explain ${language} concepts relevant to this role.",
          "expectedAnswer": "Look for understanding of ${language} fundamentals",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": []
        }
      ]
    },
    {
      "roundId": "round_3",
      "roundNumber": 3,
      "title": "Framework & Technology Stack",
      "description": "Assess framework knowledge",
      "duration": 20,
      "questions": [
        {
          "id": "q3_1",
          "type": "technical",
          "question": "How would you use ${frameworks[0]} in this role?",
          "expectedAnswer": "Look for practical framework knowledge",
          "timeLimit": 4,
          "difficulty": "medium",
          "followUpQuestions": []
        }
      ]
    },
    {
      "roundId": "round_4",
      "roundNumber": 4,
      "title": "CODING CHALLENGES",
      "description": "Hands-on coding assessment",
      "duration": 30,
      "questions": [
        {
          "id": "q4_1",
          "type": "coding-challenge",
          "question": "Write a ${language} function to solve a problem relevant to this role.",
          "expectedAnswer": "Look for correct ${language} syntax and problem-solving",
          "timeLimit": 6,
          "difficulty": "medium",
          "followUpQuestions": ["Can you optimize this?", "How would you test this?"],
          "codeEditor": {
            "enabled": true,
            "language": "${language}",
            "languageLocked": true,
            "starterCode": "${starterCode}",
            "testCases": [{"input": "test", "expected": "result"}]
          }
        }
      ]
    },
    {
      "roundId": "round_5",
      "roundNumber": 5,
      "title": "Advanced ${language.toUpperCase()} Concepts",
      "description": "Deep dive into advanced topics",
      "duration": 20,
      "questions": [
        {
          "id": "q5_1",
          "type": "technical",
          "question": "How would you optimize ${language} applications?",
          "expectedAnswer": "Look for optimization knowledge",
          "timeLimit": 4,
          "difficulty": "hard",
          "followUpQuestions": []
        }
      ]
    },
    {
      "roundId": "round_6",
      "roundNumber": 6,
      "title": "Industry Knowledge & Soft Skills",
      "description": "Assess industry knowledge",
      "duration": 15,
      "questions": [
        {
          "id": "q6_1",
          "type": "behavioral",
          "question": "How do you stay updated with ${language} trends?",
          "expectedAnswer": "Look for continuous learning",
          "timeLimit": 3,
          "difficulty": "easy",
          "followUpQuestions": []
        }
      ]
    }
  ]
}

IMPORTANT: Round 4 title must be exactly "CODING CHALLENGES" and contain only coding-challenge type questions.`;

    return simplePrompt;
  }

  // Generate dynamic interview
  async generateDynamicInterview(jobPrompt) {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🚀 [FRONTEND] Calling /generate-dynamic endpoint with prompt:', jobPrompt.substring(0, 100) + '...');

      // Call the dynamic interview generation API - let backend handle everything
      const response = await apiService.generateDynamicInterview({
        prompt: jobPrompt
      });

      if (response.data.success) {
        console.log('✅ [FRONTEND] Interview generated successfully');
        console.log('🔍 [FRONTEND] Interview data:', response.data.data);
        console.log('🔍 [FRONTEND] Round 4 title:', response.data.data.rounds[3].title);
        console.log('🔍 [FRONTEND] Round 4 questions count:', response.data.data.rounds[3].questions.length);
        console.log('🔍 [FRONTEND] All round titles:', response.data.data.rounds.map(r => r.title));
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to generate interview');
      }
    } catch (error) {
      console.error('Dynamic interview generation error:', error);
      throw error;
    }
  }

  // Extract job details (you can integrate this with your existing job extraction)
  async extractJobDetails(jobPrompt) {
    // For now, return a basic structure. You can enhance this by calling your existing job extraction API
    return {
      title: this.extractJobTitle(jobPrompt),
      description: jobPrompt,
      requirements: this.extractRequirements(jobPrompt),
      level: this.extractLevel(jobPrompt),
      duration: 90 // Default duration
    };
  }

  extractJobTitle(jobPrompt) {
    // Simple extraction - you can enhance this
    const titleMatch = jobPrompt.match(/(?:hiring|looking for|need|seeking)\s+([^,]+)/i);
    return titleMatch ? titleMatch[1].trim() : 'Software Developer';
  }

  extractRequirements(jobPrompt) {
    // Simple extraction - you can enhance this
    return jobPrompt;
  }

  extractLevel(jobPrompt) {
    const levelKeywords = {
      senior: ['senior', 'lead', 'principal', 'architect'],
      mid: ['mid', 'intermediate', 'experienced'],
      junior: ['junior', 'entry', 'graduate', 'trainee']
    };

    const prompt = jobPrompt.toLowerCase();
    for (const [level, keywords] of Object.entries(levelKeywords)) {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        return level;
      }
    }
    return 'mid'; // Default level
  }
}

export default new DynamicInterviewService();
