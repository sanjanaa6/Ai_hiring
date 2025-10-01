// AI Test Case Generation Service
import aiService from './aiService';

class AITestCaseService {
  constructor() {
    this.cache = new Map(); // Cache generated test cases
  }

  // Generate test cases for a coding problem using AI
  async generateTestCases(problem, language = 'javascript') {
    try {
      // Check cache first
      const cacheKey = `${problem.question}_${language}`;
      if (this.cache.has(cacheKey)) {
        console.log('📋 Using cached test cases for:', problem.question);
        return this.cache.get(cacheKey);
      }

      console.log('🤖 Generating AI test cases for:', problem.question);

      const prompt = this.createTestCasePrompt(problem, language);
      const response = await aiService.generateResponse(prompt, {
        maxTokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent test cases
        systemMessage: "You are an expert software engineer who creates comprehensive test cases for coding problems. Always respond with valid JSON only."
      });

      if (response.success && response.data) {
        const testCases = this.parseTestCases(response.data, problem);
        if (testCases.length > 0) {
          // Cache the results
          this.cache.set(cacheKey, testCases);
          console.log('✅ Generated', testCases.length, 'test cases');
          return testCases;
        }
      }

      // Fallback to basic test cases if AI generation fails
      console.log('⚠️ AI generation failed, using fallback test cases');
      return this.generateFallbackTestCases(problem, language);

    } catch (error) {
      console.error('❌ Error generating test cases:', error);
      return this.generateFallbackTestCases(problem, language);
    }
  }

  // Create prompt for AI test case generation
  createTestCasePrompt(problem, language) {
    return `Generate comprehensive test cases for this coding problem in ${language}:

PROBLEM:
${problem.question}

DESCRIPTION:
${problem.description || 'No additional description provided'}

STARTER CODE:
\`\`\`${language}
${problem.codeEditor?.starterCode || 'No starter code provided'}
\`\`\`

DIFFICULTY: ${problem.difficulty || 'Medium'}

Please generate 3-5 test cases that cover:
1. Basic functionality
2. Edge cases
3. Boundary conditions
4. Error handling (if applicable)

Return ONLY a JSON array with this exact format:
[
  {
    "input": [array of input parameters],
    "expected": expected_output_value,
    "description": "Brief description of what this test case validates",
    "functionName": "name_of_function_to_test"
  }
]

Example for a function called "twoSum":
[
  {
    "input": [[2, 7, 11, 15], 9],
    "expected": [0, 1],
    "description": "Basic two sum test case",
    "functionName": "twoSum"
  }
]

Make sure the input format matches how the function should be called and the expected output matches the return type.`;
  }

  // Parse AI response into test case format
  parseTestCases(aiResponse, problem) {
    try {
      // Clean the response to extract JSON
      let jsonStr = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to find JSON array in the response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const testCases = JSON.parse(jsonStr);
      
      if (Array.isArray(testCases)) {
        return testCases.map((testCase, index) => ({
          input: testCase.input || [],
          expected: testCase.expected,
          description: testCase.description || `Test Case ${index + 1}`,
          functionName: testCase.functionName || this.extractFunctionName(problem)
        }));
      }
    } catch (error) {
      console.error('❌ Error parsing AI test cases:', error);
    }

    return [];
  }

  // Extract function name from starter code
  extractFunctionName(problem) {
    const starterCode = problem.codeEditor?.starterCode || '';
    
    // Common patterns for function names
    const patterns = [
      /function\s+(\w+)\s*\(/,
      /const\s+(\w+)\s*=\s*\(/,
      /let\s+(\w+)\s*=\s*\(/,
      /var\s+(\w+)\s*=\s*\(/,
      /(\w+)\s*:\s*function/,
      /(\w+)\s*\(/ // Generic function call pattern
    ];

    for (const pattern of patterns) {
      const match = starterCode.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Default function names based on problem type
    if (problem.question.toLowerCase().includes('sum')) return 'twoSum';
    if (problem.question.toLowerCase().includes('fibonacci')) return 'fibonacci';
    if (problem.question.toLowerCase().includes('palindrome')) return 'isPalindrome';
    if (problem.question.toLowerCase().includes('search')) return 'binarySearch';
    if (problem.question.toLowerCase().includes('sort')) return 'mergeSort';
    
    return 'solution'; // Default fallback
  }

  // Generate fallback test cases when AI fails
  generateFallbackTestCases(problem, language) {
    const functionName = this.extractFunctionName(problem);
    
    // Basic fallback test cases based on problem type
    if (problem.question.toLowerCase().includes('sum')) {
      return [
        {
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
          description: 'Basic two sum test case',
          functionName: 'twoSum'
        },
        {
          input: [[3, 2, 4], 6],
          expected: [1, 2],
          description: 'Another two sum test case',
          functionName: 'twoSum'
        }
      ];
    }

    if (problem.question.toLowerCase().includes('fibonacci')) {
      return [
        {
          input: [5],
          expected: 5,
          description: 'Fibonacci of 5',
          functionName: 'fibonacci'
        },
        {
          input: [10],
          expected: 55,
          description: 'Fibonacci of 10',
          functionName: 'fibonacci'
        }
      ];
    }

    if (problem.question.toLowerCase().includes('palindrome')) {
      return [
        {
          input: ['racecar'],
          expected: true,
          description: 'Palindrome word',
          functionName: 'isPalindrome'
        },
        {
          input: ['hello'],
          expected: false,
          description: 'Non-palindrome word',
          functionName: 'isPalindrome'
        }
      ];
    }

    // Generic fallback
    return [
      {
        input: [1, 2, 3],
        expected: 6,
        description: 'Basic test case',
        functionName: functionName
      }
    ];
  }

  // Check if a problem needs test case generation
  needsTestCases(problem) {
    return (
      problem.type === 'coding' ||
      problem.codeEditor?.enabled ||
      problem.question?.toLowerCase().includes('code') ||
      problem.question?.toLowerCase().includes('function') ||
      problem.question?.toLowerCase().includes('algorithm')
    );
  }

  // Check if an interview is for developers
  isDeveloperInterview(interviewData) {
    if (!interviewData) return false;

    const developerKeywords = [
      'developer', 'programmer', 'engineer', 'coding', 'programming',
      'software', 'frontend', 'backend', 'fullstack', 'full-stack',
      'javascript', 'python', 'java', 'react', 'node', 'web',
      'technical', 'algorithm', 'data structure', 'api', 'database'
    ];

    const title = (interviewData.title || '').toLowerCase();
    const position = (interviewData.position || '').toLowerCase();
    const description = (interviewData.description || '').toLowerCase();
    const skills = (interviewData.skills || []).join(' ').toLowerCase();

    const searchText = `${title} ${position} ${description} ${skills}`;

    return developerKeywords.some(keyword => searchText.includes(keyword));
  }

  // Check if a round is a coding round
  isCodingRound(round) {
    if (!round) return false;

    const codingKeywords = [
      'coding', 'programming', 'technical', 'algorithm', 'data structure',
      'code', 'program', 'develop', 'software', 'javascript', 'python',
      'java', 'react', 'node', 'api', 'database'
    ];

    const title = (round.title || '').toLowerCase();
    const description = (round.description || '').toLowerCase();
    const searchText = `${title} ${description}`;

    return codingKeywords.some(keyword => searchText.includes(keyword));
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

export default new AITestCaseService();
