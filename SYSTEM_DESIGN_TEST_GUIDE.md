# System Design Submit Button - Testing Guide

## 🎯 Quick Test Steps

### 1. **Start Backend Server** (if not already running)
```bash
cd d:\Mern\AI_hiring\backend
npm start
```
Backend should run on: `http://localhost:5000`

### 2. **Start Frontend** (already started)
```bash
cd d:\Mern\AI_hiring\frontend
npm start
```
Frontend should run on: `http://localhost:3000`

### 3. **Access the Application**
Open your browser and go to: `http://localhost:3000`

### 4. **Create/Access an Interview with System Design Round**

#### Option A: Create New Interview
1. Login as recruiter
2. Create a new interview
3. Add a **System Design** round with these settings:
   - Round Type: `system_design`
   - Duration: 30 minutes
   - Add a question like: "Design a URL shortener service"

#### Option B: Use Existing Interview
1. Go to your interviews list
2. Find an interview that has a System Design round
3. Get the interview access link

### 5. **Start the Interview as Candidate**
1. Open the interview link (e.g., `http://localhost:3000/interview/[interviewId]`)
2. Navigate through rounds until you reach the **System Design** round
3. You should see a question with an **"Open Canvas"** button

### 6. **Open System Design Canvas**
1. Click the **"Open Canvas"** button
2. The SystemDesignRound component will load

### 7. **Verify the Buttons** ✅
You should now see in the **Toolbar** (top of the screen):

**Right side of toolbar:**
- ⏱️ **Timer** - Countdown timer (turns red when < 5 minutes)
- 💾 **Auto-save Status** - Shows "Saved" when auto-save completes
- 🟢 **Submit Design** button (green gradient)
- 🔵 **Back to Interview** button (blue gradient)

**Left side of toolbar:**
- Tool selection buttons (Select, Pan, Rectangle, Circle, Arrow, Text)
- Zoom controls
- Undo/Redo buttons

### 8. **Test the Functionality**

#### Test Submit:
1. Draw some shapes on the canvas
2. Click **"Submit Design"** button
3. Should show loading state
4. Should submit to backend
5. Should redirect to next question or completion

#### Test Back Button:
1. Click **"Back to Interview"** button
2. Should return to interview question view
3. Should preserve your work (auto-saved)

#### Test Auto-save:
1. Draw shapes on canvas
2. Wait 30 seconds
3. Should see "Saved" indicator appear briefly

#### Test Timer:
1. Watch the timer countdown
2. When it reaches 0, should auto-submit

---

## 🐛 Troubleshooting

### "No buttons showing"
- Make sure you're at `localhost:3000` (main app), not `localhost:5174` (standalone)
- Verify you clicked "Open Canvas" from a System Design round
- Check browser console for errors

### "Cannot connect to backend"
- Ensure backend is running on port 5000
- Check `d:\Mern\AI_hiring\backend` terminal

### "Interview not loading"
- Clear browser cache
- Check MongoDB is running
- Verify interview exists in database

---

## 📝 Expected Behavior

### When in Interview Mode:
✅ Submit Design button appears (green)
✅ Back to Interview button appears (blue)
✅ Timer shows countdown
✅ Auto-save works every 30 seconds
✅ No Download JSON, Import, Theme toggle buttons

### When in Standalone Mode (localhost:5174):
❌ No Submit button
❌ No Back button
❌ No Timer
✅ Download JSON button
✅ Import button
✅ Theme toggle

---

## 🎨 What You Should See

```
┌─────────────────────────────────────────────────────────────┐
│ Diagram Studio  [Tools]  [Zoom]  [Undo/Redo]  [Timer] [Submit] [Back] │
├─────────────────────────────────────────────────────────────┤
│ Shapes │                                                     │
│  ┌──┐  │                                                     │
│  │  │  │         Your Design Canvas                         │
│  └──┘  │                                                     │
│   ○    │                                                     │
│   →    │                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Key Files Modified

1. `frontend/src/components/interview/InterviewMain.js`
   - Added SystemDesignRound inline rendering
   - Added handleOpenCanvas to show canvas inline

2. `frontend/src/components/interview/SystemDesignRound.js`
   - Added submit functionality
   - Added timer and auto-save
   - Passes props to Toolbar

3. `frontend/src/components/System-design/components/Toolbar.jsx`
   - Added Submit button (interview mode only)
   - Added Back button (interview mode only)
   - Added Timer display
   - Added Auto-save status

4. `frontend/src/components/System-design/App.jsx`
   - Added submit functionality for standalone mode
   - Added timer and auto-save

---

## 🚀 Quick Start Command

```bash
# Terminal 1 - Backend
cd d:\Mern\AI_hiring\backend && npm start

# Terminal 2 - Frontend
cd d:\Mern\AI_hiring\frontend && npm start

# Terminal 3 - System Design Standalone (optional)
cd d:\Mern\AI_hiring\frontend\src\components\System-design && npm run dev
```

Then open: `http://localhost:3000`
