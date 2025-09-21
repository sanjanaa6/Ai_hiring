import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Github, 
  Instagram,
  ChevronRight,
  Sparkles,
  Heart
} from 'lucide-react';

const Footer = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const navigation = {
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard' },
      { name: 'Users', path: '/admin/users' },
      { name: 'Payments', path: '/admin/payments' },
    ],
    vendor: [
      { name: 'Dashboard', path: '/vendor/dashboard' },
      { name: 'My Tests', path: '/vendor/tests' },
      { name: 'Analytics', path: '/vendor/analytics/tests' },
      { name: 'Candidates', path: '/vendor/candidates' },
    ],
    candidate: [
      { name: 'Dashboard', path: '/dashboard/user' },
      { name: 'My Tests', path: '/dashboard/user/tests' },
    ]
  };

  const legalLinks = [
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Refund Policy', path: '/refund' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const getQuickLinks = () => {
    if (!user) {
      return [
        { name: 'Home', path: '/' },
        { name: 'Login', path: '/login' },
        { name: 'Register', path: '/register' },
      ];
    }

    switch(user.role) {
      case 'admin':
        return navigation.admin;
      case 'vendor':
        return navigation.vendor;
      case 'user':
        return navigation.candidate;
      default:
        return navigation.candidate;
    }
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Spectacular Footer Design */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className={`relative ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black' 
            : 'bg-gradient-to-br from-gray-100 via-white to-gray-50'
        }`}
      >
        {/* Enhanced Creative Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Geometric Shapes */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`shape-${i}`}
              className={`absolute ${
                ['bg-blue-400/8', 'bg-green-400/8', 'bg-orange-400/8', 'bg-teal-400/8', 'bg-purple-400/8'][i % 5]
              } ${
                i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-lg rotate-45' : 'rounded-none'
              } blur-sm`}
              style={{
                width: `${40 + Math.random() * 100}px`,
                height: `${40 + Math.random() * 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 80 - 40, 0],
                y: [0, Math.random() * 80 - 40, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 12 + Math.random() * 8,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
            />
          ))}

          {/* Animated Grid Pattern */}
          <motion.div
            className={`absolute inset-0 ${
              isDarkMode ? 'opacity-[0.03]' : 'opacity-[0.02]'
            }`}
            animate={{ 
              backgroundPosition: ['0px 0px', '60px 60px', '0px 0px'] 
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Floating Sparkles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className={`absolute w-1 h-1 ${
                ['bg-blue-400', 'bg-green-400', 'bg-orange-400', 'bg-teal-400', 'bg-purple-400'][i % 5]
              } rounded-full`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -50, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "loop",
                delay: Math.random() * 5
              }}
            />
          ))}

          {/* Gradient Waves */}
          <motion.div
            className={`absolute inset-0 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-900/10 via-transparent to-teal-900/10' 
                : 'bg-gradient-to-r from-blue-100/30 via-transparent to-teal-100/30'
            }`}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
      </div>

      {/* Main Footer Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Company Section - Enhanced */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="lg:col-span-5"
            >
              {/* Enhanced Logo with Spectacular Animation */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center mb-8 group"
              >
                <Link to="/" className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 1 }}
                    className="relative"
                  >
                    {/* Multiple Animated Rings */}
                    <motion.div
                      className="absolute inset-0 w-20 h-20 rounded-full border-2 border-blue-400/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-1 w-18 h-18 rounded-full border border-teal-400/20"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-2 w-16 h-16 rounded-full border border-orange-400/15"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Logo with Glow Effect */}
                    <motion.div
                      className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                      whileHover={{
                        boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)",
                        scale: 1.05
                      }}
                    >
                <img 
                  src="https://res.cloudinary.com/dfdtxogcl/images/c_scale,w_248,h_180,dpr_1.25/f_auto,q_auto/v1706606519/Picture1_215dc6b/Picture1_215dc6b.png"
                  alt="Eval8 Logo"
                        className="w-12 h-12 object-contain"
                      />
                    </motion.div>

                    {/* Floating Particles around Logo */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className={`absolute w-1 h-1 rounded-full ${
                          ['bg-blue-400', 'bg-teal-400', 'bg-orange-400'][i % 3]
                        }`}
                        style={{
                          left: `${50 + 35 * Math.cos((i * 60) * Math.PI / 180)}%`,
                          top: `${50 + 35 * Math.sin((i * 60) * Math.PI / 180)}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 360]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                      />
                    ))}
                  </motion.div>

            <div>
                    <motion.h2 
                      className={`text-3xl font-black tracking-wide ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      whileHover={{
                        textShadow: isDarkMode 
                          ? "0 0 20px rgba(59, 130, 246, 0.5)" 
                          : "0 0 20px rgba(59, 130, 246, 0.3)"
                      }}
                    >
                      Eval8
                    </motion.h2>
                    <motion.div 
                      className="flex items-center space-x-1 mt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, 180, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </motion.div>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>
                        Smart Assessment Platform
                      </span>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 bg-green-400 rounded-full ml-2"
                      />
                    </motion.div>
                  </div>
              </Link>
              </motion.div>

              {/* Enhanced Description */}
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`text-lg leading-relaxed mb-8 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Revolutionizing the future of assessment with{' '}
                <span className="text-transparent bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text font-semibold">
                  AI-powered proctoring
                </span>{' '}
                and comprehensive evaluation tools. Trusted by thousands of organizations worldwide.
              </motion.p>

              {/* Newsletter Subscription */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className={`p-6 rounded-3xl mb-8 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30' 
                    : 'bg-gradient-to-r from-blue-50/50 to-teal-50/50 border border-blue-200/30'
                } backdrop-blur-sm`}
              >
                <h4 className={`text-lg font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🚀 Stay Updated with Eval8
                </h4>
                <p className={`text-sm mb-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Get the latest updates on AI-powered assessment features
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="email"
                    placeholder="Enter your email"
                    className={`flex-1 px-4 py-2 rounded-xl text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 text-white border border-gray-600 focus:border-blue-400' 
                        : 'bg-white text-gray-900 border border-gray-300 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-300`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                  >
                    Subscribe
                  </motion.button>
                </div>
              </motion.div>

              {/* Enhanced Social Links with Stats */}
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Connect with Us
                </h4>
                <div className="flex space-x-4">
                  {[
                    { Icon: Linkedin, href: "https://www.linkedin.com/company/eval8", color: "hover:text-blue-600 hover:bg-blue-50", followers: "2.5K" },
                    { Icon: Twitter, href: "https://twitter.com/eval8", color: "hover:text-sky-500 hover:bg-sky-50", followers: "1.8K" },
                    { Icon: Github, href: "https://github.com/eval8", color: "hover:text-gray-900 hover:bg-gray-100", followers: "890" },
                    { Icon: Instagram, href: "https://instagram.com/eval8", color: "hover:text-pink-500 hover:bg-pink-50", followers: "3.2K" }
                  ].map(({ Icon, href, color, followers }, index) => (
                    <motion.div
                      key={index}
                      className="relative group"
                      whileHover={{ y: -3 }}
                    >
                      <motion.a
                        href={href}
                  target="_blank" 
                  rel="noopener noreferrer" 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-12 h-12 rounded-2xl ${
                          isDarkMode 
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                            : `bg-white text-gray-600 shadow-lg ${color}`
                        } flex items-center justify-center transition-all duration-300 border border-gray-200/20 relative overflow-hidden`}
                      >
                        <Icon size={20} />
                        
                        {/* Hover Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                      </motion.a>
                      
                      {/* Follower Count Tooltip */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        whileHover={{ opacity: 1, y: 0, scale: 1 }}
                        className={`absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white border border-gray-600' 
                            : 'bg-gray-900 text-white'
                        } pointer-events-none whitespace-nowrap shadow-lg`}
                      >
                        {followers} followers
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
            </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <h3 className={`text-xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Quick Links
              </h3>
              <ul className="space-y-3">
                {getQuickLinks().map((link, index) => (
                  <motion.li
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      className={`flex items-center space-x-2 group transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-blue-300' 
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <ChevronRight 
                        size={16} 
                        className="group-hover:translate-x-1 transition-transform duration-300" 
                      />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.name}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <h3 className={`text-xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Legal
              </h3>
              <ul className="space-y-3">
                {legalLinks.slice(0, 5).map((link, index) => (
                  <motion.li
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      className={`flex items-center space-x-2 group transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-blue-300' 
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <ChevronRight 
                        size={16} 
                        className="group-hover:translate-x-1 transition-transform duration-300" 
                      />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.name}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:col-span-3"
            >
              <h3 className={`text-xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Get in Touch
              </h3>
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${
                    isDarkMode ? 'bg-gray-800 text-blue-300' : 'bg-blue-50 text-blue-600'
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Mail size={18} />
            </div>
                  <a 
                    href="mailto:gokul@hysteresis.in"
                    className={`transition-colors duration-300 ${
                      isDarkMode 
                        ? 'text-gray-300 hover:text-blue-300' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    gokul@hysteresis.in
                  </a>
                </motion.div>

                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${
                    isDarkMode ? 'bg-gray-800 text-green-300' : 'bg-green-50 text-green-600'
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Phone size={18} />
          </div>
                  <a 
                    href="tel:+918208117943"
                    className={`transition-colors duration-300 ${
                      isDarkMode 
                        ? 'text-gray-300 hover:text-green-300' 
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    +91 8208117943
                  </a>
                </motion.div>

                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-start space-x-3 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${
                    isDarkMode ? 'bg-gray-800 text-orange-300' : 'bg-orange-50 text-orange-600'
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <MapPin size={18} />
        </div>
                  <span className={`transition-colors duration-300 leading-relaxed ${
                    isDarkMode 
                      ? 'text-gray-300 group-hover:text-orange-300' 
                      : 'text-gray-600 group-hover:text-orange-600'
                  }`}>
                    Office No.12, Dahlia, Neco Gardens,<br />
                    Viman Nagar, Pune, Maharashtra, India
                  </span>
                </motion.div>
            </div>
            </motion.div>
          </div>

          {/* Enhanced Bottom Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`mt-16 pt-8 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  &copy; {new Date().getFullYear()} Eval8. Made with
                </span>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                >
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </motion.div>
                <span className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  in India
                </span>
      </div>

              <div className="flex space-x-6">
                {[
                  { name: 'Privacy Policy', path: '/privacy' },
                  { name: 'Terms of Service', path: '/terms' },
                  { name: 'Cookie Policy', path: '/cookies' }
                ].map((link, index) => (
                  <motion.div
                    key={link.path}
                    whileHover={{ y: -2 }}
                  >
                    <Link
                      to={link.path}
                      className={`text-sm transition-colors duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-blue-300' 
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Orange Line at Complete Bottom */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.8 }}
        className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 w-full"
        style={{ transformOrigin: 'left' }}
      />
    </footer>
  );
};

export default Footer;