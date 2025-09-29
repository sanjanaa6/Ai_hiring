import apiService from './apiService';

class MonitoringService {
  /**
   * Record an eye tracking violation
   */
  async recordViolation(violationData) {
    try {
      const response = await apiService.post('/monitoring/violations', violationData);
      return response.data;
    } catch (error) {
      console.error('Error recording violation:', error);
      throw error;
    }
  }

  /**
   * Get monitoring data for an interview
   */
  async getMonitoringData(interviewId, userId) {
    try {
      const response = await apiService.get(`/monitoring/data/${interviewId}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting monitoring data:', error);
      throw error;
    }
  }

  /**
   * Get flagged interviews (admin only)
   */
  async getFlaggedInterviews(params = {}) {
    try {
      const response = await apiService.get('/monitoring/flagged', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting flagged interviews:', error);
      throw error;
    }
  }

  /**
   * Clear interview flag (admin only)
   */
  async clearInterviewFlag(interviewId, reason, adminId) {
    try {
      const response = await apiService.post(`/monitoring/flagged/${interviewId}/clear`, {
        reason,
        adminId
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing interview flag:', error);
      throw error;
    }
  }

  /**
   * Get monitoring statistics (admin only)
   */
  async getMonitoringStats(timeRange = '7d') {
    try {
      const response = await apiService.get('/monitoring/stats', {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting monitoring stats:', error);
      throw error;
    }
  }


  /**
   * Get automatically removed interviews (admin only)
   */
  async getAutoRemovedInterviews(params = {}) {
    try {
      const response = await apiService.get('/monitoring/auto-removed', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting auto-removed interviews:', error);
      throw error;
    }
  }

  /**
   * Record look away violation
   */
  async recordLookAway(interviewId, userId, duration, timestamp) {
    return this.recordViolation({
      interviewId,
      userId,
      violationType: 'look_away',
      duration,
      timestamp
    });
  }

  /**
   * Record face not visible violation
   */
  async recordFaceNotVisible(interviewId, userId, duration, timestamp) {
    return this.recordViolation({
      interviewId,
      userId,
      violationType: 'face_not_visible',
      duration,
      timestamp
    });
  }

  /**
   * Record shoulders not visible violation
   */
  async recordShouldersNotVisible(interviewId, userId, duration, timestamp) {
    return this.recordViolation({
      interviewId,
      userId,
      violationType: 'shoulders_not_visible',
      duration,
      timestamp
    });
  }

  /**
   * Record mobile phone detected violation
   */
  async recordMobilePhoneDetected(interviewId, userId, duration, timestamp) {
    return this.recordViolation({
      interviewId,
      userId,
      violationType: 'mobile_phone_detected',
      duration,
      timestamp
    });
  }

  /**
   * Record earphones detected violation
   */
  async recordEarphonesDetected(interviewId, userId, duration, timestamp) {
    return this.recordViolation({
      interviewId,
      userId,
      violationType: 'earphones_detected',
      duration,
      timestamp
    });
  }

  /**
   * Record suspicious hand movement violation
   */
  async recordSuspiciousHandMovement(interviewId, userId, duration, timestamp) {
    return this.recordViolation({
      interviewId,
      userId,
      violationType: 'suspicious_hand_movement',
      duration,
      timestamp
    });
  }
}

const monitoringServiceInstance = new MonitoringService();
export default monitoringServiceInstance;
