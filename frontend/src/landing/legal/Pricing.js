import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Crown, 
  ArrowRight, 
  Star, 
  Zap, 
  Shield, 
  Rocket, 
  Brain, 
  Code, 
  Trophy, 
  Sparkles, 
  Heart, 
  Target, 
  Award, 
  Globe, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Users, 
  Clock,
  Gift,
  Diamond,
  Flame,
  Lightning,
  Infinity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Gamepad2,
  BarChart3
} from 'lucide-react';

const Pricing = () => {
  const { isDarkMode } = useTheme();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [floatingElements, setFloatingElements] = useState([]);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Generate floating cosmic elements
  useEffect(() => {
    const elements = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      speed: Math.random() * 3 + 2,
      opacity: Math.random() * 0.3 + 0.1,
      type: ['star', 'sparkle', 'diamond'][Math.floor(Math.random() * 3)]
    }));
    setFloatingElements(elements);
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Cosmic Explorer',
      icon: Star,
      price: { monthly: 0, yearly: 0 },
      description: 'Begin your cosmic learning journey',
      color: 'from-gray-500 to-slate-500',
      features: [
        { name: 'Basic coding challenges', included: true, pro: false },
        { name: 'Limited practice problems', included: true, pro: false },
        { name: 'Community support', included: true, pro: false },
        { name: 'Basic progress tracking', included: true, pro: false },
        { name: 'Ad-supported experience', included: true, pro: false },
        { name: 'Premium courses', included: false, pro: true },
        { name: 'Interactive learning games', included: false, pro: true },
        { name: 'Priority support', included: false, pro: true },
        { name: 'Advanced analytics', included: false, pro: true },
        { name: 'Certificates', included: false, pro: true },
        { name: 'Ad-free experience', included: false, pro: true },
        { name: 'Unlimited practice', included: false, pro: true }
      ],
      popular: false,
      badge: null
    },
    {
      id: 'pro',
      name: 'Cosmic Master',
      icon: Crown,
      price: { monthly: 199, yearly: 1499 },
      description: 'Unlock the full potential of your learning universe',
      color: 'from-purple-500 via-pink-500 to-orange-500',
      features: [
        { name: 'Basic coding challenges', included: true, pro: true },
        { name: 'Limited practice problems', included: true, pro: true },
        { name: 'Community support', included: true, pro: true },
        { name: 'Basic progress tracking', included: true, pro: true },
        { name: 'Ad-supported experience', included: false, pro: true },
        { name: 'Premium courses', included: true, pro: true },
        { name: 'Interactive learning games', included: true, pro: true },
        { name: 'Priority support', included: true, pro: true },
        { name: 'Advanced analytics', included: true, pro: true },
        { name: 'Certificates', included: true, pro: true },
        { name: 'Ad-free experience', included: true, pro: true },
        { name: 'Unlimited practice', included: true, pro: true }
      ],
      popular: true,
      badge: 'Most Popular'
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
  const currentPrice = selectedPlanData.price[billingCycle];
  const savings = billingCycle === 'yearly' ? Math.round((selectedPlanData.price.monthly * 12 - selectedPlanData.price.yearly) / (selectedPlanData.price.monthly * 12) * 100) : 0;

  const getFeatureIcon = (featureName) => {
    const iconMap = {
      'Basic coding challenges': Code,
      'Limited practice problems': Target,
      'Community support': Users,
      'Basic progress tracking': TrendingUp,
      'Ad-supported experience': Info,
      'Premium courses': Crown,
      'Interactive learning games': Gamepad2,
      'Priority support': Shield,
      'Advanced analytics': BarChart3,
      'Certificates': Award,
      'Ad-free experience': Sparkles,
      'Unlimited practice': Infinity
    };
    return iconMap[featureName] || CheckCircle;
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      
      {/* Floating Cosmic Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map(element => (
          <motion.div
            key={element.id}
            className={`absolute ${
              element.type === 'star' ? 'text-yellow-400' :
              element.type === 'sparkle' ? 'text-purple-400' :
              'text-blue-400'
            }`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              fontSize: `${element.size}px`,
              opacity: element.opacity
            }}
            animate={{
              y: [0, -50, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: element.speed * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {element.type === 'star' ? <Star /> : 
             element.type === 'sparkle' ? <Sparkles /> : 
             <Diamond />}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <Crown className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
              className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent'
              }`}
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Choose Your Cosmic Path
            </motion.h1>
            <motion.p 
              className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Embark on your learning journey with the perfect plan for your cosmic ambitions
            </motion.p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-8"
          >
            <div className={`p-2 rounded-2xl backdrop-blur-xl border ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/80 border-gray-200'
            }`}>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Monthly
                </motion.button>
                <motion.button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Yearly
                </motion.button>
              </div>
              {billingCycle === 'yearly' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -right-2"
                >
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    Save {savings}%
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className={`relative rounded-3xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? (isDarkMode 
                          ? 'bg-white/10 border-purple-500/50 shadow-2xl shadow-purple-500/25' 
                          : 'bg-white/90 border-purple-500/30 shadow-2xl shadow-purple-500/25')
                      : (isDarkMode 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-white/60 border-gray-200/50 hover:bg-white/80')
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                        ⭐ {plan.badge}
                      </div>
                    </motion.div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center mx-auto mb-4`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className={`text-2xl font-bold mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-8">
                      <div className={`text-4xl font-bold mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        ₹{plan.price[billingCycle]}
                        {plan.price[billingCycle] > 0 && (
                          <span className={`text-lg font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                        )}
                      </div>
                      {plan.price[billingCycle] === 0 && (
                        <div className={`text-lg font-semibold ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          Forever Free
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => {
                        const FeatureIcon = getFeatureIcon(feature.name);
                        return (
                          <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + featureIndex * 0.1 }}
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                              hoveredFeature === feature.name
                                ? (isDarkMode ? 'bg-white/10' : 'bg-gray-50')
                                : ''
                            }`}
                            onMouseEnter={() => setHoveredFeature(feature.name)}
                            onMouseLeave={() => setHoveredFeature(null)}
                          >
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                feature.included
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {feature.included ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <span className={`text-sm ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {feature.name}
                              </span>
                            </div>
                            <FeatureIcon className={`w-4 h-4 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* CTA Button */}
                    <motion.div
                      className="text-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {plan.price[billingCycle] === 0 ? (
                        <div className={`px-6 py-3 rounded-xl font-semibold ${
                          isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          Current Plan
                        </div>
                      ) : (
                        <Link
                          to="/upgrade-to-pro"
                          className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
                              : isDarkMode
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{isSelected ? 'Upgrade Now' : 'Choose Plan'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Money Back Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-2xl backdrop-blur-xl border ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/80 border-gray-200'
            }`}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Shield className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <div className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  30-Day Money-Back Guarantee
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Not satisfied? Get a full refund, no questions asked
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Comparison Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-8"
          >
            <motion.button
              onClick={() => setShowComparison(!showComparison)}
              className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{showComparison ? 'Hide' : 'Show'} Detailed Comparison</span>
              <motion.div
                animate={{ rotate: showComparison ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Detailed Comparison */}
          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 max-w-4xl mx-auto"
              >
                <div className={`rounded-3xl backdrop-blur-xl border p-8 ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-2xl font-bold text-center mb-8 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Feature Comparison Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${
                          isDarkMode ? 'border-white/20' : 'border-gray-200'
                        }`}>
                          <th className={`text-left py-4 px-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Feature</th>
                          <th className={`text-center py-4 px-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Free</th>
                          <th className={`text-center py-4 px-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Pro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans[0].features.map((feature, index) => (
                          <tr key={feature.name} className={`border-b ${
                            isDarkMode ? 'border-white/10' : 'border-gray-100'
                          }`}>
                            <td className={`py-4 px-4 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{feature.name}</td>
                            <td className="text-center py-4 px-4">
                              {feature.included ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </td>
                            <td className="text-center py-4 px-4">
                              {feature.pro ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
