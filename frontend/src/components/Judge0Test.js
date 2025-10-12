import React, { useState } from 'react';
import Judge0CodeEditor from './Judge0CodeEditor';

const Judge0Test = () => {
  const [testResults, setTestResults] = useState([]);

  const sampleTestCases = [
    {
      input: '5',
      expected: 'Hello World',
      description: 'Basic test case'
    },
    {
      input: '10',
      expected: 'Hello World',
      description: 'Another test case'
    }
  ];

  const handleTestResults = (results, summary) => {
    setTestResults(results);
    console.log('Test Results:', results);
    console.log('Summary:', summary);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Judge0 Integration Test
        </h1>
        <p className="text-gray-600">
          Test the Judge0 code execution service with multiple programming languages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Code Editor
          </h2>
          <Judge0CodeEditor
            language="python"
            starterCode={`# Python Starter Code
def solution():
    # Your code here
    return "Hello World"

# Test your solution
if __name__ == "__main__":
    print(solution())`}
            testCases={sampleTestCases}
            onTestResults={handleTestResults}
            height="500px"
          />
        </div>

        {/* Test Results */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test Results
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {testResults.length > 0 ? (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Test Case {result.testCase}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.passed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div><strong>Input:</strong> {result.input}</div>
                      <div><strong>Expected:</strong> {result.expected}</div>
                      <div><strong>Actual:</strong> {result.actual}</div>
                      {result.error && (
                        <div><strong>Error:</strong> {result.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Run tests to see results here
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Language Support Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Supported Languages
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C',
            'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift',
            'Kotlin', 'Scala', 'R', 'SQL', 'Bash', 'PowerShell'
          ].map(lang => (
            <div key={lang} className="bg-white rounded-lg p-3 text-center">
              <span className="text-sm font-medium text-gray-700">{lang}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Judge0Test;
