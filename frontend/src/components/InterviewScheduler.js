import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  User,
  Mail,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

const InterviewScheduler = ({ 
  applicationId, 
  candidate, 
  job, 
  onClose, 
  onSuccess 
}) => {
  const queryClient = useQueryClient();
  const [interviewData, setInterviewData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    type: 'video', // video, phone, in-person
    duration: 60,
    location: '',
    meetingLink: '',
    notes: '',
    interviewer: '',
    interviewerEmail: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation(
    async (data) => {
      const response = await axios.post(`/api/applications/${applicationId}/schedule-interview`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Interview scheduled successfully!');
        queryClient.invalidateQueries(['job-applications']);
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to schedule interview');
      }
    }
  );

  // Update interview mutation
  const updateInterviewMutation = useMutation(
    async (data) => {
      const response = await axios.patch(`/api/interviews/${applicationId}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Interview updated successfully!');
        queryClient.invalidateQueries(['job-applications']);
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update interview');
      }
    }
  );

  // Cancel interview mutation
  const cancelInterviewMutation = useMutation(
    async () => {
      const response = await axios.delete(`/api/interviews/${applicationId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Interview cancelled successfully!');
        queryClient.invalidateQueries(['job-applications']);
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel interview');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const interviewDateTime = new Date(`${interviewData.scheduledDate}T${interviewData.scheduledTime}`);
    const data = {
      ...interviewData,
      scheduledDateTime: interviewDateTime.toISOString(),
      candidateId: candidate._id,
      jobId: job._id
    };

    if (isEditing) {
      updateInterviewMutation.mutate(data);
    } else {
      scheduleInterviewMutation.mutate(data);
    }
  };

  const handleInputChange = (field, value) => {
    setInterviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const meetingLink = `https://meet.example.com/${meetingId}`;
    setInterviewData(prev => ({
      ...prev,
      meetingLink
    }));
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // At least 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Update Interview' : 'Schedule Interview'}
            </h2>
            <p className="text-gray-600">
              {candidate.name} • {job.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Candidate Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Candidate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{candidate.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{candidate.email}</span>
                </div>
              </div>
            </div>

            {/* Interview Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Interview Date</label>
                <input
                  type="date"
                  value={interviewData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Interview Time</label>
                <input
                  type="time"
                  value={interviewData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Interview Type</label>
                <select
                  value={interviewData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              <div>
                <label className="form-label">Duration (minutes)</label>
                <select
                  value={interviewData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className="form-select"
                  required
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Location/Meeting Link */}
            {interviewData.type === 'in-person' ? (
              <div>
                <label className="form-label">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter interview location"
                    value={interviewData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="form-input pl-10"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="form-label">Meeting Link</label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="Enter meeting link"
                    value={interviewData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                    className="form-input flex-1"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateMeetingLink}
                    className="btn btn-outline"
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}

            {/* Interviewer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Interviewer Name</label>
                <input
                  type="text"
                  placeholder="Enter interviewer name"
                  value={interviewData.interviewer}
                  onChange={(e) => handleInputChange('interviewer', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Interviewer Email</label>
                <input
                  type="email"
                  placeholder="Enter interviewer email"
                  value={interviewData.interviewerEmail}
                  onChange={(e) => handleInputChange('interviewerEmail', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="form-label">Interview Notes</label>
              <textarea
                placeholder="Add any additional notes or instructions for the candidate"
                value={interviewData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="form-input"
                rows="3"
              />
            </div>

            {/* Interview Reminder */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Interview Reminder</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    An email invitation will be sent to the candidate with all interview details.
                    A reminder will be sent 24 hours before the scheduled time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => cancelInterviewMutation.mutate()}
                className="btn btn-danger"
                disabled={cancelInterviewMutation.isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Interview
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={scheduleInterviewMutation.isLoading || updateInterviewMutation.isLoading}
            >
              {scheduleInterviewMutation.isLoading || updateInterviewMutation.isLoading ? (
                <div className="spinner mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update Interview' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewScheduler;
