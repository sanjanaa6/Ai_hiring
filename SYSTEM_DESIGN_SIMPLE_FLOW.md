# ✅ System Design Round - Simple Flow

## 🎯 How It Works (Simple & Clean)

### For Developer Interviews - Round 3:

1. **TTS speaks the question** 📢
2. **"Open Design Canvas" button** appears (green, prominent)
3. **Candidate clicks** → Opens standalone System Design app (full features)
4. **Candidate designs the system** using all the tools
5. **Download diagram** → Click "Download" button (saves as JSON file)
6. **Click "Back to Interview"** button (blue, top toolbar)
7. **Returns to interview** → Click "Next" to move to next question
8. **Repeat for all 5 questions**

## 📝 User Instructions

When candidate reaches Round 3:

```
1. Listen to the question (TTS will speak it)
2. Click "Open Design Canvas" button
3. Design your system architecture
4. Download your diagram (JSON file)
5. Click "Back to Interview" button
6. Click "Next" to continue to next question
```

## 🎨 Features in System Design App

- ✅ Full diagramming tools (shapes, arrows, text, icons)
- ✅ Undo/Redo
- ✅ Save/Load diagrams
- ✅ **Download diagram** (JSON file)
- ✅ **Back to Interview button** (blue, top-right)
- ✅ Dark/Light theme
- ✅ Fullscreen mode
- ✅ Import/Export

## 🔧 Technical Details

### Files Modified:

1. **Toolbar.jsx** - Added "Back to Interview" button (blue)
2. **InterviewMain.js** - Added instruction text for system design
3. **App.jsx** - Debug logging for URL parameters

### Flow:

```
Interview Round 3
    ↓
TTS speaks question
    ↓
"Open Design Canvas" button
    ↓
Click → Redirects to System Design app (localhost:5174)
    ↓
Design system
    ↓
Download diagram (JSON)
    ↓
Click "Back to Interview" → Returns to /interview/:id
    ↓
Click "Next" → Moves to next question
```

### Buttons in System Design App:

- **Back to Interview** (Blue, top-right) - Returns to interview
- **Download** (Top toolbar) - Downloads diagram as JSON
- **Save** (Top toolbar) - Saves to localStorage
- All other tools (shapes, arrows, etc.)

## 🚀 To Run:

### 1. Backend (Port 5000)
```bash
cd backend
npm run dev
```

### 2. Main Frontend (Port 3000)
```bash
cd frontend
npm start
```

### 3. System Design App (Port 5174)
```bash
cd frontend/src/components/System-design
npm run dev
```

## ✅ Testing:

1. Start a developer interview
2. Complete Round 1 & 2
3. Start Round 3 (System Design)
4. You'll see:
   - TTS speaks question
   - "Open Design Canvas" button (green)
   - Instruction text below button
5. Click button → Opens System Design app
6. Design something
7. Click "Download" to save diagram
8. Click "Back to Interview" (blue button, top-right)
9. Returns to interview
10. Click "Next" to move to next question

## 📦 What Candidate Gets:

- **5 system design questions** (one at a time)
- **Full diagramming tool** for each question
- **Downloaded diagrams** (JSON files) as proof of work
- **Simple flow** - no complex submissions

## 🎉 Benefits:

- ✅ Simple and intuitive
- ✅ No complex submission logic
- ✅ Candidate has proof of work (downloaded files)
- ✅ Can review diagrams offline
- ✅ Full-featured design tool
- ✅ Easy to navigate back and forth
