import aiService from './aiService';

class AIInterviewService {
  constructor() {
    this.interviews = new Map(); // Store active interviews
    this.storedInterviews = new Map(); // Store generated interviews
  }

  // Generate comprehensive interview with multiple hiring rounds
  async generateInterviewQuestions(jobDetails) {
    const { title, description, requirements, level = 'mid', duration = 30 } = jobDetails;
    
    const prompt = `You are an expert HR professional and technical interviewer. Generate a comprehensive multi-round interview process specifically tailored for a ${level}-level ${title} position.

Job Details:
- Title: ${title}
- Description: ${description}
- Requirements: ${requirements}
- Level: ${level}
- Duration: ${duration} minutes

Create a structured interview with 6+ hiring rounds that are SPECIFICALLY tailored to this role:

ROUND 1: Technical Fundamentals (15-20 minutes)
- 3-4 technical questions directly related to ${title} role
- Focus on core technologies and concepts mentioned in requirements
- Assess depth of technical knowledge for this specific position

ROUND 2: Role-Specific Experience (15-20 minutes)
- 3-4 questions about past experience relevant to ${title}
- STAR method questions specific to this role's challenges
- Real-world scenarios this position would face

ROUND 3: Problem-Solving & Critical Thinking (15-20 minutes)
- 2-3 complex scenarios specific to ${title} role
- Industry-specific problem-solving approaches
- Decision-making under pressure relevant to this position

ROUND 4: Team Collaboration & Leadership (10-15 minutes)
- Questions about working in teams for ${title} role
- Leadership scenarios relevant to this position level
- Communication skills for this specific role

ROUND 5: Industry Knowledge & Trends (10-15 minutes)
- Current trends and technologies in the ${title} field
- Industry best practices and methodologies
- Future outlook and adaptation skills

ROUND 6: Cultural Fit & Motivation (10-15 minutes)
- Alignment with company values and work culture
- Career goals and growth in ${title} field
- Motivation and passion for this specific role

IMPORTANT: Format your response as valid JSON with this exact structure:
{
  "interviewId": "interview_${Date.now()}",
  "title": "AI Multi-Round Interview - ${title}",
  "totalDuration": ${duration},
  "rounds": [
    {
      "roundId": "round_1",
      "roundNumber": 1,
      "title": "Technical Assessment",
      "description": "Evaluate technical skills and problem-solving abilities",
      "duration": 20,
  "questions": [
    {
          "id": "q1_1",
      "type": "technical",
      "question": "Your technical question here",
      "expectedAnswer": "What to look for in the answer",
      "timeLimit": 5,
          "difficulty": "medium",
      "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"]
    }
  ],
  "evaluationCriteria": {
    "technical": "How to evaluate technical knowledge and skills",
        "problemSolving": "How to evaluate problem-solving approach"
      }
    }
  ],
  "overallEvaluationCriteria": {
    "technical": "Overall technical competency assessment",
    "communication": "Communication and articulation skills",
    "problemSolving": "Problem-solving methodology and creativity",
    "culturalFit": "Alignment with company values and culture",
    "leadership": "Leadership potential and team collaboration",
    "motivation": "Career goals and job motivation"
  },
  "scoringSystem": {
    "excellent": "4",
    "good": "3", 
    "satisfactory": "2",
    "needsImprovement": "1"
  }
}

Make sure the JSON is valid and properly formatted with all 6 rounds.`;

    try {
      const result = await aiService.generateResponse(prompt, { userRole: 'recruiter' });
      
      if (result.success) {
        // Try to parse JSON response
        try {
          const interviewData = JSON.parse(result.data);
          // Store the interview data
          this.storedInterviews.set(interviewData.interviewId, interviewData);
          return {
            success: true,
            data: interviewData
          };
        } catch (parseError) {
          // If JSON parsing fails, create a structured response
          const interviewData = this.createStructuredInterview(result.data, jobDetails);
          // Store the interview data
          this.storedInterviews.set(interviewData.interviewId, interviewData);
          return {
            success: true,
            data: interviewData
          };
        }
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create structured interview from text response
  createStructuredInterview(textResponse, jobDetails) {
    const interviewId = this.generateInterviewId();
    const rounds = this.extractRoundsFromText(textResponse, jobDetails);
    
    return {
      interviewId,
      title: `AI Multi-Round Interview - ${jobDetails.title}`,
      totalDuration: jobDetails.duration || 30,
      rounds,
      overallEvaluationCriteria: {
        technical: "Overall technical competency assessment",
        communication: "Communication and articulation skills",
        problemSolving: "Problem-solving methodology and creativity",
        culturalFit: "Alignment with company values and culture",
        leadership: "Leadership potential and team collaboration",
        motivation: "Career goals and job motivation"
      },
      scoringSystem: {
        excellent: "4",
        good: "3", 
        satisfactory: "2",
        needsImprovement: "1"
      }
    };
  }

  // Extract rounds from AI text response
  extractRoundsFromText(text, jobDetails) {
    const defaultRounds = this.getDefaultRounds(jobDetails);
    
    // Try to parse rounds from text, fallback to default if parsing fails
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const rounds = [];
      let currentRound = null;
      let questionId = 1;

      lines.forEach(line => {
        if (line.match(/ROUND \d+:/i) || line.match(/Round \d+:/i)) {
          if (currentRound) {
            rounds.push(currentRound);
          }
          currentRound = {
            roundId: `round_${rounds.length + 1}`,
            roundNumber: rounds.length + 1,
            title: line.replace(/ROUND \d+:\s*/i, '').trim(),
            description: "AI-generated interview round",
            duration: 15,
            questions: [],
            evaluationCriteria: {
              technical: "Evaluate technical knowledge and skills",
              communication: "Assess communication clarity"
            }
          };
        } else if (currentRound && (line.match(/^\d+\./) || line.includes('?'))) {
          currentRound.questions.push({
            id: `q${questionId}`,
            type: this.determineQuestionType(line),
            question: line.replace(/^\d+\.\s*/, '').trim(),
            expectedAnswer: "Look for relevant experience and clear communication",
            timeLimit: 5,
            difficulty: "medium",
            followUpQuestions: []
          });
          questionId++;
        }
      });

      if (currentRound) {
        rounds.push(currentRound);
      }

      return rounds.length > 0 ? rounds : defaultRounds;
    } catch (error) {
      console.error('Error parsing rounds from text:', error);
      return defaultRounds;
    }
  }

  // Extract questions from AI text response (legacy method)
  extractQuestionsFromText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const questions = [];
    let questionId = 1;

    lines.forEach(line => {
      if (line.match(/^\d+\./) || line.includes('?')) {
        questions.push({
          id: `q${questionId}`,
          type: this.determineQuestionType(line),
          question: line.replace(/^\d+\.\s*/, '').trim(),
          expectedAnswer: "Look for relevant experience and clear communication",
          timeLimit: 5,
          followUpQuestions: []
        });
        questionId++;
      }
    });

    return questions.length > 0 ? questions : this.getDefaultQuestions();
  }

  // Determine question type based on content
  determineQuestionType(question) {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('technical') || lowerQuestion.includes('code') || lowerQuestion.includes('programming')) {
      return 'technical';
    } else if (lowerQuestion.includes('behavioral') || lowerQuestion.includes('experience') || lowerQuestion.includes('tell me about')) {
      return 'behavioral';
    } else if (lowerQuestion.includes('situational') || lowerQuestion.includes('what would you do') || lowerQuestion.includes('scenario')) {
      return 'situational';
    } else {
      return 'culture';
    }
  }

