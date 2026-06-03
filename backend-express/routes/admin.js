const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const approvedOnly = require('../middleware/approvedOnly');

// Admin Dashboard Overview Stats
router.get('/overview', authMiddleware, approvedOnly, async (req, res) => {
  try {
    const users = await User.find({}).lean();
    const resumes = await Resume.find({}).lean();
    const interviews = await Interview.find({}).lean();
    const jobs = await Job.find({}).lean();

    // Map _id to id for backwards compatibility
    const usersWithId = users.map(u => ({ ...u, id: u._id }));
    const resumesWithId = resumes.map(r => ({ ...r, id: r._id }));
    const interviewsWithId = interviews.map(i => ({ ...i, id: i._id }));
    const jobsWithId = jobs.map(j => ({ ...j, id: j._id }));

    const averageInterviewScore = interviewsWithId.length
      ? Math.round(
          interviewsWithId.reduce((sum, session) => sum + (session.report?.score || session.report?.overall_score || 0), 0) /
            interviewsWithId.length
        )
      : 0;

    const recentUsers = [...usersWithId]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8) // Limit to latest 8 users
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt
      }));

    const recentInterviews = [...interviewsWithId]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8)
      .map((session) => ({
        id: session.id,
        userId: session.userId,
        targetRole: session.targetRole,
        question: session.question,
        score: session.report?.score || session.report?.overall_score || 0,
        createdAt: session.createdAt
      }));

    const roleBreakdownMap = usersWithId.reduce((acc, user) => {
      const role = user.role || 'candidate';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const jobsByTypeMap = jobsWithId.reduce((acc, job) => {
      const type = job.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      metrics: {
        totalUsers: usersWithId.length,
        resumesAnalyzed: resumesWithId.length,
        interviewSessions: interviewsWithId.length,
        activeJobs: jobsWithId.length,
        averageInterviewScore
      },
      recentUsers,
      recentInterviews,
      jobs: jobsWithId.slice(0, 8).map((job) => ({
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
    console.error("Admin overview fetch failed:", err.message);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

// Update User Approval Status (Admin Only)
router.put('/users/:userId/approve', authMiddleware, approvedOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved } = req.body;

    if (isApproved === undefined) {
      return res.status(400).json({ error: "isApproved boolean is required in request body" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Protect against self-lockout: Don't allow active admin to unapprove themselves
    if (targetUser.id === req.user.id && !isApproved) {
      return res.status(400).json({ error: "Operation blocked: You cannot revoke your own approval status." });
    }

    targetUser.isApproved = isApproved;
    await targetUser.save();

    console.log(`Admin ${req.user.email} changed approval status of ${targetUser.email} to ${isApproved}`);

    res.status(200).json({
      message: `Successfully updated user approval to ${isApproved}`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isApproved: targetUser.isApproved
      }
    });
  } catch (err) {
    console.error("Failed to toggle approval:", err.message);
    res.status(500).json({ error: "Failed to update approval status: " + err.message });
  }
});

module.exports = router;
