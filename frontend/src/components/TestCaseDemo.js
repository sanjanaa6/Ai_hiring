import React, { useState } from 'react';
import { Play, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import codeExecutionService from '../services/codeExecutionService';

const TestCaseDemo = () => {
  const { isDarkMode } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(`function twoSum(nums, target) {
  // Your code here
  // Return an array of two indices
  // Example: return [0, 1] for indices 0 and 1
  return [];
}`);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const testCases = selectedLanguage === 'python' ? [
    {
      input: [[2, 7, 11, 15], 9],
      expected: [0, 1],
      description: 'Basic two sum test case',
      functionName: 'two_sum'
    },
    {
      input: [[3, 2, 4], 6],
      expected: [1, 2],
      description: 'Another two sum test case',
      functionName: 'two_sum'
    },
    {
      input: [[3, 3], 6],
      expected: [0, 1],
      description: 'Same number test case',
      functionName: 'two_sum'
    }
  ] : [
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
    },
    {
      input: [[3, 3], 6],
      expected: [0, 1],
      description: 'Same number test case',
      functionName: 'twoSum'
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    try {
      const result = await codeExecutionService.executeCodeWithTests(
        code, 
        testCases, 
        selectedLanguage
      );
      
      if (result.success) {
        setTestResults(result.testResults || []);
      } else {
        setTestResults([]);
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults([]);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestStats = () => {
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { passed, total, percentage };
  };

  const stats = getTestStats();

  return (
    <div className={`min-h-screen p-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Test Case Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className={`p-6 rounded-2xl ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-white/10' 
              : 'bg-white/80 border border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Code Editor
              </h2>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  if (e.target.value === 'python') {
                    setCode(`def two_sum(nums, target):
    # Your code here
    # Return a list of two indices
    # Example: return [0, 1] for indices 0 and 1
    return []`);
                  } else {
                    setCode(`function twoSum(nums, target) {
  // Your code here
  // Return an array of two indices
  // Example: return [0, 1] for indices 0 and 1
  return [];
}`);
                  }
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-slate-700 text-white border border-slate-600' 
                    : 'bg-gray-100 text-gray-900 border border-gray-300'
                }`}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full h-64 p-4 rounded-lg font-mono text-sm ${
                isDarkMode 
                  ? 'bg-slate-900 text-white border border-slate-700' 
                  : 'bg-gray-100 text-gray-900 border border-gray-300'
              }`}
              placeholder="Enter your code here..."
            />
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`mt-4 px-6 py-2 rounded-lg font-medium transition-all ${
                isRunning || !code.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 inline-block mr-2" />
                  Run Tests
                </>
              )}
            </button>
          </div>

          {/* Test Results */}
          <div className={`p-6 rounded-2xl ${
            isDarkMode 
              ? 'bg-slate-800/50 border border-white/10' 
              : 'bg-white/80 border border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Test Results
              </h2>
              {testResults.length > 0 && (
                <div className={`px-3 py-1 rounded-lg ${
                  stats.percentage === 100 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : stats.percentage > 0
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  <span className="text-sm font-semibold">
                    {stats.passed}/{stats.total} ({stats.percentage}%)
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {testCases.map((testCase, index) => {
                const result = testResults.find(r => r.testCase === index + 1);
                const isPassed = result?.passed;
                const hasResult = !!result;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all ${
                      hasResult
                        ? isPassed
                          ? isDarkMode
                            ? 'bg-green-900/20 border-green-500/30'
                            : 'bg-green-50 border-green-200'
                          : isDarkMode
                            ? 'bg-red-900/20 border-red-500/30'
                            : 'bg-red-50 border-red-200'
                        : isDarkMode
                          ? 'bg-slate-700/50 border-slate-600/50'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {hasResult ? (
                          isPassed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            isDarkMode ? 'border-slate-500' : 'border-gray-300'
                          }`} />
                        )}
                        <h4 className={`font-semibold ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-900'
                        }`}>
                          {testCase.description}
                        </h4>
                      </div>
                      
                      {hasResult && (
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          isPassed
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>
                          Input:
                        </span>
                        <pre className={`mt-1 p-2 rounded text-sm font-mono ${
                          isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {JSON.stringify(testCase.input, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}>
                          Expected Output:
                        </span>
                        <pre className={`mt-1 p-2 rounded text-sm font-mono ${
                          isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {JSON.stringify(testCase.expected, null, 2)}
                        </pre>
                      </div>

                      {hasResult && (
                        <div>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>
                            Actual Output:
                          </span>
                          <pre className={`mt-1 p-2 rounded text-sm font-mono ${
                            isPassed
                              ? isDarkMode
                                ? 'bg-green-900/30 text-green-200'
                                : 'bg-green-100 text-green-800'
                              : isDarkMode
                                ? 'bg-red-900/30 text-red-200'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {result.error || JSON.stringify(result.actual, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseDemo;
