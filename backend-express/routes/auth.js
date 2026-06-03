const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Signup Endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Securely hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user in MongoDB
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'candidate',
      isApproved: false // Newly signed up candidate accounts are unapproved by default
    });

    // Create JWT Token including role and isApproved status
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Omit password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    userResponse.id = userResponse._id; // Ensure client receives id

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: "Server registration failed: " + err.message });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify hashed password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT Token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        role: user.role,
        isApproved: user.isApproved 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.id = userResponse._id; // Ensure client receives id

    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: "Server login failed: " + err.message });
  }
});

// Get current profile details (for client state validation/sync)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }
    
    const userResponse = user.toObject();
    delete userResponse.password;
    userResponse.id = userResponse._id; // Ensure client receives id
    
    res.status(200).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: "Failed to load current profile: " + err.message });
  }
});

module.exports = router;
