import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, Briefcase, Home, FileText } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ to, children, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link ${isActive(to) ? 'active' : ''}`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-brand">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span>AI Hiring</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/jobs">Jobs</NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                {user?.role === 'recruiter' || user?.role === 'admin' ? (
                  <NavLink to="/create-job">Post Job</NavLink>
                ) : null}
                <NavLink to="/applications">Applications</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-gray-500">{user?.email}</div>
                      <div className="text-xs text-blue-600 capitalize">{user?.role}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mobile-menu-button"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="navbar-nav-mobile">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              <NavLink to="/" onClick={() => setIsMenuOpen(false)}>
                <Home className="h-4 w-4 inline mr-2" />
                Home
              </NavLink>
              <NavLink to="/jobs" onClick={() => setIsMenuOpen(false)}>
                <Briefcase className="h-4 w-4 inline mr-2" />
                Jobs
              </NavLink>
              
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </NavLink>
                  {user?.role === 'recruiter' || user?.role === 'admin' ? (
                    <NavLink to="/create-job" onClick={() => setIsMenuOpen(false)}>
                      Post Job
                    </NavLink>
                  ) : null}
                  <NavLink to="/applications" onClick={() => setIsMenuOpen(false)}>
                    <FileText className="h-4 w-4 inline mr-2" />
                    Applications
                  </NavLink>
                  <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-4 w-4 inline mr-2" />
                    Profile
                  </NavLink>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-700">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-gray-500">{user?.email}</div>
                      <div className="text-xs text-blue-600 capitalize">{user?.role}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-2 border-t">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block btn-primary text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
