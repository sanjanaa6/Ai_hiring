# PCB Interview Integration - Setup Guide

This guide explains how to run the PCB design tool locally for interview integration, similar to the System Design setup.

## 🚀 Quick Start

### Development Setup

1. **Navigate to the PCB folder:**
   ```bash
   cd frontend/src/pcb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the port (Optional):**
   
   By default, React apps run on port 3000. Since your main app is already on port 3000, you need to run the PCB app on a different port.
   
   **Option 1: Set PORT environment variable**
   ```bash
   # Windows (PowerShell)
   $env:PORT=3001; npm start
   
   # Windows (CMD)
   set PORT=3001 && npm start
   
   # Linux/Mac
   PORT=3001 npm start
   ```
   
   **Option 2: Create .env file**
   ```bash
   # In frontend/src/pcb/.env
   PORT=3001
   ```

4. **Run the PCB development server:**
   ```bash
   npm start
   ```
   
   The PCB app will start on `http://localhost:3001`

5. **Run the main AI Hiring app** (in a separate terminal):
   ```bash
   cd ../../../  # Go back to root
   cd frontend
   npm start
   ```
   
   The main app will start on `http://localhost:3000`

### How It Works

When a candidate starts a **PCB Design** question in an interview:
1. The main app opens the PCB tool in a new tab/window
2. The PCB app receives interview parameters via URL query string:
   - `interviewId` - The interview ID
   - `roundId` - The specific round ID
   - `questionId` - The question ID
   - `duration` - Time limit in minutes
   - `candidateId` - Candidate identifier
   - `mode` - Set to 'interview' to activate interview mode

### URL Parameters Example

```
http://localhost:3001/?mode=interview&interviewId=INT123&roundId=round_4&questionId=q4_1&duration=6&candidateId=user123
```

## 📦 Production Deployment

### Option 1: Deploy to Separate Domain (Recommended)

1. **Build the PCB app:**
   ```bash
   cd frontend/src/pcb
   npm run build
   ```

2. **Deploy the `build` folder** to a hosting service:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting

3. **Update the main app's environment variable:**
   ```bash
   # In frontend/.env.production
   REACT_APP_PCB_URL=https://pcb.yourdomain.com
   ```

### Option 2: Deploy as Subdomain

Deploy to a subdomain like `https://pcb.eval8.xyz` and update the environment variable accordingly.

### Option 3: Same Server Different Port

If deploying on the same server:
1. Configure the PCB app to run on port 3001
2. Set up reverse proxy (Nginx/Apache) to route `/pcb` to port 3001
3. Update environment variable: `REACT_APP_PCB_URL=https://yourdomain.com/pcb`

## 🔧 Configuration

### Main App Configuration

**File:** `frontend/src/components/PCBInterviewInterface.js`

```javascript
const pcbUrl = process.env.REACT_APP_PCB_URL || 'http://localhost:3001';
```

**File:** `frontend/src/pages/PCBInterview.js`

```javascript
const pcbUrl = process.env.REACT_APP_PCB_URL || 'http://localhost:3001';
```

### PCB App Configuration

**File:** `frontend/src/pcb/src/App.js`

- Detects interview mode from URL parameters
- Activates timer and auto-save
- Submits to backend API

## 🎨 Features in Interview Mode

When loaded with interview parameters, the PCB app:
- ✅ Activates interview mode automatically
- ✅ Shows timer countdown in toolbar
- ✅ Auto-saves design every 30 seconds
- ✅ Submits to backend API on completion
- ✅ Auto-submits when time expires
- ✅ Shows "Submit Design" button
- ✅ Full PCB design capabilities

## 🔗 Integration Points

### Backend API Endpoints

The PCB app communicates with:
- `POST /api/interviews/pcb-design/autosave` - Auto-save PCB design
- `POST /api/interviews/pcb-design/submit` - Final submission
- `GET /api/interviews/pcb-design/:interviewId/:roundId/:questionId/:candidateId` - Get saved design

### Main App Routes

- `/pcb-interview/:accessLink` - Iframe loader page (if using iframe)
- PCB tool opens in new tab with interview parameters
- Main interview flow detects `pcb-design` question type

## 🛠️ Development Tips

1. **Run both apps simultaneously** for testing
2. **Check browser console** for interview mode activation logs
3. **Test with URL parameters** directly in the PCB app
4. **Use React DevTools** to inspect state
5. **Test auto-save** by monitoring network tab

## 📝 Environment Variables

### Development (.env.development)
```bash
# Main App
REACT_APP_PCB_URL=http://localhost:3001

# PCB App
PORT=3001
```

### Production (.env.production)
```bash
# Main App
REACT_APP_PCB_URL=https://pcb.yourdomain.com

# PCB App
# No PORT needed in production
```

## 🐛 Troubleshooting

**Issue:** PCB app not loading
- Check if the dev server is running on port 3001
- Verify no port conflicts
- Check browser console for errors

**Issue:** Interview parameters not received
- Verify URL query string format
- Check `App.js` useEffect for parameter parsing
- Look for console logs: "🔧 PCB - Interview Mode Activated"

**Issue:** Auto-save not working
- Check backend API is running
- Verify interview ID and round ID are correct
- Check network tab for API calls
- Ensure CORS is configured properly

**Issue:** Timer not showing
- Verify `duration` parameter is passed in URL
- Check `timeRemaining` state in React DevTools
- Ensure `isInterviewMode` is true

**Issue:** Port already in use
- Kill the process using port 3001
- Use a different port (3002, 3003, etc.)
- Update environment variables accordingly

## 📚 Related Files

### Main App
- `frontend/src/pages/PCBInterview.js` - Iframe loader (optional)
- `frontend/src/components/PCBInterviewInterface.js` - Interview interface
- `frontend/src/App.js` - Route configuration

### PCB App
- `frontend/src/pcb/src/App.js` - Main PCB app with interview mode
- `frontend/src/pcb/src/components/Toolbar.jsx` - Toolbar with timer
- `frontend/src/pcb/package.json` - Dependencies

### Backend
- `backend/routes/pcbDesign.js` - API endpoints (needs to be created)
- `backend/models/Interview.js` - Database schema

## 🔄 Comparison with System Design

| Feature | System Design | PCB Design |
|---------|--------------|------------|
| **Architecture** | Standalone Vite app (port 5174) | Standalone React app (port 3001) |
| **Integration** | Loads in iframe | Opens in new tab |
| **Auto-save** | Every 30 seconds | Every 30 seconds |
| **Timer** | Yes | Yes |
| **Deployment** | Separate domain | Separate domain |

## 🎯 Next Steps

1. ✅ PCB app configured for interview mode
2. ✅ Main app updated to use internal PCB URL
3. ⏳ Create backend API endpoints for PCB submissions
4. ⏳ Test interview flow end-to-end
5. ⏳ Deploy PCB app to production

## 📞 Support

If you encounter issues:
1. Check console logs in both apps
2. Verify all environment variables are set
3. Ensure backend API is running
4. Test with simple URL parameters first
5. Check network tab for failed requests

---

**Happy PCB Designing! 🔧**
