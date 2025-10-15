import React from 'react'
import { Palette, Type, Maximize2, RotateCw, Pen, Bold, Italic, Underline, ArrowRight, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'
import './PropertyPanel.css'

const PropertyPanel = ({ element, updateElement }) => {
  const isArrow = element.type === 'arrow'
  const isTextOnly = element.type === 'text'
  const colorPresets = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0',
    '#a8edea', '#fed6e3', '#48bb78', '#ed8936',
    '#f56565', '#9f7aea', '#38b2ac', '#ecc94b',
  ]

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <Palette size={18} />
        <h3>Properties</h3>
      </div>

      <div className="property-section">
        <label className="property-label">
          <Type size={16} />
          Text Content
        </label>
        <textarea
          className="property-textarea"
          value={element.text || ''}
          onChange={(e) => updateElement({ text: e.target.value })}
          placeholder="Enter text... (Double-click shape to edit)"
          rows="3"
        />
      </div>

      <div className="property-section">
        <label className="property-label">
          <Type size={16} />
          Font Size
        </label>
        <div className="slider-with-input">
          <input
            type="range"
            min="8"
            max="72"
            value={element.fontSize || 14}
            onChange={(e) => {
              const newSize = parseInt(e.target.value)
              updateElement({ fontSize: newSize })
            }}
            className="property-slider"
          />
          <input
            type="number"
            min="8"
            max="72"
            value={element.fontSize || 14}
            onChange={(e) => {
              const newSize = parseInt(e.target.value) || 14
              updateElement({ fontSize: newSize })
            }}
            className="property-number-input"
          />
        </div>
      </div>

      <div className="property-section">
        <label className="property-label">
          <Type size={16} />
          Text Style
        </label>
          <div className="text-style-buttons">
            <button
              className={`style-btn ${element.fontWeight === 700 || element.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => updateElement({ 
                fontWeight: element.fontWeight === 700 ? 600 : 700 
              })}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              className={`style-btn ${element.fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => updateElement({ 
                fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              className={`style-btn ${element.textDecoration === 'underline' ? 'active' : ''}`}
              onClick={() => updateElement({ 
                textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' 
              })}
              title="Underline"
            >
              <Underline size={16} />
            </button>
          </div>
      </div>

      <div className="property-section">
        <label className="property-label">
          <AlignLeft size={16} />
          Text Alignment
        </label>
          <div className="text-style-buttons">
            <button
              className={`style-btn ${(!element.textAlign || element.textAlign === 'left') ? 'active' : ''}`}
              onClick={() => updateElement({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              className={`style-btn ${element.textAlign === 'center' ? 'active' : ''}`}
              onClick={() => updateElement({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              className={`style-btn ${element.textAlign === 'right' ? 'active' : ''}`}
              onClick={() => updateElement({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
            <button
              className={`style-btn ${element.textAlign === 'justify' ? 'active' : ''}`}
              onClick={() => updateElement({ textAlign: 'justify' })}
              title="Justify"
            >
              <AlignJustify size={16} />
            </button>
          </div>
      </div>

      {!isTextOnly && (
        <div className="property-section">
          <div className="property-label-with-reset">
            <label className="property-label">
              <Palette size={16} />
              Background Color
            </label>
            {element.originalBackgroundColor && element.backgroundColor !== element.originalBackgroundColor && (
              <button
                className="reset-btn"
                onClick={() => updateElement({ backgroundColor: element.originalBackgroundColor })}
                title="Reset to original color"
              >
                Reset
              </button>
            )}
          </div>
          <div className="color-grid">
            {colorPresets.map((color) => (
              <button
                key={`bg-${color}`}
                className={`color-preset ${element.backgroundColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  updateElement({ backgroundColor: color })
                }}
                title={color}
              />
            ))}
          </div>
          <input
            type="color"
            value={element.backgroundColor || '#667eea'}
            onChange={(e) => {
              updateElement({ backgroundColor: e.target.value })
            }}
            className="color-picker"
          />
        </div>
      )}

      {isArrow && (
        <div className="property-section">
          <label className="property-label">
            <ArrowRight size={16} />
            Arrow Style
          </label>
          <div className="arrow-style-buttons">
            <button
              className={`style-btn ${(!element.lineStyle || element.lineStyle === 'solid') ? 'active' : ''}`}
              onClick={() => updateElement({ lineStyle: 'solid' })}
              title="Solid Line"
            >
              <div style={{ width: '30px', height: '2px', background: 'currentColor' }} />
            </button>
            <button
              className={`style-btn ${element.lineStyle === 'dashed' ? 'active' : ''}`}
              onClick={() => updateElement({ lineStyle: 'dashed' })}
              title="Dashed Line"
            >
              <div style={{ width: '30px', height: '2px', background: 'repeating-linear-gradient(to right, currentColor 0, currentColor 5px, transparent 5px, transparent 10px)' }} />
            </button>
            <button
              className={`style-btn ${element.lineStyle === 'dotted' ? 'active' : ''}`}
              onClick={() => updateElement({ lineStyle: 'dotted' })}
              title="Dotted Line"
            >
              <div style={{ width: '30px', height: '2px', background: 'repeating-linear-gradient(to right, currentColor 0, currentColor 2px, transparent 2px, transparent 7px)' }} />
            </button>
          </div>
        </div>
      )}

      {!isTextOnly && (
        <div className="property-section">
          <div className="property-label-with-reset">
            <label className="property-label">
              <Pen size={16} />
              {isArrow ? 'Line Color' : 'Border Color'}
            </label>
          {element.originalBorderColor && element.borderColor !== element.originalBorderColor && (
            <button
              className="reset-btn"
              onClick={() => updateElement({ borderColor: element.originalBorderColor })}
              title="Reset to original color"
            >
              Reset
            </button>
          )}
        </div>
        <div className="color-grid">
          {colorPresets.map((color) => (
            <button
              key={`border-${color}`}
              className={`color-preset ${element.borderColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                updateElement({ borderColor: color })
              }}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={element.borderColor || '#5a67d8'}
          onChange={(e) => {
            updateElement({ borderColor: e.target.value })
          }}
          className="color-picker"
        />
      </div>
      )}

      {!isTextOnly && (
        <div className="property-section">
          <label className="property-label">
            <Pen size={16} />
            {isArrow ? 'Line Width' : 'Border Width'}
          </label>
        <div className="slider-with-input">
          <input
            type="range"
            min="1"
            max="10"
            value={element.borderWidth || 2}
            onChange={(e) => updateElement({ borderWidth: parseInt(e.target.value) })}
            className="property-slider"
          />
          <input
            type="number"
            min="1"
            max="10"
            value={element.borderWidth || 2}
            onChange={(e) => updateElement({ borderWidth: parseInt(e.target.value) || 2 })}
            className="property-number-input"
          />
        </div>
      </div>
      )}

      <div className="property-section">
        <label className="property-label">
          <Type size={16} />
          Text Color
        </label>
        <input
          type="color"
          value={element.textColor || '#ffffff'}
          onChange={(e) => updateElement({ textColor: e.target.value })}
          className="color-picker"
        />
      </div>

      <div className="property-section">
        <label className="property-label">
          <Maximize2 size={16} />
          Size
        </label>
        <div className="property-row">
          <div className="property-input-group">
            <label>W</label>
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => updateElement({ width: parseInt(e.target.value) || 100 })}
              className="property-input-small"
            />
          </div>
          <div className="property-input-group">
            <label>H</label>
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => updateElement({ height: parseInt(e.target.value) || 100 })}
              className="property-input-small"
            />
          </div>
        </div>
      </div>

      <div className="property-section">
        <label className="property-label">
          <RotateCw size={16} />
          Rotation
        </label>
        <div className="slider-with-input">
          <input
            type="range"
            min="0"
            max="360"
            value={element.rotation || 0}
            onChange={(e) => updateElement({ rotation: parseInt(e.target.value) })}
            className="property-slider"
          />
          <input
            type="number"
            min="0"
            max="360"
            value={element.rotation || 0}
            onChange={(e) => updateElement({ rotation: parseInt(e.target.value) || 0 })}
            className="property-number-input"
          />
        </div>
      </div>

      <div className="property-info">
        <div className="info-item">
          <span className="info-label">Type:</span>
          <span className="info-value">{element.type}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Position:</span>
          <span className="info-value">
            X: {Math.round(element.x)}, Y: {Math.round(element.y)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PropertyPanel

