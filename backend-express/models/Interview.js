const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => "session_" + Date.now() },
  userId: { type: String, default: 'anonymous' },
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  targetRole: { type: String },
  report: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('Interview', interviewSchema);
