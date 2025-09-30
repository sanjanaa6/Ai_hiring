import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Volume2, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ttsService from '../services/ttsService';

const VoiceCloningSettings = ({ onVoiceChange, currentVoice = 'default' }) => {
  const { isDarkMode } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    emotion: 'neutral'
  });
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Load supported languages on component mount
  React.useEffect(() => {
    loadSupportedLanguages();
  }, []);

  const loadSupportedLanguages = async () => {
    try {
      const languages = await ttsService.getSupportedLanguages();
      setSupportedLanguages(languages);
    } catch (error) {
      console.error('Failed to load supported languages:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/flac'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid audio file (WAV, MP3, M4A, or FLAC)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      setError(null);
      setSuccess(null);
    }
  };

  const handlePlayReference = () => {
    if (uploadedFile && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTestVoice = async () => {
    if (!uploadedFile) {
      setError('Please upload a reference audio file first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const testText = "Hello, this is a test of the voice cloning feature. How does this sound?";
      
      await ttsService.speakCloned(testText, uploadedFile, {
        language: selectedLanguage,
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch
      });

      setSuccess('Voice cloning test completed successfully!');
      onVoiceChange('cloned', { file: uploadedFile, settings: voiceSettings });
      
    } catch (error) {
      console.error('Voice cloning test failed:', error);
      setError(`Voice cloning test failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseDefaultVoice = () => {
    setUploadedFile(null);
    setError(null);
    setSuccess(null);
    onVoiceChange('default', null);
  };

  const handleSettingsChange = (key, value) => {
    setVoiceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Voice Cloning Settings</h3>
      </div>

      {/* Current Voice Status */}
      <div className="mb-6">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">
              Current Voice: {currentVoice === 'cloned' ? 'Custom Cloned Voice' : 'Default AI Voice'}
            </span>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Reference Audio File</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".wav,.mp3,.m4a,.flac,audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Audio'}
          </button>
          
          {uploadedFile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{uploadedFile.name}</span>
              <button
                onClick={handlePlayReference}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
        
        {uploadedFile && (
          <audio
            ref={audioRef}
            src={URL.createObjectURL(uploadedFile)}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </div>

      {/* Language Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Language</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-700'
          }`}
        >
          {supportedLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Settings */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Voice Settings</label>
        
        <div className="space-y-4">
          {/* Speed */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Speed: {voiceSettings.speed}x</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.speed}
              onChange={(e) => handleSettingsChange('speed', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Pitch: {voiceSettings.pitch}</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) => handleSettingsChange('pitch', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleTestVoice}
          disabled={!uploadedFile || isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            !uploadedFile || isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              Test Voice
            </>
          )}
        </button>

        <button
          onClick={handleUseDefaultVoice}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
              : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          Use Default Voice
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload a clear audio file (6+ seconds recommended)</li>
          <li>• Supported formats: WAV, MP3, M4A, FLAC</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Test the voice before using it in interviews</li>
          <li>• The AI will clone the voice characteristics from your reference audio</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceCloningSettings;
