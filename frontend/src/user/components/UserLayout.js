import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const UserLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: isDarkMode
          ? 'radial-gradient(1400px 800px at -10% 0%, rgba(59,130,246,.08), transparent), radial-gradient(1200px 700px at 110% -10%, rgba(6,182,212,.08), transparent), #0b0f17'
          : '#f9fafb'
      }}
    >
      <main className="flex-1 overflow-hidden pt-16">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
