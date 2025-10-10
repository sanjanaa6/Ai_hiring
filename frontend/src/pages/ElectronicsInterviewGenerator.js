import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import electronicsInterviewService from '../services/electronicsInterviewService';

const ElectronicsInterviewGenerator = ({ isDarkMode = true }) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('electronics_engineer');

  const interviewTypes = electronicsInterviewService.getElectronicsInterviewTypes();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const interview = await electronicsInterviewService.generateElectronicsInterview(prompt);
      console.log('✅ [ELECTRONICS GENERATOR] Interview generated:', interview);
      
      // Navigate to the interview
      navigate(`/interview/${interview.interviewId}`);
    } catch (error) {
      console.error('❌ [ELECTRONICS GENERATOR] Error:', error);
      setError(error.message || 'Failed to generate electronics interview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    const typeInfo = interviewTypes.find(t => t.type === type);
    if (typeInfo) {
      setPrompt(electronicsInterviewService.generateElectronicsPromptTemplate(
        typeInfo.name,
        'Your Company',
        'Electronics engineering requirements'
      ));
    }
  };

  const handleTemplateSelect = (template) => {
    setPrompt(template);
  };

  const templates = [
    {
      name: 'Senior Electronics Engineer',
      prompt: `Create an electronics interview for a Senior Electronics Engineer position.

Job Title: Senior Electronics Engineer
Company: TechCorp Electronics
Requirements: 
- 5+ years experience in electronics design
- Proficiency in PCB design tools (Altium, KiCad)
- Experience with analog and digital circuit design
- Knowledge of embedded systems and microcontrollers
- Strong problem-solving and troubleshooting skills

The interview should include hands-on PCB design challenges and practical electronics problems.`
    },
    {
      name: 'Embedded Systems Engineer',
      prompt: `Create an electronics interview for an Embedded Systems Engineer position.

Job Title: Embedded Systems Engineer
Company: IoT Solutions Inc
Requirements:
- 3+ years experience in embedded systems development
- Proficiency in C/C++ programming
- Experience with microcontrollers (ARM, AVR, PIC)
- Knowledge of real-time operating systems
- PCB design and hardware debugging skills

The interview should focus on firmware development, hardware-software integration, and PCB design for embedded systems.`
    },
    {
      name: 'Hardware Design Engineer',
      prompt: `Create an electronics interview for a Hardware Design Engineer position.

Job Title: Hardware Design Engineer
Company: Advanced Electronics Ltd
Requirements:
- 4+ years experience in hardware design
- Expertise in PCB layout and design
- Knowledge of component selection and specifications
- Experience with signal integrity and EMC
- Proficiency in simulation tools

The interview should emphasize PCB design, component selection, and hardware testing methodologies.`
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Generate Electronics Interview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create a comprehensive electronics interview with mandatory PCB design round
            </p>
          </div>

          {/* Interview Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Interview Type:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interviewTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => handleTypeChange(type.type)}
                  className={`p-4 text-left rounded-lg border-2 transition-colors ${
                    selectedType === type.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {type.description}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    {type.pcbRequired ? 'Includes PCB Design Round' : 'No PCB Round'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Templates */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Templates:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(template.prompt)}
                  className="p-3 text-left rounded-lg border border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {template.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Job Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description & Requirements:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter detailed job description, requirements, and any specific focus areas for the electronics interview..."
              className="w-full p-4 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`px-8 py-3 rounded-md font-medium transition-colors ${
                isGenerating || !prompt.trim()
                  ? 'bg-gray-300 dark:bg-zinc-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Electronics Interview...
                </div>
              ) : (
                'Generate Electronics Interview'
              )}
            </button>
          </div>

          {/* Features Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Electronics Interview Features:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• <strong>6 Comprehensive Rounds:</strong> Fundamentals, Components, Circuit Design, PCB Design, Testing, and Project Experience</li>
              <li>• <strong>Mandatory PCB Round:</strong> Interactive PCB design challenges with component placement and routing</li>
              <li>• <strong>Hands-on Challenges:</strong> Real-world electronics problems and practical scenarios</li>
              <li>• <strong>Component Knowledge:</strong> Testing understanding of electronic components and specifications</li>
              <li>• <strong>Circuit Analysis:</strong> Problem-solving with circuit design and analysis</li>
              <li>• <strong>Troubleshooting:</strong> Practical testing and debugging scenarios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectronicsInterviewGenerator;
