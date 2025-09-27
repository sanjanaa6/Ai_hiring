const fs = require('fs');
const path = require('path');

// Create .env.local file for OpenRouter API key
const envContent = `# OpenRouter API Configuration
REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Backend API URL
# For development: http://localhost:5000
# For production: https://your-backend-domain.com
REACT_APP_API_URL=http://localhost:5000

# Production mode (set to 'production' when deploying)
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('📝 Please edit .env.local and add your OpenRouter API key');
  console.log('🔗 Get your API key from: https://openrouter.ai/');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
}
