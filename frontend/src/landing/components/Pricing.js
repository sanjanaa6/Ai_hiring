import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, X, Star, Zap } from 'lucide-react';

const Pricing = () => {
  const { isDarkMode } = useTheme();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        "Up to 50 interviews/month",
        "Basic AI analysis",
        "Email support",
        "Standard templates",
        "Basic analytics"
      ],
      limitations: [
        "No custom branding",
        "Limited integrations",
        "Basic reporting"
      ],
      popular: false,
      color: "border-gray-200"
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
        "Custom templates",
        "Advanced analytics",
        "Team collaboration",
        "API access",
        "Custom branding"
      ],
      limitations: [
        "Limited custom integrations"
      ],
      popular: true,
      color: "border-blue-500"
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
        "Full API access",
        "White-label solution",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee"
      ],
      limitations: [],
      popular: false,
      color: "border-purple-500"
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

  return (
    <section id="pricing" className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Simple, Transparent Pricing
          </h2>
          <p className={`text-xl max-w-3xl mx-auto mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Choose the plan that fits your needs. All plans include our core AI interview features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-lg transition-colors duration-300 ${
              !isAnnual 
                ? (isDarkMode ? 'text-white font-semibold' : 'text-gray-900 font-semibold')
                : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
            }`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg transition-colors duration-300 ${
              isAnnual 
                ? (isDarkMode ? 'text-white font-semibold' : 'text-gray-900 font-semibold')
                : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
            }`}>
              Annual
            </span>
            {isAnnual && (
              <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } ${plan.color} ${
                plan.popular ? 'scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{plan.name}</h3>
                <p className={`mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{plan.description}</p>
                <div className="mb-4">
                  <span className={`text-4xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>/{isAnnual ? 'year' : 'month'}</span>
                </div>
                {isAnnual && (
                  <div className="text-sm text-green-600 font-semibold">
                    Save ${(plan.monthlyPrice * 12) - plan.annualPrice}/year
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, limitIndex) => (
                  <div key={limitIndex} className="flex items-center opacity-60">
                    <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-500">{limitation}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Add-ons & Extensions
            </h3>
            <p className="text-gray-600">
              Enhance your plan with additional features and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">{addon.name}</h4>
                <p className="text-gray-600 text-sm mb-3">{addon.description}</p>
                <div className="text-blue-600 font-semibold">{addon.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Can I change my plan anytime?
                </h4>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h4>
                <p className="text-gray-600">
                  Yes, all plans come with a 14-day free trial. No credit card required.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  What happens if I exceed my interview limit?
                </h4>
                <p className="text-gray-600">
                  You can purchase additional interviews at $2 each, or upgrade to a higher plan.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Do you offer custom enterprise solutions?
                </h4>
                <p className="text-gray-600">
                  Yes, we offer fully customized solutions for large organizations. Contact our sales team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of companies already using AI Hiring to find better candidates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
