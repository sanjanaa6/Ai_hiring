import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeSwitcher = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`group relative p-2 rounded-xl backdrop-blur-xl border-2 transition-all duration-300 overflow-hidden ${className}`}
      style={{
        borderColor: isDarkMode ? 'rgba(23, 162, 184, 0.3)' : 'rgba(23, 162, 184, 0.5)',
        background: isDarkMode 
          ? 'rgba(23, 162, 184, 0.1)' 
          : 'rgba(255, 255, 255, 0.9)',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(23, 162, 184, 0.2)' 
          : '0 4px 20px rgba(23, 162, 184, 0.3)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {/* Cosmic background effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        whileHover={{ scale: 1.1 }}
      />

      {/* Icon container */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-5 h-5"
        animate={{ rotate: isDarkMode ? 0 : 180 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          {isDarkMode ? (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.3 }}
              className="text-amber-400"
            >
              <Sun className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.3 }}
              className="text-purple-600"
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cosmic sparkles effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        <Sparkles 
          className={`absolute top-1 right-1 w-3 h-3 ${
            isDarkMode ? 'text-teal-400' : 'text-amber-400'
          }`} 
        />
      </motion.div>

      {/* Tooltip */}
      <motion.div
        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isDarkMode 
            ? 'rgba(0, 0, 0, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
          color: isDarkMode ? '#ffffff' : '#000000',
          backdropFilter: 'blur(10px)',
          border: isDarkMode 
            ? '1px solid rgba(23, 162, 184, 0.3)' 
            : '1px solid rgba(23, 162, 184, 0.5)'
        }}
      >
        {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      </motion.div>
    </motion.button>
  );
};

export default ThemeSwitcher;


