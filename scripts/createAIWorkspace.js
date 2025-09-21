#!/usr/bin/env node
/**
 * Local AI-native workspace scaffold
 * Creates a development environment optimized for AI-assisted development
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.join(__dirname, '..');
const AI_WORKSPACE_DIR = path.join(WORKSPACE_ROOT, '.ai-workspace');

function createAIWorkspace() {
  console.log('🤖 Creating AI-native workspace scaffold...');
  
  // Create workspace directory
  if (!fs.existsSync(AI_WORKSPACE_DIR)) {
    fs.mkdirSync(AI_WORKSPACE_DIR, { recursive: true });
  }

  // Create automation scripts directory
  const scriptsDir = path.join(AI_WORKSPACE_DIR, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
  }

  // Create analyze prompt script
  createAnalyzePromptScript(scriptsDir);
  
  // Create run experiment script
  createRunExperimentScript(scriptsDir);
  
  // Create export metrics script
  createExportMetricsScript(scriptsDir);
  
  // Create workspace configuration
  createWorkspaceConfig();
  
  // Create AI context files
  createAIContextFiles();
  
  // Create development guides
  createDevelopmentGuides();

  console.log('✅ AI workspace scaffold created successfully!');
  console.log('📁 Location:', AI_WORKSPACE_DIR);
  console.log('');
  console.log('Available commands:');
  console.log('  node .ai-workspace/scripts/analyzePrompt.js [prompt-part]');
  console.log('  node .ai-workspace/scripts/runExperiment.js [strategy] [metrics]');
  console.log('  node .ai-workspace/scripts/exportMetrics.js [format]');
  console.log('');
  console.log('📚 See .ai-workspace/guides/ for development documentation');
}

function createAnalyzePromptScript(scriptsDir) {
  const script = `#!/usr/bin/env node
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
      console.error(\`Prompt part not found: \${partName}\`);
      listAvailableParts(promptPartsDir);
    }
  } else {
    analyzeAllParts(promptPartsDir);
  }
}

function analyzeSpecificPart(filePath, partName) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(\`📄 Analyzing prompt part: \${partName}\`);
  console.log(\`📏 Length: \${content.length} characters\`);
  console.log(\`📝 Lines: \${content.split('\\n').length}\`);
  console.log('');
  
  // Analyze content
  const analysis = {
    wordCount: content.split(/\\s+/).length,
    hasSpecificInstructions: /\\b(MUST|REQUIRED|DO NOT|NEVER)\\b/.test(content),
    hasExamples: /\\b(example|e\\.g\\.|for instance)\\b/i.test(content),
    hasMeasurableGoals: /\\b(complete|success|finished|confirmed)\\b/i.test(content),
    complexityScore: calculateComplexity(content)
  };
  
  console.log('🔍 Analysis Results:');
  console.log(\`   Word count: \${analysis.wordCount}\`);
  console.log(\`   Has specific instructions: \${analysis.hasSpecificInstructions ? '✅' : '❌'}\`);
  console.log(\`   Has examples: \${analysis.hasExamples ? '✅' : '❌'}\`);
  console.log(\`   Has measurable goals: \${analysis.hasMeasurableGoals ? '✅' : '❌'}\`);
  console.log(\`   Complexity score: \${analysis.complexityScore}/10\`);
  
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
    content.split(/\\band\\b|\\bor\\b/i).length, // Conditional statements
    content.match(/\\b[A-Z_]{3,}\\b/g)?.length || 0, // Constants/variables
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
  
  console.log(\`📏 Total prompt length: \${totalLength} characters\`);
  console.log(\`📄 Number of parts: \${manifest.parts.length}\`);
  console.log(\`📊 Average part length: \${Math.round(totalLength / manifest.parts.length)} characters\`);
  console.log('');
  
  // Show parts by complexity
  partAnalysis.sort((a, b) => b.complexity - a.complexity);
  console.log('🔥 Most complex parts:');
  partAnalysis.slice(0, 3).forEach(part => {
    console.log(\`   \${part.id}: complexity \${part.complexity}/10 (\${part.length} chars)\`);
  });
}

function listAvailableParts(promptPartsDir) {
  console.log('');
  console.log('Available prompt parts:');
  const files = fs.readdirSync(promptPartsDir).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    console.log(\`  \${file.replace('.md', '')}\`);
  });
}

if (require.main === module) {
  analyzePrompt(promptPart);
}
`;

  fs.writeFileSync(path.join(scriptsDir, 'analyzePrompt.js'), script);
  fs.chmodSync(path.join(scriptsDir, 'analyzePrompt.js'), '755');
}

function createRunExperimentScript(scriptsDir) {
  const script = `#!/usr/bin/env node
/**
 * Run strategy experiments and collect metrics
 */

