import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Sparkles, ArrowRight, Check } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      
      if (result.success) {
        toast.success('Registration successful!');
        navigate('/');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Floating Particles */}
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 5 + 1}px`,
              height: `${Math.random() * 5 + 1}px`,
              background: `rgba(59, 130, 246, ${Math.random() * 0.7 + 0.3})`,
            }}
            animate={{
              y: [0, -120, 0],
              opacity: [0, 1, 0],
              scale: [0.3, 1.8, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 6,
            }}
          />
        ))}
        
        {/* Large Blue Orbs */}
        <motion.div
          className="absolute w-[700px] h-[700px] bg-gradient-to-r from-blue-600/25 to-cyan-500/15 rounded-full blur-3xl"
          style={{ top: '-25%', right: '-25%' }}
          animate={{
            scale: [1, 1.6, 1],
            rotate: [0, 360],
            x: [0, -60, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-700/15 rounded-full blur-3xl"
          style={{ bottom: '-25%', left: '-25%' }}
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [360, 0],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Central Glow */}
        <motion.div
          className="absolute w-[900px] h-[900px] bg-gradient-radial from-blue-500/8 via-cyan-500/4 to-transparent rounded-full"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* Main Card */}
          <motion.div
            className="relative backdrop-blur-2xl bg-black/40 border border-blue-500/30 rounded-3xl p-10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(15,23,42,0.9) 50%, rgba(0,0,0,0.8) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ 
              scale: 1.01,
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
                whileHover={{ rotate: -5, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-60" />
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                {/* Animated Ring */}
                <motion.div
                  className="absolute inset-0 border-2 border-cyan-400/50 rounded-2xl"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent mb-3">
                Join AI Hiring
              </h1>
              <p className="text-blue-200/80 text-lg">
                Create your account and start your journey
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
              {/* Name Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-blue-200 mb-3">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-black/50 border border-blue-500/30 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.4) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3)'
                    }}
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
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

              {/* Role Selection */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-blue-200 mb-4">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.label
                    className="relative cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="candidate"
                      checked={formData.role === 'candidate'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`relative p-5 border-2 rounded-xl transition-all duration-300 overflow-hidden ${
                      formData.role === 'candidate'
                        ? 'border-blue-400 bg-blue-500/20 text-white shadow-lg'
                        : 'border-blue-500/30 text-blue-200 hover:border-blue-400/50 hover:bg-blue-500/10'
                    }`}
                    style={{
                      background: formData.role === 'candidate' 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.4) 100%)'
                    }}>
                      <div className="flex flex-col items-center text-center relative z-10">
                        <User className="h-7 w-7 mb-3 text-blue-400" />
                        <span className="font-medium text-lg">Candidate</span>
                        <p className="text-xs text-blue-300/80 mt-1">
                          Looking for jobs
                        </p>
                      </div>
                      {formData.role === 'candidate' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3"
                        >
                          <Check className="w-5 h-5 text-blue-400" />
                        </motion.div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.label>

                  <motion.label
                    className="relative cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={formData.role === 'recruiter'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`relative p-5 border-2 rounded-xl transition-all duration-300 overflow-hidden ${
                      formData.role === 'recruiter'
                        ? 'border-blue-400 bg-blue-500/20 text-white shadow-lg'
                        : 'border-blue-500/30 text-blue-200 hover:border-blue-400/50 hover:bg-blue-500/10'
                    }`}
                    style={{
                      background: formData.role === 'recruiter' 
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.4) 100%)'
                    }}>
                      <div className="flex flex-col items-center text-center relative z-10">
                        <Briefcase className="h-7 w-7 mb-3 text-blue-400" />
                        <span className="font-medium text-lg">Recruiter</span>
                        <p className="text-xs text-blue-300/80 mt-1">
                          Hiring talent
                        </p>
                      </div>
                      {formData.role === 'recruiter' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3"
                        >
                          <Check className="w-5 h-5 text-blue-400" />
                        </motion.div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.label>
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
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
                    placeholder="Create a password"
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
                <p className="mt-2 text-xs text-blue-300/70">
                  Must be at least 6 characters
                </p>
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <label className="block text-sm font-medium text-blue-200 mb-3">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-black/50 border border-blue-500/30 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.4) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3)'
                    }}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-blue-400 hover:text-cyan-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-blue-400 hover:text-cyan-400 transition-colors" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>

              {/* Terms Agreement */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex items-start"
              >
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 text-blue-500 bg-black/50 border-blue-500/30 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                />
                <label className="ml-3 text-sm text-blue-200">
                  I agree to the{' '}
                  <Link to="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </motion.div>

              {/* Create Account Button */}
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
                transition={{ delay: 1.1, duration: 0.5 }}
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>
            </motion.form>

            {/* Sign In Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-blue-200/80">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
