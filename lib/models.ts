export const SUPPORTED_MODELS = [
  'hume-evi-3',
  'gpt-4o',
  'gpt-5',
  'claude-3.5-sonnet',
  'gemini-1.5-pro'
] as const;

export type SupportedModel = typeof SUPPORTED_MODELS[number];

export function normalizeModelId(raw: string | undefined | null): { id: SupportedModel; changed: boolean } {
  if (!raw) return { id: 'hume-evi-3', changed: false };
  if (SUPPORTED_MODELS.includes(raw as SupportedModel)) return { id: raw as SupportedModel, changed: false };
  return { id: 'hume-evi-3', changed: true };
}
