# Testing Power Components & Wire Connections

## ✅ **Fixed Issues:**
1. Power components now appear in the sidebar with proper icons
2. Battery and power source pins are now labeled with `+`, `-`, `+5V`, `GND`
3. All power components can be dragged to the canvas
4. Pin connections work properly - you can click pins and draw wires
5. Resistors show color code bands visually

---

## 🧪 **Quick Test - Simple LED Circuit**

### Step 1: Refresh Browser
- Go to http://localhost:3000
- Press `Ctrl+Shift+R` (hard refresh)

### Step 2: Find Power Components
Look in the **Components** panel on the left sidebar for these new items:
- **USB Power Source (5V)** - with yellow "5V" badge
- **9V Battery** - with yellow "9V" badge
- **220Ω Resistor** - with colored bands (Red-Red-Brown-Gold)

### Step 3: Add Components to Canvas
Drag these to the canvas:
1. USB Power Source
2. LED (search for "LED" or find Red LED)
3. 220Ω Resistor

### Step 4: Connect Wires
Now click on the pins to connect wires:

**USB Power Source:**
- Pin labeled `+5V` (top pin - red)
- Pin labeled `GND` (bottom pin - blue)

**Resistor:**
- Two pins labeled `1` and `2`

**LED:**
- Anode (positive, longer leg)
- Cathode (negative, shorter leg)

#### Wire it up:
1. Click USB `+5V` pin
2. Click Resistor `1` pin (creates wire)
3. Click Resistor `2` pin
4. Click LED Anode (creates wire)
5. Click LED Cathode
6. Click USB `GND` pin (creates wire)

### Step 5: Evaluate Circuit
1. Click the **"Evaluate"** tab in the right panel
2. Click **"Validate Circuit"** button
3. You should see:
   - ✅ Circuit score
   - ✅ Power connections validated
   - ✅ LED connection verified

---

## 🔋 **Testing Batteries**

### 9V Battery Test:
1. Add "9V Battery" to canvas
2. Look for pins labeled:
   - `+` at the top (positive terminal)
   - `-` at the bottom (negative terminal)
3. Click the `+` pin - wire should start drawing
4. Click the `-` pin - wire should start drawing

### Expected Pin Locations:
All battery and power components have pins positioned on the LEFT side:
- **USB Power Source**: 2 pins on left edge
- **9V Battery**: 2 pins - top and bottom center
- **Li-Ion Battery**: 2 pins - top and bottom center
- **4xAA Battery Holder**: 2 pins on left edge
- **12V DC Adapter**: 2 pins on left edge

---

## 🎨 **Testing Resistor Color Codes**

In the sidebar, look for resistors and you should see:
- **220Ω**: 4 colored bands (Red-Red-Brown-Gold)
- **330Ω**: 4 colored bands (Orange-Orange-Brown-Gold)
- **1kΩ**: 4 colored bands (Brown-Black-Red-Gold)
- **10kΩ**: 4 colored bands (Brown-Black-Orange-Gold)

---

## 🐛 **Troubleshooting**

### "I don't see the new components"
- ✅ Hard refresh: `Ctrl+Shift+R`
- ✅ Check browser console for errors (F12)
- ✅ Make sure dev server is running

### "Pins are not visible"
- ✅ Zoom in closer (use zoom buttons or mouse wheel)
- ✅ Hover over component - pins should highlight
- ✅ Check that scale is > 0.3 for labels to show

### "I can't click pins"
- ✅ Make sure you're not in pan mode (don't hold space)
- ✅ Try zooming in closer
- ✅ The pin should have a small circular hit area
- ✅ Hover should show tooltip with pin info

### "Wires won't connect"
- ✅ Click first pin (wire drawing starts)
- ✅ Click second pin (wire completes)
- ✅ Click empty canvas to cancel drawing
- ✅ ESC key also cancels wire drawing

### "Components show but no pins"
- ✅ Check browser console for JSON parsing errors
- ✅ Verify `enriched_power_components.json` is in `/public` folder
- ✅ Check that component has `pins` array with `x_px`, `y_px` values

---

## ✨ **Expected Behavior**

### When Dragging Components:
1. Component card should be draggable
2. Drop on canvas creates instance
3. Component shows at drop location
4. Pins are visible (as small circles)
5. Pin labels show (`+`, `-`, `+5V`, etc.)

### When Connecting Wires:
1. Click pin - wire drawing mode starts
2. Move mouse - dashed line follows cursor
3. Click second pin - solid wire appears
4. Wire routes orthogonally (Manhattan style)
5. Wire color indicates type (red=power, blue=ground, green=digital)

### When Evaluating:
1. Click "Evaluate" tab
2. See validation running indicator
3. Get score (0-100)
4. See specific errors/warnings
5. Get actionable fix suggestions

---

## 📊 **Success Criteria**

✅ All power components visible in sidebar  
✅ Voltage badges show on power sources  
✅ Color bands show on resistors  
✅ Components drag to canvas  
✅ Pins are visible on canvas  
✅ Pin labels show (+, -, +5V, GND)  
✅ Pins are clickable  
✅ Wires connect between pins  
✅ Evaluation tab works  
✅ Circuit validation gives feedback  

---

## 🎓 **Example Circuit to Build**

**"Blink an LED" - Complete Circuit**

Components needed:
1. USB Power Source (5V)
2. Arduino Nano
3. 220Ω Resistor (Red-Red-Brown)
4. Red LED

Connections:
```
USB +5V    →  Arduino VIN
USB GND    →  Arduino GND
Arduino D13 →  Resistor Pin 1
Resistor Pin 2 →  LED Anode (+)
LED Cathode (-) →  Arduino GND
```

Expected Evaluation:
- ✅ Score: 100/100
- ✅ All power connections valid
- ✅ All ground connections valid
- ✅ LED has current-limiting resistor
- ✅ Arduino has power source
- ✅ No short circuits

---

## 💡 **Tips**

1. **Zoom**: Use +/- buttons or mouse wheel
2. **Pan**: Hold middle mouse or Space+drag
3. **Delete**: Select component, press Delete key
4. **Reset View**: Press R key
5. **Grid Snap**: Toggle with Grid button (keeps things aligned)
6. **Wire Delete Mode**: Click trash icon, then click wires to delete

---

If everything works, you should be able to:
1. ✅ See all power components in sidebar
2. ✅ Drag them to canvas
3. ✅ See their pins with proper labels
4. ✅ Connect wires by clicking pins
5. ✅ Validate circuits and get scores

**🎉 Enjoy building circuits with proper power sources!**

