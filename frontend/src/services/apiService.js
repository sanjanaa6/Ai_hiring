import axios from 'axios';

const RAW_API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function normalizeApiBaseUrl(url) {
  if (!url) return 'http://localhost:5000/api';
  // Remove trailing slashes
  const trimmed = url.replace(/\/$/, '');
  // If it already ends with /api, keep it; otherwise append /api
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

class ApiService {
  constructor() {
    // Helpful debug log to verify base URL in the browser console
    // eslint-disable-next-line no-console
    console.log('[ApiService] Base URL =', API_BASE_URL);

    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
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
      const response = await this.client.get(`/interviews/${interviewId}`);
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
