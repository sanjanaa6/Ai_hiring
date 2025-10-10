import React from 'react';
import { Undo, Redo, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

const Toolbar = ({ isDarkMode, onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className={`h-12 ${isDarkMode ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-gray-300'} flex items-center justify-between px-4 shadow-md border-b backdrop-blur-sm font-sans`}>
      <div className="text-lg font-bold tracking-wide uppercase">PCB Designer</div>
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isDarkMode ? "ghost" : "lightGhost"} 
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className={!canUndo ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Undo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent isDarkMode={isDarkMode}>
            <span>Undo (Ctrl+Z)</span>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isDarkMode ? "ghost" : "lightGhost"} 
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className={!canRedo ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent isDarkMode={isDarkMode}>
            <span>Redo (Ctrl+Y)</span>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={isDarkMode ? "ghost" : "lightGhost"} size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent isDarkMode={isDarkMode}>
            <span>Download</span>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={isDarkMode ? "ghost" : "lightGhost"} size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent isDarkMode={isDarkMode}>
            <span>Delete</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default Toolbar; 