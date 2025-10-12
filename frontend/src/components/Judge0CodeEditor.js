import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Play, RotateCcw, CheckCircle, XCircle, Clock, Zap, Globe } from 'lucide-react';
import judge0Service from '../services/judge0Service';

const Judge0CodeEditor = ({ 
  language = 'javascript', 
  starterCode = '', 
  testCases = [],
  onCodeChange = () => {},
  onTestResults = () => {},
  height = '400px'
}) => {
  const [code, setCode] = useState(starterCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState({});
  const [executionTime, setExecutionTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  // Load supported languages on component mount
  useEffect(() => {
    const loadSupportedLanguages = () => {
      const languages = judge0Service.getSupportedLanguages();
      setSupportedLanguages(languages);
    };
    loadSupportedLanguages();
  }, []);

  // Update code when starter code changes
  useEffect(() => {
    if (starterCode) {
      setCode(starterCode);
    }
  }, [starterCode]);

  // Update language when prop changes
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleCodeChange = useCallback((value) => {
    setCode(value || '');
    if (onCodeChange) {
      onCodeChange(value || '');
    }
  }, [onCodeChange]);

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('No code to run');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setTestResults([]);
    setExecutionTime(0);
    setMemoryUsage(0);

    try {
      console.log('🚀 [JUDGE0 EDITOR] Running code...');
      console.log('🔍 [JUDGE0 EDITOR] Language:', selectedLanguage);
      console.log('🔍 [JUDGE0 EDITOR] Code length:', code.length);

      const result = await judge0Service.executeCode(code, selectedLanguage);

      if (result.success) {
        const data = result.data;
        setOutput(data.stdout || 'Code executed successfully!');
        setExecutionTime(parseFloat(data.time) || 0);
        setMemoryUsage(parseInt(data.memory) || 0);

        if (data.stderr) {
          setOutput(prev => prev + '\n\nErrors:\n' + data.stderr);
        }

        if (data.compile_output) {
          setOutput(prev => prev + '\n\nCompilation:\n' + data.compile_output);
        }

        console.log('✅ [JUDGE0 EDITOR] Code executed successfully');
      } else {
        setOutput(`❌ Error: ${result.error}`);
        console.error('❌ [JUDGE0 EDITOR] Execution failed:', result.error);
      }
    } catch (error) {
      setOutput(`💥 Execution Error: ${error.message}`);
      console.error('❌ [JUDGE0 EDITOR] Execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runTestCases = async () => {
    if (!code.trim() || isRunningTests || testCases.length === 0) return;

    setIsRunningTests(true);
    setTestResults([]);

    try {
      console.log('🧪 [JUDGE0 EDITOR] Running test cases...');
      console.log('🔍 [JUDGE0 EDITOR] Test cases count:', testCases.length);

      const result = await judge0Service.runTestCases(code, selectedLanguage, testCases);

      if (result.success) {
        setTestResults(result.results);
        setExecutionTime(result.results.reduce((sum, r) => sum + parseFloat(r.time || 0), 0));
        setMemoryUsage(Math.max(...result.results.map(r => parseInt(r.memory || 0))));

        if (onTestResults) {
          onTestResults(result.results, result.summary);
        }

        console.log('✅ [JUDGE0 EDITOR] Test cases completed');
        console.log('📊 [JUDGE0 EDITOR] Summary:', result.summary);
      } else {
        setTestResults([{
          testCase: 1,
          input: 'N/A',
          expected: 'N/A',
          actual: '',
          passed: false,
          status: 'Error',
          time: '0',
          memory: '0',
          error: result.error
        }]);
        console.error('❌ [JUDGE0 EDITOR] Test cases failed:', result.error);
      }
    } catch (error) {
      setTestResults([{
        testCase: 1,
        input: 'N/A',
        expected: 'N/A',
        actual: '',
        passed: false,
        status: 'Error',
        time: '0',
        memory: '0',
        error: error.message
      }]);
      console.error('❌ [JUDGE0 EDITOR] Test cases error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const resetCode = () => {
    const currentStarterCode = starterCode || judge0Service.getStarterCode(selectedLanguage);
    setCode(currentStarterCode);
    setOutput('');
    setTestResults([]);
    setExecutionTime(0);
    setMemoryUsage(0);
    if (onCodeChange) {
      onCodeChange(currentStarterCode);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    const newStarterCode = judge0Service.getStarterCode(newLanguage);
    setCode(newStarterCode);
    setOutput('');
    setTestResults([]);
    setExecutionTime(0);
    setMemoryUsage(0);
    if (onCodeChange) {
      onCodeChange(newStarterCode);
    }
  };

  const getLanguageOptions = () => {
    return Object.entries(supportedLanguages).map(([key, value]) => ({
      value: key,
      label: value.name
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Wrong Answer':
      case 'Compilation Error':
      case 'Runtime Error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Time Limit Exceeded':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted':
        return 'text-green-600 bg-green-50';
      case 'Wrong Answer':
      case 'Compilation Error':
      case 'Runtime Error':
        return 'text-red-600 bg-red-50';
      case 'Time Limit Exceeded':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-900">Judge0 Code Editor</span>
          </div>
          
          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getLanguageOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Execution Stats */}
          {(executionTime > 0 || memoryUsage > 0) && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {executionTime > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{executionTime.toFixed(3)}s</span>
                </div>
              )}
              {memoryUsage > 0 && (
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>{(memoryUsage / 1024).toFixed(1)}KB</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={resetCode}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={runCode}
            disabled={isRunning || !code.trim()}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          {testCases.length > 0 && (
            <button
              onClick={runTestCases}
              disabled={isRunningTests || !code.trim()}
              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isRunningTests ? 'Testing...' : 'Test'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="border-b border-gray-200">
        <Editor
          height={height}
          language={selectedLanguage}
          value={code}
          onChange={handleCodeChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on'
          }}
        />
      </div>

      {/* Output Panel */}
      {output && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Output</h4>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border">
            {output}
          </pre>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">Test Case {result.testCase}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.time && `${parseFloat(result.time).toFixed(3)}s`}
                    {result.memory && ` • ${(parseInt(result.memory) / 1024).toFixed(1)}KB`}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Input:</span>
                    <pre className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                      {result.input}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expected:</span>
                    <pre className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                      {result.expected}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Actual:</span>
                    <pre className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                      {result.actual}
                    </pre>
                  </div>
                </div>

                {result.error && (
                  <div className="mt-2">
                    <span className="font-medium text-red-700">Error:</span>
                    <pre className="mt-1 p-2 bg-red-50 rounded font-mono text-xs text-red-800">
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Judge0CodeEditor;
