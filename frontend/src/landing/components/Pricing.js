import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Sparkles, 
  Crown, 
  Rocket, 
  Shield, 
  Heart,
  ArrowRight,
  Gift,
  Flame,
  Target,
  Users,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react';

const Pricing = () => {
  const { isDarkMode } = useTheme();
  const [isAnnual, setIsAnnual] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        "Up to 50 interviews/month",
        "Basic AI analysis",
        "Email support"
      ],
      limitations: [
        "Limited integrations",
        "Basic reporting"
      ],
      popular: false,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      darkBgColor: "from-blue-900/20 to-cyan-900/20",
      icon: Users,
      delay: 0
    },
    {
      name: "Professional",
      description: "Ideal for growing companies",
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        "Up to 500 interviews/month",
        "Advanced AI analysis",
        "Priority support",
        "API access",
        "Custom branding"
      ],
      limitations: [
        "Limited custom integrations"
      ],
      popular: true,
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
      darkBgColor: "from-emerald-900/20 to-teal-900/20",
      icon: Rocket,
      delay: 0.2
    },
    {
      name: "Enterprise",
      description: "For large organizations with complex needs",
      monthlyPrice: 299,
      annualPrice: 2990,
      features: [
        "Unlimited interviews",
        "Premium AI analysis",
        "24/7 dedicated support",
        "Fully custom templates",
        "Enterprise analytics",
        "Advanced team features",
        "Dedicated account manager",
        "SLA guarantee"
      ],
      limitations: [],
      popular: false,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
      darkBgColor: "from-orange-900/20 to-red-900/20",
      icon: Crown,
      delay: 0.4
    }
  ];

  const addOns = [
    {
      name: "Additional Interviews",
      description: "Extra interviews beyond your plan limit",
      price: "$2 per interview"
    },
    {
      name: "Advanced Analytics",
      description: "Deep insights and custom reporting",
      price: "$50/month"
    },
    {
      name: "Custom Integrations",
      description: "Connect with your existing tools",
      price: "Custom pricing"
    },
    {
      name: "White-label Solution",
      description: "Fully branded experience",
      price: "Custom pricing"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <section id="pricing" className={`relative py-24 overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Coins */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDarkMode ? 'bg-yellow-400/20' : 'bg-yellow-500/10'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
        
        {/* Large Floating Orbs */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-yellow-500/5 to-orange-500/5' : 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10'
          } blur-3xl`}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5' : 'bg-gradient-to-r from-emerald-400/10 to-teal-400/10'
          } blur-3xl`}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Section Header */}
        <motion.div 
          className="text-center mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Gift className="w-4 h-4 text-yellow-500" />
            </motion.div>
            <span className="text-yellow-600 font-semibold">Pricing Plans</span>
          </motion.div>

          <motion.h2 
            variants={itemVariants}
            className={`text-4xl md:text-6xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            <motion.span
              className="block bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Pricing
            </motion.span>
          </motion.h2>

          <motion.p 
            variants={itemVariants}
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Choose the perfect plan for your team. All plans include our core 
            <motion.span 
              className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {" "}AI interview features
            </motion.span>
            .
          </motion.p>

          {/* Enhanced Billing Toggle */}
          <motion.div 
            className="flex items-center justify-center space-x-6 mt-8"
            variants={itemVariants}
          >
            <motion.span 
              className={`text-lg font-medium transition-colors duration-300 ${
              !isAnnual 
                  ? (isDarkMode ? 'text-white' : 'text-gray-900')
                : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
              }`}
              animate={{ scale: !isAnnual ? 1.05 : 1 }}
            >
              Monthly
            </motion.span>
            
            <motion.button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 ${
                isAnnual ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300'
              } shadow-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  isAnnual ? 'translate-x-9' : 'translate-x-1'
                }`}
                animate={{
                  x: isAnnual ? 36 : 4,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              {/* Animated background gradient */}
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0`}
                animate={{ opacity: isAnnual ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
            
            <motion.span 
              className={`text-lg font-medium transition-colors duration-300 ${
              isAnnual 
                  ? (isDarkMode ? 'text-white' : 'text-gray-900')
                : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
              }`}
              animate={{ scale: isAnnual ? 1.05 : 1 }}
            >
              Annual
            </motion.span>
            
            <AnimatePresence>
            {isAnnual && (
                <motion.span 
                  className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm px-3 py-1 rounded-full font-semibold"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎉 Save 20%
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* 3D Pricing Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const isHovered = hoveredPlan === index;
            
            return (
              <motion.div
              key={index}
                className="relative group"
                variants={itemVariants}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: plan.popular ? 1.05 : 1,
                  rotateY: isHovered ? 5 : 0
                }}
                transition={{ 
                  delay: plan.delay,
                  type: "spring",
                  stiffness: 100,
                  damping: 12
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                onHoverStart={() => setHoveredPlan(index)}
                onHoverEnd={() => setHoveredPlan(null)}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Card Container */}
                <motion.div
                  className={`relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl border transition-all duration-500 ${
                    isDarkMode 
                      ? `bg-gradient-to-br ${plan.darkBgColor} border-gray-600/50` 
                      : `bg-gradient-to-br ${plan.bgColor} border-gray-200/50`
                  } shadow-2xl hover:shadow-3xl`}
                  animate={{
                    boxShadow: isHovered 
                      ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
                      : '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Popular Badge */}
              {plan.popular && (
                    <motion.div
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: plan.delay + 0.3 }}
                    >
                      <motion.div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            "0 4px 15px rgba(16, 185, 129, 0.3)",
                            "0 8px 25px rgba(16, 185, 129, 0.5)",
                            "0 4px 15px rgba(16, 185, 129, 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                    <Star className="w-4 h-4" />
                        </motion.div>
                    <span>Most Popular</span>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Animated Background Gradient */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                    animate={{
                      opacity: isHovered ? 0.1 : 0
                    }}
                  />

                  {/* Floating Particles */}
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${plan.color}`}
                        style={{
                          left: `${20 + i * 15}%`,
                          top: `${30 + i * 10}%`,
                        }}
                        animate={{
                          y: [0, -30, 0],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>

                  {/* Header Section */}
                  <div className="relative text-center mb-8">
                    {/* Icon */}
                    <motion.div
                      className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-xl`}
                      animate={{ 
                        rotate: isHovered ? 360 : 0,
                        scale: isHovered ? 1.1 : 1
                      }}
                      whileHover={{ 
                        rotate: 360,
                        scale: 1.2,
                        transition: { duration: 0.6 }
                      }}
                    >
                      <IconComponent className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Plan Name */}
                    <motion.h3 
                      className={`text-3xl font-bold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      animate={{
                        color: isHovered 
                          ? (isDarkMode ? '#60a5fa' : '#2563eb')
                          : (isDarkMode ? '#ffffff' : '#111827')
                      }}
                    >
                      {plan.name}
                    </motion.h3>

                    {/* Description */}
                    <motion.p 
                      className={`mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                      animate={{
                        opacity: isHovered ? 1 : 0.8
                      }}
                    >
                      {plan.description}
                    </motion.p>

                    {/* Price */}
                    <motion.div 
                      className="mb-4"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: plan.delay + 0.5, type: "spring", stiffness: 200 }}
                    >
                      <motion.span 
                        className={`text-5xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                      >
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </motion.span>
                      <span className={`text-lg transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        /{isAnnual ? 'year' : 'month'}
                  </span>
                    </motion.div>

                    {/* Savings Badge */}
                    <AnimatePresence>
                {isAnnual && (
                        <motion.div 
                          className="inline-block"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <motion.div
                            className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 text-sm px-3 py-1 rounded-full font-semibold"
                            animate={{ 
                              scale: [1, 1.05, 1],
                              rotate: [0, 2, -2, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                    Save ${(plan.monthlyPrice * 12) - plan.annualPrice}/year
                          </motion.div>
                        </motion.div>
                )}
                    </AnimatePresence>
              </div>

                  {/* Features */}
                  <motion.div 
                    className="space-y-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: plan.delay + 0.7 }}
                  >
                {plan.features.map((feature, featureIndex) => (
                      <motion.div 
                        key={featureIndex} 
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: plan.delay + 0.8 + featureIndex * 0.1 }}
                      >
                        <motion.div
                          className={`w-6 h-6 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                        <span className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                    
                {plan.limitations.map((limitation, limitIndex) => (
                      <motion.div 
                        key={limitIndex} 
                        className="flex items-center space-x-3 opacity-60"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 0.6, x: 0 }}
                        transition={{ delay: plan.delay + 0.8 + (plan.features.length + limitIndex) * 0.1 }}
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                          <X className="w-4 h-4 text-white" />
                  </div>
                        <span className={`text-sm ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {limitation}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* CTA Button */}
                  <motion.button
                    className={`group relative w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                  plan.popular
                        ? `bg-gradient-to-r ${plan.color} text-white shadow-xl hover:shadow-2xl`
                        : isDarkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                          : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: plan.delay + 1.0 }}
                  >
                    {/* Animated background for popular plans */}
                    {plan.popular && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}

                    <div className="relative flex items-center justify-center space-x-2">
                      <span>{plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
            </div>
                  </motion.button>

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0"
                    animate={{
                      x: isHovered ? ['-100%', '100%'] : '-100%',
                      opacity: isHovered ? [0, 1, 0] : 0
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: isHovered ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.div 
            className={`relative overflow-hidden rounded-3xl p-12 backdrop-blur-xl border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/50 to-slate-800/50 border-gray-600/50' 
                : 'bg-gradient-to-br from-white/50 to-blue-50/50 border-gray-200/50'
            } shadow-2xl`}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full ${
                  isDarkMode ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10' : 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20'
                } blur-2xl`}
                animate={{
                  scale: [1, 1.5, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              <motion.div
                className={`absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full ${
                  isDarkMode ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-r from-emerald-400/20 to-teal-400/20'
                } blur-2xl`}
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
        </div>

            <div className="relative">
              <motion.div
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Rocket className="w-4 h-4 text-yellow-500" />
                </motion.div>
                <span className="text-yellow-600 font-semibold">Ready to Transform Your Hiring?</span>
              </motion.div>

              <motion.h3 
                className={`text-3xl md:text-5xl font-bold mb-6 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                <motion.span
                  className="block"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.9, duration: 0.8 }}
                >
                  Start Your
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.0, duration: 0.8 }}
                >
                  Free Trial Today
                </motion.span>
              </motion.h3>

              <motion.p 
                className={`text-xl max-w-3xl mx-auto mb-8 leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1, duration: 0.8 }}
              >
                Join thousands of companies already using AI Hiring to find better candidates faster.
                <motion.span 
                  className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {" "}No credit card required.
                </motion.span>
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.8 }}
              >
                <motion.button 
                  className="group relative px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  <div className="relative flex items-center space-x-2">
                    <span>Start Free Trial</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
          </div>
                </motion.button>

                <motion.button 
                  className={`px-8 py-4 font-bold text-lg rounded-2xl border-2 transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 text-white hover:border-yellow-500 hover:text-yellow-400' 
                      : 'border-gray-300 text-gray-700 hover:border-yellow-500 hover:text-yellow-600'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center space-x-2">
                    <span>Contact Sales</span>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Target className="w-5 h-5" />
                    </motion.div>
              </div>
                </motion.button>
              </motion.div>

              {/* Floating Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-1 h-1 rounded-full ${
                      isDarkMode ? 'bg-yellow-400/30' : 'bg-yellow-500/20'
                    }`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -50, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: Math.random() * 4 + 4,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
            ))}
          </div>
        </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
