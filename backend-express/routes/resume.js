const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const Resume = require('../models/Resume');
const optionalAuth = require('../middleware/optionalAuth');
const authMiddleware = require('../middleware/auth');

// Setup Multer memory storage with file security validation
const path = require('path');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.txt'];
    const allowedMimeTypes = ['application/pdf', 'text/plain'];
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT resumes are allowed for security reasons.'));
    }
  }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

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
        ...form.getHeaders(),
        'x-correlation-id': req.correlationId
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

    // Save to MongoDB
    const resumeEntry = await Resume.create({
      userId,
      filename: req.file.originalname,
      targetRole,
      report
    });

    const resumeResponse = resumeEntry.toObject();
    resumeResponse.id = resumeResponse._id; // Map for client compatibility

    res.status(200).json(resumeResponse);
  } catch (err) {
    console.error(`Resume parsing error [Target: ${AI_SERVICE_URL}]:`, err.message);
    const detail = err.response && err.response.data && err.response.data.detail 
      ? err.response.data.detail 
      : err.message;
    res.status(500).json({ error: `AI Parsing service unavailable (${AI_SERVICE_URL}): ` + detail });
  }
});

// Retrieve user's resume history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userResumes = await Resume.find({ userId: req.user.id }).lean();
    const userResumesWithId = userResumes.map(r => ({ ...r, id: r._id }));
    res.status(200).json(userResumesWithId);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resume logs: " + err.message });
  }
});

// Proxy to generate-roadmap in FastAPI AI engine
router.post('/roadmap', authMiddleware, async (req, res) => {
  try {
    const { targetRole, missingSkills } = req.body;
    const response = await axios.post(`${AI_SERVICE_URL}/generate-roadmap`, {
      target_role: targetRole,
      missing_skills: missingSkills
    }, {
      headers: {
        'x-correlation-id': req.correlationId
      }
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Roadmap generation failure:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail
      ? err.response.data.detail
      : err.message;
    res.status(500).json({ error: "FastAPI AI Roadmap generator degraded: " + detail });
  }
});

module.exports = router;
