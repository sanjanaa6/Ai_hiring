import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Code, 
  Lock, 
  Globe, 
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react';

const DynamicInterviewDemo = () => {
  const [selectedExample, setSelectedExample] = useState(null);

  const examples = [
    {
      id: 'react',
      title: 'React Developer',
      description: 'Frontend React Developer with modern frameworks',
      prompt: 'React Developer for SaaS company, Next.js/TypeScript skills, San Francisco, full-time, modern frontend development',
      language: 'jsx',
      icon: '⚛️',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      features: ['React/JSX syntax', 'Component architecture', 'Hooks and state management', 'Jest/React Testing Library']
    },
    {
      id: 'typescript',
      title: 'TypeScript Developer',
      description: 'Full-stack TypeScript Developer',
      prompt: 'TypeScript Developer with React/Angular experience, Node.js backend, $85k-125k, 2+ years experience',
      language: 'typescript',
      icon: '🔷',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      features: ['Type safety', 'Interface definitions', 'Generic types', 'Modern TypeScript features']
    },
    {
      id: 'python',
      title: 'Python Developer',
      description: 'Senior Python Developer with Django/Flask experience',
      prompt: 'Senior Python Developer at a fintech startup, Django/Flask experience, data science background, $90k-130k, 3+ years experience',
      language: 'python',
      icon: '🐍',
      color: 'bg-green-100 text-green-800 border-green-300',
      features: ['Django/Flask frameworks', 'Data science questions', 'Python-specific algorithms', 'Pytest testing']
    },
    {
      id: 'java',
      title: 'Java Developer',
      description: 'Enterprise Java Developer with Spring Boot',
      prompt: 'Java Developer at enterprise company, Spring Boot/Microservices, $80k-120k, 2+ years experience, cloud deployment',
      language: 'java',
      icon: '☕',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      features: ['Spring Boot framework', 'Microservices architecture', 'JVM optimization', 'JUnit testing']
    },
    {
      id: 'csharp',
      title: 'C# Developer',
      description: '.NET Developer with Azure experience',
      prompt: 'C# Developer for .NET applications, Azure/Entity Framework, remote work, $85k-125k, enterprise development',
      language: 'csharp',
      icon: '🔷',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      features: ['.NET Core framework', 'Azure cloud services', 'Entity Framework', 'NUnit testing']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Dynamic Interview System</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create language-specific interviews that automatically adapt to the programming language and role you're hiring for.
            The AI detects the language from your prompt and locks the code editor to that specific syntax.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Language Detection</h3>
              <p className="text-gray-600">
                AI automatically detects the programming language from your job description prompt using advanced keyword analysis.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Dynamic Generation</h3>
              <p className="text-gray-600">
                Creates role-specific interview questions, coding challenges, and test cases tailored to the detected language.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Language Lock</h3>
              <p className="text-gray-600">
                Code editor is automatically locked to the detected language syntax, ensuring candidates use the correct language.
              </p>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Try These Examples</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {examples.map((example) => (
              <div
                key={example.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all cursor-pointer ${
                  selectedExample === example.id 
                    ? 'border-purple-500 shadow-xl' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedExample(example.id)}
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{example.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{example.title}</h3>
                    <p className="text-gray-600 text-sm">{example.description}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${example.color}`}>
                    {example.language.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {example.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Example Prompt:</p>
                  <p className="text-sm text-gray-700 italic">"{example.prompt}"</p>
                </div>

                {selectedExample === example.id && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-purple-900">Ready to Test!</h4>
                        <p className="text-sm text-purple-700">This will create a {example.language} interview with locked code editor.</p>
                      </div>
                      <Link
                        to="/dynamic-interview"
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Zap className="h-4 w-4" />
                        <span>Try It</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Benefits of Dynamic Interviews</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">For Recruiters</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Automatic language detection saves time</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Role-specific questions and challenges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Consistent evaluation across candidates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Framework and tool-specific assessments</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">For Candidates</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Clear language requirements upfront</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Relevant technical challenges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">No confusion about which language to use</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-700">Fair assessment of actual skills</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/dynamic-interview"
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-6 w-6" />
            <span>Create Your First Dynamic Interview</span>
            <ArrowRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DynamicInterviewDemo;
