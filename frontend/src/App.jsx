import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Briefcase, Award, Compass, 
  HelpCircle, MessageSquare, LogOut, Shield, Key, Mail, UserIcon, ArrowRight, Settings2
} from 'lucide-react';
import { api } from './utils/api';

import AdminDashboard from './components/AdminDashboard';
import Dashboard from './components/Dashboard';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import JobRecommendations from './components/JobRecommendations';
import SkillGapDetector from './components/SkillGapDetector';
import LearningRoadmap from './components/LearningRoadmap';
import MockInterview from './components/MockInterview';
import CareerCoach from './components/CareerCoach';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Auth Form State
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', 'guest'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // App Layout States
  const [view, setView] = useState('dashboard'); // 'dashboard', 'resume', 'jobs', 'skills', 'roadmap', 'interview', 'coach', 'admin'
  const [targetRole, setTargetRole] = useState('AI Engineer');
  const [parsedResume, setParsedResume] = useState(null);
  const [coachContext, setCoachContext] = useState(null);

  // Dynamic Dashboard Stats
  const [stats, setStats] = useState({
    avgJobMatch: 76,
    interviewReadiness: 60,
    resumesAnalyzed: 0,
    skillsSolved: 0,
    roadmapProgress: 0
  });

  // Check login state on mount & sync profile status
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const syncProfile = async () => {
      if (token) {
        try {
          const latestUser = await api.getMe();
          localStorage.setItem('user', JSON.stringify(latestUser));
          setUser(latestUser);
        } catch (err) {
          console.error("Token sync failed:", err.message);
          if (err.message.includes("denied") || err.message.includes("expired") || err.message.includes("token")) {
            handleLogout();
          }
        }
      }
    };

    syncProfile();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setView('dashboard');
    } catch (err) {
      setAuthError(err.message || 'Login failed.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.signup(name, email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setView('dashboard');
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setParsedResume(null);
    setAuthView('login');
  };

  const handleResumeParsed = (report) => {
    setParsedResume(report);
    // Recalculate stats dynamically
    setStats(prev => ({
      ...prev,
      resumesAnalyzed: prev.resumesAnalyzed + 1,
      avgJobMatch: Math.round(report.ats_score * 0.95), // baseline projection
      skillsSolved: report.skills_extracted.length
    }));
  };

  // Nav configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'jobs', label: 'Job Recommendations', icon: Briefcase },
    { id: 'skills', label: 'Skill Gap Detector', icon: Award },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'interview', label: 'Video Interview', icon: HelpCircle },
    { id: 'coach', label: 'AI Career Coach', icon: MessageSquare },
    ...(user?.role === 'admin' && user?.isApproved ? [{ id: 'admin', label: 'Admin Dashboard', icon: Settings2 }] : [])
  ];

  // Renders login/signup card if no active session
  if (!token && authView !== 'guest') {
    return (
      <div className="auth-wrapper">
        <div className="glass-card auth-card glow-indigo">
          <div className="auth-header">
            <div style={{ display: 'inline-flex', padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '14px', color: 'var(--primary)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }}>
              <Shield size={28} />
            </div>
            <h2>ZENOVA AI</h2>
            <p>Accelerate your career track with production grading and ATS scoring.</p>
          </div>

          {authError && (
            <div className="alert-box error">
              <Mail size={16} />
              <span>{authError}</span>
            </div>
          )}

          {authView === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="name@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }} type="submit">
                Access Platform <ArrowRight size={16} />
              </button>

              <div className="auth-toggle">
                Don't have an account? <span onClick={() => setAuthView('signup')}>Create Account</span>
              </div>
              <div className="auth-toggle" style={{ marginTop: '10px' }}>
                Or view as <span style={{ color: 'var(--secondary)' }} onClick={() => setAuthView('guest')}>Guest Mode</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="Your Name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="name@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }} type="submit">
                Initialize Account <ArrowRight size={16} />
              </button>

              <div className="auth-toggle">
                Already registered? <span onClick={() => setAuthView('login')}>Sign In</span>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // App Dashboard Layout
  const userProfileName = user ? user.name : "Guest User";
  const userProfileRole = parsedResume ? parsedResume.target_role : "Explorer Track";

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ display: 'flex', padding: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '10px' }}>
            <Shield size={20} />
          </div>
          <span className="logo-text">ZENOVA AI</span>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="avatar">{userProfileName.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <div className="profile-name">{userProfileName}</div>
            <div className="profile-role">{userProfileRole}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content grid */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            <h1>
              {view === 'dashboard' && `Welcome, ${userProfileName}`}
              {view === 'resume' && "Resume Keyword Optimization"}
              {view === 'jobs' && "Tailored Positions Matrix"}
              {view === 'skills' && "Skill Deficiencies Map"}
              {view === 'roadmap' && "Career Roadmap Tracker"}
              {view === 'interview' && "Video Interview Preparation"}
              {view === 'coach' && "Conversational AI Coach"}
              {view === 'admin' && "Admin Operations Dashboard"}
            </h1>
            <p>
              {view === 'dashboard' && "Here's an overview of your hiring metrics and progress."}
              {view === 'resume' && "Map keywords and ATS score calculations."}
              {view === 'jobs' && "Review matched job specs aligned with your parsed credentials."}
              {view === 'skills' && "Analyze required vs. preferred tool gaps."}
              {view === 'roadmap' && "Track Day 30 / 60 / 90 educational timelines."}
              {view === 'interview' && "Practice written answers or talk with the AI video interviewer in a live-style round."}
              {view === 'coach' && "Draft negotiation letters or portfolio strategies."}
              {view === 'admin' && "Monitor platform users, interview traffic, resume activity, and job inventory."}
            </p>
          </div>

          <div className="header-actions">
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>CAREER GOAL:</span>
            <select 
              className="role-selector"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="AI Engineer">AI Engineer</option>
              <option value="ML Engineer">ML Engineer</option>
              <option value="Fullstack Engineer">Fullstack Engineer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
            </select>
          </div>
        </header>

        <div className="content-body">
          {view === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              setView={setView} 
              parsedResume={parsedResume} 
            />
          )}
          {view === 'resume' && (
            <ResumeAnalyzer 
              onResumeParsed={handleResumeParsed} 
              parsedResume={parsedResume}
              targetRole={targetRole}
            />
          )}
          {view === 'jobs' && (
            <JobRecommendations 
              parsedResume={parsedResume} 
              setView={setView} 
              setCoachContext={setCoachContext} 
            />
          )}
          {view === 'skills' && (
            <SkillGapDetector 
              parsedResume={parsedResume} 
              targetRole={targetRole} 
              setTargetRole={setTargetRole}
              setView={setView}
            />
          )}
          {view === 'roadmap' && (
            <LearningRoadmap 
              parsedResume={parsedResume} 
              targetRole={targetRole} 
              onProgressUpdate={(prog) => setStats(prev => ({ ...prev, roadmapProgress: prog }))}
            />
          )}
          {view === 'interview' && (
            <MockInterview 
              targetRole={targetRole} 
              onInterviewScoreUpdate={(score) => setStats(prev => ({ ...prev, interviewReadiness: score }))}
            />
          )}
          {view === 'coach' && (
            <CareerCoach 
              coachContext={coachContext} 
              clearCoachContext={() => setCoachContext(null)} 
            />
          )}
          {view === 'admin' && user?.role === 'admin' && user?.isApproved ? (
            <AdminDashboard />
          ) : view === 'admin' ? (
            <div className="glass-card" style={{ margin: '40px auto', maxWidth: '500px', padding: '30px', textAlign: 'center' }}>
              <Shield size={48} style={{ color: 'var(--warning)', margin: '0 auto 20px', display: 'block' }} />
              <h2 style={{ marginBottom: '10px' }}>Access Restricted</h2>
              <p style={{ color: 'var(--text-muted)' }}>Your account has not been approved to access the Admin Control Dashboard. Please ask an administrator to approve your account.</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
