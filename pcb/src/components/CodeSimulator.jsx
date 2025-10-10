import React, { useEffect, useState } from 'react';

// Simple Arduino interpreter/simulator
class ArduinoSimulator {
  constructor(onPinChange, onSerialOutput) {
    this.pins = {};
    this.serialBuffer = [];
    this.onPinChange = onPinChange;
    this.onSerialOutput = onSerialOutput;
    this.interval = null;
    this.isRunning = false;
    
    // Constants
    this.HIGH = 1;
    this.LOW = 0;
    this.INPUT = 'INPUT';
    this.OUTPUT = 'OUTPUT';
    this.INPUT_PULLUP = 'INPUT_PULLUP';
  }
  
  // Reset simulator state
  reset() {
    this.pins = {};
    this.serialBuffer = [];
    this.clearInterval();
    this.isRunning = false;
  }
  
  // Define pin mode
  pinMode(pin, mode) {
    this.pins[pin] = {
      mode: mode,
      value: mode === this.INPUT_PULLUP ? this.HIGH : this.LOW,
      type: 'digital'
    };
    console.log(`[Simulator] Set pin ${pin} to mode ${mode}`);
  }
  
  // Digital write
  digitalWrite(pin, value) {
    // Check if pin exists, if not create it
    if (!this.pins[pin]) {
      this.pinMode(pin, this.OUTPUT);
    }
    
    this.pins[pin].value = value;
    console.log(`[Simulator] Digital write pin ${pin} = ${value}`);
    
    // Notify pin change to update UI
    this.onPinChange(pin, value, 'digital');
  }
  
  // Digital read
  digitalRead(pin) {
    if (!this.pins[pin]) {
      console.warn(`[Simulator] Pin ${pin} not initialized for reading`);
      return this.LOW;
    }
    return this.pins[pin].value;
  }
  
  // Analog write (PWM)
  analogWrite(pin, value) {
    // Ensure value is between 0-255
    const pwmValue = Math.max(0, Math.min(255, value));
    
    // Check if pin exists, if not create it
    if (!this.pins[pin]) {
      this.pinMode(pin, this.OUTPUT);
    }
    
    this.pins[pin].value = pwmValue;
    this.pins[pin].type = 'analog';
    console.log(`[Simulator] Analog write pin ${pin} = ${pwmValue}`);
    
    // Notify pin change to update UI
    this.onPinChange(pin, pwmValue, 'analog');
  }
  
  // Analog read
  analogRead(pin) {
    if (!this.pins[pin]) {
      console.warn(`[Simulator] Pin ${pin} not initialized for analog reading`);
      return 0;
    }
    return this.pins[pin].value;
  }
  
  // Serial functions
  serial = {
    begin: (baud) => {
      console.log(`[Simulator] Serial begin at ${baud} baud`);
    },
    print: (text) => {
      this.serialBuffer.push(String(text));
      this.onSerialOutput(this.serialBuffer.join(''));
    },
    println: (text = '') => {
      this.serialBuffer.push(String(text) + '\n');
      this.onSerialOutput(this.serialBuffer.join(''));
    }
  };
  
  // Delay simulation (note: this does not actually delay execution in the simulator)
  delay(ms) {
    console.log(`[Simulator] Delay ${ms}ms`);
    // We don't actually delay here since we're not running in real-time
  }
  
  // Run the user code
  runCode(code) {
    try {
      // Reset the simulator
      this.reset();
      
      // Parse code to extract setup and loop functions
      const setupMatch = code.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\}/);
      const loopMatch = code.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\}/);
      
      if (!setupMatch || !loopMatch) {
        throw new Error('Could not find setup() or loop() functions in code');
      }
      
      // Prepare the context for function execution
      const context = {
        pinMode: this.pinMode.bind(this),
        digitalWrite: this.digitalWrite.bind(this),
        digitalRead: this.digitalRead.bind(this),
        analogWrite: this.analogWrite.bind(this),
        analogRead: this.analogRead.bind(this),
        delay: this.delay.bind(this),
        Serial: this.serial,
        HIGH: this.HIGH,
        LOW: this.LOW,
        INPUT: this.INPUT,
        OUTPUT: this.OUTPUT,
        INPUT_PULLUP: this.INPUT_PULLUP
      };
      
      // Create and execute setup function
      const setupCode = `
        with (context) {
          ${setupMatch[1]}
        }
      `;
      
      // Create loop function
      const loopCode = `
        with (context) {
          ${loopMatch[1]}
        }
      `;
      
      // Execute setup once
      this.executeCode(setupCode, context);
      
      // Execute loop repeatedly at intervals
      this.isRunning = true;
      this.interval = setInterval(() => {
        if (this.isRunning) {
          this.executeCode(loopCode, context);
        }
      }, 1000); // Run loop each second (simplified simulation)
      
      return true;
    } catch (error) {
      console.error('[Simulator] Error running code:', error);
      return false;
    }
  }
  
  // Execute code safely
  executeCode(code, context) {
    try {
      // Using Function constructor to create a function from string
      // This is not ideal for security but serves demonstration purposes
      const func = new Function('context', code);
      func(context);
      return true;
    } catch (error) {
      console.error('[Simulator] Error executing code:', error);
      this.onSerialOutput(`[ERROR] ${error.message}`);
      return false;
    }
  }
  
  // Stop the simulation
  stop() {
    this.isRunning = false;
    this.clearInterval();
  }
  
  // Clear interval safely
  clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

