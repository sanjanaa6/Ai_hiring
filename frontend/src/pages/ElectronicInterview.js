import React from 'react';
import { useParams } from 'react-router-dom';

const ElectronicInterview = () => {
  const { accessLink } = useParams();
  const base = window.location.origin.replace(/\/$/, '');
  const query = accessLink ? `?accessLink=${encodeURIComponent(accessLink)}` : '';
  const pcbUrl = `${base}/pcb/${query}`;

  return (
    <div className="w-screen h-screen">
      <iframe
        title="Electronic Interview"
        src={pcbUrl}
        className="w-full h-full border-0"
        allow="camera; microphone; clipboard-read; clipboard-write"
      />
    </div>
  );
};

export default ElectronicInterview;


