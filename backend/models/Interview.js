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

const fileUploadRequirementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileTypes: [{ type: String }], // e.g., ['pdf', 'ppt', 'pptx', 'doc', 'docx']
  maxFileSize: { type: Number, default: 10 }, // in MB
  required: { type: Boolean, default: true }
});

const formFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'number', 'date', 'file'], 
    required: true 
  },
  label: { type: String, required: true },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // For select, radio, checkbox
  validation: {
    minLength: { type: Number },
    maxLength: { type: Number },
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String } // Regex pattern
  },
  order: { type: Number, required: true }
});

const formSubmissionSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  roundId: { type: String, required: true },
  responses: [{
    fieldId: { type: String, required: true },
    fieldType: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, array, etc.
    submittedAt: { type: Date, default: Date.now }
  }],
  submittedAt: { type: Date, default: Date.now },
  isComplete: { type: Boolean, default: false }
});

const roundSchema = new mongoose.Schema({
  roundId: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  type: { type: String, enum: ['interview', 'file_upload', 'form_submission', 'system_design'], default: 'interview' },
  allowRetake: { type: Boolean, default: false }, // Allow candidates to retake this round
  questions: [questionSchema],
  fileUploadRequirements: [fileUploadRequirementSchema], // For file upload rounds
  formFields: [formFieldSchema], // For form submission rounds
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

const candidateFeedbackSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  overallScore: { type: Number }, // Overall score 0-100
  overallPerformance: { type: String },
  strengths: [{ type: String }],
  areasForImprovement: [{ type: String }],
  recommendations: [{ type: String }],
  skillScores: {
    type: Map,
    of: Number // Skill-based scores (0-100)
  },
  roundWiseFeedback: [{
    roundId: { type: String },
    roundTitle: { type: String },
    score: { type: Number }, // Round score 0-100
    performance: { type: String },
    keyPoints: [{ type: String }],
    technicalAccuracy: { type: Number },
    completeness: { type: Number }
  }],
  questionScores: [{
    question: { type: String },
    answer: { type: String },
    score: { type: Number }, // 0-100
    reasoning: { type: String },
    technicalCorrectness: { type: Number },
    communicationQuality: { type: Number }
  }],
  monitoringData: {
    profileImage: { type: String },
    interviewSnapshots: [{ type: String }],
    cheatAttempts: {
      flagged: { type: Boolean, default: false },
      reason: { type: String },
      flaggedAt: { type: Date }
    },
    eyeTrackingViolations: { type: Number, default: 0 },
    faceDetectionIssues: { type: Number, default: 0 }
  },
  pdfUrl: { type: String },
  pdfPath: { type: String },
  generatedAt: { type: Date, default: Date.now }
});

const fileUploadSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  roundId: { type: String, required: true },
  requirementId: { type: String, required: true },
  requirementTitle: { type: String, required: true },
  fileName: { type: String, required: true },
  originalFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true }, // in bytes
  fileType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['uploaded', 'reviewed', 'approved', 'rejected'], default: 'uploaded' },
  reviewNotes: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
});

const systemDesignSubmissionSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  roundId: { type: String, required: true },
  diagramData: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores the complete diagram JSON
  submittedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 }, // in seconds
  status: { type: String, enum: ['submitted', 'reviewed', 'approved', 'rejected'], default: 'submitted' },
  reviewNotes: { type: String },
  score: { type: Number, min: 0, max: 10 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
});

const interviewSchema = new mongoose.Schema({
  interviewId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  reviewNotes: { type: String },
  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  jobRequirements: { type: String, required: true },
  jobLevel: { type: String, required: true },
  totalDuration: { type: Number, required: true },
  interviewType: { type: String, enum: ['regular', 'electronics', 'sales', 'coding'], default: 'regular' },
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
  accessLinks: [{
    roundId: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    accessLink: { type: String, unique: true, sparse: true },
    accessCode: { type: String, unique: true, sparse: true },
    isScheduled: { type: Boolean, default: false },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSchedule' }
  }],
  candidateAnswers: [candidateAnswerSchema],
  fileUploads: [fileUploadSchema],
  formSubmissions: [formSubmissionSchema],
  systemDesignSubmissions: [systemDesignSubmissionSchema],
  candidateFeedbacks: [candidateFeedbackSchema],
  statistics: {
    totalCandidates: { type: Number, default: 0 },
    completedInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },
  monitoring: {
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
    flaggedAt: { type: Date },
    flagClearedAt: { type: Date },
    flagClearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flagClearReason: { type: String },
    eyeTrackingEnabled: { type: Boolean, default: true },
    facePositioningRequired: { type: Boolean, default: true },
    autoRemoved: { type: Boolean, default: false },
    autoRemovedAt: { type: Date },
    autoRemovalReason: { type: String },
    removedCandidateId: { type: String }
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

// Generate access links for all rounds when interview is created
interviewSchema.methods.generateAccessLinks = function() {
  const crypto = require('crypto');
  
  this.accessLinks = this.rounds.map(round => {
    const accessCode = crypto.randomBytes(8).toString('hex');
    const accessLink = `${this.interviewId}-${round.roundNumber}-${accessCode}`;
    
    return {
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      accessLink: accessLink,
      accessCode: accessCode,
      isScheduled: false,
      scheduleId: null
    };
  });
  
  return this.accessLinks;
};

// Update access link when round is scheduled
interviewSchema.methods.updateAccessLinkForSchedule = function(roundNumber, scheduleId) {
  const accessLinkIndex = this.accessLinks.findIndex(link => link.roundNumber === roundNumber);
  
  if (accessLinkIndex !== -1) {
    this.accessLinks[accessLinkIndex].isScheduled = true;
    this.accessLinks[accessLinkIndex].scheduleId = scheduleId;
    this.updatedAt = new Date();
    return this.accessLinks[accessLinkIndex];
  }
  
  return null;
};

// Find access link by access code
interviewSchema.statics.findByAccessLink = function(accessLink) {
  return this.findOne({ 'accessLinks.accessLink': accessLink });
};

// Get access link info for a specific round
interviewSchema.methods.getAccessLinkInfo = function(roundNumber) {
  return this.accessLinks.find(link => link.roundNumber === roundNumber);
};

module.exports = mongoose.model('Interview', interviewSchema);
