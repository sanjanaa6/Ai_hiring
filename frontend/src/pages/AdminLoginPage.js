import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use global auth flow so context updates and ProtectedRoute recognizes admin
      const result = await login(email, password);
      if (result?.success && result.user?.role === 'admin') {
        toast.success('Admin login successful');
        navigate('/admin');
      } else if (result?.success) {
        toast.error('This account is not an admin');
      } else {
        // Fallback to admin-specific endpoint if needed
        const res = await apiService.adminLogin(email, password);
        if (res && res.token && res.user?.role === 'admin') {
          localStorage.setItem('token', res.token);
          toast.success('Admin login successful');
          navigate('/admin');
        } else {
          toast.error(res?.message || res?.error || 'Invalid admin credentials');
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h1 className="text-2xl font-semibold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}


