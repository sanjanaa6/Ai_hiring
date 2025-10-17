# 🎯 START HERE - Quick Setup Guide

## ⚡ 2-Step Setup

### 1️⃣ Install Dependencies
```bash
npm install
```
Wait 2-5 minutes for ~1500 packages to download.

### 2️⃣ Start the Application
```bash
npm start
```
Browser opens automatically at **http://localhost:3000**

---

## ✅ That's It!

You should now see:
- **Left:** Component library
- **Center:** Canvas for circuit design
- **Right:** Code/Visual/Evaluate tabs

---

## 🚀 Quick Test

1. Drag **"Li-Ion Battery"** from sidebar to canvas
2. Drag **"Red LED"** to canvas
3. Click battery `+` pin → LED anode
4. Click battery `-` pin → LED cathode
5. **LED glows automatically!** 💡

---

## 📖 Need More Help?

Open **SETUP_INSTRUCTIONS.md** for:
- Detailed step-by-step guide
- Troubleshooting
- Feature documentation
- Usage examples

---

## 🐛 Problems?

### Port 3000 in use?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <number> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### npm install errors?
```bash
npm cache clean --force
npm install
```

---

## 📋 Prerequisites

- ✅ **Node.js v14+** (download from nodejs.org)
- ✅ Modern web browser
- ✅ Internet connection (for first-time install)

---

## 🎉 Features Ready to Use

✅ Drag & drop circuit design  
✅ Battery-powered LED (no code needed!)  
✅ Arduino code editor with syntax highlighting  
✅ Visual block programming (Blockly)  
✅ Circuit validation & scoring  
✅ Real-time simulation  
✅ Zoom, pan, undo/redo  

---

**Questions? Check SETUP_INSTRUCTIONS.md or ROADMAP.md**

**Happy Circuit Designing! ⚡🔌✨**

