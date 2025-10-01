// Code Execution Service for Test Cases
class CodeExecutionService {
  constructor() {
    this.supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx', 'python'];
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
      if (language.toLowerCase() === 'python') {
        const results = await this.runPythonTests(code, testCases);
        return results;
      } else {
        const results = await this.runJavaScriptTests(code, testCases);
        return results;
      }
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

  // Run Python tests (simulated for now - in real implementation, you'd use a Python execution service)
  async runPythonTests(code, testCases) {
    return new Promise((resolve) => {
      try {
        // For now, we'll simulate Python execution by converting to JavaScript-like execution
        // In a real implementation, you'd call a Python execution service or use Pyodide
        
        const startTime = Date.now();
        const testResults = [];
        
        // Convert Python-like function calls to JavaScript for basic testing
        // This is a simplified approach - in production, use proper Python execution
        const jsCode = this.convertPythonToJavaScript(code);
        
        const wrappedCode = this.createSafeExecutionEnvironment(jsCode, testCases);
        const result = this.safeEval(wrappedCode);
        
        if (result.success) {
          resolve({
            success: true,
            output: 'Python code executed successfully!',
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

  // Convert basic Python syntax to JavaScript for testing (simplified)
  convertPythonToJavaScript(pythonCode) {
    // This is a very basic conversion - in production, use proper Python execution
    let jsCode = pythonCode
      .replace(/def\s+(\w+)\s*\(/g, 'function $1(')
      .replace(/print\s*\(/g, 'console.log(')
      .replace(/len\s*\(/g, '($1 => $1.length)(')
      .replace(/range\s*\(/g, 'Array.from({length: ')
      .replace(/\)\s*:/g, ')}, (_, i) => i)')
      .replace(/:\s*$/gm, ' {')
      .replace(/^(\s*)([^#\s][^:]*)$/gm, '$1$2;')
      .replace(/return\s+/g, 'return ')
      .replace(/if\s+/g, 'if (')
      .replace(/elif\s+/g, '} else if (')
      .replace(/else\s*:/g, '} else {')
      .replace(/for\s+(\w+)\s+in\s+/g, 'for (let $1 of ')
      .replace(/while\s+/g, 'while (')
      .replace(/and\s+/g, '&& ')
      .replace(/or\s+/g, '|| ')
      .replace(/not\s+/g, '!')
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null');
    
    // Add closing braces for Python indentation blocks
    const lines = jsCode.split('\n');
    let result = [];
    let indentLevel = 0;
    
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') {
        result.push(line);
        continue;
      }
      
      const currentIndent = line.length - line.trimStart().length;
      const prevIndent = result.length > 0 ? 
        (result[result.length - 1].length - result[result.length - 1].trimStart().length) : 0;
      
      if (currentIndent < prevIndent) {
        const closeCount = (prevIndent - currentIndent) / 4;
        for (let i = 0; i < closeCount; i++) {
          result.push('}');
        }
      }
      
      result.push(line);
    }
    
    return result.join('\n');
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
          
          // Deep equality function
          function deepEqual(a, b) {
            if (a === b) return true;
            if (a == null || b == null) return false;
            if (typeof a !== typeof b) return false;
            
            if (typeof a === 'object') {
              if (Array.isArray(a) !== Array.isArray(b)) return false;
              
              if (Array.isArray(a)) {
                if (a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) {
                  if (!deepEqual(a[i], b[i])) return false;
                }
                return true;
              }
              
              const keysA = Object.keys(a);
              const keysB = Object.keys(b);
              if (keysA.length !== keysB.length) return false;
              
              for (let key of keysA) {
                if (!keysB.includes(key)) return false;
                if (!deepEqual(a[key], b[key])) return false;
              }
              return true;
            }
            
            return false;
          }
          
          // Run test cases
          const testResults = [];
          ${testCases.map((testCase, index) => `
            try {
              // Test case ${index + 1}
              const testInput = ${JSON.stringify(testCase.input)};
              const expectedOutput = ${JSON.stringify(testCase.expected)};
              
              // Execute the function with test input
              let actualOutput;
              const functionName = ${JSON.stringify(testCase.functionName || 'solution')};
              
              if (typeof eval(functionName) === 'function') {
                actualOutput = eval(functionName)(...testInput);
              } else {
                // Try to find the main function by looking for common patterns
                const functionNames = [];
                
                // Look for function declarations
                const functionMatches = ${JSON.stringify(code)}.match(/function\\s+(\\w+)\\s*\\(/g);
                if (functionMatches) {
                  functionMatches.forEach(match => {
                    const name = match.match(/function\\s+(\\w+)\\s*\\(/)[1];
                    if (typeof eval(name) === 'function') {
                      functionNames.push(name);
                    }
                  });
                }
                
                // Look for const/let/var function assignments
                const assignmentMatches = ${JSON.stringify(code)}.match(/(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:async\\s+)?\\(/g);
                if (assignmentMatches) {
                  assignmentMatches.forEach(match => {
                    const name = match.match(/(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:async\\s+)?\\(/)[1];
                    if (typeof eval(name) === 'function') {
                      functionNames.push(name);
                    }
                  });
                }
                
                if (functionNames.length > 0) {
                  actualOutput = eval(functionNames[0])(...testInput);
                } else {
                  throw new Error('No executable function found in the code');
                }
              }
              
              // Compare results
              const passed = deepEqual(actualOutput, expectedOutput);
              
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
