const express = require('express');
const router = express.Router();
const { readDb } = require('../config/database');

router.get('/overview', (req, res) => {
  try {
    const db = readDb();

    const users = db.users || [];
    const resumes = db.resumes || [];
    const interviews = db.interviews || [];
    const jobs = db.jobs || [];

    const averageInterviewScore = interviews.length
      ? Math.round(
          interviews.reduce((sum, session) => sum + (session.report?.score || session.report?.overall_score || 0), 0) /
            interviews.length
        )
      : 0;

    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }));

    const recentInterviews = [...interviews]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map((session) => ({
        id: session.id,
        userId: session.userId,
        targetRole: session.targetRole,
        question: session.question,
        score: session.report?.score || session.report?.overall_score || 0,
        createdAt: session.createdAt
      }));

    const roleBreakdownMap = users.reduce((acc, user) => {
      const role = user.role || 'candidate';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const jobsByTypeMap = jobs.reduce((acc, job) => {
      const type = job.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      metrics: {
        totalUsers: users.length,
        resumesAnalyzed: resumes.length,
        interviewSessions: interviews.length,
        activeJobs: jobs.length,
        averageInterviewScore
      },
      recentUsers,
      recentInterviews,
      jobs: jobs.slice(0, 8).map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        type: job.type,
        location: job.location
      })),
      roleBreakdown: Object.entries(roleBreakdownMap).map(([role, count]) => ({ role, count })),
      jobsByType: Object.entries(jobsByTypeMap).map(([type, count]) => ({ type, count }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

module.exports = router;
