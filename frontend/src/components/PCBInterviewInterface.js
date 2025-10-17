import React, { useState, useEffect, useCallback } from 'react';

const PCBInterviewInterface = ({
  question,
  interviewId,
  roundId,
  candidateInfo,
  onAnswerSubmit,
  onNextQuestion,
  isDarkMode = true,
  timeLimit = 6
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert minutes to seconds
  const [answer, setAnswer] = useState('');
  const [pcbDesignData, setPcbDesignData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Reset state when question changes
  useEffect(() => {
    setIsSubmitted(false);
    setTimeLeft(timeLimit * 60);
    setAnswer('');
    setPcbDesignData(null);
    setUploadedFileName('');
    setUploadError('');
  }, [question, timeLimit]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    
    const designData = {
      designNotes: answer || 'No explanation provided',
      timeSpent: (timeLimit * 60) - timeLeft,
      submittedAt: new Date().toISOString(),
      pcbDesignData: pcbDesignData || null
    };
    
    console.log('📤 PCB Design Data being submitted:', designData);
    
    if (onAnswerSubmit) {
      onAnswerSubmit(designData);
    }
  }, [isSubmitted, answer, timeLimit, timeLeft, pcbDesignData, onAnswerSubmit]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      // Auto-submit when time runs out
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, handleSubmit]);

  // Handle next question
  const handleNextQuestion = () => {
    if (onNextQuestion) {
      onNextQuestion();
    }
  };

  // Handle PCB app navigation
  const handleOpenPCBApp = () => {
    // Open internal PCB app in new tab
    // Use environment variable or default to localhost
    const pcbUrl = process.env.REACT_APP_PCB_URL || 'http://localhost:3001';
    
    // Pass interview context to PCB app
    const queryParams = new URLSearchParams({
      interviewId: interviewId || '',
      roundId: roundId || '',
      questionId: question?.id || question?._id || '',
      duration: timeLimit || 6,
      candidateId: candidateInfo?.id || candidateInfo?._id || '',
      candidateName: candidateInfo?.name || '',
      candidateEmail: candidateInfo?.email || '',
      mode: 'interview'
    });
    
    console.log('🔧 [PCB] Opening PCB app with params:', {
      interviewId,
      roundId,
      questionId: question?.id || question?._id,
      candidateId: candidateInfo?.id || candidateInfo?._id
    });
    
    const fullUrl = `${pcbUrl}?${queryParams.toString()}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle JSON file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setUploadError('Please upload a valid JSON file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setPcbDesignData(jsonData);
        setUploadedFileName(file.name);
        setUploadError('');
      } catch (error) {
        setUploadError('Invalid JSON file. Please check the file format.');
        setPcbDesignData(null);
        setUploadedFileName('');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setPcbDesignData(null);
    setUploadedFileName('');
    setUploadError('');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Professional Header */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                PCB Design Assessment
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Time Remaining: <span className="font-medium">{formatTime(timeLeft)}</span>
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isSubmitted 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {isSubmitted ? 'Submitted' : 'In Progress'}
                </span>
              </div>
            </div>
            <div>
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Submit Design
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Question & Tool */}
          <div className="space-y-6">
            {/* Question Card */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Question
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {question?.question || 'Design a simple voltage divider circuit and explain how to calculate the output voltage.'}
                  </p>
                </div>
              </div>
              
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Requirements:
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                  {question?.expectedAnswer || 'Look for proper circuit design, calculation methods, and understanding of loading effects.'}
                </p>
              </div>
            </div>

            {/* PCB Tool Card */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    PCB Design Tool
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click the button below to open the professional PCB design interface in a new tab. 
                    Use the tool to create your circuit design, then return here to submit your explanation.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleOpenPCBApp}
                className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open PCB Design Tool
              </button>
            </div>

            {/* JSON Upload Card */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Upload Design JSON
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Export your PCB design as JSON from the tool and upload it here for review.
                  </p>
                </div>
              </div>

              {/* Upload Area */}
              {!uploadedFileName ? (
                <div className="mt-4">
                  <label className={`block w-full cursor-pointer`}>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDarkMode 
                        ? 'border-slate-600 hover:border-slate-500 bg-slate-900/50' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}>
                      <svg className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Click to upload or drag and drop
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        JSON files only (max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isSubmitted}
                    />
                  </label>
                </div>
              ) : (
                <div className={`mt-4 p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-emerald-900/20 border-emerald-700' 
                    : 'bg-emerald-50 border-emerald-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                          {uploadedFileName}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          Design JSON uploaded successfully
                        </p>
                      </div>
                    </div>
                    {!isSubmitted && (
                      <button
                        onClick={handleRemoveFile}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-red-900/30 text-red-400' 
                            : 'hover:bg-red-100 text-red-600'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className={`mt-3 p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-red-900/20 border border-red-700' 
                    : 'bg-red-50 border border-red-300'
                }`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                    {uploadError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Design Explanation */}
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6 h-fit`}>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Design Explanation
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  After completing your PCB design in the tool above, explain your design choices, 
                  component selection rationale, and any design considerations here.
                </p>
              </div>
            </div>
            
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain your PCB design choices, component selection rationale, and any design considerations..."
              className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDarkMode 
                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              rows={16}
              disabled={isSubmitted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCBInterviewInterface;
