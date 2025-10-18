import axios from 'axios';

// Dynamic API base URL configuration
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.endsWith('/api') 
      ? process.env.REACT_APP_API_URL 
      : `${process.env.REACT_APP_API_URL}/api`;
  }
  
  // For production deployment
  if (process.env.NODE_ENV === 'production') {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname.includes('eval8.ai')) {
        return 'https://aihire.eval8.xyz/api';  // Backend domain
      }
      return `${protocol}//${hostname}:5000/api`;
    }
    return 'https://aihire.eval8.xyz/api';  // Backend domain
  }
  
  // For development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

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
   * Upload recording to backend (S3-only mode)
   */
  uploadRecording: async (formData) => {
    console.log('🚀 [FRONTEND S3] Starting recording upload to S3...');
    
    // Log FormData contents for debugging
    console.log('📋 [FRONTEND S3] FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (key === 'recording') {
        console.log(`  ${key}: File (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ [FRONTEND S3] No authentication token found');
        throw new Error('Authentication token not found');
      }
      
      console.log('🔐 [FRONTEND S3] Auth token found:', token.substring(0, 20) + '...');
      console.log('🌐 [FRONTEND S3] Upload URL:', `${API_BASE_URL}/interview-recordings/upload`);
      
      const startTime = Date.now();
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
            const uploadSpeed = (progressEvent.loaded / ((Date.now() - startTime) / 1000) / 1024 / 1024).toFixed(2);
            console.log('📊 [FRONTEND S3] Upload progress:', {
              percent: percentCompleted + '%',
              loaded: `${(progressEvent.loaded / 1024 / 1024).toFixed(2)} MB`,
              total: `${(progressEvent.total / 1024 / 1024).toFixed(2)} MB`,
              speed: `${uploadSpeed} MB/s`
            });
          },
          timeout: 300000 // 5 minutes timeout
        }
      );
      
      const uploadTime = Date.now() - startTime;
      console.log('✅ [FRONTEND S3] Upload completed successfully!');
      console.log('📈 [FRONTEND S3] Upload stats:', {
        totalTime: `${(uploadTime / 1000).toFixed(2)}s`,
        responseStatus: response.status,
        responseData: response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND S3] Upload failed with error:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      // Enhanced error handling for common issues
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ [FRONTEND S3] Upload timeout - file too large or slow connection');
      } else if (error.response?.status === 413) {
        console.error('📏 [FRONTEND S3] File too large - exceeds server limits');
      } else if (error.response?.status === 401) {
        console.error('🔐 [FRONTEND S3] Authentication failed - invalid token');
      } else if (error.response?.status === 500) {
        console.error('🔧 [FRONTEND S3] Server error - check backend S3 configuration');
      }
      
      throw error.response?.data || error;
    }
  },

  /**
   * Get recording by ID with signed URL (S3)
   */
  getRecording: async (recordingId) => {
    console.log('📥 [FRONTEND S3] Fetching recording with signed URL:', recordingId);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/${recordingId}`,
        { headers: getAuthHeaders() }
      );
      
      const fetchTime = Date.now() - startTime;
      console.log('✅ [FRONTEND S3] Recording fetched successfully!');
      console.log('📋 [FRONTEND S3] Recording details:', {
        recordingId,
        fetchTime: `${fetchTime}ms`,
        hasSignedUrl: !!response.data?.data?.signedUrl,
        s3Key: response.data?.data?.s3Key,
        s3Bucket: response.data?.data?.s3Bucket,
        fileSize: response.data?.data?.fileSize,
        status: response.data?.data?.status
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND S3] Get recording failed:', {
        recordingId,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });
      throw error.response?.data || error;
    }
  },

  /**
   * Get all recordings for an interview (S3)
   */
  getInterviewRecordings: async (interviewId) => {
    console.log('📥 [FRONTEND S3] Fetching interview recordings:', interviewId);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/interview/${interviewId}`,
        { headers: getAuthHeaders() }
      );
      
      const fetchTime = Date.now() - startTime;
      console.log('✅ [FRONTEND S3] Interview recordings fetched successfully!');
      console.log('📊 [FRONTEND S3] Recordings summary:', {
        interviewId,
        count: response.data?.count || 0,
        fetchTime: `${fetchTime}ms`,
        recordings: response.data?.data?.map(r => ({
          id: r._id,
          s3Key: r.s3Key,
          fileSize: r.fileSize,
          status: r.status,
          hasSignedUrl: !!r.signedUrl
        }))
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND S3] Get interview recordings failed:', {
        interviewId,
        errorMessage: error.message,
        responseStatus: error.response?.status
      });
      throw error.response?.data || error;
    }
  },

  /**
   * Get all recordings for the logged-in recruiter (S3)
   */
  getMyRecordings: async () => {
    console.log('📥 [FRONTEND S3] Fetching recruiter recordings...');
    
    try {
      const startTime = Date.now();
      const response = await axios.get(
        `${API_BASE_URL}/interview-recordings/recruiter/my-recordings`,
        { headers: getAuthHeaders() }
      );
      
      const fetchTime = Date.now() - startTime;
      console.log('✅ [FRONTEND S3] Recruiter recordings fetched successfully!');
      console.log('📊 [FRONTEND S3] Recruiter recordings summary:', {
        count: response.data?.count || 0,
        fetchTime: `${fetchTime}ms`,
        totalSize: response.data?.data?.reduce((sum, r) => sum + (r.fileSize || 0), 0),
        statuses: response.data?.data?.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {})
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND S3] Get recruiter recordings failed:', {
        errorMessage: error.message,
        responseStatus: error.response?.status
      });
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
   * Delete recording (S3)
   */
  deleteRecording: async (recordingId) => {
    console.log('🗑️ [FRONTEND S3] Deleting recording:', recordingId);
    
    try {
      const startTime = Date.now();
      const response = await axios.delete(
        `${API_BASE_URL}/interview-recordings/${recordingId}`,
        { headers: getAuthHeaders() }
      );
      
      const deleteTime = Date.now() - startTime;
      console.log('✅ [FRONTEND S3] Recording deleted successfully!');
      console.log('📊 [FRONTEND S3] Delete operation:', {
        recordingId,
        deleteTime: `${deleteTime}ms`,
        responseStatus: response.status
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND S3] Delete recording failed:', {
        recordingId,
        errorMessage: error.message,
        responseStatus: error.response?.status
      });
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
