# AI-Powered Interview System

A complete full-stack application that allows recruiters to create AI-generated, role-specific interviews and enables candidates to take these interviews through shareable links.

## 🚀 Features

### For Recruiters:
- **AI Interview Generation**: Create comprehensive, role-specific interviews with 6+ rounds
- **Shareable Links**: Generate links that anyone can use to take the interview
- **Real-time Analytics**: View candidate performance, scores, and detailed feedback
- **Candidate Comparison**: Compare multiple candidates side-by-side
- **Dashboard Management**: Track all interviews and their statistics

### For Candidates:
- **No Registration Required**: Access interviews directly via shareable links
- **AI-Conducted Interviews**: Interactive, real-time interview experience
- **Multi-Round Structure**: Comprehensive assessment across different areas
- **Progress Tracking**: Visual progress through interview rounds
- **Professional UI**: Clean, distraction-free interview environment

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **Interview API**: Generate, store, and manage interviews
- **AI Integration**: OpenRouter + DeepSeek for interview generation and evaluation
- **Database**: MongoDB for persistent storage
- **Authentication**: JWT-based auth for recruiters

### Frontend (React + Tailwind CSS)
- **Recruiter Dashboard**: Job creation, interview management, analytics
- **Interview Interface**: AI-conducted interview experience for candidates
- **API Integration**: Seamless backend communication
- **Responsive Design**: Works on all devices

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- OpenRouter API key

## 🛠️ Installation

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-hiring
   JWT_SECRET=your-super-secret-jwt-key
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally)

5. **Start the backend server:**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Start the frontend:**
   ```bash
   npm start
   ```

## 🎯 How It Works

### 1. Recruiter Creates Interview
- Recruiter enters job title, description, and requirements
- Backend sends prompt to AI (OpenRouter + DeepSeek)
- AI generates 6+ role-specific interview rounds:
  - Technical Fundamentals
  - Role-Specific Experience
  - Problem-Solving & Critical Thinking
  - Team Collaboration & Leadership
  - Industry Knowledge & Trends
  - Cultural Fit & Motivation
- System creates shareable interview link

### 2. Candidate Takes Interview
- Candidate clicks shareable link
- Provides basic information (name, email, phone)
- AI conducts the complete interview:
  - Asks questions from each round
  - Tracks time limits
  - Manages interview flow
  - Evaluates answers in real-time
- All answers are stored in the database

### 3. Recruiter Reviews Results
- View interview statistics and analytics
- Compare candidate performance
- See AI-generated feedback and scores
- Track completion rates and trends

## 📊 Database Schema

### Interview Model
```javascript
{
  interviewId: String (unique),
  title: String,
  jobTitle: String,
  jobDescription: String,
  jobRequirements: String,
  jobLevel: String,
  totalDuration: Number,
  rounds: [RoundSchema],
  createdBy: ObjectId (User),
  candidateAnswers: [CandidateAnswerSchema],
  statistics: {
    totalCandidates: Number,
    completedInterviews: Number,
    averageScore: Number,
    completionRate: Number
  }
}
```

### Round Schema
```javascript
{
  roundId: String,
  roundNumber: Number,
  title: String,
  description: String,
  duration: Number,
  questions: [QuestionSchema],
  evaluationCriteria: Object
}
```

### Question Schema
```javascript
{
  id: String,
  type: String,
  question: String,
  expectedAnswer: String,
  timeLimit: Number,
  difficulty: String,
  followUpQuestions: [String]
}
```

## 🔧 API Endpoints

### Interview Management
- `POST /api/interviews/generate` - Generate new interview
- `GET /api/interviews/:id` - Get interview details
- `GET /api/interviews` - Get all interviews for recruiter
- `GET /api/interviews/:id/stats` - Get interview statistics

### Answer Submission
- `POST /api/interviews/:id/answer` - Submit candidate answer

## 🎨 UI Components

### Recruiter Dashboard
- **Job Creation Form**: Simple form for job details
- **Interview Generation**: One-click AI interview creation
- **Analytics Dashboard**: Real-time statistics and candidate comparison
- **Link Management**: Easy sharing and copying of interview links

### Interview Interface
- **Welcome Screen**: Interview overview and candidate registration
- **Question Display**: Clean, focused question presentation
- **Progress Tracking**: Visual progress through rounds
- **Answer Input**: Text area for candidate responses
- **Timer**: Countdown timer for each question

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, Vercel, or your preferred platform

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Netlify, Vercel, or your preferred platform
3. Update API URL in environment variables

## 🔐 Security Features

- JWT-based authentication for recruiters
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Secure API endpoints

## 📈 Analytics Features

- **Real-time Statistics**: Live candidate count and completion rates
- **Performance Metrics**: Average scores and trends
- **Candidate Comparison**: Side-by-side performance analysis
- **AI Feedback**: Detailed evaluation of each answer
- **Completion Tracking**: Monitor interview progress

## 🛠️ Customization

### Adding New Question Types
1. Update the AI prompt in `backend/routes/interviews.js`
2. Modify the frontend question display logic
3. Update the evaluation criteria

### Styling Changes
- Modify Tailwind CSS classes in components
- Update color schemes and layouts
- Customize the interview interface

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify OpenRouter API key is correct
   - Check environment variables are loaded
   - Ensure API key has sufficient credits

2. **Database Connection Issues**
   - Verify MongoDB is running
   - Check connection string in environment
   - Ensure database permissions are correct

3. **Interview Not Loading**
   - Check if interview ID exists in database
   - Verify interview status is 'active'
   - Check network connectivity

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support or questions, please open an issue in the repository.

---

**Built with ❤️ using React, Node.js, MongoDB, and AI**