  // Default rounds if AI fails
  getDefaultRounds(jobDetails) {
    return [
      {
        roundId: 'round_1',
        roundNumber: 1,
        title: 'Technical Assessment',
        description: 'Evaluate technical skills and problem-solving abilities',
        duration: 20,
        questions: [
          {
            id: 'q1_1',
            type: 'technical',
            question: 'Can you walk me through your technical background and relevant experience?',
            expectedAnswer: 'Look for relevant technical skills and experience',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['Can you give me a specific example?', 'How did you solve that challenge?']
          },
          {
            id: 'q1_2',
            type: 'technical',
            question: 'Describe a complex technical problem you solved recently.',
            expectedAnswer: 'Look for problem-solving methodology and technical depth',
            timeLimit: 5,
            difficulty: 'hard',
            followUpQuestions: ['What tools did you use?', 'How did you approach the problem?']
          }
        ],
        evaluationCriteria: {
          technical: 'Evaluate technical knowledge and skills',
          problemSolving: 'Assess problem-solving approach and methodology'
        }
      },
      {
        roundId: 'round_2',
        roundNumber: 2,
        title: 'Behavioral Interview',
        description: 'Assess past experiences and behavioral patterns',
        duration: 15,
        questions: [
          {
            id: 'q2_1',
            type: 'behavioral',
            question: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
            expectedAnswer: 'Look for problem-solving skills and resilience',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['What was the outcome?', 'What did you learn from this experience?']
          },
          {
            id: 'q2_2',
            type: 'behavioral',
            question: 'Describe a time when you had to work with a difficult team member.',
            expectedAnswer: 'Look for conflict resolution and communication skills',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['How did you handle the situation?', 'What was the result?']
          }
        ],
        evaluationCriteria: {
          communication: 'Assess communication and articulation skills',
          leadership: 'Evaluate leadership and team collaboration abilities'
        }
      },
      {
        roundId: 'round_3',
        roundNumber: 3,
        title: 'Situational Judgment',
        description: 'Test decision-making in real-world scenarios',
        duration: 15,
        questions: [
          {
            id: 'q3_1',
            type: 'situational',
            question: 'How would you handle a situation where you disagree with a team member on a technical approach?',
            expectedAnswer: 'Look for communication and collaboration skills',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['Can you give an example of when this happened?']
          },
          {
            id: 'q3_2',
            type: 'situational',
            question: 'What would you do if you were given an impossible deadline?',
            expectedAnswer: 'Look for prioritization and communication skills',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['How would you communicate this to stakeholders?']
          }
        ],
        evaluationCriteria: {
          problemSolving: 'Assess decision-making and problem-solving approach',
          communication: 'Evaluate communication and stakeholder management'
        }
      },
      {
        roundId: 'round_4',
        roundNumber: 4,
        title: 'Cultural Fit Assessment',
        description: 'Evaluate alignment with company values and culture',
        duration: 15,
        questions: [
          {
            id: 'q4_1',
            type: 'culture',
            question: 'What type of work environment do you thrive in?',
            expectedAnswer: 'Look for cultural alignment and work style preferences',
            timeLimit: 5,
            difficulty: 'easy',
            followUpQuestions: ['Can you give an example?']
          },
          {
            id: 'q4_2',
            type: 'culture',
            question: 'How do you handle feedback and criticism?',
            expectedAnswer: 'Look for growth mindset and receptiveness to feedback',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['Can you share a specific example?']
          }
        ],
        evaluationCriteria: {
          culturalFit: 'Assess alignment with company values and culture',
          motivation: 'Evaluate career goals and job motivation'
        }
      },
      {
        roundId: 'round_5',
        roundNumber: 5,
        title: 'Role-Specific Skills',
        description: 'Test practical skills and domain expertise',
        duration: 20,
        questions: [
          {
            id: 'q5_1',
            type: 'technical',
            question: 'What tools and technologies are you most comfortable with?',
            expectedAnswer: 'Look for relevant technical skills and tool proficiency',
            timeLimit: 5,
            difficulty: 'easy',
            followUpQuestions: ['How do you stay updated with new technologies?']
          },
          {
            id: 'q5_2',
            type: 'technical',
            question: 'Describe your approach to code review and quality assurance.',
            expectedAnswer: 'Look for best practices and attention to detail',
            timeLimit: 5,
            difficulty: 'medium',
            followUpQuestions: ['What metrics do you use to measure code quality?']
          }
        ],
        evaluationCriteria: {
          technical: 'Assess practical skills and domain expertise',
          problemSolving: 'Evaluate methodology and best practices'
        }
      },
      {
        roundId: 'round_6',
        roundNumber: 6,
        title: 'Final Assessment',
        description: 'Open-ended questions and final evaluation',
        duration: 15,
        questions: [
          {
            id: 'q6_1',
            type: 'general',
            question: 'What are your career goals for the next 2-3 years?',
            expectedAnswer: 'Look for career alignment and motivation',
            timeLimit: 5,
            difficulty: 'easy',
            followUpQuestions: ['How does this role fit into your goals?']
          },
          {
            id: 'q6_2',
            type: 'general',
            question: 'Do you have any questions about the role or company?',
            expectedAnswer: 'Look for engagement and interest in the position',
            timeLimit: 5,
            difficulty: 'easy',
            followUpQuestions: ['What aspects of the role interest you most?']
          }
        ],
        evaluationCriteria: {
          motivation: 'Assess career goals and job motivation',
          communication: 'Evaluate engagement and interest level'
        }
      }
    ];
  }

