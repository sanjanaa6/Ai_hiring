import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { Play, RotateCcw, Code, Download } from 'lucide-react';

// Import Blockly core modules
import 'blockly/blocks';
// Import the JavaScript generator correctly
import { javascriptGenerator } from 'blockly/javascript';

// Define Arduino-specific blocks
const defineArduinoBlocks = () => {
  // Define Arduino-specific blocks
  Blockly.Blocks['arduino_setup'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Setup");
      this.appendStatementInput("STATEMENTS")
          .setCheck(null);
      this.setColour(230);
      this.setTooltip("Setup runs once when the program starts");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['arduino_loop'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Loop");
      this.appendStatementInput("STATEMENTS")
          .setCheck(null);
      this.setColour(230);
      this.setTooltip("Loop runs continuously");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['arduino_pin_mode'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Set pin")
          .appendField(new Blockly.FieldNumber(13), "PIN")
          .appendField("as")
          .appendField(new Blockly.FieldDropdown([
            ["INPUT", "INPUT"],
            ["OUTPUT", "OUTPUT"], 
            ["INPUT_PULLUP", "INPUT_PULLUP"]
          ]), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Sets the specified pin as INPUT or OUTPUT");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['arduino_digital_write'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Digital write pin")
          .appendField(new Blockly.FieldNumber(13), "PIN")
          .appendField("to")
          .appendField(new Blockly.FieldDropdown([
            ["HIGH", "HIGH"],
            ["LOW", "LOW"]
          ]), "STATE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Set a pin to HIGH or LOW");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['arduino_delay'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Delay")
          .appendField(new Blockly.FieldNumber(1000), "DELAY")
          .appendField("milliseconds");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Pause the program for the specified milliseconds");
      this.setHelpUrl("");
    }
  };

  // Define Arduino code generators for custom blocks
  javascriptGenerator.forBlock['arduino_setup'] = function(block) {
    const statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
    return `void setup() {\n${statements}}\n\n`;
  };

  javascriptGenerator.forBlock['arduino_loop'] = function(block) {
    const statements = javascriptGenerator.statementToCode(block, 'STATEMENTS');
    return `void loop() {\n${statements}}\n`;
  };

  javascriptGenerator.forBlock['arduino_pin_mode'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    return `pinMode(${pin}, ${mode});\n`;
  };

  javascriptGenerator.forBlock['arduino_digital_write'] = function(block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    return `digitalWrite(${pin}, ${state});\n`;
  };

  javascriptGenerator.forBlock['arduino_delay'] = function(block) {
    const delay = block.getFieldValue('DELAY');
    return `delay(${delay});\n`;
  };
};

// Define Arduino blocks outside of component render cycle
defineArduinoBlocks();

// Arduino toolbox configuration
const ARDUINO_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Arduino',
      colour: '#00979D',
      contents: [
        { kind: 'block', type: 'arduino_setup' },
        { kind: 'block', type: 'arduino_loop' },
        { kind: 'block', type: 'arduino_pin_mode' },
        { kind: 'block', type: 'arduino_digital_write' },
        { kind: 'block', type: 'arduino_delay' },
      ]
    },
    {
      kind: 'category',
      name: 'Logic',
      colour: '%{BKY_LOGIC_HUE}',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' },
      ]
    },
    {
      kind: 'category',
      name: 'Loops',
      colour: '%{BKY_LOOPS_HUE}',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
      ]
    },
    {
      kind: 'category',
      name: 'Math',
      colour: '%{BKY_MATH_HUE}',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_constrain' },
      ]
    },
  ]
};

const BlocklyEditor = ({ 
    isDarkMode, 
    onGenerateCode, 
    onRunCode,
    initialXml = ''
  }) => {
  const blocklyDiv = useRef(null);
  const toolboxDiv = useRef(null);
  const workspaceRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);

  // Initialize Blockly workspace
  useEffect(() => {
    if (blocklyDiv.current && !workspace) {
      try {
        // Create and configure workspace
        const newWorkspace = Blockly.inject(blocklyDiv.current, {
          toolbox: ARDUINO_TOOLBOX,
          theme: isDarkMode ? Blockly.Themes.Dark : Blockly.Themes.Classic,
          grid: {
            spacing: 20,
            length: 3,
            colour: isDarkMode ? '#555' : '#ddd',
            snap: true
          },
          zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
          },
          trashcan: true,
        });
      
      setWorkspace(newWorkspace);
      workspaceRef.current = newWorkspace;
      
      // Load initial blocks if provided
      if (initialXml) {
        try {
          const xml = Blockly.utils.xml.textToDom(initialXml);
          Blockly.Xml.domToWorkspace(xml, newWorkspace);
        } catch (e) {
          console.error('Error loading initial blocks:', e);
        }
      } else {
        // Add default setup and loop blocks
        const setupBlock = newWorkspace.newBlock('arduino_setup');
        setupBlock.moveBy(50, 50);
        setupBlock.initSvg();
        setupBlock.render();
        
        const loopBlock = newWorkspace.newBlock('arduino_loop');
        loopBlock.moveBy(50, 200);
        loopBlock.initSvg();
        loopBlock.render();
      }
      
        // Add change listener
        newWorkspace.addChangeListener(() => {
          const code = javascriptGenerator.workspaceToCode(newWorkspace);
          onGenerateCode(code);
        });
      } catch (error) {
        console.error('Error initializing Blockly workspace:', error);
      }
    }
    
    // Cleanup function
    return () => {
      // Don't dispose here - let the component unmount handle it
    };
  }, [blocklyDiv, isDarkMode, initialXml, onGenerateCode]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      if (workspaceRef.current) {
        try {
          // Clear the workspace first to avoid theme manager issues
          workspaceRef.current.clear();
          // Then dispose
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        } catch (error) {
          console.warn('Error disposing Blockly workspace:', error);
        }
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (blocklyDiv.current && workspace) {
        Blockly.svgResize(workspace);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [workspace]);

  // Save workspace as XML
  const saveBlocks = () => {
    if (workspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);
      
      // Create download
      const blob = new Blob([xmlText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pcb_blocks.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Clear the workspace
  const clearWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current.clear();
      
      // Re-add default blocks
      const setupBlock = workspaceRef.current.newBlock('arduino_setup');
      setupBlock.moveBy(50, 50);
      setupBlock.initSvg();
      setupBlock.render();
      
      const loopBlock = workspaceRef.current.newBlock('arduino_loop');
      loopBlock.moveBy(50, 200);
      loopBlock.initSvg();
      loopBlock.render();
    }
  };

  // Run the code from blocks
  const handleRunCode = () => {
    if (workspaceRef.current) {
      const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
      onRunCode(code);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-2 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
        <div className="text-sm font-medium">Arduino Visual Editor</div>
        <div className="flex space-x-2">
          <button
            onClick={handleRunCode}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center text-xs`}
          >
            <Play size={14} className="mr-1" />
            Run Simulation
          </button>
          <button
            onClick={clearWorkspace}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-black'} flex items-center text-xs`}
          >
            <RotateCcw size={14} className="mr-1" />
            Clear
          </button>
          <button
            onClick={saveBlocks}
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDarkMode ? 'text-white' : 'text-black'} flex items-center text-xs`}
          >
            <Download size={14} className="mr-1" />
            Save Blocks
          </button>
        </div>
      </div>

      {/* Blockly workspace */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={blocklyDiv}
          className="h-full w-full"
        />
      </div>
    </div>
  );
};

export default BlocklyEditor;