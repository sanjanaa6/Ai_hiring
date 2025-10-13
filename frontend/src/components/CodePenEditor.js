import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

export default function CodePenEditor({ initialHtml = '<div id="app">Hello</div>', initialCss = 'body{font-family:sans-serif;} #app{color:#2563eb;font-weight:600;}', initialJs = 'document.getElementById("app").addEventListener("click",()=>alert("Hi"))', onCodeChange }) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const iframeRef = useRef(null);
  const htmlEditorRef = useRef(null);
  const cssEditorRef = useRef(null);
  const jsEditorRef = useRef(null);
  const resizeTimerRef = useRef(null);

  const srcDoc = useMemo(() => `<!doctype html><html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`, [html, css, js]);

  useEffect(() => {
    if (iframeRef.current) iframeRef.current.srcdoc = srcDoc;
    if (onCodeChange) onCodeChange({ html, css, js, combined: srcDoc });
  }, [srcDoc]);

  // Debounced manual layout to avoid ResizeObserver loop spam
  useEffect(() => {
    const handle = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        try { htmlEditorRef.current && htmlEditorRef.current.layout(); } catch(_) {}
        try { cssEditorRef.current && cssEditorRef.current.layout(); } catch(_) {}
        try { jsEditorRef.current && jsEditorRef.current.layout(); } catch(_) {}
      }, 120);
    };
    window.addEventListener('resize', handle, { passive: true });
    return () => {
      window.removeEventListener('resize', handle);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2" style={{contain:'layout style'}}>
      <div className="grid grid-rows-3 min-h-0" style={{contain:'layout size'}}>
        <div className="border-b min-h-0" style={{minHeight:0}}>
          <div className="px-2 py-1 text-xs font-semibold">HTML</div>
          <Editor 
            height="100%" 
            defaultLanguage="html" 
            value={html} 
            onChange={v=>setHtml(v||'')} 
            onMount={(editor)=>{ htmlEditorRef.current = editor; setTimeout(()=>editor.layout(), 0); }}
            options={{ minimap:{enabled:false}, automaticLayout:false, scrollBeyondLastLine:false, smoothScrolling:false }} 
          />
        </div>
        <div className="border-b min-h-0" style={{minHeight:0}}>
          <div className="px-2 py-1 text-xs font-semibold">CSS</div>
          <Editor 
            height="100%" 
            defaultLanguage="css" 
            value={css} 
            onChange={v=>setCss(v||'')} 
            onMount={(editor)=>{ cssEditorRef.current = editor; setTimeout(()=>editor.layout(), 0); }}
            options={{ minimap:{enabled:false}, automaticLayout:false, scrollBeyondLastLine:false, smoothScrolling:false }} 
          />
        </div>
        <div className="min-h-0" style={{minHeight:0}}>
          <div className="px-2 py-1 text-xs font-semibold">JS</div>
          <Editor 
            height="100%" 
            defaultLanguage="javascript" 
            value={js} 
            onChange={v=>setJs(v||'')} 
            onMount={(editor)=>{ jsEditorRef.current = editor; setTimeout(()=>editor.layout(), 0); }}
            options={{ minimap:{enabled:false}, automaticLayout:false, scrollBeyondLastLine:false, smoothScrolling:false }} 
          />
        </div>
      </div>
      <div className="border-l min-h-0" style={{minHeight:0, contain:'layout size'}}>
        <iframe ref={iframeRef} title="preview" className="w-full h-full bg-white" sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin" />
      </div>
    </div>
  );
}


