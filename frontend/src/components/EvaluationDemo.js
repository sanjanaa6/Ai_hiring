import React, { useState } from 'react';
import aiInterviewService from '../services/aiInterviewService';
import InterviewEvaluationResults from './InterviewEvaluationResults';
import { Play, Loader2 } from 'lucide-react';

const EvaluationDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [demoData, setDemoData] = useState(null);

  const runEvaluationDemo = async () => {
    setIsRunning(true);
    setEvaluation(null);

    // Create a mock interview session with different scenarios
    const mockInterviewData = {
      interviewId: 'demo_interview_001',
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
        },
        {
          roundId: 'round_2',
          roundNumber: 2,
          title: 'Problem-Solving & Critical Thinking',
          description: 'Test decision-making in real-world scenarios',
          duration: 15,
          questions: [
            {
              id: 'q2_1',
              type: 'situational',
              question: 'How would you handle a situation where you disagree with a team member on a technical approach?',
              expectedAnswer: 'Look for communication and collaboration skills',
              timeLimit: 5,
              difficulty: 'medium'
            }
          ]
        }
      ]
    };

    const mockCandidateInfo = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };

    // Create different scenarios based on user selection
    const scenarios = [
      {
        name: 'Excellent Candidate',
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
          },
          {
            roundId: 'round_2',
            questionId: 'q2_1',
            question: 'How would you handle a situation where you disagree with a team member on a technical approach?',
            answer: 'I would approach this professionally by first understanding their perspective completely. I\'d ask questions to clarify their reasoning and share my concerns constructively. If we still disagree, I\'d suggest we prototype both approaches or conduct a technical spike to gather data. I believe in data-driven decisions, so I\'d present evidence supporting my approach while remaining open to being proven wrong. The goal is finding the best solution for the project, not being right.',
            timeSpent: 150
          }
        ]
      },
      {
        name: 'Poor Candidate (No Answers)',
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
            answer: '',
            timeSpent: 3
          },
          {
            roundId: 'round_2',
            questionId: 'q2_1',
            question: 'How would you handle a situation where you disagree with a team member on a technical approach?',
            answer: '',
            timeSpent: 2
          }
        ]
      },
      {
        name: 'Average Candidate',
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
          },
          {
            roundId: 'round_2',
            questionId: 'q2_1',
            question: 'How would you handle a situation where you disagree with a team member on a technical approach?',
            answer: 'I would talk to them about it and try to find a compromise or ask the team lead for advice.',
            timeSpent: 80
          }
        ]
      }
    ];

    // Let user choose scenario (for demo, we'll use excellent candidate)
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

    // Run evaluation
    try {
      const result = await aiInterviewService.evaluateInterview(sessionId);
      if (result.success) {
        setEvaluation(result.data);
      } else {
        console.error('Evaluation failed:', result.error);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
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
              AI Interview Evaluation Demo
            </h1>
            <p className="text-gray-600 mb-6">
              This demo shows how the enhanced AI evaluation system analyzes interview responses 
              and provides detailed feedback based on actual answer quality, not just participation.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Enhanced Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                <div>• Detailed scoring across 6 categories</div>
                <div>• Communication and vocabulary assessment</div>
                <div>• Technical depth evaluation</div>
                <div>• Participation metrics tracking</div>
                <div>• Constructive feedback with examples</div>
                <div>• Confidence level indicators</div>
              </div>
            </div>

            {!evaluation && !isRunning && (
              <button
                onClick={runEvaluationDemo}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Play className="h-5 w-5" />
                <span>Run Evaluation Demo</span>
              </button>
            )}

            {isRunning && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Running AI evaluation...</span>
              </div>
            )}

            {demoData && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Demo Scenario: {demoData.scenario.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Interview: {demoData.interviewData.title}</p>
                  <p>• Candidate: {demoData.candidateInfo.name}</p>
                  <p>• Questions Answered: {demoData.scenario.answers.length}</p>
                  <p>• Answer Quality: {demoData.scenario.name.includes('Excellent') ? 'High' : demoData.scenario.name.includes('Poor') ? 'None' : 'Medium'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {evaluation && (
          <InterviewEvaluationResults 
            evaluation={evaluation}
            candidateInfo={demoData?.candidateInfo}
            interviewData={demoData?.interviewData}
          />
        )}
      </div>
    </div>
  );
};

export default EvaluationDemo;
