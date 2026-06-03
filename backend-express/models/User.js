const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => "user_" + Date.now() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'candidate' },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('User', userSchema);
