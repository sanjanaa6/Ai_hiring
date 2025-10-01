# Modern Interview Components

This directory contains the redesigned interview components with a modern, clean UI structure.

## Components Structure

### Core Components

1. **ModernInterview.js** - Main orchestrator component that manages the entire interview flow
2. **InterviewSetup.js** - Camera setup and interview preparation screen
3. **RoundSelection.js** - Round selection interface with progress tracking
4. **InterviewMain.js** - Main interview interface with small camera sidebar
5. **InterviewComplete.js** - Interview completion screen with statistics
6. **SmallCamera.js** - Reusable small camera component

### Custom Hooks

1. **useInterviewState.js** - Manages all interview-related state
2. **useCamera.js** - Handles camera initialization and management
3. **useVoiceRecording.js** - Manages voice recording functionality

## Key Features

### Modern UI Design
- Clean, minimalist interface
- Dark/light theme support
- Responsive design
- Smooth animations and transitions
- Glassmorphism effects

### Small Camera Integration
- Compact camera feed in sidebar
- Recording indicators
- Status overlays
- Reusable component design

### Improved User Experience
- Step-by-step interview flow
- Clear progress indicators
- Intuitive controls
- Better error handling
- Loading states

### Functionality Preservation
- All original functionality from SimpleVoiceInterview.js
- Voice recording
- Code editor integration
- AI question handling
- Progress tracking
- Round management

## Usage

```jsx
import ModernInterview from './components/ModernInterview';

<ModernInterview
  interviewId="interview-id"
  candidateInfo={candidateInfo}
  onComplete={handleComplete}
  onError={handleError}
/>
```

## Component Flow

1. **Setup** → Camera initialization and preparation
2. **Round Selection** → Choose interview rounds
3. **Interview** → Main interview interface with small camera
4. **Complete** → Results and statistics

## Styling

All components use Tailwind CSS with:
- Consistent color schemes
- Responsive breakpoints
- Dark mode support
- Custom animations
- Glassmorphism effects

## State Management

State is managed through custom hooks:
- `useInterviewState` - Interview flow state
- `useCamera` - Camera management
- `useVoiceRecording` - Voice recording state

This modular approach makes the code more maintainable and testable.
