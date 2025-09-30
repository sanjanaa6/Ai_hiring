import React, { useState, useEffect } from 'react';
import { Play, Volume2, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ttsService from '../services/ttsService';

const TTSTestPage = () => {
  const { isDarkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testText, setTestText] = useState('Hello, this is a test of the XTTS-v2 voice system. How does this sound?');
  const [healthStatus, setHealthStatus] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setAuthToken(token);
    
    // Load available voices
    loadVoices();
    
    // Test health endpoint
    testHealth();
  }, []);

  const loadVoices = () => {
    if ('speechSynthesis' in window) {
      // Load voices (may need to wait for them to load)
      const loadVoicesList = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        console.log('🎤 [TTS TEST] Available voices:', voices.map(v => v.name));
      };
      
      loadVoicesList();
      
      // Some browsers need this event to load voices
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoicesList;
      }
    }
  };

  const testHealth = async () => {
    try {
      const isHealthy = await ttsService.checkHealth();
      setHealthStatus(isHealthy ? 'healthy' : 'unhealthy');
    } catch (error) {
      setHealthStatus('error');
      console.error('Health check failed:', error);
    }
  };

  const handleTestTTS = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setIsPlaying(true);

    try {
      console.log('🧪 [TTS TEST] Starting TTS test...');
      console.log('🔑 [TTS TEST] Auth token:', authToken ? 'Present' : 'Missing');
      
      // Test Web Audio API support
      if (window.AudioContext || window.webkitAudioContext) {
        console.log('🎵 [TTS TEST] Web Audio API supported');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🎵 [TTS TEST] Audio context state:', audioContext.state);
        
        if (audioContext.state === 'suspended') {
          console.log('🎵 [TTS TEST] Audio context suspended, resuming...');
          await audioContext.resume();
          console.log('🎵 [TTS TEST] Audio context resumed, new state:', audioContext.state);
        }
      } else {
        console.log('🎵 [TTS TEST] Web Audio API not supported');
      }
      
      await ttsService.speak(testText, {
        language: 'en',
        speed: 0.9,
        pitch: 1.0,
        emotion: 'neutral'
      });

      setSuccess('TTS test completed successfully!');
      console.log('✅ [TTS TEST] TTS test completed');
      
    } catch (error) {
      console.error('❌ [TTS TEST] TTS test failed:', error);
      setError(`TTS test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleTestBrowserTTS = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsPlaying(false);
        setError('Browser TTS failed');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setError('Browser speech synthesis not supported');
    }
  };

  const getHealthStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return 'text-green-500';
      case 'unhealthy': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthStatusText = () => {
    switch (healthStatus) {
      case 'healthy': return 'TTS Service is Healthy';
      case 'unhealthy': return 'TTS Service is Unhealthy';
      case 'error': return 'TTS Service Connection Error';
      default: return 'Checking TTS Service...';
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Volume2 className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold">TTS Service Test Page</h1>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={`w-5 h-5 ${getHealthStatusColor()}`} />
              <h3 className="font-semibold">Service Health</h3>
            </div>
            <p className={`text-sm ${getHealthStatusColor()}`}>{getHealthStatusText()}</p>
            <button
              onClick={testHealth}
              className="mt-2 text-xs text-blue-500 hover:text-blue-600"
            >
              Refresh Status
            </button>
          </div>

          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Authentication</h3>
            </div>
            <p className={`text-sm ${authToken ? 'text-green-500' : 'text-red-500'}`}>
              {authToken ? 'User is logged in' : 'User is not logged in'}
            </p>
            {!authToken && (
              <p className="text-xs text-gray-500 mt-1">
                Please login to test TTS service
              </p>
            )}
          </div>
        </div>

        {/* Test Interface */}
        <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-lg font-semibold mb-4">Test TTS Service</h2>
          
          <div className="space-y-4">
            {/* Test Text Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Test Text</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
                rows={3}
                placeholder="Enter text to test TTS..."
              />
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Available Voices ({availableVoices.length})</label>
              <select
                value={selectedVoice || ''}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="">Auto-select best voice</option>
                {availableVoices.map((voice, index) => (
                  <option key={index} value={voice.name}>
                    {voice.name} ({voice.lang}) {voice.default ? '- Default' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleTestTTS}
                disabled={isLoading || !testText.trim() || !authToken}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLoading || !testText.trim() || !authToken
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isLoading && isPlaying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Test XTTS-v2
                  </>
                )}
              </button>

              <button
                onClick={handleTestBrowserTTS}
                disabled={isPlaying}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                    : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Volume2 className="w-4 h-4" />
                Test Browser TTS
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            {/* Debug Information */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-medium mb-2">Debug Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
                <p><strong>Auth Token:</strong> {authToken ? 'Present' : 'Missing'}</p>
                <p><strong>Health Status:</strong> {healthStatus || 'Unknown'}</p>
                <p><strong>Browser TTS:</strong> {'speechSynthesis' in window ? 'Supported' : 'Not Supported'}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Make sure you are logged in to test the XTTS-v2 service</li>
                <li>• Check that the backend server is running on port 5000</li>
                <li>• Use "Test Browser TTS" to compare with the old voice</li>
                <li>• Check the browser console for detailed logs</li>
                <li>• If XTTS-v2 fails, it should fallback to browser TTS in interviews</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTSTestPage;
