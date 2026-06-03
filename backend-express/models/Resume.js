const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  _id: { type: String, default: () => "resume_" + Date.now() },
  userId: { type: String, default: 'anonymous' },
  filename: { type: String, required: true },
  targetRole: { type: String, required: true },
  report: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('Resume', resumeSchema);
