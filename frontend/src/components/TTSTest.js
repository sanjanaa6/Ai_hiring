import React, { useState } from 'react';
import { Play, Volume2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ttsService from '../services/ttsService';

const TTSTest = () => {
  const { isDarkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testText, setTestText] = useState('Hello, this is a test of the XTTS-v2 voice system. How does this sound?');

  const handleTestTTS = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setIsPlaying(true);

    try {
      console.log('🧪 [TTS TEST] Starting TTS test...');
      
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

  const handleHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isHealthy = await ttsService.checkHealth();
      if (isHealthy) {
        setSuccess('TTS service is healthy and ready!');
      } else {
        setError('TTS service is not responding properly');
      }
    } catch (error) {
      setError(`Health check failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">TTS Service Test</h3>
      </div>

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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTestTTS}
            disabled={isLoading || !testText.trim()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isLoading || !testText.trim()
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
                Test TTS
              </>
            )}
          </button>

          <button
            onClick={handleHealthCheck}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CheckCircle className="w-4 h-4" />
            Health Check
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

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Health Check" to verify the TTS service is running</li>
            <li>• Enter custom text or use the default test message</li>
            <li>• Click "Test TTS" to hear the generated speech</li>
            <li>• Check the browser console for detailed logs</li>
            <li>• If TTS fails, it will fallback to browser speech synthesis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TTSTest;
