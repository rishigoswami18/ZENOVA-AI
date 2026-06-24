const EXPRESS_API_URL =
  import.meta.env.VITE_EXPRESS_API_URL || 'http://127.0.0.1:5000/api';
const FASTAPI_API_URL =
  import.meta.env.VITE_FASTAPI_API_URL || 'http://127.0.0.1:8000';

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const activeToken = token || localStorage.getItem('token');
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }
  return headers;
}

async function parseApiResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    return res.json();
  }

  const text = await res.text();
  throw new Error(text || `Unexpected ${res.status} response from server`);
}

async function fetchJson(url, options, fallbackError) {
  const res = await fetch(url, options);
  const data = await parseApiResponse(res);

  if (!res.ok) {
    const message =
      data?.error ||
      data?.detail ||
      fallbackError ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  async getAdminOverview() {
    return fetchJson(
      `${EXPRESS_API_URL}/admin/overview`,
      {
        method: 'GET',
        headers: getHeaders()
      },
      'Failed to load admin overview'
    );
  },

  async getMe() {
    return fetchJson(
      `${EXPRESS_API_URL}/auth/me`,
      {
        method: 'GET',
        headers: getHeaders()
      },
      'Failed to load user profile'
    );
  },

  async toggleUserApproval(userId, isApproved) {
    return fetchJson(
      `${EXPRESS_API_URL}/admin/users/${userId}/approve`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isApproved })
      },
      'Failed to update user approval status'
    );
  },

  async login(email, password) {
    return fetchJson(
      `${EXPRESS_API_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      },
      'Login failed'
    );
  },

  async signup(name, email, password) {
    return fetchJson(
      `${EXPRESS_API_URL}/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      },
      'Registration failed'
    );
  },

  async deleteAccount() {
    return fetchJson(
      `${EXPRESS_API_URL}/auth/delete-account`,
      {
        method: 'DELETE',
        headers: getHeaders()
      },
      'Failed to delete user account'
    );
  },

  async uploadResume(file, targetRole) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetchJson(
      `${EXPRESS_API_URL}/resume/upload`,
      {
        method: 'POST',
        headers,
        body: formData
      },
      'Failed to parse resume'
    );
  },

  async getResumeHistory() {
    return fetchJson(
      `${EXPRESS_API_URL}/resume/history`,
      {
        method: 'GET',
        headers: getHeaders()
      },
      'Failed to load resume history'
    );
  },

  async getJobs() {
    return fetchJson(
      `${EXPRESS_API_URL}/jobs`,
      {
        method: 'GET',
        headers: getHeaders()
      },
      'Failed to load jobs'
    );
  },

  async matchJob(jobId, resumeSkills) {
    return fetchJson(
      `${EXPRESS_API_URL}/jobs/${jobId}/match`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resumeSkills })
      },
      'Job matching calculation failed'
    );
  },

  async generateRoadmap(targetRole, missingSkills) {
    return fetchJson(
      `${EXPRESS_API_URL}/resume/roadmap`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetRole, missingSkills })
      },
      'Failed to generate roadmap'
    );
  },

  async getInterviewQuestions(role) {
    return fetchJson(
      `${EXPRESS_API_URL}/interview/questions?role=${encodeURIComponent(role)}`,
      {
        method: 'GET',
        headers: getHeaders()
      },
      'Failed to load questions'
    );
  },

  async gradeInterviewAnswer(question, userAnswer, targetRole, difficulty) {
    return fetchJson(
      `${EXPRESS_API_URL}/interview/grade`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question, userAnswer, targetRole, difficulty })
      },
      'Evaluation grading failed'
    );
  },

  async createVideoInterviewSession(targetRole, interviewType, difficulty) {
    return fetchJson(
      `${EXPRESS_API_URL}/interview/video-session`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetRole, interviewType, difficulty })
      },
      'Failed to start virtual interview'
    );
  },

  async gradeVideoInterviewAnswer(question, transcript, targetRole, interviewType, difficulty, durationSeconds) {
    return fetchJson(
      `${EXPRESS_API_URL}/interview/video-grade`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question, transcript, targetRole, interviewType, difficulty, durationSeconds })
      },
      'Virtual interview evaluation failed'
    );
  },

  async sendMessageToCoach(message, history, topic = null) {
    return fetchJson(
      `${EXPRESS_API_URL}/interview/coach-chat`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, history, topic })
      },
      'Failed to get response from career coach'
    );
  }
};
