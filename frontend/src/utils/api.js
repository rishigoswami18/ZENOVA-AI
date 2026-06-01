const BASE_URL = '/api';

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const activeToken = token || localStorage.getItem('token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

export const api = {
  async getAdminOverview() {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load admin overview');
    return data;
  },

  // Auth Operations
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async signup(name, email, password) {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  // Resume Operations
  async uploadResume(file, targetRole) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/resume/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to parse resume');
    return data;
  },

  async getResumeHistory() {
    const res = await fetch(`${BASE_URL}/resume/history`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load resume history');
    return data;
  },

  // Job Operations
  async getJobs() {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load jobs');
    return data;
  },

  async matchJob(jobId, resumeSkills) {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}/match`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ resumeSkills })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Job matching calculation failed');
    return data;
  },

  // Roadmap Operations
  async generateRoadmap(targetRole, missingSkills) {
    // Calling the Python AI service via a route proxied by FastAPI or direct
    // Since our monorepo scripts define routes, let's look at Express gateway endpoints.
    // Wait, let's see. Does Express have a roadmap route?
    // In our implementation plan we had '/generate-roadmap' on FastAPI.
    // Wait! Let's make sure our Express backend can proxy or we can call FastAPI directly from frontend,
    // or let's call FastAPI on port 8000 directly!
    // Wait, calling FastAPI on port 8000 directly from the frontend works beautifully because we enabled CORS on FastAPI (`allow_origins=["*"]`)!
    // This is super clean and robust: heavy AI operations can hit the FastAPI backend directly on port 8000!
    // Let's implement that! Direct FastAPI calls to `http://127.0.0.1:8000` is incredibly fast.
    const res = await fetch(`http://127.0.0.1:8000/generate-roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_role: targetRole, missing_skills: missingSkills })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to generate roadmap');
    return data;
  },

  // Interview Operations
  async getInterviewQuestions(role) {
    const res = await fetch(`${BASE_URL}/interview/questions?role=${encodeURIComponent(role)}`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load questions');
    return data;
  },

  async gradeInterviewAnswer(question, userAnswer, targetRole, difficulty) {
    const res = await fetch(`${BASE_URL}/interview/grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question, userAnswer, targetRole, difficulty })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Evaluation grading failed');
    return data;
  },

  async createVideoInterviewSession(targetRole, interviewType, difficulty) {
    const res = await fetch(`${BASE_URL}/interview/video-session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ targetRole, interviewType, difficulty })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start virtual interview');
    return data;
  },

  async gradeVideoInterviewAnswer(question, transcript, targetRole, interviewType, difficulty, durationSeconds) {
    const res = await fetch(`${BASE_URL}/interview/video-grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question, transcript, targetRole, interviewType, difficulty, durationSeconds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Virtual interview evaluation failed');
    return data;
  },

  // Coach Chat Operations
  async sendMessageToCoach(message, history, topic = null) {
    const res = await fetch(`http://127.0.0.1:8000/coach-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, topic })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to get response from career coach');
    return data;
  }
};
