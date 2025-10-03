const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['candidate', 'recruiter', 'admin'],
    default: 'candidate'
  },
  profile: {
    phone: String,
    location: String,
    bio: String,
    skills: [String],
    experience: String,
    education: String,
    resume: String,
    avatar: String,
    website: String,
    linkedin: String,
    github: String
  },
  // Candidate specific fields
  candidateProfile: {
    expectedSalary: String,
    availability: String,
    workPreference: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite'
    },
    jobPreferences: [String],
    languages: [String],
    certifications: [String]
  },
  // Recruiter specific fields
  recruiterProfile: {
    company: String,
    companySize: String,
    industry: String,
    position: String,
    department: String,
    hiringBudget: String,
    preferredLocations: [String]
  },
  // Admin specific fields
  adminProfile: {
    permissions: [String],
    lastLogin: Date,
    loginCount: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Approval status for recruiters - now auto-approved
  isApproved: {
    type: Boolean,
    default: true  // All users including recruiters are auto-approved
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'  // All users including recruiters are auto-approved
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // Interview progress tracking
  interviewProgress: [{
    interviewId: { type: String, required: true },
    interviewTitle: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['started', 'in_progress', 'completed', 'abandoned', 'applied', 'scheduled', 'passed', 'failed', 'on_hold', 'rejected'], 
      default: 'started' 
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    progress: {
      totalRounds: { type: Number, default: 0 },
      completedRounds: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      answeredQuestions: { type: Number, default: 0 },
      currentRound: { type: Number, default: 0 },
      currentQuestion: { type: Number, default: 0 }
    },
    rounds: [{
      roundId: { type: String, required: true },
      roundNumber: { type: Number, required: true },
      roundTitle: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['not_started', 'in_progress', 'completed'], 
        default: 'not_started' 
      },
      startedAt: { type: Date },
      completedAt: { type: Date },
      questions: [{
        questionId: { type: String, required: true },
        questionNumber: { type: Number, required: true },
        status: { 
          type: String, 
          enum: ['not_answered', 'answered', 'skipped'], 
          default: 'not_answered' 
        },
        answeredAt: { type: Date },
        timeSpent: { type: Number, default: 0 }
      }]
    }],
    fileUploads: [{
      roundId: { type: String, required: true },
      requirementId: { type: String, required: true },
      fileName: { type: String, required: true },
      originalFileName: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    totalTimeSpent: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
