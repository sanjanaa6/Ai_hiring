import React, { useState } from 'react';
import aiInterviewService from '../services/aiInterviewService';
import { Play, Loader2, CheckCircle, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';

const RoundEvaluationDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [roundEvaluation, setRoundEvaluation] = useState(null);
  const [demoData, setDemoData] = useState(null);

  const runRoundEvaluationDemo = async () => {
    setIsRunning(true);
    setRoundEvaluation(null);

    // Create a mock interview session
    const mockInterviewData = {
      interviewId: 'demo_round_eval_001',
      title: 'AI Multi-Round Interview - Software Engineer',
      totalDuration: 30,
      rounds: [
        {
          roundId: 'round_1',
          roundNumber: 1,
          title: 'Technical Fundamentals',
          description: 'Evaluate technical skills and problem-solving abilities',
          duration: 20,
          questions: [
            {
              id: 'q1_1',
              type: 'technical',
              question: 'Explain the difference between REST and GraphQL APIs',
              expectedAnswer: 'Look for understanding of API design principles',
              timeLimit: 5,
              difficulty: 'medium'
            },
            {
              id: 'q1_2',
              type: 'technical',
              question: 'How would you optimize a slow database query?',
              expectedAnswer: 'Look for database optimization knowledge',
              timeLimit: 5,
              difficulty: 'hard'
            }
          ]
        }
      ]
    };

    const mockCandidateInfo = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };

    // Create different answer scenarios
    const scenarios = [
      {
        name: 'Excellent Technical Answers',
        answers: [
          {
            roundId: 'round_1',
            questionId: 'q1_1',
            question: 'Explain the difference between REST and GraphQL APIs',
            answer: 'REST is a stateless architectural style that uses HTTP methods and URLs to access resources. It\'s simple and widely adopted. GraphQL is a query language that allows clients to request exactly the data they need in a single request. It provides more flexibility and efficiency, especially for mobile applications where bandwidth is limited. REST is better for simple CRUD operations, while GraphQL excels in complex data relationships and when you need to minimize over-fetching.',
            timeSpent: 120
          },
          {
            roundId: 'round_1',
            questionId: 'q1_2',
            question: 'How would you optimize a slow database query?',
            answer: 'I would start by analyzing the query execution plan to identify bottlenecks. Key optimization strategies include: 1) Adding appropriate indexes on frequently queried columns, 2) Rewriting the query to use more efficient joins, 3) Implementing query result caching, 4) Using database partitioning for large tables, 5) Optimizing the database schema design, and 6) Using connection pooling to reduce connection overhead. I\'d also monitor query performance over time and use database profiling tools.',
            timeSpent: 180
          }
        ]
      },
      {
        name: 'Poor Answers (Empty/Incomplete)',
        answers: [
          {
            roundId: 'round_1',
            questionId: 'q1_1',
            question: 'Explain the difference between REST and GraphQL APIs',
            answer: '',
            timeSpent: 5
          },
          {
            roundId: 'round_1',
            questionId: 'q1_2',
            question: 'How would you optimize a slow database query?',
            answer: 'I don\'t know',
            timeSpent: 10
          }
        ]
      },
      {
        name: 'Average Answers',
        answers: [
          {
            roundId: 'round_1',
            questionId: 'q1_1',
            question: 'Explain the difference between REST and GraphQL APIs',
            answer: 'REST uses HTTP methods like GET, POST, PUT, DELETE. GraphQL is a query language that lets you get exactly the data you need. REST is simpler but GraphQL is more flexible.',
            timeSpent: 90
          },
          {
            roundId: 'round_1',
            questionId: 'q1_2',
            question: 'How would you optimize a slow database query?',
            answer: 'I would add indexes to the database and maybe rewrite the query to make it faster.',
            timeSpent: 60
          }
        ]
      }
    ];

    // Use excellent answers for demo
    const selectedScenario = scenarios[0];
    
    // Start interview session
    const sessionId = aiInterviewService.startInterview(mockInterviewData, mockCandidateInfo);
    
    // Submit answers
    selectedScenario.answers.forEach(answer => {
      aiInterviewService.submitAnswer(sessionId, answer.answer);
    });

    // Get the session and manually set answers with timing
    const session = aiInterviewService.getInterviewSession(sessionId);
    if (session) {
      session.answers = selectedScenario.answers;
    }

    setDemoData({
      interviewData: mockInterviewData,
      candidateInfo: mockCandidateInfo,
      scenario: selectedScenario
    });

    // Run round evaluation
    try {
      const result = await aiInterviewService.evaluateRound(sessionId, 'round_1');
      if (result.success) {
        setRoundEvaluation(result.data);
      } else {
        console.error('Round evaluation failed:', result.error);
      }
    } catch (error) {
      console.error('Round evaluation error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Round-by-Round AI Evaluation Demo
            </h1>
            <p className="text-gray-600 mb-6">
              This demo shows how the AI evaluates each round immediately after completion, 
              sending transcriptions to the AI API and providing detailed feedback before moving to the next round.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Round Evaluation Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                <div>• Immediate evaluation after round completion</div>
                <div>• Detailed scoring across 5 categories</div>
                <div>• Participation metrics tracking</div>
                <div>• Specific feedback with examples</div>
                <div>• Next round advice</div>
                <div>• Real-time AI analysis of transcriptions</div>
              </div>
            </div>

            {!roundEvaluation && !isRunning && (
              <button
                onClick={runRoundEvaluationDemo}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Play className="h-5 w-5" />
                <span>Run Round Evaluation Demo</span>
              </button>
            )}

            {isRunning && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>AI is analyzing round transcriptions...</span>
              </div>
            )}

            {demoData && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Demo Scenario: {demoData.scenario.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Round: {demoData.interviewData.rounds[0].title}</p>
                  <p>• Candidate: {demoData.candidateInfo.name}</p>
                  <p>• Questions Answered: {demoData.scenario.answers.length}</p>
                  <p>• Answer Quality: {demoData.scenario.name.includes('Excellent') ? 'High' : demoData.scenario.name.includes('Poor') ? 'Low' : 'Medium'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {roundEvaluation && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Round Evaluation Results
              </h1>
              <p className="text-gray-600">
                AI analysis of round transcriptions completed successfully.
              </p>
            </div>

            {/* Round Score */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {roundEvaluation.roundScore}%
              </div>
              <div className="text-sm text-blue-700">Round Score</div>
              <div className="text-xs text-blue-600 mt-1">
                {roundEvaluation.roundScore >= 80 ? 'Excellent performance!' : 
                 roundEvaluation.roundScore >= 60 ? 'Good performance' : 
                 'Room for improvement'}
              </div>
            </div>

            {/* Detailed Scores */}
            {roundEvaluation.scores && (
              <div className="bg-white border rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Detailed Performance Breakdown:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(roundEvaluation.scores).map(([category, score]) => (
                    <div key={category} className="text-center">
                      <div className="text-lg font-bold text-gray-900">{score}/10</div>
                      <div className="text-xs text-gray-500 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-orange-500" />
                AI Feedback
              </h3>
              <p className="text-gray-700">{roundEvaluation.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              <div className="bg-white border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {roundEvaluation.strengths?.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas for Improvement */}
              <div className="bg-white border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {roundEvaluation.improvements?.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Participation Metrics */}
            {roundEvaluation.participationMetrics && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Participation Metrics:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{roundEvaluation.participationMetrics.questionsAnswered}</div>
                    <div className="text-gray-500">Questions Answered</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{roundEvaluation.participationMetrics.participationRate}%</div>
                    <div className="text-gray-500">Participation Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{roundEvaluation.participationMetrics.completenessRate}%</div>
                    <div className="text-gray-500">Completeness Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{roundEvaluation.participationMetrics.avgResponseTime}s</div>
                    <div className="text-gray-500">Avg Response Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Round Advice */}
            {roundEvaluation.nextRoundAdvice && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Advice for Next Round
                </h3>
                <p className="text-purple-700 text-sm">{roundEvaluation.nextRoundAdvice}</p>
              </div>
            )}

            {/* Round Summary */}
            {roundEvaluation.roundSummary && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Round Summary:</h3>
                <p className="text-gray-700 text-sm">{roundEvaluation.roundSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoundEvaluationDemo;
