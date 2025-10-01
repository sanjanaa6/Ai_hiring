import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import CodingChallengeGenerator from '../components/CodingChallengeGenerator';
import SuperCoolCodeEditor from '../components/SuperCoolCodeEditor';
import { 
  Code2, 
  Play, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

const CodingChallengePage = () => {
  const { isDarkMode } = useTheme();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChallengeList, setShowChallengeList] = useState(true);

  const handleChallengeSelect = (challenge) => {
    setSelectedChallenge(challenge);
    setCode(challenge.starterCode);
    setTestResults([]);
    setShowChallengeList(false);
  };

  const handleBackToList = () => {
    setShowChallengeList(true);
    setSelectedChallenge(null);
    setCode('');
    setTestResults([]);
  };

  const handleTestResults = (results) => {
    setTestResults(results);
  };

  const getTestStats = () => {
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { passed, total, percentage };
  };

  const stats = getTestStats();

  if (showChallengeList) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Coding Challenges
              </h1>
            </div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Practice coding with real test cases and get instant feedback
            </p>
          </div>
          
          <div className={`max-w-6xl mx-auto ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-md border border-white/10' 
              : 'bg-white/80 backdrop-blur-md border border-gray-200'
          } rounded-2xl shadow-2xl overflow-hidden`}>
            <CodingChallengeGenerator onChallengeSelect={handleChallengeSelect} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100'
    }`}>
      
      {/* Header */}
      <div className={`flex-shrink-0 backdrop-blur-md border-b px-6 py-4 ${
        isDarkMode 
          ? 'bg-black/30 border-white/10' 
          : 'bg-white/90 border-blue-200 shadow-lg'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToList}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isDarkMode
                  ? 'hover:bg-slate-700/50 text-slate-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Challenges</span>
            </button>
            
            <div className={`h-6 w-px ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`} />
            
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedChallenge?.title}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedChallenge?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Test Results Summary */}
            {testResults.length > 0 && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                stats.percentage === 100 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : stats.percentage > 0
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {stats.percentage === 100 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold">
                  {stats.passed}/{stats.total} Tests Passed
                </span>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'hover:bg-slate-700/50 text-slate-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <SuperCoolCodeEditor
          language="javascript"
          starterCode={selectedChallenge?.starterCode || ''}
          testCases={selectedChallenge?.testCases || []}
          question={selectedChallenge?.description || ''}
          onCodeChange={setCode}
          disabled={false}
          isFullScreen={isFullscreen}
          onToggleFullScreen={() => setIsFullscreen(!isFullscreen)}
          sessionId="coding-challenge"
          languageLocked={false}
        />
      </div>
    </div>
  );
};

export default CodingChallengePage;
