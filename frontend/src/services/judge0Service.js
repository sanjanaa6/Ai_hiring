// Judge0 Code Execution Service
class Judge0Service {
  constructor() {
    // Use backend proxy instead of direct connection to avoid mixed content issues
    const apiBaseUrl = process.env.REACT_APP_API_URL || 
                      (window.location.hostname.includes('eval8.ai') 
                        ? 'https://aihire.eval8.xyz/api' 
                        : 'http://localhost:5000/api');
    this.baseURL = `${apiBaseUrl}/judge0`;
    this.supportedLanguages = {
      // Popular languages for interviews
      'javascript': { id: 63, name: 'JavaScript (Node.js 12.14.0)', extension: 'js' },
      'typescript': { id: 74, name: 'TypeScript (3.7.4)', extension: 'ts' },
      'python': { id: 71, name: 'Python (3.8.1)', extension: 'py' },
      'java': { id: 62, name: 'Java (OpenJDK 13.0.1)', extension: 'java' },
      'cpp': { id: 54, name: 'C++ (GCC 9.2.0)', extension: 'cpp' },
      'c': { id: 50, name: 'C (GCC 9.2.0)', extension: 'c' },
      'csharp': { id: 51, name: 'C# (Mono 6.6.0.161)', extension: 'cs' },
      'go': { id: 60, name: 'Go (1.13.5)', extension: 'go' },
      'rust': { id: 73, name: 'Rust (1.40.0)', extension: 'rs' },
      'php': { id: 68, name: 'PHP (7.4.1)', extension: 'php' },
      'ruby': { id: 72, name: 'Ruby (2.7.0)', extension: 'rb' },
      'swift': { id: 83, name: 'Swift (5.2.3)', extension: 'swift' },
      'kotlin': { id: 78, name: 'Kotlin (1.3.70)', extension: 'kt' },
      'scala': { id: 81, name: 'Scala (2.13.1)', extension: 'scala' },
      'r': { id: 80, name: 'R (4.0.0)', extension: 'r' },
      'sql': { id: 82, name: 'SQL (SQLite 3.27.2)', extension: 'sql' },
      'bash': { id: 46, name: 'Bash (5.0.0)', extension: 'sh' },
      'powershell': { id: 70, name: 'PowerShell (6.2.3)', extension: 'ps1' }
    };
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Get language ID by name
  getLanguageId(languageName) {
    const lang = this.supportedLanguages[languageName.toLowerCase()];
    return lang ? lang.id : null;
  }

  // Get language info by name
  getLanguageInfo(languageName) {
    return this.supportedLanguages[languageName.toLowerCase()] || null;
  }

  // Submit code for execution
  async submitCode(code, language, input = '', expectedOutput = '') {
    try {
      console.log('🚀 [JUDGE0] Submitting code for execution...');
      console.log('🔍 [JUDGE0] Language:', language);
      console.log('🔍 [JUDGE0] Code length:', code.length);

      const languageId = this.getLanguageId(language);
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const submissionData = {
        source_code: code,
        language_id: languageId,
        stdin: input,
        expected_output: expectedOutput,
        cpu_time_limit: '5.0',
        memory_limit: 128000,
        wall_time_limit: '10.0'
      };

      const url = `${this.baseURL}/submissions`;
      console.log('📤 [JUDGE0] Sending submission to:', url);
      console.log('📤 [JUDGE0] Base URL:', this.baseURL);
      
      // Get auth token for backend proxy
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`Judge0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [JUDGE0] Submission created:', result.token);

      return {
        success: true,
        token: result.token,
        message: 'Code submitted successfully'
      };

    } catch (error) {
      console.error('❌ [JUDGE0] Submit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get execution result
  async getResult(token) {
    try {
      const url = `${this.baseURL}/submissions/${token}`;
      console.log('🔍 [JUDGE0] Getting result from:', url);

      // Get auth token for backend proxy
      const authToken = localStorage.getItem('token');
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Judge0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 [JUDGE0] Result received:', result);

      return {
        success: true,
        data: this.formatResult(result)
      };

    } catch (error) {
      console.error('❌ [JUDGE0] Get result error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute code and wait for result
  async executeCode(code, language, input = '', expectedOutput = '') {
    try {
      console.log('🚀 [JUDGE0] Executing code...');

      // Submit code
      const submitResult = await this.submitCode(code, language, input, expectedOutput);
      if (!submitResult.success) {
        return submitResult;
      }

      // Poll for result
      const token = submitResult.token;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const result = await this.getResult(token);
        if (!result.success) {
          return result;
        }

        const status = result.data.status;
        console.log(`🔄 [JUDGE0] Status: ${status.description} (${status.id})`);

        // Check if execution is complete
        if (status.id <= 2) { // 1: In Queue, 2: Processing
          attempts++;
          continue;
        }

        // Execution completed
        return {
          success: true,
          data: result.data
        };
      }

      // Timeout
      return {
        success: false,
        error: 'Execution timeout - code took too long to execute'
      };

    } catch (error) {
      console.error('❌ [JUDGE0] Execute error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Format Judge0 result
  formatResult(result) {
    const status = this.getStatusDescription(result.status?.id);
    
    return {
      status: {
        id: result.status?.id,
        description: status.description,
        isAccepted: status.isAccepted,
        isError: status.isError
      },
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      message: result.message || '',
      time: result.time || '0',
      memory: result.memory || '0',
      expected_output: result.expected_output || '',
      actual_output: result.stdout || '',
      passed: result.status?.id === 3 && 
               result.expected_output && 
               result.stdout?.trim() === result.expected_output?.trim()
    };
  }

  // Get status description
  getStatusDescription(statusId) {
    const statuses = {
      1: { description: 'In Queue', isAccepted: false, isError: false },
      2: { description: 'Processing', isAccepted: false, isError: false },
      3: { description: 'Accepted', isAccepted: true, isError: false },
      4: { description: 'Wrong Answer', isAccepted: false, isError: true },
      5: { description: 'Time Limit Exceeded', isAccepted: false, isError: true },
      6: { description: 'Compilation Error', isAccepted: false, isError: true },
      7: { description: 'Runtime Error (SIGSEGV)', isAccepted: false, isError: true },
      8: { description: 'Runtime Error (SIGXFSZ)', isAccepted: false, isError: true },
      9: { description: 'Runtime Error (SIGFPE)', isAccepted: false, isError: true },
      10: { description: 'Runtime Error (SIGABRT)', isAccepted: false, isError: true },
      11: { description: 'Runtime Error (NZEC)', isAccepted: false, isError: true },
      12: { description: 'Runtime Error (Other)', isAccepted: false, isError: true },
      13: { description: 'Internal Error', isAccepted: false, isError: true },
      14: { description: 'Exec Format Error', isAccepted: false, isError: true }
    };

    return statuses[statusId] || { description: 'Unknown', isAccepted: false, isError: true };
  }

  // Run test cases
  async runTestCases(code, language, testCases) {
    try {
      console.log('🧪 [JUDGE0] Running test cases...');
      console.log('🔍 [JUDGE0] Test cases count:', testCases.length);
      console.log('🔍 [JUDGE0] Test cases data:', testCases);
      console.log('🔍 [JUDGE0] Code:', code);
      console.log('🔍 [JUDGE0] Language:', language);

      const results = [];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`🧪 [JUDGE0] Running test case ${i + 1}/${testCases.length}`);
        console.log(`🔍 [JUDGE0] Test case ${i + 1} data:`, testCase);

        const result = await this.executeCode(
          code,
          language,
          testCase.input || '',
          testCase.expected || testCase.expectedOutput || ''
        );

        console.log(`📊 [JUDGE0] Test case ${i + 1} result:`, result);

        if (result.success) {
          const expected = testCase.expected || testCase.expectedOutput || '';
          const actual = result.data.stdout || '';
          const passed = result.data.status.id === 3 && 
                        expected && 
                        actual.trim() === expected.trim();
          
          const testResult = {
            testCase: i + 1,
            input: testCase.input || '',
            expected: expected,
            actual: actual,
            passed: passed,
            status: result.data.status.description,
            time: result.data.time,
            memory: result.data.memory,
            error: result.data.stderr || result.data.compile_output || ''
          };
          results.push(testResult);
        } else {
          results.push({
            testCase: i + 1,
            input: testCase.input || '',
            expected: testCase.expected || testCase.expectedOutput || '',
            actual: '',
            passed: false,
            status: 'Error',
            time: '0',
            memory: '0',
            error: result.error
          });
        }
      }

      const passedCount = results.filter(r => r.passed).length;
      console.log(`✅ [JUDGE0] Test results: ${passedCount}/${testCases.length} passed`);

      return {
        success: true,
        results: results,
        summary: {
          total: testCases.length,
          passed: passedCount,
          failed: testCases.length - passedCount,
          passRate: (passedCount / testCases.length) * 100
        }
      };

    } catch (error) {
      console.error('❌ [JUDGE0] Test cases error:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  // Get starter code for language
  getStarterCode(language) {
    const starters = {
      'javascript': `// JavaScript Starter Code
function solution() {
    // Your code here
    return "Hello World";
}

// Test your solution
console.log(solution());`,
      'typescript': `// TypeScript Starter Code
function solution(): string {
    // Your code here
    return "Hello World";
}

// Test your solution
console.log(solution());`,
      'python': `# Python Starter Code
def solution():
    # Your code here
    return "Hello World"

# Test your solution
if __name__ == "__main__":
    print(solution())`,
      'java': `// Java Starter Code
public class Solution {
    public static void main(String[] args) {
        System.out.println(solution());
    }
    
    public static String solution() {
        // Your code here
        return "Hello World";
    }
}`,
      'cpp': `// C++ Starter Code
#include <iostream>
#include <string>
using namespace std;

string solution() {
    // Your code here
    return "Hello World";
}

int main() {
    cout << solution() << endl;
    return 0;
}`,
      'c': `// C Starter Code
#include <stdio.h>
#include <string.h>

char* solution() {
    // Your code here
    return "Hello World";
}

int main() {
    printf("%s\\n", solution());
    return 0;
}`,
      'csharp': `// C# Starter Code
using System;

class Solution {
    public static void Main(string[] args) {
        Console.WriteLine(Solution());
    }
    
    public static string Solution() {
        // Your code here
        return "Hello World";
    }
}`,
      'go': `// Go Starter Code
package main

import "fmt"

func solution() string {
    // Your code here
    return "Hello World"
}

func main() {
    fmt.Println(solution())
}`,
      'rust': `// Rust Starter Code
fn solution() -> String {
    // Your code here
    "Hello World".to_string()
}

fn main() {
    println!("{}", solution());
}`,
      'php': `<?php
// PHP Starter Code
function solution() {
    // Your code here
    return "Hello World";
}

// Test your solution
echo solution();
?>`,
      'ruby': `# Ruby Starter Code
def solution
    # Your code here
    "Hello World"
end

# Test your solution
puts solution`,
      'swift': `// Swift Starter Code
func solution() -> String {
    // Your code here
    return "Hello World"
}

// Test your solution
print(solution())`,
      'kotlin': `// Kotlin Starter Code
fun solution(): String {
    // Your code here
    return "Hello World"
}

fun main() {
    println(solution())
}`,
      'scala': `// Scala Starter Code
object Solution {
    def solution(): String = {
        // Your code here
        "Hello World"
    }
    
    def main(args: Array[String]): Unit = {
        println(solution())
    }
}`,
      'r': `# R Starter Code
solution <- function() {
    # Your code here
    return("Hello World")
}

# Test your solution
print(solution())`,
      'sql': `-- SQL Starter Code
-- Your SQL query here
SELECT 'Hello World' AS result;`,
      'bash': `#!/bin/bash
# Bash Starter Code
solution() {
    # Your code here
    echo "Hello World"
}

# Test your solution
solution`,
      'powershell': `# PowerShell Starter Code
function Solution {
    # Your code here
    return "Hello World"
}

# Test your solution
Write-Output (Solution)`
    };

    return starters[language.toLowerCase()] || `// ${language} Starter Code\n// Your code here`;
  }
}

const judge0Service = new Judge0Service();
export default judge0Service;
