# AI Interview System Setup Guide

## 🎯 **System Overview**

The AI Interview System allows recruiters to create jobs with AI-generated interview questions and share links with candidates. Candidates can then take AI-conducted interviews through a dedicated interface.

## 🚀 **Features**

### **For Recruiters:**
- Create jobs with AI-generated interview questions
- Get shareable interview links
- Track interview progress
- View candidate responses

### **For Candidates:**
- Join interviews via shared links
- Take AI-conducted interviews
- Get instant feedback and evaluation
- View interview results

## ⚙️ **Setup Instructions**

### 1. **Environment Configuration**

Create a `.env.local` file in the frontend directory:

```env
# OpenRouter API Configuration
REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Backend API URL (if different from proxy)
REACT_APP_API_URL=http://localhost:5000
```

### 2. **Get OpenRouter API Key**

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### 3. **Start the Application**

```bash
cd frontend
npm start
```

## 🎮 **How to Use**

### **Recruiter Workflow:**

1. **Login as Recruiter**
   - Go to `/dashboard` (recruiter role)
   - You'll see the "AI Interview Creator" dashboard

2. **Create Job with AI Interview**
   - Click "Create Job with AI Interview"
   - Fill in job details:
     - Job Title (required)
     - Company
     - Location
     - Salary
     - Job Description (required)
     - Requirements
     - Level (Junior/Mid/Senior/Lead)
     - Interview Duration (15-60 minutes)

3. **Generate AI Interview**
   - Click "Generate AI Interview"
   - AI will create interview questions based on job details
   - You'll get a shareable interview link

4. **Share Interview Link**
   - Copy the generated link
   - Send it to candidates
   - Track interview progress in your dashboard

### **Candidate Workflow:**

1. **Access Interview**
   - Use the link provided by recruiter
   - Or go to `/dashboard` (candidate role) and enter the link

2. **Take Interview**
   - Enter your name and email (first time only)
   - Answer AI-generated questions
   - Each question has a time limit
   - Submit answers to proceed

3. **Get Results**
   - View instant AI evaluation
   - See overall score and feedback
   - Get recommendations and next steps

## 🔧 **Technical Details**

### **AI Interview Service**
- Uses OpenRouter with Gemini Pro model
- Generates contextual interview questions
- Evaluates candidate responses
- Provides detailed feedback

### **Interview Flow**
1. **Question Generation**: AI creates questions based on job requirements
2. **Interview Session**: Candidate answers questions with time limits
3. **Response Evaluation**: AI analyzes answers and provides scores
4. **Feedback Generation**: Detailed evaluation with recommendations

### **Components**
- `AIInterviewService`: Core interview logic
- `AIInterviewConductor`: Interview interface for candidates
- `RecruiterDashboard`: Job creation and management
- `CandidateDashboard`: Interview access portal

## 🎨 **UI Features**

### **Recruiter Dashboard:**
- Clean job creation form
- AI interview generation
- Link sharing with copy functionality
- Job management interface

### **Candidate Interface:**
- Professional interview portal
- Real-time timer for questions
- Progress tracking
- Instant results and feedback

## 🔒 **Security & Privacy**

- Interview links are unique and secure
- Candidate information is stored locally
- AI responses are processed securely
- No sensitive data is permanently stored

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **API Key Not Working**
   - Verify key is correctly set in `.env.local`
   - Check OpenRouter dashboard for credits
   - Ensure key is active

2. **Interview Link Not Working**
   - Check link format: `/interview/interview_123456789`
   - Verify interview ID starts with `interview_`
   - Try refreshing the page

3. **AI Not Generating Questions**
   - Check internet connection
   - Verify API key is valid
   - Check browser console for errors

### **Error Messages:**
- "Failed to generate interview": Check API key and connection
- "Invalid interview link": Verify link format
- "Session not found": Interview may have expired

## 📱 **Mobile Support**

The interview system is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🚀 **Production Deployment**

For production:

1. Set up proper environment variables
2. Configure OpenRouter billing
3. Implement proper error handling
4. Add user authentication
5. Set up database for persistent storage
6. Configure monitoring and logging

## 📊 **Future Enhancements**

- Voice recording capabilities
- Video interview support
- Advanced analytics dashboard
- Integration with ATS systems
- Multi-language support
- Custom question templates

## 🆘 **Support**

For issues:
- Check the browser console for errors
- Verify API key configuration
- Test with different interview links
- Contact OpenRouter support for API issues

---

**Ready to start conducting AI-powered interviews!** 🎉
