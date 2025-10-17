import React from 'react';
import { Undo, Redo, Download, Trash2, Clock, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

const Toolbar = ({ 
  isDarkMode, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  isInterviewMode = false,
  timeRemaining = null,
  formatTime = null,
  onSubmit = null
}) => {
  return (
    <div className={`h-12 ${isDarkMode ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-gray-300'} flex items-center justify-between px-4 shadow-md border-b backdrop-blur-sm font-sans`}>
      <div className="text-lg font-bold tracking-wide uppercase">
        {isInterviewMode ? 'PCB Interview' : 'PCB Designer'}
      </div>
      
      {/* Interview Mode Timer and Submit */}
      {isInterviewMode && timeRemaining !== null && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
          </div>
          <Button 
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Design
          </Button>
        </div>
      )}
      
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