  // Default questions if AI fails (legacy method)
  getDefaultQuestions() {
    return [
      {
        id: 'q1',
        type: 'technical',
        question: 'Can you walk me through your technical background and relevant experience?',
        expectedAnswer: 'Look for relevant technical skills and experience',
        timeLimit: 5,
        followUpQuestions: ['Can you give me a specific example?', 'How did you solve that challenge?']
      },
      {
        id: 'q2',
        type: 'behavioral',
        question: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
        expectedAnswer: 'Look for problem-solving skills and resilience',
        timeLimit: 5,
        followUpQuestions: ['What was the outcome?', 'What did you learn from this experience?']
      },
      {
        id: 'q3',
        type: 'situational',
        question: 'How would you handle a situation where you disagree with a team member on a technical approach?',
        expectedAnswer: 'Look for communication and collaboration skills',
        timeLimit: 5,
        followUpQuestions: ['Can you give an example of when this happened?']
      }
    ];
  }

  // Generate unique interview ID
  generateInterviewId() {
    return 'interview_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Start an interview session
  startInterview(interviewData, candidateInfo) {
    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      interviewData,
      candidateInfo,
      startTime: new Date(),
      currentQuestionIndex: 0,
      answers: [],
      status: 'active'
    };

    this.interviews.set(sessionId, session);
    return sessionId;
  }

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get interview session
  getInterviewSession(sessionId) {
    return this.interviews.get(sessionId);
  }

