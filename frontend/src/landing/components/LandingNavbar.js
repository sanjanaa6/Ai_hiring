import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LandingNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.nav 
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? `${isDarkMode ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50' : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50'} shadow-2xl` 
          : `${isDarkMode ? 'bg-transparent' : 'bg-transparent'}`
      }`}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Animated Logo */}
          <motion.div 
            className="flex items-center"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
          >
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div 
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                } shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300`}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Building2 className="w-6 h-6 text-white" />
                </motion.div>
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <motion.div
                    className="absolute top-0 left-0 w-1 h-1 bg-white rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                    animate={{
                      y: [0, 10, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5
                    }}
                  />
                </div>
              </motion.div>
              
              <motion.span 
                className={`text-2xl font-bold bg-gradient-to-r ${
                  isDarkMode 
                    ? 'from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent' 
                    : 'from-gray-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                AI Hiring
              </motion.span>
            </Link>
          </motion.div>

          {/* Animated Desktop Navigation */}
          <motion.div 
            className="hidden md:flex items-center space-x-8"
            variants={itemVariants}
          >
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How it Works" },
              { href: "#pricing", label: "Pricing" },
              { href: "#testimonials", label: "Testimonials" }
            ].map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={`relative group font-medium transition-all duration-300 ${
                  isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
                }`}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <span className="relative z-10">{item.label}</span>
                
                {/* Animated underline */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 ${
                    isDarkMode ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  }`}
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Hover particles */}
                <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.div
                    className={`absolute top-0 left-1/2 w-1 h-1 rounded-full ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.a>
            ))}
          </motion.div>

          {/* Animated Auth Buttons */}
          <motion.div 
            className="hidden md:flex items-center space-x-4"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className={`group relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-gray-700/50' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <User className="w-4 h-4" />
                </motion.div>
                <span className="font-medium">Login</span>
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/register"
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 w-1 h-1 bg-white rounded-full"
                    animate={{
                      x: [0, 50, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>

                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span>Get Started</span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </Link>
            </motion.div>
          </motion.div>

          {/* Animated Mobile menu button */}
          <motion.div 
            className="md:hidden"
            variants={itemVariants}
          >
            <motion.button
              onClick={toggleMenu}
              className={`relative p-2 rounded-xl transition-all duration-300 ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>

        {/* Animated Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div 
                className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t backdrop-blur-xl ${
                  isDarkMode 
                    ? 'bg-gray-900/95 border-gray-700/50' 
                    : 'bg-white/95 border-gray-200/50'
                }`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {[
                  { href: "#features", label: "Features" },
                  { href: "#how-it-works", label: "How it Works" },
                  { href: "#pricing", label: "Pricing" },
                  { href: "#testimonials", label: "Testimonials" }
                ].map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className={`block px-3 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isDarkMode 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.label}
                  </motion.a>
                ))}
                
                <motion.div 
                  className={`border-t pt-2 mt-2 ${
                    isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Link
                      to="/login"
                      className={`block px-3 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Login
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-2"
                  >
                    <Link
                      to="/register"
                      className="block px-3 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl mx-3 text-center font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
                      onClick={() => setIsMenuOpen(false)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default LandingNavbar;
