import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Server, Cloud, Database, HardDrive, Cpu, Network, Globe, Lock, Mail, Users, Code, Layers,
  Clock, User, Calendar, Download, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

const SystemDesignViewer = ({ diagramData, candidateInfo, submissionTime, timeSpent, roundInfo }) => {
  const { isDarkMode } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState(null);

  const formatTimeSpent = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (!diagramData || !diagramData.elements) {
    return (
      <div className={`p-8 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          No system design submission found.
        </p>
      </div>
    );
  }

  const { elements, metadata } = diagramData;

  const getIconComponent = (type) => {
    const iconMap = {
      server: Server,
      cloud: Cloud,
      database: Database,
      storage: HardDrive,
      cpu: Cpu,
      network: Network,
      globe: Globe,
      security: Lock,
      mail: Mail,
      users: Users,
      api: Code,
      layers: Layers,
    };
    return iconMap[type] || null;
  };

  const renderElement = (element) => {
    const IconComponent = element.iconType === 'lucide' ? getIconComponent(element.type) : null;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-pointer transition-all ${
          selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          left: `${element.x * zoom}px`,
          top: `${element.y * zoom}px`,
          width: `${element.width * zoom}px`,
          height: `${element.height * zoom}px`,
          transform: `rotate(${element.rotation || 0}deg)`,
        }}
        onClick={() => setSelectedElement(element)}
      >
        <div
          className="w-full h-full rounded-lg flex items-center justify-center relative"
          style={{
            backgroundColor: element.backgroundColor,
            borderColor: element.borderColor,
            borderWidth: `${element.borderWidth}px`,
            borderStyle: 'solid',
          }}
        >
          {/* Icon for lucide icons */}
          {IconComponent && (
            <IconComponent 
              size={24 * zoom} 
              color="white"
              className="absolute"
            />
          )}
          
          {/* Emoji icon */}
          {element.iconType !== 'lucide' && element.icon && (
            <span style={{ fontSize: `${24 * zoom}px` }}>{element.icon}</span>
          )}
          
          {/* Text */}
          {element.text && (
            <div
              className="absolute inset-0 flex items-center justify-center p-2 text-center"
              style={{
                color: element.textColor,
                fontSize: `${element.fontSize * zoom}px`,
                fontWeight: element.fontWeight || 'normal',
              }}
            >
              {element.text}
            </div>
          )}
          
          {/* Label */}
          {element.label && !element.text && (
            <div
              className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs"
              style={{
                color: isDarkMode ? '#fff' : '#000',
                fontSize: `${12 * zoom}px`,
              }}
            >
              {element.label}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-design-${candidateInfo?.name || 'candidate'}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header with candidate info */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              System Design Submission
            </h3>
            
            {/* Round/Question Information */}
            {roundInfo && (
              <div className={`mt-2 p-3 rounded-lg ${
                isDarkMode ? 'bg-indigo-900/30 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                  {roundInfo.title || 'System Design Round'}
                </div>
                {roundInfo.question && (
                  <div className={`text-xs ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                    <strong>Problem:</strong> {roundInfo.question}
                  </div>
                )}
                {roundInfo.description && (
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                    {roundInfo.description}
                  </div>
                )}
              </div>
            )}
            
            {candidateInfo && (
              <div className={`flex items-center gap-4 mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{candidateInfo.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{candidateInfo.email}</span>
                </div>
                {submissionTime && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(submissionTime).toLocaleString()}</span>
                  </div>
                )}
                {timeSpent && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Time: {formatTimeSpent(timeSpent)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            className={`p-2 rounded ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className={`p-2 rounded ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className={`p-2 rounded ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className={`relative overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} style={{ height: '600px' }}>
        <div className="relative" style={{ width: '2000px', height: '2000px' }}>
          {elements.map(renderElement)}
        </div>
      </div>

      {/* Element details */}
      {selectedElement && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Element Details
          </h4>
          <div className={`grid grid-cols-2 gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div><strong>Type:</strong> {selectedElement.type}</div>
            <div><strong>Label:</strong> {selectedElement.label || 'N/A'}</div>
            <div><strong>Position:</strong> ({selectedElement.x}, {selectedElement.y})</div>
            <div><strong>Size:</strong> {selectedElement.width} × {selectedElement.height}</div>
            {selectedElement.text && (
              <div className="col-span-2"><strong>Text:</strong> {selectedElement.text}</div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`grid grid-cols-3 gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div>
              <strong>Elements:</strong> {elements.length}
            </div>
            <div>
              <strong>Created:</strong> {new Date(metadata.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>Zoom:</strong> {Math.round((metadata.zoom || 1) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemDesignViewer;
