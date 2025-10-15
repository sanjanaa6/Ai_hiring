import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

const SystemDesignInterview = () => {
  const { accessLink } = useParams();
  const location = useLocation();
  
  // Parse query parameters
  const urlParams = new URLSearchParams(location.search);
  const interviewId = urlParams.get('interviewId');
  const roundId = urlParams.get('roundId');
  const duration = urlParams.get('duration');
  const candidateId = urlParams.get('candidateId');
  
  // Build query string for the System Design app
  const queryParams = new URLSearchParams();
  if (accessLink) queryParams.append('accessLink', accessLink);
  if (interviewId) queryParams.append('interviewId', interviewId);
  if (roundId) queryParams.append('roundId', roundId);
  if (duration) queryParams.append('duration', duration);
  if (candidateId) queryParams.append('candidateId', candidateId);
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  // URL to the System Design standalone app
  // In development: http://localhost:5174 (or whatever port Vite assigns)
  // In production: You'll need to deploy the System Design app separately
  const systemDesignUrl = process.env.REACT_APP_SYSTEM_DESIGN_URL || 'http://localhost:5174';
  const fullUrl = `${systemDesignUrl}/${query}`;

  console.log('🎨 [SYSTEM DESIGN] Loading standalone app:', {
    accessLink,
    interviewId,
    roundId,
    duration,
    fullUrl
  });

  return (
    <div className="w-screen h-screen bg-gray-900">
      <iframe
        title="System Design Interview"
        src={fullUrl}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-popups"
      />
    </div>
  );
};

export default SystemDesignInterview;
