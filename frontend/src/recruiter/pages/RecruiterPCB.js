import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Link as LinkIcon, Copy, CheckCircle } from 'lucide-react';

const RecruiterPCB = () => {
  const { isDarkMode } = useTheme();
  const [pcbLinks, setPcbLinks] = useState([]);
  const [copied, setCopied] = useState(null);

  const createPcbRoundLink = () => {
    // Match backend-like format: interviewId-roundNumber-accessCode
    const accessCode = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const token = `pcb-0-${accessCode}`;
    const url = `${window.location.origin.replace(/\/$/, '')}/pcb-round/${token}`;
    setPcbLinks(prev => [{ token, url, createdAt: new Date().toISOString() }, ...prev]);
  };

  const copy = (text, token) => {
    navigator.clipboard.writeText(text);
    setCopied(token);
    setTimeout(() => setCopied(null), 1000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><LinkIcon className="w-6 h-6" /> PCB Round Links</h1>
          <button
            onClick={createPcbRoundLink}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            <Plus className="w-4 h-4" /> Create PCB Round Link
          </button>
        </div>

        {pcbLinks.length === 0 ? (
          <div className={`p-6 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              No PCB round links yet. Click "Create PCB Round Link" to generate a shareable link. Share this link with candidates to open the PCB interface as a standalone round.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pcbLinks.map(item => (
              <div key={item.token} className={`p-4 rounded-lg border flex items-center justify-between gap-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{item.url}</div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Token: {item.token}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={item.url} target="_blank" rel="noreferrer" className={`px-3 py-2 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Open</a>
                  <button onClick={() => copy(item.url, item.token)} className={`inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {copied === item.token ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === item.token ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterPCB;


