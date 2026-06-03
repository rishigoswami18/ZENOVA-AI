const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Access denied. Authentication required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (!user.isApproved) {
      return res.status(403).json({ error: "Access denied. Your account has not been approved by an administrator." });
    }

    req.userModel = user;
    next();
  } catch (err) {
    console.error("approvedOnly middleware error:", err.message);
    res.status(500).json({ error: "Authorization validation failed: " + err.message });
  }
};
