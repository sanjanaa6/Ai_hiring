import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';

const CodeEditor = ({ 
  language = 'javascript', 
  starterCode = '', 
  testCases = [], 
  onCodeChange,
  disabled = false 
}) => {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const editorRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Supported programming languages with their Monaco Editor mappings
  const supportedLanguages = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'cpp', label: 'C++', extension: 'cpp' },
    { value: 'c', label: 'C', extension: 'c' },
    { value: 'csharp', label: 'C#', extension: 'cs' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' },
    { value: 'php', label: 'PHP', extension: 'php' },
    { value: 'ruby', label: 'Ruby', extension: 'rb' },
    { value: 'go', label: 'Go', extension: 'go' },
    { value: 'rust', label: 'Rust', extension: 'rs' },
    { value: 'swift', label: 'Swift', extension: 'swift' },
    { value: 'kotlin', label: 'Kotlin', extension: 'kt' },
    { value: 'scala', label: 'Scala', extension: 'scala' }
  ];

  // Language-specific starter code templates
  const getStarterCodeForLanguage = (lang) => {
    const templates = {
      javascript: 'function solution() {\n    // Write your code here\n    return null;\n}',
      python: 'def solution():\n    # Write your code here\n    pass',
      java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        // Write your code here\n    }\n}',
      typescript: 'function solution(): any {\n    // Write your code here\n    return null;\n}',
      php: '<?php\n// Write your code here\n?>',
      ruby: '# Write your code here',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n}',
      rust: 'fn main() {\n    // Write your code here\n}',
      swift: 'import Foundation\n\n// Write your code here',
      kotlin: 'fun main() {\n    // Write your code here\n}',
      scala: 'object Solution {\n    def main(args: Array[String]): Unit = {\n        // Write your code here\n    }\n}'
    };
    return templates[lang] || templates.javascript;
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco Editor
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });
    
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true
    });
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
    if (onCodeChange) {
      onCodeChange(value || '');
    }
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('No code to run');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setTestResults([]);

    try {
      // For JavaScript/TypeScript, we can execute directly
      if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
        const wrappedCode = `
          (function() {
            try {
              ${code}
              
              // Run test cases if available
              const testResults = [];
              ${testCases.map((testCase, index) => `
                try {
                  const result = eval('(' + \`${testCase.input}\`)');
                  const expected = ${testCase.expected};
                  testResults.push({
                    testCase: ${index + 1},
                    input: \`${testCase.input}\`,
                    expected: expected,
                    actual: result,
                    passed: result === expected,
                    error: null
                  });
                } catch (error) {
                  testResults.push({
                    testCase: ${index + 1},
                    input: \`${testCase.input}\`,
                    expected: ${testCase.expected},
                    actual: null,
                    passed: false,
                    error: error.message
                  });
                }
              `).join('\n')}
              
              return { success: true, testResults: testResults };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })()
        `;

        const result = eval(wrappedCode);
        
        if (result.success) {
          setTestResults(result.testResults || []);
          setOutput('Code executed successfully!');
        } else {
          setOutput(`Error: ${result.error}`);
        }
      } else {
        // For other languages, show a message that execution is not supported
        setOutput(`Code execution is currently only supported for JavaScript/TypeScript. Your ${supportedLanguages.find(lang => lang.value === selectedLanguage)?.label} code has been saved.`);
        
        // Still run test cases if they exist (assuming they're JavaScript-based)
        if (testCases.length > 0) {
          setTestResults(testCases.map((testCase, index) => ({
            testCase: index + 1,
            input: testCase.input,
            expected: testCase.expected,
            actual: 'Not executed',
            passed: false,
            error: 'Test execution not supported for this language'
          })));
        }
      }
    } catch (error) {
      setOutput(`Execution Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    const currentStarterCode = starterCode || getStarterCodeForLanguage(selectedLanguage);
    setCode(currentStarterCode);
    setOutput('');
    setTestResults([]);
    if (onCodeChange) {
      onCodeChange(currentStarterCode);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    setShowLanguageDropdown(false);
    
    // Update code to language-specific template if current code is empty or default
    const currentTemplate = getStarterCodeForLanguage(newLanguage);
    if (!code.trim() || code === starterCode || code === getStarterCodeForLanguage(language)) {
      setCode(currentTemplate);
      if (onCodeChange) {
        onCodeChange(currentTemplate);
      }
    }
    
    // Clear output and test results when switching languages
    setOutput('');
    setTestResults([]);
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'python':
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'csharp':
      case 'c#':
        return 'csharp';
      default:
        return 'javascript';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Code Editor */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                disabled={disabled}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium text-gray-700">
                  {supportedLanguages.find(lang => lang.value === selectedLanguage)?.label || 'JavaScript'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        selectedLanguage === lang.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {disabled && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Read Only
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={resetCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={runCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Run Code</span>
            </button>
          </div>
        </div>
        
        <div className="h-64">
          <Editor
            height="100%"
            language={getLanguageForMonaco(selectedLanguage)}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              readOnly: disabled,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
              },
              automaticLayout: true,
              theme: 'vs-light'
            }}
          />
        </div>
      </div>

      {/* Output Section */}
      {(output || testResults.length > 0) && (
        <div className="space-y-3">
          {/* Console Output */}
          {output && (
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400">Console Output:</span>
              </div>
              <pre className="whitespace-pre-wrap">{output}</pre>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Test Results:</h4>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {result.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      Test Case {result.testCase}
                      {result.passed ? ' - PASSED' : ' - FAILED'}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Input:</span> 
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {result.input}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Expected:</span> 
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {JSON.stringify(result.expected)}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Actual:</span> 
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {result.error ? result.error : JSON.stringify(result.actual)}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Cases Info */}
      {testCases.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Test Cases</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            {testCases.map((testCase, index) => (
              <div key={index}>
                <span className="font-medium">Test {index + 1}:</span> 
                Input: <code className="bg-blue-100 px-1 rounded">{testCase.input}</code> → 
                Expected: <code className="bg-blue-100 px-1 rounded">{JSON.stringify(testCase.expected)}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
