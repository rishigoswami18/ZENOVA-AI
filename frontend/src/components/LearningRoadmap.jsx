import React, { useState, useEffect } from 'react';
import { Compass, BookOpen, Hammer, Check, Loader, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

export default function LearningRoadmap({ parsedResume, targetRole, onProgressUpdate }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checklist, setChecklist] = useState({});

  const missingSkills = parsedResume ? parsedResume.skills_match.missing_required : [];

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.generateRoadmap(targetRole, missingSkills);
      setRoadmap(data.roadmap);
      
      // Initialize checklist state
      const initialChecklist = {};
      ['phase_30', 'phase_60', 'phase_90'].forEach(phase => {
        if (data.roadmap[phase]) {
          data.roadmap[phase].tasks.forEach(task => {
            initialChecklist[task.id] = false;
          });
        }
      });
      setChecklist(initialChecklist);
      onProgressUpdate(0);
    } catch (err) {
      setError(err.message || 'Failed to generate your roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [targetRole, parsedResume]);

  const toggleTask = (taskId) => {
    const nextChecklist = { ...checklist, [taskId]: !checklist[taskId] };
    setChecklist(nextChecklist);

    // Calculate percentage
    const keys = Object.keys(nextChecklist);
    const completed = keys.filter(k => nextChecklist[k]).length;
    const progress = keys.length > 0 ? Math.round((completed / keys.length) * 100) : 0;
    
    onProgressUpdate(progress);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px' }}>
        <Loader className="animate-spin" size={36} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Synthesizing your personalized 30/60/90-Day Learning Path...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</p>
        <button className="btn btn-secondary" onClick={fetchRoadmap}>
          <RefreshCw size={14} /> Retry Generation
        </button>
      </div>
    );
  }

  const phases = [
    { key: 'phase_30', icon: '30', title: 'Day 1-30' },
    { key: 'phase_60', icon: '60', title: 'Day 31-60' },
    { key: 'phase_90', icon: '90', title: 'Day 61-90' }
  ];

  return (
    <div className="learning-roadmap-view animate-fadeIn">
      <div className="glass-card" style={{ marginBottom: '35px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px' }}>Custom Career Acceleration Roadmap</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Your curriculum for <strong>{targetRole}</strong>, designed specifically to fill your recognized skill gaps.
            </p>
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={fetchRoadmap}>
            <RefreshCw size={12} /> Regenerate
          </button>
        </div>
      </div>

      <div className="roadmap-timeline">
        {phases.map((phaseItem, index) => {
          const phaseData = roadmap[phaseItem.key];
          if (!phaseData) return null;

          return (
            <div key={index} className="timeline-node active">
              <div className="node-marker">{phaseItem.icon}</div>
              
              <div className="node-content glass-card">
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {phaseData.title}
                </h3>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
                  {phaseData.focus}
                </p>

                {/* Subsections: Tasks, Courses, Project */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px', marginTop: '24px' }}>
                  
                  {/* Tasks list */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '14px' }}>Checklist Milestones</h4>
                    <div className="roadmap-checklist">
                      {phaseData.tasks.map((task) => {
                        const isDone = checklist[task.id];
                        return (
                          <div 
                            key={task.id} 
                            className={`checklist-item ${isDone ? 'checked' : ''}`}
                            onClick={() => toggleTask(task.id)}
                          >
                            <div className="checklist-checkbox">
                              {isDone && <Check size={12} />}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{task.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Courses & Project */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={12} /> Recommended Courses
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {phaseData.courses.map((course, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{course}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Hammer size={12} /> Practical Capstone
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {phaseData.project}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
