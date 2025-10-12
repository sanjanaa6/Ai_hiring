import React, { useState } from 'react';
import judge0Service from '../services/judge0Service';

const Judge0DebugTest = () => {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const testSimpleExecution = async () => {
    setIsRunning(true);
    setOutput('Testing Judge0 connection...\n');

    try {
      // Test 1: Simple Python code
      setOutput(prev => prev + 'Test 1: Simple Python execution\n');
      const result1 = await judge0Service.executeCode(
        `print("Hello World")`,
        'python',
        '',
        'Hello World'
      );
      
      setOutput(prev => prev + `Result 1: ${JSON.stringify(result1, null, 2)}\n\n`);

      // Test 2: Test cases
      setOutput(prev => prev + 'Test 2: Running test cases\n');
      const testCases = [
        {
          input: '',
          expected: 'Hello World',
          expectedOutput: 'Hello World'
        }
      ];

      const result2 = await judge0Service.runTestCases(
        `print("Hello World")`,
        'python',
        testCases
      );
      
      setOutput(prev => prev + `Result 2: ${JSON.stringify(result2, null, 2)}\n\n`);

      // Test 3: JavaScript
      setOutput(prev => prev + 'Test 3: JavaScript execution\n');
      const result3 = await judge0Service.executeCode(
        `console.log("Hello World")`,
        'javascript',
        '',
        'Hello World'
      );
      
      setOutput(prev => prev + `Result 3: ${JSON.stringify(result3, null, 2)}\n\n`);

    } catch (error) {
      setOutput(prev => prev + `Error: ${error.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const testJudge0Health = async () => {
    setIsRunning(true);
    setOutput('Testing Judge0 health...\n');

    try {
      const response = await fetch('/api/judge0/health');
      const result = await response.json();
      setOutput(prev => prev + `Health check: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      setOutput(prev => prev + `Health check error: ${error.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const testLanguages = async () => {
    setIsRunning(true);
    setOutput('Testing supported languages...\n');

    try {
      const response = await fetch('/api/judge0/languages');
      const result = await response.json();
      setOutput(prev => prev + `Languages: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      setOutput(prev => prev + `Languages error: ${error.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Judge0 Debug Test</h1>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={testJudge0Health}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health
        </button>
        <button
          onClick={testLanguages}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Languages
        </button>
        <button
          onClick={testSimpleExecution}
          disabled={isRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Execution
        </button>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Debug Output:</h3>
        <pre className="whitespace-pre-wrap text-sm">
          {output || 'Click a test button to see results...'}
        </pre>
      </div>

      {isRunning && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Running test...</p>
        </div>
      )}
    </div>
  );
};

export default Judge0DebugTest;
