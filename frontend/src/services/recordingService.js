import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Get auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Recording Service
 * Handles all API calls related to interview recordings
 */
const recordingService = {
  /**
   * Upload recording to backend
   */
  uploadRecording: async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/interview-recordings/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log('Upload Progress:', percentCompleted + '%');
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Upload recording error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get recording by ID with signed URL
   */
  getRecording: async (recordingId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/${recordingId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get recording error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all recordings for an interview
   */
  getInterviewRecordings: async (interviewId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/interview/${interviewId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get interview recordings error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all recordings for the logged-in recruiter
   */
  getMyRecordings: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/recruiter/my-recordings`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get my recordings error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all recordings for a candidate
   */
  getCandidateRecordings: async (candidateId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/candidate/${candidateId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get candidate recordings error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete recording
   */
  deleteRecording: async (recordingId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/interview-recordings/${recordingId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Delete recording error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get recording statistics (admin only)
   */
  getRecordingStats: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/stats/overview`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Get recording stats error:', error);
      throw error.response?.data || error;
    }
  }
};

export default recordingService;
