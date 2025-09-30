const mongoose = require('mongoose');

const interviewScheduleSchema = new mongoose.Schema({
  interviewId: {
    type: String,
    required: true,
    index: true
  },
  roundName: {
    type: String,
    required: true,
    trim: true
  },
  roundNumber: {
    type: Number,
    required: true,
    min: 1
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15, // Minimum 15 minutes
    max: 480 // Maximum 8 hours
  },
  maxCandidates: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  description: {
    type: String,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  accessLink: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  accessCode: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublicAccess: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
interviewScheduleSchema.index({ interviewId: 1, roundNumber: 1 });
interviewScheduleSchema.index({ startDateTime: 1 });
interviewScheduleSchema.index({ status: 1 });

// Virtual for checking if schedule is currently active
interviewScheduleSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startDateTime <= now && this.endDateTime >= now && this.status === 'active';
});

// Virtual for checking if schedule is upcoming
interviewScheduleSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return this.startDateTime > now && this.status === 'scheduled';
});

// Virtual for checking if schedule is completed
interviewScheduleSchema.virtual('isCompleted').get(function() {
  const now = new Date();
  return this.endDateTime < now || this.status === 'completed';
});

// Pre-save middleware to validate dates
interviewScheduleSchema.pre('save', function(next) {
  if (this.startDateTime >= this.endDateTime) {
    return next(new Error('End date/time must be after start date/time'));
  }
  
  // Calculate duration from start and end times
  const durationInMinutes = (this.endDateTime - this.startDateTime) / (1000 * 60);
  if (Math.abs(durationInMinutes - this.duration) > 1) { // Allow 1 minute tolerance
    this.duration = Math.round(durationInMinutes);
  }
  
  this.updatedAt = new Date();
  next();
});

// Static method to get active schedules
interviewScheduleSchema.statics.getActiveSchedules = function() {
  const now = new Date();
  return this.find({
    startDateTime: { $lte: now },
    endDateTime: { $gte: now },
    status: 'active'
  });
};

// Static method to get upcoming schedules
interviewScheduleSchema.statics.getUpcomingSchedules = function() {
  const now = new Date();
  return this.find({
    startDateTime: { $gt: now },
    status: 'scheduled'
  });
};

// Instance method to check if candidate can be scheduled
interviewScheduleSchema.methods.canScheduleCandidate = function() {
  return this.status === 'scheduled' && new Date() < this.startDateTime;
};

// Instance method to get time remaining
interviewScheduleSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  if (this.startDateTime > now) {
    return this.startDateTime - now;
  } else if (this.endDateTime > now) {
    return this.endDateTime - now;
  } else {
    return 0;
  }
};

// Instance method to generate unique access link
interviewScheduleSchema.methods.generateAccessLink = function() {
  const crypto = require('crypto');
  const accessCode = crypto.randomBytes(8).toString('hex');
  const accessLink = `${this.interviewId}-${this.roundNumber}-${accessCode}`;
  
  this.accessCode = accessCode;
  this.accessLink = accessLink;
  
  return accessLink;
};

// Static method to find schedule by access link
interviewScheduleSchema.statics.findByAccessLink = function(accessLink) {
  return this.findOne({ accessLink: accessLink });
};

// Instance method to validate access
interviewScheduleSchema.methods.validateAccess = function() {
  const now = new Date();
  const isWithinTime = now >= this.startDateTime && now <= this.endDateTime;
  
  // Only grant access if the round is explicitly set to 'active' status
  // OR if it's within the time window AND the status is 'scheduled' (auto-activation)
  const canAccess = this.status === 'active' || (isWithinTime && this.status === 'scheduled');
  
  let reason, message;
  
  if (now < this.startDateTime) {
    reason = 'upcoming';
    message = 'Round not started yet';
  } else if (now > this.endDateTime) {
    reason = 'ended';
    message = 'Round has ended';
  } else if (this.status === 'cancelled') {
    reason = 'cancelled';
    message = 'Round has been cancelled';
  } else if (this.status === 'completed') {
    reason = 'completed';
    message = 'Round has been completed';
  } else if (canAccess) {
    reason = 'active';
    message = 'Round is active - access granted';
  } else if (isWithinTime && this.status === 'scheduled') {
    // This case should not happen due to canAccess logic above, but just in case
    reason = 'active';
    message = 'Round is active - access granted';
  } else {
    reason = 'scheduled';
    message = 'Round is scheduled but not yet active';
  }
  
  return {
    canAccess,
    reason,
    message,
    timeRemaining: this.getTimeRemaining()
  };
};

module.exports = mongoose.model('InterviewSchedule', interviewScheduleSchema);
