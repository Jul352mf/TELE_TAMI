/**
 * Strategy harness for A-E experiment management
 */

import { emit } from '@/utils/telemetry';

export type LeadStrategy = 'A' | 'B' | 'C' | 'D' | 'E';

export interface StrategyConfig {
  strategy: LeadStrategy;
  confirmationIntensity: 'light' | 'targeted';
  emailTemplate: 'v1' | 'v2';
  incrementalEnabled: boolean;
  liveEmailsEnabled: boolean;
}

/**
 * Get strategy configuration from environment flags
 */
export function getStrategyConfig(): StrategyConfig {
  const strategy = (process.env.NEXT_PUBLIC_LEAD_STRATEGY as LeadStrategy) || 'A';
  
  let config: StrategyConfig;
  
  switch (strategy) {
    case 'A':
      // Baseline: traditional single-shot lead capture
      config = {
        strategy: 'A',
        confirmationIntensity: 'targeted',
        emailTemplate: 'v1',
        incrementalEnabled: false,
        liveEmailsEnabled: true
      };
      break;
      
    case 'B':
      // Light confirmation with v2 template
      config = {
        strategy: 'B',
        confirmationIntensity: 'light',
        emailTemplate: 'v2',
        incrementalEnabled: false,
        liveEmailsEnabled: true
      };
      break;
      
    case 'C':
      // Incremental capture with light confirmation
      config = {
        strategy: 'C',
        confirmationIntensity: 'light',
        emailTemplate: 'v1',
        incrementalEnabled: true,
        liveEmailsEnabled: true
      };
      break;
      
    case 'D':
      // Full incremental with v2 template
      config = {
        strategy: 'D',
        confirmationIntensity: 'targeted',
        emailTemplate: 'v2',
        incrementalEnabled: true,
        liveEmailsEnabled: true
      };
      break;
      
    case 'E':
      // Experimental: incremental JSON with no live emails
      config = {
        strategy: 'E',
        confirmationIntensity: 'light',
        emailTemplate: 'v2',
        incrementalEnabled: true,
        liveEmailsEnabled: false
      };
      break;
      
    default:
      config = {
        strategy: 'A',
        confirmationIntensity: 'targeted',
        emailTemplate: 'v1',
        incrementalEnabled: false,
        liveEmailsEnabled: true
      };
  }

  // Emit strategy selection for telemetry
  emit({ type: 'strategy_selected', strategy: config.strategy });
  
  return config;
}

/**
 * Check if incremental mode should be enabled based on strategy
 */
export function shouldUseIncrementalMode(): boolean {
  const config = getStrategyConfig();
  return config.incrementalEnabled || process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1';
}

/**
 * Get confirmation intensity based on strategy
 */
export function getConfirmationIntensity(): 'light' | 'targeted' {
  const config = getStrategyConfig();
  return config.confirmationIntensity;
}

/**
 * Get email template version based on strategy
 */
export function getEmailTemplateVersion(): 'v1' | 'v2' {
  const config = getStrategyConfig();
  return config.emailTemplate;
}

/**
 * Check if live emails should be sent based on strategy
 */
export function shouldSendLiveEmails(): boolean {
  const config = getStrategyConfig();
  return config.liveEmailsEnabled;
}

/**
 * Get strategy-specific prompt modifications
 */
export function getStrategyPromptModifications(strategy: LeadStrategy): string[] {
  const modifications: string[] = [];
  
  switch (strategy) {
    case 'A':
      // Baseline - no modifications
      break;
      
    case 'B':
      modifications.push('CONFIRMATION_STYLE: Use lighter confirmation phrasing. Ask "Does that sound right?" instead of "Can you confirm this is correct?"');
      break;
      
    case 'C':
      modifications.push('INCREMENTAL_MODE: Capture fields one at a time and store in draft. Use tools addOrUpdateLeadField and finalizeLeadDraft.');
      modifications.push('CONFIRMATION_STYLE: Light confirmation style for better flow.');
      break;
      
    case 'D':
      modifications.push('INCREMENTAL_MODE: Capture fields incrementally with targeted confirmation.');
      modifications.push('EMAIL_TEMPLATE: Use enhanced v2 template formatting.');
      break;
      
    case 'E':
      modifications.push('EXPERIMENTAL_MODE: Use JSON fragment accumulation. No live email dispatch.');
      modifications.push('SNIPPET_EXPORT: Build JSON incrementally and flush at intervals.');
      break;
  }
  
  return modifications;
}

/**
 * Record experiment metrics for strategy comparison
 */
export interface ExperimentMetrics {
  strategy: LeadStrategy;
  sessionId: string;
  leadsAttempted: number;
  leadsCompleted: number;
  avgConfirmationsPerField: number;
  sessionDurationMs: number;
  abandonment: boolean;
}

const experimentMetrics = new Map<string, Partial<ExperimentMetrics>>();

export function recordExperimentMetric(sessionId: string, updates: Partial<ExperimentMetrics>) {
  const existing = experimentMetrics.get(sessionId) || {};
  experimentMetrics.set(sessionId, { ...existing, ...updates });
}

export function finalizeExperimentMetrics(sessionId: string): ExperimentMetrics | null {
  const metrics = experimentMetrics.get(sessionId);
  if (!metrics || !metrics.strategy) return null;
  
  experimentMetrics.delete(sessionId);
  return metrics as ExperimentMetrics;
}