#!/usr/bin/env node
/**
 * Run strategy experiments and collect metrics
 */

const fs = require('fs');
const path = require('path');

const [,, strategy, metricsType, ...options] = process.argv;

function runExperiment(strategy, metricsType) {
  console.log(`🧪 Running experiment with strategy: ${strategy || 'A'}`);
  
  const strategies = ['A', 'B', 'C', 'D', 'E'];
  const selectedStrategy = strategy || 'A';
  
  if (!strategies.includes(selectedStrategy)) {
    console.error(`Invalid strategy: ${selectedStrategy}`);
    console.log('Available strategies:', strategies.join(', '));
    return;
  }
  
  // Set environment variable for strategy
  process.env.NEXT_PUBLIC_LEAD_STRATEGY = selectedStrategy;
  
  console.log(`📊 Metrics type: ${metricsType || 'basic'}`);
  console.log('');
  
  // Simulate experiment setup
  const experiment = {
    id: `exp_${Date.now()}`,
    strategy: selectedStrategy,
    startTime: new Date().toISOString(),
    metrics: initializeMetrics(metricsType),
    config: getStrategyConfig(selectedStrategy)
  };
  
  console.log('⚙️  Experiment Configuration:');
  console.log(`   ID: ${experiment.id}`);
  console.log(`   Strategy: ${experiment.strategy}`);
  console.log(`   Incremental: ${experiment.config.incrementalEnabled}`);
  console.log(`   Confirmation: ${experiment.config.confirmationIntensity}`);
  console.log(`   Email Template: ${experiment.config.emailTemplate}`);
  console.log('');
  
  // Save experiment config
  saveExperiment(experiment);
  
  console.log('🚀 Experiment started! Use these environment variables:');
  console.log(`   export NEXT_PUBLIC_LEAD_STRATEGY=${selectedStrategy}`);
  console.log('');
  console.log('📈 Monitor metrics with: node .ai-workspace/scripts/exportMetrics.js');
  console.log(`📁 Experiment data: .ai-workspace/experiments/${experiment.id}.json`);
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
  
  const filePath = path.join(experimentsDir, `${experiment.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(experiment, null, 2));
}

if (require.main === module) {
  runExperiment(strategy, metricsType);
}
