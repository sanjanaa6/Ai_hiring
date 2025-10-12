import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import useGoogleSTT from '../hooks/useGoogleSTT';
import sttService from '../services/sttService';

const STTTestPage = () => {
  const { isDarkMode } = useTheme();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [audioFile, setAudioFile] = useState(null);

  const {
    isRecording,
    transcription,
    interimTranscription,
    isTranscribing,
    error,
    confidence,
    startRecording,
    stopRecording,
    clearTranscription,
    transcribeFile,
    checkHealth,
    getSupportedLanguages
  } = useGoogleSTT({
    language: selectedLanguage,
    enablePunctuation: true,
    model: 'default',
    useEnhanced: true,
    onTranscription: (transcript, conf) => {
      console.log('📝 New transcription:', transcript, 'Confidence:', conf);
    },
    onError: (err) => {
      console.error('❌ STT Error:', err);
    }
  });

  useEffect(() => {
    loadSupportedLanguages();
    checkSTTHealth();
  }, []);

  const loadSupportedLanguages = async () => {
    try {
      const result = await getSupportedLanguages();
      if (result.success) {
        setSupportedLanguages(result.data);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const checkSTTHealth = async () => {
    try {
      const health = await checkHealth();
      console.log('STT Health:', health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleTranscribeFile = async () => {
    if (!audioFile) return;

    try {
      setIsLoading(true);
      const result = await transcribeFile(audioFile);
      
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'file',
        fileName: audioFile.name,
        transcript: result.transcript || 'No transcript',
        confidence: result.confidence || 0,
        success: result.success,
        error: result.error,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('File transcription failed:', error);
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'file',
        fileName: audioFile.name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSTT = async () => {
    if (!audioFile) return;

    try {
      setIsLoading(true);
      const result = await sttService.testSTT(audioFile);
      
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'test',
        fileName: audioFile.name,
        transcript: result.data?.transcript || 'No transcript',
        confidence: result.data?.confidence || 0,
        success: result.success,
        error: result.error,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('STT test failed:', error);
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'test',
        fileName: audioFile.name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    clearTranscription();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Google Speech-to-Text Test</h1>

        {/* Language Selection */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-4">Language Settings</h2>
          <div className="flex items-center gap-4">
            <label className="font-medium">Language:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={`px-3 py-2 rounded border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Recording Test */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-4">Live Recording Test</h2>
          
          <div className="flex items-center gap-4 mb-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  isTranscribing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                {isTranscribing ? 'Processing...' : '🎤 Start Recording'}
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
              >
                🛑 Stop Recording
              </button>
            )}

            <button
              onClick={clearTranscription}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Clear
            </button>
          </div>

          <div className={`p-4 rounded border-2 ${
            isRecording 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="mb-2">
              <strong>Final Transcription:</strong>
              <p className={`mt-1 ${transcription ? 'text-gray-800' : 'text-gray-500 italic'}`}>
                {transcription || 'No transcription yet...'}
              </p>
            </div>
            
            {interimTranscription && (
              <div>
                <strong>Live Transcription:</strong>
                <p className="mt-1 text-blue-600 italic">{interimTranscription}</p>
              </div>
            )}

            {confidence > 0 && (
              <div className="mt-2">
                <strong>Confidence:</strong> {Math.round(confidence * 100)}%
              </div>
            )}

            {isRecording && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600">Recording...</span>
              </div>
            )}

            {isTranscribing && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600">Processing...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
        </div>

        {/* File Upload Test */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h2 className="text-xl font-semibold mb-4">File Upload Test</h2>
          
          <div className="mb-4">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="mb-4"
            />
            {audioFile && (
              <p className="text-sm text-gray-600">
                Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleTranscribeFile}
              disabled={!audioFile || isLoading}
              className={`px-4 py-2 rounded ${
                !audioFile || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isLoading ? 'Processing...' : 'Transcribe File'}
            </button>

            <button
              onClick={handleTestSTT}
              disabled={!audioFile || isLoading}
              className={`px-4 py-2 rounded ${
                !audioFile || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isLoading ? 'Testing...' : 'Test STT Service'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              Clear Results
            </button>
          </div>

          {testResults.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet. Try recording or uploading an audio file.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded border ${
                    result.success
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.type === 'file' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {result.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.fileName && (
                    <p className="text-sm font-medium mb-1">File: {result.fileName}</p>
                  )}
                  
                  {result.success ? (
                    <div>
                      <p className="text-sm mb-1">
                        <strong>Transcript:</strong> {result.transcript}
                      </p>
                      {result.confidence > 0 && (
                        <p className="text-sm">
                          <strong>Confidence:</strong> {Math.round(result.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      <strong>Error:</strong> {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default STTTestPage;
