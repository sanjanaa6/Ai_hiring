# Eye Tracking Feature Documentation

## Overview

The eye tracking feature provides strict monitoring of user behavior during interviews to ensure academic integrity and prevent cheating. It includes:

1. **Real-time gaze monitoring** - Detects when users look away from the screen
2. **Face positioning guide** - Ensures proper camera setup before interviews
3. **Violation tracking system** - Records and manages violations with automatic removal
4. **Backend monitoring** - Server-side tracking and analytics

## Features

### 🎯 Eye Tracking Components

#### 1. Face Positioning Guide (`FacePositioningGuide.js`)
- **Purpose**: Guides users to position their face correctly before starting the interview
- **Features**:
  - White circle overlay for face positioning
  - Real-time feedback on face size and centering
  - Shoulder visibility indicators
  - Auto-completion when positioning is perfect

#### 2. Gaze Monitoring (`GazeMonitoring.js`)
- **Purpose**: Real-time monitoring of user's gaze direction
- **Features**:
  - Live gaze direction indicator (center, left, right, up, down)
  - Look-away duration tracking
  - Violation counter with progress bar
  - Warning modals for violations

#### 3. Violation Tracker (`ViolationTracker.js`)
- **Purpose**: Manages violation history and handles user removal
- **Features**:
  - Violation history sidebar
  - Detailed violation information
  - Automatic interview termination
  - Final warning system

### 🔧 Technical Implementation

#### Eye Tracking Hook (`useEyeTracking.js`)
```javascript
const eyeTracking = useEyeTracking(interviewId);

// Available properties:
eyeTracking.isInitialized        // Face mesh initialization status
eyeTracking.isTracking          // Current tracking status
eyeTracking.gazeDirection       // Current gaze direction
eyeTracking.faceDetected        // Face detection status
eyeTracking.facePosition        // Face position coordinates
eyeTracking.violations          // Array of violations
eyeTracking.violationCount      // Total violation count
eyeTracking.isLookingAway       // Currently looking away
eyeTracking.isBackendTracking   // Backend sync status
```

#### Configuration
```javascript
const LOOK_AWAY_THRESHOLD = 2000; // 2 seconds before violation
const MAX_VIOLATIONS = 3;         // Maximum violations allowed
const GAZE_THRESHOLD = 0.3;       // Gaze direction sensitivity
```

### 🚨 Violation System

#### Violation Types
1. **Gaze Violation**: User looks away from screen for more than 2 seconds
2. **Face Positioning Violation**: Improper camera setup
3. **Max Violations**: Reached maximum violation limit

#### Violation Flow
1. **Warning**: First violation - warning modal
2. **Critical**: Second violation - critical warning
3. **Termination**: Third violation - automatic interview termination

### 📊 Backend Integration

#### API Endpoints
```javascript
// Track violation
POST /api/eye-tracking/violation
{
  "interviewId": "string",
  "violationType": "gaze_violation",
  "violationData": {
    "direction": "left",
    "duration": 2500
  }
}

// Get tracking status
GET /api/eye-tracking/status/:interviewId

// Start/Stop tracking
POST /api/eye-tracking/start
POST /api/eye-tracking/stop

// Terminate interview
POST /api/eye-tracking/terminate

// Analytics (admin only)
GET /api/eye-tracking/analytics
```

#### Database Schema
```javascript
// Interview model extension
eyeTrackingData: {
  violations: [{
    id: String,
    type: String,
    data: Object,
    timestamp: Date,
    userId: String
  }],
  totalViolations: Number,
  isMonitoringActive: Boolean,
  maxViolations: Number,
  startedAt: Date,
  terminatedAt: Date,
  terminationReason: String
}
```

## Usage

### 1. Basic Integration
```javascript
import { useEyeTracking } from '../hooks/useEyeTracking';
import GazeMonitoring from '../components/GazeMonitoring';
import ViolationTracker from '../components/ViolationTracker';

const MyInterview = ({ interviewId }) => {
  const eyeTracking = useEyeTracking(interviewId);
  
  return (
    <div>
      {/* Your interview content */}
      
      <GazeMonitoring
        gazeDirection={eyeTracking.gazeDirection}
        isLookingAway={eyeTracking.isLookingAway}
        violationCount={eyeTracking.violationCount}
        maxViolations={eyeTracking.MAX_VIOLATIONS}
        onRemoveUser={handleRemoveUser}
        isActive={true}
      />
      
      <ViolationTracker
        violations={eyeTracking.violations}
        violationCount={eyeTracking.violationCount}
        maxViolations={eyeTracking.MAX_VIOLATIONS}
        onRemoveUser={handleRemoveUser}
        isActive={true}
      />
    </div>
  );
};
```

