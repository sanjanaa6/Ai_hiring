import React, { useState, useEffect, useRef } from 'react';
import { TooltipProvider } from './ui/tooltip';

const PCBRoundInterface = ({
  question,
  onAnswerSubmit,
  isDarkMode = true,
  timeLimit = 6,
  onTimeUp
}) => {
  const [canvasState, setCanvasState] = useState({
    components: [],
    wires: [],
    wireGroups: {}
  });
  
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [currentWire, setCurrentWire] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleTimeUp();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isSubmitted]);

  const handleTimeUp = () => {
    setIsSubmitted(true);
    if (onTimeUp) {
      onTimeUp();
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCanvasStateChange = (newState) => {
    setCanvasState(newState);
  };

  const handleComponentClick = (componentId, event) => {
    setSelectedComponent(componentId);
    event.stopPropagation();
  };

  const handlePinClick = (componentId, pinId, pinX, pinY, pin) => {
    if (!isDrawingWire) {
      // Start drawing wire
      setIsDrawingWire(true);
      setCurrentWire({
        startComponent: componentId,
        startPin: pinId,
        startX: pinX,
        startY: pinY,
        endX: pinX,
        endY: pinY
      });
    } else {
      // Complete wire
      const newWire = {
        id: `wire_${Date.now()}`,
        startComponent: currentWire.startComponent,
        startPin: currentWire.startPin,
        endComponent: componentId,
        endPin: pinId,
        startX: currentWire.startX,
        startY: currentWire.startY,
        endX: pinX,
        endY: pinY
      };
      
      setCanvasState(prev => ({
        ...prev,
        wires: [...prev.wires, newWire]
      }));
      
      setIsDrawingWire(false);
      setCurrentWire(null);
    }
  };

  const handleCanvasClick = (event) => {
    if (isDrawingWire) {
      // Cancel wire drawing
      setIsDrawingWire(false);
      setCurrentWire(null);
    }
    setSelectedComponent(null);
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    
    const pcbDesignData = {
      components: canvasState.components,
      wires: canvasState.wires,
      designNotes: answer,
      timeSpent: (timeLimit * 60) - timeLeft
    };
    
    if (onAnswerSubmit) {
      onAnswerSubmit(pcbDesignData);
    }
  };

  const getAvailableComponents = () => {
    if (!question.pcbDesign || !question.pcbDesign.components) {
      return [
        'Resistor', 'Capacitor', 'Microcontroller', 'Connector', 'LED', 
        'Transistor', 'Diode', 'Inductor', 'Crystal', 'Switch'
      ];
    }
    return question.pcbDesign.components;
  };

  const getDesignConstraints = () => {
    if (!question.pcbDesign || !question.pcbDesign.constraints) {
      return "Design a functional PCB layout with proper component placement and routing.";
    }
    return question.pcbDesign.constraints;
  };

  const getEvaluationCriteria = () => {
    if (!question.pcbDesign || !question.pcbDesign.evaluationCriteria) {
      return "Component placement, routing quality, design for manufacturability";
    }
    return question.pcbDesign.evaluationCriteria;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PCB Design Challenge
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Time: {formatTime(timeLeft)} | Status: {isSubmitted ? 'Submitted' : 'In Progress'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Components */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Available Components
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {getAvailableComponents().map((component, index) => (
                    <button
                      key={index}
                      className="p-3 text-sm bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-zinc-600 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                      onClick={() => {
                        // Add component to canvas
                        const newComponent = {
                          id: `comp_${Date.now()}_${index}`,
                          name: component,
                          type: 'Passive',
                          x: 100 + (index % 3) * 150,
                          y: 100 + Math.floor(index / 3) * 100,
                          width_px: 80,
                          height_px: 60,
                          pins: [
                            { id: 'pin1', x_px: 0, y_px: 30, type: 'digital', label: '1' },
                            { id: 'pin2', x_px: 80, y_px: 30, type: 'digital', label: '2' }
                          ]
                        };
                        setCanvasState(prev => ({
                          ...prev,
                          components: [...prev.components, newComponent]
                        }));
                      }}
                    >
                      {component}
                    </button>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Design Constraints
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {getDesignConstraints()}
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Evaluation Criteria
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {getEvaluationCriteria()}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {question.question}
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {question.expectedAnswer}
                </div>

                {/* Simplified PCB Canvas */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    PCB Design Canvas
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 min-h-[300px] bg-gray-50 dark:bg-zinc-900">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">🔧</div>
                      <p className="text-sm">Interactive PCB Design Interface</p>
                      <p className="text-xs mt-2">
                        Components placed: {canvasState.components.length} | 
                        Connections: {canvasState.wires.length}
                      </p>
                    </div>
                    
                    {/* Simple component visualization */}
                    {canvasState.components.map((component, index) => (
                      <div
                        key={component.id}
                        className="absolute bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded p-2 text-xs"
                        style={{
                          left: `${component.x}px`,
                          top: `${component.y}px`,
                          width: `${component.width_px}px`,
                          height: `${component.height_px}px`
                        }}
                      >
                        {component.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Design Notes & Explanation:
                  </label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Explain your PCB design choices, component selection rationale, and any design considerations..."
                    className="w-full p-3 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    disabled={isSubmitted}
                  />
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isSubmitted ? 'Design submitted successfully' : 'Click Submit when finished with your PCB design'}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitted}
                    className={`px-6 py-2 rounded-md font-medium transition-colors ${
                      isSubmitted
                        ? 'bg-gray-300 dark:bg-zinc-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSubmitted ? 'Submitted' : 'Submit Design'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PCBRoundInterface;
