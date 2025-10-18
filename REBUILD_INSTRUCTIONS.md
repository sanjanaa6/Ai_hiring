# 🚨 URGENT: Rebuild Required for .ai Domain

## ❌ Current Issue

Your production build still has `.xyz` URLs hardcoded in the JavaScript bundle:

```
Error: Access to 'https://aihire.eval8.xyz/api/auth/login' 
       from origin 'https://aihiring.eval8.ai' blocked by CORS
```

**Problem:** The frontend build was created with old `.xyz` URLs, but your backend is configured for `.ai` domains.

---

## ✅ Solution: Rebuild with Correct URLs

### **Step 1: Create .env.production**

Run this command in the `frontend` directory:

```bash
cd frontend
```

Create `frontend/.env.production` with this content:

```env
REACT_APP_API_URL=https://aihiring.eval8.ai
NODE_ENV=production
```

**OR** use the automated script:

```bash
# From project root
fix-production-url.bat
```

---

### **Step 2: Rebuild Frontend**

```bash
cd frontend
npm run build
```

This will create a new build in `frontend/build/` with the correct `.ai` URLs.

---

### **Step 3: Deploy New Build**

Upload the contents of `frontend/build/` to your production server, replacing all old files.

**Important:**
- Replace ALL files in the deployment
- Clear CDN cache if you're using one
- Clear browser cache (Ctrl+Shift+R)

---

### **Step 4: Verify**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Check the request URL - should be: `https://aihiring.eval8.ai/api/auth/login`
5. Should NOT see any `.xyz` URLs

---

## 🔍 Why This Happened

When you build a React app with `npm run build`:
- Environment variables are **baked into** the JavaScript bundle
- The URLs become **hardcoded** in the compiled code
- Changing source files doesn't affect the build until you rebuild

**Your current build** was created when `.env.production` had `.xyz` URLs (or didn't exist).

**New build** will use `.ai` URLs from the updated `.env.production`.

---

## 📋 Quick Checklist

- [ ] Create `frontend/.env.production` with `.ai` URLs
- [ ] Run `npm run build` in frontend directory
- [ ] Upload `frontend/build/*` to production server
- [ ] Clear CDN cache
- [ ] Clear browser cache (Ctrl+Shift+R)
- [ ] Test login - should use `.ai` URLs
- [ ] No CORS errors

---

## 🚀 Automated Fix

Run this from project root:

```bash
fix-production-url.bat
```

This will:
1. Create correct `.env.production`
2. Build frontend with `.ai` URLs
3. Show you where the build is located

Then just upload `frontend/build/*` to your server!

---

## ⚠️ Important Notes

1. **Backend is already configured** for `.ai` domains ✓
2. **Frontend source code is updated** for `.ai` domains ✓
3. **Only the build needs to be regenerated** ✗

4. **After rebuild:**
   - Old build: Uses `.xyz` URLs
   - New build: Uses `.ai` URLs

---

## 🔧 Manual .env.production Creation

If the script doesn't work, manually create:

**File:** `frontend/.env.production`

**Content:**
```env
REACT_APP_API_URL=https://aihiring.eval8.ai
NODE_ENV=production
```

Then run:
```bash
cd frontend
npm run build
```

---

*After rebuilding and deploying, the CORS error will be fixed!* 🎉
