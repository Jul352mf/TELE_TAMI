#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const compiledPath = path.join(__dirname, '..', 'generated', 'compiledPrompt.txt');
if (!fs.existsSync(compiledPath)) {
  console.error('compiledPrompt.txt not found. Run build:prompt first.');
  process.exit(1);
}
const content = fs.readFileSync(compiledPath, 'utf8');

// Forbidden phrases & simple repetition checks
const forbidden = [
  /\bPLEASE NOTE\b/i,
  /\bAS AN AI\b/i,
  /\bI AM JUST AN ASSISTANT\b/i
];

const issues = [];
forbidden.forEach(re => {
  if (re.test(content)) issues.push(`Forbidden phrase matched: ${re}`);
});

// Repetition: flag if any line appears >2 times (excluding blank & markdown headers)
const lineCounts = {};
content.split(/\r?\n/).forEach(line => {
  const norm = line.trim();
  if (!norm || norm.startsWith('#')) return;
  lineCounts[norm] = (lineCounts[norm] || 0) + 1;
});
Object.entries(lineCounts).forEach(([line, count]) => {
  if (count > 2) issues.push(`Line repeated ${count} times: "${line.slice(0,80)}"`);
});

if (issues.length) {
  console.error('Prompt lint failed:\n' + issues.map(i => ' - ' + i).join('\n'));
  process.exit(2);
}
console.log('Prompt lint passed.');
