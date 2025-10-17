import React from 'react';

const SidebarMenuItem = ({ label, icon, active, onClick, isDarkMode }) => {
  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded-lg text-sm tracking-wide 
      ${active 
        ? isDarkMode 
          ? 'bg-zinc-800 text-cyan-400' 
          : 'bg-gray-200 text-black'
        : isDarkMode 
          ? 'hover:text-cyan-400 hover:scale-105 hover:bg-zinc-800' 
          : 'hover:text-black hover:scale-105 hover:bg-gray-200'
      } 
      transition-all duration-150 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500`}
      onClick={onClick}
      tabIndex={0}
    >
      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-current">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
};

export default SidebarMenuItem;
