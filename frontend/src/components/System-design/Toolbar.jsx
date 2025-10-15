import React, { useState } from 'react'
import { MousePointer2, Hand, Square, Circle, Type, ArrowRight, Upload, Download, Trash2, ZoomIn, ZoomOut, Maximize2, Moon, Sun, Undo, Redo, Save, Maximize } from 'lucide-react'
import './Toolbar.css'

const Toolbar = ({ tool, setTool, zoom, setZoom, theme, setTheme, onExport, onImport, onClear, onDelete, onUndo, onRedo, canUndo, canRedo, onSave }) => {
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

      <div className="toolbar-section">
        <button 
          className="toolbar-btn" 
          onClick={onSave} 
          title="Save Diagram (Ctrl+S)"
        >
          <Save size={20} />
        </button>
        <button 
          className="toolbar-btn theme-toggle" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
        <button className="toolbar-btn" onClick={onExport} title="Export Diagram">
          <Download size={20} />
        </button>
        <button className="toolbar-btn toolbar-btn-danger" onClick={onDelete} title="Delete Selected (Del)">
          <Trash2 size={20} />
        </button>
        <button className="toolbar-btn toolbar-btn-danger" onClick={onClear} title="Clear Canvas">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar

