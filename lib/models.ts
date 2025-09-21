// Exposed selectable models (connect-time). Include base EVI plus tool-capable supplemental LLMs.
export const SUPPORTED_MODELS = [
  'hume-evi-3',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'claude-sonnet-4-20250514',
  'gpt-4.1',
  'gemini-2.5-flash',
  'moonshotai/kimi-k2-instruct',
  'qwen-3-235b-a22b-instruct-2507',
  'claude-3-7-sonnet-latest',
  'gpt-4o',
  'gpt-oss-120b',
  'claude-3-5-haiku-latest',
  'claude-3-haiku-20240307',
  'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  'gemini-2.0-flash',
  'gpt-4-turbo',
  'gpt-4o-mini'
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
  // All listed supplemental models (plus base hume-evi-3) support tool use per latest provider list.
  return SUPPORTED_MODELS.includes(modelId as SupportedModel);
}

export function ensureToolCapable(modelId: string): { id: SupportedModel; forced: boolean } {
  if (isToolCapable(modelId)) return { id: modelId as SupportedModel, forced: false };
  // Fallback to base if somehow outside curated list
  return { id: 'hume-evi-3', forced: true };
}
