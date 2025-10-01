// Code Execution Service for Test Cases
class CodeExecutionService {
  constructor() {
    this.supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx'];
  }

  // Execute code with test cases
  async executeCodeWithTests(code, testCases, language = 'javascript') {
    if (!this.supportedLanguages.includes(language.toLowerCase())) {
      return {
        success: false,
        error: `Language ${language} is not supported for execution`,
        testResults: []
      };
    }

    try {
      const results = await this.runJavaScriptTests(code, testCases);
      return results;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        testResults: []
      };
    }
  }

  // Run JavaScript/TypeScript tests
  async runJavaScriptTests(code, testCases) {
    return new Promise((resolve) => {
      try {
        // Create a safe execution environment
        const wrappedCode = this.createSafeExecutionEnvironment(code, testCases);
        
        // Execute the code
        const result = this.safeEval(wrappedCode);
        
        if (result.success) {
          resolve({
            success: true,
            output: 'Code executed successfully!',
            testResults: result.testResults || [],
            executionTime: result.executionTime || 0
          });
        } else {
          resolve({
            success: false,
            error: result.error,
            testResults: []
          });
        }
      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          testResults: []
        });
      }
    });
  }

  // Create a safe execution environment
  createSafeExecutionEnvironment(code, testCases) {
    const startTime = Date.now();
    
    return `
      (function() {
        try {
          // Capture console.log for output
          const originalConsoleLog = console.log;
          const outputs = [];
          console.log = function(...args) {
            outputs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
            originalConsoleLog.apply(console, args);
          };

          // Execute user code
          ${code}
          
          // Run test cases
          const testResults = [];
          ${testCases.map((testCase, index) => `
            try {
              // Test case ${index + 1}
              const testInput = ${JSON.stringify(testCase.input)};
              const expectedOutput = ${JSON.stringify(testCase.expected)};
              
              // Execute the function with test input
              let actualOutput;
              if (typeof ${testCase.functionName || 'solution'} === 'function') {
                actualOutput = ${testCase.functionName || 'solution'}(...testInput);
              } else {
                // Try to find the main function
                const functions = Object.getOwnPropertyNames(window).filter(name => 
                  typeof window[name] === 'function' && name !== 'console'
                );
                if (functions.length > 0) {
                  actualOutput = window[functions[0]](...testInput);
                } else {
                  throw new Error('No function found to test');
                }
              }
              
              // Compare results
              const passed = this.deepEqual(actualOutput, expectedOutput);
              
              testResults.push({
                testCase: ${index + 1},
                input: testInput,
                expected: expectedOutput,
                actual: actualOutput,
                passed: passed,
                error: null,
                description: ${JSON.stringify(testCase.description || `Test Case ${index + 1}`)}
              });
            } catch (error) {
              testResults.push({
                testCase: ${index + 1},
                input: ${JSON.stringify(testCase.input)},
                expected: ${JSON.stringify(testCase.expected)},
                actual: null,
                passed: false,
                error: error.message,
                description: ${JSON.stringify(testCase.description || `Test Case ${index + 1}`)}
              });
            }
          `).join('\n')}
          
          const executionTime = Date.now() - ${startTime};
          
          return {
            success: true,
            testResults: testResults,
            output: outputs.join('\\n'),
            executionTime: executionTime
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            testResults: []
          };
        }
      })()
    `;
  }

  // Deep equality comparison
  deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEqual(a[i], b[i])) return false;
        }
        return true;
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      for (let key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }
    
    return false;
  }

  // Safe eval function
  safeEval(code) {
    try {
      // eslint-disable-next-line no-eval
      return eval(code);
    } catch (error) {
      throw new Error(`Execution error: ${error.message}`);
    }
  }

  // Generate sample test cases for common problems
  generateSampleTestCases(problemType) {
    const sampleCases = {
      'two-sum': [
        {
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
          description: 'Basic two sum test case'
        },
        {
          input: [[3, 2, 4], 6],
          expected: [1, 2],
          description: 'Another two sum test case'
        },
        {
          input: [[3, 3], 6],
          expected: [0, 1],
          description: 'Same number test case'
        }
      ],
      'fibonacci': [
        {
          input: [0],
          expected: 0,
          description: 'Fibonacci of 0'
        },
        {
          input: [1],
          expected: 1,
          description: 'Fibonacci of 1'
        },
        {
          input: [5],
          expected: 5,
          description: 'Fibonacci of 5'
        },
        {
          input: [10],
          expected: 55,
          description: 'Fibonacci of 10'
        }
      ],
      'palindrome': [
        {
          input: ['racecar'],
          expected: true,
          description: 'Palindrome word'
        },
        {
          input: ['hello'],
          expected: false,
          description: 'Non-palindrome word'
        },
        {
          input: ['A man a plan a canal Panama'],
          expected: true,
          description: 'Palindrome with spaces'
        }
      ],
      'binary-search': [
        {
          input: [[1, 2, 3, 4, 5], 3],
          expected: 2,
          description: 'Target found in middle'
        },
        {
          input: [[1, 2, 3, 4, 5], 6],
          expected: -1,
          description: 'Target not found'
        },
        {
          input: [[1, 2, 3, 4, 5], 1],
          expected: 0,
          description: 'Target found at start'
        }
      ]
    };

    return sampleCases[problemType] || [];
  }

  // Validate test case format
  validateTestCase(testCase) {
    const required = ['input', 'expected'];
    const missing = required.filter(field => !(field in testCase));
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Format test results for display
  formatTestResults(testResults) {
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      passed,
      total,
      percentage,
      results: testResults
    };
  }
}

export default new CodeExecutionService();
