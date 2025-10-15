import { useState, useRef, useCallback, useEffect } from 'react'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import PropertyPanel from './components/PropertyPanel'
import QuestionDisplay from './components/QuestionDisplay'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(1)
  const [theme, setTheme] = useState('dark')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isInterviewMode, setIsInterviewMode] = useState(true) // Always true by default
  const [interviewData, setInterviewData] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [showQuestion, setShowQuestion] = useState(true)
  const [questionData, setQuestionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(Date.now())
  const [candidateId, setCandidateId] = useState(null)
  
  // Check URL parameters for interview mode and fetch question
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const accessLink = urlParams.get('accessLink')
    const interviewId = urlParams.get('interviewId')
    const roundId = urlParams.get('roundId')
    const duration = urlParams.get('duration')
    const candidateIdParam = urlParams.get('candidateId')
    
    if (candidateIdParam) {
      setCandidateId(candidateIdParam)
    }
    
    // Check if loaded in iframe (from interview)
    const isInIframe = window.self !== window.top
    
    console.log('🎨 [DEBUG] URL Params:', {
      accessLink,
      interviewId,
      roundId,
      duration,
      isInIframe,
      fullUrl: window.location.href
    })
    
    // Activate interview mode if params exist OR if in iframe
    if (accessLink || (interviewId && roundId) || isInIframe) {
      setIsInterviewMode(true)
      const data = {
        accessLink,
        interviewId,
        roundId,
        duration: duration ? parseInt(duration) : 30
      }
      setInterviewData(data)
      if (duration) {
        setTimeRemaining(parseInt(duration) * 60) // Convert to seconds
      }
      console.log('🎨 System Design - Interview Mode Activated', data)
      console.log('🎨 [DEBUG] isInterviewMode set to TRUE')
      
      // Fetch interview data to get the question
      if (interviewId && roundId) {
        fetchInterviewQuestion(interviewId, roundId)
      } else {
        setLoading(false)
        setShowQuestion(false)
      }
    } else {
      console.log('⚠️ [DEBUG] NOT in interview mode - no params found and not in iframe')
      setLoading(false)
      setShowQuestion(false)
    }
  }, [])
  
  // Fetch interview question
  const fetchInterviewQuestion = async (interviewId, roundId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/interviews/public/${interviewId}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const round = result.data.rounds.find(r => r.roundId === roundId || r._id === roundId)
        if (round && round.questions && round.questions.length > 0) {
          setQuestionData(round.questions[0])
          console.log('🎨 Question loaded:', round.questions[0])
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch question:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle start design button
  const handleStartDesign = () => {
    setShowQuestion(false)
    console.log('🎨 Starting design canvas...')
  }
  
  // Timer Effect
  useEffect(() => {
    if (!isInterviewMode || timeRemaining === null) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isInterviewMode, timeRemaining])

  // Auto-save every 30 seconds in interview mode
  useEffect(() => {
    if (!isInterviewMode) return
    
    const autoSaveInterval = setInterval(() => {
      handleAutoSave()
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [elements, zoom, isInterviewMode])
  
  // Auto-save function
  const handleAutoSave = async () => {
    if (!isInterviewMode || !interviewData) return
    
    try {
      const diagramData = {
        version: '1.0',
        elements: elements,
        metadata: {
          createdAt: new Date().toISOString(),
          zoom: zoom,
          roundId: interviewData.roundId,
          interviewId: interviewData.interviewId
        }
      }
      
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      
      const response = await fetch('http://localhost:5000/api/interviews/system-design/autosave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: interviewData.interviewId,
          roundId: interviewData.roundId,
          diagramData,
          timeSpent,
          candidateId: candidateId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAutoSaveStatus('Saved')
        setTimeout(() => setAutoSaveStatus(''), 2000)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveStatus('Save failed')
    }
  }

  // Submit function
  const handleSubmit = async () => {
    if (!isInterviewMode || !interviewData) return
    
    if (elements.length === 0) {
      if (!window.confirm('Your diagram is empty. Are you sure you want to submit?')) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      const diagramData = {
        version: '1.0',
        elements: elements,
        metadata: {
          createdAt: new Date().toISOString(),
          zoom: zoom,
          roundId: interviewData.roundId,
          interviewId: interviewData.interviewId
        }
      }
      
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      
      const response = await fetch('http://localhost:5000/api/interviews/system-design/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: interviewData.interviewId,
          roundId: interviewData.roundId,
          diagramData,
          timeSpent,
          candidateId: candidateId
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('System design submitted successfully!')
        // Redirect back to interview or show completion message
        if (interviewData.accessLink) {
          window.location.href = `/interview/${interviewData.accessLink}`
        } else if (interviewData.interviewId) {
          window.location.href = `/interview/${interviewData.interviewId}`
        }
      } else {
        alert('Failed to submit: ' + (result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Submission failed:', error)
      alert('Failed to submit diagram. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-submit when time runs out
  const handleAutoSubmit = async () => {
    console.log('Time expired - Auto-submitting...')
    await handleSubmit()
  }
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-green-500 border-r-emerald-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading System Design Challenge...</p>
        </div>
      </div>
    )
  }
  
  // Show question display first in interview mode
  if (isInterviewMode && showQuestion) {
    return (
      <QuestionDisplay
        question={questionData}
        duration={interviewData?.duration || 30}
        onStartDesign={handleStartDesign}
        theme={theme}
      />
    )
  }
  
  return (
    <div className="app" data-theme={theme}>
      <Toolbar 
        tool={tool}
        setTool={setTool}
        zoom={zoom}
        setZoom={setZoom}
        theme={theme}
        setTheme={setTheme}
        onSave={isInterviewMode ? handleAutoSave : saveDiagram}
        onExport={exportDiagram}
        onImport={importDiagram}
        onClear={clearCanvas}
        onDelete={() => selectedElement && deleteElement(selectedElement.id)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isInterviewMode={isInterviewMode}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        autoSaveStatus={autoSaveStatus}
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

