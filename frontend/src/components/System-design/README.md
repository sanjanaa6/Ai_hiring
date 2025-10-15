# Diagram Studio - Draw.io Clone

A professional, feature-rich diagramming tool built with React and Vite.

## 🚀 Features

- **Drag & Drop Interface**: Intuitive shape and icon placement
- **Rich Shape Library**: 
  - Basic shapes (rectangles, circles, diamonds, hexagons, etc.)
  - Flowchart elements
  - Arrow shapes with customizable styles
  - UML diagrams
  - Entity-Relationship diagrams
  - AWS service icons
  - Database icons (MongoDB, MySQL, PostgreSQL, Redis, etc.)
  - System icons

- **Advanced Editing**:
  - Resize, rotate, and move elements
  - Arrow endpoint manipulation
  - Text editing with alignment and styling
  - Color customization with presets
  - Undo/Redo support (Ctrl+Z / Ctrl+Y)

- **Professional Features**:
  - Save/Load diagrams (Ctrl+S)
  - Export to JSON
  - Import diagrams
  - Fullscreen mode
  - Light/Dark theme
  - Zoom controls
  - Pan mode for large canvases

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

## 🔧 Installation & Setup

1. **Extract the ZIP file** to your desired location

2. **Open terminal/command prompt** in the project folder

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## 🎮 Usage

### Keyboard Shortcuts
- `V` - Select tool
- `H` - Pan tool
- `R` - Rectangle tool
- `C` - Circle tool
- `T` - Text tool
- `A` - Arrow tool
- `Ctrl+S` - Save diagram
- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo
- `Delete` - Delete selected element
- `F11` or Fullscreen button - Toggle fullscreen

### Basic Operations
1. **Add shapes**: Click icons in the sidebar or drag them to the canvas
2. **Select**: Click on any element to select it
3. **Move**: Drag selected elements
4. **Resize**: Drag the corner handles of selected elements
5. **Rotate**: Use the rotation slider in the property panel
6. **Edit text**: Double-click on any shape or text element
7. **Style**: Select an element and use the property panel on the right
8. **Arrows**: Drag the blue/green handles to change direction and length

## 🏗️ Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` folder, ready to deploy to any static hosting service.

## 📦 Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **CSS3** - Styling

## 🐛 Troubleshooting

**Port already in use?**
- Vite will automatically try alternative ports (5174, 5175, etc.)
- Or manually specify: `npm run dev -- --port 3000`

**Installation fails?**
- Make sure Node.js version is 16+: `node --version`
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## 📄 License

This project is provided as-is for client use.

## 🤝 Support

For issues or questions, please contact your development team.

---

**Enjoy creating amazing diagrams! 🎨**
