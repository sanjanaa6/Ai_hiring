# AI Integration Setup Guide

This guide will help you set up the AI integration using OpenRouter with Gemini API for the AI Hiring platform.

## Prerequisites

1. **OpenRouter Account**: Sign up at [OpenRouter](https://openrouter.ai/)
2. **API Key**: Get your API key from OpenRouter dashboard

## Setup Instructions

### 1. Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` file and add your OpenRouter API key:
   ```env
   REACT_APP_OPENROUTER_API_KEY=your_actual_api_key_here
   REACT_APP_API_URL=http://localhost:5000
   ```

### 2. OpenRouter API Key Setup

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

### 3. Model Configuration

The AI service is configured to use Google's Gemini Pro model by default. You can modify the model in `src/services/aiService.js`:

```javascript
const GEMINI_MODEL = 'google/gemini-pro';
```

Available models on OpenRouter:
- `google/gemini-pro` - Google's Gemini Pro (recommended)
- `google/gemini-pro-vision` - For image analysis
- `anthropic/claude-3-sonnet` - Anthropic's Claude
- `openai/gpt-4` - OpenAI's GPT-4

### 4. Features

The AI integration provides:

#### For Recruiters:
- **Job Description Optimizer**: Improve job descriptions for better candidate attraction
- **Interview Questions Generator**: Create comprehensive interview questions
- **Candidate Analyzer**: Analyze candidate profiles against job requirements
- **Market Insights**: Get salary benchmarks and market trends
- **General Chat**: Ask questions about recruitment best practices

#### For Candidates:
- **Resume Optimization**: Improve resume content and formatting
- **Interview Preparation**: Get tips and practice questions
- **Career Advice**: Receive guidance on career development
- **Skill Development**: Get recommendations for skill improvement

#### For Admins:
- **Platform Analytics**: Get insights on platform usage
- **User Management**: Receive recommendations for user management
- **Performance Metrics**: Analyze system performance

### 5. Usage

1. **Quick Actions**: Use the predefined quick action buttons for common tasks
2. **Chat Interface**: Type custom questions in the chat interface
3. **Tool Selection**: Use the Tools tab to access specific recruitment tools
4. **Context Awareness**: The AI is aware of your role and company information

### 6. API Limits and Costs

- OpenRouter uses a pay-per-use model
- Monitor your usage in the OpenRouter dashboard
- Set up billing alerts to avoid unexpected charges
- Gemini Pro is cost-effective for most use cases

### 7. Troubleshooting

#### Common Issues:

1. **API Key Not Working**:
   - Verify the key is correctly set in `.env`
   - Check if the key has sufficient credits
   - Ensure the key is active in OpenRouter dashboard

2. **Rate Limiting**:
   - OpenRouter has rate limits based on your plan
   - Implement retry logic for production use
   - Consider upgrading your OpenRouter plan

3. **Model Not Available**:
   - Check if the model is available in your region
   - Try alternative models if needed
   - Contact OpenRouter support for model availability

#### Error Handling:

The AI service includes comprehensive error handling:
- Network errors are caught and displayed to users
- API errors are logged for debugging
- Fallback responses for common issues

### 8. Security Considerations

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys regularly

2. **Data Privacy**:
   - Be mindful of sensitive data in prompts
   - Consider data retention policies
   - Implement user consent for AI interactions

### 9. Customization

You can customize the AI behavior by modifying:

1. **System Prompts**: Edit `buildSystemPrompt()` in `aiService.js`
2. **Quick Actions**: Modify the quick prompts in the components
3. **UI Styling**: Update the component styles as needed
4. **Model Selection**: Change the model in the service configuration

### 10. Production Deployment

For production deployment:

1. Set up proper environment variables
2. Implement rate limiting
3. Add monitoring and logging
4. Set up error tracking
5. Configure backup models
6. Implement user feedback collection

## Support

For issues related to:
- **OpenRouter API**: Contact OpenRouter support
- **AI Integration**: Check the component documentation
- **Model Performance**: Review the model documentation on OpenRouter

## Example Usage

```javascript
// Using the AI service directly
import aiService from '../services/aiService';

const result = await aiService.generateResponse(
  "Help me write a job description for a React developer",
  { userRole: 'recruiter' }
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```
