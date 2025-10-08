import axios from 'axios';
import { axiosConfig } from '../utils/axiosConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.origin.replace(/\/$/, '')}/api`;

class EyeTrackingService {
  // Track a violation
  async trackViolation(interviewId, violationType, violationData = {}) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/eye-tracking/violation`,
        {
          interviewId,
          violationType,
          violationData,
          timestamp: new Date()
        },
        axiosConfig
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error tracking violation:', error);
      throw error;
    }
  }

  // Get eye tracking status for an interview
  async getEyeTrackingStatus(interviewId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/eye-tracking/status/${interviewId}`,
        axiosConfig
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting eye tracking status:', error);
      throw error;
    }
  }

  // Start eye tracking monitoring
  async startEyeTracking(interviewId, maxViolations = 3) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/eye-tracking/start`,
        {
          interviewId,
          maxViolations
        },
        axiosConfig
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error starting eye tracking:', error);
      throw error;
    }
  }

  // Stop eye tracking monitoring
  async stopEyeTracking(interviewId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/eye-tracking/stop`,
        {
          interviewId
        },
        axiosConfig
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error stopping eye tracking:', error);
      throw error;
    }
  }

  // Terminate interview due to violations
  async terminateInterview(interviewId, reason = 'violations') {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/eye-tracking/terminate`,
        {
          interviewId,
          reason
        },
        axiosConfig
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error terminating interview:', error);
      throw error;
    }
  }

  // Get violation analytics (admin only)
  async getViolationAnalytics(startDate = null, endDate = null, interviewId = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (interviewId) params.append('interviewId', interviewId);

      const response = await axios.get(
        `${API_BASE_URL}/eye-tracking/analytics?${params.toString()}`,
        axiosConfig
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting violation analytics:', error);
      throw error;
    }
  }

  // Track gaze violation specifically
  async trackGazeViolation(interviewId, direction, duration) {
    return this.trackViolation(interviewId, 'gaze_violation', {
      direction,
      duration,
      timestamp: new Date()
    });
  }

  // Track face positioning violation
  async trackFacePositioningViolation(interviewId, reason) {
    return this.trackViolation(interviewId, 'face_positioning_violation', {
      reason,
      timestamp: new Date()
    });
  }

  // Track multiple violations at once
  async trackMultipleViolations(interviewId, violations) {
    try {
      const promises = violations.map(violation => 
        this.trackViolation(interviewId, violation.type, violation.data)
      );
      
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('❌ Error tracking multiple violations:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const eyeTrackingService = new EyeTrackingService();
export default eyeTrackingService;
