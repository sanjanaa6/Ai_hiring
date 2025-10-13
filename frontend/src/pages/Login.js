import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Brain, ArrowRight, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        // Redirect based on user role instead of 'from' path
        const userRole = result.user?.role;
        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userRole === 'recruiter') {
          navigate('/recruiter', { replace: true });
        } else if (userRole === 'candidate' || userRole === 'user') {
          navigate('/user', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        // Recruiters can now login without approval
        // Removed approval status checks
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating Particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: `rgba(59, 130, 246, ${Math.random() * 0.6 + 0.2})`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
        
        {/* Large Blue Orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 to-cyan-500/20 rounded-full blur-3xl"
          style={{ top: '-20%', left: '-20%' }}
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, 360],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/25 to-blue-700/20 rounded-full blur-3xl"
          style={{ bottom: '-20%', right: '-20%' }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 0],
            x: [0, -40, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Central Glow */}
        <motion.div
          className="absolute w-[800px] h-[800px] bg-gradient-radial from-blue-500/10 via-blue-600/5 to-transparent rounded-full"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={() => window.location.href = window.location.origin}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm font-medium">Back to Main Site</span>
            </button>
          </motion.div>

          {/* Main Card */}
          <motion.div
            className="relative backdrop-blur-2xl bg-black/40 border border-blue-500/30 rounded-3xl p-10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(15,23,42,0.9) 50%, rgba(0,0,0,0.8) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-sm -z-10" />
            
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mb-10"
            >
              <motion.div
                className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-60" />
                <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 shadow-2xl">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                {/* Animated Ring */}
                <motion.div
                  className="absolute inset-0 border-2 border-blue-400/50 rounded-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-3">
                Welcome Back
              </h1>
              <p className="text-blue-200/80 text-lg">
                Sign in to your AI Hiring account
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              {/* Email Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-blue-200 mb-3">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-blue-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-black/50 border border-blue-500/30 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.4) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3)'
                    }}
                    placeholder="Enter your email"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-blue-200 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-black/50 border border-blue-500/30 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.4) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3)'
                    }}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-blue-400 hover:text-cyan-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-blue-400 hover:text-cyan-400 transition-colors" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </motion.div>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="relative w-full py-4 px-6 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 50%, #06b6d4 100%)',
                  boxShadow: '0 10px 25px rgba(30, 64, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 15px 35px rgba(30, 64, 175, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {/* Animated Background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative z-10 flex items-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>
            </motion.form>


            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-blue-200/80">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
                >
                  Create one now
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
