import { useState } from 'react'
import { Box, Database, Server, Cloud, HardDrive, Cpu, Network, Globe, Lock, Mail, Users, ShoppingCart, FileText, Image, Code, Layers, ChevronDown, ChevronRight } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ onAddElement }) => {
  const [activeTab, setActiveTab] = useState('general')
  const [expandedCategories, setExpandedCategories] = useState({ general: true })

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // General shapes
  const generalShapes = [
    { type: 'rectangle', label: 'Rectangle', icon: '▭', color: '#667eea', width: 120, height: 80 },
    { type: 'rounded-rectangle', label: 'Rounded', icon: '▢', color: '#48bb78', width: 120, height: 80 },
    { type: 'square', label: 'Square', icon: '□', color: '#9f7aea', width: 100, height: 100 },
    { type: 'circle', label: 'Circle', icon: '●', color: '#ed8936', width: 100, height: 100 },
    { type: 'ellipse', label: 'Ellipse', icon: '◯', color: '#f56565', width: 120, height: 80 },
    { type: 'triangle', label: 'Triangle', icon: '▲', color: '#ecc94b', width: 100, height: 100 },
    { type: 'diamond', label: 'Diamond', icon: '◆', color: '#9f7aea', width: 100, height: 100 },
    { type: 'hexagon', label: 'Hexagon', icon: '⬡', color: '#38b2ac', width: 100, height: 100 },
    { type: 'pentagon', label: 'Pentagon', icon: '⬠', color: '#4299e1', width: 100, height: 100 },
    { type: 'parallelogram', label: 'Parallelogram', icon: '▱', color: '#4299e1', width: 120, height: 80 },
    { type: 'trapezoid', label: 'Trapezoid', icon: '⏢', color: '#48bb78', width: 120, height: 80 },
    { type: 'star', label: 'Star', icon: '★', color: '#ffd700', width: 100, height: 100 },
  ]

  // Flowchart shapes
  const flowchartShapes = [
    { type: 'process', label: 'Process', icon: '▭', color: '#4a90e2', width: 120, height: 60 },
    { type: 'decision', label: 'Decision', icon: '◆', color: '#50c878', width: 100, height: 100 },
    { type: 'start-end', label: 'Start/End', icon: '◯', color: '#ff6b6b', width: 120, height: 60 },
    { type: 'input-output', label: 'Input/Output', icon: '▱', color: '#9b59b6', width: 120, height: 60 },
    { type: 'document', label: 'Document', icon: '📄', color: '#3498db', width: 100, height: 100 },
    { type: 'predefined', label: 'Predefined', icon: '▭', color: '#e74c3c', width: 120, height: 60 },
    { type: 'database-flow', label: 'Database', icon: '🛢', color: '#1abc9c', width: 100, height: 100 },
    { type: 'manual-input', label: 'Manual Input', icon: '⌨', color: '#f39c12', width: 120, height: 60 },
    { type: 'delay', label: 'Delay', icon: '◔', color: '#95a5a6', width: 100, height: 60 },
    { type: 'stored-data', label: 'Stored Data', icon: '◥', color: '#16a085', width: 100, height: 80 },
  ]

  // Arrow shapes
  const arrowShapes = [
    { type: 'arrow-right', label: 'Arrow Right', icon: '→', color: '#667eea', width: 120, height: 40 },
    { type: 'arrow-left', label: 'Arrow Left', icon: '←', color: '#667eea', width: 120, height: 40 },
    { type: 'arrow-up', label: 'Arrow Up', icon: '↑', color: '#667eea', width: 40, height: 120 },
    { type: 'arrow-down', label: 'Arrow Down', icon: '↓', color: '#667eea', width: 40, height: 120 },
    { type: 'double-arrow', label: 'Double Arrow', icon: '⇄', color: '#48bb78', width: 120, height: 40 },
    { type: 'curved-arrow', label: 'Curved Arrow', icon: '↻', color: '#ed8936', width: 100, height: 100 },
    { type: 'block-arrow', label: 'Block Arrow', icon: '➤', color: '#4299e1', width: 120, height: 60 },
  ]

  // UML shapes
  const umlShapes = [
    { type: 'uml-class', label: 'Class', icon: '▭', color: '#3498db', width: 120, height: 100 },
    { type: 'uml-actor', label: 'Actor', icon: '👤', color: '#9b59b6', width: 60, height: 120 },
    { type: 'uml-usecase', label: 'Use Case', icon: '◯', color: '#1abc9c', width: 120, height: 80 },
    { type: 'uml-component', label: 'Component', icon: '▭', color: '#e74c3c', width: 120, height: 80 },
    { type: 'uml-note', label: 'Note', icon: '📝', color: '#f39c12', width: 100, height: 80 },
    { type: 'uml-package', label: 'Package', icon: '📦', color: '#16a085', width: 120, height: 100 },
  ]

  // Entity Relation shapes
  const erShapes = [
    { type: 'er-entity', label: 'Entity', icon: '▭', color: '#3498db', width: 120, height: 80 },
    { type: 'er-attribute', label: 'Attribute', icon: '◯', color: '#1abc9c', width: 100, height: 100 },
    { type: 'er-relationship', label: 'Relationship', icon: '◆', color: '#9b59b6', width: 100, height: 100 },
    { type: 'er-weak-entity', label: 'Weak Entity', icon: '▭', color: '#e67e22', width: 120, height: 80 },
  ]

  const awsIcons = [
    { type: 'aws-s3', label: 'S3', icon: '🪣', color: '#569A31', iconType: 'aws' },
    { type: 'aws-lambda', label: 'Lambda', icon: 'λ', color: '#FF9900', iconType: 'aws' },
    { type: 'aws-ec2', label: 'EC2', icon: '🖥', color: '#FF9900', iconType: 'aws' },
    { type: 'aws-rds', label: 'RDS', icon: '💾', color: '#527FFF', iconType: 'aws' },
    { type: 'aws-dynamodb', label: 'DynamoDB', icon: '▦', color: '#4053D6', iconType: 'aws' },
    { type: 'aws-cloudfront', label: 'CloudFront', icon: '🌐', color: '#7A3E65', iconType: 'aws' },
    { type: 'aws-route53', label: 'Route 53', icon: '🛣', color: '#4B612C', iconType: 'aws' },
    { type: 'aws-apigateway', label: 'API Gateway', icon: '🔌', color: '#FF4F8B', iconType: 'aws' },
  ]

  const databaseIcons = [
    { type: 'mongodb', label: 'MongoDB', icon: '🍃', color: '#47A248', iconType: 'database' },
    { type: 'mysql', label: 'MySQL', icon: '🐬', color: '#4479A1', iconType: 'database' },
    { type: 'postgresql', label: 'PostgreSQL', icon: '🐘', color: '#336791', iconType: 'database' },
    { type: 'redis', label: 'Redis', icon: '◆', color: '#DC382D', iconType: 'database' },
    { type: 'cassandra', label: 'Cassandra', icon: '⚡', color: '#1287B1', iconType: 'database' },
    { type: 'elasticsearch', label: 'Elasticsearch', icon: '🔍', color: '#FEC514', iconType: 'database' },
  ]

  const systemIcons = [
    { type: 'server', label: 'Server', icon: Server, color: '#667eea', iconType: 'lucide' },
    { type: 'cloud', label: 'Cloud', icon: Cloud, color: '#4299e1', iconType: 'lucide' },
    { type: 'database', label: 'Database', icon: Database, color: '#48bb78', iconType: 'lucide' },
    { type: 'storage', label: 'Storage', icon: HardDrive, color: '#ed8936', iconType: 'lucide' },
    { type: 'cpu', label: 'Processor', icon: Cpu, color: '#9f7aea', iconType: 'lucide' },
    { type: 'network', label: 'Network', icon: Network, color: '#38b2ac', iconType: 'lucide' },
    { type: 'globe', label: 'Internet', icon: Globe, color: '#4299e1', iconType: 'lucide' },
    { type: 'security', label: 'Security', icon: Lock, color: '#f56565', iconType: 'lucide' },
    { type: 'mail', label: 'Email', icon: Mail, color: '#ecc94b', iconType: 'lucide' },
    { type: 'users', label: 'Users', icon: Users, color: '#667eea', iconType: 'lucide' },
    { type: 'api', label: 'API', icon: Code, color: '#48bb78', iconType: 'lucide' },
    { type: 'layers', label: 'Layers', icon: Layers, color: '#9f7aea', iconType: 'lucide' },
  ]

  const handleDragStart = (e, element) => {
    // Remove the icon component for serialization
    const { icon, ...serializable } = element
    e.dataTransfer.setData('application/json', JSON.stringify(serializable))
  }

  const renderShapeItem = (item) => (
    <div
      key={item.type}
      className="sidebar-item"
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onClick={() => onAddElement(item)}
      style={{ '--item-color': item.color }}
    >
      <div className="sidebar-item-icon" style={{ backgroundColor: item.color }}>
        {item.iconType === 'lucide' ? (
          <item.icon size={24} color="white" />
        ) : (
          <span className="emoji-icon">{item.icon}</span>
        )}
      </div>
      <span className="sidebar-item-label">{item.label}</span>
    </div>
  )

  const categories = [
    { id: 'general', label: 'General', shapes: generalShapes },
    { id: 'flowchart', label: 'Flowchart', shapes: flowchartShapes },
    { id: 'arrows', label: 'Arrows', shapes: arrowShapes },
    { id: 'uml', label: 'UML', shapes: umlShapes },
    { id: 'entity-relation', label: 'Entity Relation', shapes: erShapes },
    { id: 'aws', label: 'AWS', shapes: awsIcons },
    { id: 'database', label: 'Databases', shapes: databaseIcons },
    { id: 'system', label: 'System', shapes: systemIcons },
  ]

  const renderCategory = (category) => (
    <div key={category.id} className="sidebar-category">
      <button
        className="sidebar-category-header"
        onClick={() => toggleCategory(category.id)}
      >
        {expandedCategories[category.id] ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
        <span>{category.label}</span>
        <span className="category-count">{category.shapes.length}</span>
      </button>
      {expandedCategories[category.id] && (
        <div className="sidebar-grid">
          {category.shapes.map(renderShapeItem)}
        </div>
      )}
    </div>
  )

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Shapes</h3>
        <div className="sidebar-hint">
          Drag or click to add
        </div>
      </div>

      <div className="sidebar-content">
        {categories.map(renderCategory)}
      </div>
    </div>
  )
}

export default Sidebar

