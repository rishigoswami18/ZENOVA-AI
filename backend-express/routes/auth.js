const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Signup Endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const db = readDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Securely hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: "user_" + Date.now(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    // Create JWT Token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Omit password from response
    const { password: _, ...userResponse } = newUser;
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

    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify hashed password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userResponse } = user;
    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: "Server login failed: " + err.message });
  }
});

module.exports = router;
