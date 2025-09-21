#!/usr/bin/env node
/**
 * Export metrics in various formats
 */

const fs = require('fs');
const path = require('path');

const [,, format, ...options] = process.argv;

function exportMetrics(format) {
  console.log(`📊 Exporting metrics in ${format || 'json'} format...`);
  
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
  
  const filePath = path.join(__dirname, '..', `metrics_export_${Date.now()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  console.log(`✅ JSON export saved to: ${filePath}`);
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
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const filePath = path.join(__dirname, '..', `metrics_export_${Date.now()}.csv`);
  fs.writeFileSync(filePath, csv);
  console.log(`✅ CSV export saved to: ${filePath}`);
}

function exportMarkdown(experiments) {
  let markdown = '# Experiment Metrics Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `Total experiments: ${experiments.length}\n\n`;
  
  markdown += '## Summary\n\n';
  markdown += '| Strategy | Experiments | Avg Completion | Avg Abandonment |\n';
  markdown += '|----------|-------------|---------------|------------------|\n';
  
  const strategies = ['A', 'B', 'C', 'D', 'E'];
  strategies.forEach(strategy => {
    const strategyExps = experiments.filter(exp => exp.strategy === strategy);
    if (strategyExps.length > 0) {
      const avgCompletion = strategyExps.reduce((sum, exp) => sum + (exp.metrics.leadsCompleted || 0), 0) / strategyExps.length;
      const avgAbandonment = strategyExps.reduce((sum, exp) => sum + (exp.metrics.abandonment || 0), 0) / strategyExps.length;
      markdown += `| ${strategy} | ${strategyExps.length} | ${avgCompletion.toFixed(2)} | ${avgAbandonment.toFixed(2)}% |\n`;
    }
  });
  
  markdown += '\n## Detailed Results\n\n';
  experiments.forEach(exp => {
    markdown += `### ${exp.id} (Strategy ${exp.strategy})\n\n`;
    markdown += `- Start: ${exp.startTime}\n`;
    markdown += `- Configuration: ${JSON.stringify(exp.config)}\n`;
    markdown += `- Metrics: ${JSON.stringify(exp.metrics)}\n\n`;
  });
  
  const filePath = path.join(__dirname, '..', `metrics_report_${Date.now()}.md`);
  fs.writeFileSync(filePath, markdown);
  console.log(`✅ Markdown report saved to: ${filePath}`);
}

function exportSummary(experiments) {
  console.log('📊 Experiment Summary');
  console.log('====================');
  console.log(`Total experiments: ${experiments.length}`);
  console.log('');
  
  const strategies = ['A', 'B', 'C', 'D', 'E'];
  strategies.forEach(strategy => {
    const strategyExps = experiments.filter(exp => exp.strategy === strategy);
    if (strategyExps.length > 0) {
      console.log(`Strategy ${strategy}: ${strategyExps.length} experiment(s)`);
      const avgCompletion = strategyExps.reduce((sum, exp) => sum + (exp.metrics.leadsCompleted || 0), 0) / strategyExps.length;
      console.log(`  Average completion: ${avgCompletion.toFixed(2)} leads`);
    }
  });
}

if (require.main === module) {
  exportMetrics(format);
}
