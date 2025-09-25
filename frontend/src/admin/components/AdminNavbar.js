import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  BarChart3,
  Shield,
  UserCheck
} from 'lucide-react';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children, onClick, className = "" }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`${className} ${isActive(to) ? 'bg-white/20' : ''}`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/admin" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">AI Hiring Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/admin" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/admin/users" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Users
            </NavLink>
            <NavLink 
              to="/admin/recruiter-approvals" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Recruiter Approvals
            </NavLink>
            <NavLink 
              to="/admin/jobs" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Jobs
            </NavLink>
            <NavLink 
              to="/admin/applications" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Applications
            </NavLink>
            <NavLink 
              to="/admin/analytics" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Analytics
            </NavLink>
            <NavLink 
              to="/admin/settings" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Settings
            </NavLink>
            
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
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
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 bg-gray-50 border border-gray-200"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-black/90 z-40 overflow-y-auto">
            <div className="p-6 flex flex-col gap-4">
              {/* User Info */}
              <div className="flex items-center space-x-4 mb-6 p-4 rounded-2xl bg-white/20 border border-white/30">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-lg font-black text-white">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-sm text-gray-300 truncate">{user?.email || ''}</p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2">
                <NavLink 
                  to="/admin" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <Home className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">Dashboard</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/users" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="font-medium">Users</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/recruiter-approvals" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <UserCheck className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium">Recruiter Approvals</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/jobs" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Jobs</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/applications" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <span className="font-medium">Applications</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/analytics" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                  <span className="font-medium">Analytics</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/settings" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 px-4 py-3 text-white hover:bg-white/20 rounded-xl transition-all duration-300 bg-white/10"
                >
                  <Settings className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">Settings</span>
                </NavLink>
              </div>
              
              {/* Logout Button */}
              <div className="border-t border-white/20 mt-6 pt-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-4 w-full px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 bg-red-500/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
