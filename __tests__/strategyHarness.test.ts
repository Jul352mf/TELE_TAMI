import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getStrategyConfig,
  shouldUseIncrementalMode,
  getConfirmationIntensity,
  getEmailTemplateVersion,
  shouldSendLiveEmails,
  getStrategyPromptModifications,
  recordExperimentMetric,
  finalizeExperimentMetrics
} from '@/lib/strategyHarness';

describe('Strategy Harness', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Strategy A (Baseline)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_LEAD_STRATEGY = 'A';
    });

    it('should configure baseline strategy correctly', () => {
      const config = getStrategyConfig();
      expect(config.strategy).toBe('A');
      expect(config.confirmationIntensity).toBe('targeted');
      expect(config.emailTemplate).toBe('v1');
      expect(config.incrementalEnabled).toBe(false);
      expect(config.liveEmailsEnabled).toBe(true);
    });

    it('should not use incremental mode', () => {
      expect(shouldUseIncrementalMode()).toBe(false);
    });

    it('should use targeted confirmation', () => {
      expect(getConfirmationIntensity()).toBe('targeted');
    });
  });

  describe('Strategy B (Light Confirmation)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_LEAD_STRATEGY = 'B';
    });

    it('should configure light confirmation strategy', () => {
      const config = getStrategyConfig();
      expect(config.strategy).toBe('B');
      expect(config.confirmationIntensity).toBe('light');
      expect(config.emailTemplate).toBe('v2');
    });

    it('should return light confirmation intensity', () => {
      expect(getConfirmationIntensity()).toBe('light');
    });

    it('should use v2 email template', () => {
      expect(getEmailTemplateVersion()).toBe('v2');
    });
  });

  describe('Strategy C (Incremental)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_LEAD_STRATEGY = 'C';
    });

    it('should enable incremental mode', () => {
      expect(shouldUseIncrementalMode()).toBe(true);
    });

    it('should configure incremental strategy', () => {
      const config = getStrategyConfig();
      expect(config.incrementalEnabled).toBe(true);
      expect(config.confirmationIntensity).toBe('light');
    });
  });

  describe('Strategy E (Experimental)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_LEAD_STRATEGY = 'E';
    });

    it('should disable live emails', () => {
      expect(shouldSendLiveEmails()).toBe(false);
    });

    it('should enable incremental mode', () => {
      expect(shouldUseIncrementalMode()).toBe(true);
    });
  });

  describe('Prompt modifications', () => {
    it('should return empty modifications for strategy A', () => {
      const modifications = getStrategyPromptModifications('A');
      expect(modifications).toHaveLength(0);
    });

    it('should return confirmation style for strategy B', () => {
      const modifications = getStrategyPromptModifications('B');
      expect(modifications.some(m => m.includes('CONFIRMATION_STYLE'))).toBe(true);
    });

    it('should return incremental mode for strategy C', () => {
      const modifications = getStrategyPromptModifications('C');
      expect(modifications.some(m => m.includes('INCREMENTAL_MODE'))).toBe(true);
    });

    it('should return experimental mode for strategy E', () => {
      const modifications = getStrategyPromptModifications('E');
      expect(modifications.some(m => m.includes('EXPERIMENTAL_MODE'))).toBe(true);
    });
  });

  describe('Override with INCREMENTAL_LEADS flag', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_LEAD_STRATEGY = 'A';
      process.env.NEXT_PUBLIC_INCREMENTAL_LEADS = '1';
    });

    it('should enable incremental mode even for strategy A', () => {
      expect(shouldUseIncrementalMode()).toBe(true);
    });
  });

  describe('Experiment metrics', () => {
    const sessionId = 'test-session-123';

    it('should record and finalize experiment metrics', () => {
      recordExperimentMetric(sessionId, {
        strategy: 'B',
        leadsAttempted: 2,
        leadsCompleted: 1
      });

      recordExperimentMetric(sessionId, {
        sessionDurationMs: 300000,
        abandonment: false
      });

      const metrics = finalizeExperimentMetrics(sessionId);
      
      expect(metrics).toBeDefined();
      expect(metrics!.strategy).toBe('B');
      expect(metrics!.leadsAttempted).toBe(2);
      expect(metrics!.leadsCompleted).toBe(1);
      expect(metrics!.sessionDurationMs).toBe(300000);
      expect(metrics!.abandonment).toBe(false);
    });

    it('should return null for unknown session', () => {
      const metrics = finalizeExperimentMetrics('unknown-session');
      expect(metrics).toBeNull();
    });

    it('should clean up metrics after finalization', () => {
      recordExperimentMetric(sessionId, { strategy: 'A' });
      
      const firstCall = finalizeExperimentMetrics(sessionId);
      expect(firstCall).toBeDefined();
      
      const secondCall = finalizeExperimentMetrics(sessionId);
      expect(secondCall).toBeNull();
    });
  });

  describe('Default fallback', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_LEAD_STRATEGY;
    });

    it('should default to strategy A when no environment variable set', () => {
      const config = getStrategyConfig();
      expect(config.strategy).toBe('A');
    });
  });
});