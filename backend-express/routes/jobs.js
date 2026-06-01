const express = require('express');
const router = express.Router();
const axios = require('axios');
const { readDb } = require('../config/database');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Get all jobs
router.get('/', (req, res) => {
  try {
    const db = readDb();
    res.status(200).json(db.jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job postings" });
  }
});

// Calculate compatibility score of user skills against a specific job
router.post('/:jobId/match', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeSkills } = req.body;

    if (!resumeSkills || !Array.isArray(resumeSkills)) {
      return res.status(400).json({ error: "resumeSkills array is required in the body" });
    }

    const db = readDb();
    const job = db.jobs.find(j => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    // Call FastAPI job matcher
    const response = await axios.post(`${AI_SERVICE_URL}/match-job`, {
      resume_skills: resumeSkills,
      job_title: job.title,
      job_description: job.description
    });

    res.status(200).json({
      jobId,
      matchReport: response.data
    });
  } catch (err) {
    console.error("Job matching route error:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail
      ? err.response.data.detail
      : err.message;
    res.status(500).json({ error: "Job matching service failed: " + detail });
  }
});

module.exports = router;