const fs = require('fs');
const path = require('path');

const [,, strategy, metricsType, ...options] = process.argv;

function runExperiment(strategy, metricsType) {
  console.log(\`🧪 Running experiment with strategy: \${strategy || 'A'}\`);
  
  const strategies = ['A', 'B', 'C', 'D', 'E'];
  const selectedStrategy = strategy || 'A';
  
  if (!strategies.includes(selectedStrategy)) {
    console.error(\`Invalid strategy: \${selectedStrategy}\`);
    console.log('Available strategies:', strategies.join(', '));
    return;
  }
  
  // Set environment variable for strategy
  process.env.NEXT_PUBLIC_LEAD_STRATEGY = selectedStrategy;
  
  console.log(\`📊 Metrics type: \${metricsType || 'basic'}\`);
  console.log('');
  
  // Simulate experiment setup
  const experiment = {
    id: \`exp_\${Date.now()}\`,
    strategy: selectedStrategy,
    startTime: new Date().toISOString(),
    metrics: initializeMetrics(metricsType),
    config: getStrategyConfig(selectedStrategy)
  };
  
  console.log('⚙️  Experiment Configuration:');
  console.log(\`   ID: \${experiment.id}\`);
  console.log(\`   Strategy: \${experiment.strategy}\`);
  console.log(\`   Incremental: \${experiment.config.incrementalEnabled}\`);
  console.log(\`   Confirmation: \${experiment.config.confirmationIntensity}\`);
  console.log(\`   Email Template: \${experiment.config.emailTemplate}\`);
  console.log('');
  
  // Save experiment config
  saveExperiment(experiment);
  
  console.log('🚀 Experiment started! Use these environment variables:');
  console.log(\`   export NEXT_PUBLIC_LEAD_STRATEGY=\${selectedStrategy}\`);
  console.log('');
  console.log('📈 Monitor metrics with: node .ai-workspace/scripts/exportMetrics.js');
  console.log(\`📁 Experiment data: .ai-workspace/experiments/\${experiment.id}.json\`);
}

function getStrategyConfig(strategy) {
  const configs = {
    A: { incrementalEnabled: false, confirmationIntensity: 'targeted', emailTemplate: 'v1' },
    B: { incrementalEnabled: false, confirmationIntensity: 'light', emailTemplate: 'v2' },
    C: { incrementalEnabled: true, confirmationIntensity: 'light', emailTemplate: 'v1' },
    D: { incrementalEnabled: true, confirmationIntensity: 'targeted', emailTemplate: 'v2' },
    E: { incrementalEnabled: true, confirmationIntensity: 'light', emailTemplate: 'v2' }
  };
  return configs[strategy] || configs.A;
}

function initializeMetrics(type) {
  const baseMetrics = {
    sessionsStarted: 0,
    leadsAttempted: 0,
    leadsCompleted: 0,
    averageSessionDuration: 0,
    abandonment: 0
  };
  
  if (type === 'detailed') {
    return {
      ...baseMetrics,
      confirmationsPerField: {},
      pushbackUsage: 0,
      closingTriggers: {},
      incrementalFragments: 0
    };
  }
  
  return baseMetrics;
}

function saveExperiment(experiment) {
  const experimentsDir = path.join(__dirname, '..', 'experiments');
  if (!fs.existsSync(experimentsDir)) {
    fs.mkdirSync(experimentsDir, { recursive: true });
  }
  
  const filePath = path.join(experimentsDir, \`\${experiment.id}.json\`);
  fs.writeFileSync(filePath, JSON.stringify(experiment, null, 2));
}

if (require.main === module) {
  runExperiment(strategy, metricsType);
}
`;

  fs.writeFileSync(path.join(scriptsDir, 'runExperiment.js'), script);
  fs.chmodSync(path.join(scriptsDir, 'runExperiment.js'), '755');
}

function createExportMetricsScript(scriptsDir) {
  const script = `#!/usr/bin/env node
/**
 * Export metrics in various formats
 */

const fs = require('fs');
const path = require('path');

const [,, format, ...options] = process.argv;

function exportMetrics(format) {
  console.log(\`📊 Exporting metrics in \${format || 'json'} format...\`);
  
  const experimentsDir = path.join(__dirname, '..', 'experiments');
  if (!fs.existsSync(experimentsDir)) {
    console.log('No experiments found. Run an experiment first.');
    return;
  }
  
  const experimentFiles = fs.readdirSync(experimentsDir).filter(f => f.endsWith('.json'));
  const experiments = experimentFiles.map(file => {
    return JSON.parse(fs.readFileSync(path.join(experimentsDir, file), 'utf8'));
  });
  
  if (experiments.length === 0) {
    console.log('No experiment data found.');
    return;
  }
  
  switch (format) {
    case 'csv':
      exportCSV(experiments);
      break;
    case 'markdown':
    case 'md':
      exportMarkdown(experiments);
      break;
    case 'summary':
      exportSummary(experiments);
      break;
    default:
      exportJSON(experiments);
  }
}

function exportJSON(experiments) {
  const output = {
    exportedAt: new Date().toISOString(),
    totalExperiments: experiments.length,
    experiments: experiments
  };
  
  const filePath = path.join(__dirname, '..', \`metrics_export_\${Date.now()}.json\`);
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(\`✅ JSON export saved to: \${filePath}\`);
}

function exportCSV(experiments) {
  const headers = ['id', 'strategy', 'startTime', 'sessionsStarted', 'leadsCompleted', 'abandonment'];
  const rows = experiments.map(exp => [
    exp.id,
    exp.strategy,
    exp.startTime,
    exp.metrics.sessionsStarted || 0,
    exp.metrics.leadsCompleted || 0,
    exp.metrics.abandonment || 0
  ]);
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\\n');
  const filePath = path.join(__dirname, '..', \`metrics_export_\${Date.now()}.csv\`);
  fs.writeFileSync(filePath, csv);
  console.log(\`✅ CSV export saved to: \${filePath}\`);
}

function exportMarkdown(experiments) {
  let markdown = '# Experiment Metrics Report\\n\\n';
  markdown += \`Generated: \${new Date().toISOString()}\\n\\n\`;
  markdown += \`Total experiments: \${experiments.length}\\n\\n\`;
  
  markdown += '## Summary\\n\\n';
  markdown += '| Strategy | Experiments | Avg Completion | Avg Abandonment |\\n';
  markdown += '|----------|-------------|---------------|------------------|\\n';
  
  const strategies = ['A', 'B', 'C', 'D', 'E'];
  strategies.forEach(strategy => {
    const strategyExps = experiments.filter(exp => exp.strategy === strategy);
    if (strategyExps.length > 0) {
      const avgCompletion = strategyExps.reduce((sum, exp) => sum + (exp.metrics.leadsCompleted || 0), 0) / strategyExps.length;
      const avgAbandonment = strategyExps.reduce((sum, exp) => sum + (exp.metrics.abandonment || 0), 0) / strategyExps.length;
      markdown += \`| \${strategy} | \${strategyExps.length} | \${avgCompletion.toFixed(2)} | \${avgAbandonment.toFixed(2)}% |\\n\`;
    }
  });
  
  markdown += '\\n## Detailed Results\\n\\n';
  experiments.forEach(exp => {
    markdown += \`### \${exp.id} (Strategy \${exp.strategy})\\n\\n\`;
    markdown += \`- Start: \${exp.startTime}\\n\`;
    markdown += \`- Configuration: \${JSON.stringify(exp.config)}\\n\`;
    markdown += \`- Metrics: \${JSON.stringify(exp.metrics)}\\n\\n\`;
  });
  
  const filePath = path.join(__dirname, '..', \`metrics_report_\${Date.now()}.md\`);
  fs.writeFileSync(filePath, markdown);
  console.log(\`✅ Markdown report saved to: \${filePath}\`);
}

function exportSummary(experiments) {
  console.log('📊 Experiment Summary');
  console.log('====================');
  console.log(\`Total experiments: \${experiments.length}\`);
  console.log('');
  
  const strategies = ['A', 'B', 'C', 'D', 'E'];
  strategies.forEach(strategy => {
    const strategyExps = experiments.filter(exp => exp.strategy === strategy);
    if (strategyExps.length > 0) {
      console.log(\`Strategy \${strategy}: \${strategyExps.length} experiment(s)\`);
      const avgCompletion = strategyExps.reduce((sum, exp) => sum + (exp.metrics.leadsCompleted || 0), 0) / strategyExps.length;
      console.log(\`  Average completion: \${avgCompletion.toFixed(2)} leads\`);
    }
  });
}

if (require.main === module) {
  exportMetrics(format);
}
`;

  fs.writeFileSync(path.join(scriptsDir, 'exportMetrics.js'), script);
  fs.chmodSync(path.join(scriptsDir, 'exportMetrics.js'), '755');
}

function createWorkspaceConfig() {
  const config = {
    version: "1.0.0",
    name: "TELE_TAMI AI Workspace",
    description: "AI-optimized development environment for conversation system",
    features: {
      promptAnalysis: true,
      experimentRunner: true,
      metricsExport: true,
      contextAwareness: true
    },
    scripts: {
      analyzePrompt: "node .ai-workspace/scripts/analyzePrompt.js",
      runExperiment: "node .ai-workspace/scripts/runExperiment.js",
      exportMetrics: "node .ai-workspace/scripts/exportMetrics.js"
    },
    aiContext: {
      primaryLanguage: "TypeScript",
      framework: "Next.js",
      uiLibrary: "Radix UI + Tailwind CSS",
      voiceLibrary: "@humeai/voice-react",
      testFramework: "Jest"
    }
  };

  fs.writeFileSync(
    path.join(AI_WORKSPACE_DIR, 'workspace.json'),
    JSON.stringify(config, null, 2)
  );
}

function createAIContextFiles() {
  const contextDir = path.join(AI_WORKSPACE_DIR, 'context');
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir);
  }

  // Project overview
  const projectOverview = `# TELE_TAMI Project Context

## Purpose
Voice-based AI assistant for commodity trading lead collection and validation.

## Architecture
- **Frontend**: Next.js with React components
- **Voice**: Hume AI EVI integration
- **State**: React Context + localStorage
- **Styling**: Tailwind CSS with Radix UI components
- **Testing**: Jest with TypeScript

## Key Components
- \`lib/conversationState.ts\`: Manages conversation flow and closing triggers
- \`lib/strategyHarness.ts\`: A-E experiment strategy management
- \`lib/incrementalJson.ts\`: Fragment-based JSON accumulation
- \`components/SessionTimers.tsx\`: Timeout and inactivity management
- \`utils/telemetry.ts\`: Event tracking and metrics

## Development Guidelines
1. Maintain minimal, surgical changes
2. Preserve backward compatibility
3. Use TypeScript for type safety
4. Follow existing component patterns
5. Add telemetry for new features
6. Test conversation logic thoroughly

## Common Patterns
- Use \`emit()\` for telemetry events
- Store temporary state in localStorage
- Implement cooldowns for user-facing features
- Use environment flags for experiments
- Follow accessibility best practices
`;

  fs.writeFileSync(path.join(contextDir, 'project-overview.md'), projectOverview);

  // Component patterns
  const componentPatterns = `# Component Patterns

## State Management
\`\`\`typescript
// Use local state with persistence
const [value, setValue] = useState(defaultValue);

useEffect(() => {
  // Load from localStorage
  const saved = localStorage.getItem('key');
  if (saved) setValue(JSON.parse(saved));
}, []);

useEffect(() => {
  // Save to localStorage
  localStorage.setItem('key', JSON.stringify(value));
}, [value]);
\`\`\`

## Telemetry Integration
\`\`\`typescript
import { emit } from '@/utils/telemetry';

// Emit events for user actions
const handleAction = () => {
  emit({ type: 'action_performed', context: 'specific' });
};
\`\`\`

## Accessibility
\`\`\`typescript
// Always include ARIA labels
<button 
  aria-label="Descriptive action"
  aria-describedby="help-text"
>
  Action
</button>
\`\`\`

## Conditional Features
\`\`\`typescript
// Use environment flags
const isFeatureEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG === '1';

if (isFeatureEnabled) {
  // Feature implementation
}
\`\`\`
`;

  fs.writeFileSync(path.join(contextDir, 'component-patterns.md'), componentPatterns);
}

