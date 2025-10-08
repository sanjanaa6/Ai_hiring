import React, { useState, useEffect, useRef, useCallback } from 'react';
import PCBComponent from './PCBComponent';
import { Trash2, ZoomIn, ZoomOut, Move, Grid, Layout, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Grid cell size for snapping (in pixels)
const GRID_SIZE = 10; // 1mm = 10px

const Canvas = ({ 
  isDarkMode,
  componentStates = {},
  components: externalComponents = [],
  wires: externalWires = [],
  wireGroups: externalWireGroups = {},
  onCanvasStateChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  // Debug: Log when props change
  console.log('[Canvas] Props received:', {
    componentCount: externalComponents.length,
    wireCount: externalWires.length,
    componentStatesCount: Object.keys(componentStates).length,
    components: externalComponents.map(c => ({ name: c.name, id: c.instanceId }))
  });
  
  // State for loaded component templates from JSON
  const [componentTemplates, setComponentTemplates] = useState([]);
  
  // Add state for simulation visualization
  const [showSimulation, setShowSimulation] = useState(false);
  
  // State for wire drawing
  const [drawingWire, setDrawingWire] = useState(false);
  const [startPin, setStartPin] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [groupCategories] = useState([
    { id: 'power', name: 'Power', color: '#ef4444', darkColor: '#b91c1c' },
    { id: 'ground', name: 'Ground', color: '#1d4ed8', darkColor: '#1e40af' },
    { id: 'digital', name: 'Digital', color: '#16a34a', darkColor: '#166534' },
    { id: 'analog', name: 'Analog', color: '#eab308', darkColor: '#ca8a04' },
    { id: 'control', name: 'Control', color: '#8b5cf6', darkColor: '#7c3aed' },
    { id: 'custom', name: 'Custom', color: '#ec4899', darkColor: '#db2777' }
  ]);
  
  // State for selection
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedWire, setSelectedWire] = useState(null);
  
  // State for drag indicator
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // State for zoom and pan
  const [scale, setScale] = useState(1); // Keep fixed scale of 1 (no zoom)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 5000, height: 5000 }); // Default large canvas size
  
  // State for grid snapping
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Refs
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  
  // Add state for wire editing and deletion
  const [editingWire, setEditingWire] = useState(null);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [draggedSegment, setDraggedSegment] = useState(null);
  const [hoverSegment, setHoverSegment] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0); // Track time for double-click
  const [deleteMode, setDeleteMode] = useState(false); // Track delete mode
  // Track previous component count to avoid noisy warnings on initial load
  const prevComponentCountRef = useRef(0);

  useEffect(() => {
    if (prevComponentCountRef.current > 0 && externalComponents.length === 0) {
      console.warn('[Canvas] Components became empty after having items. This is usually okay when clearing the canvas.');
    }
    prevComponentCountRef.current = externalComponents.length;
  }, [externalComponents.length]);
  
  // Load component data from JSON (supports /pcb/ base path)
  useEffect(() => {
    const fetchComponentTemplates = async () => {
      try {
        const pathname = window.location.pathname || '/';
        const base = pathname.startsWith('/pcb') ? '/pcb/' : '/';

        const candidateUrls = [
          `${base}enriched_components.json`,
          `${base}components.json`,
          // extra fallbacks just in case
          '/pcb/enriched_components.json',
          '/pcb/components.json',
          '/enriched_components.json',
          '/components.json'
        ];

        let loaded = false;
        for (const url of candidateUrls) {
          try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (!resp.ok) continue;
            const data = await resp.json();
            if (data && Array.isArray(data.components)) {
              setComponentTemplates(data.components);
              loaded = true;
              break;
            }
          } catch (_) {
            // try next candidate
          }
        }

        if (!loaded) {
          throw new Error('No component definition file found');
        }
      } catch (error) {
        console.error('Error loading component data:', error);
        // keep UI usable with empty list instead of hard-failing
        setComponentTemplates([]);
      }
    };

    fetchComponentTemplates();
  }, []);
  
  // Snap value to grid
  const snapToGridValue = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [snapToGrid]);
  
  // Convert canvas coordinates to content coordinates
  const canvasToContent = useCallback((canvasX, canvasY) => {
    return {
      x: (canvasX - pan.x) / scale,
      y: (canvasY - pan.y) / scale
    };
  }, [pan, scale]);
  
  // Convert content coordinates to canvas coordinates
  const contentToCanvas = useCallback((contentX, contentY) => {
    return {
      x: contentX * scale + pan.x,
      y: contentY * scale + pan.y
    };
  }, [pan, scale]);
  
  // Helper functions to manage state changes for undo/redo
  const updateComponents = (newComponentsOrFn) => {
    const newComponents = typeof newComponentsOrFn === 'function' 
      ? newComponentsOrFn(externalComponents) 
      : newComponentsOrFn;
    console.log('[Canvas] updateComponents called:', {
      currentCount: externalComponents.length,
      newCount: newComponents.length,
      currentComponents: externalComponents.map(c => c.name),
      newComponents: newComponents.map(c => c.name)
    });
    onCanvasStateChange(newComponents, externalWires, externalWireGroups);
  };

  const updateWires = (newWiresOrFn) => {
    const newWires = typeof newWiresOrFn === 'function' 
      ? newWiresOrFn(externalWires) 
      : newWiresOrFn;
    onCanvasStateChange(externalComponents, newWires, externalWireGroups);
  };

  const updateWireGroups = (newWireGroupsOrFn) => {
    const newWireGroups = typeof newWireGroupsOrFn === 'function' 
      ? newWireGroupsOrFn(externalWireGroups) 
      : newWireGroupsOrFn;
    onCanvasStateChange(externalComponents, externalWires, newWireGroups);
  };

  const updateAllState = (newComponents, newWires, newWireGroups) => {
    const finalComponents = newComponents || externalComponents;
    const finalWires = newWires || externalWires;
    const finalWireGroups = newWireGroups || externalWireGroups;
    
    // CRITICAL SAFETY CHECK: NEVER save empty component array
    if (!finalComponents || finalComponents.length === 0) {
      console.error('[Canvas] BLOCKED: Refusing to save empty component array!');
      return; // DON'T SAVE EMPTY STATE
    }
    
    // Verify all components have required properties
    const validComponents = finalComponents.every(c => c && c.instanceId && c.name);
    if (!validComponents) {
      console.error('[Canvas] BLOCKED: Some components are invalid!');
      return;
    }
    
    // Save the state
    onCanvasStateChange(finalComponents, finalWires, finalWireGroups);
  };
  
  // Handle component drop from sidebar
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Get component data
    const componentData = e.dataTransfer.getData('component');
    
    // If no component data, this might be a component being repositioned (not from sidebar)
    // In that case, we should ignore this drop event as it's handled by PCBComponent's dragEnd
    if (!componentData) {
      console.log('[Canvas] handleDrop: No component data, ignoring (component reposition handled by dragEnd)');
      return;
    }
    
    try {
      const componentInfo = JSON.parse(componentData);
      
      // Look up the component template for additional data
      const template = componentTemplates.find(t => t.id === componentInfo.id);
      
      // Calculate drop position relative to canvas
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const rawDropX = e.clientX - canvasRect.left;
      const rawDropY = e.clientY - canvasRect.top;
      
      console.log(`Canvas Drop - Raw X: ${rawDropX}, Y: ${rawDropY}`);
      
      // Convert to content coordinates
      const contentCoords = canvasToContent(rawDropX, rawDropY);
      
      // Apply grid snapping
      const dropX = snapToGridValue(contentCoords.x);
      const dropY = snapToGridValue(contentCoords.y);
      
      console.log(`Canvas Drop - Final X: ${dropX}, Y: ${dropY}`);
      
      // Get dimensions from template or use defaults
      const width = template?.canvas?.width_px || template?.dimensions?.width_mm * 10 || 80;
      const height = template?.canvas?.height_px || template?.dimensions?.height_mm * 10 || 60;
      
      // Process pins if available in template
      const pins = template?.pins?.map(pin => ({
        ...pin,
        // Make sure we have pixel coordinates
        x_px: pin.x_px !== undefined ? pin.x_px : (pin.x_mm * 10),
        y_px: pin.y_px !== undefined ? pin.y_px : (pin.y_mm * 10),
        // Ensure we have all pin metadata
        id: pin.id || `pin-${Math.random().toString(36).substr(2, 9)}`,
        type: pin.type || 'Digital IO',
        designation: pin.designation || '',
        voltage: pin.voltage || '',
        current: pin.current || '',
        tolerance: pin.tolerance || ''
      })) || [];
      
      // Add component to canvas with a unique instance ID
      const newComponent = {
        ...componentInfo,
        instanceId: `${componentInfo.id}-${Date.now()}`,
        x: dropX,
        y: dropY,
        width_px: width,
        height_px: height,
        footprint: template?.footprint,
        pins: pins
      };
      
      console.log('Dropping component:', newComponent);
      console.log('[Canvas] Before adding component - current components:', externalComponents.map(c => c.name));
      updateComponents([...externalComponents, newComponent]);
      // Select the newly added component
      setSelectedComponent(newComponent.instanceId);
      setSelectedWire(null);
    } catch (error) {
      console.error('Error parsing component data:', error);
    }
  };
  
  // Allow drop and show visual indicator
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };
  
  // Reset drag indicator when leaving canvas
  const handleDragLeave = (e) => {
    // Only trigger if we're actually leaving the canvas, not entering a child element
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  };
  
  // Handle wire drawing when a pin is clicked
  const handlePinClick = (compId, pinId, pinX, pinY, pin) => {
    console.log("Pin clicked:", { compId, pinId, pinX, pinY, pin });
    
    const component = externalComponents.find(comp => comp.instanceId === compId);
    if (!component) {
      console.error("Component not found:", compId);
      return;
    }
    
    // Calculate absolute pin position in content space
    const absolutePinX = component.x + pinX;
    const absolutePinY = component.y + pinY;

    if (!drawingWire) {
      // Starting to draw a wire
      console.log("Starting wire from:", component.name, pin.id, "at", absolutePinX, absolutePinY);
      setDrawingWire(true);
      setStartPin({
        compId,
        pinId,
        absX: absolutePinX, // Store absolute content coordinates 
        absY: absolutePinY,
        pin: pin  // Store the full pin object
      });
    } else {
      // Finishing a wire if it's a different pin
      console.log("Ending wire at:", component.name, pin.id, "at", absolutePinX, absolutePinY);
      
      // Only create wire if connecting to a different pin
      if (startPin.pinId !== pinId || startPin.compId !== compId) {
        const newWire = {
          id: `wire-${Date.now()}`,
          from: {
            compId: startPin.compId,
            pinId: startPin.pinId,
            x: startPin.absX,  // Absolute content coordinates
            y: startPin.absY,
            pin: startPin.pin  // Reference to the pin object
          },
          to: {
            compId,
            pinId,
            x: absolutePinX,  // Absolute content coordinates
            y: absolutePinY,
            pin: pin  // Reference to the pin object
          },
          // Add routing data for orthogonal paths
          routing: 'orthogonal',
          routingPoints: calculateOrthogonalRoute(
            startPin.absX, 
            startPin.absY, 
            absolutePinX, 
            absolutePinY
          )
        };
        
        console.log("Creating wire with coordinates:", {
          from: { x: newWire.from.x, y: newWire.from.y },
          to: { x: newWire.to.x, y: newWire.to.y },
          routingPoints: newWire.routingPoints
        });
        
        updateWires(prevWires => [...prevWires, newWire]);
      } else {
        console.log("Canceled wire - same pin");
      }
      
      // Reset drawing state
      setDrawingWire(false);
      setStartPin(null);
    }
  };
  
  // Calculate orthogonal route between two points (Manhattan routing)
  const calculateOrthogonalRoute = (x1, y1, x2, y2, existingPoints = []) => {
    // If there are custom routing points, use them
    if (existingPoints && existingPoints.length > 0) {
      // Make sure the first and last points match the endpoints
      const adjustedPoints = [...existingPoints];
      
      // Ensure the first point matches the source
      adjustedPoints[0] = { x: x1, y: y1 };
      
      // Ensure the last point matches the destination
      adjustedPoints[adjustedPoints.length - 1] = { x: x2, y: y2 };
      
      return adjustedPoints;
    }
    
    // Eagle-style professional routing with multiple segments
    // First determine the preferred initial direction (horizontal or vertical)
    const horizontalFirst = Math.abs(x2 - x1) > Math.abs(y2 - y1);
    
    // Create clean 90-degree turns with proper spacing
    if (horizontalFirst) {
      // For horizontal-first routing
      const deltaX = Math.abs(x2 - x1);
      const midX = x1 + (x2 - x1) / 2;
      
      // For very short wires, use simple 2-segment routing
      if (deltaX < 20) {
        return [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 }
        ];
      }
      
      // For longer wires, use professional 3-segment routing (with midpoint)
      return [
        { x: x1, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: x2, y: y2 }
      ];
    } else {
      // For vertical-first routing
      const deltaY = Math.abs(y2 - y1);
      const midY = y1 + (y2 - y1) / 2;
      
      // For very short wires, use simple 2-segment routing
      if (deltaY < 20) {
        return [
          { x: x1, y: y1 },
          { x: x1, y: y2 },
          { x: x2, y: y2 }
        ];
      }
      
      // For longer wires, use professional 3-segment routing (with midpoint)
      return [
        { x: x1, y: y1 },
        { x: x1, y: midY },
        { x: x2, y: midY },
        { x: x2, y: y2 }
      ];
    }
  };
  
  // Handle mouse movement - for wire drawing or panning
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - canvasRect.left;
    const rawY = e.clientY - canvasRect.top;
    
    // If panning, update pan position
    if (isPanning && lastPanPoint) {
      const deltaX = rawX - lastPanPoint.x;
      const deltaY = rawY - lastPanPoint.y;
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: rawX, y: rawY });
      
      // Auto-expand canvas if needed (when approaching edges)
      const threshold = 200; // pixels from edge to trigger expansion
      if (Math.abs(pan.x) > canvasSize.width - canvasRect.width - threshold ||
          Math.abs(pan.y) > canvasSize.height - canvasRect.height - threshold) {
        setCanvasSize(prev => ({
          width: prev.width + 1000,
          height: prev.height + 1000
        }));
      }
      
      // Use debounced wire update during panning to prevent constant recalculation
      // This significantly reduces the "floating wire" effect during panning
      if (!window.wirePanUpdateTimer) {
        window.wirePanUpdateTimer = setTimeout(() => {
          window.wirePanUpdateTimer = null;
          // Only update wire endpoints when panning stops or slows down
          updateWireEndpoints();
        }, 50); // Short delay to make wires feel responsive but avoid constant updates
      }
    } else {
      // Otherwise, update mouse position for wire drawing
      const contentCoords = canvasToContent(rawX, rawY);
      setMousePosition(contentCoords);
    }
  };

  // Handle mouse down for panning - make it work with any mouse button
  const handleMouseDown = (e) => {
    // Only pan when space is held or middle mouse button is pressed
    // This prevents canvas panning when trying to move components
    if (e.button === 1 || (e.button === 0 && e.getModifierState('Space'))) {
      setIsPanning(true);
      setLastPanPoint({ 
        x: e.clientX - canvasRef.current.getBoundingClientRect().left, 
        y: e.clientY - canvasRef.current.getBoundingClientRect().top 
      });
      // Prevent default browser behavior
      e.preventDefault();
    }
  };

  // Prevent context menu to allow right-click panning
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Replace wheel handling with scroll handling
  const handleScroll = (e) => {
    // No zoom, just scroll the canvas
    if (!canvasRef.current) return;
    
    // Update wire endpoints after scrolling
    updateWireEndpoints();
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
    }
  };

  // Handle component selection
  const handleComponentClick = (componentId, e) => {
    e.stopPropagation(); // Prevent canvas click from triggering
    
    // If we're drawing a wire, don't select the component
    if (drawingWire) return;
    
    // Toggle selection
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    } else {
      setSelectedComponent(componentId);
      setSelectedWire(null); // Deselect any wire
    }
  };

  // Handle wire selection
  const handleWireClick = (wireId, e) => {
    e.stopPropagation(); // Prevent canvas click from triggering
    
    // If in delete mode, delete the wire
    if (deleteMode) {
      deleteWire(wireId);
      return;
    }
    
    // If shift is held, we're doing multi-selection for grouping
    if (e.shiftKey && selectedGroup) {
      // Toggle this wire in the selected group
      const group = externalWireGroups[selectedGroup];
      if (group) {
        const wireIds = group.wireIds.includes(wireId)
          ? group.wireIds.filter(id => id !== wireId)
          : [...group.wireIds, wireId];
          
        updateWireGroups(prev => ({
          ...prev,
          [selectedGroup]: {
            ...group,
            wireIds
          }
        }));
        return;
      }
    }
    
    // Check if wire is part of a group
    let wireGroupId = null;
    for (const [groupId, group] of Object.entries(externalWireGroups)) {
      if (group.wireIds.includes(wireId)) {
        wireGroupId = groupId;
        break;
      }
    }
    
    // Select the group instead of the wire if it's part of a group
    if (wireGroupId) {
      setSelectedGroup(wireGroupId);
      setSelectedWire(null);
      setSelectedComponent(null);
    } else {
      // Normal toggle selection
      if (selectedWire === wireId) {
        setSelectedWire(null);
      } else {
        setSelectedWire(wireId);
        setSelectedComponent(null);
        setSelectedGroup(null);
      }
    }
  };

  // Cancel wire drawing if clicking on empty canvas
  const handleCanvasClick = (e) => {
    // Check if we clicked directly on the canvas or on canvas child elements (grid, wires SVG, etc.)
    // but NOT on a component (components have their own click handler)
    const clickedOnCanvas = e.target === canvasRef.current || 
                           (canvasRef.current && canvasRef.current.contains(e.target) && 
                            !e.target.closest('[data-component="true"]'));
    
    if (clickedOnCanvas) {
      if (drawingWire) {
        setDrawingWire(false);
        setStartPin(null);
      } else {
        // Deselect everything when clicking on empty canvas
        setSelectedComponent(null);
        setSelectedWire(null);
      }
    }
  };

  // Handle component dragging within the canvas
  const handleComponentDrag = (componentId, newX, newY) => {
    // Apply grid snapping
    const snappedX = snapToGridValue(newX);
    const snappedY = snapToGridValue(newY);
    
    // Update component position
    console.log('[Canvas] Moving component:', componentId, 'to:', snappedX, snappedY);
    
    const updatedComponents = externalComponents.map(comp => 
      comp.instanceId === componentId 
        ? { ...comp, x: snappedX, y: snappedY } 
        : comp
    );
    
    try {
      
      // Make sure we still have all components
      if (updatedComponents.length !== externalComponents.length) {
        console.error('[Canvas] ERROR: Component count mismatch!');
        return; // Don't update if we lost components
      }
      
      // If there are no wires, just update components quickly
      if (externalWires.length === 0) {
        updateAllState(updatedComponents, externalWires, externalWireGroups);
        return;
      }
      
      // Calculate updated wire positions
      const updatedWires = externalWires.map(wire => {
        try {
          // Only update wires connected to the moved component
          if (wire.from.compId === componentId || wire.to.compId === componentId) {
            // Get components and pins involved in this wire
            const sourceComp = wire.from.compId === componentId 
              ? updatedComponents.find(c => c.instanceId === componentId)
              : updatedComponents.find(c => c.instanceId === wire.from.compId);
                
            const targetComp = wire.to.compId === componentId
              ? updatedComponents.find(c => c.instanceId === componentId)
              : updatedComponents.find(c => c.instanceId === wire.to.compId);
            
            if (!sourceComp || !targetComp) {
              console.warn('[Canvas] Could not find components for wire:', wire.id);
              return wire;
            }
            
            // Find pins with defensive checks
            if (!sourceComp.pins || !Array.isArray(sourceComp.pins) || 
                !targetComp.pins || !Array.isArray(targetComp.pins)) {
              console.warn('[Canvas] Components missing pins array:', {
                sourceComp: sourceComp.name,
                targetComp: targetComp.name
              });
              return wire;
            }
            
            const sourcePin = sourceComp.pins.find(p => p.id === wire.from.pinId);
            const targetPin = targetComp.pins.find(p => p.id === wire.to.pinId);
            
            if (!sourcePin || !targetPin) {
              console.warn('[Canvas] Could not find pins for wire:', wire.id);
              return wire;
            }
            
            // Calculate absolute positions of pins in content space
            const sourceX = sourceComp.x + (sourcePin.x_px || 0);
            const sourceY = sourceComp.y + (sourcePin.y_px || 0);
            const targetX = targetComp.x + (targetPin.x_px || 0);
            const targetY = targetComp.y + (targetPin.y_px || 0);
            
            // Determine if we need to recalculate routing points
            let newRoutingPoints = [...(wire.routingPoints || [])];
            
            // Always ensure first and last points match pin positions
            if (newRoutingPoints.length >= 2) {
              newRoutingPoints[0] = { x: sourceX, y: sourceY };
              newRoutingPoints[newRoutingPoints.length - 1] = { x: targetX, y: targetY };
            } else {
              // If no routing points, calculate new ones
              newRoutingPoints = calculateOrthogonalRoute(sourceX, sourceY, targetX, targetY);
            }
            
            // Return updated wire
            return {
              ...wire,
              from: {
                ...wire.from,
                x: sourceX,
                y: sourceY,
                pin: sourcePin
              },
              to: {
                ...wire.to,
                x: targetX,
                y: targetY,
                pin: targetPin
              },
              routingPoints: newRoutingPoints
            };
          }
          
          return wire;
        } catch (wireError) {
          console.error('[Canvas] Error updating wire:', wireError);
          return wire; // Return original wire if update fails
        }
      });
      
      console.log('[Canvas] About to update state with:', {
        componentsCount: updatedComponents.length,
        wiresCount: updatedWires.length,
        componentNames: updatedComponents.map(c => c.name)
      });
      
      // Final verification before updating state
      if (updatedComponents.length === 0) {
        console.error('[Canvas] CRITICAL ERROR: About to save empty component array! Aborting!');
        return;
      }
      
      // Update all state in a single batch operation to prevent desync
      updateAllState(updatedComponents, updatedWires, externalWireGroups);
    } catch (error) {
      console.error('[Canvas] Critical error in handleComponentDrag:', error);
      // Even if wire updates failed, ALWAYS update component position
      console.warn('[Canvas] Updating components only, wires may not be synced');
      try {
        updateAllState(updatedComponents, externalWires, externalWireGroups);
      } catch (secondError) {
        console.error('[Canvas] Failed to update even without wire changes:', secondError);
      }
    }
  };

  // Better handle component drag start
  const handleComponentDragStart = (componentId) => {
    // Set selected component
    setSelectedComponent(componentId);
    setSelectedWire(null);
    
    // Get the component from state
    const component = externalComponents.find(c => c.instanceId === componentId);
    if (component) {
      console.log(`Canvas: Component drag started - ${component.name} (${componentId})`);
    }
  };

  // Handle component drag end - syncs wire positions after dragging
  const handleComponentDragEnd = (componentId) => {
    // Make sure wire endpoints are updated after dragging
    updateWireEndpoints();
  };

  // Update wire positions based on component positions - much more robust implementation
  const updateWirePositions = useCallback(() => {
    console.log("Updating wire positions");
    
    // First create a mapping of components and pins for efficient lookup
    const componentMap = {};
    externalComponents.forEach(comp => {
      componentMap[comp.instanceId] = {
        ...comp,
        pinMap: {}
      };
      
      // Create a map of all pins for quicker lookup
      comp.pins.forEach(pin => {
        componentMap[comp.instanceId].pinMap[pin.id] = pin;
      });
    });
    
    // Don't update state if no changes are needed
    let hasChanges = false;
    
    const updatedWires = externalWires.map(wire => {
      // Use the component map for faster lookups
      const sourceComp = componentMap[wire.from.compId];
      const targetComp = componentMap[wire.to.compId];
      
      if (!sourceComp || !targetComp) {
        console.warn("Component not found for wire:", wire);
        return wire;
      }
      
      const sourcePin = sourceComp.pinMap[wire.from.pinId];
      const targetPin = targetComp.pinMap[wire.to.pinId];
      
      if (!sourcePin || !targetPin) {
        console.warn("Pin not found for wire:", wire);
        return wire;
      }
      
      // Calculate absolute positions of pins in content space
      const sourceX = sourceComp.x + sourcePin.x_px;
      const sourceY = sourceComp.y + sourcePin.y_px;
      const targetX = targetComp.x + targetPin.x_px;
      const targetY = targetComp.y + targetPin.y_px;
      
      // Only update if there's actually a change
      if (wire.from.x !== sourceX || wire.from.y !== sourceY || 
          wire.to.x !== targetX || wire.to.y !== targetY) {
        
        hasChanges = true;
        
        // Log for debugging
        console.debug(`Wire ${wire.id} updated:`, {
          fromComp: sourceComp.name,
          fromPin: sourcePin.id,
          fromX: sourceX,
          fromY: sourceY,
          toComp: targetComp.name,
          toPin: targetPin.id,
          toX: targetX,
          toY: targetY
        });
        
        // Recalculate routing points based on new pin positions
        const routingPoints = calculateOrthogonalRoute(sourceX, sourceY, targetX, targetY);
        
        // Return updated wire with new absolute positions
        return {
          ...wire,
          from: {
            ...wire.from,
            x: sourceX,
            y: sourceY,
            pin: sourcePin  // Keep pin reference updated
          },
          to: {
            ...wire.to,
            x: targetX,
            y: targetY,
            pin: targetPin  // Keep pin reference updated
          },
          routingPoints: routingPoints
        };
      }
      
      return wire;
    });
    
    // Only update state if something actually changed
    if (hasChanges) {
      updateWires(updatedWires);
    }
  }, [externalComponents, externalWires, calculateOrthogonalRoute]);

  // Add a complete zoom and pan sync handler as a separate function
  const syncWirePositionsAfterZoom = useCallback(() => {
    console.log("Syncing wire positions after zoom/pan change");
    
    // Get the current component positions and pins first
    const componentMap = {};
    externalComponents.forEach(comp => {
      componentMap[comp.instanceId] = {
        ...comp,
        pinMap: {}
      };
      
      // Create a map of all pins for quicker lookup
      comp.pins.forEach(pin => {
        componentMap[comp.instanceId].pinMap[pin.id] = pin;
      });
    });
    
    // Check if we need to update any wires at all
    let needsUpdate = false;
    
    // Now update all wire coordinates to match current pin positions precisely
    const updatedWires = externalWires.map(wire => {
      const sourceComp = componentMap[wire.from.compId];
      const targetComp = componentMap[wire.to.compId];
      
      if (!sourceComp || !targetComp) {
        console.warn("Component not found for wire during zoom sync:", wire);
        return wire;
      }
      
      const sourcePin = sourceComp.pinMap[wire.from.pinId];
      const targetPin = targetComp.pinMap[wire.to.pinId];
      
      if (!sourcePin || !targetPin) {
        console.warn("Pin not found for wire during zoom sync:", wire);
        return wire;
      }
      
      // Calculate absolute positions of pins in content space
      const sourceX = sourceComp.x + sourcePin.x_px;
      const sourceY = sourceComp.y + sourcePin.y_px;
      const targetX = targetComp.x + targetPin.x_px;
      const targetY = targetComp.y + targetPin.y_px;
      
      // Only update if positions have changed
      if (wire.from.x !== sourceX || wire.from.y !== sourceY || 
          wire.to.x !== targetX || wire.to.y !== targetY) {
            
        needsUpdate = true;
        
        // Calculate new routing points
        const routingPoints = wire.routingPoints && wire.routingPoints.length > 0
          ? calculateOrthogonalRoute(sourceX, sourceY, targetX, targetY, wire.routingPoints)
          : calculateOrthogonalRoute(sourceX, sourceY, targetX, targetY);
        
        // Return updated wire with new absolute positions
        return {
          ...wire,
          from: {
            ...wire.from,
            x: sourceX,
            y: sourceY,
            pin: sourcePin
          },
          to: {
            ...wire.to,
            x: targetX,
            y: targetY,
            pin: targetPin
          },
          routingPoints
        };
      }
      
      return wire;
    });
    
    // Only set state if there are actual changes
    if (needsUpdate) {
      updateWires(updatedWires);
    }
  }, [externalComponents, externalWires, calculateOrthogonalRoute]);

  // Use effect to update wire positions when components change or zoom changes
  useEffect(() => {
    if (externalComponents.length > 0) {
      // Debounce wire position updates to prevent excessive updates
      const timer = setTimeout(() => {
        updateWirePositions();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [externalComponents, updateWirePositions]);

  // Add a separate useEffect specifically for zoom and scale to fix disconnection issue
  useEffect(() => {
    if (externalComponents.length > 0 && externalWires.length > 0) {
      // Immediate update of wire endpoints during zoom/pan
      const timer = setTimeout(() => {
        updateWireEndpoints();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [scale, pan]);

  // Update wire endpoints function - complete rewrite to fix wire snapping issues
  const updateWireEndpoints = () => {
    // Only proceed if we have components and wires
    if (externalComponents.length === 0 || externalWires.length === 0) return;
    
    // Create a map of components and pins for quick lookups
    const componentMap = {};
    externalComponents.forEach(comp => {
      componentMap[comp.instanceId] = {
        ...comp,
        pinMap: {}
      };
      
      // Create a map of all pins for quicker lookup
      comp.pins.forEach(pin => {
        componentMap[comp.instanceId].pinMap[pin.id] = pin;
      });
    });
    
    // Fix wire coordinates to precisely match pin positions
    updateWires(prevWires => {
      // Check if any wire needs updates
      let hasChanges = false;
      
      const updatedWires = prevWires.map(wire => {
        // Get components involved in this wire
        const sourceComp = componentMap[wire.from.compId];
        const targetComp = componentMap[wire.to.compId];
        
        if (!sourceComp || !targetComp) return wire;
        
        // Get pins
        const sourcePin = sourceComp.pinMap[wire.from.pinId];
        const targetPin = targetComp.pinMap[wire.to.pinId];
        
        if (!sourcePin || !targetPin) return wire;
        
        // Calculate absolute positions based on EXACT current component positions
        const sourceX = sourceComp.x + sourcePin.x_px;
        const sourceY = sourceComp.y + sourcePin.y_px;
        const targetX = targetComp.x + targetPin.x_px;
        const targetY = targetComp.y + targetPin.y_px;
        
        // Check if the wire needs updating
        const needsUpdate = 
          Math.abs(wire.from.x - sourceX) > 0.1 || 
          Math.abs(wire.from.y - sourceY) > 0.1 ||
          Math.abs(wire.to.x - targetX) > 0.1 || 
          Math.abs(wire.to.y - targetY) > 0.1;
        
        if (needsUpdate) {
          hasChanges = true;
          
          // Always adjust the endpoints in the routingPoints
          let newRoutePoints = wire.routingPoints ? [...wire.routingPoints] : [];
          
          
          // Ensure we have at least start and end points
          if (newRoutePoints.length < 2) {
            newRoutePoints = [
              { x: sourceX, y: sourceY },
              { x: targetX, y: targetY }
            ];
          } else {
            // Get the original first and last points for calculating deltas
            const origFromX = wire.from.x;
            const origFromY = wire.from.y;
            const origToX = wire.to.x;
            const origToY = wire.to.y;
            
            // Calculate position deltas from original component positions
            const deltaFromX = sourceX - origFromX;
            const deltaFromY = sourceY - origFromY;
            const deltaToX = targetX - origToX;
            const deltaToY = targetY - origToY;
            
            // Update endpoints to match component pins
            newRoutePoints[0] = { x: sourceX, y: sourceY };
            newRoutePoints[newRoutePoints.length - 1] = { x: targetX, y: targetY };
            
            // If there are intermediate points, update adjacent points to maintain orthogonality
            if (newRoutePoints.length > 2) {
              // Update second point (connected to start point)
              const secondPoint = newRoutePoints[1];
              const isFirstSegmentHorizontal = Math.abs(secondPoint.y - newRoutePoints[0].y) < 5;
              
              if (isFirstSegmentHorizontal) {
                // If horizontal segment, update Y coordinate to match start point
                newRoutePoints[1] = { 
                  x: secondPoint.x, // Keep X position 
                  y: sourceY // Match source Y position
                };
              } else {
                // If vertical segment, update X coordinate to match start point
                newRoutePoints[1] = { 
                  x: sourceX, // Match source X position
                  y: secondPoint.y // Keep Y position
                };
              }
              
              // Update second-to-last point (connected to end point)
              const lastIdx = newRoutePoints.length - 1;
              const secondLastIdx = lastIdx - 1;
              const secondLastPoint = newRoutePoints[secondLastIdx];
              const isLastSegmentHorizontal = Math.abs(secondLastPoint.y - newRoutePoints[lastIdx].y) < 5;
              
              if (isLastSegmentHorizontal) {
                // If horizontal segment, update Y coordinate to match end point
                newRoutePoints[secondLastIdx] = { 
                  x: secondLastPoint.x, // Keep X position
                  y: targetY // Match target Y position
                };
              } else {
                // If vertical segment, update X coordinate to match end point
                newRoutePoints[secondLastIdx] = { 
                  x: targetX, // Match target X position
                  y: secondLastPoint.y // Keep Y position
                };
              }
              
              // For intermediate points (if more than 4 points total), maintain relative positions
              if (newRoutePoints.length > 4) {
                for (let i = 2; i < newRoutePoints.length - 2; i++) {
                  // Determine if this point should be influenced by start or end component
                  const distanceToStart = i;
                  const distanceToEnd = newRoutePoints.length - 1 - i;
                  
                  // If closer to start, use start component delta
                  if (distanceToStart < distanceToEnd) {
                    newRoutePoints[i] = {
                      x: newRoutePoints[i].x + deltaFromX,
                      y: newRoutePoints[i].y + deltaFromY
                    };
                  } 
                  // If closer to end, use end component delta
                  else if (distanceToEnd < distanceToStart) {
                    newRoutePoints[i] = {
                      x: newRoutePoints[i].x + deltaToX,
                      y: newRoutePoints[i].y + deltaToY
                    };
                  }
                  // If equidistant, take the average delta
                  else {
                    newRoutePoints[i] = {
                      x: newRoutePoints[i].x + (deltaFromX + deltaToX) / 2,
                      y: newRoutePoints[i].y + (deltaFromY + deltaToY) / 2
                    };
                  }
                }
              }
            }
          }
          
          // Return updated wire
          return {
            ...wire,
            from: {
              ...wire.from,
              x: sourceX,
              y: sourceY,
              pin: sourcePin
            },
            to: {
              ...wire.to,
              x: targetX,
              y: targetY,
              pin: targetPin
            },
            routingPoints: newRoutePoints
          };
        }
        
        return wire;
      });
      
      return hasChanges ? updatedWires : prevWires;
    });
  };

  // Use effect to update wire endpoints when scale or pan changes
  useEffect(() => {
    if (externalComponents.length > 0 && externalWires.length > 0) {
      // Use a timeout to prevent excessive updates
      const timer = setTimeout(() => {
        updateWireEndpoints();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [scale, pan]);

  // Now improve the renderWires function to always use the direct component pin locations
  // This ensures that the visual rendering exactly matches the component positions
  const renderWires = () => {
    return externalWires.map((wire) => {
      // Find source and target components for tooltips
      const sourceComp = externalComponents.find(c => c.instanceId === wire.from.compId);
      const targetComp = externalComponents.find(c => c.instanceId === wire.to.compId);
      
      if (!sourceComp || !targetComp) return null;
      
      // Find the source and target pins directly from the components
      const sourcePin = sourceComp.pins.find(p => p.id === wire.from.pinId);
      const targetPin = targetComp.pins.find(p => p.id === wire.to.pinId);
      
      if (!sourcePin || !targetPin) return null;
      
      // CRITICAL: Calculate absolute positions of pins based on CURRENT component positions
      // This ensures wires stay connected regardless of zoom level - don't use wire.from/to coords
      const startX = sourceComp.x + sourcePin.x_px;
      const startY = sourceComp.y + sourcePin.y_px;
      const endX = targetComp.x + targetPin.x_px;
      const endY = targetComp.y + targetPin.y_px;
      
      // Apply current scale and pan to get screen coordinates for endpoints
      const scaledStartX = (startX * scale + pan.x).toFixed(2);
      const scaledStartY = (startY * scale + pan.y).toFixed(2);
      const scaledEndX = (endX * scale + pan.x).toFixed(2);
      const scaledEndY = (endY * scale + pan.y).toFixed(2);
      
      // Generate SVG path based on routing style
      let pathD = '';
      const wireSegments = [];
      
      if (wire.routing === 'orthogonal' && wire.routingPoints && wire.routingPoints.length > 0) {
        // CRITICAL FIX: Create a copy of routing points with corrected endpoints
        const routePoints = [...wire.routingPoints];
        
        // Always set first and last points to match component pin positions exactly
        // This is crucial for maintaining connections during zoom
        routePoints[0] = { x: startX, y: startY };
        routePoints[routePoints.length - 1] = { x: endX, y: endY };
        
        // Build path data with precise coordinate transformations
        const points = routePoints.map(pt => ({
          x: pt.x * scale + pan.x,
          y: pt.y * scale + pan.y,
          contentX: pt.x,
          contentY: pt.y
        }));
        
        // Use rounded corners for a more professional Eagle-like appearance
        const radius = Math.max(3, 4 * Math.min(1, scale)); // Scale the corner radius with zoom level
        
        if (points.length <= 2) {
          // Simple straight line for very short wires
          pathD = `M ${scaledStartX} ${scaledStartY} L ${scaledEndX} ${scaledEndY}`;
        } else {
          // Start path at first point (source pin)
          pathD = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
          
          // Add segments with rounded corners
          for (let i = 1; i < points.length; i++) {
            // Store segment info for interaction
            wireSegments.push({
              index: i - 1,
              x1: points[i-1].x,
              y1: points[i-1].y,
              x2: points[i].x,
              y2: points[i].y
            });
            
            // For Eagle-style routing, we want sharp corners at junctions where direction changes
            if (i < points.length - 1) {
              // Check if we need to make a turn
              const prevPoint = points[i-1];
              const currentPoint = points[i];
              const nextPoint = points[i+1];
              
              // Determine if we have a horizontal-to-vertical or vertical-to-horizontal turn
              const isHorizontalSegment = Math.abs(currentPoint.y - prevPoint.y) < 2;
              const isVerticalNextSegment = Math.abs(nextPoint.x - currentPoint.x) < 2;
              
              if ((isHorizontalSegment && isVerticalNextSegment) || 
                  (!isHorizontalSegment && !isVerticalNextSegment)) {
                // We have a turn, add a rounded corner
                
                // Calculate the distance to offset for the rounded corner
                const cornerRadius = Math.min(
                  radius,
                  Math.abs(currentPoint.x - prevPoint.x) / 2,
                  Math.abs(currentPoint.y - prevPoint.y) / 2,
                  Math.abs(nextPoint.x - currentPoint.x) / 2,
                  Math.abs(nextPoint.y - currentPoint.y) / 2
                );
                
                // Direction vectors
                const fromDir = {
                  x: Math.sign(currentPoint.x - prevPoint.x),
                  y: Math.sign(currentPoint.y - prevPoint.y)
                };
                
                const toDir = {
                  x: Math.sign(nextPoint.x - currentPoint.x),
                  y: Math.sign(nextPoint.y - currentPoint.y)
                };
                
                // Points for the arc
                const arcStart = {
                  x: currentPoint.x - fromDir.x * cornerRadius,
                  y: currentPoint.y - fromDir.y * cornerRadius
                };
                
                const arcEnd = {
                  x: currentPoint.x + toDir.x * cornerRadius,
                  y: currentPoint.y + toDir.y * cornerRadius
                };
                
                // Add line to the start of the arc
                pathD += ` L ${arcStart.x.toFixed(2)} ${arcStart.y.toFixed(2)}`;
                
                // Add the arc - using a quadratic bezier for a clean 90-degree turn
                pathD += ` Q ${currentPoint.x.toFixed(2)} ${currentPoint.y.toFixed(2)}, ${arcEnd.x.toFixed(2)} ${arcEnd.y.toFixed(2)}`;
              } else {
                // No turn, just add a line
                pathD += ` L ${currentPoint.x.toFixed(2)} ${currentPoint.y.toFixed(2)}`;
              }
            } else {
              // Always draw a straight line to the final point (target pin)
              pathD += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
            }
          }
        }
      } else {
        // Direct line fallback - always use the component pin positions directly
        pathD = `M ${scaledStartX} ${scaledStartY} L ${scaledEndX} ${scaledEndY}`;
        
        // Single segment for direct wire
        wireSegments.push({
          index: 0,
          x1: parseFloat(scaledStartX),
          y1: parseFloat(scaledStartY),
          x2: parseFloat(scaledEndX),
          y2: parseFloat(scaledEndY)
        });
      }
      
      const isSelected = selectedWire === wire.id;
      const isEditing = editingWire === wire.id;
      
      // Check if wire is in selected group
      const isInSelectedGroup = selectedGroup && 
        externalWireGroups[selectedGroup]?.wireIds.includes(wire.id);
      
      // Get wire color based on selection, grouping, and pin types
      const wireColor = getWireColor(wire, isSelected);
      
      // Calculate endpoint size based on zoom level and selection
      const endpointSize = Math.max(3, 4 * Math.min(1, scale));
      const endpointHitAreaSize = Math.max(7, 8 * Math.min(1, scale));
      const selectedEndpointSize = endpointSize * 1.5;
      const wireWidth = isSelected || isInSelectedGroup ? 3 : 2;
      
      return (
        <g 
          key={wire.id} 
          className="pointer-events-auto"
          onMouseMove={handleWireMouseMove}
          onMouseUp={handleWireMouseUp}
        >
          {/* Wire background/shadow for better visibility */}
          <path
            d={pathD}
            fill="none"
            stroke={isDarkMode ? "#000" : "#fff"}
            strokeWidth={wireWidth + 2}
            strokeOpacity={0.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
          
          {/* Main wire path */}
          <path
            d={pathD}
            fill="none"
            stroke={wireColor}
            strokeWidth={wireWidth}
            strokeDasharray={isSelected ? "5,5" : "none"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-200 cursor-pointer"
            onClick={(e) => handleWireClick(wire.id, e)}
          />
          
          {/* Clickable wire segments for adding bend points */}
          {wireSegments.map((segment, idx) => (
            <line
              key={`segment-${idx}`}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              stroke="transparent"
              strokeWidth={12} // larger hit area
              className="cursor-crosshair"
              onMouseDown={(e) => handleSegmentMouseDown(wire.id, segment.index, e)}
              onMouseOver={() => handleSegmentMouseOver(wire.id, segment.index)}
              onMouseOut={handleSegmentMouseOut}
            />
          ))}
          
          {/* Hover indicator for segments */}
          {wireSegments.map((segment, idx) => (
            isSegmentHovered(wire.id, segment.index) && (
              <line
                key={`hover-${idx}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke={wireColor}
                strokeWidth={wireWidth + 2}
                strokeOpacity={0.5}
                strokeDasharray="3,3"
                className="pointer-events-none"
              />
            )
          ))}
          
          {/* Render control points for existing routing points */}
          {isSelected && wire.routingPoints && wire.routingPoints.map((point, idx) => {
            // Skip rendering control points for endpoints (first and last)
            if (idx === 0 || idx === wire.routingPoints.length - 1) return null;
            
            // IMPORTANT: Scale the point coordinates for rendering
            const screenX = point.x * scale + pan.x;
            const screenY = point.y * scale + pan.y;
            
            // Only show control points at actual corners (where direction changes)
            const isCornerPoint = idx > 0 && idx < wire.routingPoints.length - 1 && (
              (Math.abs(wire.routingPoints[idx-1].x - point.x) > 5 && 
               Math.abs(wire.routingPoints[idx+1].y - point.y) > 5) ||
              (Math.abs(wire.routingPoints[idx-1].y - point.y) > 5 && 
               Math.abs(wire.routingPoints[idx+1].x - point.x) > 5)
            );
            
            // For Eagle-style routing, we only want control points at the actual corners
            // not every point in the route
            if (!isCornerPoint && wire.routingPoints.length > 4) return null;
            
            return (
              <g key={`control-${idx}`}>
                {/* Diamond shaped handle for corners */}
                <path
                  d={`M ${screenX} ${screenY-5} L ${screenX+5} ${screenY} L ${screenX} ${screenY+5} L ${screenX-5} ${screenY} Z`}
                  fill={isDarkMode ? "#222" : "#fff"}
                  stroke={wireColor}
                  strokeWidth={2}
                  className="cursor-move"
                  onMouseDown={(e) => handlePointMouseDown(wire.id, idx, e)}
                />
                {/* Inner dot for better visibility */}
                <circle
                  cx={screenX}
                  cy={screenY}
                  r={endpointSize * 0.5}
                  fill={wireColor}
                  className="pointer-events-none"
                />
              </g>
            );
          })}
          
          {/* CRITICAL: Enhanced pin connection points - always use precise component pin coordinates */}
          <Tooltip>
            <TooltipTrigger asChild>
              <g>
                {/* Source pin endpoint - always at exact pin location */}
                <circle
                  cx={scaledStartX}
                  cy={scaledStartY}
                  r={isSelected ? selectedEndpointSize : endpointSize}
                  fill={wireColor}
                  stroke={isDarkMode ? "#222" : "#fff"}
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-100 hover:r-6"
                  onClick={(e) => handleWireClick(wire.id, e)}
                />
                
                {/* Larger invisible hit area for better interaction */}
                <circle
                  cx={scaledStartX}
                  cy={scaledStartY}
                  r={endpointHitAreaSize}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={(e) => handleWireClick(wire.id, e)}
                />
              </g>
            </TooltipTrigger>
            <TooltipContent
              isDarkMode={isDarkMode}
              sideOffset={5}
              className="bg-zinc-800 text-white p-2 rounded shadow-lg max-w-[250px]"
            >
              <div className="space-y-1">
                <div className="font-semibold border-b border-dashed pb-1 mb-1">
                  {sourceComp.name} - {sourcePin?.id || "Unknown Pin"}
                </div>
                {sourcePin?.designation && (
                  <div className="text-xs">{sourcePin.designation}</div>
                )}
                {sourcePin?.type && (
                  <div className="text-xs"><span className="opacity-70">Type:</span> {sourcePin.type}</div>
                )}
                {sourcePin?.voltage && (
                  <div className="text-xs"><span className="opacity-70">Voltage:</span> {sourcePin.voltage}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <g>
                {/* Target pin endpoint - always at exact pin location */}
                <circle
                  cx={scaledEndX}
                  cy={scaledEndY}
                  r={isSelected ? selectedEndpointSize : endpointSize}
                  fill={wireColor}
                  stroke={isDarkMode ? "#222" : "#fff"}
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-100 hover:r-6"
                  onClick={(e) => handleWireClick(wire.id, e)}
                />
                
                {/* Larger invisible hit area for better interaction */}
                <circle
                  cx={scaledEndX}
                  cy={scaledEndY}
                  r={endpointHitAreaSize}
                  fill="transparent" 
                  className="cursor-pointer"
                  onClick={(e) => handleWireClick(wire.id, e)}
                />
              </g>
            </TooltipTrigger>
            <TooltipContent
              isDarkMode={isDarkMode}
              sideOffset={5}
              className="bg-zinc-800 text-white p-2 rounded shadow-lg max-w-[250px]"
            >
              <div className="space-y-1">
                <div className="font-semibold border-b border-dashed pb-1 mb-1">
                  {targetComp.name} - {targetPin?.id || "Unknown Pin"}
                </div>
                {targetPin?.designation && (
                  <div className="text-xs">{targetPin.designation}</div>
                )}
                {targetPin?.type && (
                  <div className="text-xs"><span className="opacity-70">Type:</span> {targetPin.type}</div>
                )}
                {targetPin?.voltage && (
                  <div className="text-xs"><span className="opacity-70">Voltage:</span> {targetPin.voltage}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </g>
      );
    });
  };

  // Handle segment click for wire editing with improved bends
  const handleSegmentMouseDown = (wireId, segmentIndex, e) => {
    e.stopPropagation();
    
    // If in delete mode, delete the wire
    if (deleteMode) {
      deleteWire(wireId);
      return;
    }
    
    // Check if this is a double-click (double-tap)
    const now = new Date().getTime();
    const timeSinceLastClick = now - lastClickTime;
    setLastClickTime(now);
    
    // Only allow editing on double-click (within 300ms)
    if (timeSinceLastClick > 300 || timeSinceLastClick < 0) {
      // First click, just select the wire
      if (selectedWire !== wireId) {
        setSelectedWire(wireId);
        setSelectedComponent(null);
        setSelectedGroup(null);
      }
      return;
    }
    
    // This is a double-click, proceed with editing
    
    // Only proceed if we're not already dragging/editing
    if (draggedPoint !== null || draggedSegment !== null) return;
    
    const wire = externalWires.find(w => w.id === wireId);
    if (!wire || !wire.routingPoints || wire.routingPoints.length < 2) return;
    
    // Start dragging this segment
    setEditingWire(wireId);
    setDraggedSegment({ wireId, segmentIndex });
    
    // Get current wire segment points
    const start = wire.routingPoints[segmentIndex];
    const end = wire.routingPoints[segmentIndex + 1];
    
    // Get the mouse position in canvas content coordinates
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left - pan.x) / scale;
    const mouseY = (e.clientY - canvasRect.top - pan.y) / scale;
    
    // Apply grid snapping if enabled
    const snappedMouseX = snapToGridValue(mouseX);
    const snappedMouseY = snapToGridValue(mouseY);
    
    // Determine if this is a horizontal or vertical segment
    const isHorizontalSegment = Math.abs(end.y - start.y) < 5;
    
    // Create a new copy of routing points for modification
    const newPoints = [...wire.routingPoints];
    
    if (isHorizontalSegment) {
      // For horizontal segments:
      // Insert two new points to create a vertical bend
      newPoints.splice(segmentIndex + 1, 0, 
        { x: snappedMouseX, y: start.y },  // First new point - same height as segment
        { x: snappedMouseX, y: snappedMouseY }  // Second new point - at mouse position
      );
    } else {
      // For vertical segments:
      // Insert two new points to create a horizontal bend
      newPoints.splice(segmentIndex + 1, 0, 
        { x: start.x, y: snappedMouseY },  // First new point - same horizontal position as segment
        { x: snappedMouseX, y: snappedMouseY }  // Second new point - at mouse position
      );
    }
    
    // Update the wire with new routing points
    updateWires(prevWires => prevWires.map(w => 
      w.id === wireId 
        ? { ...w, routingPoints: newPoints }
        : w
    ));
    
    // Set the second newly created point as the dragged point
    // This will be the one that can be moved to shape the wire
    setDraggedPoint({ wireId, pointIndex: segmentIndex + 2 });
  };

  // Improved wire point dragging with better constraints
  const handleWireMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    // Early exit if we're not dragging anything
    if (!draggedPoint && !draggedSegment) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - canvasRect.left;
    const rawY = e.clientY - canvasRect.top;
    
    // Convert to content coordinates
    const contentCoords = canvasToContent(rawX, rawY);
    
    // Apply grid snapping if enabled
    const newX = snapToGrid ? snapToGridValue(contentCoords.x) : contentCoords.x;
    const newY = snapToGrid ? snapToGridValue(contentCoords.y) : contentCoords.y;
    
    // If we're dragging a point, update its position
    if (draggedPoint) {
      const { wireId, pointIndex } = draggedPoint;
      const wire = externalWires.find(w => w.id === wireId);
      
      if (!wire || !wire.routingPoints || pointIndex < 1 || pointIndex >= wire.routingPoints.length - 1) return;
      
      // Create a copy of the routing points
      const newPoints = [...wire.routingPoints];
      
      // Find the points before and after this point to determine constraints
      const prevPoint = newPoints[pointIndex - 1];
      const nextPoint = pointIndex < newPoints.length - 1 ? newPoints[pointIndex + 1] : null;
      
      // Determine if this is a corner point that connects horizontal and vertical segments
      const prevSegmentHorizontal = Math.abs(prevPoint.y - newPoints[pointIndex].y) < 5;
      const nextSegmentHorizontal = nextPoint && Math.abs(nextPoint.y - newPoints[pointIndex].y) < 5;
      
      // Maintain orthogonal wiring during dragging
      if (prevSegmentHorizontal === nextSegmentHorizontal) {
        // This is a middle point of a straight segment
        if (prevSegmentHorizontal) {
          // Horizontal segment - only allow vertical movement
          newPoints[pointIndex] = { x: newPoints[pointIndex].x, y: newY };
          
          // Adjust adjacent points to match
          if (pointIndex > 0) {
            newPoints[pointIndex - 1] = { ...newPoints[pointIndex - 1], y: newY };
          }
          if (pointIndex < newPoints.length - 1) {
            newPoints[pointIndex + 1] = { ...newPoints[pointIndex + 1], y: newY };
          }
        } else {
          // Vertical segment - only allow horizontal movement
          newPoints[pointIndex] = { x: newX, y: newPoints[pointIndex].y };
          
          // Adjust adjacent points to match
          if (pointIndex > 0) {
            newPoints[pointIndex - 1] = { ...newPoints[pointIndex - 1], x: newX };
          }
          if (pointIndex < newPoints.length - 1) {
            newPoints[pointIndex + 1] = { ...newPoints[pointIndex + 1], x: newX };
          }
        }
      } else {
        // This is a corner point where direction changes
        newPoints[pointIndex] = { x: newX, y: newY };
        
        // Adjust adjacent points to maintain orthogonality
        if (prevSegmentHorizontal) {
          // Previous segment is horizontal, next is vertical
          newPoints[pointIndex - 1] = { ...newPoints[pointIndex - 1], y: newPoints[pointIndex].y };
          if (nextPoint) {
            newPoints[pointIndex + 1] = { ...newPoints[pointIndex + 1], x: newPoints[pointIndex].x };
          }
        } else {
          // Previous segment is vertical, next is horizontal
          newPoints[pointIndex - 1] = { ...newPoints[pointIndex - 1], x: newPoints[pointIndex].x };
          if (nextPoint) {
            newPoints[pointIndex + 1] = { ...newPoints[pointIndex + 1], y: newPoints[pointIndex].y };
          }
        }
      }
      
      // Update the wire with the new routing points
      updateWires(prevWires => prevWires.map(w => 
        w.id === wireId 
          ? { ...w, routingPoints: newPoints }
          : w
      ));
    }
  };

  // Enhanced segment hover detection
  const handleSegmentMouseOver = (wireId, segmentIndex) => {
    // Only set hover when we're not already dragging
    if (!draggedPoint && !draggedSegment) {
      setHoverSegment({ wireId, segmentIndex });
      
      // Change cursor to indicate that segments can be clicked to add bends
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  };

  const handleSegmentMouseOut = () => {
    // Clear hover state when mouse leaves
    if (!draggedPoint && !draggedSegment) {
      setHoverSegment(null);
      
      // Reset cursor
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isPanning ? 'grabbing' : 'default';
      }
    }
  };

  // Handle mouse down for wire editing
  const handlePointMouseDown = (wireId, pointIndex, e) => {
    e.stopPropagation();
    
    // Only handle interior points (not endpoints)
    const wire = externalWires.find(w => w.id === wireId);
    if (!wire || !wire.routingPoints) return;
    
    // Skip endpoints (first and last points)
    if (pointIndex === 0 || pointIndex === wire.routingPoints.length - 1) return;
    
    // Start dragging this point
    setEditingWire(wireId);
    setDraggedPoint({ wireId, pointIndex });
  };

  const handleWireMouseUp = () => {
    // Reset drag state
    setEditingWire(null);
    setDraggedPoint(null);
    setDraggedSegment(null);
  };

  // Helper function to determine if a wire segment is hovered
  const isSegmentHovered = (wireId, segmentIndex) => {
    return hoverSegment && 
      hoverSegment.wireId === wireId && 
      hoverSegment.segmentIndex === segmentIndex;
  };

  // Delete selected component or wire
  const handleDelete = () => {
    if (selectedComponent) {
      // Delete the component
      const newComponents = externalComponents.filter(comp => comp.instanceId !== selectedComponent);

      // Delete any wires connected to this component
      const newWires = externalWires.filter(wire => 
        wire.from.compId !== selectedComponent && 
        wire.to.compId !== selectedComponent
      );
      
      // Update wire groups
      const newWireGroups = {};
      let modified = false;
      
      // For each group, filter out wires that are connected to the deleted component
      Object.entries(externalWireGroups).forEach(([groupId, group]) => {
        const connectedWires = externalWires.filter(wire => 
          wire.from.compId === selectedComponent || 
          wire.to.compId === selectedComponent
        ).map(wire => wire.id);
        
        const updatedWireIds = group.wireIds.filter(wireId => 
          !connectedWires.includes(wireId)
        );
        
        if (updatedWireIds.length !== group.wireIds.length) {
          modified = true;
        }
        
        // Only keep the group if it still has wires
        if (updatedWireIds.length > 0) {
          newWireGroups[groupId] = {
            ...group,
            wireIds: updatedWireIds
          };
        }
      });
      
      // Update all state at once
      updateAllState(newComponents, newWires, modified ? newWireGroups : externalWireGroups);
      setSelectedComponent(null);
    } else if (selectedWire) {
      // Delete the wire
      const newWires = externalWires.filter(wire => wire.id !== selectedWire);
      
      // Remove wire from any groups
      const newWireGroups = {};
      let modified = false;
      
      Object.entries(externalWireGroups).forEach(([groupId, group]) => {
        if (group.wireIds.includes(selectedWire)) {
          modified = true;
          const updatedWireIds = group.wireIds.filter(id => id !== selectedWire);
          
          // Only keep the group if it still has wires
          if (updatedWireIds.length > 0) {
            newWireGroups[groupId] = {
              ...group,
              wireIds: updatedWireIds
            };
          }
        } else {
          newWireGroups[groupId] = group;
        }
      });
      
      // Update all state at once
      updateAllState(externalComponents, newWires, modified ? newWireGroups : externalWireGroups);
      setSelectedWire(null);
    } else if (selectedGroup) {
      // Delete all wires in the selected group
      const group = externalWireGroups[selectedGroup];
      if (group) {
        const newWires = externalWires.filter(wire => !group.wireIds.includes(wire.id));
        
        // Remove the group
        const { [selectedGroup]: _, ...rest } = externalWireGroups;
        
        // Update all state at once
        updateAllState(externalComponents, newWires, rest);
      }
      setSelectedGroup(null);
    }
  };

  // Toggle grid snapping
  const toggleGridSnap = () => {
    setSnapToGrid(prev => !prev);
  };

  // Add a function to delete a wire
  const deleteWire = (wireId) => {
    // Delete the wire
    const newWires = externalWires.filter(wire => wire.id !== wireId);
    
    // Remove wire from any groups
    const newWireGroups = {};
    let modified = false;
    
    Object.entries(externalWireGroups).forEach(([groupId, group]) => {
      if (group.wireIds.includes(wireId)) {
        modified = true;
        const updatedWireIds = group.wireIds.filter(id => id !== wireId);
        
        // Only keep the group if it still has wires
        if (updatedWireIds.length > 0) {
          newWireGroups[groupId] = {
            ...group,
            wireIds: updatedWireIds
          };
        }
      } else {
        newWireGroups[groupId] = group;
      }
    });
    
    // Update all state at once
    updateAllState(externalComponents, newWires, modified ? newWireGroups : externalWireGroups);
    
    // Reset selection if the deleted wire was selected
    if (selectedWire === wireId) {
      setSelectedWire(null);
    }
    
    // Exit delete mode
    setDeleteMode(false);
  };

  // Add handle reset view
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    updateWireEndpoints();
  };

  // Add back the missing handleKeyDown event listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo with Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          onUndo();
        }
        return;
      }
      
      // Redo with Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo) {
          onRedo();
        }
        return;
      }
      
      // Delete with Delete key
      if (e.key === 'Delete' && (selectedComponent || selectedWire || selectedGroup)) {
        handleDelete();
      }
      
      // Escape key to cancel selection or wire drawing
      if (e.key === 'Escape') {
        if (drawingWire) {
          setDrawingWire(false);
          setStartPin(null);
        } else if (deleteMode) {
          setDeleteMode(false);
        } else {
          setSelectedComponent(null);
          setSelectedWire(null);
        }
      }
      
      // D key to toggle delete mode
      if (e.key === 'd' || e.key === 'D') {
        setDeleteMode(prev => !prev);
      }
      
      // R key to reset view
      if (e.key === 'r' || e.key === 'R') {
        handleResetView();
      }
      
      // Toggle grid snap with G
      if (e.key === 'g' || e.key === 'G') {
        toggleGridSnap();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponent, selectedWire, selectedGroup, drawingWire, deleteMode, canUndo, canRedo, onUndo, onRedo, handleDelete, handleResetView, toggleGridSnap]);
  
  // Function to handle dropped components and components already on canvas
  const handleDragOverCanvas = (e) => {
    e.preventDefault();
    
    // Check if this is a component reposition (not from sidebar)
    const isReposition = e.dataTransfer.types.includes('componentid');
    const isFromSidebar = e.dataTransfer.types.includes('component');
    
    // Set appropriate drop effect
    e.dataTransfer.dropEffect = isReposition ? 'move' : 'copy';
    
    // Show dragging indicator only when dragging from sidebar
    if (isFromSidebar && !isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  // Add this helper function before the return statement
  const getWireColor = (wire, isSelected) => {
    // If wire is selected, always use red
    if (isSelected) return "#ff0000";
    
    // Check if wire is in a group
    let wireGroup = null;
    let isInSelectedGroup = false;
    
    for (const [groupId, group] of Object.entries(externalWireGroups)) {
      if (group.wireIds.includes(wire.id)) {
        wireGroup = group;
        if (groupId === selectedGroup) {
          isInSelectedGroup = true;
        }
        break;
      }
    }
    
    if (wireGroup) {
      // Use the appropriate color based on the selected state
      if (isInSelectedGroup) {
        return isDarkMode ? wireGroup.darkColor || wireGroup.color : wireGroup.lightColor || wireGroup.color;
      } else {
        // Add transparency to non-selected group wires
        return (isDarkMode ? wireGroup.darkColor || wireGroup.color : wireGroup.lightColor || wireGroup.color) + "CC";
      }
    }
    
    // Otherwise use color based on pin types
    return determineWireColor(wire.from.pin?.type, wire.to.pin?.type, isDarkMode);
  };

  // Update when componentStates changes
  useEffect(() => {
    // If we have active component states, enable simulation view
    if (Object.keys(componentStates).length > 0) {
      setShowSimulation(true);
    }
  }, [componentStates]);

  // Toggle simulation view
  const toggleSimulationView = () => {
    setShowSimulation(!showSimulation);
  };


  // Update the renderComponents function to include simulation state
  const renderComponents = () => {
    if (!externalComponents || !Array.isArray(externalComponents)) {
      console.error('[Canvas] externalComponents is not an array:', externalComponents);
      return [];
    }
    
    console.log('[Canvas] Rendering components:', {
      count: externalComponents.length,
      components: externalComponents.map(c => ({ name: c.name, id: c.instanceId, x: c.x, y: c.y }))
    });
    
    // No components is a valid state; show nothing without warning
    
    return externalComponents.map(component => {
      const isSelected = selectedComponent === component.instanceId;
      // Get component state for simulation
      const componentState = componentStates[component.instanceId] || {};
      
      // Add LED-specific glow effect
      let ledGlowEffect = null;
      if (component.type === 'LED' && componentState.states?.value === 1) {
        console.log(`[Canvas] LED ${component.name} should glow! Component state:`, componentState);
        // Determine LED color based on component name
        let ledColor = '#ef4444'; // Default red
        if (component.name.toLowerCase().includes('green')) {
          ledColor = '#22c55e';
        } else if (component.name.toLowerCase().includes('blue')) {
          ledColor = '#3b82f6';
        } else if (component.name.toLowerCase().includes('yellow')) {
          ledColor = '#eab308';
        } else if (component.name.toLowerCase().includes('white')) {
          ledColor = '#f8fafc';
        }
        
        ledGlowEffect = {
          highlight: ledColor,
          glowIntensity: 0.8
        };
        console.log(`[Canvas] LED glow effect created:`, ledGlowEffect);
      } else if (component.type === 'LED') {
        console.log(`[Canvas] LED ${component.name} not glowing. Component state:`, componentState);
      }
      
      return (
        <PCBComponent
          key={component.instanceId}
          id={component.instanceId}
          name={component.name}
          type={component.type}
          icon={component.icon}
          x={component.x}
          y={component.y}
          width_px={component.width_px}
          height_px={component.height_px}
          footprint={component.footprint}
          pins={component.pins}
          isDarkMode={isDarkMode}
          isSelected={isSelected}
          onPinClick={handlePinClick}
          onClick={handleComponentClick}
          onDragStart={handleComponentDragStart}
          onDrag={handleComponentDrag}
          onDragEnd={handleComponentDragEnd}
          scale={scale}
          pan={pan}
          simulationState={ledGlowEffect || componentState}
          showSimulation={showSimulation || (ledGlowEffect !== null)}
        />
      );
    });
  };

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* Canvas toolbar */}
      <div className={`p-2 border-b ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'} flex items-center space-x-2`}>
        <button
          className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
          onClick={() => {
            setPan({ x: 0, y: 0 });
            updateWireEndpoints();
          }}
          title="Reset View"
        >
          <Move className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <button
          className={`p-1.5 rounded-md ${
            snapToGrid 
              ? (isDarkMode ? 'bg-cyan-900 text-cyan-100' : 'bg-blue-100 text-blue-800') 
              : (isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-gray-700')
          }`}
          onClick={toggleGridSnap}
          title={snapToGrid ? 'Snap to Grid: On' : 'Snap to Grid: Off'}
        >
          <Grid className="h-5 w-5" />
        </button>
        
        {/* Circuit Grouping Button */}
        <button
          className={`p-1.5 rounded-md ${
            showGroupPanel 
              ? (isDarkMode ? 'bg-cyan-900 text-cyan-100' : 'bg-blue-100 text-blue-800') 
              : (isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-gray-700')
          }`}
          onClick={() => setShowGroupPanel(!showGroupPanel)}
          title="Circuit Groups"
        >
          <Layout className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        
        {/* Wire Delete Mode Button */}
        <button
          className={`p-1.5 rounded-md ${
            deleteMode 
              ? (isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800') 
              : (isDarkMode ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-gray-700')
          }`}
          onClick={() => setDeleteMode(!deleteMode)}
          title={deleteMode ? 'Delete Mode: On (Click wires to delete)' : 'Delete Mode: Off'}
        >
          <Trash2 className={`h-5 w-5 ${deleteMode ? (isDarkMode ? 'text-red-100' : 'text-red-800') : (isDarkMode ? 'text-white' : 'text-gray-700')}`} />
        </button>
        
        
        {/* Delete Button - only for components now */}
        {(selectedComponent || selectedGroup) && !deleteMode && (
          <button
            className={`p-1.5 rounded-md ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}
            onClick={handleDelete}
            title="Delete Selected"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Circuit Group Panel */}
      {showGroupPanel && (
        <div className={`p-2 border-b ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'}`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Circuit Groups</span>
              
              {selectedWire && (
                <div className="flex gap-1">
                  {groupCategories.map(category => (
                    <button
                      key={category.id}
                      className={`px-2 py-1 text-xs rounded ${
                        isDarkMode ? 'text-white' : 'text-white'
                      }`}
                      style={{ 
                        backgroundColor: isDarkMode ? category.darkColor : category.color,
                      }}
                      onClick={() => {
                        const name = prompt('Enter group name:', category.name);
                        if (!name) return;
                        
                        const groupId = `group-${Date.now()}`;
                        updateWireGroups(prev => ({
                          ...prev,
                          [groupId]: {
                            id: groupId,
                            name,
                            type: category.id,
                            color: isDarkMode ? category.darkColor : category.color,
                            darkColor: category.darkColor,
                            lightColor: category.color,
                            wireIds: [selectedWire]
                          }
                        }));
                        
                        setSelectedGroup(groupId);
                        setSelectedWire(null);
                      }}
                      title={`Create ${category.name} Group`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(externalWireGroups).map(([groupId, group]) => (
                <button
                  key={groupId}
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                    selectedGroup === groupId
                      ? isDarkMode ? 'bg-zinc-600 text-white' : 'bg-gray-300 text-gray-800'
                      : isDarkMode ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedGroup(selectedGroup === groupId ? null : groupId);
                    setSelectedWire(null);
                    setSelectedComponent(null);
                  }}
                  style={{
                    borderLeft: `3px solid ${isDarkMode ? (group.darkColor || group.color) : (group.lightColor || group.color)}`
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: isDarkMode ? (group.darkColor || group.color) : (group.lightColor || group.color) }}
                  ></span>
                  {group.name} ({group.wireIds.length})
                  
                  <span
                    className="ml-1 text-xs opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      const { [groupId]: _, ...rest } = externalWireGroups;
                      updateWireGroups(rest);
                      if (selectedGroup === groupId) {
                        setSelectedGroup(null);
                      }
                    }}
                    title="Delete group"
                  >
                    ×
                  </span>
                </button>
              ))}
              
              {Object.keys(externalWireGroups).length === 0 && !selectedWire && (
                <span className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select a wire first, then create a circuit group
                </span>
              )}
              
              {Object.keys(externalWireGroups).length === 0 && selectedWire && (
                <span className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Choose a category above to create your first circuit group
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main canvas area - make it scrollable with overflow */}
      <div 
        ref={canvasRef}
        className={`flex-1 overflow-auto relative canvas-container ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-50'} ${isDraggingOver ? 'ring-2 ring-blue-500' : ''}`}
        data-canvas="true"
        style={{ 
          height: `calc(100vh - ${showGroupPanel ? '7rem' : '4rem'})`, 
          width: '100%',
          cursor: isPanning ? 'grabbing' : 'default' // Change cursor during panning
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOverCanvas}
        onDragLeave={handleDragLeave}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onScroll={handleScroll}
        onClick={handleCanvasClick}
        tabIndex={0}
      >
        {/* Grid */}
        <div 
          ref={contentRef}
          className="absolute left-0 top-0"
          style={{
            backgroundImage: `${isDarkMode ? 
              'radial-gradient(circle, rgba(64, 64, 64, 0.5) 1px, transparent 1px)' : 
              'radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px)'}`,
            backgroundSize: `${10 * scale}px ${10 * scale}px`,
            backgroundPosition: `${pan.x % (10 * scale)}px ${pan.y % (10 * scale)}px`,
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`
          }}
        />
        
        {/* Empty canvas message */}
        {externalComponents.length === 0 && !isDraggingOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Drag components from the sidebar to start designing
            </p>
          </div>
        )}
        
        {/* Render wires */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 10 }}>
          <TooltipProvider>
            {renderWires()}
            
            {/* Fix the wire being drawn */}
            {drawingWire && startPin && (
              <>
                {/* Orthogonal wire preview */}
                {(() => {
                  // Get current mouse position in screen coordinates
                  const scaledMouseX = mousePosition.x * scale + pan.x;
                  const scaledMouseY = mousePosition.y * scale + pan.y;
                  
                  // Get start pin position in screen coordinates
                  // This needs to be exact to ensure we start exactly at the pin
                  const scaledStartX = startPin.absX * scale + pan.x;
                  const scaledStartY = startPin.absY * scale + pan.y;
                  
                  // Determine if we should go horizontal first or vertical first
                  const horizontalFirst = Math.abs(scaledMouseX - scaledStartX) > Math.abs(scaledMouseY - scaledStartY);
                  
                  // Create orthogonal path
                  let pathD = '';
                  if (horizontalFirst) {
                    pathD = `M ${scaledStartX} ${scaledStartY} L ${scaledMouseX} ${scaledStartY} L ${scaledMouseX} ${scaledMouseY}`;
                  } else {
                    pathD = `M ${scaledStartX} ${scaledStartY} L ${scaledStartX} ${scaledMouseY} L ${scaledMouseX} ${scaledMouseY}`;
                  }
                  
                  // Draw the orthogonal wire preview
                  return (
                    <>
                      {/* Wire path */}
                      <path
                        d={pathD}
                        stroke={startPin.pin?.type ? 
                          determineWireColor(startPin.pin.type, null, isDarkMode) : 
                          (isDarkMode ? '#d4d4d8' : '#71717a')}
                        strokeWidth={2.5}
                        strokeDasharray="5,5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                      
                      {/* Draw translucent connector at corners for better visualization */}
                      {horizontalFirst ? (
                        <circle
                          cx={scaledMouseX}
                          cy={scaledStartY}
                          r={3}
                          fill={startPin.pin?.type ? 
                            determineWireColor(startPin.pin.type, null, isDarkMode) : 
                            (isDarkMode ? '#d4d4d8' : '#71717a')}
                          fillOpacity={0.5}
                          pointerEvents="none"
                        />
                      ) : (
                        <circle
                          cx={scaledStartX}
                          cy={scaledMouseY}
                          r={3}
                          fill={startPin.pin?.type ? 
                            determineWireColor(startPin.pin.type, null, isDarkMode) : 
                            (isDarkMode ? '#d4d4d8' : '#71717a')}
                          fillOpacity={0.5}
                          pointerEvents="none"
                        />
                      )}
                    </>
                  );
                })()}
                
                {/* Enhanced start point indicator - perfectly aligned with the actual pin */}
                <circle
                  cx={startPin.absX * scale + pan.x}
                  cy={startPin.absY * scale + pan.y}
                  r={6}
                  stroke={startPin.pin?.type ? 
                    determineWireColor(startPin.pin.type, null, isDarkMode) : 
                    (isDarkMode ? '#d4d4d8' : '#71717a')}
                  strokeWidth={2}
                  fill="transparent"
                  pointerEvents="none"
                />
                <circle
                  cx={startPin.absX * scale + pan.x}
                  cy={startPin.absY * scale + pan.y}
                  r={3}
                  fill={startPin.pin?.type ? 
                    determineWireColor(startPin.pin.type, null, isDarkMode) : 
                    (isDarkMode ? '#d4d4d8' : '#71717a')}
                  pointerEvents="none"
                />
                
                {/* Animated pulse at cursor end to indicate active drawing */}
                <circle
                  cx={mousePosition.x * scale + pan.x}
                  cy={mousePosition.y * scale + pan.y}
                  r={6}
                  fill="transparent"
                  stroke={startPin.pin?.type ? 
                    determineWireColor(startPin.pin.type, null, isDarkMode) : 
                    (isDarkMode ? '#d4d4d8' : '#71717a')}
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  style={{
                    animation: "pulse 1.5s infinite"
                  }}
                  pointerEvents="none"
                />
                {/* Add a small style for the pulse animation */}
                <style>
                  {`
                    @keyframes pulse {
                      0% { r: 4; stroke-opacity: 0.8; }
                      50% { r: 8; stroke-opacity: 0.4; }
                      100% { r: 4; stroke-opacity: 0.8; }
                    }
                  `}
                </style>
              </>
            )}
          </TooltipProvider>
        </svg>
        
        {/* Render components */}
        {renderComponents()}
        
        {/* Drop zone indicator */}
        {isDraggingOver && (
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-cyan-500/10' : 'bg-blue-500/10'} 
            pointer-events-none z-0 flex items-center justify-center`}>
            <p className={`font-medium ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
              Drop component here
            </p>
          </div>
        )}
      </div>
      
      {/* Add delete mode indicator */}
      {deleteMode && (
        <div className={`absolute top-16 left-0 right-0 p-2 text-center font-medium z-50 ${
          isDarkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
        }`}>
          DELETE MODE: Click on wires to delete them (Press Esc or D to exit)
        </div>
      )}
    </div>
  );
};

// Helper function to determine wire color based on connected pin types
const determineWireColor = (fromType, toType, isDarkMode) => {
  // If either end is a power pin
  if (fromType === 'VCC' || fromType === 'Power' || toType === 'VCC' || toType === 'Power') {
    return isDarkMode ? '#ef4444' : '#dc2626'; // Red
  }
  
  // If either end is a ground pin
  if (fromType === 'GND' || fromType === 'Ground' || toType === 'GND' || toType === 'Ground') {
    return isDarkMode ? '#1d4ed8' : '#2563eb'; // Blue
  }
  
  // If either end is a digital I/O
  if (fromType === 'Digital IO' || fromType === 'Digital' || toType === 'Digital IO' || toType === 'Digital') {
    return isDarkMode ? '#16a34a' : '#22c55e'; // Green
  }
  
  // If either end is analog
  if (fromType === 'Analog' || toType === 'Analog') {
    return isDarkMode ? '#eab308' : '#facc15'; // Yellow
  }
  
  // Default color
  return isDarkMode ? '#d4d4d8' : '#71717a'; // Gray
};

export default Canvas;
