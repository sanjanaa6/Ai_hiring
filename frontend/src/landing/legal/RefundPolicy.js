import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Clock,
  Shield,
  Star,
  TrendingUp,
  ArrowRight,
  Trophy,
  Heart,
  Coins,
  Target,
  Timer,
  Zap
} from 'lucide-react';

const RefundPolicy = () => {
  const { isDarkMode } = useTheme();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [refundCalculator, setRefundCalculator] = useState({
    subscriptionType: 'monthly',
    daysUsed: 0,
    totalAmount: 0
  });
  const [floatingCoins, setFloatingCoins] = useState([]);
  const [processStep, setProcessStep] = useState(0);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [satisfaction, setSatisfaction] = useState(5);

  useEffect(() => {
    // Initialize floating coins
    const coins = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      rotation: Math.random() * 360,
      delay: Math.random() * 3
    }));
    setFloatingCoins(coins);
  }, []);

  const refundScenarios = [
    {
      id: 'early-cancellation',
      title: '⏰ Early Cancellation',
      icon: Clock,
      timeframe: 'Within 7 days',
      refundRate: '100%',
      color: 'from-green-500 to-emerald-500',
      description: 'Full cosmic refund if you change your mind within the first week of your galactic journey.',
      conditions: [
        'Account created less than 7 days ago',
        'Minimal usage (less than 5 assessment sessions)',
        'No certification downloads',
        'Request submitted through cosmic portal'
      ],
      processing: '2-3 business days'
    },
    {
      id: 'technical-issues',
      title: '🔧 Technical Issues',
      icon: Shield,
      timeframe: 'Anytime',
      refundRate: '100%',
      color: 'from-blue-500 to-cyan-500',
      description: 'If our cosmic systems fail you, we make it right with a full refund.',
      conditions: [
        'Documented technical problems',
        'Unable to access core features for 48+ hours',
        'Platform downtime affecting learning',
        'Support team unable to resolve issues'
      ],
      processing: '1-2 business days'
    },
    {
      id: 'partial-refund',
      title: '📊 Partial Refund',
      icon: TrendingUp,
      timeframe: '8-30 days',
      refundRate: '50-75%',
      color: 'from-purple-500 to-pink-500',
      description: 'Pro-rated refunds based on your cosmic exploration usage.',
      conditions: [
        'Used platform for 8-30 days',
        'Completed less than 50% of purchased content',
        'Valid reason for discontinuation',
        'No policy violations'
      ],
      processing: '3-5 business days'
    },
    {
      id: 'no-refund',
      title: '🚫 No Refund',
      icon: XCircle,
      timeframe: 'After 30 days',
      refundRate: '0%',
      color: 'from-orange-500 to-red-500',
      description: 'After 30 days in our cosmic realm, your investment has fueled your growth.',
      conditions: [
        'Account active for 30+ days',
        'Significant platform usage',
        'Downloaded certificates or materials',
        'Completed assessments or courses'
      ],
      processing: 'N/A'
    }
  ];

  const refundProcess = [
    {
      step: 1,
      title: 'Request Submission',
      icon: Target,
      description: 'Submit your refund request through our cosmic portal',
      action: 'Fill out the stellar refund form'
    },
    {
      step: 2,
      title: 'Cosmic Review',
      icon: Star,
      description: 'Our cosmic council reviews your galactic journey',
      action: 'AI-powered assessment of your case'
    },
    {
      step: 3,
      title: 'Decision Phase',
      icon: Trophy,
      description: 'Approval decision based on cosmic refund laws',
      action: 'Automated decision or manual review'
    },
    {
      step: 4,
      title: 'Processing',
      icon: Zap,
      description: 'Refund processed through quantum payment channels',
      action: 'Credits return to your payment method'
    }
  ];

  const calculateRefund = () => {
    const { subscriptionType, daysUsed } = refundCalculator;
    const prices = { monthly: 29.99, quarterly: 79.99, yearly: 299.99 };
    const totalAmount = prices[subscriptionType];
    
    let refundPercentage = 0;
    if (daysUsed <= 7) refundPercentage = 100;
    else if (daysUsed <= 30) refundPercentage = Math.max(0, 100 - (daysUsed - 7) * 3);
    
    const refundAmount = (totalAmount * refundPercentage) / 100;
    return { totalAmount, refundAmount, refundPercentage };
  };

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
  };

  const nextProcessStep = () => {
    if (processStep < refundProcess.length - 1) {
      setProcessStep(processStep + 1);
    }
  };

  const { totalAmount, refundAmount, refundPercentage } = calculateRefund();

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-green-900 to-slate-900' 
        : 'bg-white'
    }`}>
      {/* Floating Coins */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingCoins.map(coin => (
          <motion.div
            key={coin.id}
            className={`absolute ${isDarkMode ? 'text-yellow-400/30' : 'text-yellow-500/40'}`}
            style={{
              left: `${coin.x}%`,
              top: `${coin.y}%`,
              fontSize: `${coin.size}px`
            }}
            animate={{
              y: [0, -50, 0],
              rotate: [coin.rotation, coin.rotation + 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: coin.delay,
              ease: "easeInOut"
            }}
          >
            <Coins />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent'
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
            Refund Policy
          </motion.h1>
          <motion.p 
            className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Fair cosmic refunds that honor your galactic investment journey
          </motion.p>
        </motion.div>

        {/* Refund Calculator */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            🧮 Cosmic Refund Calculator
          </motion.h2>
          
          <div className={`p-8 rounded-2xl backdrop-blur-xl border ${
            isDarkMode 
              ? 'bg-white/10 border-white/20' 
              : 'bg-white/90 border-gray-200'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Subscription Type
                  </label>
                  <select
                    value={refundCalculator.subscriptionType}
                    onChange={(e) => setRefundCalculator(prev => ({
                      ...prev,
                      subscriptionType: e.target.value
                    }))}
                    className={`w-full p-3 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    <option value="monthly">Monthly ($29.99)</option>
                    <option value="quarterly">Quarterly ($79.99)</option>
                    <option value="yearly">Yearly ($299.99)</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Days Used: {refundCalculator.daysUsed}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={refundCalculator.daysUsed}
                    onChange={(e) => setRefundCalculator(prev => ({
                      ...prev,
                      daysUsed: parseInt(e.target.value)
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 days</span>
                    <span>30 days</span>
                    <span>60 days</span>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' 
                  : 'bg-gradient-to-r from-green-100 to-emerald-100'
              }`}>
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex justify-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Original Amount
                    </p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      ${totalAmount.toFixed(2)}
                    </p>
                  </div>
                  
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Refund Amount
                    </p>
                    <p className={`text-3xl font-bold ${
                      refundPercentage > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ${refundAmount.toFixed(2)}
                    </p>
                    <p className={`text-sm ${
                      refundPercentage > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {refundPercentage}% Refund
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refund Scenarios */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            🌟 Refund Scenarios
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {refundScenarios.map((scenario, index) => {
              const IconComponent = scenario.icon;
              const isSelected = selectedScenario?.id === scenario.id;
              
              return (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl backdrop-blur-xl border cursor-pointer transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white/80 border-gray-200/50 hover:bg-white/90'
                  } ${isSelected ? 'ring-2 ring-green-500/50 shadow-lg' : ''}`}
                  onClick={() => handleScenarioClick(scenario)}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${scenario.color} flex items-center justify-center mb-4`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {scenario.title}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Timeframe:
                      </span>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {scenario.timeframe}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Refund:
                      </span>
                      <span className={`text-lg font-bold ${
                        scenario.refundRate === '100%' ? 'text-green-500' :
                        scenario.refundRate === '0%' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {scenario.refundRate}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Scenario Details */}
          <AnimatePresence>
            {selectedScenario && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-2xl backdrop-blur-xl border p-8 ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/90 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-6">
                  <motion.div
                    className={`p-4 rounded-xl bg-gradient-to-r ${selectedScenario.color}`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <selectedScenario.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {selectedScenario.title}
                    </h3>
                    <p className={`text-lg mb-6 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedScenario.description}
                    </p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className={`text-lg font-semibold mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Conditions:
                        </h4>
                        <ul className="space-y-2">
                          {selectedScenario.conditions.map((condition, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center space-x-2 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{condition}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className={`text-lg font-semibold mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Processing Time:
                        </h4>
                        <div className={`p-4 rounded-xl ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <Timer className="w-5 h-5 text-blue-500" />
                            <span className={`font-semibold ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {selectedScenario.processing}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refund Process */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            🔄 Refund Process Flow
          </motion.h2>
          
          <div className="relative">
            {refundProcess.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = index <= processStep;
              const isCurrent = index === processStep;
              
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className={`relative flex items-center mb-8 ${
                    index < refundProcess.length - 1 ? 'pb-8' : ''
                  }`}
                >
                  {/* Connection Line */}
                  {index < refundProcess.length - 1 && (
                    <motion.div
                      className={`absolute left-8 top-16 w-0.5 h-12 ${
                        isActive ? 'bg-green-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      animate={{
                        scaleY: isActive ? 1 : 0.3,
                        opacity: isActive ? 1 : 0.3
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  
                  {/* Step Circle */}
                  <motion.div
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${
                      isActive 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : isDarkMode 
                          ? 'bg-gray-700 text-gray-400' 
                          : 'bg-gray-200 text-gray-500'
                    }`}
                    animate={{
                      scale: isCurrent ? [1, 1.1, 1] : 1,
                      boxShadow: isCurrent 
                        ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 20px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0.4)']
                        : '0 0 0 0 rgba(34, 197, 94, 0)'
                    }}
                    transition={{ 
                      duration: isCurrent ? 2 : 0.5, 
                      repeat: isCurrent ? Infinity : 0 
                    }}
                  >
                    <IconComponent className="w-8 h-8" />
                  </motion.div>
                  
                  {/* Step Content */}
                  <div className="ml-6 flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      Step {step.step}: {step.title}
                    </h3>
                    <p className={`text-sm mb-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                    <p className={`text-sm font-semibold ${
                      isActive ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {step.action}
                    </p>
                  </div>
                  
                  {/* Next Button */}
                  {isCurrent && index < refundProcess.length - 1 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={nextProcessStep}
                      className="ml-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Next <ArrowRight className="w-4 h-4 ml-1 inline" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Satisfaction Survey */}
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className={`p-8 rounded-2xl backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30' 
              : 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200'
          }`}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
            >
              <Heart className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              💚 How satisfied are you with our refund policy?
            </h3>
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map(rating => (
                <motion.button
                  key={rating}
                  onClick={() => setSatisfaction(rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    rating <= satisfaction 
                      ? 'bg-yellow-500 text-white' 
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star className="w-6 h-6" />
                </motion.button>
              ))}
            </div>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {satisfaction === 5 ? "Absolutely stellar! 🌟" :
               satisfaction === 4 ? "Great cosmic policy! ✨" :
               satisfaction === 3 ? "Fair galactic terms 👍" :
               satisfaction === 2 ? "Could be more cosmic 🤔" :
               "Needs improvement 💫"}
            </p>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div 
          className="text-center mt-16 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Last updated: January 2024 | Governed by your steadfast trust ✨
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicy;
