#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Create a simple self-signed certificate for development
const createSelfSignedCert = () => {
  const { execSync } = require('child_process');
  
  try {
    // Check if openssl is available
    execSync('openssl version', { stdio: 'ignore' });
    
    const certDir = path.join(__dirname, 'certs');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir);
    }
    
    const keyPath = path.join(certDir, 'key.pem');
    const certPath = path.join(certDir, 'cert.pem');
    
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log('🔐 Creating self-signed certificate for HTTPS...');
      
      // Generate private key
      execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
      
      // Generate certificate
      execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
      
      console.log('✅ Self-signed certificate created successfully!');
    }
    
    return { keyPath, certPath };
  } catch (error) {
    console.error('❌ Failed to create self-signed certificate:', error.message);
    console.log('💡 You can manually create certificates or use a tool like mkcert');
    return null;
  }
};

// Start HTTPS server
const startHttpsServer = () => {
  const certs = createSelfSignedCert();
  
  if (!certs) {
    console.log('⚠️  Cannot start HTTPS server without certificates');
    console.log('💡 Try using localhost instead, or install mkcert for easy certificate generation');
    return;
  }
  
  try {
    const options = {
      key: fs.readFileSync(certs.keyPath),
      cert: fs.readFileSync(certs.certPath)
    };
    
    const server = https.createServer(options, (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>HTTPS Development Server</title></head>
          <body>
            <h1>HTTPS Development Server</h1>
            <p>Your React app should be running on HTTP. This HTTPS server is for camera testing.</p>
            <p>Visit: <a href="http://localhost:3000">http://localhost:3000</a></p>
            <p>For camera testing, you can use: <a href="https://localhost:3001">https://localhost:3001</a></p>
          </body>
        </html>
      `);
    });
    
    server.listen(3001, () => {
      console.log('🚀 HTTPS server running on https://localhost:3001');
      console.log('📹 This can be used for camera testing with HTTPS');
      console.log('⚠️  You may need to accept the self-signed certificate in your browser');
    });
    
  } catch (error) {
    console.error('❌ Failed to start HTTPS server:', error.message);
  }
};

// Main execution
console.log('🔧 HTTPS Development Server Setup');
console.log('================================');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node start-https.js [options]

Options:
  --help, -h     Show this help message
  --create-cert  Only create certificates, don't start server

Examples:
  node start-https.js              # Start HTTPS server
  node start-https.js --create-cert # Only create certificates
  `);
  process.exit(0);
}

if (process.argv.includes('--create-cert')) {
  createSelfSignedCert();
} else {
  startHttpsServer();
}
