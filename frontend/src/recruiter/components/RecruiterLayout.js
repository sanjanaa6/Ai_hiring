import React from 'react';
import RecruiterNavbar from './RecruiterNavbar';

const RecruiterLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RecruiterNavbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default RecruiterLayout;
