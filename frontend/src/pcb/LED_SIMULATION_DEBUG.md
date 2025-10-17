# 🐛 LED Simulation Debugging Guide

## Your Issue
Simulation is running but LED isn't glowing.

---

## 🔍 Quick Debugging Steps

### **Step 1: Open Browser Console**
Press `F12` → Click "Console" tab

### **Step 2: Refresh and Run Simulation**
1. Hard refresh: `Ctrl+Shift+R`
2. Click "Run Simulation" button
3. Watch console output

### **Step 3: Look for These Messages**

**✅ Good Signs:**
```
[Simulator] Mapping pin 13 to components...
[Simulator] Available components: Li-Ion 3.7V (Battery), LED Red Simple (LED)
[Simulator] No Arduino/microcontroller found - using simple mode
[Simulator] Found 1 LEDs: ["LED Red Simple"]
[Simulator] Digital write pin 13 = 1
[CanvasWithCode] Component LED Red Simple type: led
[CanvasWithCode] LED LED Red Simple highlight set to: #ef4444 value: 1
[Canvas] LED LED Red Simple glowing from simulation: {highlight: "#ef4444"...}
```

**❌ Problem Signs:**
```
[Simulator] Found 0 LEDs: []
```
→ LED component not detected!

```
[CanvasWithCode] Component LED Red Simple type: undefined
```
→ LED type is missing!

---

## 🔧 Common Fixes

### **Fix 1: LED Component Type**

**Check:**
Open console and look for:
```
[CanvasWithCode] Component LED Red Simple type: undefined
```

**Solution:**
The LED needs to have `type: "LED"` property. 

Check the component in enriched_components.json:
```json
{
  "id": "led_red_1",
  "name": "LED Red Simple",
  "type": "LED",  // ← Must be exactly "LED"
  ...
}
```

### **Fix 2: Simulation Not Receiving Components**

**Check:**
```
[Simulator] Available components: []
```

**Solution:**
Components not passed to simulator. Check TabContainer is passing them correctly.

### **Fix 3: LED State Not Updating**

**Check:**
```
[CanvasWithCode] LED LED Red Simple highlight set to: null value: 0
```

**Solution:**
LED is receiving LOW (0) instead of HIGH (1). Check your code:
```cpp
digitalWrite(13, HIGH);  // ✅ Should be HIGH
// not
digitalWrite(13, LOW);   // ❌ This turns it OFF
```

---

## 🧪 Test Console Commands

Paste these in console to test:

### **1. Check Components:**
```javascript
// See what's on canvas
console.log('Components:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

### **2. Force LED Glow (temporary test):**
```javascript
// This won't work directly, but tests if glow CSS works
document.querySelector('[data-component="true"]').style.boxShadow = '0 0 20px #ef4444';
```

---

## 📊 Expected Console Flow

When simulation runs correctly:

```
1. [Simulator] runCode called
2. [Simulator] Running setup()
3. [Simulator] Set pin 13 to mode OUTPUT
4. [Simulator] Running loop iteration 1
5. [Simulator] Digital write pin 13 = 1
6. [Simulator] Mapping pin 13 to components...
7. [Simulator] Found 1 LEDs: ["LED Red Simple"]
8. [CanvasWithCode] Updating component states: [...] value: 1
9. [CanvasWithCode] Component LED Red Simple type: led
10. [CanvasWithCode] LED LED Red Simple highlight set to: #ef4444
11. [Canvas] LED LED Red Simple glowing from simulation
```

---

## 🔬 Advanced Debugging

### **Check Component State:**
Add this temporarily to Canvas.jsx in renderComponents:
```javascript
console.log('[Canvas DEBUG]', {
  componentName: component.name,
  componentType: component.type,
  componentState: componentState,
  ledGlowEffect: ledGlowEffect,
  showSimulation: showSimulation
});
```

### **Check Simulation Running:**
Look for this in TabContainer:
```javascript
[TabContainer] Simulation status: true
```

### **Check Pin Value:**
In CodeSimulator, verify:
```javascript
[Simulator] Pin state: {13: {mode: "OUTPUT", value: 1, type: "digital"}}
```

---

## 🎯 Most Likely Issues

### **1. LED Type Not "LED"**
**Symptom:** LED found but doesn't match switch case  
**Fix:** Set component `type: "LED"` exactly

### **2. Component Not Found**
**Symptom:** `Found 0 LEDs`  
**Fix:** Make sure LED is on canvas, refresh page

### **3. Simulation State Not Passed**
**Symptom:** No highlight in componentState  
**Fix:** Check CanvasWithCode → Canvas prop passing

### **4. CSS Glow Not Applied**
**Symptom:** State correct but no visual glow  
**Fix:** Check PCBComponent styling, boxShadow CSS

---

## 🚀 Quick Fix Commands

Run these in order:

```bash
# 1. Stop dev server
Ctrl+C

# 2. Clear cache
rm -rf node_modules/.cache

# 3. Restart
npm start

# 4. Hard refresh browser
Ctrl+Shift+R
```

---

## 📝 Checklist Before Asking for Help

- [ ] Console open (F12)
- [ ] Hard refreshed (`Ctrl+Shift+R`)
- [ ] Clicked "Run Simulation"
- [ ] Checked all console messages above
- [ ] LED component on canvas
- [ ] LED type is exactly "LED"
- [ ] Code has `digitalWrite(13, HIGH);`
- [ ] Simulation shows "Stop" button (running)

**Copy ALL console output and share it!**

---

## 💡 Temporary Workaround

If nothing works, add this to your code:

```cpp
void loop() {
  // Light up ALL LEDs regardless of connections
  for(int i = 0; i <= 13; i++) {
    digitalWrite(i, HIGH);
  }
  delay(1000);
}
```

This lights up all pins, so your LED should definitely glow!

---

## ✅ After Fix

When working, you should see:
1. Console logs show LED found ✅
2. Highlight color set to #ef4444 ✅
3. LED glows red on canvas ✅
4. Pulsing animation ✅

**Refresh and check console now!** 🔍

