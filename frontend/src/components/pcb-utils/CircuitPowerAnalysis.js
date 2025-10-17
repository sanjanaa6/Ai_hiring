/**
 * Circuit Power Analysis - Detect if components have power
 * This helps LEDs glow when connected to batteries/power sources
 */

/**
 * Check if a component is connected to a power source
 * @param {Object} component - The component to check
 * @param {Array} components - All components on canvas
 * @param {Array} wires - All wires on canvas
 * @returns {Object} - { hasPower: boolean, voltage: string, intensity: number }
 */
export function checkComponentPower(component, components, wires) {
  console.log(`[PowerAnalysis] Checking power for ${component?.name}...`);
  
  if (!component || !wires || wires.length === 0) {
    console.log(`[PowerAnalysis] ❌ No component or wires. component:`, !!component, 'wires:', wires?.length);
    return { hasPower: false, voltage: null, intensity: 0 };
  }

  // Only check for LEDs and other output components
  const outputTypes = ['LED', 'led', 'Light', 'light', 'Motor', 'motor'];
  if (!outputTypes.some(type => component.type?.toLowerCase().includes(type.toLowerCase()))) {
    console.log(`[PowerAnalysis] ❌ Not an output component. Type:`, component.type);
    return { hasPower: false, voltage: null, intensity: 0 };
  }

  console.log(`[PowerAnalysis] Component is ${component.type}, tracing circuit...`);
  console.log(`[PowerAnalysis] Component pins:`, component.pins);
  console.log(`[PowerAnalysis] Total wires:`, wires.length);
  console.log(`[PowerAnalysis] Total components:`, components.length);
  
  // Find if this LED is in a complete circuit with a power source
  const circuit = traceCircuit(component, components, wires);
  
  console.log(`[PowerAnalysis] Circuit trace result:`, circuit);
  
  if (circuit.hasPowerSource && circuit.hasGround) {
    // Calculate intensity based on voltage
    let intensity = 1.0;
    const voltage = parseFloat(circuit.voltage);
    
    if (!isNaN(voltage)) {
      // Standard LED forward voltage is ~2V
      // 3.7V battery = good brightness
      // 5V = full brightness
      // 9V = very bright (may need resistor check)
      if (voltage >= 5) {
        intensity = 1.0;
      } else if (voltage >= 3.5) {
        intensity = 0.9;
      } else if (voltage >= 2.5) {
        intensity = 0.7;
      } else {
        intensity = 0.5;
      }
    }
    
    return { 
      hasPower: true, 
      voltage: circuit.voltage, 
      intensity,
      source: circuit.powerSourceName
    };
  }

  return { hasPower: false, voltage: null, intensity: 0 };
}

/**
 * Trace circuit from component to find power source and ground
 */
function traceCircuit(component, components, wires) {
  console.log(`[Circuit Trace] Starting trace for ${component.name}...`);
  const visited = new Set();
  let hasPowerSource = false;
  let hasGround = false;
  let voltage = '5V'; // Default
  let powerSourceName = '';
  
  const trace = (compId, pinId, depth = 0) => {
    if (depth > 10) {
      console.log(`[Circuit Trace] Max depth reached at ${depth}`);
      return; // Prevent infinite loops
    }
    
    const key = `${compId}-${pinId}`;
    if (visited.has(key)) return;
    visited.add(key);
    
    const currentComp = components.find(c => c.instanceId === compId);
    if (!currentComp) {
      console.log(`[Circuit Trace] Component not found: ${compId}`);
      return;
    }
    
    console.log(`[Circuit Trace] Visiting ${currentComp.name} pin ${pinId} (depth ${depth})`);
    
    // Check if this is a power source
    if (isPowerSource(currentComp)) {
      hasPowerSource = true;
      voltage = currentComp.voltage || '5V';
      powerSourceName = currentComp.name;
      console.log(`[Circuit Trace] ✅ Found power source: ${currentComp.name} (${voltage})`);
    }
    
    // Check if this pin is a ground
    const currentPin = currentComp.pins?.find(p => p.id === pinId);
    if (currentPin && isGroundPin(currentPin)) {
      hasGround = true;
      console.log(`[Circuit Trace] ✅ Found ground pin: ${pinId} on ${currentComp.name}`);
    }
    
    // Find connected wires
    const connectedWires = wires.filter(wire => 
      (wire.from.compId === compId && wire.from.pinId === pinId) ||
      (wire.to.compId === compId && wire.to.pinId === pinId)
    );
    
    // Continue tracing through connected components
    connectedWires.forEach(wire => {
      if (wire.from.compId === compId && wire.from.pinId === pinId) {
        trace(wire.to.compId, wire.to.pinId, depth + 1);
      } else if (wire.to.compId === compId && wire.to.pinId === pinId) {
        trace(wire.from.compId, wire.from.pinId, depth + 1);
      }
    });
  };
  
  // Start tracing from all pins of the component
  if (component.pins) {
    component.pins.forEach(pin => {
      trace(component.instanceId, pin.id, 0);
    });
  }
  
  return { hasPowerSource, hasGround, voltage, powerSourceName };
}

/**
 * Check if component is a power source
 */
function isPowerSource(component) {
  if (!component) return false;
  
  const powerTypes = ['Battery', 'battery', 'Power Supply', 'power supply', 'USB'];
  const powerNames = ['battery', 'power', 'usb', 'vcc', 'vin'];
  
  // Check type
  if (powerTypes.some(type => component.type?.toLowerCase().includes(type.toLowerCase()))) {
    return true;
  }
  
  // Check name
  if (powerNames.some(name => component.name?.toLowerCase().includes(name))) {
    return true;
  }
  
  return false;
}

/**
 * Check if pin is a ground pin
 */
function isGroundPin(pin) {
  if (!pin) return false;
  
  const pinStr = ((pin.type || '') + (pin.id || '') + (pin.label || '') + (pin.designation || '')).toLowerCase();
  return pinStr.includes('gnd') || pinStr.includes('ground') || pinStr.includes('-');
}

/**
 * Get LED color based on component name
 */
export function getLEDColor(component) {
  if (!component) return '#ef4444'; // Default red
  
  const name = component.name?.toLowerCase() || '';
  
  if (name.includes('red')) return '#ef4444';
  if (name.includes('green')) return '#22c55e';
  if (name.includes('blue')) return '#3b82f6';
  if (name.includes('yellow')) return '#eab308';
  if (name.includes('white')) return '#f8fafc';
  if (name.includes('orange')) return '#f97316';
  if (name.includes('purple')) return '#a855f7';
  
  return '#ef4444'; // Default red
}

