import React from 'react';
import {
  FileText, Briefcase, Award, TrendingUp,
  MessageSquare, ArrowRight, Zap, Video
} from 'lucide-react';

export default function Dashboard({ stats, setView, parsedResume }) {
  const atsScore = parsedResume ? parsedResume.ats_score : 0;
  const targetRole = parsedResume ? parsedResume.target_role : "N/A";
  
  // Calculate dash offset for radial progress (circle circum = 2 * PI * r = 2 * 3.14159 * 52 = 326.7)
  const calcDashOffset = (score) => {
    const circum = 326.7;
    return circum - (score / 100) * circum;
  };

  return (
    <div className="dashboard-view animate-fadeIn">
      {/* Metrics Row */}
      <div className="db-grid">
        {/* ATS Score */}
        <div className="glass-card db-metric-card glow-indigo">
          <div className="db-metric-info">
            <h3>ATS Resume Rating</h3>
            <p>{atsScore > 0 ? `${atsScore}%` : "Not Uploaded"}</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {parsedResume ? `Optimized for ${targetRole}` : "Upload resume to calculate"}
            </span>
          </div>
          <div className="radial-progress">
            <svg className="radial-svg">
              <circle className="radial-bg" cx="60" cy="60" r="52" />
              <circle 
                className="radial-value" 
                cx="60" 
                cy="60" 
                r="52" 
                stroke="url(#indigoGrad)"
                strokeDasharray="326.7"
                strokeDashoffset={calcDashOffset(atsScore)}
              />
              <defs>
                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="radial-text">
              <span className="radial-number">{atsScore}</span>
              <span className="radial-label">ATS</span>
            </div>
          </div>
        </div>

        {/* Job Match Rating */}
        <div className="glass-card db-metric-card glow-teal">
          <div className="db-metric-info">
            <h3>Avg Job Match</h3>
            <p>{stats.avgJobMatch}%</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Against 5 target listings
            </span>
          </div>
          <div className="radial-progress">
            <svg className="radial-svg">
              <circle className="radial-bg" cx="60" cy="60" r="52" />
              <circle 
                className="radial-value" 
                cx="60" 
                cy="60" 
                r="52" 
                stroke="url(#tealGrad)"
                strokeDasharray="326.7"
                strokeDashoffset={calcDashOffset(stats.avgJobMatch)}
              />
              <defs>
                <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--secondary)" />
                  <stop offset="100%" stopColor="var(--primary)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="radial-text">
              <span className="radial-number">{stats.avgJobMatch}</span>
              <span className="radial-label">MATCH</span>
            </div>
          </div>
        </div>

        {/* Interview Readiness */}
        <div className="glass-card db-metric-card glow-indigo">
          <div className="db-metric-info">
            <h3>Interview Readiness</h3>
            <p>{stats.interviewReadiness}%</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Based on mock session evaluations
            </span>
          </div>
          <div className="radial-progress">
            <svg className="radial-svg">
              <circle className="radial-bg" cx="60" cy="60" r="52" />
              <circle 
                className="radial-value" 
                cx="60" 
                cy="60" 
                r="52" 
                stroke="var(--accent)"
                strokeDasharray="326.7"
                strokeDashoffset={calcDashOffset(stats.interviewReadiness)}
              />
            </svg>
            <div className="radial-text">
              <span className="radial-number">{stats.interviewReadiness}</span>
              <span className="radial-label">READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Row Grid */}
      <div className="db-row-grid">
        {/* Left Side: Recent Activity & Shortcuts */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px' }}>Dashboard Overview</h2>
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setView('resume')}>
              Optimize Resume <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' }}>
                <FileText size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Resumes Analyzed</h4>
                <p style={{ fontSize: '24px', fontWeight: '800', marginTop: '2px' }}>{stats.resumesAnalyzed}</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: '12px' }}>
                <Award size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Skill Gaps Solved</h4>
                <p style={{ fontSize: '24px', fontWeight: '800', marginTop: '2px' }}>{stats.skillsSolved}</p>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Recommended Tasks</h3>
          <div className="db-activity-list">
            <div className="activity-item">
              <div className="activity-icon" style={{ color: 'var(--primary)' }}>
                <Zap size={18} />
              </div>
              <div className="activity-desc">
                <h4>Incorporate Missing AI/ML Keywords</h4>
                <p>Add 'Transformers' and 'Vector Databases' to your resume to increase ATS compatibility by 18%.</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setView('resume')}>
                Fix Now
              </button>
            </div>

            <div className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                <TrendingUp size={18} />
              </div>
              <div className="activity-desc">
                <h4>Practice System Design Interview</h4>
                <p>You have a pending mock interview grading report for RAG Architecture questions.</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setView('interview')}>
                Practice
              </button>
            </div>

            <div className="activity-item">
              <div className="activity-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.14)', color: 'var(--accent)' }}>
                <Video size={18} />
              </div>
              <div className="activity-desc">
                <h4>Start AI Video Interview</h4>
                <p>Launch the animated interviewer, answer with voice, and get live-style feedback on content and delivery.</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setView('interview')}>
                Open
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Copilot Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Quick AI Coach chatbot shortcut */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: '16px' }}>AI Career Coach</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Ask your Career Coach anything: salary negotiations, interview loops, or FAANG project portfolio strategies.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '10px' }} onClick={() => setView('coach')}>
              Chat with AI Coach
            </button>
          </div>

          {/* Target Track stats */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Current Target Track</h3>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Role Track</span>
                <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{parsedResume ? targetRole : "AI Engineer"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Learning Goal</span>
                <span style={{ fontWeight: '700' }}>30/60/90-Day Roadmap</span>
              </div>
            </div>
            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
                <span>Roadmap Progress</span>
                <span>{stats.roadmapProgress}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${stats.roadmapProgress}%`, backgroundColor: 'var(--secondary)' }}></div>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', padding: '10px' }} onClick={() => setView('roadmap')}>
              View Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
