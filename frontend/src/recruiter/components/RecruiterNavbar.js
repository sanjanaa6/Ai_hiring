import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  Users, 
  FileText, 
  Plus, 
  LogOut, 
  Menu, 
  X, 
  Home,
  BarChart3
} from 'lucide-react';

const RecruiterNavbar = () => {
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
          <Link to="/recruiter" className="navbar-brand">
            <Briefcase className="h-8 w-8 text-green-600" />
            <span>AI Hiring Recruiter</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav">
            <NavLink to="/recruiter">Dashboard</NavLink>
            <NavLink to="/recruiter/jobs">My Jobs</NavLink>
            <NavLink to="/recruiter/applications">Applications</NavLink>
            <NavLink to="/recruiter/candidates">Candidates</NavLink>
            <NavLink to="/recruiter/analytics">Analytics</NavLink>
            
            <div className="flex items-center space-x-2 ml-4">
              <Link
                to="/recruiter/create-job"
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Post Job
              </Link>
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
              <NavLink to="/recruiter" onClick={() => setIsMenuOpen(false)}>
                <Home className="h-4 w-4 inline mr-2" />
                Dashboard
              </NavLink>
              <NavLink to="/recruiter/jobs" onClick={() => setIsMenuOpen(false)}>
                <Briefcase className="h-4 w-4 inline mr-2" />
                My Jobs
              </NavLink>
              <NavLink to="/recruiter/applications" onClick={() => setIsMenuOpen(false)}>
                <FileText className="h-4 w-4 inline mr-2" />
                Applications
              </NavLink>
              <NavLink to="/recruiter/candidates" onClick={() => setIsMenuOpen(false)}>
                <Users className="h-4 w-4 inline mr-2" />
                Candidates
              </NavLink>
              <NavLink to="/recruiter/analytics" onClick={() => setIsMenuOpen(false)}>
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Analytics
              </NavLink>
              
              <div className="pt-2 border-t space-y-2">
                <Link
                  to="/recruiter/create-job"
                  onClick={() => setIsMenuOpen(false)}
                  className="block btn-primary text-center"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Post Job
                </Link>
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

export default RecruiterNavbar;
