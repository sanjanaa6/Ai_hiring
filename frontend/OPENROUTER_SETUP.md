# OpenRouter + Gemini API Setup Guide

## 🚀 **Quick Setup**

### 1. **Get OpenRouter API Key**

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to "API Keys" in your dashboard
4. Create a new API key
5. Copy the key (it starts with `sk-or-...`)

### 2. **Configure Environment**

The `.env.local` file has been created. Edit it and replace `your_openrouter_api_key_here` with your actual API key:

```env
REACT_APP_OPENROUTER_API_KEY=sk-or-your-actual-api-key-here
REACT_APP_API_URL=http://localhost:5000
```

### 3. **Restart Development Server**

```bash
npm start
```

### 4. **Test the Integration**

Visit: `http://localhost:3000/openrouter-test`

## 🧪 **Testing Your Setup**

### **OpenRouter Test Page**
- Go to `/openrouter-test`
- Check if API key is configured
- Try the quick test prompts
- Verify AI responses are working

### **Test Prompts to Try:**
1. "Generate 3 interview questions for a React Developer"
2. "Help me write a job description for a Senior Frontend Developer"
3. "How should I evaluate a candidate for a Full Stack Developer role?"

## 🔧 **Technical Details**

### **Current Configuration:**
- **Model**: Kimi VL A3B Thinking (`moonshotai/kimi-vl-a3b-thinking`)
- **API Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Service**: `aiService.js` handles all API calls

### **Available Models on OpenRouter:**
- `moonshotai/kimi-vl-a3b-thinking` - Moonshot AI's Kimi VL A3B (current)
- `google/gemini-pro` - Google's Gemini Pro
- `google/gemini-pro-vision` - For image analysis
- `anthropic/claude-3-sonnet` - Anthropic's Claude
- `openai/gpt-4` - OpenAI's GPT-4
- `meta-llama/llama-2-70b-chat` - Meta's Llama 2

### **Changing Models:**
Edit `frontend/src/services/aiService.js`:
```javascript
const KIMI_MODEL = 'moonshotai/kimi-vl-a3b-thinking'; // Change this line
```

## 💰 **Pricing & Credits**

### **OpenRouter Pricing:**
- Pay-per-use model
- Kimi VL A3B: Free tier available
- Very cost-effective for most use cases
- Monitor usage in OpenRouter dashboard

### **Credit Management:**
- Set up billing alerts
- Monitor usage regularly
- Consider setting daily limits

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **1. API Key Not Working**
```
Error: OpenRouter API key not configured
```
**Solution:**
- Check `.env.local` file exists
- Verify API key is correct
- Restart development server
- Check OpenRouter dashboard for key status

#### **2. Rate Limiting**
```
Error: Rate limit exceeded
```
**Solution:**
- Wait a few minutes
- Check your OpenRouter plan limits
- Consider upgrading plan

#### **3. Model Not Available**
```
Error: Model not found
```
**Solution:**
- Check model name spelling
- Verify model is available in your region
- Try alternative models

#### **4. Network Errors**
```
Error: Network request failed
```
**Solution:**
- Check internet connection
- Verify OpenRouter API is accessible
- Check firewall settings

### **Debug Steps:**

1. **Check API Key:**
   ```javascript
   console.log(process.env.REACT_APP_OPENROUTER_API_KEY);
   ```

2. **Test API Endpoint:**
   ```bash
   curl -X POST https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "google/gemini-pro", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

3. **Check Browser Console:**
   - Open Developer Tools
   - Look for error messages
   - Check Network tab for failed requests

## 🎯 **Features Using OpenRouter**

### **AI Interview System:**
- **Question Generation**: Creates interview questions based on job details
- **Answer Evaluation**: Analyzes candidate responses
- **Feedback Generation**: Provides detailed feedback and scores

### **Recruitment Assistant:**
- **Job Description Optimization**: Improves job postings
- **Interview Questions**: Generates comprehensive questions
- **Candidate Analysis**: Evaluates candidate profiles
- **Market Insights**: Provides salary and trend data

## 🔒 **Security & Privacy**

### **Data Handling:**
- API calls are made directly to OpenRouter
- No sensitive data is stored permanently
- Interview responses are processed securely
- API keys are stored in environment variables

### **Best Practices:**
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor usage for unusual activity

## 📊 **Monitoring & Analytics**

### **OpenRouter Dashboard:**
- View API usage statistics
- Monitor costs and spending
- Check request logs
- Manage API keys

### **Application Logging:**
- All API calls are logged to console
- Error messages are displayed to users
- Success/failure rates can be monitored

## 🚀 **Production Deployment**

### **Environment Variables:**
```env
REACT_APP_OPENROUTER_API_KEY=your_production_api_key
REACT_APP_API_URL=https://your-backend-url.com
```

### **Security Considerations:**
- Use production API keys
- Set up proper error handling
- Implement rate limiting
- Add monitoring and alerting

## 📞 **Support**

### **OpenRouter Support:**
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Discord](https://discord.gg/openrouter)
- [OpenRouter GitHub](https://github.com/openrouter-ai)

### **Application Support:**
- Check browser console for errors
- Verify API key configuration
- Test with different prompts
- Review network requests

---

## ✅ **Verification Checklist**

- [ ] OpenRouter account created
- [ ] API key generated and copied
- [ ] `.env.local` file updated with API key
- [ ] Development server restarted
- [ ] Test page visited (`/openrouter-test`)
- [ ] API key status shows "configured"
- [ ] Test prompts return AI responses
- [ ] Interview generation works
- [ ] No console errors

**🎉 Once all items are checked, your OpenRouter + Gemini API integration is ready!**
