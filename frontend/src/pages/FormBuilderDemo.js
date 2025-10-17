import React, { useState } from 'react';
import AdvancedFormBuilder from '../components/AdvancedFormBuilder';
import { Moon, Sun } from 'lucide-react';

const FormBuilderDemo = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
              : 'bg-white text-gray-800 hover:bg-gray-100'
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Form Builder */}
      <AdvancedFormBuilder isDarkMode={isDarkMode} />
    </div>
  );
};

export default FormBuilderDemo;
