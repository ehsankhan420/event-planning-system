import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Meeting', 'Birthday', 'Appointment', 'Other']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reminders: [{
    time: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
eventSchema.index({ user: 1, date: 1 });
eventSchema.index({ 'reminders.time': 1, 'reminders.sent': 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;