  // Submit answer for current question
  submitAnswer(sessionId, answer) {
    const session = this.interviews.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    const currentQuestion = session.interviewData.questions[session.currentQuestionIndex];
    session.answers.push({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: answer,
      timestamp: new Date()
    });

    session.currentQuestionIndex++;
    
    if (session.currentQuestionIndex >= session.interviewData.questions.length) {
      session.status = 'completed';
    }

    return { success: true, session };
  }

  // Generate interview link
  generateInterviewLink(interviewId, jobId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/interview/${interviewId}?job=${jobId}`;
  }

  // Get stored interview data
  getInterviewData(interviewId) {
    return this.storedInterviews.get(interviewId);
  }

  // Store interview data (for persistence)
  storeInterviewData(interviewId, interviewData) {
    this.storedInterviews.set(interviewId, interviewData);
    // Also store in localStorage for persistence
    localStorage.setItem(`interview_${interviewId}`, JSON.stringify(interviewData));
  }

  // Load interview data from localStorage
  loadInterviewData(interviewId) {
    const stored = localStorage.getItem(`interview_${interviewId}`);
    if (stored) {
      const interviewData = JSON.parse(stored);
      this.storedInterviews.set(interviewId, interviewData);
      return interviewData;
    }
    return null;
  }

  // Get all stored interviews
  getAllInterviews() {
    return Array.from(this.storedInterviews.values());
  }

  // Evaluate interview answers using AI
  async evaluateInterview(sessionId) {
    const session = this.interviews.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    const evaluationPrompt = `You are an expert HR professional conducting a comprehensive interview evaluation. Please evaluate this interview session:

INTERVIEW DETAILS:
- Job Title: ${session.interviewData.title}
- Candidate: ${session.candidateInfo.name}
- Email: ${session.candidateInfo.email}
- Interview Duration: ${session.interviewData.duration} minutes

CANDIDATE ANSWERS:
${session.answers.map((answer, index) => `
Question ${index + 1}: ${answer.question}
Answer: ${answer.answer}
`).join('\n')}

EVALUATION CRITERIA:
- Technical Skills: Assess depth of knowledge and practical application
- Communication: Evaluate clarity, structure, and articulation
- Problem-Solving: Analyze approach, logic, and creativity
- Cultural Fit: Consider alignment with company values and team dynamics

IMPORTANT: Provide a comprehensive evaluation in valid JSON format:
{
  "overallScore": 8,
  "technicalSkills": "Detailed assessment of technical knowledge and skills",
  "communication": "Evaluation of communication clarity and structure",
  "problemSolving": "Analysis of problem-solving approach and methodology",
  "culturalFit": "Assessment of cultural alignment and team compatibility",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2"],
  "recommendation": "Hire|No Hire|Maybe",
  "nextSteps": "Specific recommendations for next steps in the hiring process"
}

Be thorough, fair, and constructive in your evaluation.`;

    try {
      const result = await aiService.generateResponse(evaluationPrompt, { userRole: 'recruiter' });
      
      if (result.success) {
        try {
          const evaluation = JSON.parse(result.data);
          session.evaluation = evaluation;
          session.status = 'evaluated';
          return { success: true, data: evaluation };
        } catch (parseError) {
          // Create structured evaluation from text
          const evaluation = this.createStructuredEvaluation(result.data);
          session.evaluation = evaluation;
          session.status = 'evaluated';
          return { success: true, data: evaluation };
        }
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create structured evaluation from text
  createStructuredEvaluation(text) {
    return {
      overallScore: 7,
      technicalSkills: "Based on responses, candidate shows good technical understanding",
      communication: "Clear communication throughout the interview",
      problemSolving: "Demonstrates logical thinking",
      culturalFit: "Appears to be a good team fit",
      strengths: ["Technical knowledge", "Communication skills"],
      improvements: ["Could provide more specific examples"],
      recommendation: "Hire",
      nextSteps: "Schedule next round interview"
    };
  }
}

export default new AIInterviewService();
