#!/usr/bin/env node
/**
 * Configs.md verification report script
 * Scans code for environment variable usage vs documentation
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const CONFIGS_PATH = path.join(WORKSPACE_ROOT, 'docs', 'SETUP_GUIDE.md'); // Assuming configs are documented here
const SCAN_DIRS = ['lib', 'app', 'components', 'utils', 'functions'];
const ENV_PATTERN = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

function scanForEnvVars() {
  const envVars = new Set();
  const usageMap = new Map(); // var -> [file paths]

  function scanFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let match;
      
      while ((match = ENV_PATTERN.exec(content)) !== null) {
        const varName = match[1];
        envVars.add(varName);
        
        if (!usageMap.has(varName)) {
          usageMap.set(varName, []);
        }
        usageMap.get(varName).push(relativePath);
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  function scanDirectory(dir, relativePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') return;
        
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
          scanFile(fullPath, relPath);
        } else if (entry.isDirectory()) {
          scanDirectory(fullPath, relPath);
        }
      });
    } catch (err) {
      console.warn(`Warning: Could not scan directory ${dir}`);
    }
  }

  // Scan each target directory
  SCAN_DIRS.forEach(dir => {
    const fullDir = path.join(WORKSPACE_ROOT, dir);
    if (fs.existsSync(fullDir)) {
      scanDirectory(fullDir, dir);
    }
  });

  return { envVars: Array.from(envVars).sort(), usageMap };
}

function scanDocsForEnvVars() {
  const documentedVars = new Set();
  
  // Check multiple potential documentation files
  const docFiles = [
    'docs/SETUP_GUIDE.md',
    'README.md',
    '.env.example',
    'docs/configs.md',
    'docs/CONFIGS.md'
  ];

  docFiles.forEach(docFile => {
    const fullPath = path.join(WORKSPACE_ROOT, docFile);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Look for environment variables in documentation
        const patterns = [
          /NEXT_PUBLIC_[A-Z_][A-Z0-9_]*/g,
          /\b[A-Z_][A-Z0-9_]*(?=\s*=)/g, // .env style
          /`([A-Z_][A-Z0-9_]*)`/g, // backtick wrapped
          /process\.env\.([A-Z_][A-Z0-9_]*)/g // code examples
        ];

        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const varName = match[1] || match[0];
            if (varName.length > 2) { // Avoid false positives like "A" or "ID"
              documentedVars.add(varName.replace(/^process\.env\./, ''));
            }
          }
        });

        console.log(`Scanned ${docFile}: found ${documentedVars.size} documented variables`);
      } catch (err) {
        console.warn(`Warning: Could not read ${docFile}`);
      }
    }
  });

  return Array.from(documentedVars).sort();
}

function generateReport() {
  console.log('Environment Variable Verification Report');
  console.log('=======================================');
  console.log('');

  const { envVars, usageMap } = scanForEnvVars();
  const documentedVars = scanDocsForEnvVars();

  console.log(`Found ${envVars.length} environment variables in code`);
  console.log(`Found ${documentedVars.length} environment variables in documentation`);
  console.log('');

  // Find gaps
  const undocumented = envVars.filter(v => !documentedVars.includes(v));
  const unused = documentedVars.filter(v => !envVars.includes(v));

  // Report undocumented variables
  if (undocumented.length > 0) {
    console.log('🚨 UNDOCUMENTED VARIABLES (used in code but not documented):');
    undocumented.forEach(varName => {
      const files = usageMap.get(varName) || [];
      console.log(`  • ${varName}`);
      files.forEach(file => {
        console.log(`    - ${file}`);
      });
    });
    console.log('');
  }

  // Report unused documented variables
  if (unused.length > 0) {
    console.log('⚠️  POTENTIALLY UNUSED VARIABLES (documented but not found in code):');
    unused.forEach(varName => {
      console.log(`  • ${varName}`);
    });
    console.log('');
  }

  // Report all variables with their usage
  console.log('📋 ALL ENVIRONMENT VARIABLES:');
  console.log('');

  const allVars = [...new Set([...envVars, ...documentedVars])].sort();
  allVars.forEach(varName => {
    const isUsed = envVars.includes(varName);
    const isDocumented = documentedVars.includes(varName);
    const files = usageMap.get(varName) || [];
    
    let status = '';
    if (isUsed && isDocumented) status = '✅';
    else if (isUsed && !isDocumented) status = '🚨';
    else if (!isUsed && isDocumented) status = '⚠️';
    else status = '❓';

    console.log(`${status} ${varName}`);
    if (files.length > 0) {
      files.forEach(file => {
        console.log(`    📄 ${file}`);
      });
    }
    if (!isDocumented && isUsed) {
      console.log(`    📝 Action: Add to documentation`);
    }
    if (isDocumented && !isUsed) {
      console.log(`    🔍 Action: Verify if still needed`);
    }
  });

  console.log('');
  console.log('Legend:');
  console.log('✅ Used and documented');
  console.log('🚨 Used but not documented');
  console.log('⚠️  Documented but not used');
  console.log('❓ Other status');
  console.log('');

  // Summary
  const criticalIssues = undocumented.length;
  const warnings = unused.length;
  
  console.log('SUMMARY:');
  console.log(`${criticalIssues} critical issue(s) (undocumented variables)`);
  console.log(`${warnings} warning(s) (potentially unused variables)`);
  
  if (criticalIssues > 0) {
    console.log('');
    console.log('Recommended actions:');
    undocumented.forEach(varName => {
      console.log(`1. Document ${varName} in appropriate configuration file`);
    });
  }

  return { criticalIssues, warnings, undocumented, unused };
}

function generateMarkdownReport() {
  const { envVars, usageMap } = scanForEnvVars();
  const documentedVars = scanDocsForEnvVars();
  const undocumented = envVars.filter(v => !documentedVars.includes(v));
  const unused = documentedVars.filter(v => !envVars.includes(v));

  let markdown = '# Environment Variable Gap Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  
  markdown += '## Summary\n\n';
  markdown += `- **${envVars.length}** variables found in code\n`;
  markdown += `- **${documentedVars.length}** variables documented\n`;
  markdown += `- **${undocumented.length}** undocumented variables ⚠️\n`;
  markdown += `- **${unused.length}** potentially unused variables\n\n`;

  if (undocumented.length > 0) {
    markdown += '## Undocumented Variables\n\n';
    markdown += 'These variables are used in code but not documented:\n\n';
    undocumented.forEach(varName => {
      const files = usageMap.get(varName) || [];
      markdown += `### \`${varName}\`\n\n`;
      markdown += 'Used in:\n';
      files.forEach(file => {
        markdown += `- \`${file}\`\n`;
      });
      markdown += '\n';
    });
  }

  if (unused.length > 0) {
    markdown += '## Potentially Unused Variables\n\n';
    markdown += 'These variables are documented but not found in code:\n\n';
    unused.forEach(varName => {
      markdown += `- \`${varName}\`\n`;
    });
    markdown += '\n';
  }

  return markdown;
}

// CLI interface
const [,, command, ...args] = process.argv;

if (command === 'markdown' || command === 'md') {
  const markdown = generateMarkdownReport();
  const outputFile = args[0] || 'environment-gap-report.md';
  fs.writeFileSync(outputFile, markdown);
  console.log(`Markdown report written to ${outputFile}`);
} else if (command === 'help') {
  console.log('Usage:');
  console.log('  node scripts/verifyConfigs.js          - Generate console report');
  console.log('  node scripts/verifyConfigs.js md [file] - Generate markdown report');
} else {
  generateReport();
}