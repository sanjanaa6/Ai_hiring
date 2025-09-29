// Fallback interview generation when AI fails
const { validateInterviewStructure } = require('./interviewUtils');

// Helper function to create fallback interview when AI parsing fails
const createFallbackInterview = (jobDetails, interviewId) => {
  console.log('🔄 [FALLBACK INTERVIEW] Creating 6-round fallback interview structure...');
  
  // Enhanced role detection that checks both title and description
  const titleLower = jobDetails.title.toLowerCase();
  const descriptionLower = (jobDetails.description || '').toLowerCase();
  
  const isDeveloperRole = titleLower.includes('developer') || 
                         titleLower.includes('engineer') || 
                         titleLower.includes('programmer') ||
                         titleLower.includes('coder') ||
                         titleLower.includes('software') ||
                         titleLower.includes('frontend') ||
                         titleLower.includes('backend') ||
                         titleLower.includes('fullstack') ||
                         titleLower.includes('full-stack') ||
                         descriptionLower.includes('coding') ||
                         descriptionLower.includes('programming') ||
                         descriptionLower.includes('python') ||
                         descriptionLower.includes('java') ||
                         descriptionLower.includes('javascript') ||
                         descriptionLower.includes('react') ||
                         descriptionLower.includes('node') ||
                         descriptionLower.includes('sql') ||
                         descriptionLower.includes('algorithm') ||
                         descriptionLower.includes('data structure');
  
  console.log('🔍 [FALLBACK ROLE DETECTION] Job Title:', jobDetails.title);
  console.log('🔍 [FALLBACK ROLE DETECTION] Is Developer Role:', isDeveloperRole);
  console.log('🔍 [FALLBACK ROLE DETECTION] Description contains coding keywords:', 
    descriptionLower.includes('coding') || descriptionLower.includes('programming') || 
    descriptionLower.includes('python') || descriptionLower.includes('java'));
  
  // Always create 6 rounds
  let rounds = [
    {
      roundId: "round_1",
      roundNumber: 1,
      title: "Introduction & Background",
      description: "Assess candidate's background and motivation for this specific role",
      duration: 15,
      questions: [
        {
          id: "q1_1",
          type: "behavioral",
          question: "Tell me about yourself and your relevant experience for this role.",
          expectedAnswer: "Look for relevant experience and skills",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_2",
          type: "behavioral",
          question: "What interests you about this position?",
          expectedAnswer: "Look for motivation and understanding",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_3",
          type: "behavioral",
          question: "What are your career goals?",
          expectedAnswer: "Look for career planning",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_4",
          type: "behavioral",
          question: "Why do you want to work here?",
          expectedAnswer: "Look for company research",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        },
        {
          id: "q1_5",
          type: "behavioral",
          question: "What questions do you have for us?",
          expectedAnswer: "Look for engagement",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: []
        }
      ],
      evaluationCriteria: {
        background: "Relevant experience and qualifications",
        motivation: "Interest and alignment with the role",
        communication: "Clarity and professionalism"
      }
    },
    {
      roundId: "round_2",
      roundNumber: 2,
      title: isDeveloperRole ? "Coding Challenge & Technical Skills" : "Professional Skills & Knowledge",
      description: isDeveloperRole ? "Assess candidate's programming skills and technical knowledge" : "Assess candidate's technical knowledge and professional skills",
      duration: 15,
      questions: [
        {
          id: "q2_1",
          type: isDeveloperRole ? "coding" : "technical",
          question: isDeveloperRole ? "Write a function to reverse a string in your preferred programming language." : "Describe your technical expertise relevant to this role.",
          expectedAnswer: isDeveloperRole ? "Look for clean, efficient code and proper syntax" : "Look for relevant technical knowledge and skills",
          timeLimit: isDeveloperRole ? 5 : 3,
          difficulty: "easy",
          followUpQuestions: isDeveloperRole ? ["Can you optimize this solution?", "What's the time complexity?"] : ["Can you provide specific examples?", "How do you stay updated with technology?"]
        },
        {
          id: "q2_2",
          type: isDeveloperRole ? "coding" : "technical",
          question: isDeveloperRole ? "Implement a function to find the factorial of a number using recursion." : "What tools and technologies do you use in your work?",
          expectedAnswer: isDeveloperRole ? "Look for correct recursive implementation and base case handling" : "Look for relevant tools and technology stack knowledge",
          timeLimit: isDeveloperRole ? 5 : 3,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["What happens with large numbers?", "Can you implement it iteratively?"] : ["Why do you prefer these tools?", "How do you evaluate new technologies?"]
        },
        {
          id: "q2_3",
          type: "technical",
          question: isDeveloperRole ? "Explain the difference between a stack and a queue with examples." : "How do you approach problem-solving in your field?",
          expectedAnswer: isDeveloperRole ? "Look for clear understanding of data structures and their use cases" : "Look for systematic problem-solving approach",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["When would you use each one?", "Can you implement them?"] : ["Can you give an example?", "How do you handle complex problems?"]
        },
        {
          id: "q2_4",
          type: isDeveloperRole ? "coding" : "technical",
          question: isDeveloperRole ? "Write a function to check if a string is a palindrome." : "What are the key challenges in your field?",
          expectedAnswer: isDeveloperRole ? "Look for efficient algorithm and clean code" : "Look for industry knowledge and awareness of challenges",
          timeLimit: isDeveloperRole ? 5 : 3,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["Can you handle case sensitivity?", "What about spaces and punctuation?"] : ["How do you address these challenges?", "What solutions have you implemented?"]
        },
        {
          id: "q2_5",
          type: "technical",
          question: isDeveloperRole ? "What is the difference between REST and GraphQL APIs?" : "How do you ensure quality in your work?",
          expectedAnswer: isDeveloperRole ? "Look for understanding of API design patterns and their trade-offs" : "Look for quality assurance processes and attention to detail",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["When would you choose one over the other?", "What are the performance implications?"] : ["What quality metrics do you use?", "How do you handle errors or issues?"]
        }
      ],
      evaluationCriteria: {
        technical: isDeveloperRole ? "Programming skills and technical knowledge" : "Technical knowledge and professional skills",
        problemSolving: "Approach to solving problems",
        expertise: "Depth of knowledge in relevant areas"
      }
    },
    {
      roundId: "round_3",
      roundNumber: 3,
      title: isDeveloperRole ? "System Design & Architecture" : "Problem Solving & Scenarios",
      description: isDeveloperRole ? "Assess candidate's system design and architecture knowledge" : "Assess candidate's problem-solving abilities and scenario handling",
      duration: 15,
      questions: [
        {
          id: "q3_1",
          type: isDeveloperRole ? "technical" : "situational",
          question: isDeveloperRole ? "How would you design a URL shortener service like bit.ly?" : "Describe a challenging situation you faced and how you resolved it.",
          expectedAnswer: isDeveloperRole ? "Look for system design thinking and scalability considerations" : "Look for problem-solving approach and resolution skills",
          timeLimit: 5,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["How would you handle scale?", "What about data consistency?"] : ["What did you learn?", "How would you handle it differently?"]
        },
        {
          id: "q3_2",
          type: "situational",
          question: isDeveloperRole ? "How would you handle a system that's experiencing high load?" : "How do you prioritize multiple competing tasks?",
          expectedAnswer: isDeveloperRole ? "Look for performance optimization and scalability strategies" : "Look for prioritization skills and time management",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["What monitoring would you implement?", "How would you prevent this in the future?"] : ["What criteria do you use?", "How do you communicate priorities?"]
        },
        {
          id: "q3_3",
          type: "technical",
          question: isDeveloperRole ? "Explain the CAP theorem and its implications for distributed systems." : "How do you handle ambiguity in requirements?",
          expectedAnswer: isDeveloperRole ? "Look for understanding of distributed systems concepts" : "Look for clarification skills and requirement analysis",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["How do you choose between consistency and availability?", "Give examples of each type of system."] : ["What questions do you ask?", "How do you validate your understanding?"]
        },
        {
          id: "q3_4",
          type: "situational",
          question: isDeveloperRole ? "How would you debug a production issue that's affecting users?" : "Describe a time when you had to work with a difficult team member.",
          expectedAnswer: isDeveloperRole ? "Look for debugging methodology and incident response" : "Look for conflict resolution and teamwork skills",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["How would you prevent similar issues?", "What monitoring would help?"] : ["How did you resolve the conflict?", "What was the outcome?"]
        },
        {
          id: "q3_5",
          type: "technical",
          question: isDeveloperRole ? "How would you implement caching in a web application?" : "How do you stay current with industry trends and best practices?",
          expectedAnswer: isDeveloperRole ? "Look for caching strategies and performance optimization" : "Look for continuous learning and professional development",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["What are the trade-offs?", "How would you handle cache invalidation?"] : ["What resources do you use?", "How do you apply new knowledge?"]
        }
      ],
      evaluationCriteria: {
        problemSolving: "Analytical thinking and problem-solving approach",
        technical: isDeveloperRole ? "System design and architecture knowledge" : "Industry knowledge and best practices",
        communication: "Ability to explain complex concepts clearly"
      }
    },
    {
      roundId: "round_4",
      roundNumber: 4,
      title: "Behavioral & Experience",
      description: "Assess candidate's behavioral competencies and relevant experience",
      duration: 15,
      questions: [
        {
          id: "q4_1",
          type: "behavioral",
          question: "Tell me about a time when you had to learn something new quickly.",
          expectedAnswer: "Look for learning agility and adaptability",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you approach the learning?", "What was the outcome?"]
        },
        {
          id: "q4_2",
          type: "behavioral",
          question: "Describe a situation where you had to work under pressure.",
          expectedAnswer: "Look for stress management and performance under pressure",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you handle the pressure?", "What was the result?"]
        },
        {
          id: "q4_3",
          type: "behavioral",
          question: "Give me an example of a time when you failed and what you learned from it.",
          expectedAnswer: "Look for self-awareness, growth mindset, and learning from failure",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["How did you apply what you learned?", "How has this changed your approach?"]
        },
        {
          id: "q4_4",
          type: "behavioral",
          question: "Tell me about a time when you had to collaborate with a difficult stakeholder.",
          expectedAnswer: "Look for stakeholder management and collaboration skills",
          timeLimit: 3,
          difficulty: "hard",
          followUpQuestions: ["How did you build the relationship?", "What was the final outcome?"]
        },
        {
          id: "q4_5",
          type: "behavioral",
          question: "Describe a project you're particularly proud of and why.",
          expectedAnswer: "Look for passion, ownership, and impact",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["What made it successful?", "What role did you play?"]
        }
      ],
      evaluationCriteria: {
        experience: "Relevant work experience and achievements",
        behavior: "Behavioral competencies and soft skills",
        growth: "Learning and development mindset"
      }
    },
    {
      roundId: "round_5",
      roundNumber: 5,
      title: isDeveloperRole ? "Advanced Technical Assessment" : "Advanced Assessment",
      description: isDeveloperRole ? "Assess candidate's advanced technical skills and knowledge" : "Assess candidate's advanced skills and expertise",
      duration: 15,
      questions: [
        {
          id: "q5_1",
          type: "technical",
          question: isDeveloperRole ? "How would you optimize a slow database query?" : "How do you measure success in your role?",
          expectedAnswer: isDeveloperRole ? "Look for database optimization knowledge and performance tuning" : "Look for metrics understanding and success measurement",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["What tools would you use?", "How would you monitor improvements?"] : ["What KPIs do you track?", "How do you improve performance?"]
        },
        {
          id: "q5_2",
          type: "technical",
          question: isDeveloperRole ? "Explain microservices architecture and its benefits and challenges." : "How do you handle change management in your work?",
          expectedAnswer: isDeveloperRole ? "Look for understanding of modern architecture patterns" : "Look for change management skills and adaptability",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["When would you use microservices?", "How do you handle service communication?"] : ["How do you communicate changes?", "What strategies do you use?"]
        },
        {
          id: "q5_3",
          type: "technical",
          question: isDeveloperRole ? "How would you implement security in a web application?" : "How do you ensure compliance and quality standards?",
          expectedAnswer: isDeveloperRole ? "Look for security best practices and implementation knowledge" : "Look for compliance awareness and quality standards",
          timeLimit: 4,
          difficulty: "hard",
          followUpQuestions: isDeveloperRole ? ["What are common vulnerabilities?", "How do you test security?"] : ["What standards do you follow?", "How do you audit compliance?"]
        },
        {
          id: "q5_4",
          type: "technical",
          question: isDeveloperRole ? "How would you handle data migration between systems?" : "How do you manage risk in your projects?",
          expectedAnswer: isDeveloperRole ? "Look for data migration strategies and risk management" : "Look for risk assessment and mitigation strategies",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["How do you ensure data integrity?", "What about rollback strategies?"] : ["What types of risks do you consider?", "How do you communicate risks?"]
        },
        {
          id: "q5_5",
          type: "technical",
          question: isDeveloperRole ? "How would you implement CI/CD for a development team?" : "How do you drive innovation in your work?",
          expectedAnswer: isDeveloperRole ? "Look for DevOps knowledge and automation understanding" : "Look for innovation mindset and creative thinking",
          timeLimit: 4,
          difficulty: "medium",
          followUpQuestions: isDeveloperRole ? ["What tools would you use?", "How do you handle testing?"] : ["What innovations have you introduced?", "How do you encourage creativity?"]
        }
      ],
      evaluationCriteria: {
        advanced: isDeveloperRole ? "Advanced technical skills and knowledge" : "Advanced skills and expertise",
        depth: "Depth of understanding and expertise",
        innovation: "Innovation and continuous improvement mindset"
      }
    },
    {
      roundId: "round_6",
      roundNumber: 6,
      title: "Final Evaluation & Cultural Fit",
      description: "Final assessment and cultural fit evaluation",
      duration: 15,
      questions: [
        {
          id: "q6_1",
          type: "behavioral",
          question: "What motivates you in your work?",
          expectedAnswer: "Look for intrinsic motivation and alignment with role",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["How does this role align with your motivations?", "What would make this role exciting for you?"]
        },
        {
          id: "q6_2",
          type: "behavioral",
          question: "How do you handle feedback and criticism?",
          expectedAnswer: "Look for openness to feedback and growth mindset",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give an example?", "How do you apply feedback?"]
        },
        {
          id: "q6_3",
          type: "behavioral",
          question: "What are your expectations from this role and company?",
          expectedAnswer: "Look for realistic expectations and alignment",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["How do you see yourself growing here?", "What support do you need?"]
        },
        {
          id: "q6_4",
          type: "behavioral",
          question: "How do you contribute to team culture and collaboration?",
          expectedAnswer: "Look for teamwork and cultural contribution",
          timeLimit: 3,
          difficulty: "medium",
          followUpQuestions: ["Can you give specific examples?", "How do you handle team conflicts?"]
        },
        {
          id: "q6_5",
          type: "behavioral",
          question: "Is there anything else you'd like us to know about you?",
          expectedAnswer: "Look for additional relevant information and enthusiasm",
          timeLimit: 3,
          difficulty: "easy",
          followUpQuestions: ["What makes you unique for this role?", "Any final thoughts?"]
        }
      ],
      evaluationCriteria: {
        culture: "Cultural fit and team alignment",
        motivation: "Motivation and enthusiasm for the role",
        overall: "Overall impression and potential"
      }
    }
  ];
  
  return {
    interviewId: interviewId,
    title: `AI Multi-Round Interview - ${jobDetails.title}`,
    totalDuration: 90,
    rounds: rounds,
    overallEvaluationCriteria: {
      technical: "Overall technical competency and problem-solving skills",
      communication: "Clarity of communication and articulation abilities",
      experience: "Relevance and depth of professional experience",
      culture: "Cultural fit and team alignment"
    },
    scoringSystem: {
      excellent: "4",
      good: "3",
      satisfactory: "2",
      needsImprovement: "1"
    },
    company: jobDetails.company
  };
};

module.exports = {
  createFallbackInterview
};
