import React from 'react';
import RecruiterNavbar from './RecruiterNavbar';
import { useTheme } from '../../context/ThemeContext';

const RecruiterLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(30, 58, 138, 0.1) 0%, transparent 50%), linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
          : 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(30, 58, 138, 0.05) 0%, transparent 50%), linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)'
      }}
    >
      <RecruiterNavbar />
      <main className="flex-1 pt-16 relative z-10">
        {children}
      </main>
    </div>
  );
};

export default RecruiterLayout;
