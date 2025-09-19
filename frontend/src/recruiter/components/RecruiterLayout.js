import React from 'react';
import RecruiterNavbar from './RecruiterNavbar';
import { useTheme } from '../../context/ThemeContext';

const RecruiterLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className="min-h-screen"
      style={{
        background: isDarkMode
          ? 'radial-gradient(1400px 800px at -10% 0%, rgba(59,130,246,.08), transparent), radial-gradient(1200px 700px at 110% -10%, rgba(6,182,212,.08), transparent), #0b0f17'
          : '#f9fafb'
      }}
    >
      <RecruiterNavbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default RecruiterLayout;
