import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Award, AlertTriangle, ArrowRight, Loader } from 'lucide-react';
import { api } from '../utils/api';

export default function JobRecommendations({ parsedResume, setView, setCoachContext }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState({});
  const [matchingInProgress, setMatchingInProgress] = useState({});
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');

  // Load job listings on mount
  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const fetched = await api.getJobs();
        setJobs(fetched);
        
        // Proactively run match analyses if a resume is already parsed!
        if (parsedResume && parsedResume.skills_extracted) {
          fetched.forEach(job => {
            triggerJobMatch(job.id, parsedResume.skills_extracted);
          });
        }
      } catch (err) {
        setError('Failed to load job listings.');
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [parsedResume]);

  const triggerJobMatch = async (jobId, skills) => {
    setMatchingInProgress(prev => ({ ...prev, [jobId]: true }));
    try {
      const result = await api.matchJob(jobId, skills);
      setMatches(prev => ({ ...prev, [jobId]: result.matchReport }));
    } catch (err) {
      console.error(`Failed matching job ${jobId}:`, err);
    } finally {
      setMatchingInProgress(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleTailor = (job, matchReport) => {
    // Inject contextual instructions into Career Coach chat box
    const missing = matchReport ? matchReport.missing_skills : job.skillsRequired;
    const promptMessage = `How do I tailor my resume for the '${job.title}' role at '${job.company}'? My missing skills are: ${missing.join(', ').toUpperCase()}. Please draft custom bullet points.`;
    
    setCoachContext({
      initialMessage: promptMessage,
      topic: "resume_review"
    });
    setView('coach'); // Toggle to chat screen
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'All') return true;
    return job.type === filter;
  });

  return (
    <div className="job-recommendations-view animate-fadeIn">
      {/* Header and Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>AI Recommended Openings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Browse career listings scored dynamically based on your parsed resume skills.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '4px', borderRadius: '10px' }}>
          {['All', 'Full-Time', 'Contract'].map((type) => (
            <button 
              key={type}
              className="btn"
              style={{ 
                padding: '6px 14px', 
                fontSize: '12px', 
                borderRadius: '8px',
                backgroundColor: filter === type ? 'var(--primary-light)' : 'transparent',
                color: filter === type ? '#ffffff' : 'var(--text-muted)',
                borderColor: 'transparent'
              }}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-box error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => {
            const matchReport = matches[job.id];
            const isMatching = matchingInProgress[job.id];
            
            // Score badges styling
            const pct = matchReport ? matchReport.match_percentage : 0;
            const badgeClass = pct >= 80 ? 'high-match' : 'med-match';

            return (
              <div key={job.id} className="glass-card job-card glow-teal">
                <div>
                  <div className="job-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                      <span className="job-company">{job.company}</span>
                    </div>

                    {parsedResume ? (
                      isMatching ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scoring...</div>
                      ) : matchReport ? (
                        <div className={`job-match-badge ${badgeClass}`}>
                          <Award size={14} /> {pct}% Match
                        </div>
                      ) : null
                    ) : (
                      <div className="job-match-badge med-match" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => setView('resume')}>
                        Analyze Resume to Score
                      </div>
                    )}
                  </div>

                  <div className="job-meta-pills">
                    <span className="meta-pill"><MapPin size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{job.location}</span>
                    <span className="meta-pill">{job.type}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '14px 0', lineHeight: '1.4' }}>
                    {job.description}
                  </p>

                  {/* Skills Section */}
                  {matchReport && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Keyword Matches</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {matchReport.matching_skills.map((s, idx) => (
                          <span key={idx} style={{ fontSize: '10px', backgroundColor: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)', color: '#99f6e4', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {s.toUpperCase()}
                          </span>
                        ))}
                        {matchReport.missing_skills.map((s, idx) => (
                          <span key={idx} style={{ fontSize: '10px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            -{s.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="job-footer">
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <DollarSign size={14} style={{ color: 'var(--secondary)' }} />
                    <span className="salary-label">{job.salary}</span>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '12px', gap: '6px' }}
                    onClick={() => handleTailor(job, matchReport)}
                  >
                    Tailor Resume <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredJobs.length === 0 && (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No openings found in this filter category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
