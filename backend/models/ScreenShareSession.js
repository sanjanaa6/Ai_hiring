const mongoose = require('mongoose');

const screenShareSessionSchema = new mongoose.Schema({
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
  recruiterName: {
    type: String
  },
  status: {
    type: String,
    enum: ['requested', 'active', 'paused', 'ended', 'declined'],
    default: 'requested',
    index: true
  },
  permissionGranted: {
    type: Boolean,
    default: false
  },
  permissionGrantedAt: {
    type: Date
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  // Connection quality metrics
  quality: {
    averageLatency: { type: Number }, // in ms
    packetsLost: { type: Number },
    reconnections: { type: Number, default: 0 },
    averageBitrate: { type: Number } // in kbps
  },
  // Recruiter actions during session
  actions: [{
    action: {
      type: String,
      enum: ['flagged', 'snapshot', 'note_added', 'paused', 'resumed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  // Flags and notes
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  notes: [{
    recruiterId: mongoose.Schema.Types.ObjectId,
    recruiterName: String,
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Technical metadata
  metadata: {
    browserInfo: String,
    screenResolution: String,
    connectionType: String,
    iceServers: [String]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
screenShareSessionSchema.index({ interviewId: 1, status: 1 });
screenShareSessionSchema.index({ candidateId: 1, startedAt: -1 });
screenShareSessionSchema.index({ recruiterId: 1, startedAt: -1 });
screenShareSessionSchema.index({ status: 1, startedAt: -1 });

// Calculate duration before saving
screenShareSessionSchema.pre('save', function(next) {
  if (this.endedAt && this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  next();
});

// Instance methods
screenShareSessionSchema.methods.addAction = function(action, note = null, metadata = null) {
  this.actions.push({
    action,
    note,
    metadata,
    timestamp: new Date()
  });
  return this.save();
};

screenShareSessionSchema.methods.addNote = function(recruiterId, recruiterName, note) {
  this.notes.push({
    recruiterId,
    recruiterName,
    note,
    timestamp: new Date()
  });
  return this.save();
};

screenShareSessionSchema.methods.flag = function(reason) {
  this.flagged = true;
  this.flagReason = reason;
  this.actions.push({
    action: 'flagged',
    note: reason,
    timestamp: new Date()
  });
  return this.save();
};

screenShareSessionSchema.methods.end = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  return this.save();
};

// Static methods
screenShareSessionSchema.statics.getActiveSessions = function(recruiterId = null) {
  const query = { status: 'active' };
  if (recruiterId) {
    query.recruiterId = recruiterId;
  }
  return this.find(query)
    .sort({ startedAt: -1 })
    .populate('candidateId', 'name email')
    .populate('recruiterId', 'name email');
};

screenShareSessionSchema.statics.getSessionsByInterview = function(interviewId) {
  return this.find({ interviewId })
    .sort({ startedAt: -1 })
    .populate('candidateId', 'name email')
    .populate('recruiterId', 'name email');
};

screenShareSessionSchema.statics.getSessionsByCandidate = function(candidateId) {
  return this.find({ candidateId })
    .sort({ startedAt: -1 })
    .populate('recruiterId', 'name email');
};

module.exports = mongoose.model('ScreenShareSession', screenShareSessionSchema);
