import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Code2, 
  Target,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import codeExecutionService from '../services/codeExecutionService';

const TestCaseManager = ({
  code,
  testCases = [],
  language = 'javascript',
  onTestResults,
  onTestCaseUpdate,
  isRunning = false,
  disabled = false
}) => {
  const { isDarkMode } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [showTestCases, setShowTestCases] = useState(true);
  const [executionTime, setExecutionTime] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Run all test cases
  const runTests = async () => {
    if (!code.trim()) {
      setTestResults([]);
      if (onTestResults) onTestResults([]);
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const result = await codeExecutionService.executeCodeWithTests(code, testCases, language);
      
      if (result.success) {
        setTestResults(result.testResults || []);
        setExecutionTime(result.executionTime || 0);
        if (onTestResults) onTestResults(result.testResults || []);
      } else {
        setTestResults([]);
        setExecutionTime(0);
        if (onTestResults) onTestResults([]);
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults([]);
      setExecutionTime(0);
      if (onTestResults) onTestResults([]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Auto-run tests when code changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (code.trim() && testCases.length > 0) {
        runTests();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [code, testCases, language]);

  // Calculate test statistics
  const getTestStats = () => {
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    return { passed, total, percentage };
  };

  const stats = getTestStats();

  // Copy test results to clipboard
  const copyResults = () => {
    const resultsText = testResults.map((result, index) => 
      `Test ${index + 1}: ${result.passed ? 'PASS' : 'FAIL'}\n` +
      `Input: ${JSON.stringify(result.input)}\n` +
      `Expected: ${JSON.stringify(result.expected)}\n` +
      `Actual: ${result.error || JSON.stringify(result.actual)}\n`
    ).join('\n');
    
    navigator.clipboard.writeText(resultsText);
  };

  // Export test results
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      language,
      testCases,
      results: testResults,
      stats
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border-t ${
      isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Test Cases Header */}
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowTestCases(!showTestCases)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'hover:bg-slate-700 text-slate-300' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              {showTestCases ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {showTestCases ? 'Hide' : 'Show'} Test Cases
              </span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {testCases.length} Test Cases
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Test Statistics */}
            {testResults.length > 0 && (
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${
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

            {/* Run Tests Button */}
            <button
              onClick={runTests}
              disabled={isExecuting || disabled || !code.trim()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isExecuting || disabled || !code.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run Tests</span>
                </>
              )}
            </button>

            {/* Export Results */}
            {testResults.length > 0 && (
              <button
                onClick={exportResults}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isDarkMode 
                    ? 'hover:bg-slate-700 text-slate-300' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Execution Time */}
        {executionTime > 0 && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Execution time: {executionTime}ms</span>
          </div>
        )}
      </div>

      {/* Test Cases List */}
      {showTestCases && (
        <div className="p-4 space-y-3">
          {testCases.length === 0 ? (
            <div className={`text-center py-8 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No test cases available</p>
              <p className="text-xs mt-1">Test cases will be provided by the interviewer</p>
            </div>
          ) : (
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
                          {testCase.description || `Test Case ${index + 1}`}
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
          )}
        </div>
      )}
    </div>
  );
};

export default TestCaseManager;
