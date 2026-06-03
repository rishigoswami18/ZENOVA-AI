const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Access denied. Authentication required." });
    }

    // Reuse req.userModel if populated by another middleware
    const user = req.userModel || await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Administrator privileges required." });
    }

    req.userModel = user;
    next();
  } catch (err) {
    console.error("adminOnly middleware error:", err.message);
    res.status(500).json({ error: "Authorization validation failed: " + err.message });
  }
};
