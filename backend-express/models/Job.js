const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  _id: { type: String, default: () => "job_" + Date.now() },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  description: { type: String },
  skillsRequired: [{ type: String }],
  type: { type: String }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('Job', jobSchema);