const CodeSimulator = ({ 
  code, 
  components,
  wires = [],
  onUpdateComponentStates 
}) => {
  const [serialOutput, setSerialOutput] = useState([]);
  const [simulator, setSimulator] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Initialize simulator
  useEffect(() => {
    const handlePinChange = (pin, value, type) => {
      // Find components connected to this pin and update their state
      const affectedComponents = mapPinToComponents(pin, components, wires);
      onUpdateComponentStates(affectedComponents, value, type);
    };
    
    const handleSerialOutput = (output) => {
      setSerialOutput(prev => [...prev, output]);
    };
    
    const sim = new ArduinoSimulator(handlePinChange, handleSerialOutput);
    setSimulator(sim);
    
    return () => {
      if (sim) {
        sim.stop();
      }
    };
  }, [components, wires, onUpdateComponentStates]);
  
  // Map pin numbers to components on canvas based on wire connections
  const mapPinToComponents = (pin, components, wires = []) => {
    console.log(`[Simulator] Mapping pin ${pin} to components...`);
    console.log(`[Simulator] Available components:`, components.map(c => `${c.name} (${c.type})`));
    
    // Find Arduino/microcontroller component
    const arduino = components.find(comp => 
      comp.name?.toLowerCase().includes('arduino') || 
      comp.name?.toLowerCase().includes('nano') ||
      comp.name?.toLowerCase().includes('esp') ||
      comp.name?.toLowerCase().includes('uno')
    );
    
    if (!arduino) {
      console.warn('[Simulator] No Arduino/microcontroller found on canvas - using simple mode');
      console.log(`[Simulator] Lighting up all LEDs for pin ${pin}`);
      // Fallback: For simple circuits without Arduino, light up all LEDs
      const allLEDs = components.filter(c => c.type === 'LED' || c.type?.toLowerCase() === 'led');
      console.log(`[Simulator] Found ${allLEDs.length} LEDs:`, allLEDs.map(led => led.name));
      return allLEDs.map(comp => ({
        instanceId: comp.instanceId,
        type: comp.type,
        name: comp.name
      }));
    }
    
    // Find the pin on Arduino that matches the digital pin number
    const arduinoPin = arduino.pins?.find(p => {
      const pinLabel = p.label || p.id || '';
      const pinDesignation = p.designation || '';
      
      // Match patterns like "D13", "13", "Digital 13", "Pin 13"
      return pinLabel.includes(`D${pin}`) || 
             pinLabel.includes(`Pin ${pin}`) ||
             pinLabel === pin.toString() ||
             pinDesignation.includes(`D${pin}`) ||
             pinDesignation === pin.toString();
    });
    
    if (!arduinoPin) {
      console.warn(`[Simulator] Pin ${pin} not found on Arduino. Available pins:`, arduino.pins?.map(p => p.label || p.id));
      // Fallback: map to all LEDs
      return components.filter(c => c.type === 'LED' || c.type?.toLowerCase() === 'led').map(comp => ({
        instanceId: comp.instanceId,
        type: comp.type,
        name: comp.name
      }));
    }
    
    console.log(`[Simulator] Found Arduino pin:`, arduinoPin);
    
    // Now trace wires from this Arduino pin to find connected components
    const affectedComponents = [];
    
    // Trace through wire connections (this is simplified - doesn't handle resistors in between)
    const connectedComponents = traceWireConnections(arduino.instanceId, arduinoPin.id, components, wires);
    
    console.log(`[Simulator] Components connected to pin ${pin}:`, connectedComponents.map(c => c.name));
    
    return connectedComponents.map(comp => ({
      instanceId: comp.instanceId,
      type: comp.type,
      name: comp.name
    }));
  };
  
  // Helper function to trace wire connections
  const traceWireConnections = (startCompId, startPinId, components, wires = []) => {
    const connectedComponents = [];
    const visited = new Set();
    
    const trace = (compId, pinId) => {
      const key = `${compId}-${pinId}`;
      if (visited.has(key)) return;
      visited.add(key);
      
      // Find wires connected to this pin
      wires.forEach(wire => {
        let targetComp = null;
        let targetPin = null;
        
        if (wire.from.compId === compId && wire.from.pinId === pinId) {
          // Wire starts from this pin
          targetComp = components.find(c => c.instanceId === wire.to.compId);
          targetPin = wire.to.pinId;
        } else if (wire.to.compId === compId && wire.to.pinId === pinId) {
          // Wire ends at this pin
          targetComp = components.find(c => c.instanceId === wire.from.compId);
          targetPin = wire.from.pinId;
        }
        
        if (targetComp) {
          // Check if this is an output component (LED, motor, etc.)
          if (targetComp.type === 'LED' || targetComp.type?.toLowerCase() === 'led') {
            connectedComponents.push(targetComp);
          }
          
          // Continue tracing through this component (for components like resistors)
          trace(targetComp.instanceId, targetPin);
        }
      });
    };
    
    trace(startCompId, startPinId);
    return connectedComponents;
  };
  
  // Run code simulation
  const runSimulation = () => {
    if (!simulator || !code) return;
    
    setSerialOutput([]);
    setIsRunning(true);
    
    const success = simulator.runCode(code);
    if (!success) {
      setIsRunning(false);
    }
  };
  
  // Stop code simulation
  const stopSimulation = () => {
    if (simulator) {
      simulator.stop();
    }
    setIsRunning(false);
  };
  
  // Clear serial output
  const clearSerialOutput = () => {
    setSerialOutput([]);
  };
  
  // Simulate code execution when run is triggered
  useEffect(() => {
    if (isRunning) {
      // This is handled by the Arduino simulator class
    }
    
    return () => {
      if (simulator) {
        simulator.stop();
      }
    };
  }, [isRunning, simulator]);
  
  return {
    isRunning,
    serialOutput,
    runSimulation,
    stopSimulation,
    clearSerialOutput
  };
};

export default CodeSimulator; 