// Sample non-developer interviews to test that test cases don't appear

export const sampleNonDeveloperInterviews = [
  {
    _id: 'sales-interview-001',
    title: 'Sales Representative Interview',
    description: 'Interview for sales position focusing on communication and selling skills',
    company: 'SalesCorp Inc.',
    position: 'Sales Representative',
    duration: 45,
    difficulty: 'Medium',
    rounds: [
      {
        _id: 'round-1',
        title: 'Sales Skills Assessment',
        description: 'Evaluate sales techniques and communication skills',
        type: 'sales',
        timeLimit: 20,
        questions: [
          {
            _id: 'sales-1',
            question: 'How would you approach a potential client who seems uninterested?',
            description: 'Describe your strategy for engaging with difficult prospects.',
            type: 'behavioral',
            timeLimit: 10
          },
          {
            _id: 'sales-2',
            question: 'Tell me about a time you closed a difficult sale.',
            description: 'Share a specific example of overcoming objections and closing a deal.',
            type: 'behavioral',
            timeLimit: 10
          }
        ]
      },
      {
        _id: 'round-2',
        title: 'Product Knowledge',
        description: 'Test understanding of our products and services',
        type: 'knowledge',
        timeLimit: 15,
        questions: [
          {
            _id: 'product-1',
            question: 'Explain our main product features to a potential customer.',
            description: 'Demonstrate your product knowledge and communication skills.',
            type: 'presentation',
            timeLimit: 15
          }
        ]
      }
    ],
    totalQuestions: 3,
    estimatedDuration: 45,
    skills: ['Communication', 'Sales', 'Customer Service', 'Product Knowledge']
  },
  {
    _id: 'marketing-interview-001',
    title: 'Marketing Manager Interview',
    description: 'Interview for marketing position focusing on strategy and creativity',
    company: 'MarketingPro Ltd.',
    position: 'Marketing Manager',
    duration: 60,
    difficulty: 'Medium',
    rounds: [
      {
        _id: 'round-1',
        title: 'Marketing Strategy',
        description: 'Discuss marketing strategies and campaign planning',
        type: 'strategy',
        timeLimit: 25,
        questions: [
          {
            _id: 'strategy-1',
            question: 'How would you launch a new product in a competitive market?',
            description: 'Outline your marketing strategy and key tactics.',
            type: 'strategic',
            timeLimit: 15
          },
          {
            _id: 'strategy-2',
            question: 'Describe your experience with digital marketing campaigns.',
            description: 'Share examples of successful digital marketing initiatives.',
            type: 'experience',
            timeLimit: 10
          }
        ]
      },
      {
        _id: 'round-2',
        title: 'Creative Thinking',
        description: 'Evaluate creative problem-solving abilities',
        type: 'creative',
        timeLimit: 20,
        questions: [
          {
            _id: 'creative-1',
            question: 'Create a marketing campaign for a boring product like paper clips.',
            description: 'Show your creativity in making mundane products interesting.',
            type: 'creative',
            timeLimit: 20
          }
        ]
      }
    ],
    totalQuestions: 3,
    estimatedDuration: 60,
    skills: ['Marketing Strategy', 'Digital Marketing', 'Creativity', 'Analytics']
  },
  {
    _id: 'hr-interview-001',
    title: 'HR Specialist Interview',
    description: 'Interview for human resources position focusing on people management',
    company: 'PeopleFirst Corp.',
    position: 'HR Specialist',
    duration: 50,
    difficulty: 'Medium',
    rounds: [
      {
        _id: 'round-1',
        title: 'HR Knowledge',
        description: 'Test knowledge of HR policies and procedures',
        type: 'knowledge',
        timeLimit: 20,
        questions: [
          {
            _id: 'hr-1',
            question: 'How would you handle an employee complaint about discrimination?',
            description: 'Walk through your process for handling sensitive HR issues.',
            type: 'scenario',
            timeLimit: 10
          },
          {
            _id: 'hr-2',
            question: 'Describe your approach to employee onboarding.',
            description: 'Explain how you would create an effective onboarding process.',
            type: 'process',
            timeLimit: 10
          }
        ]
      },
      {
        _id: 'round-2',
        title: 'Conflict Resolution',
        description: 'Evaluate skills in handling workplace conflicts',
        type: 'behavioral',
        timeLimit: 15,
        questions: [
          {
            _id: 'conflict-1',
            question: 'How would you mediate a conflict between two team members?',
            description: 'Describe your mediation process and conflict resolution skills.',
            type: 'scenario',
            timeLimit: 15
          }
        ]
      }
    ],
    totalQuestions: 3,
    estimatedDuration: 50,
    skills: ['HR Policies', 'Conflict Resolution', 'Employee Relations', 'Communication']
  }
];

// Helper function to get a random non-developer interview
export const getRandomNonDeveloperInterview = () => {
  const randomIndex = Math.floor(Math.random() * sampleNonDeveloperInterviews.length);
  return sampleNonDeveloperInterviews[randomIndex];
};

export default sampleNonDeveloperInterviews;
