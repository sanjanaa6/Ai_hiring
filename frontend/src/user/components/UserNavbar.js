import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home,
  Search,
  Bell
} from 'lucide-react';

const UserNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

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
          <Link to="/user" className="navbar-brand">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span>AI Hiring</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav">
            <NavLink to="/user">Dashboard</NavLink>
            <NavLink to="/user/jobs">Find Jobs</NavLink>
            <NavLink to="/user/applications">My Applications</NavLink>
            <NavLink to="/user/profile">Profile</NavLink>
            
            <div className="flex items-center space-x-2 ml-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
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
              <NavLink to="/user" onClick={() => setIsMenuOpen(false)}>
                <Home className="h-4 w-4 inline mr-2" />
                Dashboard
              </NavLink>
              <NavLink to="/user/jobs" onClick={() => setIsMenuOpen(false)}>
                <Search className="h-4 w-4 inline mr-2" />
                Find Jobs
              </NavLink>
              <NavLink to="/user/applications" onClick={() => setIsMenuOpen(false)}>
                <FileText className="h-4 w-4 inline mr-2" />
                My Applications
              </NavLink>
              <NavLink to="/user/profile" onClick={() => setIsMenuOpen(false)}>
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </NavLink>
              
              <div className="pt-2 border-t">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default UserNavbar;
