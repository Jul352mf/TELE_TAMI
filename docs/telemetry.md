# Telemetry Schema

Updated: 2025-09-21

## Philosophy
Lightweight, structured console emission for local analysis & future routing (e.g., Firestore, analytics pipeline). Each event is a flat object with a `type` discriminator.

## Event Catalog
| Event | Fields | When Emitted |
|-------|--------|--------------|
| session_connected | model, voice | After successful connect & initial session settings sent |
| inactivity_warning | – | (Future) Prior to idle disconnect |
| inactivity_disconnected | – | (Future) When session disconnected for idleness |
| duration_warning | – | (Future) Approaching max session length |
| duration_disconnected | – | (Future) Exceeded session length |
| lead_tool_called | leadId? | After successful lead POST (tool finalize or direct record) |
| consent_injected | – | When consent line detected in system prompt |
| prompt_version | id | Prompt version ID detected (env or hash) |
| tool_call_start | tool, sessionId, persona, incremental, promptVersionId? | Before tool handler execution |
| tool_call_success | tool, sessionId, durationMs, persona, incremental, promptVersionId?, draftFieldCount?, missingRequired? | After tool handler success |
| tool_call_error | tool, sessionId, durationMs, error, persona, incremental, promptVersionId?, draftFieldCount?, missingRequired? | On tool handler exception |
| closing_triggered | reason | Conversation state first detects closing intent |
| recap_requested | – | User clicks recap button |
| recap_provided | – | Recap synthetic message inserted |
| pushback_used | variantId | Push-back response generated & queued |
| strategy_selected | strategy | Strategy resolution on session start |
| incremental_fragment_received | size, keys[] | Fragment accepted into draft store |
| incremental_finalized | totalKeys | Draft finalized (before API submission) |
| incremental_unknown_fields_preserved | count, keys[] | Unknown keys merged into notes |
| note_created | length | Note added in Notes component |
| spec_uploaded | filename, size | Spec file chosen & (simulated) uploaded |

## Session & Correlation
Current implementation logs sessionId indirectly within some events (tool events). Future enhancement: include `sessionId` in all events consistently.

## Extending the Schema
1. Add union member to `TelemetryEvent` in `utils/telemetry.ts`.
2. Emit event where logic occurs (avoid double emission for same state).
3. Update this doc and `FEATURE_STATUS.md` inventory.
4. (Optional) Add integration test asserting emission path for critical flows.

## Data Handling Guidelines
- Avoid storing raw PII in telemetry fields; prefer hashed or redacted values if needed.
- Keep payloads small (< 2KB) for console readability and potential network forwarding.

## Planned Additions
| Candidate | Rationale |
|-----------|-----------|
| session_summary_generated | Track recap usage depth |
| draft_missing_fields_reported | Monitor incremental guidance effectiveness |
| email_dispatch_suppressed | Strategy E gating visibility |

## Routing Roadmap
Phase 1: Local console (current)  
Phase 2: Firestore collection (batched)  
Phase 3: External analytics / BI pipeline  
Phase 4: Real-time dashboard (WebSocket)  

---
Generated as part of Task 18.
