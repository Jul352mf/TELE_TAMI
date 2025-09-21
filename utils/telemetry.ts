export type TelemetryEvent =
  | { type: 'session_connected'; model: string; voice: string }
  | { type: 'inactivity_warning' }
  | { type: 'inactivity_disconnected' }
  | { type: 'duration_warning' }
  | { type: 'duration_disconnected' }
  | { type: 'lead_tool_called'; leadId?: string }
  | { type: 'consent_injected' }
  | { type: 'prompt_version'; id: string }
  | { type: 'tool_call_start'; tool: string; sessionId: string; promptVersionId?: string; persona: string; incremental: boolean }
  | { type: 'tool_call_success'; tool: string; sessionId: string; durationMs: number; promptVersionId?: string; draftFieldCount?: number; missingRequired?: number; persona: string; incremental: boolean }
  | { type: 'tool_call_error'; tool: string; sessionId: string; durationMs: number; error: string; promptVersionId?: string; draftFieldCount?: number; missingRequired?: number; persona: string; incremental: boolean }
  | { type: 'closing_triggered'; reason: string }
  | { type: 'recap_requested' }
  | { type: 'recap_provided' }
  | { type: 'pushback_used'; variantId: string }
  | { type: 'strategy_selected'; strategy: string }
  | { type: 'incremental_fragment_received'; size: number; keys: string[] }
  | { type: 'incremental_finalized'; totalKeys: number }
  | { type: 'note_created'; length: number }
  | { type: 'spec_uploaded'; filename: string; size: number };

// Simple shim; can later route to analytics or Firestore
export function emit(event: TelemetryEvent) {
  try {
    // eslint-disable-next-line no-console
    console.debug('[telemetry]', event);
  } catch {
    /* noop */
  }
}

// Convenience wrapper to measure duration of a tool call
export async function withToolTelemetry<T>(
  sessionId: string,
  tool: string,
  persona: string,
  incremental: boolean,
  promptVersionId: string | undefined,
  draftFieldCount: number | undefined,
  missingRequired: number | undefined,
  fn: () => Promise<T>
): Promise<T> {
  emit({ type: 'tool_call_start', tool, sessionId, persona, incremental, promptVersionId });
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    emit({ type: 'tool_call_success', tool, sessionId, durationMs, persona, incremental, promptVersionId, draftFieldCount, missingRequired });
    return result;
  } catch (e: any) {
    const durationMs = Math.round(performance.now() - start);
    emit({ type: 'tool_call_error', tool, sessionId, durationMs, persona, incremental, promptVersionId, draftFieldCount, missingRequired, error: e?.message || 'error' });
    throw e;
  }
}
