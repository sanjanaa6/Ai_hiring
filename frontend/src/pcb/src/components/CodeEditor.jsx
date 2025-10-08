import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Download, Save, Upload } from 'lucide-react';

// Sample Arduino code template
const ARDUINO_TEMPLATE = `// Arduino sketch
void setup() {
  // Initialize pins
  pinMode(13, OUTPUT); // Built-in LED
  Serial.begin(9600);
  Serial.println("Setup complete");
}

void loop() {
  // Main code that repeats
  digitalWrite(13, HIGH);  // Turn LED on
  delay(1000);             // Wait 1 second
  digitalWrite(13, LOW);   // Turn LED off
  delay(1000);             // Wait 1 second
}
`;

const CodeEditor = ({ 
  isDarkMode, 
  code, 
  setCode, 
  onRunCode, 
  onSaveCode,
  onUploadCode,
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize with template if no code is provided
  useEffect(() => {
    if (!code) {
      setCode(ARDUINO_TEMPLATE);
    }
  }, [code, setCode]);

  const handleEditorDidMount = () => {
    setIsEditorReady(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-2 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
        <div className="text-sm font-medium">Arduino Code Editor</div>
        <div className="flex space-x-2">
          <button
            onClick={() => onRunCode(code)}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center text-xs`}
          >
            <Play size={14} className="mr-1" />
            Run Simulation
          </button>
          <button
            onClick={() => onSaveCode(code)}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-black'} flex items-center text-xs`}
          >
            <Save size={14} className="mr-1" />
            Save
          </button>
          <button
            onClick={() => {
              // Create file download
              const blob = new Blob([code], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'pcb_sketch.ino';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-black'} flex items-center text-xs`}
          >
            <Download size={14} className="mr-1" />
            Download
          </button>
          <button
            onClick={() => onUploadCode()}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-black'} flex items-center text-xs`}
          >
            <Upload size={14} className="mr-1" />
            Upload
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          defaultValue={code || ARDUINO_TEMPLATE}
          theme={isDarkMode ? 'vs-dark' : 'vs-light'}
          onChange={setCode}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor; 