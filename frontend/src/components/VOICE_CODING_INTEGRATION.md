# Voice Integration for Coding Round

## Overview
The coding round now includes dynamic voice interaction where the AI interviewer can ask questions verbally and candidates can respond with voice answers.

## Features

### 1. Dynamic AI Questions
- AI generates contextual questions based on the candidate's current code
- Questions are designed to be answered verbally (not requiring code)
- Questions test understanding, approach, and problem-solving methodology

### 2. Text-to-Speech (TTS)
- AI questions are spoken aloud using the browser's speech synthesis
- Uses female voice when available for a more natural interview experience
- Visual indicator shows when AI is speaking

### 3. Voice Recording
- Candidates can record voice answers using the browser's speech recognition
- Real-time transcription shows what's being recorded
- Visual recording indicator with pulsing animation

### 4. AI Response Processing
- Voice answers are processed by AI to generate contextual responses
- AI provides feedback, encouragement, and follow-up questions
- Responses are displayed in the AI comments section

## How It Works

### Manual Question Asking
1. Candidate clicks "Ask Voice Question" button
2. AI generates a contextual question based on current code
3. Question is spoken aloud using TTS
4. Voice answer interface appears
5. Candidate can record their answer
6. AI processes the answer and responds

### Automatic Question Triggering
1. AI monitors code changes every 5 seconds
2. When interesting patterns are detected, AI generates questions
3. First question is automatically spoken and voice interface appears
4. Candidate can respond with voice

### Voice Answer Flow
1. Click "Start Recording" to begin voice capture
2. Speak your answer (transcription appears in real-time)
3. Click "Stop Recording" when finished
4. Click "Submit Answer" to send to AI
5. AI processes answer and provides response

## Technical Implementation

### Frontend (LiveCodingRound.js)
- `startVoiceRecording()`: Initiates speech recognition
- `stopVoiceRecording()`: Stops speech recognition
- `speakQuestion()`: Uses speech synthesis to speak AI questions
- `submitVoiceAnswer()`: Sends voice answer to backend

### Backend (interviews.js)
- `/coding-round/ask-question`: Generates contextual AI questions
- `/coding-round/voice-answer`: Processes voice answers and generates AI responses
- `/coding-round/monitor`: Monitors code changes and generates questions

### API Endpoints
```
POST /api/interviews/coding-round/ask-question
POST /api/interviews/coding-round/voice-answer
POST /api/interviews/coding-round/monitor
```

## Browser Requirements
- Modern browser with Web Speech API support
- Microphone access permission
- Speech synthesis support (most modern browsers)

## Usage Tips
1. Ensure microphone permissions are granted
2. Speak clearly and at a moderate pace
3. Wait for AI to finish speaking before recording
4. Use the visual indicators to understand current state
5. AI questions are designed to be conversational and natural

## Error Handling
- Fallback questions if AI generation fails
- Graceful degradation if speech features unavailable
- Clear error messages for permission issues
- Automatic retry mechanisms for network issues
