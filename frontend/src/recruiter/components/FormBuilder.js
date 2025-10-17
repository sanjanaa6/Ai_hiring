import React from 'react';
import { FileText } from 'lucide-react';

/**
 * FormBuilder Component
 * Placeholder component for form building functionality
 * The actual form builder is integrated within the interview creation flow
 */
const FormBuilder = ({ isDarkMode, onSave }) => {
  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8`}>
      <div className="text-center">
        <FileText className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Form Builder
        </h2>
        <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Create custom forms for your interviews using the Advanced Interview Creator.
        </p>
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-6 text-left`}>
          <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            How to create custom forms:
          </h3>
          <ol className={`list-decimal list-inside space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>Go to the "Job Management" tab</li>
            <li>Create a new job or edit an existing one</li>
            <li>Click "Add Interview Round"</li>
            <li>Select a round type that supports custom forms</li>
            <li>Use the built-in form builder to add fields</li>
          </ol>
        </div>
        <div className="mt-6">
          <button
            onClick={() => window.location.href = '#manage-jobs'}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Go to Job Management
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
