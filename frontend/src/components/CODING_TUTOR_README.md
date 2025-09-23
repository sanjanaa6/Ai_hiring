# Interactive Coding Tutor

An AI-powered coding interview practice system that provides real-time feedback and interactive learning.

## Features

### 🎯 **Interactive Coding Questions**
- Random coding questions from various categories (strings, arrays, algorithms, etc.)
- Difficulty levels: Easy, Medium, Hard
- Categories: String manipulation, Recursion, Arrays, Algorithms, Data Structures

### 💬 **AI-Powered Chat Interface**
- Real-time conversation with AI tutor
- Code analysis and feedback
- Follow-up questions to deepen understanding
- Constructive criticism and encouragement

### 📝 **Code Editor**
- Clean, distraction-free coding environment
- JavaScript syntax highlighting
- Real-time code editing
- Submit code for AI review

### 🔄 **Complete Workflow**
1. **Initialize Session**: AI presents a coding question
2. **Write Code**: User writes solution in the editor
3. **Submit Code**: Code is sent to backend for AI analysis
4. **Get Feedback**: AI provides analysis and asks follow-up questions
5. **Continue Learning**: Process repeats with deeper questions

## How It Works

### Frontend (React)
- **InteractiveCodingTutor.js**: Main component with split-screen layout
- **Code Editor**: Textarea-based editor (can be upgraded to Monaco Editor)
- **Chat Interface**: Real-time messaging with AI tutor
- **State Management**: React hooks for session management

### Backend (Node.js + Express)
- **codingTutor.js**: API routes for coding tutor functionality
- **OpenRouter Integration**: AI-powered feedback system
- **Mock Responses**: Development-friendly mock responses
- **Question Bank**: Curated coding questions database

### AI Integration (OpenRouter)
- **System Prompt**: Defines AI as a strict but friendly coding tutor
- **Code Analysis**: Reviews correctness, efficiency, and style
- **Follow-up Questions**: Asks "why" and "how" questions
- **Edge Cases**: Guides students to think about edge cases and complexity

## API Endpoints

### `POST /api/coding-tutor/initialize`
Initialize a new coding session with a random question.

**Request:**
```json
{
  "sessionType": "coding-interview"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "Write a function that reverses a string.",
    "questionId": 1,
    "difficulty": "easy",
    "category": "string manipulation",
    "initialMessage": "Welcome to your coding interview practice! 🚀..."
  }
}
```

### `POST /api/coding-tutor/submit`
Submit code and get AI feedback.

**Request:**
```json
{
  "question": "Write a function that reverses a string.",
  "code": "function reverseStr(str) { return str.split('').reverse().join(''); }",
  "chatHistory": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": "Great job! ✅ Your code looks correct...",
    "newQuestion": null
  }
}
```

### `GET /api/coding-tutor/questions`
Get all available coding questions.

### `GET /api/coding-tutor/questions/:id`
Get a specific question by ID.

## Sample Questions

### Easy
- Write a function that reverses a string
- Write a function that checks if a string is a palindrome
- Write a function that finds the factorial of a number
- Write a function that finds the largest number in an array

### Medium
- Write a function that removes duplicates from an array
- Write a function that implements binary search
- Write a function that validates a balanced parentheses string

### Hard
- Write a function that implements a simple hash table

## AI Tutor Behavior

The AI tutor is designed to be:
- **Strict but Friendly**: Professional yet encouraging
- **Thorough**: Analyzes correctness, efficiency, and style
- **Educational**: Asks follow-up questions to deepen understanding
- **Constructive**: Points out issues while maintaining motivation

### Sample AI Responses

**For Correct Code:**
```
Great job! ✅ Your code looks correct and should work properly.

Analysis:
- Your solution is clean and readable
- The logic is sound
- Good use of built-in methods

Follow-up question: Can you explain the time and space complexity of your solution? 
Also, how would you handle edge cases like empty strings or null inputs?
```

**For Code with Issues:**
```
Good attempt! 👍 I can see you're on the right track.

What I noticed:
- The logic is mostly correct
- Consider edge cases like empty arrays
- Think about the time complexity

Question: How would you handle the case where the array is empty? 
What's the time complexity of your current approach?
```

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Start the Application
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm start
```

### 4. Access the Coding Tutor
Navigate to: `http://localhost:3000/coding-tutor`

## Development vs Production

### Development Mode
- Uses mock AI responses for testing
- No OpenRouter API key required
- Faster response times
- Consistent feedback for testing

### Production Mode
- Requires valid OpenRouter API key
- Real AI responses via OpenRouter API
- More varied and intelligent feedback
- Actual AI-powered tutoring

## Future Enhancements

### Code Editor Improvements
- [ ] Integrate Monaco Editor (VS Code editor)
- [ ] Syntax highlighting for multiple languages
- [ ] Auto-completion and IntelliSense
- [ ] Code formatting and linting

### AI Features
- [ ] Multiple AI models (GPT-4, Claude, etc.)
- [ ] Customizable AI personality
- [ ] Code execution and testing
- [ ] Performance analysis

### Learning Features
- [ ] Progress tracking
- [ ] Difficulty progression
- [ ] Topic-based learning paths
- [ ] Performance analytics

### UI/UX Improvements
- [ ] Dark/light theme support
- [ ] Mobile responsiveness
- [ ] Keyboard shortcuts
- [ ] Code sharing and collaboration

## Troubleshooting

### Common Issues

**1. "Failed to initialize coding session"**
- Check if backend server is running
- Verify API routes are properly registered
- Check console for error messages

**2. "Failed to submit code"**
- Ensure code is not empty
- Check network connection
- Verify OpenRouter API key (production mode)

**3. AI responses not working**
- Check OpenRouter API key in environment variables
- Verify API quota and billing
- Check network connectivity to OpenRouter

### Debug Mode
Enable debug logging by setting:
```
NODE_ENV=development
```

This will show detailed console logs and use mock responses.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AI Hiring system. See main project license for details.
