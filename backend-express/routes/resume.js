const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { readDb, writeDb } = require('../config/database');
const optionalAuth = require('../middleware/optionalAuth'); // Fallback in case they parse without logging in

// Setup Multer memory storage (lightweight parsing without saving locally first)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Optional Auth Middleware for endpoints that can be run guest/anonymous or logged in
const authMiddleware = require('../middleware/auth');

router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded. Please attach a valid PDF or TXT resume." });
    }

    const targetRole = req.body.targetRole || "AI Engineer";
    
    // Construct FormData to forward file stream to FastAPI Python server
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    form.append('target_role', targetRole);

    const response = await axios.post(`${AI_SERVICE_URL}/analyze-resume`, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const report = response.data;
    
    // Save report in database if JWT token is verified, or save anonymously
    let userId = "anonymous";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret');
        userId = decoded.id;
      } catch (err) {
        // Continue anonymously if token is invalid
      }
    }

    const db = readDb();
    const resumeEntry = {
      id: "resume_" + Date.now(),
      userId,
      filename: req.file.originalname,
      targetRole,
      report,
      createdAt: new Date().toISOString()
    };

    db.resumes.push(resumeEntry);
    writeDb(db);

    res.status(200).json(resumeEntry);
  } catch (err) {
    console.error("Resume parsing error:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail 
      ? err.response.data.detail 
      : err.message;
    res.status(500).json({ error: "AI Parsing service unavailable: " + detail });
  }
});

// Retrieve user's resume history
router.get('/history', authMiddleware, (req, res) => {
  try {
    const db = readDb();
    const userResumes = db.resumes.filter(r => r.userId === req.user.id);
    res.status(200).json(userResumes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resume logs." });
  }
});

module.exports = router;
