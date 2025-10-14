import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

export default function CodePenEditor({ 
  question = '',
  initialHtml = '<div id="app">Hello</div>', 
  initialCss = 'body{font-family:sans-serif;} #app{color:#2563eb;font-weight:600;}', 
  initialJs = 'document.getElementById("app").addEventListener("click",()=>alert("Hi"))', 
  onCodeChange,
  onNext,
  showNextButton = false
}) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'js'
  const [viewMode, setViewMode] = useState('code'); // 'code' or 'view'
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const iframeRef = useRef(null);
  const editorRef = useRef(null);
  const resizeTimerRef = useRef(null);

  const srcDoc = useMemo(() => {
    // Inject console capture script
    const consoleScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          window.addEventListener('message', function(e) {
            if (e.data.type === 'getConsoleLogs') {
              window.parent.postMessage({ type: 'consoleLogs', logs: window.__logs || [] }, '*');
            }
          });
          
          window.__logs = [];
          
          console.log = function(...args) {
            window.__logs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
            originalLog.apply(console, args);
          };
          
          console.error = function(...args) {
            window.__logs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
            originalError.apply(console, args);
          };
          
          console.warn = function(...args) {
            window.__logs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
            originalWarn.apply(console, args);
          };
          
          window.onerror = function(msg, url, line, col, error) {
            window.__logs.push({ type: 'error', message: msg, timestamp: Date.now() });
            return false;
          };
        })();
      </script>
    `;
    
    return `<!doctype html><html><head><style>${css}</style></head><body>${html}${consoleScript}<script>${js}<\/script></body></html>`;
  }, [html, css, js]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc;
    }
    if (onCodeChange) onCodeChange({ html, css, js, combined: srcDoc });
  }, [srcDoc, onCodeChange]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data.type === 'consoleLogs') {
        setConsoleLogs(e.data.logs);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Debounced manual layout
  useEffect(() => {
    const handle = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        try { editorRef.current && editorRef.current.layout(); } catch(_) {}
      }, 120);
    };
    window.addEventListener('resize', handle, { passive: true });
    return () => {
      window.removeEventListener('resize', handle);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  const getCurrentCode = () => {
    switch(activeTab) {
      case 'html': return html;
      case 'css': return css;
      case 'js': return js;
      default: return '';
    }
  };

  const handleCodeChange = (value) => {
    const newValue = value || '';
    switch(activeTab) {
      case 'html': setHtml(newValue); break;
      case 'css': setCss(newValue); break;
      case 'js': setJs(newValue); break;
    }
  };

  const getLanguage = () => {
    switch(activeTab) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      default: return 'html';
    }
  };

  const refreshConsole = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'getConsoleLogs' }, '*');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white" style={{contain:'layout style'}}>
      {/* Question Header */}
      <div className="px-6 py-6 border-b border-gray-200 bg-gray-900">
        <p className="text-white text-base leading-relaxed">
          {question}
        </p>
      </div>

      {/* Tab Navigation + Code/View Toggle in Same Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('html')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'html'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'css'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            CSS
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'js'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            JS
          </button>
        </div>
        
        <button
          onClick={() => setViewMode(viewMode === 'code' ? 'view' : 'code')}
          className="px-6 py-2 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all"
        >
          Code / View
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {viewMode === 'code' ? (
          /* Code Editor - Full Space */
          <div className="flex-1 min-h-0 bg-gray-50" style={{minHeight:0}}>
            <Editor 
              height="100%" 
              language={getLanguage()}
              value={getCurrentCode()} 
              onChange={handleCodeChange} 
              onMount={(editor) => { 
                editorRef.current = editor; 
                setTimeout(() => editor.layout(), 0); 
              }}
              theme="vs-light"
              options={{ 
                minimap: { enabled: false }, 
                automaticLayout: false, 
                scrollBeyondLastLine: false, 
                smoothScrolling: false,
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible'
                },
                padding: { top: 12, bottom: 12 }
              }} 
            />
          </div>
        ) : (
          /* Preview Mode */
          <div className="flex-1 min-h-0 bg-white" style={{minHeight:0}}>
            <iframe 
              ref={iframeRef} 
              title="preview" 
              className="w-full h-full bg-white border-0" 
              sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin" 
            />
          </div>
        )}

        {/* Console Panel */}
        {showConsole && (
          <div className="h-48 border-t border-gray-300 bg-gray-900 text-white overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
              <span className="font-semibold text-sm">Console</span>
              <div className="flex gap-2">
                <button
                  onClick={refreshConsole}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setConsoleLogs([])}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="p-3 font-mono text-sm">
              {consoleLogs.length === 0 ? (
                <div className="text-gray-500">No console output</div>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`py-1 ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'warn' ? 'text-yellow-400' : 
                      'text-green-400'
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => {
            setShowConsole(!showConsole);
            if (!showConsole) refreshConsole();
          }}
          className="px-8 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all shadow-md"
        >
          View Console
        </button>
        
        {showNextButton && (
          <button
            onClick={onNext}
            className="px-10 py-2.5 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all shadow-md"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}


