import React from 'react';
import { Camera, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BrowserCameraGuide = () => {
  const { isDarkMode } = useTheme();

  const browserConfigs = [
    {
      name: 'Chrome',
      steps: [
        'Click the camera icon in the address bar',
        'Select "Allow" for camera access',
        'Refresh the page',
        'If blocked, go to Settings > Privacy and Security > Site Settings > Camera'
      ]
    },
    {
      name: 'Firefox',
      steps: [
        'Click the shield icon in the address bar',
        'Click "Allow" for camera permissions',
        'Refresh the page',
        'If blocked, go to about:preferences#privacy and manage permissions'
      ]
    },
    {
      name: 'Safari',
      steps: [
        'Go to Safari > Preferences > Websites',
        'Select "Camera" from the left sidebar',
        'Set your site to "Allow"',
        'Refresh the page'
      ]
    },
    {
      name: 'Edge',
      steps: [
        'Click the camera icon in the address bar',
        'Select "Allow" for camera access',
        'Refresh the page',
        'If blocked, go to Settings > Site permissions > Camera'
      ]
    }
  ];

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode 
        ? 'bg-slate-800/50 border-white/10' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center space-x-3 mb-4">
        <Camera className="h-6 w-6 text-blue-500" />
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Browser Camera Configuration Guide
        </h3>
      </div>

      <div className="space-y-4">
        {/* General Instructions */}
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <span className={`font-medium ${
              isDarkMode ? 'text-blue-400' : 'text-blue-700'
            }`}>
              Quick Fix
            </span>
          </div>
          <div className={`text-sm space-y-1 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-600'
          }`}>
            <div>1. Look for a camera icon in your browser's address bar</div>
            <div>2. Click it and select "Allow" for camera access</div>
            <div>3. Refresh this page</div>
            <div>4. If no icon appears, try the browser-specific steps below</div>
          </div>
        </div>

        {/* Browser-specific Instructions */}
        <div className="grid md:grid-cols-2 gap-4">
          {browserConfigs.map((browser, index) => (
            <div key={index} className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {browser.name}
              </h4>
              <ol className={`text-sm space-y-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {browser.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {stepIndex + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Troubleshooting */}
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className={`font-medium ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
            }`}>
              Still Having Issues?
            </span>
          </div>
          <div className={`text-sm space-y-1 ${
            isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
          }`}>
            <div>• Try using incognito/private browsing mode</div>
            <div>• Check if another application is using your camera</div>
            <div>• Restart your browser</div>
            <div>• Try a different browser</div>
            <div>• For HTTP sites, some browsers may block camera access</div>
          </div>
        </div>

        {/* Development Note */}
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-purple-900/30 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-purple-400' : 'text-purple-700'
            }`}>
              Development Note
            </span>
          </div>
          <div className={`text-sm ${
            isDarkMode ? 'text-purple-300' : 'text-purple-600'
          }`}>
            If you're running this on HTTP (not HTTPS), some browsers may block camera access for security reasons. 
            For development, try using <code className="px-1 py-0.5 rounded bg-purple-200 text-purple-800">localhost</code> 
            or enable insecure origins in your browser settings.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserCameraGuide;
