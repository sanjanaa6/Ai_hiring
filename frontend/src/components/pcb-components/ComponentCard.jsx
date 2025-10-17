import React from 'react';
import * as Icons from 'lucide-react';

const LucideIcon = ({ name, getIcon, ...props }) => {
  // First try to get the icon directly from Lucide
  let Icon = Icons[name];
  
  // If not found and getIcon function is provided, try to get a fallback icon
  if (!Icon && getIcon) {
    const FallbackIcon = getIcon(name);
    if (FallbackIcon) {
      Icon = FallbackIcon;
    } else {
      // Default fallback
      Icon = Icons.HelpCircle;
    }
  } else if (!Icon) {
    // Default fallback if no getIcon function
    Icon = Icons.HelpCircle;
  }
  
  return <Icon {...props} />;
};

const ComponentCard = ({ 
  id, 
  name, 
  icon, 
  type, 
  footprint, 
  width_px, 
  height_px, 
  dimensions, 
  pins, 
  tags, 
  isDarkMode, 
  onDragStart, 
  getIcon,
  resistance,
  color_code,
  color_hex,
  voltage,
  description
}) => {
  const handleDragStart = (event) => {
    // Clear any previous data transfer
    event.dataTransfer.clearData();
    
    // Create the component data to transfer - include ALL properties
    const componentData = {
      id,
      name,
      type,
      icon,
      footprint,
      width_px,
      height_px,
      dimensions,
      pins,
      tags,
      resistance,
      color_code,
      color_hex,
      voltage,
      description
    };
    
    console.log('Sidebar: Dragging component:', componentData);
    
    // Set the data transfer with component info - this specific format is expected by the Canvas
    event.dataTransfer.setData("component", JSON.stringify(componentData));
    event.dataTransfer.effectAllowed = "copy";
    
    // Add a visual element for dragging
    const dragIcon = document.createElement('div');
    dragIcon.classList.add('drag-icon');
    dragIcon.textContent = name;
    dragIcon.style.color = 'transparent'; // Make it invisible but still used
    document.body.appendChild(dragIcon);
    event.dataTransfer.setDragImage(dragIcon, 0, 0);
    
    setTimeout(() => {
      document.body.removeChild(dragIcon);
    }, 0);
    
    // Call the parent's onDragStart if provided
    if (onDragStart) onDragStart(id);
  };

  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      className={`flex flex-col items-center justify-center p-2 rounded-lg ${
        isDarkMode 
          ? 'bg-zinc-800 hover:bg-zinc-700' 
          : 'bg-gray-100 hover:bg-gray-200'
      } hover:scale-105 transition-all cursor-pointer text-center min-h-[80px]`}
      title={`${name}${voltage ? ` - ${voltage}` : ''}${resistance ? ` - ${resistance}` : ''}${description ? `\n${description}` : ''}`}
    >
      <LucideIcon 
        name={icon} 
        getIcon={getIcon} 
        className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} 
      />
      
      {/* Show color code bands for resistors */}
      {type === 'Resistor' && color_hex && color_hex.length >= 4 && (
        <div className="flex gap-0.5 mt-1 mb-1">
          {color_hex.map((color, index) => (
            <div
              key={index}
              className="w-2 h-5 rounded-sm border border-gray-400"
              style={{ backgroundColor: color }}
              title={color_code ? color_code[index] : ''}
            />
          ))}
        </div>
      )}
      
      {/* Show voltage badge for power supplies and batteries */}
      {voltage && (type === 'Power Supply' || type === 'Battery') && (
        <div className="px-1.5 py-0.5 mt-1 mb-1 text-[10px] font-bold rounded bg-yellow-500 text-black">
          {voltage}
        </div>
      )}
      
      <p className={`mt-1 text-xs ${isDarkMode ? 'text-white' : 'text-black'} truncate w-full px-1`}>{name}</p>
      {resistance && (
        <p className={`text-[10px] font-mono ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>{resistance}</p>
      )}
      <p className={`text-[9px] opacity-60 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate w-full`}>{type}</p>
    </div>
  );
};

export default ComponentCard; 