### 2. Face Positioning Setup
```javascript
import FacePositioningGuide from '../components/FacePositioningGuide';

const InterviewSetup = ({ videoRef }) => {
  const [showGuide, setShowGuide] = useState(false);
  
  return (
    <div>
      <video ref={videoRef} />
      
      {showGuide && (
        <FacePositioningGuide
          videoRef={videoRef}
          onPositioningComplete={() => setShowGuide(false)}
          isActive={showGuide}
          facePosition={eyeTracking.facePosition}
          faceDetected={eyeTracking.faceDetected}
        />
      )}
    </div>
  );
};
```

## Configuration Options

### Eye Tracking Settings
```javascript
// In useEyeTracking.js
const CONFIG = {
  LOOK_AWAY_THRESHOLD: 2000,    // ms before violation
  MAX_VIOLATIONS: 3,            // max violations allowed
  GAZE_THRESHOLD: 0.3,          // gaze sensitivity
  FACE_SIZE_MIN: 0.15,          // min face size (relative)
  FACE_SIZE_MAX: 0.4,           // max face size (relative)
  FACE_CENTER_THRESHOLD: 0.1    // face centering tolerance
};
```

### Backend Settings
```javascript
// In eyeTrackingMonitoring.js
const DEFAULT_CONFIG = {
  maxViolations: 3,
  violationTypes: ['gaze_violation', 'face_positioning_violation'],
  monitoringEnabled: true
};
```

## Security Features

### 1. Strict Monitoring
- **Real-time gaze detection** using MediaPipe Face Mesh
- **Automatic violation recording** with timestamps
- **Progressive warning system** with clear consequences
- **Automatic interview termination** on max violations

### 2. Data Privacy
- **Local processing** - face detection happens in browser
- **Minimal data collection** - only violation events sent to server
- **Secure transmission** - all API calls use authentication
- **Data retention** - violations stored for audit purposes

### 3. Anti-Cheating Measures
- **Face positioning enforcement** - ensures proper setup
- **Continuous monitoring** - no gaps in surveillance
- **Immediate response** - violations trigger instant warnings
- **Zero tolerance** - strict enforcement of rules

## Browser Compatibility

### Required Features
- **WebRTC** - for camera access
- **MediaPipe** - for face detection
- **Canvas API** - for overlay rendering
- **Modern JavaScript** - ES6+ features

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Considerations

### Optimization
- **Efficient face detection** - optimized MediaPipe models
- **Minimal DOM updates** - only update when necessary
- **Background processing** - non-blocking violation checks
- **Memory management** - proper cleanup on unmount

### Resource Usage
- **CPU**: Moderate (face detection processing)
- **Memory**: Low (minimal data structures)
- **Network**: Minimal (only violation events)
- **Battery**: Moderate (camera and processing)

## Troubleshooting

### Common Issues

#### 1. Camera Not Working
```javascript
// Check camera permissions
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera OK'))
  .catch(err => console.error('Camera Error:', err));
```

#### 2. Face Detection Failing
```javascript
// Check MediaPipe initialization
if (eyeTracking.isInitialized) {
  console.log('Face detection ready');
} else {
  console.log('Initializing face detection...');
}
```

#### 3. Violations Not Tracking
```javascript
// Check backend connection
eyeTrackingService.getEyeTrackingStatus(interviewId)
  .then(status => console.log('Backend OK:', status))
  .catch(err => console.error('Backend Error:', err));
```

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('eyeTrackingDebug', 'true');

// Check violation history
console.log('Violations:', eyeTracking.violations);
console.log('Count:', eyeTracking.violationCount);
```

## Future Enhancements

### Planned Features
1. **Advanced Analytics** - detailed violation patterns
2. **Machine Learning** - improved gaze detection accuracy
3. **Multi-camera Support** - multiple angle monitoring
4. **Real-time Alerts** - instant notifications to proctors
5. **Custom Violation Rules** - configurable thresholds

### Integration Opportunities
1. **Proctoring Dashboard** - real-time monitoring interface
2. **AI Proctoring** - automated violation detection
3. **Mobile Support** - tablet/phone compatibility
4. **Offline Mode** - local violation storage
5. **API Extensions** - third-party integrations

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Note**: This feature is designed for academic integrity and should be used responsibly. Ensure compliance with privacy laws and institutional policies.
