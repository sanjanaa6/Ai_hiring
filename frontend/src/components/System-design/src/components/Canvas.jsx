import { useState, useRef, useEffect, forwardRef } from 'react'
import Element from './Element'
import './Canvas.css'

const Canvas = forwardRef(({ elements, selectedElement, setSelectedElement, updateElement, tool, setTool, zoom, addElement }, ref) => {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [tempPanOffset, setTempPanOffset] = useState({ x: 0, y: 0 })
  const [drawingArrow, setDrawingArrow] = useState(null)
  const [drawingShape, setDrawingShape] = useState(null)


  const handleCanvasClick = (e) => {
    // Only deselect if clicking on empty canvas (not on elements)
    if (!e.target.closest('.element')) {
      setSelectedElement(null)
    }
  }

  const handleMouseDown = (e) => {
    // Allow drawing on empty canvas areas (not on elements)
    if (e.target.closest('.element')) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoom
    const y = (e.clientY - rect.top - panOffset.y) / zoom

    if (tool === 'pan') {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (tool === 'arrow') {
      setDrawingArrow({ x1: x, y1: y, x2: x, y2: y })
    } else if (['rectangle', 'circle', 'text', 'ellipse', 'diamond', 'hexagon', 'triangle', 'rounded-rectangle', 'parallelogram'].includes(tool)) {
      // Start drawing shape
      setDrawingShape({
        type: tool,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      })
    }
  }

  const handleMouseMove = (e) => {
    if (tool === 'pan' && isDragging && dragStart) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setTempPanOffset({ x: dx, y: dy })
    } else if (tool === 'arrow' && drawingArrow) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - panOffset.x) / zoom
      const y = (e.clientY - rect.top - panOffset.y) / zoom
      setDrawingArrow({ ...drawingArrow, x2: x, y2: y })
    } else if (drawingShape) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - panOffset.x) / zoom
      const y = (e.clientY - rect.top - panOffset.y) / zoom
      setDrawingShape({ ...drawingShape, currentX: x, currentY: y })
    }
  }

  const handleMouseUp = (e) => {
    if (tool === 'pan' && isDragging) {
      setPanOffset({
        x: panOffset.x + tempPanOffset.x,
        y: panOffset.y + tempPanOffset.y,
      })
      setTempPanOffset({ x: 0, y: 0 })
      setIsDragging(false)
      setDragStart(null)
    } else if (tool === 'arrow' && drawingArrow) {
      const distance = Math.hypot(drawingArrow.x2 - drawingArrow.x1, drawingArrow.y2 - drawingArrow.y1)
      if (distance > 10) {
        addElement({
          type: 'arrow',
          ...drawingArrow,
        })
      }
      setDrawingArrow(null)
    } else if (drawingShape) {
      const { startX, startY, currentX, currentY, type } = drawingShape
      const width = Math.abs(currentX - startX)
      const height = Math.abs(currentY - startY)
      
      // Only add shape if it has meaningful size
      if (width > 10 && height > 10) {
        addElement({
          type: type,
          x: Math.min(startX, currentX),
          y: Math.min(startY, currentY),
          width: width,
          height: height,
        })
      }
      setDrawingShape(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoom
    const y = (e.clientY - rect.top - panOffset.y) / zoom

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      addElement({
        ...data,
        x: x - 60,
        y: y - 40,
      })
    } catch (error) {
      console.error('Error adding element:', error)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const totalOffset = {
    x: panOffset.x + tempPanOffset.x,
    y: panOffset.y + tempPanOffset.y,
  }

  return (
    <div
      ref={canvasRef}
      className="canvas"
      data-tool={tool}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        className="canvas-content"
        style={{
          transform: `translate(${totalOffset.x}px, ${totalOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <div className="grid-pattern" />
        
        {elements.length === 0 && (
          <div className="empty-canvas-message">
            <div className="empty-canvas-icon">◈</div>
            <h2>Welcome to Diagram Studio!</h2>
            <p>Get started by selecting a tool and dragging on the canvas to draw shapes</p>
            <div className="empty-canvas-tips">
              <div className="tip">
                <strong>Rectangle/Circle Tools:</strong> Click and drag to draw shapes
              </div>
              <div className="tip">
                <strong>Pan Tool (Hand):</strong> Click and drag to move around canvas
              </div>
              <div className="tip">
                <strong>Arrow Tool:</strong> Click and drag to draw connector arrows
              </div>
              <div className="tip">
                <strong>Select Tool:</strong> Click shapes to select, then drag to move
              </div>
            </div>
          </div>
        )}
        
        {/* Tool indicator */}
        <div className="tool-indicator">
          <span className="tool-indicator-label">Active Tool:</span>
          <span className="tool-indicator-value">{tool.charAt(0).toUpperCase() + tool.slice(1)}</span>
        </div>
        
        {elements.map((element) => (
          <Element
            key={element.id}
            element={element}
            isSelected={selectedElement?.id === element.id}
            onSelect={() => setSelectedElement(element)}
            onUpdate={(updates) => updateElement(element.id, updates)}
            zoom={zoom}
          />
        ))}

        {drawingArrow && (
          <svg className="drawing-layer" style={{ pointerEvents: 'none' }}>
            <defs>
              <marker
                id="arrowhead-temp"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#667eea" />
              </marker>
            </defs>
            <line
              x1={drawingArrow.x1}
              y1={drawingArrow.y1}
              x2={drawingArrow.x2}
              y2={drawingArrow.y2}
              stroke="#667eea"
              strokeWidth="2"
              markerEnd="url(#arrowhead-temp)"
            />
          </svg>
        )}

        {drawingShape && (
          <div
            className="drawing-shape-preview"
            style={{
              position: 'absolute',
              left: Math.min(drawingShape.startX, drawingShape.currentX),
              top: Math.min(drawingShape.startY, drawingShape.currentY),
              width: Math.abs(drawingShape.currentX - drawingShape.startX),
              height: Math.abs(drawingShape.currentY - drawingShape.startY),
              border: '2px dashed #667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderRadius: drawingShape.type === 'circle' || drawingShape.type === 'ellipse' ? '50%' : drawingShape.type === 'rounded-rectangle' ? '12px' : '4px',
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas

