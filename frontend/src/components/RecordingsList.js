import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Eye, Clock, HardDrive, Calendar } from 'lucide-react';
import recordingService from '../services/recordingService';
import RecordingViewer from './RecordingViewer';
import { toast } from 'react-toastify';

/**
 * Recordings List Component
 * Displays list of interview recordings for recruiters
 */
const RecordingsList = ({ interviewId, candidateId, showActions = true }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, [interviewId, candidateId]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (interviewId) {
        response = await recordingService.getInterviewRecordings(interviewId);
      } else if (candidateId) {
        response = await recordingService.getCandidateRecordings(candidateId);
      } else {
        response = await recordingService.getMyRecordings();
      }

      setRecordings(response.data || []);
    } catch (err) {
      console.error('Failed to load recordings:', err);
      setError(err.message || 'Failed to load recordings');
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecording = async (recording) => {
    try {
      // Fetch recording with signed URL
      const response = await recordingService.getRecording(recording._id);
      setSelectedRecording(response.data);
      setViewerOpen(true);
    } catch (err) {
      console.error('Failed to load recording:', err);
      toast.error('Failed to load recording');
    }
  };

  const handleDeleteRecording = async (recordingId) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) {
      return;
    }

    try {
      await recordingService.deleteRecording(recordingId);
      toast.success('Recording deleted successfully');
      loadRecordings(); // Reload list
    } catch (err) {
      console.error('Failed to delete recording:', err);
      toast.error('Failed to delete recording');
    }
  };

  const handleDownloadRecording = async (recording) => {
    try {
      const response = await recordingService.getRecording(recording._id);
      const link = document.createElement('a');
      link.href = response.data.signedUrl;
      link.download = `interview_${recording.interviewId}_${recording.candidateName}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Recording download started');
    } catch (err) {
      console.error('Failed to download recording:', err);
      toast.error('Failed to download recording');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={loadRecordings}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Recordings Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Interview recordings will appear here once candidates complete their interviews.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {recordings.map((recording) => (
          <div
            key={recording._id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {recording.candidateName}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      recording.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : recording.status === 'uploading'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {recording.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {recording.candidateEmail}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(recording.recordingStartedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(recording.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <HardDrive className="w-4 h-4" />
                    <span>{formatFileSize(recording.fileSize)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>{recording.viewCount || 0} views</span>
                  </div>
                </div>

                {recording.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {recording.metadata.screenResolution && (
                        <span>Resolution: {recording.metadata.screenResolution} • </span>
                      )}
                      {recording.metadata.roundTitle && (
                        <span>Round: {recording.metadata.roundTitle}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {showActions && recording.status === 'completed' && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewRecording(recording)}
                    className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                    title="View Recording"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownloadRecording(recording)}
                    className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    title="Download Recording"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecording(recording._id)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    title="Delete Recording"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recording Viewer Modal */}
      {viewerOpen && selectedRecording && (
        <RecordingViewer
          recording={selectedRecording}
          onClose={() => {
            setViewerOpen(false);
            setSelectedRecording(null);
          }}
        />
      )}
    </>
  );
};

export default RecordingsList;
