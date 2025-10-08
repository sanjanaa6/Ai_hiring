import React from 'react';
import { useParams } from 'react-router-dom';

const ElectronicInterview = () => {
  const { interviewId } = useParams();
  const pcbUrl = `${window.location.origin.replace(/\/$/, '')}/pcb/`;

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


