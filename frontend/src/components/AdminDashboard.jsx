import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  FileText,
  Shield,
  Users
} from 'lucide-react';
import { api } from '../utils/api';

const metricCards = [
  { key: 'totalUsers', label: 'Platform Users', icon: Users, accent: 'var(--primary)' },
  { key: 'resumesAnalyzed', label: 'Resumes Parsed', icon: FileText, accent: 'var(--secondary)' },
  { key: 'interviewSessions', label: 'Interview Sessions', icon: Activity, accent: 'var(--accent)' },
  { key: 'activeJobs', label: 'Active Jobs', icon: Briefcase, accent: 'var(--warning)' },
  { key: 'averageInterviewScore', label: 'Avg Interview Score', icon: BarChart3, accent: 'var(--success)' }
];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getAdminOverview();
        setOverview(data);
      } catch (err) {
        setError(err.message || 'Failed to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  if (loading) {
    return (
      <div className="glass-card admin-empty-state">
        <Shield size={22} />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-box error">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-view animate-fadeIn">
      <div className="admin-hero">
        <div className="glass-card admin-hero-card">
          <div>
            <p className="admin-eyebrow">Admin Control Room</p>
            <h2>Placement platform operations at a glance</h2>
            <p className="admin-hero-copy">
              Monitor user growth, resume analysis volume, interview activity, and job inventory from one place.
            </p>
          </div>
          <div className="admin-status-badge">
            <Shield size={16} />
            <span>Internal Dashboard</span>
          </div>
        </div>
      </div>

      <div className="admin-metrics-grid">
        {metricCards.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="glass-card admin-metric-card">
            <div className="admin-metric-icon" style={{ color: accent, backgroundColor: `${accent}22` }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="admin-metric-label">{label}</p>
              <h3 className="admin-metric-value">{overview?.metrics?.[key] ?? 0}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-main-grid">
        <div className="glass-card admin-panel">
          <div className="admin-panel-header">
            <h3>Recent Users</h3>
            <span>{overview.recentUsers.length} latest signups</span>
          </div>
          <div className="admin-list">
            {overview.recentUsers.length ? overview.recentUsers.map((user) => (
              <div key={user.id} className="admin-list-item">
                <div>
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                </div>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            )) : (
              <div className="admin-empty-inline">No users found yet.</div>
            )}
          </div>
        </div>

        <div className="glass-card admin-panel">
          <div className="admin-panel-header">
            <h3>Role Breakdown</h3>
            <span>User mix</span>
          </div>
          <div className="admin-stats-stack">
            {overview.roleBreakdown.length ? overview.roleBreakdown.map((entry) => (
              <div key={entry.role} className="admin-stat-row">
                <div>
                  <strong>{entry.role}</strong>
                  <p>Accounts with this role</p>
                </div>
                <span>{entry.count}</span>
              </div>
            )) : (
              <div className="admin-empty-inline">No role data yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-main-grid">
        <div className="glass-card admin-panel">
          <div className="admin-panel-header">
            <h3>Recent Interviews</h3>
            <span>Latest graded sessions</span>
          </div>
          <div className="admin-table">
            <div className="admin-table-head">
              <span>Role</span>
              <span>Question</span>
              <span>Score</span>
              <span>Date</span>
            </div>
            {overview.recentInterviews.length ? overview.recentInterviews.map((session) => (
              <div key={session.id} className="admin-table-row">
                <span>{session.targetRole || 'N/A'}</span>
                <span>{session.question}</span>
                <span>{session.score}</span>
                <span>{formatDate(session.createdAt)}</span>
              </div>
            )) : (
              <div className="admin-empty-inline">No interview sessions recorded yet.</div>
            )}
          </div>
        </div>

        <div className="glass-card admin-panel">
          <div className="admin-panel-header">
            <h3>Job Inventory</h3>
            <span>Live role catalog</span>
          </div>
          <div className="admin-list">
            {overview.jobs.length ? overview.jobs.map((job) => (
              <div key={job.id} className="admin-list-item">
                <div>
                  <strong>{job.title}</strong>
                  <p>{job.company} · {job.location}</p>
                </div>
                <span>{job.type}</span>
              </div>
            )) : (
              <div className="admin-empty-inline">No jobs available.</div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card admin-panel">
        <div className="admin-panel-header">
          <h3>Jobs by Type</h3>
          <span>Supply distribution</span>
        </div>
        <div className="admin-stats-grid">
          {overview.jobsByType.length ? overview.jobsByType.map((entry) => (
            <div key={entry.type} className="admin-stat-tile">
              <strong>{entry.type}</strong>
              <span>{entry.count} roles</span>
            </div>
          )) : (
            <div className="admin-empty-inline">No job type data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString();
}
