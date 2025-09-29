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

module.exports = mongoose.model('InterviewSchedule', interviewScheduleSchema);
