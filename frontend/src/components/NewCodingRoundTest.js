import React, { useState } from 'react';
import NewCodingRound from './NewCodingRound';

const NewCodingRoundTest = () => {
  const [testComplete, setTestComplete] = useState(false);
  const [testData, setTestData] = useState(null);

  const handleComplete = (data) => {
    console.log('✅ New coding round completed with data:', data);
    setTestData(data);
    setTestComplete(true);
  };

  const handleError = (error) => {
    console.error('❌ New coding round error:', error);
  };

  if (testComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Coding Round Completed!</h1>
              <p className="text-gray-600">Great job! Here's your detailed performance report.</p>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {testData?.review?.overallScore || 0}%
                </div>
                <div className="text-sm text-blue-800 font-medium">Overall Score</div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {testData?.testResults?.filter(r => r.passed).length || 0}/{testData?.testResults?.length || 0}
                </div>
                <div className="text-sm text-green-800 font-medium">Tests Passed</div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Math.round(testData?.timeElapsed / 60) || 0}m
                </div>
                <div className="text-sm text-purple-800 font-medium">Time Taken</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-6">
              
              {/* Code Quality Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Quality Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{testData?.codeMetrics?.linesOfCode || 0}</div>
                    <div className="text-sm text-gray-600">Lines of Code</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      testData?.codeMetrics?.complexity === 'Low' ? 'text-green-600' :
                      testData?.codeMetrics?.complexity === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {testData?.codeMetrics?.complexity || 'Low'}
                    </div>
                    <div className="text-sm text-gray-600">Complexity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testData?.codeMetrics?.efficiency || 'Good'}</div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testData?.codeMetrics?.readability || 'Good'}</div>
                    <div className="text-sm text-gray-600">Readability</div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              {testData?.testResults && testData.testResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
                  <div className="space-y-3">
                    {testData.testResults.map((result, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {result.passed ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span className="font-medium text-gray-900">Test Case {result.testCase}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              result.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                              result.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {result.difficulty}
                            </span>
                          </div>
                          <span className={`text-sm font-medium ${
                            result.passed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{result.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Input:</span>
                            <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                              {result.input}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Expected:</span>
                            <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                              {result.expectedOutput}
                            </div>
                          </div>
                        </div>
                        {!result.passed && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-600">Actual:</span>
                            <div className="bg-red-100 p-2 rounded mt-1 font-mono text-xs text-red-800">
                              {result.actualOutput}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Review */}
              {testData?.review && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Review & Feedback</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">Overall Feedback</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {testData.review.feedback}
                    </p>
                  </div>

                  {testData.review.strengths && testData.review.strengths.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {testData.review.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {testData.review.improvements && testData.review.improvements.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {testData.review.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {testData.review.technicalQuestions && testData.review.technicalQuestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Technical Questions</h4>
                      <ul className="space-y-1">
                        {testData.review.technicalQuestions.map((question, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{question}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setTestComplete(false);
                  setTestData(null);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Run Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NewCodingRound
        interviewId="test_interview_123"
        question="Write a function that takes an array of numbers and returns the sum of all even numbers in the array.

Example:
- Input: [1, 2, 3, 4, 5]
- Output: 6 (2 + 4)

Requirements:
- Handle edge cases like empty arrays
- Consider performance for large arrays
- Write clean, readable code
- Add appropriate comments

Bonus: Can you optimize this for very large datasets?"
        language="javascript"
        starterCode="function sumEvenNumbers(numbers) {
  // Your code here
  return 0;
}"
        onComplete={handleComplete}
        onError={handleError}
      />
    </div>
  );
};

export default NewCodingRoundTest;

