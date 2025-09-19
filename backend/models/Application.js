const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    required: true
  },
  resume: {
    type: String,
    required: true
  },
  additionalDocuments: [String],
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  },
  aiFeedback: String,
  screeningQuestions: [{
    question: String,
    answer: String
  }],
  interviewScheduled: Date,
  notes: String
}, {
  timestamps: true
});

// Ensure one application per candidate per job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
