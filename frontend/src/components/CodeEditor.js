import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, CheckCircle, XCircle, AlertCircle, ChevronDown, Lock } from 'lucide-react';

const CodeEditor = ({ 
  language = 'javascript', 
  starterCode = '', 
  testCases = [], 
  onCodeChange,
  disabled = false,
  languageLocked = false
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

        // eslint-disable-next-line no-eval
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
    if (languageLocked) {
      return; // Don't allow language change if locked
    }
    
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
    <div className="w-full space-y-6">
      {/* Code Editor */}
      <div className="border border-slate-300 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            {/* Language Display */}
            <div className={`flex items-center space-x-3 px-4 py-2 text-sm rounded-xl shadow-sm border ${
              languageLocked 
                ? 'bg-slate-200 border-slate-300' 
                : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`font-semibold ${
                languageLocked ? 'text-slate-700' : 'text-slate-600'
              }`}>
                {supportedLanguages.find(lang => lang.value === selectedLanguage)?.label || 'JavaScript'}
              </span>
              {languageLocked && (
                <div className="flex items-center space-x-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs text-slate-600 bg-slate-300 px-2.5 py-1 rounded-full font-medium">
                    LOCKED
                  </span>
                </div>
              )}
            </div>
            
            {/* Language Selector (only show if not locked) */}
            {!languageLocked && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  disabled={disabled}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {supportedLanguages.find(lang => lang.value === selectedLanguage)?.label || 'JavaScript'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
                
                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-300 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${
                          selectedLanguage === lang.value ? 'bg-slate-100 text-slate-800 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {disabled && (
              <span className="text-xs text-slate-500 bg-slate-200 px-3 py-1.5 rounded-full font-medium">
                Read Only
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={resetCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm border border-slate-300/50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="font-medium">Reset</span>
            </button>
            <button
              onClick={runCode}
              disabled={disabled || isRunning}
              className="flex items-center space-x-2 px-5 py-2 text-sm bg-slate-700 hover:bg-slate-800 text-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg border border-slate-600/50"
            >
              {isRunning ? (
                <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="font-semibold">Run Code</span>
            </button>
          </div>
        </div>
        
        <div className="h-96">
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
              fontSize: 15,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
              },
              automaticLayout: true,
              theme: 'vs-light',
              padding: { top: 20, bottom: 20 },
              wordWrap: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              }
            }}
          />
        </div>
      </div>

      {/* Output Section */}
      {(output || testResults.length > 0) && (
        <div className="space-y-4">
          {/* Console Output */}
          {output && (
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-sm border border-slate-700/50 shadow-lg">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-slate-400 font-semibold">💻 Console Output:</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-700 text-sm">🧪 Test Results:</h4>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border shadow-sm ${
                    result.passed
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    {result.passed ? (
                      <CheckCircle className="h-5 w-5 text-slate-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-600" />
                    )}
                    <span className="font-semibold text-slate-700">
                      Test Case {result.testCase}
                      {result.passed ? ' - PASSED' : ' - FAILED'}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium text-slate-600">Input:</span> 
                      <code className="ml-2 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {result.input}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Expected:</span> 
                      <code className="ml-2 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {JSON.stringify(result.expected)}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">Actual:</span> 
                      <code className="ml-2 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
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
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-4 w-4 text-slate-600" />
            <span className="font-semibold text-slate-700">📋 Test Cases</span>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            {testCases.map((testCase, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Test {index + 1}:</span> 
                <div className="mt-1 space-y-1">
                  <div>Input: <code className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{testCase.input}</code></div>
                  <div>Expected: <code className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{JSON.stringify(testCase.expected)}</code></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
