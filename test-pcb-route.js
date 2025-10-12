// Test script to verify PCB route functionality
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Test route to check if PCB is accessible
app.get('/test-pcb', (req, res) => {
  res.json({
    message: 'PCB route test endpoint',
    timestamp: new Date().toISOString(),
    pcbPath: '/pcb',
    buildPath: path.join(__dirname, 'frontend/build/pcb')
  });
});

// Catch-all handler for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`🔗 Test PCB route: http://localhost:${PORT}/test-pcb`);
  console.log(`🔗 PCB app: http://localhost:${PORT}/pcb`);
});

