/**
 * Feature flag snapshot (currently lightly used).
 * NOTE: Not all flags are consumed yet; retained to support upcoming staged
 * strategy unification & runtime gating (see decision-log entry 2025-09-21).
 * When wiring proceeds:
 *  - incrementalLeads merges into strategy-driven gating
 *  - lighterConfirmations derived from strategy confirmationIntensity
 *  - filePrompts remains for fallback to inline prompt (may deprecate later)
 */
export type FeatureFlags = {
  incrementalLeads: boolean;
  filePrompts: boolean;
  leadCaptureStrategy: 'A' | 'B' | 'C' | 'D' | 'E';
  lighterConfirmations: boolean;
};

export function getFeatureFlags(): FeatureFlags {
  return {
    incrementalLeads: process.env.NEXT_PUBLIC_INCREMENTAL_LEADS === '1',
    filePrompts: process.env.NEXT_PUBLIC_USE_FILE_PROMPTS === '1',
    leadCaptureStrategy: (process.env.NEXT_PUBLIC_LEAD_STRATEGY as any) || 'A',
    lighterConfirmations: process.env.NEXT_PUBLIC_LIGHTER_CONFIRM === '1'
  };
}

export function describeFlags(ff: FeatureFlags) {
  return `flags[incremental=${ff.incrementalLeads},filePrompts=${ff.filePrompts},strategy=${ff.leadCaptureStrategy},lighterConfirm=${ff.lighterConfirmations}]`;
}
