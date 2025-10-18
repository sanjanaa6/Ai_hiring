# Socket.IO "Invalid Namespace" Error Fix

## Error Description
```
[CANDIDATE] Socket error: Error: Invalid namespace
    at iW.onpacket (main.45eb1c7e.js:2:2536837)
```

## Root Cause

The Socket.IO client was trying to connect using `REACT_APP_API_URL` which in production is set to:
```
https://aihiring.eval8.ai/api
```

However, Socket.IO connections should **NOT** include the `/api` path. The Socket.IO server listens on the root path (`/`), not on `/api`.

### Why This Happened

1. **API calls** use: `https://aihiring.eval8.ai/api` (correct)
2. **Socket.IO** should use: `https://aihiring.eval8.ai` (without `/api`)

The components were incorrectly using the same URL for both, causing Socket.IO to try connecting to a non-existent namespace.

## Solution Applied

Updated all Socket.IO components to properly derive the server URL by:
1. Removing `/api` suffix from `REACT_APP_API_URL` if present
2. Falling back to proper production/development URLs

### Files Modified

1. ✅ `frontend/src/services/socketService.js` - Core socket service
2. ✅ `frontend/src/components/WorkingScreenShare.js` - Candidate screen share
3. ✅ `frontend/src/components/SimpleRecruiterView.js` - Recruiter viewer
4. ✅ `frontend/src/components/RecruiterScreenShare.js` - Recruiter screen share
5. ✅ `frontend/src/components/CandidateScreenShare.js` - Candidate screen share
6. ✅ `frontend/src/recruiter/pages/ScreenShareDashboard.js` - Dashboard

### URL Derivation Logic

```javascript
const getSocketUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    // Remove /api suffix if present
    return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
  }
  
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.includes('eval8.ai')) {
      return 'https://aihiring.eval8.ai';
    }
    return `${protocol}//${hostname}:5000`;
  }
  
  return 'http://localhost:5000';
};
```

## Environment Configuration

### Development
- **API URL**: `http://localhost:5000/api`
- **Socket URL**: `http://localhost:5000`

### Production
- **API URL**: `https://aihiring.eval8.ai/api`
- **Socket URL**: `https://aihiring.eval8.ai`

## Deployment Steps

### 1. Rebuild Frontend

```bash
cd frontend
npm run build
```

### 2. Deploy to Production

The build will now correctly:
- Use `https://aihiring.eval8.ai/api` for REST API calls
- Use `https://aihiring.eval8.ai` for Socket.IO connections

### 3. Verify Fix

After deployment, check browser console:
- ✅ Should see: `🔌 [SOCKET] Connecting to: https://aihiring.eval8.ai`
- ✅ Should see: `✅ [SOCKET] Connected: <socket-id>`
- ❌ Should NOT see: `Invalid namespace` error

## Testing

### Local Testing
```bash
cd frontend
npm start
```

Expected console output:
```
🔌 [SOCKET] Connecting to: http://localhost:5000
✅ [SOCKET] Connected: abc123
```

### Production Testing

1. Open browser console on `https://aihiring.eval8.ai`
2. Start an interview as candidate
3. Check console for Socket.IO connection logs
4. Verify no "Invalid namespace" errors

## Related Issues Fixed

- ✅ Socket.IO connection failures in production
- ✅ Screen sharing not working for candidates
- ✅ Recruiter unable to view candidate screens
- ✅ WebRTC signaling failures

## Technical Details

### Socket.IO Server Configuration

The backend Socket.IO server is configured in `backend/server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      'https://aihiring.eval8.ai',
      'https://aihire.eval8.ai',
      // ... other origins
    ],
    credentials: true
  }
});
```

The server listens on the **default namespace** (`/`), not on `/api`.

### CORS Configuration

Ensure backend CORS allows the production domain:
- `https://aihiring.eval8.ai` ✅
- `https://www.aihiring.eval8.ai` ✅

## Troubleshooting

### If Socket.IO Still Fails

1. **Check browser console** for connection URL:
   ```
   🔌 [SOCKET] Connecting to: <URL>
   ```
   
2. **Verify URL is correct**:
   - ✅ Should be: `https://aihiring.eval8.ai`
   - ❌ Should NOT be: `https://aihiring.eval8.ai/api`

3. **Check backend logs** for CORS errors:
   ```bash
   docker logs ai-hiring-backend
   ```

4. **Verify environment variable**:
   ```bash
   # In production build
   echo $REACT_APP_API_URL
   # Should output: https://aihiring.eval8.ai/api
   ```

5. **Clear browser cache** and rebuild:
   ```bash
   cd frontend
   rm -rf build node_modules/.cache
   npm run build
   ```

## Prevention

To prevent this issue in the future:

1. **Use separate environment variables**:
   - `REACT_APP_API_URL` - for REST API (includes `/api`)
   - `REACT_APP_SOCKET_URL` - for Socket.IO (no `/api`)

2. **Or use the helper function** (current solution):
   - Automatically strips `/api` from API URL for Socket.IO

3. **Document the difference** between API and Socket URLs in `.env.example`
