# Fix 502 Bad Gateway Error - Production Backend Not Running

## Problem
- Frontend: `https://aihiring.eval8.ai` is accessible
- Backend API: `https://aihiring.eval8.ai/api/*` returns **502 Bad Gateway**
- Error: "Request failed with status code 502"

## Root Cause
The Node.js backend server is **not running** on your production server, so nginx cannot proxy requests to it.

## Solution: Start Backend Server on Production

### Step 1: SSH into Your Production Server
```bash
ssh user@your-server-ip
# Or use your hosting provider's console
```

### Step 2: Navigate to Backend Directory
```bash
cd /path/to/AI_hiring/backend
# Common paths:
# - /var/www/AI_hiring/backend
# - /home/user/AI_hiring/backend
# - /opt/AI_hiring/backend
```

### Step 3: Check if Backend is Running
```bash
# Check if Node.js process is running on port 5000
netstat -tulpn | grep :5000
# OR
lsof -i :5000
# OR
ps aux | grep node
```

### Step 4: Check Environment Variables
```bash
# Verify .env file exists
cat .env

# Should contain:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/ai-hiring
# JWT_SECRET=your_secret_key
# NODE_ENV=production
# FRONTEND_URL=https://aihiring.eval8.ai
```

### Step 5: Install Dependencies (if needed)
```bash
npm install
```

### Step 6: Start Backend Server

#### Option A: Using PM2 (Recommended for Production)
```bash
# Install PM2 globally if not installed
npm install -g pm2

# Start the backend
pm2 start server.js --name "ai-hiring-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### Option B: Using Node.js Directly (Not Recommended)
```bash
# Start in background
nohup node server.js > backend.log 2>&1 &
```

#### Option C: Using systemd Service (Best for Production)
Create file: `/etc/systemd/system/ai-hiring-backend.service`
```ini
[Unit]
Description=AI Hiring Backend
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/AI_hiring/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-hiring-backend
sudo systemctl start ai-hiring-backend
sudo systemctl status ai-hiring-backend
```

### Step 7: Verify Backend is Running
```bash
# Check if server is listening
netstat -tulpn | grep :5000

# Check logs
pm2 logs ai-hiring-backend
# OR
tail -f backend.log
# OR
sudo journalctl -u ai-hiring-backend -f

# Test API endpoint
curl http://localhost:5000/api/health
# Should return: {"status":"ok","mongodb":"connected",...}
```

### Step 8: Check Nginx Configuration
```bash
# View nginx config
sudo cat /etc/nginx/sites-available/aihiring.eval8.ai

# Should contain proxy_pass to backend:
# location /api/ {
#     proxy_pass http://localhost:5000;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#     proxy_set_header Host $host;
#     proxy_cache_bypass $http_upgrade;
# }

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Verification Steps

### 1. Test Backend Directly
```bash
# From production server
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","mongodb":"connected","environment":"production"}
```

### 2. Test Through Nginx
```bash
# From production server
curl https://aihiring.eval8.ai/api/health

# Should return same response as above
```

### 3. Test Registration Endpoint
```bash
curl -X POST https://aihiring.eval8.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456",
    "role": "candidate"
  }'

# Should return: {"message":"User created successfully","token":"..."}
# OR: {"message":"User already exists"} if email exists
```

### 4. Check Browser
1. Open `https://aihiring.eval8.ai`
2. Try to register/login
3. Check browser console (F12) - should NOT see 502 errors

## Common Issues

### Issue 1: MongoDB Not Running
```bash
# Check MongoDB status
sudo systemctl status mongodb
# OR
sudo systemctl status mongod

# Start if not running
sudo systemctl start mongodb
```

### Issue 2: Port 5000 Already in Use
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process if needed
sudo kill -9 <PID>

# Or change PORT in .env file to different port (e.g., 5001)
```

### Issue 3: Firewall Blocking Port
```bash
# Allow port 5000 (only needed if accessing externally)
sudo ufw allow 5000/tcp

# For internal nginx proxy, this is usually not needed
```

### Issue 4: Wrong Working Directory
```bash
# Backend must be started from backend/ directory
cd /path/to/AI_hiring/backend
pm2 start server.js
```

## Quick Diagnostic Commands

Run these on your production server:

```bash
# 1. Check if backend process is running
ps aux | grep "node.*server.js"

# 2. Check if port 5000 is listening
netstat -tulpn | grep :5000

# 3. Check backend logs
pm2 logs ai-hiring-backend --lines 50

# 4. Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# 5. Check system resources
free -h
df -h
top
```

## Expected Backend Logs

When backend starts successfully, you should see:
```
🔗 [SERVER] Attempting to connect to MongoDB...
✅ [SERVER] MongoDB connected successfully
📦 [SERVER] Loading routes...
  ✅ Dashboard routes loaded
  ✅ Jobs routes loaded
  ✅ Applications routes loaded
  ✅ Users routes loaded
  ✅ Auth routes loaded
  ...
======================================================================
🚀 AI HIRING BACKEND SERVER
======================================================================
🌐 Server URL:          http://localhost:5000
🔗 API Base URL:        http://localhost:5000/api
🏥 Health Check:        http://localhost:5000/api/health
✅ Server is ready to accept connections!
```

## Still Not Working?

If backend still won't start:

1. **Check Node.js version**
   ```bash
   node --version  # Should be v14+ or v16+
   ```

2. **Check for missing dependencies**
   ```bash
   npm install
   ```

3. **Check for syntax errors**
   ```bash
   node -c server.js
   ```

4. **Run in foreground to see errors**
   ```bash
   node server.js
   # Watch for any error messages
   ```

5. **Check MongoDB connection string**
   - Verify MONGODB_URI in .env
   - Test MongoDB connection separately

## Contact Your Hosting Provider

If you're using managed hosting (Heroku, Railway, Render, etc.):
- Check their dashboard for backend service status
- View application logs in their console
- Ensure backend service is deployed and running
- Check environment variables are set correctly
