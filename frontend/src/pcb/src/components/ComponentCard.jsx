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

const ComponentCard = ({ id, name, icon, type, footprint, width_px, height_px, dimensions, pins, tags, isDarkMode, onDragStart, getIcon }) => {
  const handleDragStart = (event) => {
    // Clear any previous data transfer
    event.dataTransfer.clearData();
    
    // Create the component data to transfer
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
      tags
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
      } hover:scale-105 transition-all cursor-pointer text-center`}
      title={name}
    >
      <LucideIcon 
        name={icon} 
        getIcon={getIcon} 
        className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} 
      />
      <p className={`text-xs mt-1 ${isDarkMode ? 'text-white' : 'text-black'} truncate w-full`}>{name}</p>
    </div>
  );
};

export default ComponentCard; 