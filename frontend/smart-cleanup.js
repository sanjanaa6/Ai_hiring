#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, 'src');

// Utility functions
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function backupFile(filePath) {
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`📁 Backup: ${path.basename(filePath)}`);
}

// Get all JS/JSX files recursively
function getAllJSFiles(dir) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
        files.push(fullPath);
      }
    });
  }
  
  walkDir(dir);
  return files;
}

// Parse imports and find unused ones
function findUnusedImports(content, filePath) {
  const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g;
  const usedComponents = new Set();
  const unusedImports = [];
  
  // Find all JSX usage
  const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = jsxRegex.exec(content)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Find all function calls
  const functionCallRegex = /\b([A-Z][a-zA-Z0-9]*)\s*\(/g;
  while ((match = functionCallRegex.exec(content)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Check each import
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    const imports = importMatch[1].split(',').map(i => i.trim());
    const fromPackage = importMatch[2];
    
    imports.forEach(imported => {
      const cleanImport = imported.replace(/\s+as\s+\w+/, '').trim();
      if (!usedComponents.has(cleanImport) && fromPackage === 'lucide-react') {
        unusedImports.push(cleanImport);
      }
    });
  }
  
  return unusedImports;
}

// Find unused state variables
function findUnusedStateVariables(content) {
  const stateRegex = /const\s*\[([^,]+),\s*set([^\]]+)\]\s*=\s*useState\(/g;
  const unusedStates = [];
  
  let match;
  while ((match = stateRegex.exec(content)) !== null) {
    const stateVar = match[1].trim();
    const setterVar = `set${match[2].trim()}`;
    
    // Check if state variable is used anywhere
    const stateUsageRegex = new RegExp(`\\b${stateVar}\\b`, 'g');
    const setterUsageRegex = new RegExp(`\\b${setterVar}\\b`, 'g');
    
    const stateMatches = content.match(stateUsageRegex) || [];
    const setterMatches = content.match(setterUsageRegex) || [];
    
    // If only appears in declaration and setter usage
    if (stateMatches.length <= 1 && setterMatches.length >= 0) {
      unusedStates.push(stateVar);
    }
  }
  
  return unusedStates;
}

// Clean the file
function cleanFile(filePath) {
  try {
    const content = readFile(filePath);
    let cleaned = content;
    
    // Find unused imports
    const unusedImports = findUnusedImports(content, filePath);
    
    // Remove unused imports
    unusedImports.forEach(icon => {
      const regex = new RegExp(`${icon},?\\s*`, 'g');
      cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up import statements
    cleaned = cleaned.replace(/import\s*{\s*,\s*}/g, '');
    cleaned = cleaned.replace(/import\s*{\s*}/g, '');
    cleaned = cleaned.replace(/,\s*}/g, ' }');
    cleaned = cleaned.replace(/import\s*{\s*,/g, 'import { ');
    
    // Find and remove unused state variables
    const unusedStates = findUnusedStateVariables(content);
    
    unusedStates.forEach(state => {
      const stateRegex = new RegExp(`const\\s*\\[${state},\\s*set${state.charAt(0).toUpperCase() + state.slice(1)}\\]\\s*=\\s*useState\\([^)]*\\);?\\s*`, 'g');
      cleaned = cleaned.replace(stateRegex, '');
    });
    
    // Remove mouse position handlers
    const mouseHandlerRegex = /useEffect\(\(\)\s*=>\s*{\s*const\s+handleMouseMove\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}\s*;?\s*window\.addEventListener\([^)]*\)\s*;?\s*return\s*\(\)\s*=>\s*window\.removeEventListener\([^)]*\)\s*;?\s*}\s*,\s*\[\]\)\s*;?/g;
    cleaned = cleaned.replace(mouseHandlerRegex, '');
    
    // Remove unused arrays/objects
    const unusedArrays = ['benefits', 'addOns', 'containerVariants', 'itemVariants'];
    unusedArrays.forEach(array => {
      const arrayRegex = new RegExp(`const\\s+${array}\\s*=\\s*\[[^]*?\];\\s*`, 'g');
      cleaned = cleaned.replace(arrayRegex, '');
    });
    
    // Fix useEffect dependencies
    cleaned = cleaned.replace(/useEffect\(\(\)\s*=>\s*{\s*fetchInterview\(\);\s*}\s*,\s*\[\]\)/g, "useEffect(() => { fetchInterview(); }, [fetchInterview])");
    
    return cleaned;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return content;
  }
}

// Main function
function runCleanup() {
  console.log('🔍 Scanning all React files for unused variables...\n');
  
  const allFiles = getAllJSFiles(SRC_DIR);
  let totalFiles = 0;
  let totalChanges = 0;
  
  allFiles.forEach(filePath => {
    const relativePath = path.relative(SRC_DIR, filePath);
    
    try {
      const originalContent = readFile(filePath);
      const cleanedContent = cleanFile(filePath);
      
      if (originalContent !== cleanedContent) {
        backupFile(filePath);
        writeFile(filePath, cleanedContent);
        console.log(`✅ Cleaned: ${relativePath}`);
        totalChanges++;
      }
      
      totalFiles++;
    } catch (error) {
      console.error(`❌ Error: ${relativePath} - ${error.message}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files scanned: ${totalFiles}`);
  console.log(`   Files cleaned: ${totalChanges}`);
  console.log(`   Backups created: ${totalChanges}`);
  
  console.log('\n🔄 Running ESLint fix...');
  try {
    execSync('npm run lint:fix', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ ESLint fixes applied!');
  } catch (error) {
    console.log('⚠️  Manual review may be needed for some files');
  }
}

// Handle command line
if (require.main === module) {
  runCleanup();
}

module.exports = { runCleanup };
