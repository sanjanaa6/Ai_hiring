import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const PCBComponent = ({
  id,
  name,
  type,
  icon,
  x,
  y,
  width_px,
  height_px,
  footprint,
  pins = [],
  isDarkMode,
  isSelected,
  onPinClick,
  onClick,
  onDragStart,
  onDragEnd,
  scale = 1, // Scale factor for zoom
  onDrag,
  pan,
  simulationState = {},
  showSimulation = false
}) => {
  // State to track active hover pin for enlarged tooltip
  const [hoveredPin, setHoveredPin] = useState(null);
  
  // State for mouse-based dragging (not HTML5 drag)
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const mouseDownPos = React.useRef({ x: 0, y: 0 });
  const hasMoved = React.useRef(false);

  // Find the corresponding Lucide icon
  const getComponentIcon = () => {
    if (Icons[icon]) {
      return Icons[icon];
    }

    // Default fallback icons based on component type
    const fallbackIcons = {
      'IC': Icons.Cpu,
      'Passive': Icons.Layers,
      'Active': Icons.Zap,
      'Connector': Icons.Plug,
      'Sensor': Icons.Radio,
      'Misc': Icons.Settings
    };

    return fallbackIcons[type] || Icons.HelpCircle;
  };

  const ComponentIcon = getComponentIcon();

  // Mouse-based drag handlers (simple and reliable)
  const handleMouseDown = (e) => {
    // Prevent drag start from pins
    if (e.target.classList.contains('pin')) {
      return;
    }

    e.stopPropagation();
    
    // Store the mouse down position
    mouseDownPos.current = {
      x: e.clientX,
      y: e.clientY
    };
    hasMoved.current = false;
    
    setIsDragging(true);
    
    // Calculate offset from component position to mouse
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    if (onDragStart) onDragStart(id);
  };

  // Global mouse move and up handlers
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      // Check if mouse has moved enough to be considered a drag (threshold: 5 pixels)
      const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
      
      if (deltaX > 5 || deltaY > 5) {
        hasMoved.current = true;
        
        // Get canvas element
        const canvas = document.querySelector('[data-canvas="true"]');
        if (!canvas) return;

        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate new position
        const newX = (e.clientX - canvasRect.left - dragOffset.current.x - pan.x) / scale;
        const newY = (e.clientY - canvasRect.top - dragOffset.current.y - pan.y) / scale;
        
        if (onDrag) {
          onDrag(id, newX, newY);
        }
      }
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      
      // If the mouse didn't move much, treat it as a click for selection
      if (!hasMoved.current) {
        // Stop propagation to prevent canvas click handler from deselecting
        e.stopPropagation();
        e.preventDefault();
        
        // This was a click, not a drag - trigger onClick for selection
        if (onClick) {
          onClick(id, e);
        }
      }
      
      if (onDragEnd) onDragEnd(id);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, id, onDrag, onDragEnd, onDragStart, onClick, pan, scale]);

  // Handle component click
  const handleClick = (e) => {
    // Don't trigger if we clicked on a pin
    if (e.target.classList.contains('pin')) return;
    
    if (onClick) onClick(id, e);
  };

  // Handle pin click for wire drawing
  const handlePinClick = (pinId, pinX, pinY, pin, e) => {
    e.stopPropagation(); // Prevent component click from triggering
    
    // Ensure we're passing the proper pin coordinates (not scaled)
    // These are the original pin coordinates relative to the component
    if (onPinClick) {
      console.log(`PCBComponent: Pin clicked - ${name} (${id}) - Pin: ${pinId} at (${pinX}, ${pinY})`);
      onPinClick(id, pinId, pinX, pinY, pin);
    }
  };

  // Dynamically determine the component width and height
  const componentWidth = width_px || 100;
  const componentHeight = height_px || 80;

  // Calculate icon size and position
  const iconSize = Math.min(componentWidth, componentHeight) * 0.3;
  const iconX = componentWidth / 2 - iconSize / 2;
  const iconY = componentHeight / 2 - iconSize / 2;

  // Determine colors based on dark/light mode and selection state
  const bgColor = isDarkMode ? 'bg-zinc-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const borderColor = isSelected 
    ? (isDarkMode ? 'border-cyan-500' : 'border-blue-500')
    : (isDarkMode ? 'border-zinc-700' : 'border-gray-300');
  
  // Determine different pin types and colors
  const getPinColor = (pinType) => {
    if (!pinType) return isDarkMode ? 'bg-gray-500' : 'bg-gray-400';
    
    const type = pinType.toLowerCase();
    
    if (type.includes('power') || type.includes('vcc')) {
      return isDarkMode ? 'bg-red-600' : 'bg-red-500';
    }
    
    if (type.includes('ground') || type.includes('gnd')) {
      return isDarkMode ? 'bg-blue-600' : 'bg-blue-500';
    }
    
    if (type.includes('digital')) {
      return isDarkMode ? 'bg-green-600' : 'bg-green-500';
    }
    
    if (type.includes('analog')) {
      return isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500';
    }
    
    if (type.includes('clock') || type.includes('reset')) {
      return isDarkMode ? 'bg-purple-600' : 'bg-purple-500';
    }
    
    return isDarkMode ? 'bg-gray-500' : 'bg-gray-400';
  };

  // Determine the pin color for the tooltip
  const getPinTextColor = (pinType) => {
    if (!pinType) return 'text-gray-500';
    
    const type = pinType.toLowerCase();
    
    if (type.includes('power') || type.includes('vcc')) {
      return 'text-red-500';
    }
    
    if (type.includes('ground') || type.includes('gnd')) {
      return 'text-blue-500';
    }
    
    if (type.includes('digital')) {
      return 'text-green-500';
    }
    
    if (type.includes('analog')) {
      return 'text-yellow-500';
    }
    
    if (type.includes('clock') || type.includes('reset')) {
      return 'text-purple-500';
    }
    
    return 'text-gray-500';
  };
  
  // Calculate pin size based on scale for better visibility when zoomed
  const pinSize = scale < 0.5 ? 4 : 3;
  const pinLabelSize = scale < 0.5 ? "text-[0.8rem]" : "text-[0.65rem]";
  
  // Determine if pin labels should be shown or only on hover based on zoom level
  const showPinLabels = scale > 0.3;

  return (
    <TooltipProvider>
      <div
        id={id}
        data-component="true"
        className={`absolute ${bgColor} rounded-md shadow-lg border-2 ${borderColor} select-none cursor-move z-20 ${
          isSelected ? 'ring-2 ring-offset-1 ring-opacity-70 ' + (isDarkMode ? 'ring-cyan-500' : 'ring-blue-500') : ''
        } ${showSimulation && simulationState.highlight && type === 'LED' ? 'animate-pulse' : ''}`}
        style={{ 
          left: `${x * scale}px`, 
          top: `${y * scale}px`,
          width: `${componentWidth * scale}px`,
          height: `${componentHeight * scale}px`,
          transformOrigin: 'top left',
          backgroundColor: showSimulation && simulationState.highlight ? simulationState.highlight : 'transparent',
          boxShadow: isSelected
            ? `0 0 0 2px ${isDarkMode ? '#3b82f6' : '#2563eb'}`
            : showSimulation && simulationState.highlight 
              ? type === 'LED' 
                ? `0 0 20px ${simulationState.highlight}, 0 0 40px ${simulationState.highlight}, 0 0 60px ${simulationState.highlight}`
                : `0 0 8px ${simulationState.highlight}`
              : 'none',
          transition: isDragging ? 'none' : 'box-shadow 0.2s, background-color 0.3s',
          transform: showSimulation && simulationState.rotation ? `rotate(${simulationState.rotation}deg)` : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Component Icon and Name */}
        <div className="flex flex-col items-center justify-center h-full relative pointer-events-none">
          <ComponentIcon className={`h-${iconSize} w-${iconSize} ${textColor} opacity-70`} 
            style={{ width: iconSize, height: iconSize }} />
          <div className={`text-center text-sm ${textColor} mt-1 px-1 font-medium`}
            style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}>
            {name}
          </div>
          <div className={`text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} 
            style={{ fontSize: `${Math.max(8, 10 * scale)}px` }}>
            {footprint || type}
          </div>
        </div>
        
        {/* Pin positions */}
        {pins.map((pin) => {
          const pinColor = getPinColor(pin.type);
          const pinTextColor = getPinTextColor(pin.type);
          
          // Skip pins that don't have position information
          if (pin.x_px === undefined || pin.y_px === undefined) return null;
          
          // Determine if the pin is on an edge (for label positioning)
          const isLeft = pin.x_px === 0;
          const isRight = pin.x_px === componentWidth;
          const isTop = pin.y_px === 0;
          const isBottom = pin.y_px === componentHeight;
          
          // Calculate position for label based on pin position
          let labelPosition;
          if (isLeft) labelPosition = 'left';
          else if (isRight) labelPosition = 'right';
          else if (isTop) labelPosition = 'top';
          else if (isBottom) labelPosition = 'bottom';
          else labelPosition = 'center'; // for pins not on edges
          
          // Determine label styles based on position and zoom
          const getLabelStyles = () => {
            const baseStyles = `${pinLabelSize} whitespace-nowrap absolute pointer-events-none`;
            
            switch (labelPosition) {
              case 'left':
                return `${baseStyles} left-2 transform -translate-y-1/2`;
              case 'right':
                return `${baseStyles} right-2 transform -translate-y-1/2 text-right`;
              case 'top':
                return `${baseStyles} top-1 transform -translate-x-1/2 text-center`;
              case 'bottom':
                return `${baseStyles} bottom-1 transform -translate-x-1/2 text-center`;
              default:
                return `${baseStyles} transform -translate-x-1/2 -translate-y-1/2`;
            }
          };
          
          // Get pin state from simulation
          const pinState = showSimulation && 
            simulationState.states?.pins && 
            simulationState.states.pins[pin.id];
          
          // Determine pin highlight color based on state
          let pinHighlight = null;
          if (pinState) {
            if (pinState.type === 'digital') {
              pinHighlight = pinState.value === 1 ? '#ef4444' : '#3b82f6';
            } else if (pinState.type === 'analog') {
              // Create color gradient based on analog value (0-255)
              const intensity = Math.min(255, Math.max(0, pinState.value)) / 255;
              pinHighlight = `rgba(239, 68, 68, ${intensity})`;
            }
          }
          
          return (
            <Tooltip key={pin.id}>
              <TooltipTrigger asChild>
                <div 
                  className={`pin absolute ${pinColor} rounded-full cursor-pointer pointer-events-auto
                    hover:ring-2 ${isDarkMode ? 'hover:ring-white' : 'hover:ring-black'} hover:ring-opacity-30
                    transition-all duration-150 ease-in-out z-30`}
                  style={{
                    left: `${pin.x_px * scale}px`,
                    top: `${pin.y_px * scale}px`,
                    width: `${pinSize * Math.max(1, scale)}px`,
                    height: `${pinSize * Math.max(1, scale)}px`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: showSimulation && pinHighlight ? pinHighlight : '',
                    boxShadow: showSimulation && pinHighlight ? `0 0 5px ${pinHighlight}` : '',
                  }}
                  onMouseEnter={() => setHoveredPin(pin.id)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={(e) => handlePinClick(pin.id, pin.x_px, pin.y_px, pin, e)}
                >
                  {/* Larger hit area for easier interaction */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${Math.max(10, 12 * scale)}px`,
                      height: `${Math.max(10, 12 * scale)}px`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: -1
                    }}
                  />
                  
                  {/* Show pin label (e.g., +, -, +5V) or ID on hover if zoom allows */}
                  {showPinLabels && (
                    <div 
                      className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${getLabelStyles()}`}
                      style={{ 
                        opacity: hoveredPin === pin.id ? 1 : 0.7,
                        fontWeight: 'bold',
                        fontSize: hoveredPin === pin.id ? `${Math.max(11, 12 * scale)}px` : `${Math.max(9, 10 * scale)}px`
                      }}
                    >
                      {pin.label || pin.id}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className={`${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-800 text-white'} p-2 rounded shadow-lg max-w-[220px]`}
              >
                <div className="flex flex-col space-y-1">
                  <div className={`font-medium ${pinTextColor}`}>{pin.id}</div>
                  {pin.designation && <div className="text-xs">{pin.designation}</div>}
                  {pin.type && <div className="text-xs">{pin.type}</div>}
                  {pin.voltage && <div className="text-xs">Voltage: {pin.voltage}</div>}
                  {pin.current && <div className="text-xs">Current: {pin.current}</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default PCBComponent; 