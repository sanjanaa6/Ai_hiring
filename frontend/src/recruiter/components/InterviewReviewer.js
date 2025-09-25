import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// Create an axios instance with custom config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('🔒 [API REQUEST]', {
    method: config.method,
    url: config.url,
    hasToken: !!token
  });
  return config;
}, (error) => {
  console.error('❌ [API REQUEST ERROR]', error);
  return Promise.reject(error);
});

const InterviewReviewer = () => {
  console.log('InterviewReviewer component rendered');
  const { interviewId } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRound, setEditingRound] = useState(null);
  const [shareableLink, setShareableLink] = useState(null);
  const [saving, setSaving] = useState(false);
  const [token] = useState(localStorage.getItem('token'));

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    console.log('Fetching interview with ID:', interviewId);
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API Response:', response.data);
      console.log('Interview data:', response.data);
      if (response.data.success) {
        setInterview(response.data.data);
      } else {
        setError('Failed to load interview data');
      }
    } catch (err) {
      console.error('Error fetching interview:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load interview details';
      setError(errorMessage);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        setError('You do not have permission to access this interview. Please contact the recruiter.');
      } else if (err.response?.status === 404) {
        setError('Interview not found. Please check the URL and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoundEdit = (roundIndex) => {
    setEditingRound(roundIndex);
  };

  const handleQuestionEdit = (roundIndex, questionIndex, updatedQuestion) => {
    const updatedInterview = { ...interview };
    updatedInterview.rounds[roundIndex].questions[questionIndex] = updatedQuestion;
    setInterview(updatedInterview);
  };

  const handleRoundDelete = (roundIndex) => {
    if (window.confirm('Are you sure you want to delete this round?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds.splice(roundIndex, 1);
      setInterview(updatedInterview);
    }
  };

  const handleQuestionDelete = (roundIndex, questionIndex) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].questions.splice(questionIndex, 1);
      setInterview(updatedInterview);
    }
  };

  const handleAddQuestion = (roundIndex) => {
    const newQuestion = {
      id: `q${roundIndex + 1}_${interview.rounds[roundIndex].questions.length + 1}`,
      type: "technical",
      question: prompt('Enter the new question:') || 'New question',
      expectedAnswer: prompt('Enter the expected answer:') || 'Expected answer',
      timeLimit: 3,
      difficulty: "medium",
      followUpQuestions: []
    };
    
    if (newQuestion.question !== 'New question') {
      const updatedInterview = { ...interview };
      updatedInterview.rounds[roundIndex].questions.push(newQuestion);
      setInterview(updatedInterview);
    }
  };

  const handleAddRound = () => {
    const newRound = {
      roundId: `round_${interview.rounds.length + 1}`,
      roundNumber: interview.rounds.length + 1,
      title: prompt('Enter round title:') || 'New Round',
      description: prompt('Enter round description:') || 'New round description',
      duration: parseInt(prompt('Enter duration in minutes:') || '10'),
      questions: [],
      evaluationCriteria: {
        technical: '',
        communication: '',
        problemSolving: '',
        culturalFit: '',
        leadership: '',
        motivation: ''
      }
    };
    
    if (newRound.title !== 'New Round') {
      const updatedInterview = { ...interview };
      updatedInterview.rounds.push(newRound);
      setInterview(updatedInterview);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rounds: interview.rounds,
          title: interview.title,
          totalDuration: interview.totalDuration
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setEditingRound(null);
        alert('Changes saved successfully!');
      } else {
        setError('Failed to save changes: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes');
    }
  };

  const handleApprove = async () => {
    try {
      console.log('🔄 [APPROVE] Attempting to approve interview:', interviewId);
      setSaving(true);
      
      const response = await api.post(`/api/interviews/${interviewId}/approve`);
      
      if (response.data.success) {
        console.log('✅ [APPROVE] Interview approved successfully:', response.data);
        // Update local state to reflect approval
        setInterview(prev => ({
          ...prev,
          approvalStatus: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: localStorage.getItem('userId')
        }));
        
        // Generate shareable link
        const shareableUrl = `${window.location.origin}/interviews/${interviewId}`;
        setShareableLink(shareableUrl);
        
        // Show success message
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to approve interview');
      }
    } catch (err) {
      console.error('❌ [APPROVE] Error:', err);
      setError(err.message || 'Failed to approve interview. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Authentication Required: </strong>
          <span className="block sm:inline">Please log in to access this page.</span>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-6">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!interview) return (
    <div className="p-6">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Not Found: </strong>
        <span className="block sm:inline">Interview could not be found. Please check the URL and try again.</span>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{interview.title}</h1>
      
      {/* Display shareable link if interview is approved */}
      {shareableLink && (
        <div className="bg-green-100 p-4 rounded mb-4">
          <h2 className="text-lg font-semibold">Interview Approved!</h2>
          <p>Shareable Link:</p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={shareableLink} 
              readOnly 
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareableLink)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Interview rounds */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Interview Rounds</h2>
          <button
            onClick={handleAddRound}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Round
          </button>
        </div>
        {interview.rounds.map((round, roundIndex) => (
          <div key={round.roundId} className="border p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{round.title}</h2>
              <div className="space-x-2">
                <button
                  onClick={() => handleRoundEdit(roundIndex)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRoundDelete(roundIndex)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{round.description}</p>

            {/* Questions */}
            <div className="space-y-4">
              {editingRound === roundIndex && (
                <button
                  onClick={() => handleAddQuestion(roundIndex)}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  Add Question
                </button>
              )}
              {round.questions.map((question, questionIndex) => (
                <div key={question.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Question {questionIndex + 1}</h3>
                    {editingRound === roundIndex && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleQuestionEdit(roundIndex, questionIndex, {
                            ...question,
                            question: prompt('Edit question:', question.question)
                          })}
                          className="text-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleQuestionDelete(roundIndex, questionIndex)}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p>{question.question}</p>
                  <p className="text-sm text-gray-600">
                    Expected Answer: {question.expectedAnswer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-x-4">
        {editingRound !== null && (
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-6 py-2 rounded"
          >
            Save Changes
          </button>
        )}
        {!shareableLink && (
          <button
            onClick={handleApprove}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Approve & Generate Link
          </button>
        )}
      </div>
    </div>
  );
};

// Make sure component is exported properly
export default InterviewReviewer;
export { InterviewReviewer };