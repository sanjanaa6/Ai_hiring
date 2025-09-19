const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  question: { type: String, required: true },
  expectedAnswer: { type: String, required: true },
  timeLimit: { type: Number, required: true },
  difficulty: { type: String, required: true },
  followUpQuestions: [{ type: String }]
});

const roundSchema = new mongoose.Schema({
  roundId: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  questions: [questionSchema],
  evaluationCriteria: {
    technical: { type: String },
    communication: { type: String },
    problemSolving: { type: String },
    culturalFit: { type: String },
    leadership: { type: String },
    motivation: { type: String }
  }
});

const candidateAnswerSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  roundId: { type: String, required: true },
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  timeTaken: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  aiEvaluation: {
    score: { type: Number, min: 1, max: 4 },
    feedback: { type: String },
    strengths: [{ type: String }],
    improvements: [{ type: String }]
  }
});

const interviewSchema = new mongoose.Schema({
  interviewId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  jobRequirements: { type: String, required: true },
  jobLevel: { type: String, required: true },
  totalDuration: { type: Number, required: true },
  rounds: [roundSchema],
  overallEvaluationCriteria: {
    technical: { type: String },
    communication: { type: String },
    problemSolving: { type: String },
    culturalFit: { type: String },
    leadership: { type: String },
    motivation: { type: String }
  },
  scoringSystem: {
    excellent: { type: String },
    good: { type: String },
    satisfactory: { type: String },
    needsImprovement: { type: String }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  candidateAnswers: [candidateAnswerSchema],
  statistics: {
    totalCandidates: { type: Number, default: 0 },
    completedInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update statistics when candidate answers are added
interviewSchema.methods.updateStatistics = function() {
  const answers = this.candidateAnswers;
  const uniqueCandidates = new Set(answers.map(a => a.candidateId)).size;
  
  this.statistics.totalCandidates = uniqueCandidates;
  this.statistics.completedInterviews = answers.length;
  
  if (answers.length > 0) {
    const totalScore = answers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0);
    this.statistics.averageScore = totalScore / answers.length;
  }
  
  this.statistics.completionRate = uniqueCandidates > 0 ? (this.statistics.completedInterviews / uniqueCandidates) * 100 : 0;
  this.updatedAt = new Date();
};

module.exports = mongoose.model('Interview', interviewSchema);
