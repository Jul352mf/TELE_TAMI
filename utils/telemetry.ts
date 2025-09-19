export type TelemetryEvent =
  | { type: 'session_connected'; model: string; voice: string }
  | { type: 'inactivity_warning' }
  | { type: 'inactivity_disconnected' }
  | { type: 'duration_warning' }
  | { type: 'duration_disconnected' }
  | { type: 'lead_tool_called'; leadId?: string }
  | { type: 'consent_injected' };

// Simple shim; can later route to analytics or Firestore
export function emit(event: TelemetryEvent) {
  try {
    // eslint-disable-next-line no-console
    console.debug('[telemetry]', event);
  } catch {
    /* noop */
  }
}
