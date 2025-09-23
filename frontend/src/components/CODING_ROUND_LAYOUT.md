# Interview Layout - SimpleVoiceInterview

## Layout Structure

The interview interface now uses a consistent two-column layout for all rounds:

### Regular Interview Rounds
- **Left Column (50%)**: Question, controls, and transcription
- **Right Column (50%)**: Camera feed with status indicators

### Regular Interview Rounds (Two-Column Layout)
```
┌─────────────────────────────────────────────────────────────────┐
│                        Header Bar                               │
│  [Round Title] [Question X of Y] [Timer] [Recording Status]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┬─────────────────────────────────┐  │
│  │                         │                                 │  │
│  │   LEFT COLUMN (50%)     │    RIGHT COLUMN (50%)           │  │
│  │                         │                                 │  │
│  │  ┌─────────────────────┐ │  ┌─────────────────────────┐   │  │
│  │  │                     │ │  │                         │   │  │
│  │  │   QUESTION PANEL    │ │  │     CAMERA FEED         │   │  │
│  │  │                     │ │  │                         │   │  │
│  │  │ • Question Number   │ │  │ • Live Video Stream     │   │  │
│  │  │ • Question Text     │ │  │ • Status Indicators     │   │  │
│  │  │ • Action Buttons    │ │  │ • Device Monitoring     │   │  │
│  │  │   - Skip Question   │ │  │ • Recording Status      │   │  │
│  │  │   - Submit Answer   │ │  │ • AI Speaking Status    │   │  │
│  │  │ • Live Transcription│ │  │ • Interview Stats       │   │  │
│  │  │ • Answer Status     │ │  │ • Progress Tracking     │   │  │
│  │  │                     │ │  │                         │   │  │
│  │  └─────────────────────┘ │  └─────────────────────────┘   │  │
│  │                         │                                 │  │
│  └─────────────────────────┴─────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Coding Rounds (Special Layout)
- **Top Half (50%)**: Question and camera side-by-side
- **Bottom Half (50%)**: Full-width code editor

```
┌─────────────────────────────────────────────────────────────────┐
│                        Header Bar                               │
│  [Round Title] [Question X of Y] [Timer] [Recording Status]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┬─────────────────────────────────┐  │
│  │                         │                                 │  │
│  │    TOP HALF (50%)       │                                 │  │
│  │                         │                                 │  │
│  │  ┌─────────────────────┐ │  ┌─────────────────────────┐   │  │
│  │  │                     │ │  │                         │   │  │
│  │  │   QUESTION PANEL    │ │  │     CAMERA FEED         │   │  │
│  │  │                     │ │  │                         │   │  │
│  │  │ • Question Number   │ │  │ • Live Video Stream     │   │  │
│  │  │ • Coding Question   │ │  │ • Status Indicators     │   │  │
│  │  │ • Action Buttons    │ │  │ • Device Monitoring     │   │  │
│  │  │   - Skip Question   │ │  │ • Recording Status      │   │  │
│  │  │   - Submit Code     │ │  │ • AI Speaking Status    │   │  │
│  │  │ • Answer Status     │ │  │                         │   │  │
│  │  │                     │ │  │                         │   │  │
│  │  └─────────────────────┘ │  └─────────────────────────┘   │  │
│  │                         │                                 │  │
│  └─────────────────────────┴─────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │              BOTTOM HALF (50%)                              │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │                                                     │   │  │
│  │  │              CODE EDITOR                            │   │  │
│  │  │                                                     │   │  │
│  │  │ • Enhanced Code Editor (Monaco-style)              │   │  │
│  │  │ • Syntax Highlighting                               │   │  │
│  │  │ • Language Indicator (JavaScript, Python, etc.)    │   │  │
│  │  │ • Starter Code Template                             │   │  │
│  │  │ • Test Cases Display                                │   │  │
│  │  │ • Real-time Code Changes                            │   │  │
│  │  │ • Full-screen Option                                │   │  │
│  │  │                                                     │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### Top Half (Question + Camera)
- **Left Side (50%)**: Question panel with:
  - Question number and title
  - Full coding question text
  - Skip Question button
  - Submit Code button
  - Answer status indicator
- **Right Side (50%)**: Camera feed with:
  - Live video stream
  - Status indicators (Live, Recording, AI Speaking)
  - Device monitoring status
  - Electronic device detection alerts

### Bottom Half (Code Editor)
- **Full Width**: Enhanced code editor
- **Features**:
  - Syntax highlighting
  - Language indicator
  - Starter code template
  - Test cases display
  - Real-time code changes
  - Full-screen option
  - AI interviewer integration

## Responsive Design

### Regular Interview Rounds
- **Desktop (lg and above)**: Two-column layout (Question | Camera)
- **Mobile/Tablet**: Stacked layout (Question above Camera)

### Coding Rounds
- **Desktop (lg and above)**: 
  - Top half: Side-by-side layout (Question | Camera)
  - Bottom half: Full-width code editor
- **Mobile/Tablet**: 
  - Top half: Stacked layout (Question above Camera)
  - Bottom half: Full-width code editor
  - Maintains 50/50 height split

## Implementation Details

### Component Structure
```jsx
{isLiveCodingRound ? (
  <div className="w-full h-full flex flex-col">
    {/* Top Half - Question and Camera */}
    <div className="h-1/2 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Question */}
      <div className="w-full lg:w-1/2 flex flex-col px-6 py-4 overflow-y-auto">
        {/* Question Display */}
        {/* Action Buttons */}
        {/* Answer Status */}
      </div>
      
      {/* Right Side - Camera */}
      <div className="w-full lg:w-1/2 flex flex-col items-center px-4 py-4">
        {/* Video Feed */}
        {/* Status Overlays */}
      </div>
    </div>

    {/* Bottom Half - Code Editor */}
    <div className="h-1/2 flex flex-col">
      <div className="backdrop-blur-md border-2 rounded-2xl p-4 m-4">
        {/* Code Editor Header */}
        {/* Enhanced Code Editor */}
      </div>
    </div>
  </div>
) : (
  // Regular interview layout
)}
```

### Key CSS Classes
- `h-1/2`: 50% height for top and bottom sections
- `lg:flex-row`: Side-by-side layout on desktop
- `flex-col`: Stacked layout on mobile
- `overflow-hidden`: Prevents content overflow
- `backdrop-blur-md`: Glass morphism effect
- `rounded-2xl`: Rounded corners for modern look

### State Management
- `isLiveCodingRound`: Determines layout mode
- `codeAnswer`: Stores code editor content
- `isCodeEditorFullscreen`: Controls fullscreen mode
- All existing interview states maintained

## Benefits

1. **Optimal Screen Usage**: 50/50 split maximizes both question visibility and coding space
2. **Professional Layout**: Matches industry-standard coding interview interfaces
3. **Responsive Design**: Works on all screen sizes
4. **Enhanced UX**: Clear separation of concerns (question, camera, coding)
5. **Maintains Functionality**: All existing features (device detection, AI speaking, etc.) preserved
6. **Visual Hierarchy**: Clear information architecture

## Usage

The layout automatically activates when:
- `currentQuestion?.type === 'interactive-coding'`
- `currentRound?.title` contains "interactive coding"
- `currentQuestion?.question` contains "interactive"
- `currentQuestion?.codeEditor?.enabled` is true

This ensures the specialized coding layout is only shown for actual coding questions, maintaining the regular interview layout for other question types.
