#!/usr/bin/env node
/**
 * VS Code path helper CLI script
 * Helps developers navigate the TELE_TAMI codebase structure
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const PATHS = {
  components: 'components/',
  lib: 'lib/',
  utils: 'utils/',
  tests: '__tests__/',
  docs: 'docs/',
  prompts: 'prompt_parts/',
  scripts: 'scripts/',
  functions: 'functions/',
  app: 'app/'
};

function showHelp() {
  console.log('VS Code Path Helper for TELE_TAMI');
  console.log('================================');
  console.log('');
  console.log('Usage: node scripts/pathHelper.js [command] [args...]');
  console.log('');
  console.log('Commands:');
  console.log('  list [category]     - List files in a category');
  console.log('  find [pattern]      - Find files matching pattern');
  console.log('  open [file]         - Show full path for VS Code');
  console.log('  structure           - Show project structure');
  console.log('  recent [n]          - Show n most recently modified files');
  console.log('  help                - Show this help');
  console.log('');
  console.log('Categories: ' + Object.keys(PATHS).join(', '));
}

function listFiles(category) {
  if (!category) {
    console.log('Available categories:');
    Object.entries(PATHS).forEach(([name, dir]) => {
      console.log(`  ${name}: ${dir}`);
    });
    return;
  }

  const dir = PATHS[category];
  if (!dir) {
    console.error(`Unknown category: ${category}`);
    console.log('Available categories: ' + Object.keys(PATHS).join(', '));
    return;
  }

  const fullPath = path.join(WORKSPACE_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Directory not found: ${fullPath}`);
    return;
  }

  console.log(`Files in ${category} (${dir}):`);
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  files.forEach(file => {
    const icon = file.isDirectory() ? '📁' : '📄';
    console.log(`  ${icon} ${file.name}`);
  });
}

function findFiles(pattern) {
  if (!pattern) {
    console.error('Please provide a search pattern');
    return;
  }

  const regex = new RegExp(pattern, 'i');
  const results = [];

  function searchDir(dir, relativePath = '') {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach(file => {
        const filePath = path.join(relativePath, file.name);
        if (regex.test(file.name)) {
          results.push({
            name: file.name,
            path: filePath,
            isDir: file.isDirectory()
          });
        }
        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
          searchDir(path.join(dir, file.name), filePath);
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }

  searchDir(WORKSPACE_ROOT);

  if (results.length === 0) {
    console.log(`No files found matching: ${pattern}`);
    return;
  }

  console.log(`Found ${results.length} file(s) matching "${pattern}":`);
  results.forEach(result => {
    const icon = result.isDir ? '📁' : '📄';
    console.log(`  ${icon} ${result.path}`);
  });
}

function showFullPath(filename) {
  if (!filename) {
    console.error('Please provide a filename');
    return;
  }

  const results = [];

  function searchDir(dir, relativePath = '') {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach(file => {
        const filePath = path.join(relativePath, file.name);
        if (file.name === filename || file.name.includes(filename)) {
          results.push({
            name: file.name,
            path: filePath,
            fullPath: path.join(dir, file.name),
            isDir: file.isDirectory()
          });
        }
        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
          searchDir(path.join(dir, file.name), filePath);
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }

  searchDir(WORKSPACE_ROOT);

  if (results.length === 0) {
    console.log(`File not found: ${filename}`);
    return;
  }

  console.log(`VS Code paths for "${filename}":`);
  results.forEach(result => {
    const icon = result.isDir ? '📁' : '📄';
    console.log(`  ${icon} ${result.fullPath}`);
  });
}

function showStructure() {
  console.log('TELE_TAMI Project Structure:');
  console.log('');
  
  Object.entries(PATHS).forEach(([name, dir]) => {
    const fullPath = path.join(WORKSPACE_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 ${name}/ (${dir})`);
      try {
        const files = fs.readdirSync(fullPath, { withFileTypes: true })
          .filter(f => !f.name.startsWith('.'))
          .slice(0, 5); // Show first 5 files
        files.forEach(file => {
          const icon = file.isDirectory() ? '  📁' : '  📄';
          console.log(`${icon} ${file.name}`);
        });
        if (fs.readdirSync(fullPath).length > 5) {
          console.log('  ...');
        }
      } catch (err) {
        console.log('  (inaccessible)');
      }
      console.log('');
    }
  });
}

function showRecentFiles(count = 10) {
  const files = [];

  function collectFiles(dir, relativePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(entry => {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') return;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          files.push({
            name: entry.name,
            path: relPath,
            fullPath,
            mtime: stats.mtime
          });
        } else if (entry.isDirectory()) {
          collectFiles(fullPath, relPath);
        }
      });
    } catch (err) {
      // Skip inaccessible directories
    }
  }

  collectFiles(WORKSPACE_ROOT);

  // Sort by modification time, most recent first
  files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  console.log(`${count} most recently modified files:`);
  files.slice(0, count).forEach((file, index) => {
    const timeAgo = formatTimeAgo(file.mtime);
    console.log(`${index + 1:2}. ${file.path} (${timeAgo})`);
  });
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Main command handling
const [,, command, ...args] = process.argv;

switch (command) {
  case 'list':
    listFiles(args[0]);
    break;
  case 'find':
    findFiles(args[0]);
    break;
  case 'open':
    showFullPath(args[0]);
    break;
  case 'structure':
    showStructure();
    break;
  case 'recent':
    showRecentFiles(parseInt(args[0]) || 10);
    break;
  case 'help':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}