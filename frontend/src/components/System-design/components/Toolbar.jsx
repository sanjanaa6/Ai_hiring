import React, { useState } from 'react'
import { MousePointer2, Hand, Square, Circle, Type, ArrowRight, Upload, Download, Trash2, ZoomIn, ZoomOut, Maximize2, Moon, Sun, Undo, Redo, Save, Maximize, Send, Clock, CheckCircle } from 'lucide-react'
import './Toolbar.css'

const Toolbar = ({ tool, setTool, zoom, setZoom, theme, setTheme, onExport, onImport, onClear, onDelete, onUndo, onRedo, canUndo, canRedo, onSave, isInterviewMode, onSubmit, isSubmitting, timeRemaining, formatTime, autoSaveStatus, onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false)
        })
      }
    }
  }
  
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) onImport(file)
    }
    input.click()
  }

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)' },
    { id: 'pan', icon: Hand, label: 'Pan (H)' },
    { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
    { id: 'circle', icon: Circle, label: 'Circle (C)' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow (A)' },
    { id: 'text', icon: Type, label: 'Text (T)' },
  ]

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h1 className="toolbar-logo">
          <span className="logo-icon">◈</span>
          Diagram Studio
        </h1>
      </div>

      <div className="toolbar-section toolbar-tools">
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`toolbar-btn tool-btn ${tool === id ? 'active' : ''}`}
            onClick={() => setTool(id)}
            title={label}
          >
            <Icon size={20} />
            {tool === id && <span className="active-indicator"></span>}
          </button>
        ))}
      </div>

      <div className="toolbar-section">
        <div className="zoom-controls">
          <button
            className="toolbar-btn"
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button
            className="toolbar-btn"
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setZoom(1)}
            title="Reset Zoom"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <button 
          className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={onUndo} 
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={20} />
        </button>
        <button 
          className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          onClick={onRedo} 
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={20} />
        </button>
      </div>

      <div className="toolbar-section" style={{ marginLeft: 'auto' }}>
        {/* Auto-save Status - Only in interview mode */}
        {isInterviewMode && autoSaveStatus && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '15px',
            color: '#10b981',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <CheckCircle size={16} />
            <span>{autoSaveStatus}</span>
          </div>
        )}
        
        {/* Timer - Only in interview mode */}
        {isInterviewMode && timeRemaining !== null && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            background: timeRemaining < 300 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            border: timeRemaining < 300 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)',
            marginRight: '15px',
            fontWeight: 'bold',
            fontSize: '16px',
            color: timeRemaining < 300 ? '#ef4444' : '#3b82f6'
          }}>
            <Clock size={20} />
            <span style={{ fontFamily: 'monospace' }}>{formatTime(timeRemaining)}</span>
          </div>
        )}
        
        {/* Submit Button - Only in interview mode */}
        {isInterviewMode && onSubmit && (
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            title="Submit System Design"
            style={{
              background: isSubmitting ? '#6b7280' : 'linear-gradient(to right, #10b981, #059669)',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginRight: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Submit Design</span>
              </>
            )}
          </button>
        )}
        
        {/* Back to Interview Button - Only in interview mode */}
        {isInterviewMode && onBack && (
          <button 
            onClick={onBack}
            title="Back to Interview"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              marginRight: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
            <span>Back to Interview</span>
          </button>
        )}
        
        {/* Download JSON - Only in non-interview mode */}
        {!isInterviewMode && (
          <button 
            onClick={onExport} 
            title="Download JSON"
            style={{
              background: '#10b981',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              marginRight: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={18} />
            Download JSON
          </button>
        )}
        
        {!isInterviewMode && (
          <button 
            className="toolbar-btn" 
            onClick={onSave} 
            title="Save Diagram (Ctrl+S)"
          >
            <Save size={20} />
          </button>
        )}
        {!isInterviewMode && (
          <button 
            className="toolbar-btn theme-toggle" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        {!isInterviewMode && (
          <>
            <button 
              className={`toolbar-btn ${isFullscreen ? 'active' : ''}`}
              onClick={toggleFullscreen} 
              title="Toggle Fullscreen"
            >
              <Maximize size={20} />
            </button>
            <button className="toolbar-btn" onClick={handleImport} title="Import Diagram">
              <Upload size={20} />
            </button>
            <button className="toolbar-btn toolbar-btn-danger" onClick={onDelete} title="Delete Selected (Del)">
              <Trash2 size={20} />
            </button>
            <button className="toolbar-btn toolbar-btn-danger" onClick={onClear} title="Clear Canvas">
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Toolbar

