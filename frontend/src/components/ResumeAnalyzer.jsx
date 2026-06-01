import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertTriangle, ArrowRight, Loader } from 'lucide-react';
import { api } from '../utils/api';

export default function ResumeAnalyzer({ onResumeParsed, parsedResume, targetRole }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.uploadResume(file, targetRole);
      onResumeParsed(result.report);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-analyzer-view animate-fadeIn">
      {/* Upload Row */}
      <div className="glass-card">
        <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Resume Parser & ATS Optimizer</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Upload your resume in PDF or TXT format. We will scan your key terms, calculate ATS compatibility scoring, and detail critical keyword gaps.
        </p>

        <div 
          className="upload-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.txt" 
            style={{ display: 'none' }} 
          />
          <Upload className="upload-icon" />
          {file ? (
            <div>
              <h3 style={{ color: '#ffffff', fontWeight: '600' }}>{file.name}</h3>
              <p style={{ marginTop: '4px' }}>{(file.size / 1024).toFixed(1)} KB — Ready to analyze</p>
            </div>
          ) : (
            <div>
              <h3>Drag & drop your resume here, or <span style={{ color: 'var(--primary)', fontWeight: '600' }}>browse files</span></h3>
              <p style={{ marginTop: '4px' }}>Supports PDF and TXT documents up to 5MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="alert-box error" style={{ marginTop: '16px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button 
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} /> Analyzing Resume...
              </>
            ) : (
              <>
                Analyze Resume <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {parsedResume && (
        <div className="analyzer-results-grid">
          {/* Left Pane - ATS & Keywords */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: 'fit-content' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>ATS Match Rating</h3>
              <div style={{ display: 'inline-flex', justifyContent: 'center', position: 'relative', width: '130px', height: '130px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '50%', border: '1px solid var(--border-glass)', alignItems: 'center' }}>
                <span style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #ffffff 40%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {parsedResume.ats_score}
                </span>
                <span style={{ position: 'absolute', bottom: '16px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>ATS Score</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Extracted Skills</h4>
              <div className="chip-container">
                {parsedResume.skills_extracted.map((skill, i) => (
                  <span key={i} className="skill-chip found">
                    <Check size={12} /> {skill.toUpperCase()}
                  </span>
                ))}
                {parsedResume.skills_extracted.length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No standard tech keywords recognized. Add more context to your resume file.</span>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Missing Required Core</h4>
              <div className="chip-container">
                {parsedResume.skills_match.missing_required.map((skill, i) => (
                  <span key={i} className="skill-chip missing">
                    <AlertTriangle size={12} /> {skill.toUpperCase()}
                  </span>
                ))}
                {parsedResume.skills_match.missing_required.length === 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--success)' }}>All core credentials present! Excellent work.</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Pane - Specific Improvement Cards */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>AI Career Improvement Strategy</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {parsedResume.suggestions.map((sug, i) => (
                <div key={i} className={`suggestion-card priority-${sug.priority}`}>
                  <div className="suggestion-header">
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>{sug.priority} Priority Gap</h4>
                    <span className="priority-badge">{sug.priority}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>{sug.message}</p>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-glass)', marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Action:</span>
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>{sug.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
