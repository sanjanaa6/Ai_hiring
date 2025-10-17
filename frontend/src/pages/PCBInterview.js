import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

const PCBInterview = () => {
  const { accessLink } = useParams();
  const location = useLocation();
  
  // Parse query parameters
  const urlParams = new URLSearchParams(location.search);
  const interviewId = urlParams.get('interviewId');
  const roundId = urlParams.get('roundId');
  const questionId = urlParams.get('questionId');
  const duration = urlParams.get('duration');
  const candidateId = urlParams.get('candidateId');
  const candidateName = urlParams.get('candidateName');
  const candidateEmail = urlParams.get('candidateEmail');
  
  // Build query string for the PCB app
  const queryParams = new URLSearchParams();
  if (accessLink) queryParams.append('accessLink', accessLink);
  if (interviewId) queryParams.append('interviewId', interviewId);
  if (roundId) queryParams.append('roundId', roundId);
  if (questionId) queryParams.append('questionId', questionId);
  if (duration) queryParams.append('duration', duration);
  if (candidateId) queryParams.append('candidateId', candidateId);
  if (candidateName) queryParams.append('candidateName', candidateName);
  if (candidateEmail) queryParams.append('candidateEmail', candidateEmail);
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  // URL to the PCB standalone app
  // In development: http://localhost:3001 (or whatever port you configure)
  // In production: Deploy PCB app separately or use subdomain
  const pcbUrl = process.env.REACT_APP_PCB_URL || 'http://localhost:3001';
  const fullUrl = `${pcbUrl}/${query}`;

  console.log('🔧 [PCB] Loading standalone app:', {
    accessLink,
    interviewId,
    roundId,
    questionId,
    duration,
    fullUrl
  });

  return (
    <div className="w-screen h-screen bg-gray-900">
      <iframe
        title="PCB Design Interview"
        src={fullUrl}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups"
      />
    </div>
  );
};

export default PCBInterview;
