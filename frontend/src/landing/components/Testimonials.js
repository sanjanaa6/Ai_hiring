import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const Testimonials = () => {
  const { isDarkMode } = useTheme();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
      content: "AI Hiring has completely transformed our recruitment process. We've reduced our time-to-hire by 65% and the quality of candidates has significantly improved. The AI interviews are so natural that candidates often forget they're talking to a machine.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "StartupXYZ",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "As a startup, we needed to scale our hiring quickly without compromising quality. AI Hiring allowed us to interview 10x more candidates while maintaining high standards. The detailed reports help us make data-driven hiring decisions.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Talent Acquisition Manager",
      company: "GlobalTech",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "The bias-free assessment feature is a game-changer. We've seen a 40% increase in diverse hires since implementing AI Hiring. The platform helps us focus on skills and potential rather than unconscious biases.",
      rating: 5
    },
    {
      name: "David Thompson",
      role: "VP of Engineering",
      company: "InnovateLab",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      content: "The technical assessment capabilities are outstanding. AI Hiring accurately evaluates coding skills, problem-solving abilities, and technical communication. We've hired some of our best engineers through this platform.",
      rating: 5
    },
    {
      name: "Lisa Wang",
      role: "Head of People",
      company: "ScaleUp Inc",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80",
      content: "The analytics dashboard provides incredible insights into our hiring funnel. We can now identify bottlenecks, optimize our process, and make strategic decisions based on real data. ROI has been exceptional.",
      rating: 5
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentTestimonial];

  return (
    <section id="testimonials" className={`py-20 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            What Our Customers Say
          </h2>
          <p className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Join thousands of companies that have transformed their hiring with AI Hiring
          </p>
        </div>

        {/* Main Testimonial */}
        <div className={`rounded-3xl p-8 md:p-12 relative overflow-hidden transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-700' 
            : 'bg-gradient-to-br from-blue-50 to-indigo-50'
        }`}>
          {/* Background Quote Icon */}
          <div className="absolute top-8 right-8 text-blue-100">
            <Quote className="w-24 h-24" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              {/* Testimonial Content */}
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className={`text-xl md:text-2xl leading-relaxed mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "{current.content}"
                </blockquote>
                <div className="flex items-center">
                  <img
                    src={current.image}
                    alt={current.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {current.name}
                    </div>
                    <div className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                      {current.role} at {current.company}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex flex-col space-y-4">
                <button
                  onClick={nextTestimonial}
                  className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
                <button
                  onClick={prevTestimonial}
                  className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Indicators */}
        <div className="flex justify-center space-x-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
            <div className="text-gray-600">Companies Trust Us</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
            <div className="text-gray-600">Interviews Conducted</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">70%</div>
            <div className="text-gray-600">Faster Time-to-Hire</div>
          </div>
        </div>

        {/* Company Logos */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <p className="text-gray-600">Trusted by leading companies worldwide</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
            {['TechCorp', 'StartupXYZ', 'GlobalTech', 'InnovateLab', 'ScaleUp Inc'].map((company, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center mx-auto">
                  <span className="text-gray-600 font-semibold text-sm">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
