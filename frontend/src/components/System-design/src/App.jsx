import { useState, useRef, useCallback, useEffect } from 'react'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import PropertyPanel from './components/PropertyPanel'
import './App.css'

function App() {
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(1)
  const [theme, setTheme] = useState('dark')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef(null)

  const saveToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      return [...newHistory, newElements]
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const addElement = useCallback((element) => {
    // Use color from sidebar if available, otherwise use backgroundColor or default
    const initialColor = element.color || element.backgroundColor || '#667eea'
    
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
      // Store original colors for reset
      originalBackgroundColor: initialColor,
      originalBorderColor: element.borderColor || '#5a67d8',
      // Keep iconType and label for proper rendering
      iconType: element.iconType,
      label: element.label,
    }
    
    const newElements = [...elements, newElement]
    setElements(newElements)
    saveToHistory(newElements)
  }, [elements, saveToHistory])

  const updateElement = useCallback((id, updates) => {
    const newElements = elements.map(el => {
      if (el.id === id) {
        const updatedElement = { ...el, ...updates }
        // Update selectedElement if this is the selected element
        if (selectedElement?.id === id) {
          setSelectedElement(updatedElement)
        }
        return updatedElement
      }
      return el
    })
    setElements(newElements)
    saveToHistory(newElements)
  }, [elements, saveToHistory, selectedElement])

  const deleteElement = useCallback((id) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    saveToHistory(newElements)
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
  }, [selectedElement, elements, saveToHistory])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
      setSelectedElement(null)
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
      setSelectedElement(null)
    }
  }, [historyIndex, history])

  const saveDiagram = useCallback(() => {
    const data = {
      elements,
      zoom,
      theme,
    }
    localStorage.setItem('drawio-clone-diagram', JSON.stringify(data))
    // Visual feedback
    console.log('Diagram saved!')
  }, [elements, zoom, theme])

  const exportDiagram = useCallback(() => {
    const diagram = {
      version: '1.0',
      elements: elements,
      metadata: {
        createdAt: new Date().toISOString(),
        zoom: zoom,
      }
    }
    const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagram-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [elements, zoom])

  const importDiagram = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const diagram = JSON.parse(e.target.result)
        setElements(diagram.elements || [])
        setZoom(diagram.metadata?.zoom || 1)
        setSelectedElement(null)
      } catch (error) {
        alert('Invalid diagram file')
      }
    }
    reader.readAsText(file)
  }, [])

  const clearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      const newElements = []
      setElements(newElements)
      saveToHistory(newElements)
      setSelectedElement(null)
    }
  }, [saveToHistory])

  // Load saved diagram on mount
  useEffect(() => {
    const saved = localStorage.getItem('drawio-clone-diagram')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.elements) {
          setElements(data.elements)
          setHistory([data.elements])
          setHistoryIndex(0)
        }
        if (data.zoom) setZoom(data.zoom)
        if (data.theme) setTheme(data.theme)
      } catch (err) {
        console.error('Error loading saved diagram:', err)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      // Save shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveDiagram()
        return
      }
      
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      
      const key = e.key.toLowerCase()
      if (key === 'v') setTool('select')
      else if (key === 'h') setTool('pan')
      else if (key === 'r') setTool('rectangle')
      else if (key === 'c') setTool('circle')
      else if (key === 't') setTool('text')
      else if (key === 'a') setTool('arrow')
      else if (key === 'delete' && selectedElement) {
        deleteElement(selectedElement.id)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedElement, deleteElement, undo, redo, saveDiagram])

  return (
    <div className="app" data-theme={theme}>
      <Toolbar 
        tool={tool}
        setTool={setTool}
        zoom={zoom}
        setZoom={setZoom}
        theme={theme}
        setTheme={setTheme}
        onSave={saveDiagram}
        onExport={exportDiagram}
        onImport={importDiagram}
        onClear={clearCanvas}
        onDelete={() => selectedElement && deleteElement(selectedElement.id)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      <div className="workspace">
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
  )
}

export default App

