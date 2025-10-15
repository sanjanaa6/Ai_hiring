# System Design Standalone App - Setup Guide

This is a standalone Vite + React application that runs separately from the main AI Hiring platform, similar to how the PCB module works.

## 🚀 Quick Start

### Development Setup

1. **Navigate to the System Design folder:**
   ```bash
   cd frontend/src/components/System-design
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   The app will start on `http://localhost:5174`

4. **Run the main AI Hiring app** (in a separate terminal):
   ```bash
   cd ../../../../  # Go back to root
   cd frontend
   npm start
   ```
   
   The main app will start on `http://localhost:3000`

### How It Works

When a candidate starts a **System Design** round in an interview:
1. The main app redirects to `/system-design-round/:accessLink`
2. This route loads an **iframe** pointing to `http://localhost:5174`
3. The System Design app receives interview parameters via URL query string:
   - `interviewId` - The interview ID
   - `roundId` - The specific round ID
   - `duration` - Time limit in minutes
   - `candidateId` - Candidate identifier
   - `candidateName` - Candidate name
   - `candidateEmail` - Candidate email

### URL Parameters Example

```
http://localhost:5174/?interviewId=INT123&roundId=round_1&duration=30&candidateId=user123
```

## 📦 Production Deployment

### Option 1: Deploy to Separate Domain (Recommended)

1. **Build the System Design app:**
   ```bash
   cd frontend/src/components/System-design
   npm run build
   ```

2. **Deploy the `dist` folder** to a hosting service:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting

3. **Update the main app's environment variable:**
   ```bash
   # In frontend/.env.production
   REACT_APP_SYSTEM_DESIGN_URL=https://systemdesign.yourdomain.com
   ```

### Option 2: Deploy as Subdomain

Deploy to a subdomain like `https://systemdesign.eval8.xyz` and update the environment variable accordingly.

## 🔧 Configuration

### Main App Configuration

File: `frontend/src/pages/SystemDesignInterview.js`

```javascript
const systemDesignUrl = process.env.REACT_APP_SYSTEM_DESIGN_URL || 'http://localhost:5174';
```

### System Design App Configuration

File: `frontend/src/components/System-design/vite.config.js`

- Port: `5174`
- CORS: Enabled for all origins
- Base path: `/`

## 🎨 Features in Interview Mode

When loaded with interview parameters, the System Design app:
- ✅ Activates interview mode automatically
- ✅ Shows timer countdown
- ✅ Auto-saves diagram every 30 seconds
- ✅ Submits to backend API
- ✅ Prevents navigation away
- ✅ Full diagramming capabilities

## 🔗 Integration Points

### Backend API Endpoints

The System Design app communicates with:
- `POST /api/interviews/system-design/autosave` - Auto-save diagram
- `POST /api/interviews/system-design/submit` - Final submission
- `GET /api/interviews/system-design/:interviewId/:roundId/:candidateId` - Get saved diagram

### Main App Routes

- `/system-design-round/:accessLink` - Iframe loader page
- Main interview flow detects `system_design` round type and redirects

## 🛠️ Development Tips

1. **Run both apps simultaneously** for testing
2. **Check browser console** for interview mode activation logs
3. **Test with URL parameters** directly in the System Design app
4. **Use React DevTools** to inspect state

## 📝 Notes

- The System Design app is **completely independent** from the main app
- It can be developed, tested, and deployed separately
- Uses its own `package.json` and dependencies
- Similar architecture to the PCB module

## 🐛 Troubleshooting

**Issue:** System Design app not loading in iframe
- Check if the dev server is running on port 5174
- Verify CORS settings in `vite.config.js`
- Check browser console for errors

**Issue:** Interview parameters not received
- Verify URL query string format
- Check `App.jsx` useEffect for parameter parsing
- Look for console logs: "🎨 System Design - Interview Mode Activated"

**Issue:** Auto-save not working
- Check backend API is running
- Verify interview ID and round ID are correct
- Check network tab for API calls

## 📚 Related Files

- `frontend/src/pages/SystemDesignInterview.js` - Iframe loader
- `frontend/src/components/InterviewRoundRouter.js` - Round type router
- `backend/routes/systemDesign.js` - API endpoints
- `backend/models/Interview.js` - Database schema
