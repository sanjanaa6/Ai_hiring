import { useState, useRef, useEffect } from 'react'
import { Server, Cloud, Database, HardDrive, Cpu, Network, Globe, Lock, Mail, Users, Code, Layers } from 'lucide-react'
import './Element.css'

const Element = ({ element, isSelected, onSelect, onUpdate, zoom }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null)
  const [dragStart, setDragStart] = useState(null)
  const [resizeStart, setResizeStart] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const elementRef = useRef(null)
  const textRef = useRef(null)

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle') || e.target.classList.contains('arrow-handle')) {
      return
    }
    e.stopPropagation()
    onSelect()
    
    // For arrows, we need to handle differently
    if (element.type === 'arrow') {
      setIsDragging(true)
      setDragStart({
        x: e.clientX / zoom,
        y: e.clientY / zoom,
        x1: element.x1,
        y1: element.y1,
        x2: element.x2,
        y2: element.y2,
      })
    } else {
      setIsDragging(true)
      setDragStart({
        x: e.clientX / zoom - element.x,
        y: e.clientY / zoom - element.y,
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && dragStart) {
      if (element.type === 'arrow') {
        // Move arrow by delta
        const currentX = e.clientX / zoom
        const currentY = e.clientY / zoom
        const deltaX = currentX - dragStart.x
        const deltaY = currentY - dragStart.y
        
        onUpdate({
          x1: dragStart.x1 + deltaX,
          y1: dragStart.y1 + deltaY,
          x2: dragStart.x2 + deltaX,
          y2: dragStart.y2 + deltaY,
        })
      } else {
        const newX = e.clientX / zoom - dragStart.x
        const newY = e.clientY / zoom - dragStart.y
        onUpdate({
          x: newX,
          y: newY,
        })
      }
    } else if (isResizing && resizeHandle && resizeStart) {
      const currentX = e.clientX / zoom
      const currentY = e.clientY / zoom
      
      const deltaX = currentX - resizeStart.mouseX
      const deltaY = currentY - resizeStart.mouseY

      // Handle arrow endpoint dragging
      if (resizeHandle === 'arrow-start') {
        onUpdate({
          x1: resizeStart.x1 + deltaX,
          y1: resizeStart.y1 + deltaY,
        })
      } else if (resizeHandle === 'arrow-end') {
        onUpdate({
          x2: resizeStart.x2 + deltaX,
          y2: resizeStart.y2 + deltaY,
        })
      } else if (resizeHandle === 'se') {
        const newWidth = Math.max(40, resizeStart.width + deltaX)
        const newHeight = Math.max(30, resizeStart.height + deltaY)
        onUpdate({
          width: newWidth,
          height: newHeight,
        })
      } else if (resizeHandle === 'sw') {
        const newWidth = Math.max(40, resizeStart.width - deltaX)
        const newHeight = Math.max(30, resizeStart.height + deltaY)
        onUpdate({
          x: resizeStart.x + (resizeStart.width - newWidth),
          width: newWidth,
          height: newHeight,
        })
      } else if (resizeHandle === 'ne') {
        const newWidth = Math.max(40, resizeStart.width + deltaX)
        const newHeight = Math.max(30, resizeStart.height - deltaY)
        onUpdate({
          y: resizeStart.y + (resizeStart.height - newHeight),
          width: newWidth,
          height: newHeight,
        })
      } else if (resizeHandle === 'nw') {
        const newWidth = Math.max(40, resizeStart.width - deltaX)
        const newHeight = Math.max(30, resizeStart.height - deltaY)
        onUpdate({
          x: resizeStart.x + (resizeStart.width - newWidth),
          y: resizeStart.y + (resizeStart.height - newHeight),
          width: newWidth,
          height: newHeight,
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setDragStart(null)
    setResizeStart(null)
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      const moveHandler = handleMouseMove
      const upHandler = handleMouseUp
      
      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('mouseup', upHandler)
      return () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('mouseup', upHandler)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeHandle, resizeStart, element, zoom, handleMouseMove, handleMouseUp])

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleTextChange = (e) => {
    onUpdate({ text: e.target.value })
  }

  const handleTextBlur = () => {
    setIsEditing(false)
  }

  const handleResizeMouseDown = (e, handle) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStart({
      mouseX: e.clientX / zoom,
      mouseY: e.clientY / zoom,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      // For arrows
      x1: element.x1,
      y1: element.y1,
      x2: element.x2,
      y2: element.y2,
    })
  }

  const renderShape = () => {
    const { type, width, height, backgroundColor, borderColor, borderWidth } = element

    if (type === 'arrow') {
      const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1) * 180 / Math.PI
      const length = Math.hypot(element.x2 - element.x1, element.y2 - element.y1)
      
      return (
        <svg
          className="arrow-element"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <defs>
            <marker
              id={`arrowhead-${element.id}`}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill={borderColor} />
            </marker>
          </defs>
          <line
            x1="0"
            y1="0"
            x2={length}
            y2="0"
            stroke={borderColor}
            strokeWidth={borderWidth}
            markerEnd={`url(#arrowhead-${element.id})`}
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '0 0',
            }}
          />
        </svg>
      )
    }

    const shapes = {
      rectangle: (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '4px',
          }}
        />
      ),
      'rounded-rectangle': (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '12px',
          }}
        />
      ),
      circle: (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '50%',
          }}
        />
      ),
      ellipse: (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '50%',
          }}
        />
      ),
      diamond: (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            transform: 'rotate(45deg)',
          }}
        />
      ),
      hexagon: (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="25,0 75,0 100,50 75,100 25,100 0,50"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      triangle: (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,0 100,100 0,100"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      parallelogram: (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="20,0 100,0 80,100 0,100"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      pentagon: (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,0 100,40 82,100 18,100 0,40"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      trapezoid: (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="25,0 75,0 100,100 0,100"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      star: (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      // Arrow shapes - rendered as actual arrows
      'arrow-right': (
        <svg width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none">
          <polygon
            points="0,8 85,8 85,0 120,20 85,40 85,32 0,32"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'arrow-left': (
        <svg width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none">
          <polygon
            points="120,8 35,8 35,0 0,20 35,40 35,32 120,32"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'arrow-up': (
        <svg width="100%" height="100%" viewBox="0 0 40 120" preserveAspectRatio="none">
          <polygon
            points="8,120 8,35 0,35 20,0 40,35 32,35 32,120"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'arrow-down': (
        <svg width="100%" height="100%" viewBox="0 0 40 120" preserveAspectRatio="none">
          <polygon
            points="8,0 8,85 0,85 20,120 40,85 32,85 32,0"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'double-arrow': (
        <svg width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none">
          <g fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth}>
            <polygon points="0,8 50,8 50,0 70,20 50,40 50,32 0,32" />
            <polygon points="120,8 70,8 70,0 50,20 70,40 70,32 120,32" />
          </g>
        </svg>
      ),
      'curved-arrow': (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 20,80 Q 20,20 80,20 L 80,10 L 95,25 L 80,40 L 80,30 Q 30,30 30,80"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'block-arrow': (
        <svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none">
          <polygon
            points="0,15 70,15 70,0 120,30 70,60 70,45 0,45"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      // Flowchart shapes
      'process': (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '4px',
          }}
        />
      ),
      'decision': (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            transform: 'rotate(45deg)',
          }}
        />
      ),
      'start-end': (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '50px',
          }}
        />
      ),
      'input-output': (
        <svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none">
          <polygon
            points="15,0 120,0 105,60 0,60"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'document': (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 0,0 L 100,0 L 100,85 Q 75,95 50,85 T 0,85 Z"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'predefined': (
        <svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none">
          <rect x="0" y="0" width="120" height="60" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <line x1="15" y1="0" x2="15" y2="60" stroke={borderColor} strokeWidth={borderWidth} />
          <line x1="105" y1="0" x2="105" y2="60" stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      ),
      'database-flow': (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse cx="50" cy="15" rx="50" ry="15" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="0" y="15" width="100" height="70" fill={backgroundColor} stroke="none" />
          <line x1="0" y1="15" x2="0" y2="85" stroke={borderColor} strokeWidth={borderWidth} />
          <line x1="100" y1="15" x2="100" y2="85" stroke={borderColor} strokeWidth={borderWidth} />
          <ellipse cx="50" cy="85" rx="50" ry="15" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      ),
      'manual-input': (
        <svg width="100%" height="100%" viewBox="0 0 120 60" preserveAspectRatio="none">
          <polygon
            points="0,15 120,0 120,60 0,60"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'delay': (
        <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
          <path
            d="M 0,0 L 70,0 Q 100,30 70,60 L 0,60 Z"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'stored-data': (
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
          <path
            d="M 15,0 L 100,0 L 85,80 L 0,80 Q 15,40 15,0"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      // UML shapes
      'uml-class': (
        <svg width="100%" height="100%" viewBox="0 0 120 100" preserveAspectRatio="none">
          <rect x="0" y="0" width="120" height="100" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <line x1="0" y1="30" x2="120" y2="30" stroke={borderColor} strokeWidth={borderWidth} />
          <line x1="0" y1="60" x2="120" y2="60" stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      ),
      'uml-actor': (
        <svg width="100%" height="100%" viewBox="0 0 60 120" preserveAspectRatio="xMidYMid meet">
          <circle cx="30" cy="20" r="15" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <line x1="30" y1="35" x2="30" y2="70" stroke={borderColor} strokeWidth={borderWidth * 1.5} />
          <line x1="10" y1="50" x2="50" y2="50" stroke={borderColor} strokeWidth={borderWidth * 1.5} />
          <line x1="30" y1="70" x2="10" y2="100" stroke={borderColor} strokeWidth={borderWidth * 1.5} />
          <line x1="30" y1="70" x2="50" y2="100" stroke={borderColor} strokeWidth={borderWidth * 1.5} />
        </svg>
      ),
      'uml-usecase': (
        <div
          className="shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '50%',
          }}
        />
      ),
      'uml-component': (
        <svg width="100%" height="100%" viewBox="0 0 120 80" preserveAspectRatio="none">
          <rect x="0" y="0" width="120" height="80" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="-5" y="15" width="15" height="12" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="-5" y="40" width="15" height="12" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      ),
      'uml-note': (
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
          <path
            d="M 0,0 L 80,0 L 100,20 L 100,80 L 0,80 Z"
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
          <polyline
            points="80,0 80,20 100,20"
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      ),
      'uml-package': (
        <svg width="100%" height="100%" viewBox="0 0 120 100" preserveAspectRatio="none">
          <rect x="0" y="20" width="120" height="80" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="0" y="0" width="50" height="20" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      ),
      // Entity Relation shapes
      'er-entity': (
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="80" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="20" y="25" width="60" height="30" fill="none" stroke={borderColor} strokeWidth={borderWidth * 0.7} />
        </svg>
      ),
      'er-attribute': (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <circle cx="50" cy="50" r="48" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <circle cx="50" cy="50" r="30" fill="none" stroke={borderColor} strokeWidth={borderWidth * 0.7} />
        </svg>
      ),
      'er-relationship': (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <g transform="rotate(45 50 50)">
            <rect x="15" y="15" width="70" height="70" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
            <rect x="30" y="30" width="40" height="40" fill="none" stroke={borderColor} strokeWidth={borderWidth * 0.7} />
          </g>
        </svg>
      ),
      'er-weak-entity': (
        <svg width="100%" height="100%" viewBox="0 0 120 80" preserveAspectRatio="none">
          <rect x="5" y="5" width="110" height="70" fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="0" y="0" width="120" height="80" fill="none" stroke={borderColor} strokeWidth={borderWidth} />
          <rect x="15" y="30" width="90" height="20" fill="none" stroke={borderColor} strokeWidth={borderWidth * 0.7} />
        </svg>
      ),
    }

    // System icons with Lucide React components
    const lucideIcons = {
      'server': Server,
      'cloud': Cloud,
      'database': Database,
      'storage': HardDrive,
      'cpu': Cpu,
      'network': Network,
      'globe': Globe,
      'security': Lock,
      'mail': Mail,
      'users': Users,
      'api': Code,
      'layers': Layers,
    }

    // AWS icons with emojis and DEFAULT colors (will use element's backgroundColor if customized)
    const awsIconsConfig = {
      'aws-s3': { emoji: '🪣', label: 'S3', defaultColor: '#569A31' },
      'aws-lambda': { emoji: 'λ', label: 'Lambda', defaultColor: '#FF9900', isSymbol: true },
      'aws-ec2': { emoji: '🖥', label: 'EC2', defaultColor: '#FF9900' },
      'aws-rds': { emoji: '💾', label: 'RDS', defaultColor: '#527FFF' },
      'aws-dynamodb': { emoji: '▦', label: 'DynamoDB', defaultColor: '#4053D6', isSymbol: true },
      'aws-cloudfront': { emoji: '🌐', label: 'CloudFront', defaultColor: '#7A3E65' },
      'aws-route53': { emoji: '🛣', label: 'Route 53', defaultColor: '#4B612C' },
      'aws-apigateway': { emoji: '🔌', label: 'API Gateway', defaultColor: '#FF4F8B' },
    }

    // Database icons with emojis and DEFAULT colors
    const databaseIconsConfig = {
      'mongodb': { emoji: '🍃', label: 'MongoDB', defaultColor: '#47A248' },
      'mysql': { emoji: '🐬', label: 'MySQL', defaultColor: '#4479A1' },
      'postgresql': { emoji: '🐘', label: 'PostgreSQL', defaultColor: '#336791' },
      'redis': { emoji: '◆', label: 'Redis', defaultColor: '#DC382D', isSymbol: true },
      'cassandra': { emoji: '⚡', label: 'Cassandra', defaultColor: '#1287B1' },
      'elasticsearch': { emoji: '🔍', label: 'Elasticsearch', defaultColor: '#FEC514' },
    }

    // Map to check if type exists in configs
    const awsIcons = awsIconsConfig
    const databaseIcons = databaseIconsConfig

    // Render Lucide icon components (System icons)
    if (lucideIcons[type]) {
      const IconComponent = lucideIcons[type]
      const iconLabels = {
        'server': 'Server',
        'cloud': 'Cloud',
        'database': 'Database',
        'storage': 'Storage',
        'cpu': 'Processor',
        'network': 'Network',
        'globe': 'Internet',
        'security': 'Security',
        'mail': 'Email',
        'users': 'Users',
        'api': 'API',
        'layers': 'Layers',
      }
      
      return (
        <div
          className="shape icon-shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
          }}
        >
          <IconComponent size={Math.min(width, height) * 0.35} color="#ffffff" strokeWidth={2.5} />
          {!element.text && (
            <span style={{
              fontSize: `${Math.max(12, Math.min(width, height) * 0.12)}px`,
              fontWeight: '600',
              color: '#ffffff',
              textAlign: 'center',
              marginTop: '4px',
            }}>
              {iconLabels[type]}
            </span>
          )}
        </div>
      )
    }

    // Render AWS icons with emojis
    if (awsIcons[type]) {
      const icon = awsIcons[type]
      return (
        <div
          className="shape icon-shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.backgroundColor, // Use element's backgroundColor directly
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '6px',
            padding: '16px',
          }}
        >
          <span style={{
            fontSize: icon.isSymbol ? `${Math.min(width, height) * 0.4}px` : `${Math.min(width, height) * 0.35}px`,
            lineHeight: 1,
          }}>
            {icon.emoji}
          </span>
          {!element.text && (
            <span style={{
              fontSize: `${Math.max(12, Math.min(width, height) * 0.12)}px`,
              fontWeight: '600',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              {icon.label}
            </span>
          )}
        </div>
      )
    }

    // Render Database icons with emojis
    if (databaseIcons[type]) {
      const icon = databaseIcons[type]
      return (
        <div
          className="shape icon-shape"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.backgroundColor, // Use element's backgroundColor directly
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '6px',
            padding: '16px',
          }}
        >
          <span style={{
            fontSize: icon.isSymbol ? `${Math.min(width, height) * 0.4}px` : `${Math.min(width, height) * 0.35}px`,
            lineHeight: 1,
          }}>
            {icon.emoji}
          </span>
          {!element.text && (
            <span style={{
              fontSize: `${Math.max(12, Math.min(width, height) * 0.12)}px`,
              fontWeight: '600',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              {icon.label}
            </span>
          )}
        </div>
      )
    }

    return shapes[type] || shapes.rectangle
  }

  if (element.type === 'arrow') {
    const length = Math.hypot(element.x2 - element.x1, element.y2 - element.y1)
    const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1) * 180 / Math.PI
    
    // Get line style
    const lineStyle = element.lineStyle || 'solid'
    const strokeDasharray = lineStyle === 'dashed' ? '10,5' : lineStyle === 'dotted' ? '2,5' : 'none'

    return (
      <div
        ref={elementRef}
        className={`element arrow-container ${isSelected ? 'selected' : ''}`}
        style={{
          left: element.x1,
          top: element.y1,
          width: length,
          height: Math.max(20, element.borderWidth * 2 + 10),
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <svg width={length} height={Math.max(20, element.borderWidth * 2 + 10)} style={{ overflow: 'visible' }}>
          <defs>
            <marker
              id={`arrowhead-${element.id}`}
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <polygon points="0 0, 12 6, 0 12" fill={element.borderColor || '#667eea'} />
            </marker>
          </defs>
          <line
            x1="0"
            y1={Math.max(10, element.borderWidth + 5)}
            x2={length}
            y2={Math.max(10, element.borderWidth + 5)}
            stroke={element.borderColor || '#667eea'}
            strokeWidth={element.borderWidth || 2}
            strokeDasharray={strokeDasharray}
            markerEnd={`url(#arrowhead-${element.id})`}
            style={{ pointerEvents: 'stroke', strokeLinecap: 'round' }}
          />
        </svg>
        {isSelected && (
          <>
            <div 
              className="arrow-handle start" 
              style={{
                position: 'absolute',
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                background: '#4299e1',
                border: '3px solid white',
                borderRadius: '50%',
                cursor: 'move',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'arrow-start')}
            />
            <div 
              className="arrow-handle end" 
              style={{
                position: 'absolute',
                right: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                background: '#48bb78',
                border: '3px solid white',
                borderRadius: '50%',
                cursor: 'move',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'arrow-end')}
            />
          </>
        )}
      </div>
    )
  }

  // For text-only elements (no shape background)
  if (element.type === 'text') {
    return (
      <div
        ref={elementRef}
        className={`element text-only-element ${isSelected ? 'selected' : ''}`}
        style={{
          left: element.x,
          top: element.y,
          minWidth: element.width || 100,
          minHeight: element.height || 40,
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '8px',
          background: isSelected ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
          border: isSelected ? '2px dashed var(--primary-color)' : '2px dashed transparent',
          borderRadius: '4px',
          transform: `rotate(${element.rotation || 0}deg)`,
          transformOrigin: 'center',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {element.text || !isEditing ? (
          <div
            style={{
              color: element.textColor || '#ffffff',
              fontSize: `${element.fontSize || 16}px`,
              fontWeight: element.fontWeight || 400,
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.textDecoration || 'none',
              textAlign: element.textAlign || 'center',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              minHeight: '1em',
            }}
          >
            {element.text || 'Double-click to edit'}
          </div>
        ) : null}

        {isEditing && (
          <textarea
            ref={textRef}
            className="element-text-input"
            value={element.text}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleTextBlur()
              }
            }}
            autoFocus
            style={{
              fontSize: `${element.fontSize || 16}px`,
              color: element.textColor || '#ffffff',
              fontWeight: element.fontWeight || 400,
              textAlign: element.textAlign || 'center',
              width: '100%',
              minHeight: '40px',
              resize: 'both',
            }}
          />
        )}

        {isSelected && (
          <>
            <div className="resize-handle nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
            <div className="resize-handle ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
            <div className="resize-handle sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
            <div className="resize-handle se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className={`element ${isSelected ? 'selected' : ''} ${element.type === 'diamond' ? 'diamond-container' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `rotate(${element.rotation || 0}deg)`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderShape()}
      
      {element.text && !isEditing && (
        <div
          className="element-text"
          style={{
            color: element.textColor,
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight || 600,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            transform: element.type === 'diamond' ? 'rotate(-45deg)' : 'none',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {element.text}
        </div>
      )}

      {isEditing && (
        <textarea
          ref={textRef}
          className="element-text-input"
          value={element.text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleTextBlur()
            }
          }}
          autoFocus
          style={{
            fontSize: `${element.fontSize}px`,
            color: element.textColor,
            fontWeight: element.fontWeight || 600,
            textAlign: element.textAlign || 'center',
            width: '90%',
            height: '60%',
            resize: 'none',
          }}
        />
      )}

      {isSelected && element.type !== 'arrow' && (
        <>
          <div className="resize-handle nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
          <div className="resize-handle ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div className="resize-handle sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
          <div className="resize-handle se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
        </>
      )}
    </div>
  )
}

export default Element

