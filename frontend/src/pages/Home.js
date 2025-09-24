import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  Users, 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Matching",
      description: "Our advanced AI algorithms match the right candidates with the right jobs based on skills, experience, and cultural fit."
    },
    {
      icon: <Target className="h-8 w-8 text-green-600" />,
      title: "Smart Screening",
      description: "Automated resume screening and initial assessments help you find the best candidates faster."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Talent Pool",
      description: "Access to a diverse pool of qualified candidates across various industries and experience levels."
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Jobs" },
    { number: "50K+", label: "Candidates" },
    { number: "500+", label: "Companies" },
    { number: "95%", label: "Success Rate" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Your Dream Job with AI
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Connect with top companies and discover opportunities that match your skills and aspirations. 
            Our AI-powered platform makes job hunting smarter and more efficient.
          </p>
          
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="btn bg-white text-blue-600 hover:bg-gray-100">
                Go to Dashboard
              </Link>
              <Link to="/jobs" className="btn btn-outline border-white text-white hover:bg-white hover:text-blue-600">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn bg-white text-blue-600 hover:bg-gray-100">
                Get Started
              </Link>
              <Link to="/jobs" className="btn btn-outline border-white text-white hover:bg-white hover:text-blue-600">
                Browse Jobs
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="p-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose AI Hiring?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We leverage cutting-edge AI technology to revolutionize the hiring process for both candidates and recruiters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to find your perfect match
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Profile</h3>
              <p className="text-gray-600">
                Sign up and create your professional profile with your skills, experience, and preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes your profile and matches you with relevant job opportunities.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Apply & Connect</h3>
              <p className="text-gray-600">
                Apply to jobs that interest you and connect directly with recruiters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Interview Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Try Our AI Interview System
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Experience our AI-powered multi-round interview system. Create role-specific interviews and share links with candidates.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-semibold mb-4">How It Works:</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">1</div>
                <h4 className="font-semibold mb-2">Create Job</h4>
                <p className="text-sm">Enter job details and requirements. AI generates 6+ interview rounds tailored to the role.</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">2</div>
                <h4 className="font-semibold mb-2">Share Link</h4>
                <p className="text-sm">Get a shareable interview link that anyone can use to take the AI-conducted interview.</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-3xl font-bold mb-2">3</div>
                <h4 className="font-semibold mb-2">AI Conducts</h4>
                <p className="text-sm">AI asks questions, evaluates responses, and provides detailed feedback to recruiters.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-purple-600 hover:bg-gray-100">
              Create Your First Interview
            </Link>
            <Link to="/dynamic-interview-demo" className="btn btn-outline border-white text-white hover:bg-white hover:text-purple-600">
              Try Dynamic Interviews
            </Link>
            <Link to="/openrouter-test" className="btn btn-outline border-white text-white hover:bg-white hover:text-purple-600">
              Test AI Integration
            </Link>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream jobs through our platform.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn bg-blue-600 text-white hover:bg-blue-700">
                Sign Up Now
              </Link>
              <Link to="/login" className="btn btn-outline border-white text-white hover:bg-white hover:text-gray-900">
                Login
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
