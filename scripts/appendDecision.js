#!/usr/bin/env node
/**
 * Decision log auto-append helper script
 * Usage: node scripts/appendDecision.js [area] [hypothesis] [variants] [metrics] [result] [decision] [followUp]
 */

const fs = require('fs');
const path = require('path');

const DECISION_LOG_PATH = path.join(__dirname, '..', 'docs', 'decision-log.md');

function getDateUTC() {
  return new Date().toISOString().split('T')[0];
}

function appendDecision(area, hypothesis, variants, metrics, result, decision, followUp) {
  // Read current decision log
  let content = '';
  if (fs.existsSync(DECISION_LOG_PATH)) {
    content = fs.readFileSync(DECISION_LOG_PATH, 'utf8');
  }

  // Find the table and append new row
  const lines = content.split('\n');
  let tableEndIndex = -1;
  
  // Find the end of the existing table
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|') && lines[i].includes('|')) {
      tableEndIndex = i;
    }
  }

  if (tableEndIndex === -1) {
    console.error('Could not find decision log table. Please check the format.');
    process.exit(1);
  }

  // Create new row
  const newRow = `| ${getDateUTC()} | ${area} | ${hypothesis} | ${variants} | ${metrics} | ${result} | ${decision} | ${followUp} |`;
  
  // Insert the new row after the last table row
  lines.splice(tableEndIndex + 1, 0, newRow);
  
  // Write back to file
  fs.writeFileSync(DECISION_LOG_PATH, lines.join('\n'));
  console.log(`Decision appended to ${DECISION_LOG_PATH}`);
}

// Interactive mode if no arguments provided
if (process.argv.length === 2) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Decision Log Entry - Interactive Mode');
  console.log('=====================================');
  
  const questions = [
    'Area (e.g., prompt, UX, strategy): ',
    'Hypothesis: ',
    'Variant(s) (e.g., A vs B, v1 vs v2): ',
    'Metric(s): ',
    'Result (pending/completed): ',
    'Decision (adopt/revert/modify): ',
    'Follow-up: '
  ];
  
  const answers = [];
  let currentQuestion = 0;

  function askQuestion() {
    if (currentQuestion < questions.length) {
      rl.question(questions[currentQuestion], (answer) => {
        answers.push(answer.trim());
        currentQuestion++;
        askQuestion();
      });
    } else {
      rl.close();
      appendDecision(...answers);
    }
  }

  askQuestion();
} else if (process.argv.length === 9) {
  // Command line mode
  const [, , area, hypothesis, variants, metrics, result, decision, followUp] = process.argv;
  appendDecision(area, hypothesis, variants, metrics, result, decision, followUp);
} else {
  console.log('Usage:');
  console.log('  Interactive: node scripts/appendDecision.js');
  console.log('  Direct: node scripts/appendDecision.js [area] [hypothesis] [variants] [metrics] [result] [decision] [followUp]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/appendDecision.js "prompt" "Strategy A vs B improves completion" "A vs B" "completion rate" "pending" "test A" "monitor for 1 week"');
}