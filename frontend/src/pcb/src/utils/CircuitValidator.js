/**
 * Circuit Validator - Checks if circuits are correctly wired
 * Validates connections, power supply, ground, and component requirements
 */

export class CircuitValidator {
  constructor(components, wires) {
    this.components = components;
    this.wires = wires;
    this.errors = [];
    this.warnings = [];
    this.score = 0;
  }

  /**
   * Validate the entire circuit
   */
  validate() {
    this.errors = [];
    this.warnings = [];
    this.score = 0;

    // Run all validation checks
    this.checkPowerConnections();
    this.checkGroundConnections();
    this.checkRequiredConnections();
    this.checkShortCircuits();
    this.checkOpenCircuits();
    this.checkComponentRequirements();

    // Calculate score (0-100)
    const maxScore = 100;
    const errorPenalty = this.errors.length * 10;
    const warningPenalty = this.warnings.length * 5;
    this.score = Math.max(0, maxScore - errorPenalty - warningPenalty);

    return {
      isValid: this.errors.length === 0,
      score: this.score,
      errors: this.errors,
      warnings: this.warnings,
      summary: this.generateSummary()
    };
  }

  /**
   * Check if all components requiring power have proper power connections
   */
  checkPowerConnections() {
    const powerRequiringComponents = this.components.filter(comp => 
      this.requiresPower(comp)
    );

    powerRequiringComponents.forEach(comp => {
      const powerPins = comp.pins?.filter(pin => 
        pin.type?.toLowerCase().includes('vcc') || 
        pin.type?.toLowerCase().includes('power') ||
        pin.id?.toLowerCase().includes('vcc') ||
        pin.id?.toLowerCase().includes('vin')
      ) || [];

      if (powerPins.length === 0) return; // Component doesn't have explicit power pins

      const hasPower = powerPins.some(pin => 
        this.isPinConnected(comp.instanceId, pin.id)
      );

      if (!hasPower) {
        this.errors.push({
          type: 'MISSING_POWER',
          component: comp.name,
          message: `${comp.name} is missing power connection`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Check if all components have proper ground connections
   */
  checkGroundConnections() {
    const groundRequiringComponents = this.components.filter(comp => 
      this.requiresGround(comp)
    );

    groundRequiringComponents.forEach(comp => {
      const groundPins = comp.pins?.filter(pin => 
        pin.type?.toLowerCase().includes('gnd') || 
        pin.type?.toLowerCase().includes('ground') ||
        pin.id?.toLowerCase().includes('gnd')
      ) || [];

      if (groundPins.length === 0) return;

      const hasGround = groundPins.some(pin => 
        this.isPinConnected(comp.instanceId, pin.id)
      );

      if (!hasGround) {
        this.errors.push({
          type: 'MISSING_GROUND',
          component: comp.name,
          message: `${comp.name} is missing ground connection`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Check required connections for specific component types
   */
  checkRequiredConnections() {
    this.components.forEach(comp => {
      const requirements = this.getComponentRequirements(comp);
      
      requirements.forEach(req => {
        const pin = comp.pins?.find(p => p.id === req.pinId);
        if (!pin) return;

        const isConnected = this.isPinConnected(comp.instanceId, req.pinId);
        
        if (req.required && !isConnected) {
          this.errors.push({
            type: 'MISSING_CONNECTION',
            component: comp.name,
            pin: req.pinId,
            message: `${comp.name} pin ${req.pinId} must be connected (${req.reason})`,
            severity: 'error'
          });
        }
      });
    });
  }

  /**
   * Check for short circuits (power to ground)
   */
  checkShortCircuits() {
    this.wires.forEach(wire => {
      const fromPin = this.getPin(wire.from.compId, wire.from.pinId);
      const toPin = this.getPin(wire.to.compId, wire.to.pinId);

      if (!fromPin || !toPin) return;

      const isPowerToGround = (
        (this.isPowerPin(fromPin) && this.isGroundPin(toPin)) ||
        (this.isGroundPin(fromPin) && this.isPowerPin(toPin))
      );

      if (isPowerToGround) {
        this.errors.push({
          type: 'SHORT_CIRCUIT',
          wire: wire.id,
          message: `Short circuit detected: Power connected directly to Ground`,
          severity: 'critical'
        });
      }
    });
  }

  /**
   * Check for open circuits in LED connections
   */
  checkOpenCircuits() {
    const leds = this.components.filter(comp => 
      comp.type?.toLowerCase() === 'led' || 
      comp.name?.toLowerCase().includes('led')
    );

    leds.forEach(led => {
      const connectedPins = led.pins?.filter(pin => 
        this.isPinConnected(led.instanceId, pin.id)
      ) || [];

      if (connectedPins.length === 0) {
        this.warnings.push({
          type: 'OPEN_CIRCUIT',
          component: led.name,
          message: `${led.name} has no connections - it won't light up`,
          severity: 'warning'
        });
      } else if (connectedPins.length === 1) {
        this.errors.push({
          type: 'INCOMPLETE_CIRCUIT',
          component: led.name,
          message: `${led.name} needs both anode and cathode connected`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Check component-specific requirements
   */
  checkComponentRequirements() {
    this.components.forEach(comp => {
      // Check Arduino/ESP32/Nano - needs USB or external power
      if (comp.name?.toLowerCase().includes('arduino') || 
          comp.name?.toLowerCase().includes('esp') ||
          comp.name?.toLowerCase().includes('nano')) {
        const hasUsbPower = this.components.some(c => 
          c.name?.toLowerCase().includes('usb') ||
          c.type === 'Power Supply'
        );
        const hasExternalPower = this.components.some(c => 
          c.type === 'Battery' ||
          c.name?.toLowerCase().includes('battery') ||
          c.name?.toLowerCase().includes('power supply')
        );

        if (!hasUsbPower && !hasExternalPower) {
          this.errors.push({
            type: 'NO_POWER_SOURCE',
            component: comp.name,
            message: `${comp.name} needs a power source (USB or battery). Add a USB Power Source or Battery from the components panel.`,
            severity: 'error'
          });
        }
      }

      // Check LEDs - need current limiting resistor
      if (comp.type?.toLowerCase() === 'led' || comp.name?.toLowerCase().includes('led')) {
        const hasResistor = this.components.some(c => 
          c.type === 'Resistor' &&
          (c.resistance?.includes('220') || 
           c.resistance?.includes('330') || 
           c.resistance?.includes('470'))
        );

        if (!hasResistor) {
          this.warnings.push({
            type: 'MISSING_CURRENT_LIMITER',
            component: comp.name,
            message: `${comp.name} should have a current-limiting resistor (220-470Ω) to prevent burnout`,
            severity: 'warning'
          });
        }
      }

      // Check sensors - need proper pullup resistors for I2C
      if (comp.name?.toLowerCase().includes('sensor') ||
          comp.name?.toLowerCase().includes('i2c')) {
        const hasI2cPullup = this.components.some(c => 
          c.type === 'Resistor' &&
          c.resistance?.includes('10k')
        );

        if (!hasI2cPullup) {
          this.warnings.push({
            type: 'MISSING_PULLUP',
            component: comp.name,
            message: `I2C devices typically need 10kΩ pullup resistors on SDA and SCL`,
            severity: 'info'
          });
        }
      }

      // Check voltage compatibility
      if (comp.voltage) {
        const voltageValue = parseFloat(comp.voltage);
        
        // Warn about 3.3V devices connected to 5V systems
        if (voltageValue === 3.3) {
          const has5VSource = this.components.some(c => 
            c.voltage === '5V' || c.voltage === '5.0V'
          );
          
          if (has5VSource) {
            this.warnings.push({
              type: 'VOLTAGE_MISMATCH',
              component: comp.name,
              message: `${comp.name} is a 3.3V device. Be careful when connecting to 5V systems - you may need a level shifter`,
              severity: 'warning'
            });
          }
        }
      }
    });
  }

  /**
   * Helper: Check if a pin is connected
   */
  isPinConnected(componentId, pinId) {
    return this.wires.some(wire => 
      (wire.from.compId === componentId && wire.from.pinId === pinId) ||
      (wire.to.compId === componentId && wire.to.pinId === pinId)
    );
  }

  /**
   * Helper: Get pin object
   */
  getPin(componentId, pinId) {
    const component = this.components.find(c => c.instanceId === componentId);
    return component?.pins?.find(p => p.id === pinId);
  }

  /**
   * Helper: Check if pin is a power pin
   */
  isPowerPin(pin) {
    if (!pin) return false;
    const pinStr = (pin.type + pin.id).toLowerCase();
    return pinStr.includes('vcc') || pinStr.includes('power') || pinStr.includes('vin') || pinStr.includes('5v') || pinStr.includes('3v');
  }

  /**
   * Helper: Check if pin is a ground pin
   */
  isGroundPin(pin) {
    if (!pin) return false;
    const pinStr = (pin.type + pin.id).toLowerCase();
    return pinStr.includes('gnd') || pinStr.includes('ground');
  }

  /**
   * Helper: Check if component requires power
   */
  requiresPower(comp) {
    const noPowerTypes = ['resistor', 'capacitor', 'wire', 'switch', 'button'];
    return !noPowerTypes.some(type => comp.type?.toLowerCase().includes(type));
  }

  /**
   * Helper: Check if component requires ground
   */
  requiresGround(comp) {
    return this.requiresPower(comp); // Same logic for now
  }

  /**
   * Get component-specific requirements
   */
  getComponentRequirements(comp) {
    const requirements = [];

    // LED requirements
    if (comp.type?.toLowerCase() === 'led') {
      requirements.push({
        pinId: 'Anode',
        required: true,
        reason: 'LED must have anode connected to positive voltage (through resistor)'
      });
      requirements.push({
        pinId: 'Cathode',
        required: true,
        reason: 'LED must have cathode connected to ground or control pin'
      });
    }

    // Add more component-specific requirements here...

    return requirements;
  }

  /**
   * Generate summary
   */
  generateSummary() {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      return '✅ Circuit looks good! All connections are correct.';
    }

    if (this.errors.length > 0) {
      return `❌ Found ${this.errors.length} error(s) and ${this.warnings.length} warning(s). Fix errors to proceed.`;
    }

    return `⚠️ Found ${this.warnings.length} warning(s). Circuit might work but could be improved.`;
  }
}

/**
 * Test Case System - Define expected behavior and verify
 */
export class CircuitTestRunner {
  constructor(components, wires) {
    this.components = components;
    this.wires = wires;
    this.tests = [];
  }

  /**
   * Add a test case
   */
  addTest(test) {
    this.tests.push(test);
  }

  /**
   * Run all tests
   */
  runTests() {
    const results = this.tests.map(test => {
      try {
        const passed = test.validate(this.components, this.wires);
        return {
          name: test.name,
          description: test.description,
          passed,
          message: passed ? '✅ Test passed' : `❌ ${test.failureMessage}`,
          points: passed ? test.points : 0
        };
      } catch (error) {
        return {
          name: test.name,
          description: test.description,
          passed: false,
          message: `❌ Test error: ${error.message}`,
          points: 0
        };
      }
    });

    const totalPoints = this.tests.reduce((sum, test) => sum + test.points, 0);
    const earnedPoints = results.reduce((sum, result) => sum + result.points, 0);

    return {
      results,
      totalPoints,
      earnedPoints,
      percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      allPassed: results.every(r => r.passed)
    };
  }
}

/**
 * Pre-defined test templates
 */
export const TestTemplates = {
  /**
   * Test: LED must be connected
   */
  ledConnected: (ledName = 'LED') => ({
    name: 'LED Connection',
    description: `${ledName} must be properly connected`,
    points: 20,
    failureMessage: `${ledName} is not connected properly`,
    validate: (components, wires) => {
      const led = components.find(c => 
        c.name?.toLowerCase().includes(ledName.toLowerCase())
      );
      
      if (!led) return false;
      
      const connectedWires = wires.filter(wire => 
        wire.from.compId === led.instanceId || wire.to.compId === led.instanceId
      );
      
      return connectedWires.length >= 2; // Both anode and cathode must be connected
    }
  }),

  /**
   * Test: Component must have power
   */
  hasPower: (componentName) => ({
    name: 'Power Connection',
    description: `${componentName} must be connected to power`,
    points: 15,
    failureMessage: `${componentName} is not connected to power`,
    validate: (components, wires) => {
      const component = components.find(c => 
        c.name?.toLowerCase().includes(componentName.toLowerCase())
      );
      
      if (!component) return false;
      
      const powerPins = component.pins?.filter(pin => 
        pin.type?.toLowerCase().includes('vcc') || 
        pin.type?.toLowerCase().includes('power')
      ) || [];
      
      return powerPins.some(pin => 
        wires.some(wire => 
          (wire.from.compId === component.instanceId && wire.from.pinId === pin.id) ||
          (wire.to.compId === component.instanceId && wire.to.pinId === pin.id)
        )
      );
    }
  }),

  /**
   * Test: Component must have ground
   */
  hasGround: (componentName) => ({
    name: 'Ground Connection',
    description: `${componentName} must be connected to ground`,
    points: 15,
    failureMessage: `${componentName} is not connected to ground`,
    validate: (components, wires) => {
      const component = components.find(c => 
        c.name?.toLowerCase().includes(componentName.toLowerCase())
      );
      
      if (!component) return false;
      
      const groundPins = component.pins?.filter(pin => 
        pin.type?.toLowerCase().includes('gnd') || 
        pin.type?.toLowerCase().includes('ground')
      ) || [];
      
      return groundPins.some(pin => 
        wires.some(wire => 
          (wire.from.compId === component.instanceId && wire.from.pinId === pin.id) ||
          (wire.to.compId === component.instanceId && wire.to.pinId === pin.id)
        )
      );
    }
  }),

  /**
   * Test: Two components must be connected
   */
  componentsConnected: (comp1Name, comp2Name) => ({
    name: 'Component Connection',
    description: `${comp1Name} must be connected to ${comp2Name}`,
    points: 25,
    failureMessage: `${comp1Name} and ${comp2Name} are not connected`,
    validate: (components, wires) => {
      const comp1 = components.find(c => 
        c.name?.toLowerCase().includes(comp1Name.toLowerCase())
      );
      const comp2 = components.find(c => 
        c.name?.toLowerCase().includes(comp2Name.toLowerCase())
      );
      
      if (!comp1 || !comp2) return false;
      
      return wires.some(wire => 
        (wire.from.compId === comp1.instanceId && wire.to.compId === comp2.instanceId) ||
        (wire.from.compId === comp2.instanceId && wire.to.compId === comp1.instanceId)
      );
    }
  }),

  /**
   * Test: Minimum number of components
   */
  minComponents: (minCount) => ({
    name: 'Component Count',
    description: `Circuit must have at least ${minCount} components`,
    points: 10,
    failureMessage: `Circuit needs at least ${minCount} components`,
    validate: (components) => {
      return components.length >= minCount;
    }
  })
};

