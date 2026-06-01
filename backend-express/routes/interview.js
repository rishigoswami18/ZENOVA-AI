const express = require('express');
const router = express.Router();
const axios = require('axios');
const { readDb, writeDb } = require('../config/database');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const authMiddleware = require('../middleware/auth');

const QUESTIONS_DATABASE = {
  "AI Engineer": [
    { id: "q1", question: "Explain standard Transformer attention mechanism.", difficulty: "Medium" },
    { id: "q2", question: "How does Retrieval-Augmented Generation (RAG) resolve LLM hallucination?", difficulty: "Medium" },
    { id: "q3", question: "Describe the difference between fine-tuning and prompt engineering.", difficulty: "Easy" }
  ],
  "ML Engineer": [
    { id: "q1", question: "Explain standard Transformer attention mechanism.", difficulty: "Medium" },
    { id: "q4", question: "Describe the difference between fine-tuning and prompt engineering.", difficulty: "Easy" }
  ],
  "Fullstack Engineer": [
    { id: "q5", question: "Explain Difference between SQL and NoSQL databases.", difficulty: "Easy" },
    { id: "q6", question: "What is JWT and how does it securely handle authentication?", difficulty: "Medium" }
  ]
};

// Retrieve questions by target role
router.get('/questions', (req, res) => {
  try {
    const role = req.query.role || "AI Engineer";
    const questions = QUESTIONS_DATABASE[role] || QUESTIONS_DATABASE["AI Engineer"];
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load questions" });
  }
});

// Submit mock answer for grading
router.post('/grade', async (req, res) => {
  try {
    const { question, userAnswer, targetRole, difficulty } = req.body;
    if (!question || !userAnswer) {
      return res.status(400).json({ error: "question and userAnswer are required inputs." });
    }

    // Call FastAPI grading microservice
    const response = await axios.post(`${AI_SERVICE_URL}/grade-interview`, {
      question,
      user_answer: userAnswer,
      target_role: targetRole || "AI Engineer",
      difficulty: difficulty || "Medium"
    });

    const report = response.data;

    // Optional user ID binding
    let userId = "anonymous";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret');
        userId = decoded.id;
      } catch (err) {
        // Skip user binding if invalid
      }
    }

    const db = readDb();
    const interviewSession = {
      id: "session_" + Date.now(),
      userId,
      question,
      userAnswer,
      targetRole,
      report,
      createdAt: new Date().toISOString()
    };

    db.interviews.push(interviewSession);
    writeDb(db);

    res.status(200).json(interviewSession);
  } catch (err) {
    console.error("Interview grading error:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail
      ? err.response.data.detail
      : err.message;
    res.status(500).json({ error: "AI evaluation service failed: " + detail });
  }
});

router.post('/video-session', async (req, res) => {
  try {
    const { targetRole, interviewType, difficulty } = req.body;
    const response = await axios.post(`${AI_SERVICE_URL}/video-interview/session`, {
      target_role: targetRole || "AI Engineer",
      interview_type: interviewType || "Technical",
      difficulty: difficulty || "Medium"
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error("Video interview session error:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail
      ? err.response.data.detail
      : err.message;
    res.status(500).json({ error: "Failed to start virtual interview: " + detail });
  }
});

router.post('/video-grade', async (req, res) => {
  try {
    const { question, transcript, targetRole, interviewType, difficulty, durationSeconds } = req.body;
    if (!question || !transcript) {
      return res.status(400).json({ error: "question and transcript are required inputs." });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/video-interview/evaluate`, {
      question,
      transcript,
      target_role: targetRole || "AI Engineer",
      interview_type: interviewType || "Technical",
      difficulty: difficulty || "Medium",
      duration_seconds: durationSeconds || 0
    });

    res.status(200).json({ report: response.data });
  } catch (err) {
    console.error("Video interview grading error:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail
      ? err.response.data.detail
      : err.message;
    res.status(500).json({ error: "Virtual interview evaluation failed: " + detail });
  }
});

module.exports = router;
