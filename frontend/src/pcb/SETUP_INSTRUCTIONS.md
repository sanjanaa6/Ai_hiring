# 🚀 PCB Design Platform - Setup Instructions

## ⚡ Quick Start (2 Commands!)

```bash
npm install
npm start
```

That's it! The application will open at http://localhost:3000

---

## 📋 Prerequisites

**Required:**
- ✅ **Node.js** (version 14 or higher)
  - Download: https://nodejs.org/
  - Check version: `node --version`

**Recommended:**
- ✅ Modern web browser (Chrome, Edge, Firefox)
- ✅ 4GB RAM minimum
- ✅ Internet connection (for npm install)

---

## 🛠️ Setup Steps

### **Step 1: Extract the Zip File**
- Right-click on the zip file
- Select "Extract All" or use 7-Zip/WinRAR
- Extract to a folder (e.g., `pcb-design-platform`)

### **Step 2: Open Terminal/Command Prompt**

**Windows:**
- Press `Win + R`, type `cmd`, press Enter
- Or right-click in the folder → "Open in Terminal"

**Mac/Linux:**
- Open Terminal application
- Navigate to the extracted folder

```bash
cd path/to/pcb-design-platform
```

### **Step 3: Install Dependencies**

```bash
npm install
```

**What happens:**
- Downloads all required packages (~200MB)
- Installs React, Monaco Editor, Blockly, Tailwind CSS, etc.
- Takes 2-5 minutes depending on internet speed

**Expected output:**
```
added 1500+ packages in 3m
```

### **Step 4: Start the Application**

```bash
npm start
```

**What happens:**
- Starts the React development server
- Opens http://localhost:3000 in your browser automatically
- Watches for file changes and auto-reloads

**Expected output:**
```
Compiled successfully!

You can now view pcb-design-platform in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### **Step 5: Use the Application**

The browser should open automatically. If not, manually go to:
- **http://localhost:3000**

---

## ✅ Verify It's Working

After opening, you should see:

1. **Left Sidebar:** Component library with search
2. **Main Canvas:** Dark grid where you can drop components
3. **Right Panel:** Code/Visual/Evaluate tabs
4. **Top Toolbar:** Undo/Redo, Save, Clear buttons

### **Quick Test:**

1. Drag a battery from sidebar to canvas ✅
2. Drag an LED to canvas ✅
3. Click battery `+` pin, then LED anode (creates wire) ✅
4. Click battery `-` pin, then LED cathode (creates wire) ✅
5. LED should glow automatically! ✅

---

## 🐛 Troubleshooting

### **Issue: Port 3000 already in use**

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Or use a different port:**
```bash
# Windows PowerShell
$env:PORT=3001; npm start

# Mac/Linux/Git Bash
PORT=3001 npm start
```

### **Issue: npm install fails**

```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### **Issue: Module not found errors**

```bash
# Windows
rmdir /s node_modules
del package-lock.json

# Mac/Linux
rm -rf node_modules
rm package-lock.json

# Then reinstall
npm install
```

### **Issue: Browser doesn't open**

- Manually open: **http://localhost:3000**
- Try a different browser (Chrome, Edge, Firefox)
- Check terminal for error messages

---

## 🎯 Key Features Ready to Use

### **1. Circuit Design**
- Drag & drop components from sidebar
- Click pins to create wires
- Move components by dragging
- Delete with `Delete` key
- Zoom: Mouse wheel or `+`/`-` buttons
- Pan: Middle mouse or `Space`+drag
- Undo/Redo: `Ctrl+Z` / `Ctrl+Y`

### **2. Power Components**
All batteries and power sources included:
- USB Power Source (5V)
- Li-Ion Battery (3.7V)
- 9V Battery
- Resistors with color codes

### **3. Code Editor**
- Full Arduino C++ editor
- Syntax highlighting
- Template code included
- Run simulation

### **4. Visual Editor (Blockly)**
- Drag blocks to create programs
- Generates Arduino code automatically

### **5. Evaluation System**
- Validates circuit connections
- Checks for power sources
- Verifies ground connections
- Provides fix suggestions

### **6. LED Simulation**
- **Direct Connection:** LED glows when connected to battery (no code needed!)
- **Code Simulation:** Run Arduino code to control LEDs

---

## 💡 Quick Usage Example

### **Simple LED Circuit:**

1. **Search** "battery" in sidebar
2. **Drag** "Li-Ion 3.7V Battery" to canvas
3. **Search** "LED"
4. **Drag** "Red LED" to canvas
5. **Connect wires:**
   - Click battery `+` pin
   - Click LED `anode` or `+` pin
   - Click LED `cathode` or `-` pin
   - Click battery `-` pin
6. **Result:** LED glows red automatically! 💡

### **Arduino LED Blink:**

1. Add Arduino Nano from sidebar
2. Add LED
3. Connect LED to Arduino pin 13
4. Go to **Code** tab
5. Use the template code (already there)
6. Click **Run Simulation** ▶️
7. Watch LED blink!

---

## 🆘 Need Help?

### **Check Browser Console:**
- Press `F12` to open Developer Tools
- Look for error messages
- Check for `[Canvas]` and `[PowerAnalysis]` debug messages

### **Common Console Messages:**

✅ **Good:**
```
✅ [Canvas] LED glowing from battery
✅ Compiled successfully!
✅ [PowerAnalysis] Circuit trace result: {hasPower: true}
```

❌ **Issues:**
```
❌ Module not found
❌ Failed to compile
❌ [PowerAnalysis] No component or wires
```

---

## 📚 Additional Documentation

These files are included in the project:

- **README.md** - Project overview
- **ROADMAP.md** - Future features
- **EVALUATION_FEATURES.md** - Circuit validation
- **LED_SIMULATION_GUIDE.md** - LED simulation details
- **BATTERY_LED_GLOW_FIX.md** - Battery-powered LED feature
- **CODE_PERSISTENCE_FINAL_FIX.md** - Code editor fixes

---

## 🎉 Success Checklist

- [ ] Node.js installed (v14+)
- [ ] Zip extracted
- [ ] `npm install` completed without errors
- [ ] `npm start` running
- [ ] Browser shows app at http://localhost:3000
- [ ] Can drag components to canvas
- [ ] Can create wires
- [ ] LED glows when connected to battery

**All checked? You're ready! 🚀**

---

## 📊 What Gets Installed

`npm install` downloads:
- **react** - UI framework
- **monaco-editor** - Code editor
- **blockly** - Visual programming
- **tailwindcss** - Styling
- **lucide-react** - Icons
- ~1500 other packages

**Total size:** ~200-300MB

---

## 🌐 Share with Your Team

After running `npm start`, the terminal shows:
```
On Your Network: http://192.168.1.100:3000
```

Share this URL with teammates on the same network!

---

## 🚀 You're All Set!

**Start designing circuits today!** ⚡🔌✨

For questions, check the documentation files or open browser console for debug info.
