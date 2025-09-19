// Simple test script for OpenRouter API
const axios = require('axios');

async function testOpenRouter() {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.log('❌ OpenRouter API key not configured');
    console.log('📝 Please edit .env.local and add your API key');
    console.log('🔗 Get your API key from: https://openrouter.ai/');
    return;
  }

  console.log('🧪 Testing OpenRouter API with Gemini Pro...');
  
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemini-pro',
      messages: [
        {
          role: 'user',
          content: 'Generate 2 interview questions for a React Developer position. Respond in JSON format with questions array.'
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Hiring Platform Test'
      }
    });

    console.log('✅ OpenRouter API is working!');
    console.log('📊 Response:', response.data.choices[0].message.content);
    console.log('💰 Usage:', response.data.usage);
    
  } catch (error) {
    console.log('❌ OpenRouter API test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testOpenRouter();
