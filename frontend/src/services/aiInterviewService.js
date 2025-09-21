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

  // Evaluate a single round (for real-time feedback)
  async evaluateRound(sessionId, roundId) {
    const session = this.interviews.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    const roundAnswers = session.answers.filter(answer => answer.roundId === roundId);
    if (roundAnswers.length === 0) return { success: false, error: 'No answers found for this round' };

    const roundData = session.interviewData.rounds.find(round => round.roundId === roundId);
    if (!roundData) return { success: false, error: 'Round not found' };

    // Calculate round metrics
    const totalQuestions = roundData.questions.length;
    const answeredQuestions = roundAnswers.length;
    const participationRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    const completeAnswers = roundAnswers.filter(answer => 
      answer.answer && answer.answer.trim().length > 10
    ).length;
    const completenessRate = answeredQuestions > 0 ? (completeAnswers / answeredQuestions) * 100 : 0;

    const avgResponseTime = roundAnswers.length > 0 
      ? roundAnswers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0) / roundAnswers.length 
      : 0;

    const evaluationPrompt = `You are an expert interviewer providing comprehensive feedback for a single interview round. Analyze the candidate's performance and provide detailed evaluation.

ROUND DETAILS:
- Round: ${roundData.title}
- Description: ${roundData.description}
- Total Questions: ${totalQuestions}
- Questions Answered: ${answeredQuestions}
- Participation Rate: ${participationRate.toFixed(1)}%
- Answer Completeness: ${completenessRate.toFixed(1)}%
- Average Response Time: ${avgResponseTime.toFixed(1)} seconds

CANDIDATE ANSWERS (TRANSCRIPTIONS):
${roundAnswers.map((answer, index) => `
Question ${index + 1}: ${answer.question}
Answer: ${answer.answer || '[No answer provided]'}
Time Spent: ${answer.timeSpent || 0} seconds
`).join('\n')}

EVALUATION CRITERIA - Please evaluate each aspect on a scale of 1-10:

1. TECHNICAL COMPETENCY (1-10):
   - Depth of technical knowledge demonstrated
   - Accuracy of technical concepts
   - Practical application of skills
   - Problem-solving methodology

2. COMMUNICATION SKILLS (1-10):
   - Clarity and articulation
   - Vocabulary and language proficiency
   - Structure and organization of responses
   - Professional communication style

3. PROBLEM-SOLVING ABILITY (1-10):
   - Logical thinking and reasoning
   - Creative approaches to challenges
   - Decision-making process
   - Analytical skills

4. ENGAGEMENT & MOTIVATION (1-10):
   - Enthusiasm and interest level
   - Initiative in responses
   - Career goals alignment
   - Learning mindset

5. RESPONSE QUALITY (1-10):
   - Completeness of answers
   - Relevance to questions
   - Specific examples provided
   - Professional presentation

IMPORTANT: Provide a comprehensive round evaluation in valid JSON format:
{
  "roundScore": 75,
  "scores": {
    "technical": 8,
    "communication": 7,
    "problemSolving": 8,
    "engagement": 6,
    "responseQuality": 6
  },
  "feedback": "Detailed assessment of this round's performance with specific examples from responses",
  "strengths": [
    "Specific strength 1 with example from their answer",
    "Specific strength 2 with example from their answer"
  ],
  "improvements": [
    "Specific area 1 with actionable advice",
    "Specific area 2 with actionable advice"
  ],
  "nextRoundAdvice": "Specific advice for the next round based on this performance",
  "participationMetrics": {
    "questionsAnswered": ${answeredQuestions},
    "participationRate": ${participationRate.toFixed(1)},
    "avgResponseTime": ${avgResponseTime.toFixed(1)},
    "completenessRate": ${completenessRate.toFixed(1)}
  },
  "roundSummary": "Brief summary of overall round performance"
}

CRITICAL EVALUATION GUIDELINES:
- Score based on ACTUAL performance, not participation alone
- If candidate didn't answer questions, reflect this in low scores
- Provide specific examples from their responses
- Be constructive but honest in feedback
- Consider the round requirements and expectations
- Factor in response time and engagement level

Be thorough, fair, and constructive in your evaluation.`;

    try {
      const result = await aiService.generateResponse(evaluationPrompt, { userRole: 'recruiter' });
      
      if (result.success) {
        try {
          return { success: true, data: JSON.parse(result.data) };
        } catch (parseError) {
          // Create structured evaluation from text
          const evaluation = this.createStructuredRoundEvaluation(roundAnswers, roundData, participationRate, completenessRate, avgResponseTime);
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

  // Create structured round evaluation from text
  createStructuredRoundEvaluation(roundAnswers, roundData, participationRate, completenessRate, avgResponseTime) {
    // Determine round score based on participation and completeness
    let roundScore = 50; // Base score
    if (participationRate >= 80) roundScore += 20;
    else if (participationRate >= 60) roundScore += 10;
    else if (participationRate >= 40) roundScore += 5;
    
    if (completenessRate >= 80) roundScore += 15;
    else if (completenessRate >= 60) roundScore += 10;
    else if (completenessRate >= 40) roundScore += 5;

    return {
      roundScore: Math.min(roundScore, 100),
      scores: {
        technical: Math.max(3, Math.floor(roundScore / 12)),
        communication: Math.max(3, Math.floor(roundScore / 12)),
        problemSolving: Math.max(3, Math.floor(roundScore / 12)),
        engagement: Math.max(2, Math.floor(roundScore / 15)),
        responseQuality: Math.max(2, Math.floor(roundScore / 15))
      },
      feedback: participationRate < 50 ? 
        "Limited responses provided in this round. Unable to fully assess performance due to low participation." : 
        "Round completed with adequate responses. Performance shows room for improvement in providing more detailed answers.",
      strengths: participationRate >= 60 ? [
        "Completed round questions",
        "Provided relevant responses"
      ] : [
        "Attempted to participate in round"
      ],
      improvements: [
        participationRate < 50 ? "Complete all round questions" : "Provide more detailed responses",
        completenessRate < 50 ? "Give more comprehensive answers" : "Include specific examples",
        "Demonstrate deeper knowledge in responses"
      ],
      nextRoundAdvice: participationRate < 50 ? 
        "Focus on completing all questions in the next round" : 
        "Continue providing detailed responses with specific examples",
      participationMetrics: {
        questionsAnswered: roundAnswers.length,
        participationRate: participationRate.toFixed(1),
        avgResponseTime: avgResponseTime.toFixed(1),
        completenessRate: completenessRate.toFixed(1)
      },
      roundSummary: `Round: ${roundData.title} - ${participationRate.toFixed(1)}% participation, ${completenessRate.toFixed(1)}% completeness`
    };
  }

  // Evaluate interview answers using AI
  async evaluateInterview(sessionId) {
    const session = this.interviews.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    // Calculate participation metrics
    const totalQuestions = (session.interviewData.rounds?.length || 0) * 5; // Always 5 questions per round
    const answeredQuestions = session.answers.length;
    const participationRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    // Calculate average response time
    const avgResponseTime = session.answers.length > 0 
      ? session.answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0) / session.answers.length 
      : 0;

    // Calculate answer completeness (non-empty answers)
    const completeAnswers = session.answers.filter(answer => 
      answer.answer && answer.answer.trim().length > 10
    ).length;
    const completenessRate = answeredQuestions > 0 ? (completeAnswers / answeredQuestions) * 100 : 0;

    const evaluationPrompt = `You are an expert HR professional and technical interviewer conducting a comprehensive interview evaluation. Please evaluate this interview session with detailed analysis:

INTERVIEW DETAILS:
- Job Title: ${session.interviewData.title}
- Candidate: ${session.candidateInfo.name}
- Email: ${session.candidateInfo.email}
- Interview Duration: ${session.interviewData.duration} minutes
- Total Questions: ${totalQuestions}
- Questions Answered: ${answeredQuestions}
- Participation Rate: ${participationRate.toFixed(1)}%
- Average Response Time: ${avgResponseTime.toFixed(1)} seconds
- Answer Completeness: ${completenessRate.toFixed(1)}%

CANDIDATE ANSWERS:
${session.answers.map((answer, index) => `
Question ${index + 1}: ${answer.question}
Answer: ${answer.answer || '[No answer provided]'}
Time Spent: ${answer.timeSpent || 0} seconds
`).join('\n')}

EVALUATION CRITERIA - Please evaluate each aspect on a scale of 1-10:

1. TECHNICAL COMPETENCY (1-10):
   - Depth of technical knowledge demonstrated
   - Accuracy of technical concepts
   - Practical application of skills
   - Problem-solving methodology

2. COMMUNICATION SKILLS (1-10):
   - Clarity and articulation
   - Vocabulary and language proficiency
   - Structure and organization of responses
   - Professional communication style

3. PROBLEM-SOLVING ABILITY (1-10):
   - Logical thinking and reasoning
   - Creative approaches to challenges
   - Decision-making process
   - Analytical skills

4. ENGAGEMENT & MOTIVATION (1-10):
   - Enthusiasm and interest level
   - Initiative in responses
   - Career goals alignment
   - Learning mindset

5. CULTURAL FIT (1-10):
   - Team collaboration potential
   - Work style compatibility
   - Values alignment
   - Adaptability

6. RESPONSE QUALITY (1-10):
   - Completeness of answers
   - Relevance to questions
   - Specific examples provided
   - Professional presentation

CRITICAL: You MUST respond with ONLY valid JSON in this exact format. Do not include any text before or after the JSON:

{
  "overallScore": 75,
  "scores": {
    "technical": 8,
    "communication": 7,
    "problemSolving": 8,
    "engagement": 6,
    "culturalFit": 7,
    "responseQuality": 6
  },
  "detailedFeedback": {
    "technical": "Detailed assessment of technical knowledge and skills with specific examples from their responses",
    "communication": "Evaluation of communication clarity, vocabulary, and articulation with specific observations",
    "problemSolving": "Analysis of problem-solving approach and methodology with examples from their answers",
    "engagement": "Assessment of enthusiasm, motivation, and career alignment based on their responses",
    "culturalFit": "Evaluation of team compatibility and work style fit based on their answers",
    "responseQuality": "Analysis of answer completeness, relevance, and professional presentation"
  },
  "strengths": [
    "Specific strength 1 with example from their response",
    "Specific strength 2 with example from their response",
    "Specific strength 3 with example from their response"
  ],
  "areasForImprovement": [
    "Specific area 1 with actionable advice based on their performance",
    "Specific area 2 with actionable advice based on their performance",
    "Specific area 3 with actionable advice based on their performance"
  ],
  "participationMetrics": {
    "questionsAnswered": ${answeredQuestions},
    "participationRate": ${participationRate.toFixed(1)},
    "avgResponseTime": ${avgResponseTime.toFixed(1)},
    "completenessRate": ${completenessRate.toFixed(1)}
  },
  "recommendation": "Hire|No Hire|Maybe",
  "confidenceLevel": "High|Medium|Low",
  "nextSteps": "Specific recommendations for next steps in the hiring process",
  "interviewerNotes": "Additional observations and insights for the hiring team based on the interview"
}

IMPORTANT: 
- Start your response with { and end with }
- Use only the exact field names shown above
- Provide specific examples from their actual responses
- Be constructive and actionable in your feedback
- Base all assessments on their actual performance, not assumptions

CRITICAL EVALUATION GUIDELINES:
- Score based on ACTUAL performance, not participation alone
- If candidate didn't answer questions, reflect this in low scores
- Provide specific examples from their responses
- Be constructive but honest in feedback
- Consider the role requirements and expectations
- Factor in response time and engagement level

Be thorough, fair, and constructive in your evaluation.`;

    try {
      console.log('🤖 Calling AI service for evaluation...');
      console.log('📝 Evaluation prompt length:', evaluationPrompt.length);
      
      const result = await aiService.generateResponse(evaluationPrompt, { userRole: 'recruiter' });
      console.log('📊 AI service result:', result);
      
      if (result.success) {
        console.log('✅ AI service call successful, parsing response...');
        console.log('📝 Raw AI response:', result.data);
        
        try {
          const evaluation = JSON.parse(result.data);
          console.log('✅ JSON parsing successful:', evaluation);
          session.evaluation = evaluation;
          session.status = 'evaluated';
          return { success: true, data: evaluation };
        } catch (parseError) {
          console.log('⚠️ JSON parsing failed, extracting feedback from AI text response...', parseError);
          console.log('📝 Raw AI response for extraction:', result.data);
          // Create structured evaluation from AI text response
          const evaluation = this.createStructuredEvaluation(result.data, session);
          console.log('📊 Extracted evaluation:', evaluation);
          session.evaluation = evaluation;
          session.status = 'evaluated';
          return { success: true, data: evaluation };
        }
      } else {
        console.log('❌ Primary AI evaluation failed:', result.error);
        console.log('🔄 Attempting fallback evaluation...');
        // Fallback: Try a simpler AI evaluation
        return await this.fallbackEvaluation(session);
      }
    } catch (error) {
      console.log('❌ AI evaluation error:', error);
      console.log('🔄 Attempting fallback evaluation...');
      // Fallback: Try a simpler AI evaluation
      return await this.fallbackEvaluation(session);
    }
  }

  // Fallback evaluation when primary AI evaluation fails
  async fallbackEvaluation(session) {
    try {
      console.log('🔄 Running fallback AI evaluation...');
      
      // Calculate basic metrics
      const totalQuestions = (session.interviewData.rounds?.length || 0) * 5; // Always 5 questions per round
      const answeredQuestions = session.answers.length;
      const participationRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
      
      const completeAnswers = session.answers.filter(answer => 
        answer.answer && answer.answer.trim().length > 10
      ).length;
      const completenessRate = answeredQuestions > 0 ? (completeAnswers / answeredQuestions) * 100 : 0;

      // Simple fallback prompt
      const fallbackPrompt = `Please provide a brief interview evaluation for this candidate:

CANDIDATE ANSWERS:
${session.answers.map((answer, index) => `
Question ${index + 1}: ${answer.question}
Answer: ${answer.answer || '[No answer provided]'}
`).join('\n')}

Please provide a simple evaluation focusing on:
1. Overall performance score (1-100)
2. Key strengths (2-3 items)
3. Areas for improvement (2-3 items)
4. Recommendation (Hire/No Hire/Maybe)

Respond in a simple format that can be easily parsed.`;

      console.log('📝 Fallback prompt:', fallbackPrompt);
      const result = await aiService.generateResponse(fallbackPrompt, { userRole: 'recruiter' });
      console.log('📊 Fallback AI result:', result);
      
      if (result.success) {
        console.log('✅ Fallback AI call successful');
        console.log('📝 Fallback AI response:', result.data);
        
        // Extract basic information from the fallback response
        const extractedFeedback = this.extractFeedbackFromText(result.data, participationRate, completenessRate);
        console.log('📊 Extracted fallback feedback:', extractedFeedback);
        
        // Create a basic evaluation structure
        const evaluation = {
          overallScore: extractedFeedback.overallScore || Math.min(50 + (participationRate * 0.3) + (completenessRate * 0.2), 100),
          scores: extractedFeedback.scores || {
            technical: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
            communication: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
            problemSolving: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
            engagement: Math.max(2, Math.floor((participationRate + completenessRate) / 25)),
            culturalFit: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
            responseQuality: Math.max(2, Math.floor((participationRate + completenessRate) / 25))
          },
          detailedFeedback: extractedFeedback.detailedFeedback || {
            technical: "AI evaluation completed with basic assessment",
            communication: "Communication skills evaluated based on response quality",
            problemSolving: "Problem-solving approach assessed from available responses",
            engagement: "Engagement level evaluated from participation",
            culturalFit: "Cultural fit assessment based on overall performance",
            responseQuality: "Response quality evaluated from answer completeness"
          },
          strengths: extractedFeedback.strengths || [
            "Participated in interview process",
            "Provided responses to questions"
          ],
          areasForImprovement: extractedFeedback.areasForImprovement || [
            "Provide more detailed responses",
            "Include specific examples in answers"
          ],
          participationMetrics: {
            questionsAnswered: answeredQuestions,
            participationRate: participationRate.toFixed(1),
            avgResponseTime: 0,
            completenessRate: completenessRate.toFixed(1)
          },
          recommendation: extractedFeedback.recommendation || (participationRate >= 60 && completenessRate >= 50 ? "Maybe" : "No Hire"),
          confidenceLevel: "Medium",
          nextSteps: "Review AI-generated evaluation and consider next steps",
          interviewerNotes: `Fallback AI evaluation completed. Participation: ${participationRate.toFixed(1)}%, Completeness: ${completenessRate.toFixed(1)}%`
        };

        console.log('📊 Final fallback evaluation:', evaluation);
        session.evaluation = evaluation;
        session.status = 'evaluated';
        return { success: true, data: evaluation };
      } else {
        console.log('❌ Fallback AI evaluation failed:', result.error);
        throw new Error('Fallback evaluation also failed');
      }
    } catch (error) {
      console.error('❌ Fallback evaluation failed:', error);
      // Return a basic evaluation based on participation metrics
      return this.createBasicEvaluation(session);
    }
  }

  // Create basic evaluation when all AI methods fail
  createBasicEvaluation(session) {
    const totalQuestions = (session.interviewData.rounds?.length || 0) * 5; // Always 5 questions per round
    const answeredQuestions = session.answers.length;
    const participationRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    const completeAnswers = session.answers.filter(answer => 
      answer.answer && answer.answer.trim().length > 10
    ).length;
    const completenessRate = answeredQuestions > 0 ? (completeAnswers / answeredQuestions) * 100 : 0;

    const evaluation = {
      overallScore: Math.min(50 + (participationRate * 0.3) + (completenessRate * 0.2), 100),
      scores: {
        technical: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
        communication: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
        problemSolving: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
        engagement: Math.max(2, Math.floor((participationRate + completenessRate) / 25)),
        culturalFit: Math.max(3, Math.floor((participationRate + completenessRate) / 20)),
        responseQuality: Math.max(2, Math.floor((participationRate + completenessRate) / 25))
      },
      detailedFeedback: {
        technical: "Basic evaluation completed - technical assessment based on participation",
        communication: "Basic evaluation completed - communication assessment based on response quality",
        problemSolving: "Basic evaluation completed - problem-solving assessment based on available responses",
        engagement: "Basic evaluation completed - engagement assessment based on participation level",
        culturalFit: "Basic evaluation completed - cultural fit assessment based on overall performance",
        responseQuality: "Basic evaluation completed - response quality assessment based on completeness"
      },
      strengths: [
        "Completed interview process",
        "Participated in evaluation"
      ],
      areasForImprovement: [
        "Provide more detailed responses",
        "Include specific examples in answers",
        "Demonstrate deeper knowledge"
      ],
      participationMetrics: {
        questionsAnswered: answeredQuestions,
        participationRate: participationRate.toFixed(1),
        avgResponseTime: 0,
        completenessRate: completenessRate.toFixed(1)
      },
      recommendation: participationRate >= 60 && completenessRate >= 50 ? "Maybe" : "No Hire",
      confidenceLevel: "Low",
      nextSteps: "Manual review recommended due to limited AI evaluation",
      interviewerNotes: `Basic evaluation completed. AI evaluation unavailable. Participation: ${participationRate.toFixed(1)}%, Completeness: ${completenessRate.toFixed(1)}%`
    };

    session.evaluation = evaluation;
    session.status = 'evaluated';
    return { success: true, data: evaluation };
  }

  // Create structured evaluation from text
  createStructuredEvaluation(text, session) {
    // Calculate basic metrics
    const totalQuestions = (session?.interviewData?.rounds?.length || 0) * 5; // Always 5 questions per round
    const answeredQuestions = session?.answers?.length || 0;
    const participationRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    const completeAnswers = session?.answers?.filter(answer => 
      answer.answer && answer.answer.trim().length > 10
    ).length || 0;
    const completenessRate = answeredQuestions > 0 ? (completeAnswers / answeredQuestions) * 100 : 0;

    // Try to extract meaningful information from AI response text
    const extractedFeedback = this.extractFeedbackFromText(text, participationRate, completenessRate);

    // Determine overall score based on participation and completeness
    let overallScore = 50; // Base score
    if (participationRate >= 80) overallScore += 20;
    else if (participationRate >= 60) overallScore += 10;
    else if (participationRate >= 40) overallScore += 5;
    
    if (completenessRate >= 80) overallScore += 15;
    else if (completenessRate >= 60) overallScore += 10;
    else if (completenessRate >= 40) overallScore += 5;

    return {
      overallScore: Math.min(overallScore, 100),
      scores: extractedFeedback.scores || {
        technical: Math.max(3, Math.floor(overallScore / 12)),
        communication: Math.max(3, Math.floor(overallScore / 12)),
        problemSolving: Math.max(3, Math.floor(overallScore / 12)),
        engagement: Math.max(2, Math.floor(overallScore / 15)),
        culturalFit: Math.max(3, Math.floor(overallScore / 12)),
        responseQuality: Math.max(2, Math.floor(overallScore / 15))
      },
      detailedFeedback: extractedFeedback.detailedFeedback || {
        technical: participationRate < 50 ? "Limited technical responses provided. Unable to assess technical competency due to low participation." : "Based on available responses, candidate demonstrates basic technical understanding.",
        communication: completenessRate < 50 ? "Communication assessment limited due to incomplete responses. Recommend follow-up interview." : "Shows clear communication in provided responses.",
        problemSolving: participationRate < 50 ? "Insufficient responses to evaluate problem-solving approach." : "Demonstrates logical thinking in responses provided.",
        engagement: participationRate < 60 ? "Low engagement level observed. Limited responses suggest disinterest or technical difficulties." : "Shows appropriate engagement level.",
        culturalFit: "Cultural fit assessment requires more interaction. Recommend additional evaluation.",
        responseQuality: completenessRate < 50 ? "Response quality below expectations. Many incomplete or missing answers." : "Response quality meets basic expectations."
      },
      strengths: extractedFeedback.strengths || (participationRate >= 60 ? [
        "Completed interview process",
        "Provided some relevant responses"
      ] : [
        "Attempted to participate in interview"
      ]),
      areasForImprovement: extractedFeedback.areasForImprovement || [
        participationRate < 50 ? "Complete all interview questions" : "Provide more detailed responses",
        completenessRate < 50 ? "Give more comprehensive answers" : "Include specific examples",
        "Demonstrate deeper technical knowledge"
      ],
      participationMetrics: {
        questionsAnswered: answeredQuestions,
        participationRate: participationRate.toFixed(1),
        avgResponseTime: 0,
        completenessRate: completenessRate.toFixed(1)
      },
      recommendation: extractedFeedback.recommendation || (participationRate >= 60 && completenessRate >= 50 ? "Maybe" : "No Hire"),
      confidenceLevel: extractedFeedback.confidenceLevel || (participationRate >= 80 ? "Medium" : "Low"),
      nextSteps: extractedFeedback.nextSteps || (participationRate < 50 ? "Schedule follow-up interview or technical assessment" : "Review responses and consider next round"),
      interviewerNotes: extractedFeedback.interviewerNotes || `Interview participation: ${participationRate.toFixed(1)}%. Answer completeness: ${completenessRate.toFixed(1)}%. ${participationRate < 50 ? 'Low participation may indicate technical issues or disengagement.' : 'Adequate participation for evaluation.'}`
    };
  }

  // Extract meaningful feedback from AI response text when JSON parsing fails
  extractFeedbackFromText(text, participationRate, completenessRate) {
    if (!text || typeof text !== 'string') {
      console.log('⚠️ No text provided for extraction');
      return {};
    }

    console.log('🔍 Extracting feedback from AI text:', text.substring(0, 200) + '...');

    const extracted = {
      scores: {},
      detailedFeedback: {},
      strengths: [],
      areasForImprovement: [],
      recommendation: null,
      confidenceLevel: null,
      nextSteps: null,
      interviewerNotes: null
    };

    try {
      // Extract overall score if mentioned
      const scoreMatch = text.match(/(?:overall|total|final).*?score.*?(\d+)/i);
      if (scoreMatch) {
        extracted.overallScore = parseInt(scoreMatch[1]);
        console.log('📊 Extracted overall score:', extracted.overallScore);
      }

      // Extract individual category scores
      const categoryScores = {
        technical: this.extractCategoryScore(text, ['technical', 'tech', 'knowledge', 'skills']),
        communication: this.extractCategoryScore(text, ['communication', 'communicate', 'clarity', 'articulation']),
        problemSolving: this.extractCategoryScore(text, ['problem', 'solving', 'analytical', 'logic']),
        engagement: this.extractCategoryScore(text, ['engagement', 'motivation', 'enthusiasm', 'interest']),
        culturalFit: this.extractCategoryScore(text, ['cultural', 'culture', 'fit', 'team']),
        responseQuality: this.extractCategoryScore(text, ['response', 'quality', 'completeness', 'relevance'])
      };

      // Only use extracted scores if they seem reasonable
      Object.entries(categoryScores).forEach(([category, score]) => {
        if (score && score >= 1 && score <= 10) {
          extracted.scores[category] = score;
          console.log(`📊 Extracted ${category} score:`, score);
        }
      });

      // Extract detailed feedback for each category
      extracted.detailedFeedback = {
        technical: this.extractCategoryFeedback(text, ['technical', 'tech', 'knowledge', 'skills']),
        communication: this.extractCategoryFeedback(text, ['communication', 'communicate', 'clarity', 'articulation']),
        problemSolving: this.extractCategoryFeedback(text, ['problem', 'solving', 'analytical', 'logic']),
        engagement: this.extractCategoryFeedback(text, ['engagement', 'motivation', 'enthusiasm', 'interest']),
        culturalFit: this.extractCategoryFeedback(text, ['cultural', 'culture', 'fit', 'team']),
        responseQuality: this.extractCategoryFeedback(text, ['response', 'quality', 'completeness', 'relevance'])
      };

      // Log extracted feedback
      Object.entries(extracted.detailedFeedback).forEach(([category, feedback]) => {
        if (feedback) {
          console.log(`📝 Extracted ${category} feedback:`, feedback);
        }
      });

      // Extract strengths - try multiple patterns
      const strengthsPatterns = [
        /(?:strengths?|positive|good|excellent).*?[:\.]\s*([^\.]+(?:\.[^\.]+)*)/i,
        /(?:strengths?|positive|good|excellent)[\s\S]*?[:\.]\s*([^\.]+(?:\.[^\.]+)*)/i,
        /(?:strengths?|positive|good|excellent)[\s\S]*?(\d+\.\s*[^\.]+(?:\.[^\.]+)*)/i
      ];

      for (const pattern of strengthsPatterns) {
        const strengthsMatch = text.match(pattern);
        if (strengthsMatch) {
          const strengthsText = strengthsMatch[1];
          extracted.strengths = this.parseListItems(strengthsText);
          if (extracted.strengths.length > 0) {
            console.log('✅ Extracted strengths:', extracted.strengths);
            break;
          }
        }
      }

      // Extract areas for improvement - try multiple patterns
      const improvementsPatterns = [
        /(?:improvement|areas? for|weakness|concern).*?[:\.]\s*([^\.]+(?:\.[^\.]+)*)/i,
        /(?:improvement|areas? for|weakness|concern)[\s\S]*?[:\.]\s*([^\.]+(?:\.[^\.]+)*)/i,
        /(?:improvement|areas? for|weakness|concern)[\s\S]*?(\d+\.\s*[^\.]+(?:\.[^\.]+)*)/i
      ];

      for (const pattern of improvementsPatterns) {
        const improvementsMatch = text.match(pattern);
        if (improvementsMatch) {
          const improvementsText = improvementsMatch[1];
          extracted.areasForImprovement = this.parseListItems(improvementsText);
          if (extracted.areasForImprovement.length > 0) {
            console.log('✅ Extracted improvements:', extracted.areasForImprovement);
            break;
          }
        }
      }

      // Extract recommendation
      const recommendationMatch = text.match(/(?:recommend|suggest|advise).*?(hire|no hire|maybe|proceed|continue)/i);
      if (recommendationMatch) {
        extracted.recommendation = recommendationMatch[1];
        console.log('📊 Extracted recommendation:', extracted.recommendation);
      }

      // Extract confidence level
      const confidenceMatch = text.match(/(?:confidence|certainty).*?(high|medium|low)/i);
      if (confidenceMatch) {
        extracted.confidenceLevel = confidenceMatch[1];
        console.log('📊 Extracted confidence:', extracted.confidenceLevel);
      }

      // Extract next steps
      const nextStepsMatch = text.match(/(?:next steps?|recommendation|suggestion).*?[:\.]\s*([^\.]+)/i);
      if (nextStepsMatch) {
        extracted.nextSteps = nextStepsMatch[1].trim();
        console.log('📝 Extracted next steps:', extracted.nextSteps);
      }

      // Extract interviewer notes
      const notesMatch = text.match(/(?:notes?|observation|comment).*?[:\.]\s*([^\.]+(?:\.[^\.]+)*)/i);
      if (notesMatch) {
        extracted.interviewerNotes = notesMatch[1].trim();
        console.log('📝 Extracted notes:', extracted.interviewerNotes);
      }

      console.log('📊 Final extracted feedback:', extracted);

    } catch (error) {
      console.error('❌ Error extracting feedback from text:', error);
    }

    return extracted;
  }

  // Extract score for a specific category
  extractCategoryScore(text, keywords) {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}.*?(\\d+)(?:/10|/10|out of 10)?`, 'i');
      const match = text.match(regex);
      if (match) {
        const score = parseInt(match[1]);
        if (score >= 1 && score <= 10) {
          return score;
        }
      }
    }
    return null;
  }

  // Extract feedback for a specific category
  extractCategoryFeedback(text, keywords) {
    for (const keyword of keywords) {
      // Try multiple patterns for better extraction
      const patterns = [
        new RegExp(`${keyword}.*?[:\.]\\s*([^\\n\\.]+(?:\\.\\s*[^\\n\\.]+)*)`, 'i'),
        new RegExp(`${keyword}.*?[:\.]\\s*([^\\n]+)`, 'i'),
        new RegExp(`${keyword}[\\s\\S]*?[:\.]\\s*([^\\n\\.]+(?:\\.\\s*[^\\n\\.]+)*)`, 'i'),
        new RegExp(`${keyword}[\\s\\S]*?[:\.]\\s*([^\\n]+)`, 'i')
      ];
      
      for (const regex of patterns) {
        const match = text.match(regex);
        if (match) {
          const feedback = match[1].trim();
          if (feedback.length > 10 && feedback.length < 500) {
            console.log(`📝 Found ${keyword} feedback:`, feedback);
            return feedback;
          }
        }
      }
    }
    return null;
  }

  // Parse list items from text
  parseListItems(text) {
    if (!text) return [];
    
    console.log('🔍 Parsing list items from:', text.substring(0, 100) + '...');
    
    // Try multiple splitting patterns
    const patterns = [
      /[•\-\*]\s*/g,
      /(?:\d+\.\s*)/g,
      /\n\s*[-•*]\s*/g,
      /\n\s*(?:\d+\.\s*)/g,
      /;\s*/g,
      /,\s*(?=[A-Z])/g
    ];
    
    let items = [];
    
    for (const pattern of patterns) {
      const splitItems = text.split(pattern)
        .map(item => item.trim())
        .filter(item => item.length > 5 && item.length < 200 && !item.match(/^(and|or|the|a|an)$/i));
      
      if (splitItems.length > 1) {
        items = splitItems;
        console.log('✅ Parsed items with pattern:', pattern, items);
        break;
      }
    }
    
    // If no pattern worked, try to extract sentences
    if (items.length <= 1) {
      items = text.split(/[.!?]+/)
        .map(item => item.trim())
        .filter(item => item.length > 10 && item.length < 200);
      console.log('📝 Fallback to sentence parsing:', items);
    }
    
    return items.slice(0, 5); // Limit to 5 items
  }
}

export default new AIInterviewService();
