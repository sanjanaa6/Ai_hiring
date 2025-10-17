const mongoose = require('mongoose');

const interviewRecordingSchema = new mongoose.Schema({
  interviewId: {
    type: String,
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  // Recording metadata
  recordingType: {
    type: String,
    enum: ['screen', 'screen_audio', 'camera', 'full'],
    default: 'screen'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  mimeType: {
    type: String,
    default: 'video/webm'
  },
  // AWS S3 details
  s3Key: {
    type: String,
    required: false // Will be set after upload
  },
  s3Bucket: {
    type: String,
    required: false // Will be set after upload
  },
  s3Url: {
    type: String,
    required: false // Will be set after upload
  },
  s3Region: {
    type: String,
    default: 'us-east-1'
  },
  // Status tracking
  status: {
    type: String,
    enum: ['uploading', 'completed', 'failed', 'processing'],
    default: 'uploading'
  },
  uploadProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Timestamps
  recordingStartedAt: {
    type: Date,
    required: true
  },
  recordingEndedAt: {
    type: Date,
    required: true
  },
  uploadedAt: {
    type: Date
  },
  // Access control
  isPublic: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date
  },
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Additional metadata
  metadata: {
    screenResolution: String,
    browserInfo: String,
    deviceInfo: String,
    roundNumber: Number,
    roundTitle: String
  },
  // Error tracking
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
interviewRecordingSchema.index({ candidateId: 1, createdAt: -1 });
interviewRecordingSchema.index({ recruiterId: 1, createdAt: -1 });
interviewRecordingSchema.index({ interviewId: 1, candidateId: 1 });
interviewRecordingSchema.index({ status: 1, createdAt: -1 });
interviewRecordingSchema.index({ isDeleted: 1 });

// Virtual for signed URL generation
interviewRecordingSchema.virtual('signedUrl').get(function() {
  // This will be populated by the service layer
  return this._signedUrl;
});

// Method to increment view count
interviewRecordingSchema.methods.recordView = async function(userId) {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  
  if (userId) {
    this.viewedBy.push({
      userId,
      viewedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to mark as deleted (soft delete)
interviewRecordingSchema.methods.softDelete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Static method to find active recordings
interviewRecordingSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isDeleted: false });
};

// Static method to find by interview
interviewRecordingSchema.statics.findByInterview = function(interviewId) {
  return this.findActive({ interviewId }).sort({ createdAt: -1 });
};

// Static method to find by candidate
interviewRecordingSchema.statics.findByCandidate = function(candidateId) {
  return this.findActive({ candidateId }).sort({ createdAt: -1 });
};

// Static method to find by recruiter
interviewRecordingSchema.statics.findByRecruiter = function(recruiterId) {
  return this.findActive({ recruiterId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('InterviewRecording', interviewRecordingSchema);
