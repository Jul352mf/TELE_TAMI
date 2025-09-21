#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const compiledPath = path.join(__dirname, '..', 'generated', 'compiledPrompt.txt');
if (!fs.existsSync(compiledPath)) {
  console.error('compiledPrompt.txt not found. Run build:prompt first.');
  process.exit(1);
}
const content = fs.readFileSync(compiledPath, 'utf8');

// Extended forbidden phrases including AI disclaimers and unnecessary qualifiers
const forbidden = [
  /\bPLEASE NOTE\b/i,
  /\bAS AN AI\b/i,
  /\bI AM JUST AN ASSISTANT\b/i,
  /\bI'M JUST AN AI\b/i,
  /\bI AM AN AI LANGUAGE MODEL\b/i,
  /\bI DON'T ACTUALLY\b/i,
  /\bI CAN'T REALLY\b/i,
  /\bTO BE HONEST\b/i,
  /\bIF I'M BEING COMPLETELY HONEST\b/i,
  /\bI SHOULD MENTION\b/i,
  /\bI MUST SAY\b/i,
  /\bIT'S WORTH NOTING\b/i,
  /\bI THINK IT'S IMPORTANT TO MENTION\b/i
];

const issues = [];

// Check forbidden phrases
forbidden.forEach(re => {
  if (re.test(content)) issues.push(`Forbidden phrase matched: ${re}`);
});

// Check line length (max 220 chars, excluding HTML templates)
const lines = content.split(/\r?\n/);
lines.forEach((line, index) => {
  const lineNumber = index + 1;
  if (line.length > 220 && !line.includes('<') && !line.includes('>')) {
    issues.push(`Line ${lineNumber} exceeds 220 characters (${line.length}): "${line.slice(0, 80)}..."`);
  }
});

// Repetition: flag if any line appears >2 times (excluding blank & markdown headers)
const lineCounts = {};
lines.forEach(line => {
  const norm = line.trim();
  if (!norm || norm.startsWith('#')) return;
  lineCounts[norm] = (lineCounts[norm] || 0) + 1;
});
Object.entries(lineCounts).forEach(([line, count]) => {
  if (count > 2) issues.push(`Line repeated ${count} times: "${line.slice(0,80)}"`);
});

// Check for repeated numeric confirmations (heuristic)
const confirmationPatterns = [
  /confirm.*\d+/gi,
  /\d+.*correct/gi,
  /verify.*\d+/gi
];

let confirmationCount = 0;
confirmationPatterns.forEach(pattern => {
  const matches = content.match(pattern) || [];
  confirmationCount += matches.length;
});

if (confirmationCount > 3) {
  issues.push(`Too many numeric confirmation patterns detected (${confirmationCount}). Consider consolidating.`);
}

// Check for banned phrases that indicate poor conversation flow
const bannedPhrases = [
  /can you confirm this is correct/gi,
  /let me just double.?check/gi,
  /I want to make sure I have this right/gi
];

bannedPhrases.forEach(pattern => {
  if (pattern.test(content)) {
    issues.push(`Banned conversational phrase detected: ${pattern.source}`);
  }
});

if (issues.length) {
  console.error('Prompt lint failed:\n' + issues.map(i => ' - ' + i).join('\n'));
  process.exit(2);
}
console.log('Prompt lint passed.');
