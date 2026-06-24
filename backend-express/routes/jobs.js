const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const Job = require('../models/Job');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const matchCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache matching evaluations for 1 hour

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({}).lean();
    
    // Map _id to id for compatibility
    const jobsWithId = jobs.map(j => ({ ...j, id: j._id }));
    
    res.status(200).json(jobsWithId);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job postings: " + err.message });
  }
});

// Calculate compatibility score of user skills against a specific job (with local in-memory caching)
router.post('/:jobId/match', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeSkills } = req.body;

    if (!resumeSkills || !Array.isArray(resumeSkills)) {
      return res.status(400).json({ error: "resumeSkills array is required in the body" });
    }

    // Check if match calculation is already cached
    const sortedSkills = [...resumeSkills].sort().join(',');
    const cacheKey = `match_${jobId}_${sortedSkills}`;
    const cachedResult = matchCache.get(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    // Call FastAPI job matcher
    const response = await axios.post(`${AI_SERVICE_URL}/match-job`, {
      resume_skills: resumeSkills,
      job_title: job.title,
      job_description: job.description
    }, {
      headers: {
        'x-correlation-id': req.correlationId
      }
    });

    const matchResponse = {
      jobId,
      matchReport: response.data
    };

    // Cache the successful match result
    matchCache.set(cacheKey, matchResponse);

    res.status(200).json(matchResponse);
  } catch (err) {
    console.error("Job matching route error:", err.message);
    const detail = err.response && err.response.data && err.response.data.detail
      ? err.response.data.detail
      : err.message;
    res.status(500).json({ error: "Job matching service failed: " + detail });
  }
});

module.exports = router;