function createDevelopmentGuides() {
  const guidesDir = path.join(AI_WORKSPACE_DIR, 'guides');
  if (!fs.existsSync(guidesDir)) {
    fs.mkdirSync(guidesDir);
  }

  // AI prompting guide
  const aiPromptingGuide = `# AI-Assisted Development Guide

## Effective Prompting for TELE_TAMI

### Context Setting
Always provide context about:
1. The component you're working on
2. The conversation flow state
3. Existing patterns to follow
4. Telemetry requirements

### Example Prompts

#### Feature Development
"I need to add a new UI component for [feature]. It should follow the existing pattern in [similar component], include telemetry events, and maintain accessibility standards. The component should integrate with the conversation state management."

#### Bug Fixing
"There's an issue with [specific behavior]. The expected behavior is [description]. Here's the current implementation: [code]. Please suggest a minimal fix that maintains backward compatibility."

#### Testing
"I need comprehensive tests for [component/function]. It should cover [scenarios] and follow the existing test patterns in the __tests__ directory."

### Best Practices
1. **Be Specific**: Mention exact file names and functions
2. **Provide Context**: Include relevant existing code
3. **State Constraints**: Mention minimal changes requirement
4. **Include Examples**: Reference similar implementations
5. **Specify Standards**: Mention accessibility, telemetry needs

### Code Review Prompts
"Review this code for:
- TypeScript best practices
- Accessibility compliance
- Telemetry integration
- Performance considerations
- Testing coverage"
`;

  fs.writeFileSync(path.join(guidesDir, 'ai-prompting.md'), aiPromptingGuide);

  // Testing guide
  const testingGuide = `# Testing Guide

## Test Structure
Follow existing patterns in \`__tests__/\` directory:

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Component interactions
3. **E2E Tests**: Full conversation flows

## Key Test Areas
- Conversation state transitions
- Strategy harness configurations
- Closing trigger detection
- Telemetry event emission
- Accessibility compliance

## Test Patterns
\`\`\`typescript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle expected behavior', () => {
    // Test implementation
  });

  it('should handle edge cases', () => {
    // Edge case testing
  });
});
\`\`\`

## Mock Patterns
\`\`\`typescript
// Mock environment variables
process.env.NEXT_PUBLIC_FEATURE = 'test-value';

// Mock localStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockStorage });
\`\`\`
`;

  fs.writeFileSync(path.join(guidesDir, 'testing.md'), testingGuide);
}

if (require.main === module) {
  createAIWorkspace();
}