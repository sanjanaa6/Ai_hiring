import { sampleCodingQuestions, createCodingRound } from './sampleCodingQuestions';

// Sample interview data with coding rounds
export const sampleInterviewData = {
  _id: 'sample-interview-001',
  title: 'Full Stack Developer Interview',
  description: 'Comprehensive interview covering technical skills, coding challenges, and problem-solving abilities',
  company: 'TechCorp Inc.',
  position: 'Senior Full Stack Developer',
  duration: 90, // minutes
  difficulty: 'Medium',
  rounds: [
    {
      _id: 'round-1',
      title: 'Technical Coding Round',
      description: 'Solve coding challenges with test cases and get instant feedback',
      type: 'coding',
      timeLimit: 30,
      questions: [
        sampleCodingQuestions[0], // Two Sum
        sampleCodingQuestions[1], // Fibonacci
        sampleCodingQuestions[2]  // Palindrome
      ],
      instructions: [
        'Read each problem carefully',
        'Write clean, efficient code',
        'Test your solution with the provided test cases',
        'Consider edge cases and time complexity',
        'Ask questions if you need clarification'
      ]
    },
    {
      _id: 'round-2',
      title: 'System Design Round',
      description: 'Design and explain system architecture for real-world problems',
      type: 'technical',
      timeLimit: 25,
      questions: [
        {
          _id: 'sys-design-1',
          question: 'Design a URL shortener service like bit.ly',
          description: 'Explain the architecture, database design, and scaling considerations for a URL shortener service that can handle millions of requests per day.',
          type: 'system-design',
          timeLimit: 25,
          hints: [
            'Consider the requirements: shortening, redirecting, analytics',
            'Think about database schema for storing URLs',
            'Consider caching strategies for frequently accessed URLs',
            'Plan for horizontal scaling and load balancing'
          ]
        }
      ]
    },
    {
      _id: 'round-3',
      title: 'Behavioral Round',
      description: 'Discuss your experience, problem-solving approach, and cultural fit',
      type: 'behavioral',
      timeLimit: 20,
      questions: [
        {
          _id: 'behavioral-1',
          question: 'Tell me about a challenging project you worked on recently',
          description: 'Describe a project where you faced significant technical or organizational challenges and how you overcame them.',
          type: 'behavioral',
          timeLimit: 10,
          followUpQuestions: [
            'What was your role in the project?',
            'What specific challenges did you face?',
            'How did you measure the success of your solution?',
            'What would you do differently if you had to do it again?'
          ]
        },
        {
          _id: 'behavioral-2',
          question: 'How do you handle conflicting priorities and tight deadlines?',
          description: 'Share an example of when you had to manage multiple competing priorities and how you prioritized your work.',
          type: 'behavioral',
          timeLimit: 10
        }
      ]
    },
    {
      _id: 'round-4',
      title: 'Advanced Coding Round',
      description: 'Solve complex algorithmic problems with multiple test cases',
      type: 'coding',
      timeLimit: 35,
      questions: [
        sampleCodingQuestions[3], // Binary Search
        {
          _id: 'coding-advanced-1',
          question: 'Implement a LRU (Least Recently Used) Cache',
          description: 'Design and implement a data structure that follows the constraints of a Least Recently Used (LRU) cache. It should support get and put operations in O(1) time complexity.',
          type: 'coding',
          difficulty: 'Hard',
          timeLimit: 20,
          codeEditor: {
            enabled: true,
            language: 'javascript',
            starterCode: `class LRUCache {
  constructor(capacity) {
    // Your code here
  }

  get(key) {
    // Your code here
    // Return the value of the key if it exists, otherwise return -1
  }

  put(key, value) {
    // Your code here
    // Update the value of the key if it exists, or add the key-value pair
  }
}`,
            testCases: [
              {
                input: [2, 'put', [1, 1], 'put', [2, 2], 'get', [1], 'put', [3, 3], 'get', [2], 'put', [4, 4], 'get', [1], 'get', [3], 'get', [4]],
                expected: [null, null, 1, null, -1, null, -1, 3, 4],
                description: 'Basic LRU cache operations',
                functionName: 'LRUCache'
              },
              {
                input: [1, 'put', [2, 1], 'get', [2], 'put', [3, 2], 'get', [2], 'get', [3]],
                expected: [null, 1, null, -1, 2],
                description: 'Single capacity cache',
                functionName: 'LRUCache'
              }
            ],
            hints: [
              'Use a combination of HashMap and Doubly Linked List',
              'HashMap provides O(1) access to nodes',
              'Doubly Linked List allows O(1) insertion and deletion',
              'Update the list when accessing or adding elements'
            ],
            expectedTimeComplexity: 'O(1) for both get and put',
            expectedSpaceComplexity: 'O(capacity)'
          }
        }
      ]
    }
  ],
  totalQuestions: 8,
  estimatedDuration: 90,
  skills: ['JavaScript', 'Algorithms', 'Data Structures', 'System Design', 'Problem Solving'],
  requirements: [
    '3+ years of software development experience',
    'Strong problem-solving skills',
    'Experience with web technologies',
    'Knowledge of system design principles'
  ]
};

// Helper function to create a coding-focused interview
export const createCodingFocusedInterview = (title = 'Technical Coding Interview') => {
  return {
    _id: `coding-interview-${Date.now()}`,
    title,
    description: 'Focused coding interview with multiple algorithmic challenges',
    company: 'Tech Company',
    position: 'Software Engineer',
    duration: 60,
    difficulty: 'Medium',
    rounds: [
      createCodingRound('Algorithm Challenges', sampleCodingQuestions.slice(0, 3)),
      createCodingRound('Advanced Problems', sampleCodingQuestions.slice(3, 5))
    ],
    totalQuestions: 5,
    estimatedDuration: 60,
    skills: ['JavaScript', 'Algorithms', 'Data Structures', 'Problem Solving']
  };
};

// Helper function to get interview by difficulty
export const getInterviewByDifficulty = (difficulty) => {
  const interviews = {
    easy: {
      ...sampleInterviewData,
      _id: 'easy-interview',
      title: 'Junior Developer Interview',
      difficulty: 'Easy',
      rounds: [
        createCodingRound('Basic Coding', sampleCodingQuestions.filter(q => q.difficulty === 'Easy'))
      ]
    },
    medium: sampleInterviewData,
    hard: {
      ...sampleInterviewData,
      _id: 'hard-interview',
      title: 'Senior Developer Interview',
      difficulty: 'Hard',
      rounds: [
        createCodingRound('Advanced Algorithms', sampleCodingQuestions.filter(q => q.difficulty === 'Medium')),
        {
          _id: 'round-2',
          title: 'System Architecture',
          description: 'Design complex distributed systems',
          type: 'system-design',
          timeLimit: 30,
          questions: [
            {
              _id: 'sys-design-hard-1',
              question: 'Design a distributed chat application like WhatsApp',
              description: 'Design a real-time messaging system that can handle millions of concurrent users with features like group chats, file sharing, and message delivery status.',
              type: 'system-design',
              timeLimit: 30
            }
          ]
        }
      ]
    }
  };

  return interviews[difficulty.toLowerCase()] || sampleInterviewData;
};

export default sampleInterviewData;
