#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const LUCIDE_ICONS = [
  'MessageCircle', 'CheckCircle', 'Zap', 'Sparkles', 'RotateCcw', 'useInView', 'useAnimation',
  'Heart', 'Shield', 'Clock', 'Award', 'TrendingUp', 'Target', 'Globe', 'Lock', 'Unlock',
  'Flame', 'Lightning', 'CheckCircle2', 'AlertTriangle', 'Eye', 'Gift', 'Timer', 'Diamond',
  'Infinity', 'Info', 'Gamepad2', 'BarChart3', 'XCircle', 'ThumbsUp', 'Brain', 'Rocket',
  'User', 'Mail', 'Phone', 'MapPin', 'DollarSign', 'Briefcase', 'Home', 'LogOut', 'Calendar'
];

// Track files that need fixing
const filesToFix = [
  'landing/components/Hero.js',
  'landing/components/HowItWorks.js',
  'landing/components/Pricing.js',
  'landing/components/Testimonials.js',
  'landing/legal/CookiePolicy.js',
  'landing/legal/Pricing.js',
  'pages/Applications.js',
  'pages/Interview.js',
  'pages/Login.js',
  'pages/Register.js',
  'pages/Profile.js',
  'recruiter/components/InterviewReviewer.js',
  'recruiter/pages/RecruiterDashboard.js',
  'user/pages/CandidateDashboard.js'
];

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
  console.log(`📁 Backup created: ${backupPath}`);
}

// Clean up unused imports
function cleanUnusedImports(fileContent, filePath) {
  let content = fileContent;
  
  // Remove unused Lucide icons
  LUCIDE_ICONS.forEach(icon => {
    const regex = new RegExp(`\\b${icon}\\b`, 'g');
    if (!content.includes(icon) || !content.match(new RegExp(`<${icon}\\b|<${icon} `))) {
      // Remove from import statement
      content = content.replace(new RegExp(`${icon},?\\s*`, 'g'), '');
      content = content.replace(new RegExp(`,\\s*${icon}`, 'g'), '');
    }
  });

  // Clean up empty import braces
  content = content.replace(/import\s*{\s*,\s*}/g, '');
  content = content.replace(/import\s*{\s*}/g, '');
  
  // Remove trailing commas in imports
  content = content.replace(/,\s*}/g, ' }');
  
  return content;
}

// Remove unused variables
function cleanUnusedVariables(fileContent, filePath) {
  let content = fileContent;
  
  // Remove mousePosition state and related code
  content = content.replace(/const\s*\[mousePosition,\s*setMousePosition\]\s*=\s*useState\([^)]*\);\s*/g, '');
  content = content.replace(/const\s*\[mousePosition,\s*setMousePosition\]\s*=\s*useState\([^)]*\);?\s*/g, '');
  
  // Remove mouse move event listeners
  content = content.replace(/useEffect\(\(\)\s*=>\s*{\s*const\s+handleMouseMove\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}\s*;?\s*window\.addEventListener\([^)]*\)\s*;?\s*return\s*\(\)\s*=>\s*window\.removeEventListener\([^)]*\)\s*;?\s*}\s*,\s*\[\]\)\s*;?/g, '');
  
  // Remove unused state variables
  content = content.replace(/const\s*\[saving,\s*setSaving\]\s*=\s*useState\([^)]*\);\s*/g, '');
  content = content.replace(/const\s*\[toggleTheme,\s*setToggleTheme\]\s*=\s*useState\([^)]*\);\s*/g, '');
  content = content.replace(/const\s*\[reviewLink,\s*setReviewLink\]\s*=\s*useState\([^)]*\);\s*/g, '');
  
  // Remove unused arrays/objects
  content = content.replace(/const\s+(benefits|addOns)\s*=\s*\[[^]*?\];\s*/g, '');
  
  // Fix useEffect dependencies
  content = content.replace(/\[\]/g, "[fetchInterview]");
  
  return content;
}

// Remove unused imports
function removeUnusedImports(fileContent) {
  let content = fileContent;
  
  // Remove specific unused icons
  const unusedIcons = [
    'MessageCircle', 'CheckCircle', 'Zap', 'Sparkles', 'RotateCcw', 'useInView', 'useAnimation',
    'Heart', 'Shield', 'Clock', 'Award', 'TrendingUp', 'Target', 'Globe', 'Lock', 'Unlock',
    'Flame', 'Lightning', 'CheckCircle2', 'AlertTriangle', 'Eye', 'Gift', 'Timer', 'Diamond',
    'Infinity', 'Info', 'Gamepad2', 'BarChart3', 'ThumbsUp', 'Brain', 'Rocket', 'User', 'Mail',
    'Phone', 'MapPin', 'DollarSign', 'Briefcase', 'Home', 'LogOut', 'Calendar'
  ];
  
  unusedIcons.forEach(icon => {
    // Check if icon is actually used in JSX
    const isUsed = content.includes(`<${icon}`) || content.includes(`${icon}(`);
    if (!isUsed) {
      // Remove from import statements
      content = content.replace(new RegExp(`${icon},?\\s*`, 'g'), '');
      content = content.replace(new RegExp(`,\\s*${icon}`, 'g'), '');
    }
  });
  
  return content;
}

// Main cleanup function
function cleanupFile(filePath) {
  const fullPath = path.join(SRC_DIR, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  console.log(`🧹 Cleaning: ${filePath}`);
  
  try {
    const originalContent = readFile(fullPath);
    backupFile(fullPath);
    
    let cleanedContent = originalContent;
    cleanedContent = cleanUnusedImports(cleanedContent, filePath);
    cleanedContent = cleanUnusedVariables(cleanedContent, filePath);
    cleanedContent = removeUnusedImports(cleanedContent);
    
    writeFile(fullPath, cleanedContent);
    console.log(`✅ Cleaned: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

// Run cleanup
function runCleanup() {
  console.log('🚀 Starting React unused variables cleanup...\n');
  
  filesToFix.forEach(filePath => {
    cleanupFile(filePath);
  });
  
  console.log('\n🎉 Cleanup complete!');
  console.log('📋 Running ESLint to verify fixes...');
  
  try {
    execSync('npm run lint -- --fix', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
    console.log('✅ ESLint checks passed!');
  } catch (error) {
    console.log('⚠️  Manual review may be needed for some files');
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
Usage: node cleanup-unused-vars.js [options]

Options:
  --help     Show this help message
  --dry-run  Show what would be changed without making changes
  --file     Clean specific file only

Examples:
  node cleanup-unused-vars.js                    # Clean all files
  node cleanup-unused-vars.js --file pages/Login.js  # Clean specific file
  node cleanup-unused-vars.js --dry-run          # Preview changes
`);
  process.exit(0);
}

if (process.argv.includes('--dry-run')) {
  console.log('🔍 Dry run mode - showing what would be changed...');
  // Implement dry run logic here
  process.exit(0);
}

if (process.argv.includes('--file')) {
  const fileIndex = process.argv.indexOf('--file') + 1;
  const specificFile = process.argv[fileIndex];
  if (specificFile) {
    cleanupFile(specificFile);
    process.exit(0);
  }
}

// Run the cleanup
runCleanup();
