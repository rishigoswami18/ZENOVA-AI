import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, Award, Compass } from 'lucide-react';

const ROLE_REQS_MOCK = {
  "AI Engineer": {
    required: ["python", "pytorch", "tensorflow", "llms", "nlp", "vector databases", "git"],
    preferred: ["langchain", "fastapi", "docker", "huggingface", "pandas", "numpy"]
  },
  "ML Engineer": {
    required: ["python", "scikit-learn", "pytorch", "numpy", "pandas", "deep learning", "git"],
    preferred: ["docker", "tensorflow", "fastapi", "sql", "ci/cd"]
  },
  "Fullstack Engineer": {
    required: ["javascript", "typescript", "react", "node.js", "express", "sql", "git"],
    preferred: ["next.js", "tailwind css", "docker", "aws", "postgresql", "mongodb"]
  },
  "Backend Developer": {
    required: ["python", "node.js", "express", "sql", "postgresql", "rest apis", "git"],
    preferred: ["fastapi", "docker", "redis", "microservices", "aws", "kubernetes"]
  },
  "Frontend Developer": {
    required: ["html", "css", "javascript", "typescript", "react", "tailwind css", "git"],
    preferred: ["next.js", "redux", "sass", "webpack", "vite"]
  }
};

export default function SkillGapDetector({ parsedResume, targetRole, setTargetRole, setView }) {
  const currentSkills = parsedResume ? parsedResume.skills_extracted : [];
  const reqs = ROLE_REQS_MOCK[targetRole] || ROLE_REQS_MOCK["AI Engineer"];

  // Merge and calculate rows
  const allSkillsMap = [];
  
  reqs.required.forEach(skill => {
    const found = currentSkills.includes(skill.toLowerCase());
    allSkillsMap.push({
      name: skill,
      type: "Core Required",
      status: found ? "Found" : "Missing",
      priority: found ? "Resolved" : "High",
      dotColor: found ? "green" : "red"
    });
  });

  reqs.preferred.forEach(skill => {
    const found = currentSkills.includes(skill.toLowerCase());
    allSkillsMap.push({
      name: skill,
      type: "Preferred Tech",
      status: found ? "Found" : "Missing",
      priority: found ? "Resolved" : "Medium",
      dotColor: found ? "green" : "orange"
    });
  });

  // Sort: High priority missing first, then Medium, then Resolved
  allSkillsMap.sort((a, b) => {
    const order = { "High": 1, "Medium": 2, "Resolved": 3 };
    return order[a.priority] - order[b.priority];
  });

  const missingCoreCount = allSkillsMap.filter(s => s.status === 'Missing' && s.type === 'Core Required').length;

  return (
    <div className="skill-gap-view animate-fadeIn">
      <div className="glass-card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px' }}>Target Career Track Gap Detector</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Select your goal career track below. We'll map your resume keywords against live employer expectations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>GOAL:</span>
            <select 
              className="role-selector" 
              value={targetRole} 
              onChange={(e) => setTargetRole(e.target.value)}
            >
              {Object.keys(ROLE_REQS_MOCK).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Left Side: Summary Panel */}
        <div className="glass-card" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px' }}>Competency Summary</h3>
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Core Skills Match</span>
              <span style={{ fontWeight: '700' }}>
                {reqs.required.filter(s => currentSkills.includes(s)).length} / {reqs.required.length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Missing Keywords</span>
              <span style={{ fontWeight: '700', color: missingCoreCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {allSkillsMap.filter(s => s.status === 'Missing').length} gaps
              </span>
            </div>
          </div>

          {missingCoreCount > 0 ? (
            <div style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: '#fca5a5', lineHeight: '1.4' }}>
                You have <strong>{missingCoreCount} Core Required</strong> skill gaps for {targetRole}. Recruiters and ATS bots will flag these as disqualifiers.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: '#a7f3d0', lineHeight: '1.4' }}>
                Awesome! You satisfy all core keywords for this track. Use the roadmap module to sharpen advanced topics.
              </p>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', gap: '10px' }}
            onClick={() => setView('roadmap')}
          >
            <Compass size={18} /> Generate Learning Roadmap
          </button>
        </div>

        {/* Right Side: Matrix Table */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '18px', padding: '10px 16px 0 16px' }}>Detailed Match Grid</h3>
          <table className="gap-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Category</th>
                <th>Status</th>
                <th>Action Priority</th>
              </tr>
            </thead>
            <tbody>
              {allSkillsMap.map((row, idx) => (
                <tr key={idx} style={{ opacity: row.status === 'Found' ? 0.75 : 1 }}>
                  <td style={{ fontWeight: '700', color: row.status === 'Missing' ? '#ffffff' : 'var(--text-muted)' }}>
                    {row.name.toUpperCase()}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.type}</td>
                  <td>
                    <span style={{ 
                      fontSize: '11px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      color: row.status === 'Found' ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {row.status === 'Found' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span className="priority-indicator">
                      <span className={`indicator-dot ${row.dotColor}`}></span>
                      <span style={{ 
                        fontSize: '12px',
                        color: row.priority === 'High' ? 'var(--danger)' : row.priority === 'Medium' ? 'var(--warning)' : 'var(--text-dark)'
                      }}>{row.priority}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
