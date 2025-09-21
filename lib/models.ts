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

// Define which of our supported models are known to support tool/function calling via Hume
// (Assumption: only the native EVI model currently drives tool calls; adjust as provider updates.)
export function isToolCapable(modelId: string): boolean {
  return modelId === 'hume-evi-3';
}

export function ensureToolCapable(modelId: string): { id: SupportedModel; forced: boolean } {
  if (isToolCapable(modelId)) return { id: modelId as SupportedModel, forced: false };
  return { id: 'hume-evi-3', forced: true };
}
