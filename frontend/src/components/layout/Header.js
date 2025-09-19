import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  FileText, 
  Settings, 
  Users,  
  Layout,
  Download,
  Zap,
  Menu,
  X,
  ArrowRight,
  Home as HomeIcon,
  Briefcase,
  Grid3x3,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const commonNav = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
  ];

  const authNav = [
    { name: 'Dashboard', path: '/dashboard', icon: Layout },
    { name: 'Applications', path: '/applications', icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;
  const isScrolled = scrollY > 50;

  return (
    <motion.header 
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: isScrolled 
          ? (isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)') 
          : (isDarkMode ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.85)'),
        backdropFilter: 'blur(20px)',
        borderBottom: isScrolled ? '1px solid rgba(23, 162, 184, 0.3)' : '1px solid rgba(111, 66, 193, 0.2)'
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-4 group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src="https://res.cloudinary.com/dfdtxogcl/images/c_scale,w_248,h_180,dpr_1.25/f_auto,q_auto/v1706606519/Picture1_215dc6b/Picture1_215dc6b.png"
                alt="Eval8 Logo"
                className="w-16 h-12 object-contain"
              />
            </motion.div>
            
            <motion.span 
              className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              style={{
                textShadow: isDarkMode ? '0 0 10px rgba(23, 162, 184, 0.5)' : 'none'
              }}
            >
              AI_<span className="text-teal-400">hiring</span>
            </motion.span>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              {[...commonNav, ...(user ? authNav : [])].map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-white shadow-lg'
                        : `${isDarkMode ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} hover:bg-white/10`
                    }`}
                    style={{
                      backgroundColor: isActive(item.path) ? '#17a2b8' : undefined,
                      boxShadow: isActive(item.path) ? '0 4px 20px rgba(23, 162, 184, 0.4)' : 'none'
                    }}
                  >
                    {!isActive(item.path) && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        whileHover={{ scale: 1.05 }}
                      />
                    )}
                    
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon className="w-4 h-4 relative z-10" />
                    </motion.div>
                    <span className="relative z-10">{item.name}</span>
                    
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-6">
            {/* Apps grid button */}
            <button
              className="rounded-lg transition-all hover:ring-2 hover:ring-purple-400/40 hover:ring-offset-2 hover:ring-offset-transparent"
              style={{ width: '28px', height: '28px', background: 'rgba(17, 24, 39, 0.22)' }}
              aria-label="Apps"
            >
              <div className="grid grid-cols-3 items-center justify-items-center" style={{ columnGap: '0.5px', rowGap: '2px' }}>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
                <span style={{ width: '3px', height: '3px', borderRadius: '9999px', background: isDarkMode ? '#d1d5db' : '#4b5563' }}></span>
              </div>
            </button>

            {/* Portal pill */}
            <Link
              to={user ? '/dashboard' : '/login'}
              className="relative h-10 flex items-center gap-2 px-4 rounded-2xl text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(30,64,175,.45), rgba(76,29,149,.45))',
                boxShadow: 'inset 0 0 0 2px rgba(59,130,246,.35), 0 10px 28px rgba(30,58,138,.28)'
              }}
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-semibold">Portal</span>
            </Link>

            {/* Theme switcher */}
            <ThemeSwitcher />
            <motion.a 
              href="https://github.com/HysterChat/eval8/releases/download/e5/Eval8.Setup.1.0.2.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative h-10 px-5 rounded-2xl overflow-hidden flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                boxShadow: '0 8px 24px rgba(3, 105, 161, 0.35)'
              }}
            >
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.06))' }}
                whileHover={{ scale: 1.02 }}
              />
              <span className="relative z-10 flex items-center gap-2 font-semibold text-black">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: 1000, repeatType: 'loop' }}
                >
                  <Download className="w-4 h-4 text-black" />
                </motion.div>
                <span>Download</span>
              </span>
            </motion.a>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="h-10 flex items-center gap-2 px-3 rounded-2xl text-white focus:outline-none"
                  style={{ background: 'rgba(31, 41, 55, .9)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }}
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="font-semibold max-w-[140px] truncate">{user.name || 'User'}</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      className="absolute right-0 mt-3 w-60 rounded-2xl backdrop-blur-3xl bg-black/80 border border-white/20 shadow-2xl overflow-hidden z-50"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{user.name || 'User'}</div>
                            <div className="text-xs text-gray-300 truncate">{user.email || ''}</div>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings className="w-5 h-5 text-teal-400" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={() => { setIsDropdownOpen(false); logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          <Zap className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="h-10 px-6 rounded-2xl text-white font-bold flex items-center"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                }}
              >
                Login
              </Link>
            )}
          </div>

          <motion.button 
            className="lg:hidden p-3 rounded-xl backdrop-blur-xl border-2 border-purple-400 text-white hover:bg-purple-400/20"
            style={{
              background: 'rgba(111, 66, 193, 0.2)',
              boxShadow: '0 4px 20px rgba(111, 66, 193, 0.2)'
            }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.div>
          </motion.button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              id="mobile-menu" 
              className="lg:hidden fixed inset-0 top-20 backdrop-blur-3xl bg-black/90 z-40 overflow-y-auto"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
            <div className="p-6 flex flex-col gap-6">
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <ThemeSwitcher />
              </motion.div>

              <motion.a 
                href="https://github.com/HysterChat/eval8/releases/download/e2/Eval8.Setup.1.0.1.exe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-3 w-full py-4 rounded-2xl backdrop-blur-xl bg:white/10 border border-white/20 text-white font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-5 h-5" />
                <span>Download Reality</span>
              </motion.a>

              {user && (
                <>
                  <motion.div 
                    className="flex items-center space-x-4 mb-8 p-6 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-xl font-black text-white">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-sm text-gray-400 truncate">{user.email || ''}</p>
                    </div>
                  </motion.div>
                  {[...commonNav, ...authNav].map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                          isActive(item.path)
                            ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="font-bold">{item.name}</span>
                        <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                      </Link>
                    </motion.div>
                  ))}
                  <div className="border-t border-white/20 mt-8 pt-8 space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Link 
                        to="/profile"
                        className="flex items-center space-x-4 px-6 py-4 text-white hover:bg-white/10 rounded-2xl transition-all duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="w-6 h-6 text-purple-400" />
                        <span className="font-bold">Settings</span>
                        <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                        className="flex items-center space-x-4 w-full px-6 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300"
                      >
                        <Zap className="w-6 h-6" />
                        <span className="font-bold">Disconnect</span>
                        <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                      </button>
                    </motion.div>
                  </div>
                </>
              )}
              {!user && (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {[...commonNav, { name: 'Login', path: '/login', icon: ArrowRight }].map((item) => (
                    <Link 
                      key={item.name}
                      to={item.path} 
                      className="flex items-center justify-center space-x-3 w-full py-4 text-white rounded-2xl font-bold overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #3b82f6 100%)',
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Header;


