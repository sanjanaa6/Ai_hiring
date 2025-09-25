import axios from 'axios';

const RAW_API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function deriveBaseFromWindow() {
  try {
    const { protocol, hostname, port } = window.location;
    const targetPort = port && port !== '3000' ? port : '5000';
    return `${protocol}//${hostname}${targetPort ? `:${targetPort}` : ''}/api`;
  } catch (_) {
    return 'http://localhost:5000/api';
  }
}

function normalizeApiBaseUrl(url) {
  if (!url) return deriveBaseFromWindow();
  const trimmed = url.replace(/\/$/, '');
  // If using localhost but page is not on localhost, derive from window
  const isLocal = /localhost|127\.0\.0\.1/.test(trimmed);
  const pageIsLocal = /localhost|127\.0\.0\.1/.test(typeof window !== 'undefined' ? window.location.hostname : '');
  if (isLocal && !pageIsLocal) {
    return deriveBaseFromWindow();
  }
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

class ApiService {
  constructor() {
    // eslint-disable-next-line no-console
    console.log('[ApiService] Base URL =', API_BASE_URL);

    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Interview API calls
  async generateInterview(jobDetails) {
    try {
      const response = await this.client.post('/interviews/generate', jobDetails);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Generate interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to generate interview'
      };
    }
  }

  async getInterview(interviewId) {
    try {
      // Try public endpoint first (for shareable links)
      let response;
      try {
        response = await fetch(`/api/interviews/public/${interviewId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (publicError) {
        console.log('Public endpoint failed, trying authenticated endpoint...');
      }
      
      // Fallback to authenticated endpoint
      response = await this.client.get(`/interviews/${interviewId}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get interview'
      };
    }
  }

  async submitAnswer(interviewId, answerData) {
    try {
      const response = await this.client.post(`/interviews/${interviewId}/answer`, answerData);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Submit answer error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to submit answer'
      };
    }
  }

  async getInterviewStats(interviewId) {
    try {
      const response = await this.client.get(`/interviews/${interviewId}/stats`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get interview stats error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get interview stats'
      };
    }
  }

  async getInterviewAnswers(interviewId, candidateId) {
    try {
      const query = candidateId ? `?candidateId=${encodeURIComponent(candidateId)}` : '';
      const response = await this.client.get(`/interviews/${interviewId}/answers${query}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get interview answers error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get interview answers'
      };
    }
  }

  async deleteInterview(interviewId) {
    try {
      const response = await this.client.delete(`/interviews/${interviewId}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete interview'
      };
    }
  }

  async getAllInterviews() {
    try {
      const response = await this.client.get('/interviews');
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get all interviews error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get interviews'
      };
    }
  }
}

export default new ApiService();
