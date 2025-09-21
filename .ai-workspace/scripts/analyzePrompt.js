#!/usr/bin/env node
/**
 * Analyze prompt effectiveness and suggest improvements
 */

const fs = require('fs');
const path = require('path');

const [,, promptPart, ...options] = process.argv;

function analyzePrompt(partName) {
  const promptPartsDir = path.join(__dirname, '..', '..', 'prompt_parts');
  
  if (partName) {
    const partFile = path.join(promptPartsDir, partName + '.md');
    if (fs.existsSync(partFile)) {
      analyzeSpecificPart(partFile, partName);
    } else {
      console.error(`Prompt part not found: ${partName}`);
      listAvailableParts(promptPartsDir);
    }
  } else {
    analyzeAllParts(promptPartsDir);
  }
}

function analyzeSpecificPart(filePath, partName) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`📄 Analyzing prompt part: ${partName}`);
  console.log(`📏 Length: ${content.length} characters`);
  console.log(`📝 Lines: ${content.split('\n').length}`);
  console.log('');
  
  // Analyze content
  const analysis = {
    wordCount: content.split(/\s+/).length,
    hasSpecificInstructions: /\b(MUST|REQUIRED|DO NOT|NEVER)\b/.test(content),
    hasExamples: /\b(example|e\.g\.|for instance)\b/i.test(content),
    hasMeasurableGoals: /\b(complete|success|finished|confirmed)\b/i.test(content),
    complexityScore: calculateComplexity(content)
  };
  
  console.log('🔍 Analysis Results:');
  console.log(`   Word count: ${analysis.wordCount}`);
  console.log(`   Has specific instructions: ${analysis.hasSpecificInstructions ? '✅' : '❌'}`);
  console.log(`   Has examples: ${analysis.hasExamples ? '✅' : '❌'}`);
  console.log(`   Has measurable goals: ${analysis.hasMeasurableGoals ? '✅' : '❌'}`);
  console.log(`   Complexity score: ${analysis.complexityScore}/10`);
  
  // Suggestions
  console.log('');
  console.log('💡 Suggestions:');
  if (!analysis.hasSpecificInstructions) {
    console.log('   - Consider adding specific instructions (MUST, REQUIRED, DO NOT)');
  }
  if (!analysis.hasExamples) {
    console.log('   - Consider adding concrete examples');
  }
  if (analysis.complexityScore > 7) {
    console.log('   - Consider breaking into smaller, focused parts');
  }
  if (analysis.wordCount > 100) {
    console.log('   - Consider condensing for better model comprehension');
  }
}

function calculateComplexity(content) {
  const factors = [
    content.split(/[.!?]/).length, // Sentence count
    content.split(/\band\b|\bor\b/i).length, // Conditional statements
    content.match(/\b[A-Z_]{3,}\b/g)?.length || 0, // Constants/variables
    content.split(/[,;]/).length // Clause complexity
  ];
  
  return Math.min(10, Math.round(factors.reduce((a, b) => a + b, 0) / 4));
}

function analyzeAllParts(promptPartsDir) {
  console.log('📊 Analyzing all prompt parts...');
  
  const manifest = JSON.parse(fs.readFileSync(path.join(promptPartsDir, 'manifest.json'), 'utf8'));
  let totalLength = 0;
  let partAnalysis = [];
  
  manifest.parts.forEach(part => {
    const filePath = path.join(promptPartsDir, part.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      totalLength += content.length;
      partAnalysis.push({
        id: part.id,
        length: content.length,
        complexity: calculateComplexity(content)
      });
    }
  });
  
  console.log(`📏 Total prompt length: ${totalLength} characters`);
  console.log(`📄 Number of parts: ${manifest.parts.length}`);
  console.log(`📊 Average part length: ${Math.round(totalLength / manifest.parts.length)} characters`);
  console.log('');
  
  // Show parts by complexity
  partAnalysis.sort((a, b) => b.complexity - a.complexity);
  console.log('🔥 Most complex parts:');
  partAnalysis.slice(0, 3).forEach(part => {
    console.log(`   ${part.id}: complexity ${part.complexity}/10 (${part.length} chars)`);
  });
}

function listAvailableParts(promptPartsDir) {
  console.log('');
  console.log('Available prompt parts:');
  const files = fs.readdirSync(promptPartsDir).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    console.log(`  ${file.replace('.md', '')}`);
  });
}

if (require.main === module) {
  analyzePrompt(promptPart);
}
