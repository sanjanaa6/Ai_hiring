import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Layout, 
  Settings, 
  BookOpen, 
  HelpCircle, 
  Moon, 
  Sun, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Zap, 
  Layers, 
  TerminalSquare, 
  Wrench,
  Battery, 
  ArrowRight, 
  GitBranch, 
  Activity,
  ToggleLeft,
  Volume2,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Tag,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ComponentCard from './ComponentCard';
import SidebarMenuItem from './SidebarMenuItem';

// Expanded Lucide icons map for comprehensive component support
const iconMap = {
  // Basic components
  AlignHorizontalSpaceAround: Wrench,
  Magnet: Battery,
  Network: Zap,
  Triangle: Activity,
  Radio: TerminalSquare,
  ActivitySquare: Activity,
  Sliders: Layers,
  Knob: Wrench,
  SunDim: Sun,
  // Additional component icons
  Microcontroller: Cpu,
  Resistor: Layers,
  Capacitor: Battery,
  Inductor: Activity,
  LED: Zap,
  Diode: ArrowRight,
  Transistor: ToggleLeft,
  Speaker: Volume2,
  Connector: TerminalSquare,
  Switch: ToggleLeft
};

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Sidebar = ({ isDarkMode, toggleTheme }) => {
  const [activeMenuItem, setActiveMenuItem] = useState('Components');
  const [componentsExpanded, setComponentsExpanded] = useState(true);
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState(null);
  const tabsRef = useRef(null);
  const searchInputRef = useRef(null);
  const tagsContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showFilterPrompt, setShowFilterPrompt] = useState(false);

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'Components', label: 'Components', icon: <Cpu size={16} /> },
    { id: 'Layouts', label: 'Layouts', icon: <Layout size={16} /> },
    { id: 'Library', label: 'Library', icon: <BookOpen size={16} /> },
    { id: 'Settings', label: 'Settings', icon: <Settings size={16} /> }
  ];

  // Extract all unique tags from components
  const allTags = useMemo(() => {
    const tags = Array.from(
      new Set(components.flatMap(comp => comp.tags || []))
    ).sort(); // Sort alphabetically for better UX
    
    return tags;
  }, [components]);

  // Extract all unique types from components
  const allTypes = useMemo(() => {
    const types = Array.from(
      new Set(components.map(comp => comp.type || "Unknown"))
    ).sort();
    
    return ["all", ...types]; // Add "all" as first option
  }, [components]);

  // Fetch components from JSON file
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        setIsLoading(true);
        
        let allComponents = [];
        
        // First, fetch enriched power components
        try {
          const powerResponse = await fetch('/enriched_power_components.json');
          if (powerResponse.ok) {
            const powerData = await powerResponse.json();
            allComponents = Array.isArray(powerData) ? powerData : (powerData.power_and_passive_components || []);
            console.log('Loaded power components:', allComponents.length);
          }
        } catch (powerError) {
          console.warn('Could not load power components');
        }
        
        // Then fetch enriched components
        try {
          const enrichedResponse = await fetch('/enriched_components.json');
          if (enrichedResponse.ok) {
            const data = await enrichedResponse.json();
            allComponents = [...allComponents, ...(data.components || data || [])];
            setComponents(allComponents);
            setError(null);
            return;
          }
        } catch (enrichedError) {
          console.warn('Could not load enriched components, falling back to regular components');
        }
        
        // Fall back to regular components if enriched ones aren't available
        const response = await fetch('/components.json');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        allComponents = [...allComponents, ...(data.components || [])];
        setComponents(allComponents);
        setError(null);
      } catch (err) {
        console.error('Error fetching components:', err);
        setError('Failed to load components. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  // Check if tags container can scroll
  useEffect(() => {
    const checkScroll = () => {
      if (tagsContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tagsContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
      }
    };

    // Initial check
    checkScroll();

    // Add scroll event listener
    if (tagsContainerRef.current) {
      tagsContainerRef.current.addEventListener('scroll', checkScroll);
      // Cleanup listener
      return () => tagsContainerRef.current?.removeEventListener('scroll', checkScroll);
    }
  }, [componentsExpanded, allTags.length]);

  // Auto-expand components on initial load
  useEffect(() => {
    if (components.length > 0 && !componentsExpanded) {
      setComponentsExpanded(true);
    }
  }, [components]);

  // Filter components based on search query, active category, and active tag
  const filteredComponents = useMemo(() => {
    return components.filter(comp => {
      // Filter by type/category if it's not "all"
      if (activeCategory !== 'all' && comp.type !== activeCategory) {
        return false;
      }
      
      // Filter by search query (match any part of component name)
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const nameMatch = (comp.name || "").toLowerCase().includes(query);
        const typeMatch = (comp.type || "").toLowerCase().includes(query);
        const tagsMatch = comp.tags && comp.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!nameMatch && !typeMatch && !tagsMatch) return false;
      }
      
      // Filter by tag if one is selected
      if (activeTag && (!comp.tags || !comp.tags.includes(activeTag))) {
        return false;
      }
      
      return true;
    });
  }, [components, debouncedSearchQuery, activeCategory, activeTag]);

  const toggleComponentsMenu = () => {
    setComponentsExpanded(!componentsExpanded);
    if (!componentsExpanded) {
      setActiveMenuItem('Components');
    }
  };

  // Provide fallback icons if any icon is missing from Lucide
  const getIconForComponent = (iconName) => {
    if (!iconName) return HelpCircle;
    return iconMap[iconName] || HelpCircle;
  };

  // Scroll tag container horizontally
  const scrollTags = (direction) => {
    if (tagsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      tagsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveCategory('all');
    setActiveTag(null);
    setSearchQuery('');
    setShowFilterPrompt(false);
  };

  // Check if any filters are active
  const hasActiveFilters = activeCategory !== 'all' || activeTag !== null || debouncedSearchQuery !== '';

  return (
    <div className={`w-64 h-screen ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-black'} p-4 rounded-r-xl shadow-lg font-sans flex flex-col overflow-hidden`}>
      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-wide">PCB Designer</h1>
        <p className={`${isDarkMode ? 'text-zinc-400' : 'text-black'} text-sm mb-2`}>Design Platform</p>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Regular menu items */}
        <nav className="space-y-1 flex-shrink-0">
          {menuItems.map(item => (
            <SidebarMenuItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeMenuItem === item.id}
              onClick={() => {
                setActiveMenuItem(item.id);
                if (item.id === 'Components') {
                  setComponentsExpanded(true);
                }
              }}
              isDarkMode={isDarkMode}
            />
          ))}
        </nav>

        {/* Components section (expanded by default) */}
        {activeMenuItem === 'Components' && (
          <div className={`mt-4 flex-1 overflow-hidden flex flex-col ${componentsExpanded ? 'h-full' : 'h-0'}`}>
            {/* Search bar */}
            <div className={`relative mb-2 flex items-center ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'} rounded-md overflow-hidden`}>
              <div className="pl-2 text-gray-500">
                <Search size={16} />
              </div>
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                isDarkMode={isDarkMode}
                className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent"
              />
              {searchQuery && (
                <button
                  className="pr-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Component type tabs */}
            <div className="flex items-center mb-2 overflow-hidden">
              <div 
                ref={tabsRef} 
                className="flex-1 overflow-x-auto hide-scrollbar"
              >
                <Tabs 
                  defaultValue="all" 
                  value={activeCategory}
                  onValueChange={setActiveCategory} 
                  className="w-full"
                >
                  <TabsList className={`flex ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'} p-0.5 rounded-md`}>
                    {allTypes.map(type => (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className={`flex-1 text-xs py-1 px-2 rounded-sm capitalize ${
                          isDarkMode
                            ? activeCategory === type ? 'bg-zinc-700 text-white' : 'text-gray-300 hover:text-white'
                            : activeCategory === type ? 'bg-white text-black shadow-sm' : 'text-gray-700 hover:text-black'
                        }`}
                      >
                        {type}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Filter button/indicator */}
              {hasActiveFilters && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`flex-shrink-0 ml-1 p-1 rounded-md 
                        ${isDarkMode ? 'bg-cyan-900 text-cyan-200' : 'bg-blue-100 text-blue-800'}`}
                      onClick={() => setShowFilterPrompt(prev => !prev)}
                    >
                      <Filter size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className={isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-black'}
                  >
                    {filteredComponents.length} of {components.length} components
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            {/* Reset filter prompt */}
            {showFilterPrompt && (
              <div className={`flex items-center justify-between p-2 mb-2 text-xs rounded-md
                ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-black'}`}>
                <div className="flex items-center">
                  <Filter size={12} className="mr-1" />
                  <span>Filters applied</span>
                </div>
                <button
                  className={`flex items-center p-1 rounded 
                    ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={resetFilters}
                >
                  <RefreshCw size={10} className="mr-1" />
                  <span>Reset</span>
                </button>
              </div>
            )}

            {/* Tags filter scrollable bar */}
            {allTags.length > 0 && (
              <div className="relative mb-2 flex-shrink-0">
                {canScrollLeft && (
                  <button
                    className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-0.5 
                      ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-black'} shadow-md`}
                    onClick={() => scrollTags('left')}
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                
                <div 
                  ref={tagsContainerRef}
                  className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-thin no-scrollbar"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      className={`flex-shrink-0 flex items-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap transition-colors
                        ${activeTag === tag
                          ? isDarkMode 
                            ? 'bg-cyan-900 text-cyan-100' 
                            : 'bg-blue-100 text-blue-800'
                          : isDarkMode
                            ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    >
                      <Tag size={10} className="mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
                
                {canScrollRight && (
                  <button
                    className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-0.5 
                      ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-black'} shadow-md`}
                    onClick={() => scrollTags('right')}
                  >
                    <ChevronRightIcon size={14} />
                  </button>
                )}
              </div>
            )}
            
            {/* Component list */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className={`animate-spin ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-full text-red-500">
                  <HelpCircle className="mr-2" size={16} />
                  <span>{error}</span>
                </div>
              ) : filteredComponents.length === 0 ? (
                <div className={`flex flex-col justify-center items-center h-full text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Search size={24} className="mb-2 opacity-50" />
                  <p>No components found</p>
                  {hasActiveFilters && (
                    <button
                      className={`mt-2 px-3 py-1 rounded-md text-xs 
                        ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                      onClick={resetFilters}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 pb-4">
                  {filteredComponents.map(component => (
                    <ComponentCard
                      key={component.id}
                      id={component.id}
                      name={component.name}
                      icon={component.icon}
                      type={component.type}
                      footprint={component.footprint}
                      dimensions={component.dimensions}
                      width_px={component.canvas?.width_px}
                      height_px={component.canvas?.height_px}
                      pins={component.pins}
                      tags={component.tags}
                      resistance={component.resistance}
                      color_code={component.color_code}
                      color_hex={component.color_hex}
                      voltage={component.voltage}
                      description={component.description}
                      isDarkMode={isDarkMode}
                      getIcon={getIconForComponent}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Dark Mode Toggle */}
      <div className="flex-shrink-0 mt-4">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between p-2 rounded-md 
            ${isDarkMode 
              ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
              : 'bg-gray-100 text-black hover:bg-gray-200'}`}
        >
          <span className="text-sm font-medium">
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 