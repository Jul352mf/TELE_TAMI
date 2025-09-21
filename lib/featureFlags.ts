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
