import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Code } from 'lucide-react';
import Canvas from './Canvas';
import TabContainer from './TabContainer';

const CanvasWithCode = ({ isDarkMode, canvasState, onCanvasStateChange, onUndo, onRedo, canUndo, canRedo }) => {
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [componentStates, setComponentStates] = useState({});
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  
  // Extract components, wires, and wireGroups from canvasState
  const { components = [], wires = [], wireGroups = {} } = canvasState || {};
  
  // Store previous component count using useRef to detect when it drops to 0
  const prevComponentCountRef = React.useRef(components.length);
  
  React.useEffect(() => {
    // If we previously had components but now have 0, something went wrong!
    if (prevComponentCountRef.current > 0 && components.length === 0) {
      console.error('[CanvasWithCode] WARNING: Components dropped from', prevComponentCountRef.current, 'to 0!');
      console.error('[CanvasWithCode] canvasState:', canvasState);
    }
    prevComponentCountRef.current = components.length;
  }, [components.length, canvasState]);
  
  // Handle canvas state changes (for undo/redo)
  const handleCanvasStateChange = useCallback((newComponents, newWires, newWireGroups) => {
    const newState = {
      components: newComponents,
      wires: newWires,
      wireGroups: newWireGroups
    };
    onCanvasStateChange(newState);
  }, [onCanvasStateChange]);
  
  // Handle component state updates from simulation
  const handleUpdateComponentStates = useCallback((affectedComponents, value, type) => {
    if (!affectedComponents || affectedComponents.length === 0) return;
    
    console.log(`[CanvasWithCode] Updating component states:`, affectedComponents, 'value:', value, 'type:', type);
    
    setComponentStates(prevStates => {
      const newStates = { ...prevStates };
      
      affectedComponents.forEach(comp => {
        if (!comp.instanceId) return;
        
        if (!newStates[comp.instanceId]) {
          newStates[comp.instanceId] = { states: {} };
        }
        
        // Update the component state
        if (comp.pinIndex !== undefined) {
          if (!newStates[comp.instanceId].states.pins) {
            newStates[comp.instanceId].states.pins = {};
          }
          newStates[comp.instanceId].states.pins[comp.pinIndex] = { value, type };
        } else {
          // General component state
          newStates[comp.instanceId].states.value = value;
          newStates[comp.instanceId].states.type = type;
        }
        
        // Special handling for component types
        switch (comp.type?.toLowerCase()) {
          case 'led':
          case 'light':
            // Set the value in states object for Canvas component to detect
            newStates[comp.instanceId].states.value = value;
            newStates[comp.instanceId].states.type = type;
            // Also set highlight for immediate visual feedback
            newStates[comp.instanceId].highlight = value ? (value === 1 ? 'red' : `rgba(255, 0, 0, ${value/255})`) : null;
            break;
          case 'speaker':
            newStates[comp.instanceId].states.value = value;
            newStates[comp.instanceId].states.type = type;
            newStates[comp.instanceId].highlight = value ? 'blue' : null;
            break;
          case 'motor':
            newStates[comp.instanceId].states.value = value;
            newStates[comp.instanceId].states.type = type;
            newStates[comp.instanceId].rotation = value ? (type === 'digital' ? (value === 1 ? 5 : 0) : value/50) : 0;
            break;
          case 'display':
            newStates[comp.instanceId].states.value = value;
            newStates[comp.instanceId].states.type = type;
            newStates[comp.instanceId].displayValue = value;
            break;
          default:
            // Handle other component types
            newStates[comp.instanceId].states.value = value;
            newStates[comp.instanceId].states.type = type;
            if (value === 1) {
              newStates[comp.instanceId].highlight = 'rgba(0, 255, 0, 0.3)';
            } else if (value === 0) {
              newStates[comp.instanceId].highlight = null;
            }
        }
      });
      
      return newStates;
    });
    
    // Mark simulation as running
    setIsSimulationRunning(true);
  }, []);
  
  // Reset states when simulation stops
  useEffect(() => {
    if (!isSimulationRunning) {
      setComponentStates({});
    }
  }, [isSimulationRunning]);
  
  // Prepare component mapping for the simulation
  const prepareComponentsForSimulation = useCallback(() => {
    // Here we would add arduino_pin mappings to component pins if needed
    // This is a simplified example - in a real implementation, we'd need
    // to map the connections from wires to determine which pin connects to what
    
    return components.map(comp => {
      // Deep clone to avoid modifying the original
      const componentCopy = { ...comp };
      
      // Check if pins exist
      if (componentCopy.pins && componentCopy.pins.length > 0) {
        // Clone pins array
        componentCopy.pins = componentCopy.pins.map((pin, index) => {
          // For demonstration purposes, we're assigning sequential Arduino pin numbers
          // In a real implementation, this would be based on actual connections
          return {
            ...pin, 
            arduino_pin: pin.arduino_pin || (index + 1).toString()
          };
        });
      }
      
      return componentCopy;
    });
  }, [components]);
  
  return (
    <div className="relative w-full h-full flex">
      {/* Canvas */}
      <div className={`flex-1 h-full transition-all ${showCodePanel ? 'w-[calc(100%-24rem)]' : 'w-full'}`}>
        <Canvas 
          isDarkMode={isDarkMode} 
          componentStates={componentStates}
          components={components}
          wires={wires}
          wireGroups={wireGroups}
          onCanvasStateChange={handleCanvasStateChange}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
      
      {/* Code Editor Panel */}
      {showCodePanel && (
        <div className={`w-96 h-full border-l ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'}`}>
          <TabContainer 
            isDarkMode={isDarkMode} 
            components={prepareComponentsForSimulation()}
            onUpdateComponentStates={handleUpdateComponentStates}
            onSimulationStatusChange={setIsSimulationRunning}
          />
        </div>
      )}
      
      {/* Toggle button */}
      <button
        onClick={() => setShowCodePanel(!showCodePanel)}
        className={`absolute top-4 right-${showCodePanel ? '96' : '4'} z-10 p-2 rounded-full ${
          isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-black'
        } shadow-md hover:${isDarkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}
        title={showCodePanel ? "Hide Code Panel" : "Show Code Panel"}
      >
        <Code size={16} />
      </button>
    </div>
  );
};

export default CanvasWithCode; 