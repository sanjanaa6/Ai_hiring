# Screen Share Minimize/Maximize Fix

## Problem Statement

When starting an interview with screen sharing enabled, clicking the **X (close) button** on the screen share modal would:
1. ❌ End the entire screen share session
2. ❌ Stop all media tracks (screen + audio)
3. ❌ Disconnect socket connection
4. ❌ End session in database
5. ❌ Return to interview start page

This prevented candidates from proceeding with the interview while screen sharing continued in the background.

## Root Cause Analysis

### 1. **Component Unmounting Issue**
- The `onClose` handler in `UserInterview.js` set `showScreenShare = false`
- This unmounted the `CandidateScreenShare` component
- React's cleanup function (`useEffect` return) triggered `cleanup()`
- All streams, connections, and sessions were terminated

### 2. **No Minimize State**
- The application only had two states: **show** or **hide**
- No intermediate "minimized" state where screen sharing continues but UI is hidden
- No way to restore the screen share window without ending the session

## Solution Implemented

### ✅ **Minimize/Maximize Pattern**

Instead of closing, the screen share modal now supports:
- **Minimize**: Hides the full modal, shows a floating indicator
- **Maximize**: Restores the full modal from minimized state
- **End Interview**: Properly terminates the session (with confirmation)

## Changes Made

### 1. **UserInterview.js** (`frontend/src/user/pages/UserInterview.js`)

**Added State:**
```javascript
const [isMinimized, setIsMinimized] = useState(false);
```

**New Handlers:**
```javascript
const handleMinimize = () => {
  setIsMinimized(true);
};

const handleMaximize = () => {
  setIsMinimized(false);
};

const handleEndInterview = () => {
  if (window.confirm('Are you sure you want to end the interview? This will stop screen sharing.')) {
    setShowScreenShare(false);
    setIsMinimized(false);
  }
};
```

**Updated Props:**
```javascript
<CandidateScreenShare
  interviewId={interviewId}
  candidateId={user?.id || user?._id}
  candidateName={user?.name || user?.fullName}
  candidateEmail={user?.email}
  onMinimize={handleMinimize}      // NEW
  onMaximize={handleMaximize}      // NEW
  onEndInterview={handleEndInterview} // NEW
  isMinimized={isMinimized}        // NEW
  token={user?.token}
/>
```

### 2. **CandidateScreenShare.js** (`frontend/src/components/CandidateScreenShare.js`)

**Updated Component Signature:**
```javascript
const CandidateScreenShare = ({ 
  interviewId, 
  candidateId, 
  candidateName, 
  candidateEmail, 
  onMinimize,        // NEW - replaces onClose
  onMaximize,        // NEW
  onEndInterview,    // NEW
  isMinimized,       // NEW
  token 
}) => {
```

**Added Minimized View:**
```javascript
if (isMinimized) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-2xl p-4 flex items-center space-x-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <div>
            <p className="text-white font-semibold text-sm">Screen Sharing Active</p>
            <p className="text-blue-100 text-xs">{statusMessage}</p>
          </div>
        </div>
        <button onClick={onMaximize}>Expand</button>
        <button onClick={onEndInterview}>End</button>
      </div>
    </div>
  );
}
```

**Updated Header Buttons:**
```javascript
<div className="flex items-center space-x-2">
  <button
    onClick={onMinimize}
    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white text-sm font-medium transition"
    title="Minimize (screen sharing continues)"
  >
    Minimize
  </button>
  <button
    onClick={onEndInterview}
    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition flex items-center space-x-1"
    title="End interview and stop sharing"
  >
    <X className="w-4 h-4" />
    <span>End Interview</span>
  </button>
</div>
```

## User Flow After Fix

### **Starting Interview:**
1. User enters Interview ID
2. Clicks "Start Interview"
3. Screen share modal appears
4. Browser prompts for screen share permission
5. Screen sharing starts (full modal visible)

### **Minimizing Screen Share:**
1. User clicks **"Minimize"** button
2. Full modal hides
3. **Floating indicator appears** (bottom-right corner)
4. Screen sharing **continues in background**
5. Socket connection **remains active**
6. User can now proceed with interview questions

### **Restoring Screen Share:**
1. User clicks **"Expand"** on floating indicator
2. Full modal restores
3. Screen sharing still active
4. All connections intact

### **Ending Interview:**
1. User clicks **"End Interview"** button (red)
2. Confirmation dialog appears
3. If confirmed:
   - Stops all media tracks
   - Disconnects socket
   - Ends session in database
   - Returns to start page

## Technical Benefits

### ✅ **Component Lifecycle Preserved**
- Component stays mounted when minimized
- No cleanup triggered
- All refs, streams, and connections maintained

### ✅ **State Management**
- Clear separation between minimize and close
- Explicit user intent required to end session
- Confirmation dialog prevents accidental termination

### ✅ **User Experience**
- Visual indicator that screen sharing is active
- Easy access to restore or end
- No confusion about session state

### ✅ **Backend Integration**
- Session remains "active" in database
- Recruiter can still view screen
- No false "session ended" events

## Testing Checklist

- [ ] Start interview with screen share
- [ ] Click "Minimize" - verify floating indicator appears
- [ ] Verify screen sharing continues (check recruiter view)
- [ ] Click "Expand" - verify full modal restores
- [ ] Minimize again and proceed with interview questions
- [ ] Click "End Interview" - verify confirmation dialog
- [ ] Confirm end - verify session properly terminates
- [ ] Check database - verify session marked as "ended"
- [ ] Check recruiter dashboard - verify session removed from active list

## Related Files

- `frontend/src/user/pages/UserInterview.js` - Main interview page
- `frontend/src/components/CandidateScreenShare.js` - Screen share component
- `frontend/src/services/socketService.js` - Socket.IO service
- `backend/socket/screenShareSocket.js` - Backend socket handlers
- `backend/models/ScreenShareSession.js` - Database model

## Future Enhancements

1. **Picture-in-Picture Mode**: Use browser PiP API for video preview
2. **Keyboard Shortcuts**: Alt+M to minimize, Alt+E to expand
3. **Auto-minimize**: After 5 seconds of inactivity
4. **Session Timer**: Show elapsed time in floating indicator
5. **Connection Quality**: Display network status in indicator
6. **Multi-monitor Support**: Better handling of screen selection

## Notes

- The fix maintains backward compatibility with existing interview flows
- No database schema changes required
- Works with both authenticated and anonymous candidates
- Compatible with all interview types (coding, system design, PCB, etc.)
