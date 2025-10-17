import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Play, StopCircle, Download, Terminal, X, Award } from 'lucide-react';
import CodeEditor from './CodeEditor';
import BlocklyEditor from './BlocklyEditor';
import CodeSimulator from './CodeSimulator';
import EvaluationPanel from './EvaluationPanel';

// Arduino template code
const DEFAULT_ARDUINO_CODE = `// Arduino sketch
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

const TabContainer = ({ 
  isDarkMode, 
  components,
  wires = [],
  onUpdateComponentStates,
  onSimulationStatusChange
}) => {
  const [activeTab, setActiveTab] = useState('code');
  const [code, setCode] = useState(DEFAULT_ARDUINO_CODE);
  const [blocklyXml, setBlocklyXml] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  
  // Initialize simulator
  const simulator = CodeSimulator({
    code,
    components,
    wires,
    onUpdateComponentStates
  });
  
  // Update simulation status
  useEffect(() => {
    if (onSimulationStatusChange) {
      onSimulationStatusChange(simulator.isRunning);
    }
  }, [simulator.isRunning, onSimulationStatusChange]);
  
  // Update code when Blockly changes
  const handleBlocklyCodeGeneration = (generatedCode) => {
    setCode(generatedCode);
  };
  
  // Handle code run/stop
  const handleRunCode = () => {
    simulator.runSimulation();
  };
  
  const handleStopCode = () => {
    simulator.stopSimulation();
  };
  
  // Handle code save
  const handleSaveCode = (codeToSave) => {
    console.log('Saving code:', codeToSave);
    // Code would be saved to a server or local storage
  };
  
  // Handle code upload
  const handleUploadCode = () => {
    // This would trigger a file input dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ino,.cpp,.c';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCode(event.target.result);
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Control Bar */}
      <div className={`flex items-center justify-between p-2 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'} border-b`}>
        <div className="font-medium">PCB Design & Simulation</div>
        <div className="flex space-x-2">
          {simulator.isRunning ? (
            <button
              onClick={handleStopCode}
              className={`p-1.5 rounded-md flex items-center ${isDarkMode ? 'bg-red-900 hover:bg-red-800 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
            >
              <StopCircle size={16} className="mr-1" />
              <span className="text-xs">Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRunCode}
              className={`p-1.5 rounded-md flex items-center ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              <Play size={16} className="mr-1" />
              <span className="text-xs">Run</span>
            </button>
          )}
          
          <button
            onClick={() => setShowTerminal(prev => !prev)}
            className={`p-1.5 rounded-md flex items-center ${
              isDarkMode 
                ? showTerminal ? 'bg-purple-900' : 'bg-zinc-700 hover:bg-zinc-600'
                : showTerminal ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 hover:bg-gray-300'
            } ${isDarkMode ? 'text-white' : 'text-black'}`}
          >
            <Terminal size={16} className="mr-1" />
            <span className="text-xs">Terminal</span>
          </button>
        </div>
      </div>
      
      {/* Tab Controls */}
      <div className={`flex-1 flex flex-col ${showTerminal ? 'h-3/4' : 'h-full'}`}>
        <Tabs
          defaultValue="code"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className={`px-2 pt-2 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <TabsList className={`w-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
              <TabsTrigger 
                value="code" 
                className={`flex-1 ${isDarkMode ? 'data-[state=active]:bg-zinc-700' : 'data-[state=active]:bg-white'}`}
              >
                Code
              </TabsTrigger>
              <TabsTrigger 
                value="visual" 
                className={`flex-1 ${isDarkMode ? 'data-[state=active]:bg-zinc-700' : 'data-[state=active]:bg-white'}`}
              >
                Visual
              </TabsTrigger>
              <TabsTrigger 
                value="evaluate" 
                className={`flex-1 ${isDarkMode ? 'data-[state=active]:bg-zinc-700' : 'data-[state=active]:bg-white'} flex items-center gap-1 justify-center`}
              >
                <Award size={14} />
                Evaluate
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
            <CodeEditor
              key="code-editor-persistent"
              isDarkMode={isDarkMode}
              code={code}
              setCode={setCode}
              onRunCode={handleRunCode}
              onSaveCode={handleSaveCode}
              onUploadCode={handleUploadCode}
            />
          </TabsContent>
          
          <TabsContent value="visual" className="flex-1 m-0 overflow-hidden">
            <BlocklyEditor
              isDarkMode={isDarkMode}
              onGenerateCode={handleBlocklyCodeGeneration}
              onRunCode={handleRunCode}
              initialXml={blocklyXml}
            />
          </TabsContent>
          
          <TabsContent value="evaluate" className="flex-1 m-0 overflow-hidden">
            <EvaluationPanel
              components={components}
              wires={wires}
              isDarkMode={isDarkMode}
              onTestComplete={(result) => {
                console.log('Evaluation complete:', result);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Terminal/Serial Output */}
      {showTerminal && (
        <div 
          className={`h-1/4 border-t p-2 ${
            isDarkMode 
              ? 'bg-black border-zinc-800 text-green-400' 
              : 'bg-gray-900 border-gray-800 text-green-500'
          } overflow-y-auto font-mono text-sm`}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs opacity-60">Serial Monitor</div>
            <div className="flex space-x-2">
              <button 
                onClick={simulator.clearSerialOutput}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Clear
              </button>
              <button 
                onClick={() => setShowTerminal(false)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap">
            {simulator.serialOutput.length > 0 
              ? simulator.serialOutput.map((line, i) => <div key={i}>{line}</div>)
              : <span className="opacity-40">No output yet. Run your code to see results here.</span>
            }
          </pre>
        </div>
      )}
    </div>
  );
};

export default TabContainer; 