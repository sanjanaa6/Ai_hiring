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
  onUpdateComponentStates 
}) => {
  const [serialOutput, setSerialOutput] = useState([]);
  const [simulator, setSimulator] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Initialize simulator
  useEffect(() => {
    const handlePinChange = (pin, value, type) => {
      // Find components connected to this pin and update their state
      const affectedComponents = mapPinToComponents(pin, components);
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
  }, [components, onUpdateComponentStates]);
  
  // Map pin numbers to components on canvas
  const mapPinToComponents = (pin, components) => {
    // This function maps Arduino pin numbers to components in the PCB design
    // For now, we'll use a simple approach: find LED components and assume they're connected to the pin
    
    // Find LED components that could be connected to this pin
    const ledComponents = components.filter(comp => 
      comp.type === 'LED' || comp.type === 'led'
    );
    
    // For demonstration, we'll assume all LEDs are connected to the pin being written to
    // In a real implementation, this would check actual wire connections
    if (ledComponents.length > 0) {
      console.log(`[Simulator] Pin ${pin} change affects ${ledComponents.length} LED components:`, ledComponents.map(c => c.name));
      return ledComponents.map(comp => ({
        instanceId: comp.instanceId,
        type: comp.type,
        name: comp.name
      }));
    } else {
      console.log(`[Simulator] No LED components found on canvas. Available components:`, components.map(c => `${c.name} (${c.type})`));
    }
    
    // Also check for components with explicit Arduino pin mappings
    return components.filter(comp => {
      return comp.pins && comp.pins.some(p => 
        p.arduino_pin === pin.toString() || 
        p.arduino_pin === parseInt(pin)
      );
    }).map(comp => ({
      instanceId: comp.instanceId,
      type: comp.type,
      pinIndex: comp.pins.findIndex(p => 
        p.arduino_pin === pin.toString() || 
        p.arduino_pin === parseInt(pin)
      )
    }));
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