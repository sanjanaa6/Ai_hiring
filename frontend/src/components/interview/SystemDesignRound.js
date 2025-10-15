import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';

// Import System Design components
import Canvas from '../System-design/components/Canvas';
import Sidebar from '../System-design/components/Sidebar';
import Toolbar from '../System-design/components/Toolbar';
import PropertyPanel from '../System-design/components/PropertyPanel';
import '../System-design/index.css';
import '../System-design/App.css';

const SystemDesignRound = ({ 
  round, 
  interviewId, 
  candidateInfo,
  onComplete,
  onBack 
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // System Design Tool State
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef(null);
  
  // Round Management State
  const [timeRemaining, setTimeRemaining] = useState(round.duration * 60); // Convert minutes to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [startTime] = useState(Date.now());
  
  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [elements, zoom]);

  // System Design Tool Functions
  const saveToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newElements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const addElement = useCallback((element) => {
    const initialColor = element.color || element.backgroundColor || '#667eea';
    
    const newElement = {
      ...element,
      id: Date.now() + Math.random(),
      x: element.x || 100,
      y: element.y || 100,
      width: element.width || (element.type === 'text' ? 200 : 120),
      height: element.height || (element.type === 'text' ? 60 : 80),
      rotation: 0,
      backgroundColor: initialColor,
      borderColor: element.borderColor || '#5a67d8',
      borderWidth: element.borderWidth || 2,
      text: element.text || '',
      fontSize: element.fontSize || (element.type === 'text' ? 16 : 14),
      textColor: element.textColor || '#ffffff',
      originalBackgroundColor: initialColor,
      originalBorderColor: element.borderColor || '#5a67d8',
      iconType: element.iconType,
      label: element.label,
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
  }, [elements, saveToHistory]);

  const updateElement = useCallback((id, updates) => {
    const newElements = elements.map(el => {
      if (el.id === id) {
        const updatedElement = { ...el, ...updates };
        if (selectedElement?.id === id) {
          setSelectedElement(updatedElement);
        }
        return updatedElement;
      }
      return el;
    });
    setElements(newElements);
    saveToHistory(newElements);
  }, [elements, saveToHistory, selectedElement]);

  const deleteElement = useCallback((id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  }, [selectedElement, elements, saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElement(null);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElement(null);
    }
  }, [historyIndex, history]);

  const saveDiagram = useCallback(() => {
    return {
      version: '1.0',
      elements: elements,
      metadata: {
        createdAt: new Date().toISOString(),
        zoom: zoom,
        roundId: round.roundId,
        interviewId: interviewId
      }
    };
  }, [elements, zoom, round.roundId, interviewId]);

  const exportDiagram = useCallback(() => {
    const diagram = saveDiagram();
    const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-design-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [saveDiagram]);

  const importDiagram = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const diagram = JSON.parse(e.target.result);
        setElements(diagram.elements || []);
        setZoom(diagram.metadata?.zoom || 1);
        setSelectedElement(null);
      } catch (error) {
        alert('Invalid diagram file');
      }
    };
    reader.readAsText(file);
  }, []);

  const clearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      const newElements = [];
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
    }
  }, [saveToHistory]);

  // Auto-save function
  const handleAutoSave = async () => {
    try {
      const diagramData = saveDiagram();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Ensure candidateId exists
      const candidateId = candidateInfo?.id || 
                         localStorage.getItem('candidateId') || 
                         `candidate_${Date.now()}`;
      
      await apiService.post('/interviews/system-design/autosave', {
        interviewId,
        roundId: round.roundId,
        diagramData,
        timeSpent,
        candidateId: candidateId,
        candidateName: candidateInfo?.name || localStorage.getItem('candidateName') || 'Anonymous',
        candidateEmail: candidateInfo?.email || localStorage.getItem('candidateEmail') || 'unknown@email.com'
      });
      
      setAutoSaveStatus('Saved');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('Save failed');
    }
  };

  // Submit function
  const handleSubmit = async () => {
    if (elements.length === 0) {
      if (!window.confirm('Your diagram is empty. Are you sure you want to submit?')) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const diagramData = saveDiagram();
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Ensure candidateId exists
      const candidateId = candidateInfo?.id || 
                         localStorage.getItem('candidateId') || 
                         `candidate_${Date.now()}`;
      
      const response = await apiService.post('/interviews/system-design/submit', {
        interviewId,
        roundId: round.roundId,
        diagramData,
        timeSpent,
        candidateId: candidateId,
        candidateName: candidateInfo?.name || localStorage.getItem('candidateName') || 'Anonymous',
        candidateEmail: candidateInfo?.email || localStorage.getItem('candidateEmail') || 'unknown@email.com'
      });

      if (response.data.success) {
        if (onComplete) {
          onComplete(round.roundId);
        }
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit diagram. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit when time runs out
  const handleAutoSubmit = async () => {
    console.log('Time expired - Auto-submitting...');
    await handleSubmit();
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleAutoSave();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === 'v') setTool('select');
      else if (key === 'h') setTool('pan');
      else if (key === 'r') setTool('rectangle');
      else if (key === 'c') setTool('circle');
      else if (key === 't') setTool('text');
      else if (key === 'a') setTool('arrow');
      else if (key === 'delete' && selectedElement) {
        deleteElement(selectedElement.id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedElement, deleteElement, undo, redo]);

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with Timer and Instructions */}
      <div className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {round.title}
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {round.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save Status */}
              {autoSaveStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {autoSaveStatus}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Design</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* System Design Tool */}
      <div className="h-[calc(100vh-180px)] app" data-theme={isDarkMode ? 'dark' : 'light'}>
        <Toolbar 
          tool={tool}
          setTool={setTool}
          zoom={zoom}
          setZoom={setZoom}
          theme={isDarkMode ? 'dark' : 'light'}
          setTheme={() => {}} // Disable theme toggle in interview mode
          onSave={handleAutoSave}
          onExport={exportDiagram}
          onImport={importDiagram}
          onClear={clearCanvas}
          onDelete={() => selectedElement && deleteElement(selectedElement.id)}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          isInterviewMode={true}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          timeRemaining={timeRemaining}
          formatTime={formatTime}
          autoSaveStatus={autoSaveStatus}
          onBack={onBack}
        />
        <div className="workspace h-full" data-theme={isDarkMode ? 'dark' : 'light'}>
          <Sidebar onAddElement={addElement} />
          <Canvas
            ref={canvasRef}
            elements={elements}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            updateElement={updateElement}
            tool={tool}
            setTool={setTool}
            zoom={zoom}
            addElement={addElement}
          />
          {selectedElement && (
            <PropertyPanel
              element={selectedElement}
              updateElement={(updates) => updateElement(selectedElement.id, updates)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemDesignRound;
