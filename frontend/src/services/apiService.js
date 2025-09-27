import axios from 'axios';

// Dynamic API base URL configuration for deployment
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith('/api') 
      ? process.env.REACT_APP_API_URL 
      : `${process.env.REACT_APP_API_URL}/api`;
  }
  
  // For production deployment, use relative URL
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // For development, use localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// function deriveBaseFromWindow() {
//   try {
//     const { protocol, hostname, port } = window.location;
//     const targetPort = port && port !== '3000' ? port : '5000';
//     return `${protocol}//${hostname}${targetPort ? `:${targetPort}` : ''}/api`;
//   } catch (_) {
//     return 'http://localhost:5000/api';
//   }
// }

// function normalizeApiBaseUrl(url) {
//   if (!url) return deriveBaseFromWindow();
//   const trimmed = url.replace(/\/$/, '');
//   // If using localhost but page is not on localhost, derive from window
//   const isLocal = /localhost|127\.0\.0\.1/.test(trimmed);
//   const pageIsLocal = /localhost|127\.0\.0\.1/.test(typeof window !== 'undefined' ? window.location.hostname : '');
//   if (isLocal && !pageIsLocal) {
//     return deriveBaseFromWindow();
//   }
//   if (/\/api$/i.test(trimmed)) return trimmed;
//   return `${trimmed}/api`;
// }


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

    // External API clients
    this.openRouterClient = axios.create({
      baseURL: process.env.REACT_APP_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'AI Hiring Platform'
      }
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
        response = await fetch(`${this.client.defaults.baseURL}/interviews/public/${interviewId}`, {
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

  // Auth API calls
  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  }

  async register(userData) {
    try {
      const response = await this.client.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed'
      };
    }
  }

  async logout() {
    try {
      const response = await this.client.post('/auth/logout');
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Logout failed'
      };
    }
  }

  // User API calls
  async updateProfile(data) {
    try {
      const response = await this.client.put('/users/profile', data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update profile'
      };
    }
  }

  async getUserProfile() {
    try {
      const response = await this.client.get('/users/profile');
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get profile'
      };
    }
  }

  // Job API calls
  async getJobs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await this.client.get(`/jobs?${queryString}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get jobs error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get jobs'
      };
    }
  }

  async getJob(jobId) {
    try {
      const response = await this.client.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get job error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get job'
      };
    }
  }

  async createJob(jobData) {
    try {
      const response = await this.client.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Create job error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create job'
      };
    }
  }

  async updateJobStatus(jobId, status) {
    try {
      const response = await this.client.patch(`/jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update job status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update job status'
      };
    }
  }

  async deleteJob(jobId) {
    try {
      const response = await this.client.delete(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete job error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete job'
      };
    }
  }

  async getMyJobs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await this.client.get(`/jobs/my/jobs?${queryString}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get my jobs error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get my jobs'
      };
    }
  }

  // Application API calls
  async createApplication(applicationData) {
    try {
      const response = await this.client.post('/applications', applicationData);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Create application error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create application'
      };
    }
  }

  async getMyApplications() {
    try {
      const response = await this.client.get('/applications/my');
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get my applications error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get applications'
      };
    }
  }

  async getJobApplications(jobId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await this.client.get(`/applications/job/${jobId}?${queryString}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get job applications error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get job applications'
      };
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const response = await this.client.patch(`/applications/${applicationId}/status`, { status });
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update application status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update application status'
      };
    }
  }

  // AI API calls
  async generateJob(data) {
    try {
      const response = await this.client.post('/ai/generate-job', data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Generate job error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to generate job'
      };
    }
  }

  async generateDynamicInterview(data) {
    try {
      const response = await this.client.post('/interviews/generate-dynamic', data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Generate dynamic interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to generate dynamic interview'
      };
    }
  }

  async evaluateInterview(data) {
    try {
      const response = await this.client.post('/ai/evaluate-interview', data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Evaluate interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to evaluate interview'
      };
    }
  }

  async getCodingAssistant(interviewId, data) {
    try {
      const response = await this.client.post(`/interviews/${interviewId}/coding-assistant`, data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get coding assistant error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get coding assistant'
      };
    }
  }

  async getCodingHints(interviewId, data) {
    try {
      const response = await this.client.post(`/interviews/${interviewId}/coding-hints`, data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get coding hints error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get coding hints'
      };
    }
  }

  // Interview scheduling API calls
  async scheduleInterview(applicationId, data) {
    try {
      const response = await this.client.post(`/applications/${applicationId}/schedule-interview`, data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Schedule interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to schedule interview'
      };
    }
  }

  async updateInterview(interviewId, data) {
    try {
      const response = await this.client.patch(`/interviews/${interviewId}`, data);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update interview error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update interview'
      };
    }
  }

  // Messaging API calls
  async getMessages(applicationId) {
    try {
      const response = await this.client.get(`/messages/application/${applicationId}`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get messages error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get messages'
      };
    }
  }

  async sendMessage(messageData) {
    try {
      const response = await this.client.post('/messages', messageData);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Send message error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to send message'
      };
    }
  }

  // External API calls - OpenRouter
  async callOpenRouterAPI(data) {
    try {
      const response = await this.openRouterClient.post('', data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('OpenRouter API error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to call OpenRouter API'
      };
    }
  }

  // Interview Performance Analytics
  async getInterviewPerformance(interviewId) {
    try {
      const response = await this.client.get(`/interviews/${interviewId}/performance`);
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Get interview performance error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get interview performance'
      };
    }
  }
}

const apiService = new ApiService();
export default apiService;
