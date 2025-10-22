import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

export default function Playground() {
  const [html, setHtml] = useState('<div id="app">Hello</div>');
  const [css, setCss] = useState('body{font-family:sans-serif;} #app{color:#2563eb;font-weight:600;}');
  const [js, setJs] = useState('document.getElementById("app").addEventListener("click",()=>alert("Hi"))');
  const iframeRef = useRef(null);

  const srcDoc = useMemo(() => `<!doctype html><html><head><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`, [html, css, js]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = srcDoc;
    }
  }, [srcDoc]);

  const run = () => {
    if (iframeRef.current) iframeRef.current.srcdoc = srcDoc;
  };

  const reset = () => {
    setHtml('<div id="app">Hello</div>');
    setCss('body{font-family:sans-serif;} #app{color:#2563eb;font-weight:600;}');
    setJs('document.getElementById("app").addEventListener("click",()=>alert("Hi"))');
  };

  const download = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playground.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 border-b flex items-center gap-2">
        <button onClick={run} className="px-3 py-1 rounded bg-blue-600 text-white">Run</button>
        <button onClick={reset} className="px-3 py-1 rounded bg-gray-200">Reset</button>
        <button onClick={download} className="px-3 py-1 rounded bg-green-600 text-white">Download</button>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="grid grid-rows-3 min-h-0">
          <div className="border-b min-h-0">
            <div className="px-2 py-1 text-xs font-semibold">HTML</div>
            <Editor height="100%" defaultLanguage="html" value={html} onChange={v=>setHtml(v || '')} options={{ minimap:{enabled:false}}} />
          </div>
          <div className="border-b min-h-0">
            <div className="px-2 py-1 text-xs font-semibold">CSS</div>
            <Editor height="100%" defaultLanguage="css" value={css} onChange={v=>setCss(v || '')} options={{ minimap:{enabled:false}}} />
          </div>
          <div className="min-h-0">
            <div className="px-2 py-1 text-xs font-semibold">JS</div>
            <Editor height="100%" defaultLanguage="javascript" value={js} onChange={v=>setJs(v || '')} options={{ minimap:{enabled:false}}} />
          </div>
        </div>
        <div className="border-l min-h-0">
          <iframe ref={iframeRef} title="preview" className="w-full h-full bg-white" sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin" />
        </div>
      </div>
    </div>
  );
}


