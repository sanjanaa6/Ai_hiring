import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Play, Award, RefreshCw } from 'lucide-react';
import { CircuitValidator, CircuitTestRunner, TestTemplates } from '../utils/CircuitValidator';

const EvaluationPanel = ({ components, wires, isDarkMode, onTestComplete }) => {
  const [validationResult, setValidationResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedMode, setSelectedMode] = useState('validate'); // 'validate' or 'test'

  /**
   * Run circuit validation
   */
  const runValidation = () => {
    setIsEvaluating(true);
    
    setTimeout(() => {
      const validator = new CircuitValidator(components, wires);
      const result = validator.validate();
      setValidationResult(result);
      setIsEvaluating(false);

      if (onTestComplete) {
        onTestComplete(result);
      }
    }, 500); // Small delay for UX
  };

  /**
   * Run test cases
   */
  const runTests = () => {
    setIsEvaluating(true);
    
    setTimeout(() => {
      const testRunner = new CircuitTestRunner(components, wires);
      
      // Add default tests based on circuit components
      addDefaultTests(testRunner);
      
      const result = testRunner.runTests();
      setTestResult(result);
      setIsEvaluating(false);

      if (onTestComplete) {
        onTestComplete(result);
      }
    }, 500);
  };

  /**
   * Add default tests based on what's in the circuit
   */
  const addDefaultTests = (testRunner) => {
    // Check for LEDs
    const leds = components.filter(c => 
      c.type?.toLowerCase() === 'led' || c.name?.toLowerCase().includes('led')
    );
    
    leds.forEach(led => {
      testRunner.addTest(TestTemplates.ledConnected(led.name));
    });

    // Check for Arduino/ESP32
    const hasArduino = components.some(c => 
      c.name?.toLowerCase().includes('arduino') || c.name?.toLowerCase().includes('esp')
    );
    
    if (hasArduino) {
      testRunner.addTest(TestTemplates.hasPower('Arduino'));
      testRunner.addTest(TestTemplates.hasGround('Arduino'));
    }

    // Minimum components check
    testRunner.addTest(TestTemplates.minComponents(2));
  };

  /**
   * Auto-run validation when components/wires change
   */
  useEffect(() => {
    if (components.length > 0 || wires.length > 0) {
      // Auto-validate after a delay
      const timer = setTimeout(() => {
        if (selectedMode === 'validate') {
          runValidation();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [components, wires, selectedMode]);

  /**
   * Get score color
   */
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  /**
   * Get severity icon
   */
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Award className="h-5 w-5" />
          Circuit Evaluation
        </h2>
        
        {/* Mode Selector */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setSelectedMode('validate')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedMode === 'validate'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : isDarkMode ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Validate
          </button>
          <button
            onClick={() => setSelectedMode('test')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedMode === 'test'
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : isDarkMode ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Test Cases
          </button>
        </div>

        {/* Run Button */}
        <button
          onClick={selectedMode === 'validate' ? runValidation : runTests}
          disabled={isEvaluating || components.length === 0}
          className={`w-full mt-3 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${
            isEvaluating || components.length === 0
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isEvaluating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {selectedMode === 'validate' ? 'Validate Circuit' : 'Run Tests'}
            </>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedMode === 'validate' && validationResult && (
          <ValidationResults result={validationResult} isDarkMode={isDarkMode} getScoreColor={getScoreColor} getSeverityIcon={getSeverityIcon} />
        )}

        {selectedMode === 'test' && testResult && (
          <TestResults result={testResult} isDarkMode={isDarkMode} getScoreColor={getScoreColor} />
        )}

        {!validationResult && !testResult && components.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Add components to your circuit to start evaluation</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Validation Results Component
 */
const ValidationResults = ({ result, isDarkMode, getScoreColor, getSeverityIcon }) => {
  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Circuit Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}/100
          </span>
        </div>
        <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              result.score >= 80 ? 'bg-green-500' :
              result.score >= 60 ? 'bg-yellow-500' :
              result.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className={`p-3 rounded-lg ${
        result.isValid 
          ? isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
          : isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
      }`}>
        <p className="text-sm">{result.summary}</p>
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-red-500">
            Errors ({result.errors.length})
          </h3>
          <div className="space-y-2">
            {result.errors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg flex gap-3 ${
                  isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                }`}
              >
                {getSeverityIcon(error.severity)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{error.message}</p>
                  {error.component && (
                    <p className="text-xs opacity-70 mt-1">Component: {error.component}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-yellow-500">
            Warnings ({result.warnings.length})
          </h3>
          <div className="space-y-2">
            {result.warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg flex gap-3 ${
                  isDarkMode ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                {getSeverityIcon(warning.severity)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{warning.message}</p>
                  {warning.component && (
                    <p className="text-xs opacity-70 mt-1">Component: {warning.component}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Test Results Component
 */
const TestResults = ({ result, isDarkMode, getScoreColor }) => {
  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Test Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(result.percentage)}`}>
            {result.percentage}%
          </span>
        </div>
        <p className="text-sm opacity-70">
          {result.earnedPoints} / {result.totalPoints} points
        </p>
        <div className={`w-full h-2 rounded-full mt-3 ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              result.percentage >= 80 ? 'bg-green-500' :
              result.percentage >= 60 ? 'bg-yellow-500' :
              result.percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-3 rounded-lg flex items-center gap-3 ${
        result.allPassed 
          ? isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
          : isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
      }`}>
        {result.allPassed ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <p className="text-sm font-medium">All tests passed! 🎉</p>
          </>
        ) : (
          <>
            <XCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm font-medium">Some tests failed</p>
          </>
        )}
      </div>

      {/* Test Results */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Test Results</h3>
        <div className="space-y-2">
          {result.results.map((test, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg flex gap-3 ${
                test.passed
                  ? isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                  : isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}
            >
              {test.passed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{test.name}</p>
                  <span className="text-xs opacity-70">{test.points} pts</span>
                </div>
                <p className="text-xs opacity-70 mt-1">{test.description}</p>
                <p className="text-xs mt-1">{test.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvaluationPanel;

